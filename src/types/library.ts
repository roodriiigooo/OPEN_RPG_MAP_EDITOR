export interface RemoteAsset {
  id: string;
  name: string;
  type: 'stamp' | 'terrain' | 'wall';
  category: string;
  path: string; // Relative to manifest baseUrl
  thumbnailPath?: string; // V2: Reference to original 5x3 or thumbnail image
  tiling?: {
    tileSize: number;
    quadrantSize?: number;
    importMode?: 'blob' | 'quadrants';
    bitmaskMap?: any;
  };
}

export interface RemoteManifest {
  name: string;
  author: string;
  version: string;
  license: string;
  baseUrl: string;
  assets: RemoteAsset[];
  fonts?: {
    id: string;
    name: string;
    family: string;
    path: string;
  }[];
}

export interface AssetSource {
  url: string;
  lastFetched: number;
  status: 'online' | 'offline' | 'error';
  error?: string;
}
