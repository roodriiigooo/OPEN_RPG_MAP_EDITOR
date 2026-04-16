export enum TileType {
  STAMP = 'STAMP',
  WALL = 'WALL',
  GROUND = 'GROUND',
}

export interface TileData {
  x: number;
  y: number;
  tilesetId: string;
  layerId: string; // Ties tile to a specific layer
  variantIndex: number; // For WALL: simple bitmask index
  quadrants?: number[]; // For GROUND: 4 quadrant indices (TL, TR, BL, BR)
  bitmask: number;
  type: TileType;
  managed?: boolean;
}

export interface Tileset {
  id: string;
  name: string;
  type: TileType;
  imageUrl: string;
  tileSize: number;
  bitmaskMap: Record<number, number>;
}

export interface TerrainTileset extends Tileset {
  type: TileType.GROUND;
  // Sliced into 4 quadrants per "main" tile.
  // RPG Maker style uses 2x3 or specific layout.
  // We define quadrantSize as half of tileSize.
  quadrantSize: number;
}

export type NeighborMask = number; // 0-255

export interface AutoTileRule {
  mask: NeighborMask;
  tileIndex: number;
}
