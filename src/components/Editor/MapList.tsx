import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useMapStore } from '../../store/useMapStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { MapState } from '../../types/map';
import { Plus, Trash2, Copy, Map as MapIcon, ChevronRight, Settings, LayoutGrid } from 'lucide-react';
import { clsx } from 'clsx';
import { MapSettings } from './MapSettings';

export const MapList: React.FC = () => {
  const { maps, activeMapId, addMap, removeMap, setActiveMapId, reorderMaps, defaultGridType } = useProjectStore();
  const resetMapStore = useMapStore((state) => state.resetState);
  const currentMapState = useMapStore((state) => state);
  const { showAlert, showConfirm } = useNotificationStore();
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);
  const [draggedMapId, setDraggedMapId] = useState<string | null>(null);

  const syncActiveMap = () => {
    if (activeMapId) {
      useProjectStore.getState().updateMap(activeMapId, {
        metadata: currentMapState.metadata,
        layers: currentMapState.layers,
        assets: currentMapState.assets,
        rooms: currentMapState.rooms,
        activeLayerId: currentMapState.activeLayerId,
        grid: currentMapState.grid,
        lighting: currentMapState.lighting,
        walls: currentMapState.walls,
        tiles: currentMapState.tiles,
        tilesets: currentMapState.tilesets,
        diagonalTiling: currentMapState.diagonalTiling,
      });
    }
  };

  const handleSelectMap = (mapId: string) => {
    if (mapId === activeMapId) return;
    syncActiveMap();

    const targetMap = maps.find((m) => m.id === mapId);
    if (targetMap) {
      setActiveMapId(mapId);
      resetMapStore({
        ...targetMap,
        selectedAssetIds: [],
        selectedRoomId: null,
      } as any);
    }
  };

  const handleAddMap = () => {
    syncActiveMap();
    const newId = crypto.randomUUID();
    const newMap: MapState = {
      id: newId,
      metadata: {
        name: `New Map ${maps.length + 1}`,
        resolution: { width: 3500, height: 2400 },
        ratio: '3.5:2.4',
        ppi: 70,
        backgroundColor: '#ffffff',
      },
      layers: [
        {
          id: 'background-layer',
          name: 'Background',
          type: 'background',
          visible: true,
          locked: false,
          opacity: 1,
          filters: { brightness: 0, contrast: 0, sepia: 0 },
        },
      ],
      assets: [],
      rooms: [],
      activeLayerId: 'background-layer',
      selectedAssetIds: [],
      selectedRoomId: null,
      diagonalTiling: false,
      grid: {
        type: defaultGridType || 'square',
        size: 100,
        visible: true,
        snapToGrid: true,
        color: '#666666',
        opacity: 1,
      },
      lighting: {
        global: { enabled: false, color: '#ffffff', intensity: 1, blendMode: 'multiply' },
        pointLights: [],
      },
      walls: [],
      tiles: [],
      tilesets: [],
    };
    addMap(newMap);
    handleSelectMap(newId);
  };

  const handleDuplicateMap = (e: React.MouseEvent, map: MapState) => {
    e.stopPropagation();
    
    // If duplicating the active map, we need the latest state from the store
    const sourceMap = map.id === activeMapId ? { ...map, ...currentMapState } : map;
    
    const newId = crypto.randomUUID();
    const duplicatedMap: MapState = {
      ...sourceMap,
      id: newId,
      metadata: {
        ...sourceMap.metadata,
        name: `${sourceMap.metadata.name} (Copy)`,
      },
    };
    addMap(duplicatedMap);
  };

  const onDragStart = (id: string) => {
    setDraggedMapId(id);
  };

  const onDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!draggedMapId || draggedMapId === overId) return;

    const currentOrder = maps.map(m => m.id);
    const draggedIdx = currentOrder.indexOf(draggedMapId);
    const overIdx = currentOrder.indexOf(overId);

    if (draggedIdx === -1 || overIdx === -1) return;

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(overIdx, 0, draggedMapId);

    reorderMaps(newOrder);
  };

  const handleDeleteMap = (e: React.MouseEvent, mapId: string, mapName: string) => {
    e.stopPropagation();
    if (maps.length <= 1) {
      showAlert("Delete Map", "A project must have at least one map.", "warn");
      return;
    }
    showConfirm(
        "Delete Map?",
        `Are you sure you want to delete "${mapName}"? This will permanently erase all its data.`,
        () => {
            removeMap(mapId);
            if (activeMapId === mapId) {
                const remainingMaps = maps.filter(m => m.id !== mapId);
                if (remainingMaps.length > 0) {
                    handleSelectMap(remainingMaps[0].id);
                }
            }
        },
        { type: 'error', confirmLabel: 'Delete Map' }
    );
  };

  const toggleSettings = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenSettingsId(openSettingsId === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-4 flex items-center justify-between border-b border-theme bg-black/10">
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
          <MapIcon size={14} />
          Project Maps
        </h3>
        <button
          onClick={handleAddMap}
          className="p-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-md transition-colors shadow-lg shadow-orange-900/20"
          title="Add New Map"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {maps.map((map) => (
          <div 
            key={map.id} 
            className={clsx(
                "flex flex-col gap-1 transition-opacity",
                draggedMapId === map.id && "opacity-20"
            )}
            draggable
            onDragStart={() => onDragStart(map.id)}
            onDragOver={(e) => onDragOver(e, map.id)}
            onDragEnd={() => setDraggedMapId(null)}
          >
            <div
              onClick={() => handleSelectMap(map.id)}
              className={clsx(
                "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                activeMapId === map.id
                  ? "bg-orange-500/10 border-orange-500 text-main shadow-lg shadow-orange-900/10"
                  : "bg-black/20 border-theme text-muted hover:bg-black/40 hover:border-muted hover:text-main"
              )}
            >
              <div className={clsx(
                "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                activeMapId === map.id ? "bg-orange-500 text-white" : "bg-black/40 text-muted group-hover:bg-black/60 group-hover:text-main"
              )}>
                <MapIcon size={16} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate leading-tight uppercase tracking-tight">
                  {map.metadata.name}
                </p>
                <p className="text-[9px] text-muted mt-0.5 truncate uppercase font-mono">
                  {map.metadata.resolution.width}x{map.metadata.resolution.height} • {map.layers.length} L.
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => toggleSettings(e, map.id)}
                  className={clsx(
                    "p-1.5 rounded transition-colors",
                    openSettingsId === map.id ? "bg-orange-500 text-white" : "hover:bg-black/40 text-muted hover:text-orange-500"
                  )}
                  title="Map Settings"
                >
                  <Settings size={14} />
                </button>
                <button
                  onClick={(e) => handleDuplicateMap(e, map)}
                  className="p-1.5 hover:bg-black/40 text-muted hover:text-blue-400 rounded transition-colors"
                  title="Duplicate Map"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={(e) => handleDeleteMap(e, map.id, map.metadata.name)}
                  className="p-1.5 hover:bg-black/40 text-muted hover:text-red-400 rounded transition-colors"
                  title="Delete Map"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            {openSettingsId === map.id && (
              <div className="px-1 pb-2 pt-1 animate-in slide-in-from-top-2 duration-200">
                <MapSettings 
                    map={map}
                    isActive={activeMapId === map.id}
                    onUpdate={(id, updates) => {
                        const { updateMap } = useProjectStore.getState();
                        updateMap(id, updates);
                        if (id === activeMapId) {
                            if (updates.metadata) useMapStore.getState().updateMetadata(updates.metadata);
                            if (updates.grid) useMapStore.getState().updateGrid(updates.grid);
                            if (updates.diagonalTiling !== undefined) useMapStore.getState().setDiagonalTiling(updates.diagonalTiling);
                        }
                    }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
