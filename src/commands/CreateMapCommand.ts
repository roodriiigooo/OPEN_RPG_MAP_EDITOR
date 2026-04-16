import { Command } from './Command';
import { useMapStore } from '../store/useMapStore';
import { useProjectStore } from '../store/useProjectStore';
import { MapMetadata } from '../types/map';

export class CreateMapCommand implements Command {
  private metadata: MapMetadata;

  constructor(metadata: MapMetadata) {
    this.metadata = metadata;
  }

  execute(): void {
    const store = useMapStore.getState();
    const defaultGridType = useProjectStore.getState().defaultGridType || 'square';
    
    const initialGrid = {
      type: defaultGridType,
      size: 100,
      visible: true,
      snapToGrid: true,
      color: '#888',
      opacity: 0.5,
    };

    store.resetState({
      id: crypto.randomUUID(),
      metadata: this.metadata,
      layers: [],
      assets: [],
      rooms: [],
      activeLayerId: null,
      selectedAssetIds: [],
      selectedRoomId: null,
      ghostFloorId: null,
      ghostFloorOpacity: 0.3,
      lastTileUpdate: Date.now(),
      grid: initialGrid,
      lighting: {
        global: {
          enabled: false,
          color: '#ffffff',
          intensity: 1,
          blendMode: 'multiply',
          sunEnabled: false,
          sunDirection: 45,
          sunIntensity: 0.5,
        },
        atmosphere: {
          enabled: false,
          vignette: 0.5,
          noise: 0.1,
          colorGrading: '#ffffff',
        },
        pointLights: [],
      },
      walls: [],
      tiles: [],
      tilesets: [],
      exportMasks: { lines: [], inverted: false },
    });
  }
}
