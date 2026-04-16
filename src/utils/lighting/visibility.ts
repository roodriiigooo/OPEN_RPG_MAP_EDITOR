import { TileData, TileType } from '../../types/tiling';
import { WallSegment } from '../../types/map';

export interface Point {
  x: number;
  y: number;
}

export interface Segment {
  p1: Point;
  p2: Point;
}

/**
 * Calculates a visibility polygon from a light source.
 * Integrates both tiled walls and vector wall segments.
 */
export const calculateVisibility = (
  lightX: number,
  lightY: number,
  radius: number,
  tiles: TileData[],
  manualWalls: WallSegment[],
  gridSize: number,
  resolution?: { width: number, height: number }
): number[] => {
  const origin = { x: lightX, y: lightY };
  const segments: Segment[] = [];

  // 1. Process Tiled Walls (Optimized: only outer edges)
  const wallTiles = tiles.filter(t => t.type === TileType.WALL);
  const edgeMap = new Map<string, number>();

  const getEdgeKey = (x1: number, y1: number, x2: number, y2: number) => {
    const p1 = `${Math.min(x1, x2)},${Math.min(y1, y2)}`;
    const p2 = `${Math.max(x1, x2)},${Math.max(y1, y2)}`;
    return `${p1}|${p2}`;
  };

  wallTiles.forEach(t => {
    const x = t.x * gridSize;
    const y = t.y * gridSize;
    const s = gridSize;

    const edges = [
      getEdgeKey(x, y, x + s, y),         // Top
      getEdgeKey(x + s, y, x + s, y + s), // Right
      getEdgeKey(x + s, y + s, x, y + s), // Bottom
      getEdgeKey(x, y + s, x, y)          // Left
    ];

    edges.forEach(key => edgeMap.set(key, (edgeMap.get(key) || 0) + 1));
  });

  // Add edges that only appear once (outer edges)
  edgeMap.forEach((count, key) => {
    if (count === 1) {
      const [p1, p2] = key.split('|');
      const [x1, y1] = p1.split(',').map(Number);
      const [x2, y2] = p2.split(',').map(Number);
      segments.push({ p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 } });
    }
  });

  // 2. Process Manual Walls (Vector)
  manualWalls.forEach(wall => {
    wall.points.forEach(path => {
      for (let i = 0; i < path.length - 3; i += 2) {
        segments.push({
          p1: { x: path[i], y: path[i+1] },
          p2: { x: path[i+2], y: path[i+3] }
        });
      }
    });
  });

  // 3. Add map boundary segments
  if (resolution) {
    const w = resolution.width;
    const h = resolution.height;
    segments.push({ p1: { x: 0, y: 0 }, p2: { x: w, y: 0 } });
    segments.push({ p1: { x: w, y: 0 }, p2: { x: w, y: h } });
    segments.push({ p1: { x: w, y: h }, p2: { x: 0, y: h } });
    segments.push({ p1: { x: 0, y: h }, p2: { x: 0, y: 0 } });
  }

  // Filter segments within range for performance
  const activeSegments = segments.filter(s => {
    // Check if segment's bounding box intersects light's bounding box (generous radius)
    const margin = radius * 1.5;
    const minX = Math.min(s.p1.x, s.p2.x);
    const maxX = Math.max(s.p1.x, s.p2.x);
    const minY = Math.min(s.p1.y, s.p2.y);
    const maxY = Math.max(s.p1.y, s.p2.y);
    
    return maxX > (lightX - margin) && minX < (lightX + margin) &&
           maxY > (lightY - margin) && minY < (lightY + margin);
  });

  // Get unique endpoints
  const points: Point[] = [];
  activeSegments.forEach(s => points.push(s.p1, s.p2));

  // Get unique angles to endpoints
  const rawAngles: number[] = [];
  points.forEach(p => {
    const angle = Math.atan2(p.y - lightY, p.x - lightX);
    // Normalize to 0 to 2*PI
    const normalized = angle < 0 ? angle + 2 * Math.PI : angle;
    rawAngles.push(normalized - 0.00001, normalized, normalized + 0.00001);
  });

  // Add default circular angles to ensure it forms a circle even with no walls
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    rawAngles.push(a);
  }

  // Deduplicate and sort angles
  const angles = Array.from(new Set(rawAngles.map(a => parseFloat(a.toFixed(7))))).sort((a, b) => a - b);

  const visPoints: number[] = [];

  // Ray cast for each angle
  angles.forEach(angle => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const ray = { p1: origin, p2: { x: lightX + dx, y: lightY + dy } };

    let minT1 = Infinity;

    activeSegments.forEach(s => {
      const t1 = getIntersection(ray, s);
      if (t1 !== null && t1 < minT1) {
        minT1 = t1;
      }
    });

    const finalDist = Math.min(minT1, radius);
    visPoints.push(lightX + dx * finalDist, lightY + dy * finalDist);
  });

  return visPoints;
};

const getIntersection = (ray: Segment, segment: Segment): number | null => {
  const r_px = ray.p1.x;
  const r_py = ray.p1.y;
  const r_dx = ray.p2.x - ray.p1.x;
  const r_dy = ray.p2.y - ray.p1.y;

  const s_px = segment.p1.x;
  const s_py = segment.p1.y;
  const s_dx = segment.p2.x - segment.p1.x;
  const s_dy = segment.p2.y - segment.p1.y;

  const r_mag = Math.sqrt(r_dx * r_dx + r_dy * r_dy);
  const s_mag = Math.sqrt(s_dx * s_dx + s_dy * s_dy);
  
  if (r_mag === 0 || s_mag === 0) return null;

  // Check if parallel
  if (Math.abs((r_dx / r_mag) * (s_dy / s_mag) - (r_dy / r_mag) * (s_dx / s_mag)) < 0.0001) return null;

  const div = (s_dx * r_dy - s_dy * r_dx);
  if (Math.abs(div) < 0.00001) return null;

  const T2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / div;
  const T1 = (Math.abs(r_dx) > Math.abs(r_dy)) 
    ? (s_px + s_dx * T2 - r_px) / r_dx 
    : (s_py + s_dy * T2 - r_py) / r_dy;

  if (isNaN(T1) || isNaN(T2)) return null;
  if (T1 < 0.01) return null; // Epsilon to avoid self-intersection at origin
  if (T2 < 0 || T2 > 1) return null;

  return T1;
};
