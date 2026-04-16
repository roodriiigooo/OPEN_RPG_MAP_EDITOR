import { TileData, Tileset } from './tiling';

export interface Resolution {
  width: number;
  height: number;
}

export interface MapMetadata {
  name: string;
  resolution: Resolution;
  ratio: string; // e.g., "1:1", "16:9"
  ppi: number;
  backgroundColor?: string;
}

export interface Layer {
  id: string;
  name: string;
  type: 'background' | 'terrain' | 'wall' | 'stamp' | 'lighting';
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
  filters?: PostProcessing;
}

export interface PostProcessing {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

export interface Asset {
  id: string;
  name?: string;
  layerId: string;
  type: 'stamp' | 'tile' | 'custom' | 'square' | 'circle' | 'text';
  x: number;
  y: number;
  rotation: number;
  scale: number;
  scaleX?: number;
  scaleY?: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  customAssetId?: string;
  snapToGrid?: boolean;
  properties?: {
    opacity?: number;
    flipX?: boolean;
    flipY?: boolean;
    tint?: string;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontStyle?: string;
    fill?: string;
    align?: string;
    shadowEnabled?: boolean;
    shadowBlur?: number;
    shadowOpacity?: number;
    shadowColor?: string;
    shadowOffset?: { x: number, y: number };
    shadowDirection?: number;
    useDynamicShadow?: boolean;
    freeTransform?: boolean;
    shadow?: {
        enabled: boolean;
        opacity: number;
        blur: number;
        x: number;
        y: number;
    };
  };
}

export interface WallSegment {
  id: string;
  layerId: string;
  points: number[][]; // Array of paths
  type: 'manual' | 'smart';
  visible?: boolean;
}

export interface Room {
  id: string;
  name: string;
  points: number[];
  holes: number[][];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  visible?: boolean;
  properties: {
    floorColor: string;
    floorOpacity: number;
    wallThickness: number;
    wallColor: string;
    wallHeight: number;
  };
}

export interface GlobalLighting {
  enabled: boolean;
  color: string;
  intensity: number;
  blendMode: 'multiply' | 'screen' | 'overlay';
  sunEnabled: boolean;
  sunDirection: number;
  sunIntensity: number;
}

export interface AtmosphereSettings {
  enabled: boolean;
  vignette: number;
  noise: number;
  colorGrading: string;
}

export interface PointLight {
  id: string;
  name?: string;
  layerId: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string;
  zIndex: number;
  visible: boolean;
  locked: boolean;
}

export interface LightingSettings {
  global: GlobalLighting;
  atmosphere: AtmosphereSettings;
  pointLights: PointLight[];
}

export interface GridConfig {
  type: 'none' | 'square' | 'hex-pointy' | 'hex-flat';
  size: number;
  visible: boolean;
  snapToGrid: boolean;
  color: string;
  opacity: number;
}

export interface MapState {
  id: string;
  metadata: MapMetadata;
  layers: Layer[];
  assets: Asset[];
  walls: WallSegment[];
  rooms: Room[];
  activeLayerId: string | null;
  grid: GridConfig;
  lighting: LightingSettings;
  tiles: TileData[];
  tilesets: Tileset[];
  exportMasks?: {
      lines: { points: number[], size: number, mode?: 'paint' | 'erase' }[];
      inverted: boolean;
  };
}

export interface Project {
  id: string;
  name: string;
  author?: string;
  defaultGridType?: GridConfig['type'];
  maps: MapState[];
  activeMapId: string | null;
  customAssets?: CustomAsset[];
  customFonts?: CustomFont[];
}

export interface CustomFont {
  id: string;
  name: string;
  family: string;
  blob: Blob;
  fileName: string;
}

export type AssetType = 'stamp' | 'terrain' | 'wall';

export interface CustomAsset {
  id: string;
  name: string;
  category: string;
  type: AssetType;
  blob?: Blob;
  thumbnailBlob?: Blob;
  previewUrl?: string;
  thumbnailUrl?: string;
  favorite?: boolean;
  snapToGrid?: boolean;
  tilingMetadata?: {
    tileSize: number;
    quadrantSize?: number;
    importMode?: 'blob' | 'quadrants';
    bitmaskMap?: any;
  };
}

export type GridType = GridConfig['type'];
