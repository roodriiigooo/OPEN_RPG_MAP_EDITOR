import { HEX_NEIGHBORS } from './hex';

// Standard weights for assembly
export const NW = 1, N = 2, NE = 4, W = 8, E = 16, SW = 32, S = 64, SE = 128;

export const NEIGHBORS = [
  { dx: -1, dy: -1, bit: NW }, { dx: 0, dy: -1, bit: N }, { dx: 1, dy: -1, bit: NE },
  { dx: -1, dy: 0, bit: W },                             { dx: 1, dy: 0, bit: E },
  { dx: -1, dy: 1, bit: SW }, { dx: 0, dy: 1, bit: S },  { dx: 1, dy: 1, bit: SE },
];

export const DIAGONAL_ONLY_MASKS: Record<number, number> = {
    [NW]: 315,
    [NE]: 45,
    [SW]: 225,
    [SE]: 135
};

export const CARDINAL_BITS = N | S | E | W;
export const DIAGONAL_BITS = NW | NE | SW | SE;

export function getDiagonalAngles(mask: number): number[] {
    const angles: number[] = [];
    if (mask & NW) angles.push(135);
    if (mask & SE) angles.push(135);
    if (mask & NE) angles.push(45);
    if (mask & SW) angles.push(45);
    
    // Return unique angles
    return Array.from(new Set(angles));
}

export function getMinimalMask(mask: number): number {
    let m = mask;
    
    // If it's a pure diagonal connection (no cardinals), preserve the diagonal bits
    // otherwise the tiling engine treats it as an isolated tile (0)
    if ((mask & CARDINAL_BITS) === 0 && (mask & DIAGONAL_BITS) !== 0) {
        return mask;
    }

    if (!(m & N && m & W)) m &= ~NW;
    if (!(m & N && m & E)) m &= ~NE;
    if (!(m & S && m & W)) m &= ~SW;
    if (!(m & S && m & E)) m &= ~SE;
    return m;
}

export const BLOB_MASKS = [
    0, 2, 8, 10, 11, 16, 18, 22, 24, 26, 27, 30, 31, 64, 66, 72, 74, 75, 80, 82, 86, 88, 90, 91, 94, 95, 104, 106, 107, 120, 122, 123, 126, 127, 208, 210, 214, 216, 218, 219, 222, 223, 248, 250, 251, 254, 255
];

export const BLOB_MAP: Record<number, number> = {};
BLOB_MASKS.forEach((mask, index) => {
    BLOB_MAP[mask] = index;
});

export function calculateBitmask(x: number, y: number, tilingSetId: string, isTilePresent: (x: number, y: number, setId: string) => boolean): number {
  let mask = 0;
  for (const neighbor of NEIGHBORS) {
    if (isTilePresent(x + neighbor.dx, y + neighbor.dy, tilingSetId)) {
      mask |= neighbor.bit;
    }
  }
  return mask;
}

export function calculateHexBitmask(q: number, r: number, tilingSetId: string, isTilePresent: (q: number, r: number, setId: string) => boolean): number {
  let mask = 0;
  for (const neighbor of HEX_NEIGHBORS) {
    if (isTilePresent(q + neighbor.q, r + neighbor.r, tilingSetId)) {
      mask |= neighbor.bit;
    }
  }
  return mask;
}

export function calculateTerrainQuadrants(mask: number): number[] {
  const tl = getQuadrantIndex(mask & N, mask & W, mask & NW);
  const tr = getQuadrantIndex(mask & N, mask & E, mask & NE);
  const bl = getQuadrantIndex(mask & S, mask & W, mask & SW);
  const br = getQuadrantIndex(mask & S, mask & E, mask & SE);
  return [tl, tr, bl, br];
}

function getQuadrantIndex(a: number, b: number, corner: number): number {
  if (!a && !b) return 0;
  if (a && !b) return 1;
  if (!a && b) return 2;
  if (a && b && !corner) return 4;
  return 3;
}

export function getNeighborCoords(x: number, y: number) {
  return NEIGHBORS.map(n => ({ x: x + n.dx, y: y + n.dy }));
}

export function getHexNeighborCoords(q: number, r: number) {
  return HEX_NEIGHBORS.map(n => ({ q: q + n.q, r: r + n.r }));
}

export function getBestTileVariant(mask: number, bitmaskMap: Record<number, number>): number {
  if (bitmaskMap[mask] !== undefined) return bitmaskMap[mask];
  const cardinalMask = mask & (N | E | S | W);
  if (bitmaskMap[cardinalMask] !== undefined) return bitmaskMap[cardinalMask];
  return Object.values(bitmaskMap)[0] || 0;
}

export function getTileForQ(mask: number, subPos: 'TL' | 'TR' | 'BL' | 'BR', mapping: Record<number, {sx: number, sy: number}>): {sx: number, sy: number, forceQ?: 'TL' | 'TR' | 'BL' | 'BR'} {
    const get = (idx: number) => mapping[idx] || { sx: 1, sy: 1 };

    if (mask === 0) return { ...get(13) }; // Isolated
    
    // 8-neighbor logic for each quadrant
    if (subPos === 'TL') {
        const hasN = mask & N, hasW = mask & W, hasNW = mask & NW;
        // Internal Corner Case OR Pure Diagonal Connection
        if ((hasN && hasW && !hasNW) || (!hasN && !hasW && hasNW) || (hasN && !hasW && hasNW) || (!hasN && hasW && hasNW)) {
            return { ...get(9), forceQ: 'TL' }; // Use Tile 10 (index 9) - Internal SE fill
        }
        if (hasN && !hasW) return { ...get(5) };  // Vertical Edge
        if (!hasN && hasW) return { ...get(1) };  // Horizontal Edge
        if (hasN && hasW) return { ...get(6) };   // Center fill
        return { ...get(0) }; // Outer Corner
    }
    if (subPos === 'TR') {
        const hasN = mask & N, hasE = mask & E, hasNE = mask & NE;
        if ((hasN && hasE && !hasNE) || (!hasN && !hasE && hasNE) || (hasN && !hasE && hasNE) || (!hasN && hasE && hasNE)) {
            return { ...get(8), forceQ: 'TR' }; // Use Tile 9 (index 8) - Internal SW fill
        }
        if (hasN && !hasE) return { ...get(7) }; 
        if (!hasN && hasE) return { ...get(1) };
        if (hasN && hasE) return { ...get(6) };
        return { ...get(2) };
    }
    if (subPos === 'BL') {
        const hasS = mask & S, hasW = mask & W, hasSW = mask & SW;
        if ((hasS && hasW && !hasSW) || (!hasS && !hasW && hasSW) || (hasS && !hasW && hasSW) || (!hasS && hasW && hasSW)) {
            return { ...get(4), forceQ: 'BL' }; // Use Tile 5 (index 4) - Internal NE fill
        }
        if (hasS && !hasW) return { ...get(5) };
        if (!hasS && hasW) return { ...get(11) };
        if (hasS && hasW) return { ...get(6) };
        return { ...get(10) };
    }
    if (subPos === 'BR') {
        const hasS = mask & S, hasE = mask & E, hasSE = mask & SE;
        if ((hasS && hasE && !hasSE) || (!hasS && !hasE && hasSE) || (hasS && !hasE && hasSE) || (!hasS && hasE && hasSE)) {
            return { ...get(3), forceQ: 'BR' }; // Use Tile 4 (index 3) - Internal NW fill
        }
        if (hasS && !hasE) return { ...get(7) };
        if (!hasS && hasE) return { ...get(11) };
        if (hasS && hasE) return { ...get(6) };
        return { ...get(12) };
    }
    return { ...get(6) };
}

export function getLinePoints(x0: number, y0: number, x1: number, y1: number): { x: number, y: number }[] {
  const points: { x: number, y: number }[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (true) {
    points.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  return points;
}
