import { HEX_NEIGHBORS } from './hex';

// Standard weights for assembly
export const NW = 1, N = 2, NE = 4, W = 8, E = 16, SW = 32, S = 64, SE = 128;

export const NEIGHBORS = [
  { dx: -1, dy: -1, bit: NW }, { dx: 0, dy: -1, bit: N }, { dx: 1, dy: -1, bit: NE },
  { dx: -1, dy: 0, bit: W },                             { dx: 1, dy: 0, bit: E },
  { dx: -1, dy: 1, bit: SW }, { dx: 0, dy: 1, bit: S },  { dx: 1, dy: 1, bit: SE },
];

export const CARDINAL_BITS = N | S | E | W;
export const DIAGONAL_BITS = NW | NE | SW | SE;

export function getMinimalMask(mask: number, enableDiagonal: boolean = true): number {
    let m = mask;
    
    // Protect the 4 new refined diagonal join masks (51-tile system) if enabled
    if (enableDiagonal) {
        if (mask === 46 || mask === 147 || mask === 116 || mask === 201) return mask;
    }

    if (!(m & N && m & W)) m &= ~NW;
    if (!(m & N && m & E)) m &= ~NE;
    if (!(m & S && m & W)) m &= ~SW;
    if (!(m & S && m & E)) m &= ~SE;
    return m;
}

export const BLOB_MASKS = [
    0, 2, 8, 10, 11, 16, 18, 22, 24, 26, 27, 30, 31, 64, 66, 72, 74, 75, 80, 82, 86, 88, 90, 91, 94, 95, 104, 106, 107, 120, 122, 123, 126, 127, 208, 210, 214, 216, 218, 219, 222, 223, 248, 250, 251, 254, 255,
    46, 147, 116, 201
];

export const BLOB_MAP: Record<number, number> = {};
BLOB_MASKS.forEach((mask, index) => {
    BLOB_MAP[mask] = index;
});

export function calculateBitmask(x: number, y: number, tilingSetId: string, isTilePresent: (x: number, y: number, setId: string) => boolean, enableDiagonal: boolean = true): number {
  let mask = 0;
  for (const neighbor of NEIGHBORS) {
    if (isTilePresent(x + neighbor.dx, y + neighbor.dy, tilingSetId)) {
      mask |= neighbor.bit;
    }
  }
  return getMinimalMask(mask, enableDiagonal);
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

/**
 * Returns [TL, TR, BL, BR] quadrant types for rendering.
 */
export function calculateTerrainQuadrants(mask: number, enableDiagonal: boolean = true): number[] {
  // Special Cases for the 4 Refined Diagonal Joins (46, 147, 116, 201)
  if (enableDiagonal) {
    if (mask === 46) return [0, 4, 4, 3]; 
    if (mask === 147) return [4, 0, 3, 4]; 
    if (mask === 116) return [3, 4, 4, 0]; 
    if (mask === 201) return [4, 3, 0, 4];
  }

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

export function getBestTileVariant(mask: number, bitmaskMap: Record<number, number>, enableDiagonal: boolean = true): number {
  const minMask = getMinimalMask(mask, enableDiagonal);
  if (bitmaskMap[minMask] !== undefined) return bitmaskMap[minMask];
  const cardinalMask = mask & (N | E | S | W);
  if (bitmaskMap[cardinalMask] !== undefined) return bitmaskMap[cardinalMask];
  return Object.values(bitmaskMap)[0] || 0;
}

export function getTileForQ(mask: number, subPos: 'TL' | 'TR' | 'BL' | 'BR', mapping: Record<number, {sx: number, sy: number}>, enableDiagonal: boolean = true): {sx: number, sy: number, forceQ?: 'TL' | 'TR' | 'BL' | 'BR'} {
    const get = (idx: number) => mapping[idx] || { sx: 1, sy: 1 };
    const m = getMinimalMask(mask, enableDiagonal);

    // Assembly Logic for the 4 New Refined Tiles
    if (enableDiagonal) {
        if (m === 46) {
            if (subPos === 'TL') return { ...get(14), forceQ: 'TL' };
            if (subPos === 'TR') return { ...get(8), forceQ: 'BR' };
            if (subPos === 'BL') return { ...get(8), forceQ: 'BR' };
            if (subPos === 'BR') return { ...get(3), forceQ: 'TL' };
        }
        if (m === 147) {
            if (subPos === 'TL') return { ...get(8), forceQ: 'BL' };
            if (subPos === 'TR') return { ...get(14), forceQ: 'TR' };
            if (subPos === 'BL') return { ...get(3), forceQ: 'TL' };
            if (subPos === 'BR') return { ...get(8), forceQ: 'BL' };
        }
        if (m === 116) {
            if (subPos === 'TL') return { ...get(3), forceQ: 'TL' };
            if (subPos === 'TR') return { ...get(9), forceQ: 'BL' };
            if (subPos === 'BL') return { ...get(9), forceQ: 'BL' };
            if (subPos === 'BR') return { ...get(14), forceQ: 'BR' };
        }
        if (m === 201) {
            if (subPos === 'TL') return { ...get(9), forceQ: 'BR' };
            if (subPos === 'TR') return { ...get(3), forceQ: 'TL' };
            if (subPos === 'BL') return { ...get(14), forceQ: 'BL' };
            if (subPos === 'BR') return { ...get(9), forceQ: 'BR' };
        }
    }

    if (m === 0) return { ...get(13) };
    
    if (subPos === 'TL') {
        const hasN = m & N, hasW = m & W, hasNW = m & NW;
        if ((hasN && hasW && !hasNW) || (!hasN && !hasW && hasNW)) return { ...get(9), forceQ: 'TL' };
        if (hasN && !hasW) return { ...get(5) }; 
        if (!hasN && hasW) return { ...get(1) };
        if (hasN && hasW) return { ...get(6) };
        return { ...get(0) };
    }
    if (subPos === 'TR') {
        const hasN = m & N, hasE = m & E, hasNE = m & NE;
        if ((hasN && hasE && !hasNE) || (!hasN && !hasE && hasNE)) return { ...get(8), forceQ: 'TR' };
        if (hasN && !hasE) return { ...get(7) }; 
        if (!hasN && hasE) return { ...get(1) };
        if (hasN && hasE) return { ...get(6) };
        return { ...get(2) };
    }
    if (subPos === 'BL') {
        const hasS = m & S, hasW = m & W, hasSW = m & SW;
        if ((hasS && hasW && !hasSW) || (!hasS && !hasW && hasSW)) return { ...get(4), forceQ: 'BL' };
        if (hasS && !hasW) return { ...get(5) };
        if (!hasS && hasW) return { ...get(11) };
        if (hasS && hasW) return { ...get(6) };
        return { ...get(10) };
    }
    if (subPos === 'BR') {
        const hasS = m & S, hasE = m & E, hasSE = m & SE;
        if ((hasS && hasE && !hasSE) || (!hasS && !hasE && hasSE)) return { ...get(3), forceQ: 'BR' };
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
