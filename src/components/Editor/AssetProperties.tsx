import React from 'react';
import { useMapStore } from '../../store/useMapStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useTextStore } from '../../store/useTextStore';
import { 
    Sliders, FlipHorizontal, FlipVertical, Trash2, Square, Sun, RotateCw, 
    Maximize, Magnet, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Copy
} from 'lucide-react';
import { Asset } from '../../types/map';
import clsx from 'clsx';
import { FontLibrarySelector } from './FontLibrarySelector';

export const AssetProperties: React.FC = () => {
  const assets = useMapStore(s => s.assets);
  const selectedAssetIds = useMapStore(s => s.selectedAssetIds);
  const updateAsset = useMapStore(s => s.updateAsset);
  const removeAsset = useMapStore(s => s.removeAsset);
  const lighting = useMapStore(s => s.lighting);
  const updatePointLight = useMapStore(s => s.updatePointLight);
  const removePointLight = useMapStore(s => s.removePointLight);

  const selectedAsset = assets.find(a => selectedAssetIds.includes(a.id));
  const selectedLight = lighting.pointLights.find(l => selectedAssetIds.includes(l.id));

  if (selectedAssetIds.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-black/20 flex items-center justify-center border border-theme">
            <Sliders size={24} />
        </div>
        <div>
            <p className="text-xs font-black uppercase tracking-widest text-main">No Selection</p>
            <p className="text-[10px] mt-1 opacity-50">Select an object or light source to edit its properties.</p>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (key: string, value: any) => {
    if (selectedAsset) {
        updateAsset(selectedAsset.id, { properties: { ...selectedAsset.properties, [key]: value } });
    }
  };

  const isText = selectedAsset?.type === 'text';

  return (
    <div className="h-full flex flex-col bg-panel animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="p-4 border-b border-theme flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2">
            <Sliders size={14} className="text-orange-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-main">Properties</h3>
        </div>
        <span className="text-[10px] font-mono text-muted bg-black/40 px-2 py-0.5 rounded-full border border-theme">
            {selectedAssetIds.length} Selected
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {selectedAsset && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Appearance</label>
                <div className="flex gap-1">
                    <button
                        onClick={() => updateAsset(selectedAsset.id, { properties: { ...selectedAsset.properties, flipX: !selectedAsset.properties?.flipX } })}
                        className={clsx("p-1.5 rounded-lg border transition-all", selectedAsset.properties?.flipX ? "bg-orange-500 border-orange-400 text-white" : "bg-black/20 border-theme text-muted hover:bg-black/40")}
                        title="Flip Horizontal"
                    >
                        <FlipHorizontal size={12} />
                    </button>
                    <button
                        onClick={() => updateAsset(selectedAsset.id, { properties: { ...selectedAsset.properties, flipY: !selectedAsset.properties?.flipY } })}
                        className={clsx("p-1.5 rounded-lg border transition-all", selectedAsset.properties?.flipY ? "bg-orange-500 border-orange-400 text-white" : "bg-black/20 border-theme text-muted hover:bg-black/40")}
                        title="Flip Vertical"
                    >
                        <FlipVertical size={12} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 p-3 bg-black/20 rounded-xl border border-theme">
                    <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-muted uppercase">Opacity</label>
                        <span className="text-[9px] font-mono text-main">{Math.round((selectedAsset.properties?.opacity ?? 1) * 100)}%</span>
                    </div>
                    <input
                        type="range" min="0" max="1" step="0.05"
                        value={selectedAsset.properties?.opacity ?? 1}
                        onChange={(e) => handlePropertyChange('opacity', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                </div>
                <div className="space-y-2 p-3 bg-black/20 rounded-xl border border-theme flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[9px] font-bold text-muted uppercase">Fixed Ratio</label>
                    </div>
                    <button
                        onClick={() => handlePropertyChange('freeTransform', !selectedAsset.properties?.freeTransform)}
                        className={clsx(
                            "w-full py-1.5 rounded text-[8px] font-black uppercase transition-all border",
                            !selectedAsset.properties?.freeTransform ? "bg-orange-600 border-orange-500 text-white" : "bg-black/40 border-theme text-muted"
                        )}
                    >
                        {!selectedAsset.properties?.freeTransform ? 'On' : 'Off'}
                    </button>
                </div>
            </div>

            <button
                onClick={() => updateAsset(selectedAsset.id, { snapToGrid: !selectedAsset.snapToGrid })}
                className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    selectedAsset.snapToGrid !== false ? 'bg-orange-600 border-orange-500 text-white shadow-lg' : 'bg-black/20 border-theme text-muted hover:bg-black/40'
                }`}
            >
                <Magnet size={16} />
                <span className="text-[10px] font-black uppercase tracking-tighter">
                    {selectedAsset.snapToGrid !== false ? 'Snap to Grid: On' : 'Snap to Grid: Off'}
                </span>
            </button>
          </div>
        )}

        {selectedAsset && !isText && (
          <div className="space-y-4 p-4 bg-black/20 rounded-2xl border border-orange-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <Sun size={14} /> Shadow FX
                </label>
                <button
                    onClick={() => handlePropertyChange('shadow', { 
                        ...(selectedAsset.properties?.shadow || { opacity: 0.6, blur: 15, x: 30, y: 0 }),
                        enabled: !selectedAsset.properties?.shadow?.enabled 
                    })}
                    className={clsx(
                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border",
                        selectedAsset.properties?.shadow?.enabled ? "bg-orange-600 border-orange-500 text-white" : "bg-black/40 border-theme text-muted"
                    )}
                >
                    {selectedAsset.properties?.shadow?.enabled ? 'Enabled' : 'Disabled'}
                </button>
            </div>

            {selectedAsset.properties?.shadow?.enabled && (
                <div className="space-y-4 pt-2">
                    <button
                        onClick={() => handlePropertyChange('shadow', { 
                            ...selectedAsset.properties?.shadow, 
                            useDynamicDirection: !selectedAsset.properties?.shadow?.useDynamicDirection 
                        })}
                        className={`w-full flex items-center justify-center gap-2 p-2 rounded-xl border transition-all ${
                            selectedAsset.properties?.shadow?.useDynamicDirection !== false ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-black/20 border-theme text-muted hover:bg-black/40'
                        }`}
                    >
                        <Sun size={12} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">
                            {selectedAsset.properties?.shadow?.useDynamicDirection !== false ? 'Dynamic Direction: On' : 'Dynamic Direction: Off'}
                        </span>
                    </button>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-muted uppercase">Shadow Opacity</label>
                            <span className="text-[9px] font-mono text-main">{Math.round((selectedAsset.properties?.shadow?.opacity ?? 0.6) * 100)}%</span>
                        </div>
                        <input
                            type="range" min="0" max="1" step="0.05"
                            value={selectedAsset.properties?.shadow?.opacity ?? 0.6}
                            onChange={(e) => handlePropertyChange('shadow', { ...selectedAsset.properties?.shadow, opacity: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-muted uppercase">Shadow Blur</label>
                            <span className="text-[9px] font-mono text-main">{selectedAsset.properties?.shadow?.blur ?? 15}px</span>
                        </div>
                        <input
                            type="range" min="0" max="50" step="1"
                            value={selectedAsset.properties?.shadow?.blur ?? 15}
                            onChange={(e) => handlePropertyChange('shadow', { ...selectedAsset.properties?.shadow, blur: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-muted uppercase">Shadow Distance</label>
                            <span className="text-[9px] font-mono text-main">{selectedAsset.properties?.shadow?.x ?? 30}px</span>
                        </div>
                        <input
                            type="range" min="0" max="200" step="1"
                            value={selectedAsset.properties?.shadow?.x ?? 30}
                            onChange={(e) => handlePropertyChange('shadow', { ...selectedAsset.properties?.shadow, x: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-muted uppercase">Shadow Angle</label>
                            <span className="text-[9px] font-mono text-main">{selectedAsset.properties?.shadow?.direction ?? 45}°</span>
                        </div>
                        <input
                            type="range" min="0" max="360" step="1"
                            value={selectedAsset.properties?.shadow?.direction ?? 45}
                            onChange={(e) => handlePropertyChange('shadow', { ...selectedAsset.properties?.shadow, direction: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                    </div>
                </div>
            )}
          </div>
        )}

        {selectedLight && (
          <div className="space-y-4 p-4 bg-black/20 rounded-2xl border border-orange-500/10">
            <label className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                <Sun size={14} /> Light Settings
            </label>
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-muted uppercase block px-1">Color</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={selectedLight.color}
                            onChange={(e) => updatePointLight(selectedLight.id, { color: e.target.value })}
                            className="flex-1 h-8 rounded bg-black/20 border-theme cursor-pointer"
                        />
                        <input
                            type="text"
                            value={selectedLight.color}
                            onChange={(e) => updatePointLight(selectedLight.id, { color: e.target.value })}
                            className="w-20 bg-black/20 border-theme rounded px-2 py-1 text-xs text-main outline-none focus:border-orange-500"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-muted uppercase">Radius</label>
                        <span className="text-[9px] font-mono text-main">{selectedLight.radius}px</span>
                    </div>
                    <input
                        type="range" min="50" max="2000" step="10"
                        value={selectedLight.radius}
                        onChange={(e) => updatePointLight(selectedLight.id, { radius: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-muted uppercase">Intensity</label>
                        <span className="text-[9px] font-mono text-main">{Math.round(selectedLight.intensity * 100)}%</span>
                    </div>
                    <input
                        type="range" min="0" max="2" step="0.05"
                        value={selectedLight.intensity}
                        onChange={(e) => updatePointLight(selectedLight.id, { intensity: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                </div>
            </div>
          </div>
        )}

        {isText && selectedAsset && (
            <div className="space-y-4 p-4 bg-black/20 rounded-2xl border border-orange-500/10">
                <label className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <Type size={14} /> Text Editor
                </label>
                
                <div className="space-y-3">
                    <textarea 
                        value={selectedAsset.properties?.text || ''}
                        onChange={(e) => handlePropertyChange('text', e.target.value)}
                        placeholder="Enter text..."
                        className="w-full h-24 bg-black/40 border border-theme rounded-xl p-3 text-xs text-main outline-none focus:border-orange-500 transition-colors resize-none"
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[8px] font-bold text-muted uppercase px-1">Size</label>
                            <input 
                                type="number" 
                                value={selectedAsset.properties?.fontSize || 24}
                                onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value) || 1)}
                                className="w-full bg-black/40 border border-theme rounded-lg px-2 py-1.5 text-xs text-main outline-none focus:border-orange-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-bold text-muted uppercase px-1">Color</label>
                            <input 
                                type="color" 
                                value={selectedAsset.properties?.fill || '#000000'}
                                onChange={(e) => handlePropertyChange('fill', e.target.value)}
                                className="w-full h-8 bg-black/40 border border-theme rounded-lg cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                        <button 
                            onClick={() => handlePropertyChange('fontStyle', selectedAsset.properties?.fontStyle === 'bold' ? 'normal' : 'bold')}
                            className={clsx("p-2 rounded-lg border transition-all", selectedAsset.properties?.fontStyle === 'bold' ? "bg-orange-500 border-orange-400 text-white" : "bg-black/20 border-theme text-muted")}
                        >
                            <Bold size={12} />
                        </button>
                        <button 
                            onClick={() => handlePropertyChange('fontStyle', selectedAsset.properties?.fontStyle === 'italic' ? 'normal' : 'italic')}
                            className={clsx("p-2 rounded-lg border transition-all", selectedAsset.properties?.fontStyle === 'italic' ? "bg-orange-500 border-orange-400 text-white" : "bg-black/20 border-theme text-muted")}
                        >
                            <Italic size={12} />
                        </button>
                        <div className="w-[1px] h-8 bg-theme mx-1" />
                        <button 
                            onClick={() => handlePropertyChange('align', 'left')}
                            className={clsx("p-2 rounded-lg border transition-all", (selectedAsset.properties?.align || 'left') === 'left' ? "bg-orange-500 border-orange-400 text-white" : "bg-black/20 border-theme text-muted")}
                        >
                            <AlignLeft size={12} />
                        </button>
                        <button 
                            onClick={() => handlePropertyChange('align', 'center')}
                            className={clsx("p-2 rounded-lg border transition-all", selectedAsset.properties?.align === 'center' ? "bg-orange-500 border-orange-400 text-white" : "bg-black/20 border-theme text-muted")}
                        >
                            <AlignCenter size={12} />
                        </button>
                        <button 
                            onClick={() => handlePropertyChange('align', 'right')}
                            className={clsx("p-2 rounded-lg border transition-all", selectedAsset.properties?.align === 'right' ? "bg-orange-500 border-orange-400 text-white" : "bg-black/20 border-theme text-muted")}
                        >
                            <AlignRight size={12} />
                        </button>
                    </div>

                    <div className="pt-2">
                        <FontLibrarySelector 
                            currentFont={selectedAsset.properties?.fontFamily || 'Arial'}
                            onSelect={(font) => handlePropertyChange('fontFamily', font)}
                        />
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
