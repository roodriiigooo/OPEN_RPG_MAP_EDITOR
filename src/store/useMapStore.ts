import { create } from 'zustand';
import { temporal } from 'zundo';
import { subscribeWithSelector } from 'zustand/middleware';
import { MapState, MapMetadata, Asset, GridConfig, GlobalLighting, PointLight, PostProcessing } from '../types/map';
import { useProjectStore } from './useProjectStore';
import { TileData, TileType, TerrainTileset, Tileset } from '../types/tiling';
import { 
  calculateBitmask, 
  getNeighborCoords, 
  calculateTerrainQuadrants, 
  calculateHexBitmask, 
  getHexNeighborCoords,
  getBestTileVariant,
  getMinimalMask,
  BLOB_MAP
} from '../utils/terrain/tiling';

interface ExtendedMapState extends MapState {
  id: string;
  selectedAssetIds: string[];
  ghostFloorId: string | null;
  ghostFloorOpacity: number;
  lastTileUpdate: number;
}

interface MapStoreActions {
  updateMetadata: (metadata: MapMetadata) => void;
  updateGrid: (grid: Partial<GridConfig>) => void;
  addLayer: (layer: any) => void;
  updateLayer: (layerId: string, updates: Partial<any>) => void;
  removeLayer: (layerId: string) => void;
  setActiveLayer: (layerId: string | null) => void;
  reorderLayers: (layerIds: string[]) => void;
  reorderLayerObjects: (layerId: string, objectIds: string[]) => void;
  addAsset: (asset: Omit<Asset, 'zIndex'>) => void;
  updateAsset: (assetId: string, updates: Partial<Asset>) => void;
  updateAssets: (assetIds: string[], updates: Partial<Asset>) => void;
  moveObjects: (ids: string[], dx: number, dy: number) => void;
  removeAsset: (assetId: string) => void;
  setSelectedAsset: (assetId: string | null) => void;
  setSelectedAssetIds: (assetIds: string[]) => void;
  duplicateObject: (id: string) => void;
  updateGlobalLighting: (lighting: Partial<GlobalLighting>) => void;
  addPointLight: (light: Omit<PointLight, 'zIndex'>) => void;
  updatePointLight: (lightId: string, updates: Partial<PointLight>) => void;
  removePointLight: (lightId: string) => void;
  removeObjects: (ids: string[]) => void;
  updateLayerFilters: (layerId: string, filters: Partial<PostProcessing>) => void;
  addTile: (tile: Omit<TileData, 'bitmask' | 'variantIndex' | 'layerId'>) => void;
  addTiles: (tiles: Omit<TileData, 'bitmask' | 'variantIndex' | 'layerId'>[]) => void;
  bulkUpdateTiles: (toAdd: any[], toRemove: {x: number, y: number, type: TileType, layerId?: string}[]) => void;
  removeTile: (x: number, y: number, type: TileType) => void;
  removeTiles: (coords: { x: number; y: number }[], type: TileType) => void;
  updateAutoTilingAround: (x: number, y: number, type: TileType) => void;
  addTileset: (tileset: Tileset | TerrainTileset) => void;
  removeTileset: (id: string) => void;
  classifyAsset: (assetId: string, type: TileType) => void;
  cleanupAssetUsage: (assetId: string) => void;
  cleanupFontUsage: (fontFamily: string) => void;
  setGhostFloor: (id: string | null, opacity?: number) => void;
  resetState: (newState?: ExtendedMapState) => void;
}

const getSafeUUID = () => {
    return typeof crypto?.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const initialState: ExtendedMapState = {
  id: '',
  metadata: { name: '', resolution: { width: 3500, height: 2400 }, ratio: '3.5:2.4' },
  layers: [],
  assets: [],
  activeLayerId: null,
  selectedAssetIds: [],
  ghostFloorId: null,
  ghostFloorOpacity: 0.3,
  grid: { type: 'square', size: 100, visible: true, snapToGrid: true, color: '#666666', opacity: 1 },
  lastTileUpdate: Date.now(),
  lighting: { 
    global: { 
        enabled: false, 
        color: '#ffffff', 
        intensity: 1, 
        sunEnabled: false, 
        sunDirection: 45, 
        sunIntensity: 0.5 
    }, 
    pointLights: [], 
  },
  tiles: [],
  tilesets: [],
};

export const useMapStore = create<ExtendedMapState & MapStoreActions>()(
  subscribeWithSelector(
    temporal(
      (set, get) => ({
        ...initialState,

        updateMetadata: (metadata) => set({ metadata }),
        updateGrid: (grid) => set((state) => ({ grid: { ...state.grid, ...grid } })),
        
        addLayer: (layer) => set((state) => {
            if ((layer.type === 'wall' || layer.type === 'terrain') && state.layers.some(l => l.type === layer.type)) {
                return state;
            }
            return { layers: [...state.layers, layer], activeLayerId: layer.id };
        }),

        updateLayer: (layerId, updates) => set((state) => ({ layers: state.layers.map((l) => l.id === layerId ? { ...l, ...updates } : l) })),
        
        removeLayer: (layerId) => set((state) => {
            const layer = state.layers.find(l => l.id === layerId);
            if (layer?.type === 'background' || layer?.type === 'wall' || layer?.type === 'terrain') return state;
            
            return { 
                layers: state.layers.filter((l) => l.id !== layerId), 
                activeLayerId: state.activeLayerId === layerId ? null : state.activeLayerId 
            };
        }),

        setActiveLayer: (layerId) => set({ activeLayerId: layerId }),
        reorderLayers: (layerIds) => set((state) => ({ layers: layerIds.map((id) => state.layers.find((l) => l.id === id)).filter((l): l is any => !!l) })),
        
        reorderLayerObjects: (layerId, objectIds) => set((state) => {
            const nextAssets = [...state.assets];
            const nextLights = [...state.lighting.pointLights];

            // Assign new zIndex based on the array order provided [Bottom -> Top]
            objectIds.forEach((id, index) => {
                const assetIdx = nextAssets.findIndex(a => a.id === id);
                if (assetIdx !== -1) {
                    nextAssets[assetIdx] = { ...nextAssets[assetIdx], zIndex: index };
                } else {
                    const lightIdx = nextLights.findIndex(l => l.id === id);
                    if (lightIdx !== -1) {
                        nextLights[lightIdx] = { ...nextLights[lightIdx], zIndex: index };
                    }
                }
            });

            return {
                assets: nextAssets,
                lighting: {
                    ...state.lighting,
                    pointLights: nextLights
                }
            };
        }),

        addAsset: (asset) => set((state) => {
            const zIndex = state.assets.length + state.lighting.pointLights.length;
            return { assets: [...state.assets, { ...asset, zIndex }], selectedAssetIds: [asset.id] };
        }),
        updateAsset: (assetId, updates) => set((state) => ({ assets: state.assets.map((a) => a.id === assetId ? { ...a, ...updates } : a) })),
        updateAssets: (assetIds, updates) => set((state) => ({
            assets: state.assets.map(a => assetIds.includes(a.id) ? { ...a, ...updates } : a)
        })),
        moveObjects: (ids, dx, dy) => set((state) => ({
            assets: state.assets.map(a => ids.includes(a.id) ? { ...a, x: a.x + dx, y: a.y + dy } : a),
            lighting: {
                ...state.lighting,
                pointLights: state.lighting.pointLights.map(l => ids.includes(l.id) ? { ...l, x: l.x + dx, y: l.y + dy } : l)
            }
        })),
        removeAsset: (assetId) => set((state) => ({ assets: state.assets.filter((a) => a.id !== assetId), selectedAssetIds: state.selectedAssetIds.filter(id => id !== assetId) })),
        setSelectedAsset: (assetId) => set({ selectedAssetIds: assetId ? [assetId] : [] }),
        setSelectedAssetIds: (assetIds) => set({ selectedAssetIds: assetIds }),
        
        duplicateObject: (id) => set((state) => {
            const asset = state.assets.find(a => a.id === id);
            const light = state.lighting.pointLights.find(l => l.id === id);
            const original = asset || light;
            if (!original) return state;

            const newId = getSafeUUID();
            const zIndex = state.assets.length + state.lighting.pointLights.length;

            if (asset) return { assets: [...state.assets, { ...asset, id: newId, x: asset.x + 20, y: asset.y + 20, zIndex }], selectedAssetIds: [newId] };
            return { lighting: { ...state.lighting, pointLights: [...state.lighting.pointLights, { ...light!, id: newId, x: light!.x + 20, y: light!.y + 20, zIndex }] }, selectedAssetIds: [newId] };
        }),

        updateGlobalLighting: (lighting) => set((state) => ({ lighting: { ...state.lighting, global: { ...state.lighting.global, ...lighting } } })),
        addPointLight: (light) => set((state) => {
            const zIndex = state.assets.length + state.lighting.pointLights.length;
            return { 
                lighting: { 
                    ...state.lighting, 
                    pointLights: [...state.lighting.pointLights, { ...light, zIndex }] 
                },
                selectedAssetIds: [light.id]
            };
        }),
        updatePointLight: (lightId, updates) => set((state) => ({ lighting: { ...state.lighting, pointLights: state.lighting.pointLights.map((l) => l.id === lightId ? { ...l, ...updates } : l) } })),
        removePointLight: (lightId) => set((state) => ({ lighting: { ...state.lighting, pointLights: state.lighting.pointLights.filter((l) => l.id !== lightId), selectedAssetIds: state.selectedAssetIds.filter(id => id !== lightId) } })),
        
        removeObjects: (ids) => set((state) => ({
            assets: state.assets.filter(a => !ids.includes(a.id)),
            lighting: {
                ...state.lighting,
                pointLights: state.lighting.pointLights.filter(l => !ids.includes(l.id))
            },
            selectedAssetIds: []
        })),

        updateLayerFilters: (layerId, filters) => set((state) => ({
            layers: state.layers.map((l) => 
                l.id === layerId 
                    ? { 
                        ...l, 
                        filters: { 
                            brightness: filters.brightness ?? l.filters?.brightness ?? 100,
                            contrast: filters.contrast ?? l.filters?.contrast ?? 100,
                            saturation: filters.saturation ?? l.filters?.saturation ?? 100,
                            blur: filters.blur ?? l.filters?.blur ?? 0
                        } 
                    } 
                    : l
            )
        })),

        addTile: (tileData) => {
          set((state) => {
            const wallLayer = state.layers.find(l => l.type === 'wall');
            const terrainLayer = state.layers.find(l => l.type === 'terrain');
            
            let targetLayerId = state.activeLayerId;
            if (tileData.type === TileType.WALL) targetLayerId = wallLayer?.id || targetLayerId;
            if (tileData.type === TileType.GROUND) targetLayerId = terrainLayer?.id || targetLayerId;

            const layerId = targetLayerId || 'terrain-layer';
            
            const filteredTiles = state.tiles.filter(t => !(t.x === tileData.x && t.y === tileData.y && t.type === tileData.type && t.layerId === layerId));
            const newTile = { ...tileData, layerId, bitmask: 0, variantIndex: 0 } as TileData;
            let nextTiles = [...filteredTiles, newTile];
            const isHex = state.grid.type.startsWith('hex-');
            const neighbors = isHex ? getHexNeighborCoords(newTile.x, newTile.y) : getNeighborCoords(newTile.x, newTile.y);
            const affectedCoords = [ {x: newTile.x, y: newTile.y}, ...neighbors ];

            affectedCoords.forEach(coord => {
              const cx = isHex ? (coord as any).q : (coord as any).x;
              const cy = isHex ? (coord as any).r : (coord as any).y;
              
              nextTiles.forEach((tile, idx) => {
                  if (tile.x === cx && tile.y === cy && tile.layerId === layerId && tile.tilesetId === newTile.tilesetId) {
                      const rawMask = isHex 
                          ? calculateHexBitmask(cx, cy, tile.tilesetId, (nq, nr, setId) => nextTiles.some(t => t.x === nq && t.y === nr && t.tilesetId === setId && t.layerId === layerId))
                          : calculateBitmask(cx, cy, tile.tilesetId, (nx, ny, setId) => nextTiles.some(t => t.x === nx && t.y === ny && t.tilesetId === setId && t.layerId === layerId));
                      
                      const mask = isHex ? rawMask : getMinimalMask(rawMask);
                      const tileset = state.tilesets.find(ts => ts.id === tile.tilesetId);
                      const isBlobSet = (tileset as any)?.bitmaskMap?.isBlobSet;

                      if (isBlobSet) {
                          nextTiles[idx] = { ...tile, bitmask: mask, variantIndex: BLOB_MAP[mask] ?? 0, quadrants: undefined };
                      } else if (!isHex) {
                          nextTiles[idx] = { ...tile, bitmask: mask, quadrants: calculateTerrainQuadrants(mask), variantIndex: 0 };
                      } else {
                          nextTiles[idx] = { ...tile, bitmask: mask, variantIndex: tileset ? getBestTileVariant(mask, tileset.bitmaskMap) : 0 };
                      }
                  }
              });
            });
            return { tiles: nextTiles, lastTileUpdate: Date.now() };
          });
        },

        addTiles: (tilesData) => {
          if (tilesData.length === 0) return;
          const state = get();
          const wallLayer = state.layers.find(l => l.type === 'wall');
          const terrainLayer = state.layers.find(l => l.type === 'terrain');
          const stampLayer = state.layers.find(l => l.type === 'stamp');
          
          const defaultActiveId = state.activeLayerId || stampLayer?.id || 'stamp-layer';
          const isHex = state.grid.type.startsWith('hex-');
          const affectedSet = new Set<string>();

          // Optimization: Pre-calculate target layers and keys to remove
          const toRemoveKeys = new Set<string>();
          const newTilesEntries: TileData[] = [];

          tilesData.forEach(tile => {
            let layerId = (tile as any).layerId;
            if (!layerId) {
                layerId = defaultActiveId;
                if (tile.type === TileType.WALL) layerId = wallLayer?.id || layerId;
                if (tile.type === TileType.GROUND) layerId = terrainLayer?.id || layerId;
            }
            
            const key = `${tile.x},${tile.y},${tile.type},${layerId}`;
            toRemoveKeys.add(key);
            newTilesEntries.push({ ...tile, layerId, bitmask: 0, variantIndex: 0 } as TileData);
            
            affectedSet.add(`${tile.x},${tile.y}`);
            const neighbors = isHex ? getHexNeighborCoords(tile.x, tile.y) : getNeighborCoords(tile.x, tile.y);
            neighbors.forEach(n => affectedSet.add(`${isHex ? (n as any).q : (n as any).x},${isHex ? (n as any).r : (n as any).y}`));
          });

          // Single pass filter is much faster than filter inside forEach
          const remainingTiles = state.tiles.filter(t => !toRemoveKeys.has(`${t.x},${t.y},${t.type},${t.layerId}`));
          const nextTiles = [...remainingTiles, ...newTilesEntries];

          const worker = new Worker(new URL('../workers/tiling.worker.ts', import.meta.url), { type: 'module' });
          worker.onmessage = (e) => {
            const { updatedTiles } = e.data;
            set((state) => {
              const finalTiles = [...nextTiles];
              const updatedTilesArray = updatedTiles as TileData[];
              
              // Map for faster lookups during merge
              const updateMap = new Map(updatedTilesArray.map(ut => [`${ut.x},${ut.y},${ut.type},${ut.layerId}`, ut]));
              
              const mergedTiles = finalTiles.map(t => {
                  const key = `${t.x},${t.y},${t.type},${t.layerId}`;
                  return updateMap.get(key) || t;
              });

              return { tiles: mergedTiles, lastTileUpdate: Date.now() };
            });
            worker.terminate();
          };
          worker.postMessage({ tiles: nextTiles, affectedKeys: Array.from(affectedSet), tilesets: state.tilesets, isHex });
        },

        bulkUpdateTiles: (toAdd, toRemove) => {
          if (toAdd.length === 0 && toRemove.length === 0) return;
          const state = get();
          const wallLayer = state.layers.find(l => l.type === 'wall');
          const terrainLayer = state.layers.find(l => l.type === 'terrain');
          const stampLayer = state.layers.find(l => l.type === 'stamp');
          const defaultActiveId = state.activeLayerId || stampLayer?.id || 'stamp-layer';
          
          const isHex = state.grid.type.startsWith('hex-');
          const affectedSet = new Set<string>();
          const toRemoveKeys = new Set<string>();

          toRemove.forEach(rem => {
              let layerId = rem.layerId;
              if (!layerId) {
                  if (rem.type === TileType.WALL) layerId = wallLayer?.id;
                  else if (rem.type === TileType.GROUND) layerId = terrainLayer?.id;
                  else layerId = defaultActiveId;
              }
              
              const key = `${rem.x},${rem.y},${rem.type},${layerId}`;
              toRemoveKeys.add(key);
              affectedSet.add(`${rem.x},${rem.y}`);
              const neighbors = isHex ? getHexNeighborCoords(rem.x, rem.y) : getNeighborCoords(rem.x, rem.y);
              neighbors.forEach(n => affectedSet.add(`${isHex ? (n as any).q : (n as any).x},${isHex ? (n as any).r : (n as any).y}`));
          });

          const newTilesEntries: TileData[] = [];
          toAdd.forEach(tile => {
            let layerId = (tile as any).layerId;
            if (!layerId) {
                layerId = defaultActiveId;
                if (tile.type === TileType.WALL) layerId = wallLayer?.id || layerId;
                if (tile.type === TileType.GROUND) layerId = terrainLayer?.id || layerId;
            }
            
            const key = `${tile.x},${tile.y},${tile.type},${layerId}`;
            toRemoveKeys.add(key); // Remove any existing at this spot
            newTilesEntries.push({ ...tile, layerId, bitmask: 0, variantIndex: 0 } as TileData);
            
            affectedSet.add(`${tile.x},${tile.y}`);
            const neighbors = isHex ? getHexNeighborCoords(tile.x, tile.y) : getNeighborCoords(tile.x, tile.y);
            neighbors.forEach(n => affectedSet.add(`${isHex ? (n as any).q : (n as any).x},${isHex ? (n as any).r : (n as any).y}`));
          });

          const nextTiles = [...state.tiles.filter(t => !toRemoveKeys.has(`${t.x},${t.y},${t.type},${t.layerId}`)), ...newTilesEntries];

          const worker = new Worker(new URL('../workers/tiling.worker.ts', import.meta.url), { type: 'module' });
          worker.onmessage = (e) => {
            const { updatedTiles } = e.data;
            set((state) => {
              const finalTiles = [...nextTiles];
              const updateMap = new Map((updatedTiles as TileData[]).map(ut => [`${ut.x},${ut.y},${ut.type},${ut.layerId}`, ut]));
              const mergedTiles = finalTiles.map(t => updateMap.get(`${t.x},${t.y},${t.type},${t.layerId}`) || t);
              return { tiles: mergedTiles, lastTileUpdate: Date.now() };
            });
            worker.terminate();
          };
          worker.postMessage({ tiles: nextTiles, affectedKeys: Array.from(affectedSet), tilesets: state.tilesets, isHex });
        },

        removeTile: (x, y, type) => {
          set((state) => {
            const wallLayer = state.layers.find(l => l.type === 'wall');
            const terrainLayer = state.layers.find(l => l.type === 'terrain');
            
            let layerId = state.activeLayerId;
            if (type === TileType.WALL) layerId = wallLayer?.id || layerId;
            if (type === TileType.GROUND) layerId = terrainLayer?.id || layerId;

            const removedTile = state.tiles.find(t => t.x === x && t.y === y && t.type === type && t.layerId === layerId);
            if (!removedTile) return state;

            let nextTiles = state.tiles.filter(t => !(t.x === x && t.y === y && t.type === type && t.layerId === layerId));
            const isHex = state.grid.type.startsWith('hex-');
            const neighbors = isHex ? getHexNeighborCoords(x, y) : getNeighborCoords(x, y);
            const affectedCoords = [ {x, y}, ...neighbors ];

            affectedCoords.forEach(coord => {
              const cx = isHex ? (coord as any).q : (coord as any).x;
              const cy = isHex ? (coord as any).r : (coord as any).y;
              nextTiles.forEach((tile, idx) => {
                  if (tile.x === cx && tile.y === cy && tile.layerId === layerId && tile.tilesetId === removedTile.tilesetId) {
                      const rawMask = isHex 
                          ? calculateHexBitmask(cx, cy, tile.tilesetId, (nq, nr, setId) => nextTiles.some(t => t.x === nq && t.y === nr && t.tilesetId === setId && t.layerId === layerId))
                          : calculateBitmask(cx, cy, tile.tilesetId, (nx, ny, setId) => nextTiles.some(t => t.x === nx && t.y === ny && t.tilesetId === setId && t.layerId === layerId));
                      
                      const mask = isHex ? rawMask : getMinimalMask(rawMask);
                      const tileset = state.tilesets.find(ts => ts.id === tile.tilesetId);
                      const isBlobSet = (tileset as any)?.bitmaskMap?.isBlobSet;

                      if (isBlobSet) {
                          nextTiles[idx] = { ...tile, bitmask: mask, variantIndex: BLOB_MAP[mask] ?? 0, quadrants: undefined };
                      } else if (!isHex) {
                          nextTiles[idx] = { ...tile, bitmask: mask, quadrants: calculateTerrainQuadrants(mask), variantIndex: 0 };
                      } else {
                          nextTiles[idx] = { ...tile, bitmask: mask, variantIndex: tileset ? getBestTileVariant(mask, tileset.bitmaskMap) : 0 };
                      }
                  }
              });
            });
            return { tiles: nextTiles, lastTileUpdate: Date.now() };
          });
        },

        removeTiles: (coords, type) => {
          if (coords.length === 0) return;
          const state = get();
          const wallLayer = state.layers.find(l => l.type === 'wall');
          const terrainLayer = state.layers.find(l => l.type === 'terrain');
          const activeLayerId = state.activeLayerId || 'stamp-layer';
          
          const isHex = state.grid.type.startsWith('hex-');
          let nextTiles = [...state.tiles];
          const affectedSet = new Set<string>();

          coords.forEach(coord => {
            let layerId = activeLayerId;
            if (type === TileType.WALL) layerId = wallLayer?.id || layerId;
            if (type === TileType.GROUND) layerId = terrainLayer?.id || layerId;
            
            nextTiles = nextTiles.filter(t => !(t.x === coord.x && t.y === coord.y && t.type === type && t.layerId === layerId));
            const neighbors = isHex ? getHexNeighborCoords(coord.x, coord.y) : getNeighborCoords(coord.x, coord.y);
            neighbors.forEach(n => affectedSet.add(`${isHex ? (n as any).q : (n as any).x},${isHex ? (n as any).r : (n as any).y}`));
          });

          const worker = new Worker(new URL('../workers/tiling.worker.ts', import.meta.url), { type: 'module' });
          worker.onmessage = (e) => {
            const { updatedTiles } = e.data;
            set((state) => {
              let finalTiles = [...nextTiles];
              (updatedTiles as TileData[]).forEach(ut => {
                  const idx = finalTiles.findIndex(t => t.x === ut.x && t.y === ut.y && t.type === ut.type && t.layerId === ut.layerId);
                  if (idx !== -1) finalTiles[idx] = ut;
              });
              return { tiles: finalTiles, lastTileUpdate: Date.now() };
            });
            worker.terminate();
          };
          worker.postMessage({ tiles: nextTiles, affectedKeys: Array.from(affectedSet), tilesets: state.tilesets, isHex });
        },

        updateAutoTilingAround: (x, y, type) => {
          set((state) => {
            const wallLayer = state.layers.find(l => l.type === 'wall');
            const terrainLayer = state.layers.find(l => l.type === 'terrain');
            
            let layerId = state.activeLayerId;
            if (type === TileType.WALL) layerId = wallLayer?.id || layerId;
            if (type === TileType.GROUND) layerId = terrainLayer?.id || layerId;

            const isHex = state.grid.type.startsWith('hex-');
            const affectedCoords = isHex ? [{ q: x, r: y }, ...getHexNeighborCoords(x, y)] : [{ x, y }, ...getNeighborCoords(x, y)];
            const newTiles = [...state.tiles];
            
            const baseTile = newTiles.find(t => t.x === x && t.y === y && t.type === type && t.layerId === layerId);
            if (!baseTile) return state;

            affectedCoords.forEach(coord => {
              const cx = isHex ? (coord as any).q : (coord as any).x;
              const cy = isHex ? (coord as any).r : (coord as any).y;
              newTiles.forEach((tile, idx) => {
                  if (tile.x === cx && tile.y === cy && tile.type === type && tile.layerId === layerId && tile.tilesetId === baseTile.tilesetId) {
                      const rawMask = isHex 
                          ? calculateHexBitmask(cx, cy, tile.tilesetId, (nq, nr, setId) => newTiles.some(t => t.x === nq && t.y === nr && t.tilesetId === setId && t.layerId === layerId))
                          : calculateBitmask(cx, cy, tile.tilesetId, (nx, ny, setId) => newTiles.some(t => t.x === nx && t.y === ny && t.tilesetId === setId && t.layerId === layerId));
                      
                      const mask = isHex ? rawMask : getMinimalMask(rawMask);
                      const tileset = state.tilesets.find(ts => ts.id === tile.tilesetId);
                      const isBlobSet = (tileset as any)?.bitmaskMap?.isBlobSet;

                      if (isBlobSet) {
                          newTiles[idx] = { ...tile, bitmask: mask, variantIndex: BLOB_MAP[mask] ?? 0, quadrants: undefined };
                      } else if (!isHex) {
                          nextTiles[idx] = { ...tile, bitmask: mask, quadrants: calculateTerrainQuadrants(mask), variantIndex: 0 };
                      } else {
                          nextTiles[idx] = { ...tile, bitmask: mask, variantIndex: tileset ? getBestTileVariant(mask, tileset.bitmaskMap) : 0 };
                      }
                  }
              });
            });
            return { tiles: newTiles, lastTileUpdate: Date.now() };
          });
        },

        addTileset: (tileset) => set((state) => ({ tilesets: [...state.tilesets, tileset] })),
        removeTileset: (id) => set((state) => ({ tilesets: state.tilesets.filter(ts => ts.id !== id) })),
        classifyAsset: (assetId, type) => set((state) => ({ assets: state.assets.map(a => a.id === assetId ? { ...a, type: type === TileType.STAMP ? 'stamp' : 'tile' } : a) })),
        cleanupAssetUsage: (assetId) => set((state) => ({
            assets: state.assets.filter(a => a.customAssetId !== assetId),
            tiles: state.tiles.filter(t => t.tilesetId !== assetId),
            tilesets: state.tilesets.filter(ts => ts.id !== assetId),
            selectedAssetIds: state.selectedAssetIds.filter(id => {
                const asset = state.assets.find(a => a.id === id);
                return asset?.customAssetId !== assetId;
            })
        })),
        cleanupFontUsage: (fontFamily) => set((state) => ({
            assets: state.assets.map(a => {
                if (a.type === 'text' && a.properties?.fontFamily === fontFamily) {
                    return { ...a, properties: { ...a.properties, fontFamily: 'Arial' } };
                }
                return a;
            })
        })),
        setGhostFloor: (id, opacity) => set((state) => ({ ghostFloorId: id, ghostFloorOpacity: opacity ?? state.ghostFloorOpacity })),
        resetState: (newState) => set((state) => {
            if (newState) return newState;
            
            const defaultGridType = useProjectStore.getState().defaultGridType || 'square';
            return {
                ...initialState,
                grid: {
                    ...initialState.grid,
                    type: defaultGridType
                }
            };
        }),
      }),
      {
        limit: 50,
        partialize: (state) => {
          const {
            updateMetadata, updateGrid, addLayer, updateLayer, removeLayer, setActiveLayer, reorderLayers,
            addAsset, updateAsset, updateAssets, moveObjects, removeAsset, setSelectedAsset, setSelectedAssetIds, 
            updateGlobalLighting, addPointLight, updatePointLight, 
            removePointLight, removeObjects, updateLayerFilters,
            addTile, removeTile, addTiles, removeTiles, bulkUpdateTiles, updateAutoTilingAround, addTileset, removeTileset,
            classifyAsset, setGhostFloor, resetState,
            ...rest
          } = state;
          return rest;
        },
      }
    )
  )
);
