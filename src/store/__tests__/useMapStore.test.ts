// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '../useMapStore';
import { Layer } from '../../types/map';
import { TileType } from '../../types/tiling';

describe('useMapStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useMapStore.getState().resetState();
  });

  it('should have a default background layer', () => {
    const { layers, activeLayerId } = useMapStore.getState();
    expect(layers).toHaveLength(1);
    expect(layers[0].name).toBe('Background');
    expect(activeLayerId).toBe(layers[0].id);
  });

  it('should update metadata', () => {
    const { updateMetadata } = useMapStore.getState();
    const newMetadata = {
      name: 'Updated Map',
      resolution: { width: 1024, height: 768 },
      ratio: '4:3',
      ppi: 72,
    };

    updateMetadata(newMetadata);

    const state = useMapStore.getState();
    expect(state.metadata.name).toBe('Updated Map');
    expect(state.metadata.resolution.width).toBe(1024);
  });

  it('should manage layers and active layer', () => {
    const { addLayer, setActiveLayer } = useMapStore.getState();
    
    const newLayer: Layer = {
      id: 'layer-2',
      name: 'Layer 2',
      type: 'stamp',
      visible: true,
      locked: false,
      opacity: 1,
      filters: { brightness: 0, contrast: 0, sepia: 0 },
    };

    addLayer(newLayer);
    
    let state = useMapStore.getState();
    expect(state.layers).toHaveLength(2);
    expect(state.layers[1].id).toBe('layer-2');
    
    setActiveLayer('layer-2');
    state = useMapStore.getState();
    expect(state.activeLayerId).toBe('layer-2');
  });

  it('should reorder layers', () => {
    const { addLayer, reorderLayers } = useMapStore.getState();
    
    const layer2: Layer = {
      id: 'layer-2',
      name: 'Layer 2',
      type: 'stamp',
      visible: true,
      locked: false,
      opacity: 1,
      filters: { brightness: 0, contrast: 0, sepia: 0 },
    };
    addLayer(layer2);

    const initialLayers = useMapStore.getState().layers;
    const initialIds = initialLayers.map(l => l.id);
    const reversedIds = [...initialIds].reverse();

    reorderLayers(reversedIds);

    const state = useMapStore.getState();
    expect(state.layers.map(l => l.id)).toEqual(reversedIds);
  });

  it('should support undo/redo via zundo', () => {
    const { updateMetadata } = useMapStore.getState();
    const initialName = useMapStore.getState().metadata.name;

    updateMetadata({
      ...useMapStore.getState().metadata,
      name: 'Undo Test',
    });

    expect(useMapStore.getState().metadata.name).toBe('Undo Test');

    // Perform undo
    useMapStore.temporal.getState().undo();
    expect(useMapStore.getState().metadata.name).toBe(initialName);

    // Perform redo
    useMapStore.temporal.getState().redo();
    expect(useMapStore.getState().metadata.name).toBe('Undo Test');
  });

  it('should add and auto-tile tiles', () => {
    const { addTileset, addTile } = useMapStore.getState();
    
    addTileset({
      id: 'test-set',
      name: 'Test Set',
      type: TileType.WALL,
      imageUrl: '',
      tileSize: 64,
      bitmaskMap: {
        1: 10, // North
        4: 20, // East
        5: 30, // North + East
      }
    });

    // Add North neighbor
    addTile({ x: 0, y: -1, tilesetId: 'test-set', variantIndex: 0, bitmask: 0, type: TileType.WALL });
    
    // Add center tile
    addTile({ x: 0, y: 0, tilesetId: 'test-set', variantIndex: 0, bitmask: 0, type: TileType.WALL });
    
    let state = useMapStore.getState();
    let centerTile = state.tiles.find(t => t.x === 0 && t.y === 0);
    expect(centerTile?.bitmask).toBe(1); // Only North neighbor
    expect(centerTile?.variantIndex).toBe(10);

    // Add East neighbor
    addTile({ x: 1, y: 0, tilesetId: 'test-set', variantIndex: 0, bitmask: 0, type: TileType.WALL });
    
    state = useMapStore.getState();
    centerTile = state.tiles.find(t => t.x === 0 && t.y === 0);
    expect(centerTile?.bitmask).toBe(5); // North + East
    expect(centerTile?.variantIndex).toBe(30);
  });

  it('should support undo for tiling actions', () => {
    const { addTileset, addTile } = useMapStore.getState();
    
    addTileset({
      id: 'test-set',
      name: 'Test Set',
      type: TileType.WALL,
      imageUrl: '',
      tileSize: 64,
      bitmaskMap: { 0: 0, 1: 1 }
    });

    addTile({ x: 0, y: 0, tilesetId: 'test-set', variantIndex: 0, bitmask: 0, type: TileType.WALL });
    expect(useMapStore.getState().tiles).toHaveLength(1);

    useMapStore.temporal.getState().undo();
    expect(useMapStore.getState().tiles).toHaveLength(0);
  });

  it('should classify assets', () => {
    const { addAsset, classifyAsset } = useMapStore.getState();
    
    const asset = {
      id: 'asset-1',
      layerId: 'background-layer',
      type: 'image',
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      visible: true,
      locked: false,
      properties: { opacity: 1, flipX: false, flipY: false }
    };

    addAsset(asset);
    expect(useMapStore.getState().assets[0].type).toBe('image');

    classifyAsset('asset-1', TileType.STAMP);
    expect(useMapStore.getState().assets[0].type).toBe('stamp');

    classifyAsset('asset-1', TileType.WALL);
    expect(useMapStore.getState().assets[0].type).toBe('tile');
  });

  it('should add multiple tiles and update auto-tiling in batch', () => {
    const { addTileset, addTiles } = useMapStore.getState();
    
    addTileset({
      id: 'test-set',
      name: 'Test Set',
      type: TileType.WALL,
      imageUrl: '',
      tileSize: 64,
      bitmaskMap: {
        1: 10, 4: 20, 5: 30,
      }
    });

    // Add North and Center tiles in one batch
    addTiles([
      { x: 0, y: -1, tilesetId: 'test-set', variantIndex: 0, bitmask: 0, type: TileType.WALL },
      { x: 0, y: 0, tilesetId: 'test-set', variantIndex: 0, bitmask: 0, type: TileType.WALL },
    ]);

    const state = useMapStore.getState();
    const centerTile = state.tiles.find(t => t.x === 0 && t.y === 0);
    expect(centerTile?.bitmask).toBe(1);
    expect(centerTile?.variantIndex).toBe(10);
    expect(state.tiles).toHaveLength(2);
  });

  it('should remove multiple tiles and update neighbors in batch', () => {
    const { addTileset, addTiles, removeTiles } = useMapStore.getState();
    
    addTileset({
      id: 'test-set',
      name: 'Test Set',
      type: TileType.WALL,
      imageUrl: '',
      tileSize: 64,
      bitmaskMap: { 0: 0, 1: 10, 4: 20, 5: 30 }
    });

    // Setup: North, Center, East
    addTiles([
      { x: 0, y: -1, tilesetId: 'test-set', variantIndex: 0, bitmask: 0, type: TileType.WALL },
      { x: 0, y: 0, tilesetId: 'test-set', variantIndex: 0, bitmask: 0, type: TileType.WALL },
      { x: 1, y: 0, tilesetId: 'test-set', variantIndex: 0, bitmask: 0, type: TileType.WALL },
    ]);

    let state = useMapStore.getState();
    let centerTile = state.tiles.find(t => t.x === 0 && t.y === 0);
    expect(centerTile?.bitmask).toBe(5); // N + E

    // Remove North and East
    removeTiles([
      { x: 0, y: -1 },
      { x: 1, y: 0 },
    ], TileType.WALL);

    state = useMapStore.getState();
    centerTile = state.tiles.find(t => t.x === 0 && t.y === 0);
    expect(centerTile?.bitmask).toBe(0);
    expect(state.tiles).toHaveLength(1);
  });
});
