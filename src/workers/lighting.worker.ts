// Lighting Worker for heavy ray-tracing calculations
import { TileData, TileType } from '../types/tiling';
import { WallSegment } from '../types/map';

interface Point {
  x: number;
  y: number;
}

interface Segment {
  p1: Point;
  p2: Point;
}

self.onmessage = (e: MessageEvent) => {
  const { lightX, lightY, radius, tiles = [], manualWalls = [], resolution, gridSize = 100 } = e.data;
  const origin = { x: lightX, y: lightY };
  const segments: Segment[] = [];

  // Helper for unique edge keys (deduplicates shared edges between tiles)
  const getEdgeKey = (x1: number, y1: number, x2: number, y2: number) => {
    const p1 = `${x1},${y1}`;
    const p2 = `${x2},${y2}`;
    return [p1, p2].sort().join('|');
  };

  // 1. Process Wall Tiles
  const edgeMap = new Map<string, number>();
  const wallTiles = tiles.filter((t: TileData) => t.type === TileType.WALL);
  
  wallTiles.forEach((t: TileData) => {
    const x = t.x * gridSize;
    const y = t.y * gridSize;
    const s = gridSize;
    
    // Each tile has 4 potential occluding edges
    const edges = [
      getEdgeKey(x, y, x + s, y),         // Top
      getEdgeKey(x + s, y, x + s, y + s), // Right
      getEdgeKey(x + s, y + s, x, y + s), // Bottom
      getEdgeKey(x, y + s, x, y)          // Left
    ];
    
    edges.forEach(key => edgeMap.set(key, (edgeMap.get(key) || 0) + 1));
  });

  // Only keep edges that are NOT shared (outer perimeter of wall blocks)
  // This prevents internal shadows within thick walls
  edgeMap.forEach((count, key) => {
    if (count === 1) {
      const [p1, p2] = key.split('|');
      const [x1, y1] = p1.split(',').map(Number);
      const [x2, y2] = p2.split(',').map(Number);
      segments.push({ p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 } });
    }
  });

  // 2. Process Manual Walls (Vector segments)
  manualWalls.forEach((wall: WallSegment) => {
    if (!wall.visible) return;
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

  // Filter segments within range
  const activeSegments = segments.filter(s => {
    const margin = radius * 1.5;
    const minX = Math.min(s.p1.x, s.p2.x);
    const maxX = Math.max(s.p1.x, s.p2.x);
    const minY = Math.min(s.p1.y, s.p2.y);
    const maxY = Math.max(s.p1.y, s.p2.y);
    
    return maxX > (lightX - margin) && minX < (lightX + margin) &&
           maxY > (lightY - margin) && minY < (lightY + margin);
  });

  const points: Point[] = [];
  activeSegments.forEach(s => points.push(s.p1, s.p2));

  const rawAngles: number[] = [];
  points.forEach(p => {
    const angle = Math.atan2(p.y - lightY, p.x - lightX);
    const normalized = angle < 0 ? angle + 2 * Math.PI : angle;
    rawAngles.push(normalized - 0.00001, normalized, normalized + 0.00001);
  });

  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    rawAngles.push(a);
  }

  const angles = Array.from(new Set(rawAngles.map(a => parseFloat(a.toFixed(7))))).sort((a, b) => a - b);
  const visPoints: number[] = [];

  angles.forEach(angle => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const ray = { p1: origin, p2: { x: lightX + dx, y: lightY + dy } };

    let minT1 = Infinity;

    activeSegments.forEach(s => {
      const r_px = ray.p1.x, r_py = ray.p1.y;
      const r_dx = ray.p2.x - ray.p1.x, r_dy = ray.p2.y - ray.p1.y;
      const s_px = s.p1.x, s_py = s.p1.y;
      const s_dx = s.p2.x - s.p1.x, s_dy = s.p2.y - s.p1.y;

      const div = (s_dx * r_dy - s_dy * r_dx);
      if (Math.abs(div) > 0.00001) {
        const t2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / div;
        const t1 = (Math.abs(r_dx) > Math.abs(r_dy)) ? (s_px + s_dx * t2 - r_px) / r_dx : (s_py + s_dy * t2 - r_py) / r_dy;
        if (t1 >= 0.01 && t2 >= 0 && t2 <= 1) {
          if (t1 < minT1) minT1 = t1;
        }
      }
    });

    const finalDist = Math.min(minT1, radius);
    visPoints.push(lightX + dx * finalDist, lightY + dy * finalDist);
  });

  self.postMessage({ visPoints });
};
