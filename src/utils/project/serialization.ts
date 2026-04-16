import { MapState } from '../../types/map';

/**
 * Strips all functions and transient UI state from a MapState object
 * to ensure it can be serialized and stored in IndexedDB (DataCloneError prevention).
 */
export const sanitizeMapState = (state: any): MapState => {
  if (!state) throw new Error("Cannot sanitize null state");

  return {
    id: state.id || '', // Maintain empty ID if it's already empty
    metadata: state.metadata ? { ...state.metadata } : { 
        name: 'Recovered Map', 
        resolution: { width: 3500, height: 2400 },
        ratio: '3.5:2.4',
        ppi: 300,
        backgroundColor: '#ffffff'
    },
    layers: Array.isArray(state.layers) ? state.layers.map((l: any) => ({ ...l })) : [],
    assets: Array.isArray(state.assets) ? state.assets.map((a: any) => ({ ...a })) : [],
    rooms: Array.isArray(state.rooms) ? state.rooms.map((r: any) => ({ ...r })) : [],
    activeLayerId: state.activeLayerId || null,
    selectedAssetIds: [], // Transient
    selectedRoomId: null,  // Transient
    grid: state.grid ? { ...state.grid } : {
        type: 'square',
        size: 100,
        visible: true,
        snapToGrid: true,
        color: '#666666',
        opacity: 1,
    },
    lighting: state.lighting ? {
      global: { ...state.lighting.global },
      pointLights: Array.isArray(state.lighting.pointLights) ? state.lighting.pointLights.map((l: any) => ({ ...l })) : [],
      atmosphere: state.lighting.atmosphere ? { ...state.lighting.atmosphere } : undefined
    } : {
        global: { enabled: false, color: '#ffffff', intensity: 1, blendMode: 'multiply', sunEnabled: false, sunDirection: 45, sunIntensity: 0.5 },
        pointLights: []
    },
    walls: Array.isArray(state.walls) ? state.walls.map((w: any) => ({ ...w })) : [],
    tiles: Array.isArray(state.tiles) ? state.tiles.map((t: any) => ({ ...t })) : [],
    tilesets: Array.isArray(state.tilesets) ? state.tilesets.map((ts: any) => ({ ...ts })) : [],
  };
};
