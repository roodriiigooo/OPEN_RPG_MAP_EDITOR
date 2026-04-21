import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { useAssetStore } from '../../store/useAssetStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useEditorStore } from '../../store/useEditorStore';
import { useProjectStore } from '../../store/useProjectStore';
import { 
    Eye, EyeOff, Lock, Unlock, Trash2, Box, Square, Circle, Triangle, 
    Pentagon, Edit2, Check, X, Lightbulb, GripVertical, Layers, ChevronDown, ChevronRight,
    Plus, Sliders, Fence, Paintbrush, Copy
} from 'lucide-react';
import { Asset, PointLight, Layer } from '../../types/map';
import { clsx } from 'clsx';

import { useTwoFingerScroll } from '../../hooks/useTwoFingerScroll';

export const ObjectList: React.FC = () => {
  const scrollRef = useTwoFingerScroll();
  const activeMapId = useProjectStore((state) => state.activeMapId);
  const assets = useMapStore((state) => state.assets);
  const pointLights = useMapStore((state) => state.lighting.pointLights);
  const layers = useMapStore((state) => state.layers);
  const activeLayerId = useMapStore((state) => state.activeLayerId);
  const setActiveLayer = useMapStore((state) => state.setActiveLayer);
  const selectedAssetIds = useMapStore((state) => state.selectedAssetIds);
  const setSelectedAsset = useMapStore((state) => state.setSelectedAsset);
  const updateAsset = useMapStore((state) => state.updateAsset);
  const removeAsset = useMapStore((state) => state.removeAsset);
  const duplicateObject = useMapStore((state) => state.duplicateObject);
  const reorderLayerObjects = useMapStore((state) => state.reorderLayerObjects);
  const removePointLight = useMapStore((state) => state.removePointLight);
  const updatePointLight = useMapStore((state) => state.updatePointLight);
  
  const { showConfirm } = useNotificationStore();

  const addLayer = useMapStore((state) => state.addLayer);
  const updateLayer = useMapStore((state) => state.updateLayer);
  const removeLayer = useMapStore((state) => state.removeLayer);
  const reorderLayers = useMapStore((state) => state.reorderLayers);
  const updateLayerFilters = useMapStore((state) => state.updateLayerFilters);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [collapsedLayers, setCollapsedLayers] = useState<Set<string>>(new Set());
  const [showFXLayerId, setShowFXLayerId] = useState<string | null>(null);

  const toggleLayerCollapse = (id: string) => {
    const newCollapsed = new Set(collapsedLayers);
    if (newCollapsed.has(id)) newCollapsed.delete(id);
    else newCollapsed.add(id);
    setCollapsedLayers(newCollapsed);
  };

  const toggleFX = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (showFXLayerId === id) setShowFXLayerId(null);
    else {
        setShowFXLayerId(id);
        setActiveLayer(id);
    }
  };

  const startEditing = (e: React.MouseEvent, id: string, initialValue: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditValue(initialValue);
  };

  const startEditingLayer = (e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation();
    setEditingLayerId(layer.id);
    setEditValue(layer.name);
  };

  const handleAddLayer = () => {
    const id = `layer-${Date.now()}`;
    const newLayer: Layer = {
      id,
      name: `Layer ${layers.length + 1}`,
      type: 'stamp',
      visible: true,
      locked: false,
      opacity: 1,
      filters: { brightness: 0, contrast: 0, sepia: 0 },
    };
    addLayer(newLayer);
  };

  const saveEdit = (id: string) => {
    const light = pointLights.find(l => l.id === id);
    if (light) {
        updatePointLight(id, { name: editValue });
    } else {
        updateAsset(id, { name: editValue });
    }
    setEditingId(null);
  };

  const saveLayerEdit = (id: string) => {
    updateLayer(id, { name: editValue });
    setEditingLayerId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingLayerId(null);
  };

  const onObjectDragStart = (e: React.DragEvent, id: string, sourceLayerId: string) => {
    setDraggedItemId(id);
    e.dataTransfer.setData('objectId', id);
    e.dataTransfer.setData('sourceLayerId', sourceLayerId);
    e.dataTransfer.setData('type', 'object');
    e.dataTransfer.effectAllowed = 'move';
  };

  const onObjectDragOverItem = (e: React.DragEvent, overId: string, layerId: string) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === overId) return;

    // Get current visual order [Top -> Bottom] which is zIndex Descending
    const currentLayerObjects = [
        ...assets.filter(a => a.layerId === layerId),
        ...pointLights.filter(l => l.layerId === layerId)
    ].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

    const currentOrder = currentLayerObjects.map(o => o.id);
    const draggedIdx = currentOrder.indexOf(draggedItemId);
    const overIdx = currentOrder.indexOf(overId);

    if (draggedIdx === -1 || overIdx === -1) return;

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(overIdx, 0, draggedItemId);

    // Save back to store in reverse order [Bottom -> Top] for zIndex mapping
    reorderLayerObjects(layerId, [...newOrder].reverse());
  };

  const onDropOnLayer = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    setDragOverLayerId(null);
    const type = e.dataTransfer.getData('type');
    
    const targetLayer = layers.find(l => l.id === targetLayerId);
    if (type === 'object' && (targetLayer?.type === 'background' || targetLayer?.type === 'wall' || targetLayer?.type === 'terrain')) {
        return;
    }
    
    if (type === 'object') {
        const objectId = e.dataTransfer.getData('objectId');
        const sourceLayerId = e.dataTransfer.getData('sourceLayerId');

        if (objectId && sourceLayerId !== targetLayerId) {
            const asset = assets.find(a => a.id === objectId);
            if (asset) {
                updateAsset(objectId, { layerId: targetLayerId });
            } else {
                const light = pointLights.find(l => l.id === objectId);
                if (light) {
                    updatePointLight(objectId, { layerId: targetLayerId });
                }
            }
        }
    } else if (type === 'layer') {
        const draggedId = e.dataTransfer.getData('layerId');
        if (!draggedId || draggedId === targetLayerId) return;

        const currentLayersOrder = [...layers].reverse().map(l => l.id); // [Top -> Bottom]
        const draggedIdx = currentLayersOrder.indexOf(draggedId);
        const overIdx = currentLayersOrder.indexOf(targetLayerId);

        if (draggedIdx === -1 || overIdx === -1) return;

        const newLayersOrder = [...currentLayersOrder];
        newLayersOrder.splice(draggedIdx, 1);
        newLayersOrder.splice(overIdx, 0, draggedId);

        reorderLayers([...newLayersOrder].reverse());
    }
    
    setDraggedItemId(null);
    setDraggedLayerId(null);
  };

  const onDragOverLayer = (e: React.DragEvent, layerId: string) => {
    e.preventDefault();
    if (draggedItemId || draggedLayerId) {
        setDragOverLayerId(layerId);
    }
  };

  const handleDeleteLayer = (e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation();
    if (layer.type === 'background' || layer.type === 'wall' || layer.type === 'terrain') return;
    
    showConfirm(
        "Delete Layer?",
        `Are you sure you want to delete the layer "${layer.name}" and all its contents?`,
        () => removeLayer(layer.id),
        { type: 'error', confirmLabel: 'Delete' }
    );
  };

  const onLayerDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLayerId(id);
    e.dataTransfer.setData('layerId', id);
    e.dataTransfer.setData('type', 'layer');
    e.dataTransfer.effectAllowed = 'move';
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'square': return <Square size={14} />;
      case 'circle': return <Circle size={14} />;
      case 'triangle': return <Triangle size={14} />;
      case 'pentagon': return <Pentagon size={14} />;
      case 'light': return <Lightbulb size={14} className="text-amber-400" />;
      default: return <Box size={14} />;
    }
  };

  const renderObjectItem = (item: Asset | PointLight, layerId: string) => {
    const isLight = 'radius' in item;
    const isSelected = selectedAssetIds.includes(item.id);
    const isLocked = item.locked;
    const isVisible = item.visible;

    const customAsset = !isLight && (item as Asset).customAssetId 
        ? useAssetStore.getState().customAssets.find(a => a.id === (item as Asset).customAssetId)
        : null;

    const toggleVisibility = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLight) updatePointLight(item.id, { visible: !isVisible });
        else updateAsset(item.id, { visible: !isVisible });
    };

    const toggleLock = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLight) updatePointLight(item.id, { locked: !isLocked });
        else updateAsset(item.id, { locked: !isLocked });
    };

    return (
        <div
            key={item.id}
            draggable={!isLocked}
            onDragStart={(e) => onObjectDragStart(e, item.id, layerId)}
            onDragOver={(e) => onObjectDragOverItem(e, item.id, layerId)}
            onDragEnd={() => setDraggedItemId(null)}
            onClick={(e) => { e.stopPropagation(); setSelectedAsset(item.id); }}
            className={clsx(
                "group flex items-center gap-2 px-2 py-1.5 cursor-pointer border-l-2 transition-all ml-4",
                draggedItemId === item.id ? 'opacity-20 bg-orange-500/5' : '',
                isSelected 
                    ? 'bg-orange-500/10 border-orange-500 text-main shadow-inner' 
                    : 'border-transparent text-muted hover:bg-black/20 hover:text-main'
            )}
            style={{ touchAction: 'none' }}
        >
            <div className={clsx(
                "cursor-grab active:cursor-grabbing transition-colors",
                isLocked ? "opacity-0" : "text-muted/30 group-hover:text-muted"
            )}>
                <GripVertical size={10} />
            </div>

            <div className={clsx(isSelected ? 'text-orange-500' : 'text-muted')}>
                {isLight ? (
                    <Lightbulb size={14} className="text-amber-400" />
                ) : (
                    <div className="w-5 h-5 rounded bg-black/40 border border-theme flex items-center justify-center overflow-hidden">
                        {customAsset?.previewUrl ? (
                            <img src={customAsset.previewUrl} className="w-full h-full object-contain" />
                        ) : getAssetIcon((item as Asset).type)}
                    </div>
                )}
            </div>
            
            <div className="flex-1 min-w-0">
                {editingId === item.id ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <input
                            autoFocus type="text" value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') saveEdit(item.id);
                                if (e.key === 'Escape') cancelEdit();
                            }}
                            className="bg-black/40 text-main text-[10px] px-1 py-0.5 rounded border border-orange-500 outline-none w-full font-bold"
                        />
                        <button onClick={() => saveEdit(item.id)} className="p-0.5 bg-orange-600 rounded text-white hover:bg-orange-500 transition-colors">
                            <Check size={10} />
                        </button>
                        <button onClick={cancelEdit} className="p-0.5 bg-black/40 rounded text-muted hover:text-white transition-colors border border-theme">
                            <X size={10} />
                        </button>
                    </div>
                ) : (
                    <div 
                        onDoubleClick={(e) => startEditing(e, item.id, isLight ? ((item as PointLight).name || 'Point Light') : ((item as Asset).name || (item as Asset).type))}
                        className="flex items-center gap-1 overflow-hidden"
                    >
                        <p className="text-[10px] font-bold truncate uppercase tracking-tight">
                            {isLight 
                                ? (item as PointLight).name || 'Point Light' 
                                : ((item as Asset).name || (item as Asset).type)}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1">
                <button 
                    onClick={(e) => startEditing(e, item.id, isLight ? ((item as PointLight).name || 'Point Light') : ((item as Asset).name || (item as Asset).type))}
                    className="p-1 rounded hover:bg-black/40 text-muted hover:text-orange-500 transition-all"
                    title="Rename"
                >
                    <Edit2 size={12} />
                </button>
                <button
                    onClick={toggleVisibility}
                    className={clsx("p-1 rounded hover:bg-black/40 transition-colors", !isVisible ? 'text-orange-500/50' : 'text-muted hover:text-main')}
                    title={isVisible ? 'Hide Object' : 'Show Object'}
                >
                    {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button
                    onClick={toggleLock}
                    className={clsx("p-1 rounded hover:bg-black/40 transition-colors", isLocked ? 'text-orange-500' : 'text-muted hover:text-main')}
                    title={isLocked ? 'Unlock Object' : 'Lock Object'}
                >
                    {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); duplicateObject(item.id); }}
                    className="p-1 rounded hover:bg-black/40 text-muted hover:text-blue-400 transition-colors"
                    title="Duplicate Object"
                >
                    <Copy size={12} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); isLight ? removePointLight(item.id) : removeAsset(item.id); }}
                    className="p-1 rounded hover:bg-red-900/40 text-muted hover:text-red-400 transition-colors"
                    title="Delete Object"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-3 border-b border-theme flex justify-between items-center bg-black/10">
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-2">
          <Layers size={14} className="text-orange-500" />
          Layer Tree
        </h3>
        <div className="flex items-center gap-2">
            {/* <span className="text-[10px] bg-black/20 text-muted px-1.5 py-0.5 rounded-full border border-theme">
                {assets.length + pointLights.length}
            </span> */}
            <button
                onClick={handleAddLayer}
                className="p-1 hover:bg-black/20 rounded transition-colors text-orange-500"
                title="Add New Layer"
            >
                <Plus size={14} />
            </button>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        <div className="flex flex-col">
            {[...layers].reverse().map(layer => {
                const layerAssets = assets.filter(a => a.layerId === layer.id);
                const layerLights = pointLights.filter(l => l.layerId === layer.id);
                
                // Visual Order: Higher zIndex at Top
                const layerObjects = [...layerAssets, ...layerLights].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
                
                const isEmpty = layerObjects.length === 0;
                const isCollapsed = collapsedLayers.has(layer.id);
                const isFXOpen = showFXLayerId === layer.id;
                const isDragOver = dragOverLayerId === layer.id;
                const isWallLayer = layer.type === 'wall';
                const isTerrainLayer = layer.type === 'terrain';
                const isBackgroundLayer = layer.type === 'background';

                return (
                    <div 
                        key={layer.id} 
                        className={clsx(
                            "flex flex-col border-b border-theme last:border-0 transition-all",
                            draggedLayerId === layer.id ? "opacity-20" : "",
                            isDragOver && "bg-orange-500/10 ring-1 ring-inset ring-orange-500/30"
                        )}
                        onDragOver={(e) => onDragOverLayer(e, layer.id)}
                        onDragLeave={() => setDragOverLayerId(null)}
                        onDrop={(e) => onDropOnLayer(e, layer.id)}
                    >
                        <div 
                            draggable
                            onDragStart={(e) => onLayerDragStart(e, layer.id)}
                            onDragEnd={() => setDraggedLayerId(null)}
                            onClick={() => { 
                                setActiveLayer(layer.id); 
                                if (isWallLayer) useEditorStore.getState().setActiveTool('wall');
                                else if (isTerrainLayer) useEditorStore.getState().setActiveTool('terrain');
                            }}
                            className={clsx(
                                "group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-l-2",
                                activeLayerId === layer.id 
                                    ? "bg-orange-500/10 border-orange-500 text-main" 
                                    : "border-transparent text-muted hover:bg-black/30"
                            )}
                            style={{ touchAction: 'none' }}
                        >
                            <div className="text-muted/50 cursor-grab active:cursor-grabbing">
                                <GripVertical size={10} />
                            </div>
                            <div 
                                className="text-muted/50 hover:text-orange-500 transition-colors p-1 -m-1"
                                onClick={(e) => {
                                    if (!isWallLayer && !isTerrainLayer && !isBackgroundLayer) {
                                        e.stopPropagation();
                                        toggleLayerCollapse(layer.id);
                                    }
                                }}
                            >
                                {isWallLayer ? (
                                    <Fence size={14} className="text-orange-500" />
                                ) : isTerrainLayer ? (
                                    <Paintbrush size={12} className="text-orange-500" />
                                ) : isBackgroundLayer ? (
                                    <Square size={12} className="text-orange-500" />
                                ) : (
                                    isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                {editingLayerId === layer.id ? (
                                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <input
                                            autoFocus type="text" value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') saveLayerEdit(layer.id);
                                                if (e.key === 'Escape') cancelEdit();
                                            }}
                                            className="bg-black/40 text-main text-[10px] px-1 py-0.5 rounded border border-orange-500 outline-none w-full font-bold uppercase"
                                        />
                                        <button onClick={() => saveLayerEdit(layer.id)} className="p-0.5 bg-orange-600 rounded text-white hover:bg-orange-500 transition-colors shrink-0">
                                            <Check size={10} />
                                        </button>
                                        <button onClick={cancelEdit} className="p-0.5 bg-black/40 rounded text-muted hover:text-white transition-colors border border-theme shrink-0">
                                            <X size={10} />
                                        </button>
                                    </div>
                                ) : (
                                    <div 
                                        onDoubleClick={(e) => {
                                            if (!isWallLayer && !isBackgroundLayer && !isTerrainLayer) {
                                                startEditingLayer(e, layer);
                                            }
                                        }}
                                        className="flex items-center gap-1 overflow-hidden"
                                    >
                                        <span className={clsx("text-[10px] font-black uppercase tracking-widest truncate", (isWallLayer || isBackgroundLayer || isTerrainLayer) && "text-main")}>{layer.name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                {!isWallLayer && !isBackgroundLayer && !isTerrainLayer && (
                                    <button 
                                        onClick={(e) => startEditingLayer(e, layer)}
                                        className="p-1 rounded hover:bg-black/40 text-muted hover:text-orange-500 transition-all"
                                        title="Rename Layer"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
                                    className={clsx("p-1 rounded transition-colors", !layer.visible ? 'text-orange-500/50' : 'text-muted hover:text-main')}
                                    title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                                >
                                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }); }}
                                    className={clsx("p-1 rounded transition-colors", layer.locked ? 'text-orange-500' : 'text-muted hover:text-main')}
                                    title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                                >
                                    {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                                </button>
                                {layer.type !== 'background' && layer.type !== 'wall' && layer.type !== 'terrain' && (
                                    <button
                                        onClick={(e) => handleDeleteLayer(e, layer)}
                                        className="p-1 hover:bg-red-500/20 text-muted hover:text-red-400 rounded transition-colors"
                                        title="Delete Layer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {!isCollapsed && !isWallLayer && !isBackgroundLayer && !isTerrainLayer && (
                            <div className="flex flex-col bg-black/10 animate-in fade-in slide-in-from-top-1 duration-200 border-t border-theme/30 max-h-[420px] overflow-y-auto custom-scrollbar">
                                {layerObjects.map(obj => renderObjectItem(obj, layer.id))}
                                
                                {isEmpty && (
                                    <div className="py-3 px-8 opacity-20 italic">
                                        <p className="text-[9px] uppercase font-bold tracking-tighter text-center">Empty Layer</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
