export type PaintingMode = 'paint' | 'erase' | 'mask' | 'auto-tile' | 'area';

export interface BrushSettings {
  size: number;
  opacity: number;
  hardness: number;
  textureId: string;
  mode: PaintingMode;
  tilingSetId?: string;
}

export interface TerrainTexture {
  id: string;
  name: string;
  thumbnail: string;
  url: string;
}

export interface TilingRule {
  bitmask: number; // 0-255 based on 8 neighbors
  tileIndex: number; // Index in the tileset image
  rotation?: number; // 0, 90, 180, 270
}

export interface TilingSet {
  id: string;
  name: string;
  textureId: string;
  tileSize: number;
  rules: TilingRule[];
}

// Placeholder available textures for the painting engine
export const AVAILABLE_TEXTURES: TerrainTexture[] = [];
