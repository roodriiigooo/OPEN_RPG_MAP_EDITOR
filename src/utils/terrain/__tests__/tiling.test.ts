// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { calculateBitmask } from '../tiling';

describe('calculateBitmask', () => {
  it('should return 0 for an isolated tile', () => {
    const isTilePresent = () => false;
    expect(calculateBitmask(0, 0, 'set1', isTilePresent)).toBe(0);
  });

  it('should calculate North neighbor correctly (bit 2)', () => {
    const isTilePresent = (x: number, y: number) => x === 0 && y === -1;
    expect(calculateBitmask(0, 0, 'set1', isTilePresent)).toBe(2);
  });

  it('should calculate all cardinal neighbors correctly', () => {
    const isTilePresent = (x: number, y: number) => {
      // N (2), E (16), S (64), W (8) = 90
      return (x === 0 && y === -1) || (x === 1 && y === 0) || (x === 0 && y === 1) || (x === -1 && y === 0);
    };
    expect(calculateBitmask(0, 0, 'set1', isTilePresent)).toBe(2 + 16 + 64 + 8);
  });

  it('should calculate all 8 neighbors correctly', () => {
    const isTilePresent = () => true;
    expect(calculateBitmask(0, 0, 'set1', isTilePresent)).toBe(255);
  });

  it('should respect tilingSetId', () => {
    const isTilePresent = (x: number, y: number, setId: string) => setId === 'set1';
    expect(calculateBitmask(0, 0, 'set1', isTilePresent)).toBe(255);
    
    const isTilePresentMixed = (x: number, y: number, setId: string) => setId === 'set2';
    expect(calculateBitmask(0, 0, 'set1', isTilePresentMixed)).toBe(0);
  });
});

import { getBestTileVariant, calculateTerrainQuadrants } from '../tiling';

describe('getBestTileVariant', () => {
  const mockBitmaskMap: Record<number, number> = {
    0: 0,   // Isolated
    2: 1,   // North
    16: 2,  // East
    18: 3,  // North + East (Cardinal only)
    22: 4,  // North + East + North-East (Exact match: 2+16+4)
  };

  it('should return exact match if it exists', () => {
    expect(getBestTileVariant(22, mockBitmaskMap)).toBe(4);
  });

  it('should fallback to cardinal-only match if exact match is missing', () => {
    // 18 is North + East. 22 is North + East + North-East.
    // If we have North + East + South-East (mask 18 + 128 = 146) and no exact match:
    expect(getBestTileVariant(146, mockBitmaskMap)).toBe(3); // Should match 18
  });

  it('should return the first variant if no match is found', () => {
    expect(getBestTileVariant(255, mockBitmaskMap)).toBe(0);
  });
});

describe('calculateTerrainQuadrants', () => {
  it('should return all 0s for isolated tile (all inner corners)', () => {
    expect(calculateTerrainQuadrants(0)).toEqual([0, 0, 0, 0]);
  });

  it('should return all 3s for completely surrounded tile (all centers)', () => {
    expect(calculateTerrainQuadrants(255)).toEqual([3, 3, 3, 3]);
  });

  it('should handle North neighbor correctly (top quadrants become edges)', () => {
    // North = 2.
    // TL: N=2, W=0, NW=0 -> index 1
    // TR: N=2, E=0, NE=0 -> index 1
    // BL: S=0, W=0, SW=0 -> index 0
    // BR: S=0, E=0, SE=0 -> index 0
    expect(calculateTerrainQuadrants(2)).toEqual([1, 1, 0, 0]);
  });

  it('should handle West neighbor correctly (left quadrants become edges)', () => {
    // West = 8.
    // TL: N=0, W=8, NW=0 -> index 2
    // TR: N=0, E=0, NE=0 -> index 0
    // BL: S=0, W=8, SW=0 -> index 2
    // BR: S=0, E=0, SE=0 -> index 0
    expect(calculateTerrainQuadrants(8)).toEqual([2, 0, 2, 0]);
  });

  it('should handle corner gaps correctly (outer corners)', () => {
    // North + West = 2 + 8 = 10.
    // TL: N=2, W=8, NW=0 -> index 4
    expect(calculateTerrainQuadrants(10)[0]).toBe(4);

    // North + West + North-West = 2 + 8 + 1 = 11.
    // TL: N=2, W=8, NW=1 -> index 3
    expect(calculateTerrainQuadrants(11)[0]).toBe(3);
  });
});

import { getLinePoints } from '../tiling';

describe('getLinePoints', () => {
  it('should return a single point for start === end', () => {
    expect(getLinePoints(0, 0, 0, 0)).toEqual([{ x: 0, y: 0 }]);
  });

  it('should return points for a horizontal line', () => {
    const points = getLinePoints(0, 0, 3, 0);
    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
  });

  it('should return points for a vertical line', () => {
    const points = getLinePoints(0, 0, 0, 3);
    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
    ]);
  });

  it('should return points for a diagonal line', () => {
    const points = getLinePoints(0, 0, 2, 2);
    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]);
  });

  it('should handle steep diagonal lines', () => {
    const points = getLinePoints(0, 0, 1, 3);
    expect(points).toContainEqual({ x: 0, y: 0 });
    expect(points).toContainEqual({ x: 1, y: 3 });
    expect(points.length).toBeGreaterThan(2);
  });
});
