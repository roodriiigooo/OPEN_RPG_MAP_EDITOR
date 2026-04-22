import React, { useState, useRef } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useMapStore } from '../../store/useMapStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { MapState } from '../../types/map';
import { 
  Plus, Trash2, Copy, Map as MapIcon, 
  Settings, GripVertical, Check, X 
} from 'lucide-react';
import { clsx } from 'clsx';
import { MapSettings } from './MapSettings';

export const LevelManager: React.FC = () => {
  const { maps, activeMapId, addMap, removeMap, setActiveMapId, reorderMaps, defaultGridType, updateMap } = useProjectStore();
  const { showConfirm } = useNotificationStore();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);

  // High-performance drag validation
  const canDragRef = useRef(false);

  const handleSelectMap = (mapId: string) => {
    if (mapId === activeMapId) return;
    
    // Save current map state before switching
    const currentMap = useMapStore.getState();
    useProjectStore.getState().saveMap(currentMap as any);
    
    setActiveMapId(mapId);
    const newMap = maps.find(m => m.id === mapId);
    if (newMap) {
        useMapStore.getState().resetState({ ...newMap, selectedAssetIds: [] } as any);
    }
  };

  const handleAddMap = () => {
    const id = crypto.randomUUID();
    const newMap: MapState = {
      id,
      metadata: {
        name: `Level ${maps.length + 1}`,
        resolution: { width: 3500, height: 2400 },
        ratio: '1:1',
        backgroundColor: '#ffffff',
      },
      layers: [
        { id: 'background-layer', name: 'Background', type: 'background', visible: true, locked: false, opacity: 1 },
        { id: 'terrain-layer', name: 'Terrains', type: 'terrain', visible: true, locked: false, opacity: 1 },
        { id: 'stamp-layer', name: 'Objects', type: 'stamp', visible: true, locked: false, opacity: 1 },
        { id: 'wall-layer', name: 'Walls', type: 'wall', visible: true, locked: false, opacity: 1 }
      ],
      assets: [],
      activeLayerId: 'stamp-layer',
      grid: { type: defaultGridType || 'square', size: 100, visible: true, snapToGrid: true, color: '#666666', opacity: 1 },
      lighting: { global: { enabled: false, color: '#ffffff', intensity: 1, sunEnabled: false, sunDirection: 45, sunIntensity: 0.5 }, pointLights: [] },
      postProcessing: { vignette: 0, brightness: 100, contrast: 100, saturation: 100 },
      tiles: [],
      tilesets: [],
      ghostFloorOpacity: 0.3,
      diagonalTiling: false
    };
    addMap(newMap);
  };

  const handleDuplicateMap = (e: React.MouseEvent, map: MapState) => {
    e.stopPropagation();
    const newId = crypto.randomUUID();
    const duplicatedMap: MapState = {
      ...JSON.parse(JSON.stringify(map)),
      id: newId,
      metadata: { ...map.metadata, name: `${map.metadata.name} (Copy)` },
    };
    addMap(duplicatedMap);
  };

  const handleDeleteLevel = (e: React.MouseEvent, map: MapState) => {
    e.stopPropagation();
    showConfirm(
        "Delete Level?",
        `Are you sure you want to delete "${map.metadata.name}"? This cannot be undone.`,
        () => {
            const isActive = map.id === activeMapId;
            removeMap(map.id);
            if (isActive) {
                const nextId = useProjectStore.getState().activeMapId;
                const nextMap = maps.find(m => m.id === nextId);
                if (nextMap) useMapStore.getState().resetState({ ...nextMap, selectedAssetIds: [] } as any);
                else useMapStore.getState().resetState();
            }
        },
        { type: 'error', confirmLabel: 'Delete' }
    );
  };

  const startRename = (e: React.MouseEvent, map: MapState) => {
    e.stopPropagation();
    setEditingId(map.id);
    setEditName(map.metadata.name);
  };

  const saveRename = (id: string) => {
    updateMap(id, { metadata: { ...maps.find(m => m.id === id)!.metadata, name: editName } });
    setEditingId(null);
  };

  // Drag and Drop Logic (Right Sidebar Style)
  const onDragStart = (e: React.DragEvent, id: string) => {
    if (!canDragRef.current) {
        e.preventDefault();
        return;
    }
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('levelId', id);
  };

  const onDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedId || draggedId === overId) return;

    const currentOrder = maps.map(m => m.id);
    const draggedIdx = currentOrder.indexOf(draggedId);
    const overIdx = currentOrder.indexOf(overId);

    if (draggedIdx === -1 || overIdx === -1) return;

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(overIdx, 0, draggedId);

    reorderMaps(newOrder);
  };

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-4 border-b border-theme flex justify-between items-center bg-black/10">
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
          <MapIcon size={14} className="text-orange-500" />
          Levels
        </h3>
        <button onClick={handleAddMap} className="p-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg shadow-lg"><Plus size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {maps.map((map) => (
          <div 
            key={map.id} 
            draggable={openSettingsId === null}
            onDragStart={(e) => onDragStart(e, map.id)}
            onDragOver={(e) => onDragOver(e, map.id)}
            onDragEnter={(e) => onDragOver(e, map.id)}
            onDragEnd={() => { setDraggedId(null); canDragRef.current = false; }}
            onDrop={(e) => { e.preventDefault(); setDraggedId(null); canDragRef.current = false; }}
            className={clsx(
                "flex flex-col gap-1 transition-all duration-200",
                draggedId === map.id ? "opacity-30 scale-95" : "opacity-100"
            )}
          >
            <div
              onClick={() => handleSelectMap(map.id)}
              className={clsx(
                "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                activeMapId === map.id ? "bg-orange-500/10 border-orange-500 text-main" : "bg-black/20 border-theme text-muted hover:bg-black/40"
              )}
            >
              <div 
                onPointerDown={() => { canDragRef.current = true; }}
                onPointerUp={() => { canDragRef.current = false; }}
                className="shrink-0 drag-handle p-1 -m-1"
              >
                <GripVertical size={14} className="text-muted/50 cursor-grab active:cursor-grabbing hover:text-orange-500" />
              </div>

              <div className="flex-1 min-w-0">
                {editingId === map.id ? (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input autoFocus type="text" value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveRename(map.id); if (e.key === 'Escape') setEditingId(null); }} className="bg-black/40 text-main text-xs px-2 py-1 rounded border border-orange-500 outline-none w-full font-bold" />
                    <button onClick={() => saveRename(map.id)} className="p-1 bg-orange-600 rounded text-white"><Check size={12} /></button>
                    <button onClick={() => setEditingId(null)} className="p-1 bg-black/40 rounded text-muted border border-theme"><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest truncate">{map.metadata.name}</span>
                    <span className="text-[8px] font-mono text-muted uppercase">{map.metadata.resolution.width}x{map.metadata.resolution.height}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); setOpenSettingsId(openSettingsId === map.id ? null : map.id); }} className={clsx("p-1.5 rounded-lg transition-colors", openSettingsId === map.id ? "bg-orange-500 text-white" : "text-muted/50 hover:text-orange-500 hover:bg-black/20")} title="Settings"><Settings size={14} /></button>
                <button onClick={(e) => handleDuplicateMap(e, map)} className="p-1.5 rounded-lg text-muted/50 hover:text-blue-400 hover:bg-black/20" title="Duplicate"><Copy size={14} /></button>
                {maps.length > 1 && <button onClick={(e) => handleDeleteLevel(e, map)} className="p-1.5 rounded-lg text-muted/50 hover:text-red-400 hover:bg-black/20" title="Delete"><Trash2 size={14} /></button>}
              </div>
            </div>
            
            {openSettingsId === map.id && (
              <div className="px-1 pb-2 pt-1 animate-in slide-in-from-top-2 duration-200">
                <MapSettings 
                    map={map} 
                    isActive={activeMapId === map.id}
                    onUpdate={(id, updates) => {
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
