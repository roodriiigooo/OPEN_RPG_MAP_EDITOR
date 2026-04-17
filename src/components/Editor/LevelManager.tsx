import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useMapStore } from '../../store/useMapStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { MapState } from '../../types/map';
import { 
  Plus, Trash2, Copy, Map as MapIcon, 
  Settings, ChevronUp, ChevronDown, GripVertical 
} from 'lucide-react';
import { clsx } from 'clsx';
import { MapSettings } from './MapSettings';

export const LevelManager: React.FC = () => {
  const { maps, activeMapId, addMap, removeMap, setActiveMapId, reorderMaps, defaultGridType } = useProjectStore();
  const { showConfirm } = useNotificationStore();
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);
  const [draggedMapId, setDraggedMapId] = useState<string | null>(null);

  const handleSelectMap = (mapId: string) => {
    if (mapId === activeMapId) return;
    setActiveMapId(mapId);
  };

  const handleAddMap = () => {
    const newId = typeof crypto?.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newMap: MapState = {
      id: newId,
      metadata: {
        name: `Level ${maps.length + 1}`,
        resolution: { width: 3500, height: 2400 },
        ratio: '1:1',
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
        {
          id: 'terrain-layer',
          name: 'Terrains',
          type: 'terrain',
          visible: true,
          locked: false,
          opacity: 1,
          filters: { brightness: 0, contrast: 0, sepia: 0 },
        },
        {
          id: 'stamp-layer',
          name: 'Objects',
          type: 'stamp',
          visible: true,
          locked: false,
          opacity: 1,
          filters: { brightness: 0, contrast: 0, sepia: 0 },
        },
        {
          id: 'wall-layer',
          name: 'Walls',
          type: 'wall',
          visible: true,
          locked: false,
          opacity: 1,
          filters: { brightness: 0, contrast: 0, sepia: 0 },
        }
      ],
      assets: [],
      rooms: [],
      activeLayerId: 'stamp-layer',
      selectedAssetIds: [],
      selectedRoomId: null,
      grid: {
        type: defaultGridType || 'square',
        size: 100,
        visible: true,
        snapToGrid: true,
        color: '#666666',
        opacity: 1,
      },
      lighting: {
        global: { enabled: false, color: '#ffffff', intensity: 1, blendMode: 'multiply', sunEnabled: false, sunDirection: 45, sunIntensity: 0.5 },
        pointLights: [],
      },
      walls: [],
      tiles: [],
      tilesets: [],
    };
    addMap(newMap);
  };

  const handleDuplicateMap = (e: React.MouseEvent, map: MapState) => {
    e.stopPropagation();
    const newId = crypto.randomUUID();
    const duplicatedMap: MapState = {
      ...JSON.parse(JSON.stringify(map)),
      id: newId,
      metadata: {
        ...map.metadata,
        name: `${map.metadata.name} (Copy)`,
      },
    };
    addMap(duplicatedMap);
  };

  const handleMoveMap = (e: React.MouseEvent, index: number, direction: 'up' | 'down') => {
    e.stopPropagation();
    const newMaps = [...maps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= maps.length) return;
    
    const temp = newMaps[index];
    newMaps[index] = newMaps[targetIndex];
    newMaps[targetIndex] = temp;
    
    reorderMaps(newMaps.map(m => m.id));
  };

  const toggleSettings = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenSettingsId(openSettingsId === id ? null : id);
  };

  const handleDeleteLevel = (e: React.MouseEvent, map: MapState) => {
    e.stopPropagation();
    showConfirm(
        "Delete Level?",
        `Are you sure you want to delete the level "${map.metadata.name}"? This cannot be undone.`,
        () => {
            const isActive = map.id === activeMapId;
            removeMap(map.id);
            
            // If the deleted map was active, the store already picked a new one.
            // We need to make sure the MapStore is either cleared or updated.
            if (isActive) {
                const nextActiveMapId = useProjectStore.getState().activeMapId;
                const nextActiveMap = maps.find(m => m.id === nextActiveMapId);
                
                if (nextActiveMap) {
                    useMapStore.getState().resetState({ ...nextActiveMap, selectedAssetIds: [] } as any);
                } else {
                    useMapStore.getState().resetState();
                }
            }
        },
        { type: 'error', confirmLabel: 'Delete' }
    );
  };

  // Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedMapId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Create a ghost image or just set data
    e.dataTransfer.setData('text/plain', id);
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

  const onDragEnd = () => {
    setDraggedMapId(null);
  };

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-4 flex items-center justify-between border-b border-theme bg-black/10">
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
          <MapIcon size={14} />
          Level Manager
        </h3>
        <button
          onClick={handleAddMap}
          className="p-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-md transition-colors shadow-lg shadow-orange-900/20"
          title="Add New Level"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {maps.map((map, index) => (
          <div 
            key={map.id} 
            className={clsx(
                "flex flex-col gap-1 transition-all duration-200",
                draggedMapId === map.id ? "opacity-30 scale-95" : "opacity-100"
            )}
            draggable={openSettingsId === null}
            onDragStart={(e) => onDragStart(e, map.id)}
            onDragOver={(e) => onDragOver(e, map.id)}
            onDragEnd={onDragEnd}
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
              <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={14} className="text-muted cursor-grab active:cursor-grabbing" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate leading-tight uppercase tracking-tight">
                  {map.metadata.name}
                </p>
                <p className="text-[9px] text-muted mt-0.5 truncate uppercase font-mono">
                  {map.layers?.length || 0} Layers • {map.tiles?.length || 0} Tiles
                </p>
              </div>

              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => toggleSettings(e, map.id)}
                    className={clsx(
                      "p-1.5 rounded transition-colors",
                      openSettingsId === map.id ? "bg-orange-500 text-white" : "hover:bg-black/40 text-muted hover:text-orange-500"
                    )}
                    title="Level Settings"
                  >
                    <Settings size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateMap(e, map)}
                    className="p-1.5 hover:bg-black/40 text-muted hover:text-blue-400 rounded transition-colors"
                    title="Duplicate Level"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteLevel(e, map)}
                    className="p-1.5 hover:bg-black/40 text-muted hover:text-red-400 rounded transition-colors"
                    title="Delete Level"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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
                        
                        // If we are updating the active map, sync with MapStore
                        if (id === activeMapId) {
                            if (updates.metadata) useMapStore.getState().updateMetadata(updates.metadata);
                            if (updates.grid) useMapStore.getState().updateGrid(updates.grid);
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
