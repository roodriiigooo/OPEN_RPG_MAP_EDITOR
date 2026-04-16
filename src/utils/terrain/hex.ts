export interface AxialCoord {
  q: number;
  r: number;
}

export interface CubeCoord {
  q: number;
  r: number;
  s: number;
}

export type HexType = 'pointy' | 'flat';

export const axialToCube = (hex: AxialCoord): CubeCoord => {
  return { q: hex.q, r: hex.r, s: -hex.q - hex.r };
};

export const cubeToAxial = (cube: CubeCoord): AxialCoord => {
  return { q: cube.q, r: cube.r };
};

export const cubeRound = (cube: CubeCoord): CubeCoord => {
  let q = Math.round(cube.q);
  let r = Math.round(cube.r);
  let s = Math.round(cube.s);

  const q_diff = Math.abs(q - cube.q);
  const r_diff = Math.abs(r - cube.r);
  const s_diff = Math.abs(s - cube.s);

  if (q_diff > r_diff && q_diff > s_diff) {
    q = -r - s;
  } else if (r_diff > s_diff) {
    r = -q - s;
  } else {
    s = -q - r;
  }

  return { q, r, s };
};

export const axialRound = (hex: AxialCoord): AxialCoord => {
  return cubeToAxial(cubeRound(axialToCube(hex)));
};

/**
 * Pixel to Axial conversion
 */
export const pixelToAxial = (x: number, y: number, size: number, type: HexType): AxialCoord => {
  if (type === 'pointy') {
    const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / size;
    const r = ((2 / 3) * y) / size;
    return axialRound({ q, r });
  } else {
    const q = ((2 / 3) * x) / size;
    const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / size;
    return axialRound({ q, r });
  }
};

/**
 * Axial to Pixel conversion (Returns center of hex)
 */
export const axialToPixel = (q: number, r: number, size: number, type: HexType) => {
  if (type === 'pointy') {
    const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = size * ((3 / 2) * r);
    return { x, y };
  } else {
    const x = size * ((3 / 2) * q);
    const y = size * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);
    return { x, y };
  }
};

/**
 * Get 6 neighbors for hexagonal tiling
 */
export const HEX_NEIGHBORS = [
  { q: 1, r: 0, bit: 1 },
  { q: 1, r: -1, bit: 2 },
  { q: 0, r: -1, bit: 4 },
  { q: -1, r: 0, bit: 8 },
  { q: -1, r: 1, bit: 16 },
  { q: 0, r: 1, bit: 32 },
];
