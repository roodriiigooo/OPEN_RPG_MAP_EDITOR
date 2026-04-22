import { TileData, Tileset } from './tiling';

export interface Resolution {
  width: number;
  height: number;
}

export interface MapMetadata {
  name: string;
  resolution: Resolution;
  ratio: string; // e.g., "1:1", "16:9"
  backgroundColor?: string;
}

export interface GridConfig {
  size: number;
  type: 'square' | 'hex-pointy' | 'hex-flat';
  visible: boolean;
  color: string;
  opacity: number;
  snapToGrid: boolean;
}

export interface GlobalLighting {
  enabled: boolean;
  color: string;
  intensity: number;
  sunEnabled: boolean;
  sunDirection: number;
  sunIntensity: number;
}

export interface PointLight {
  id: string;
  layerId: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
  visible: boolean;
  locked: boolean;
  name?: string;
}

export interface PostProcessing {
  vignette: number;
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface ExportMaskLine {
  points: number[];
  size: number;
  mode: 'paint' | 'erase';
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'background' | 'terrain' | 'wall' | 'object';
  visible: boolean;
  locked: boolean;
  opacity: number;
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
    freeTransform?: boolean;
    shadow?: {
        enabled: boolean;
        opacity: number;
        blur: number;
        x: number;
        y: number;
        color?: string;
        direction?: number;
        useDynamicDirection?: boolean;
    };
  };
}

export interface Project {
  id: string;
  name: string;
  lastModified: number;
  maps: MapState[];
  activeMapId: string;
}

export interface MapState {
  id: string;
  metadata: MapMetadata;
  grid: GridConfig;
  layers: MapLayer[];
  assets: Asset[];
  tiles: TileData[];
  tilesets: Tileset[];
  lighting: {
      global: GlobalLighting;
      pointLights: PointLight[];
  };
  postProcessing: PostProcessing;
  activeLayerId: string;
  diagonalTiling?: boolean;
  exportMasks?: {
    lines: ExportMaskLine[];
    inverted: boolean;
  };
  ghostFloorId?: string;
  ghostFloorOpacity: number;
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
