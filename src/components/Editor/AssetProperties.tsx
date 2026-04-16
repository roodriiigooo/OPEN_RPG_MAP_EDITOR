import React from 'react';
import { useMapStore } from '../../store/useMapStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useTextStore } from '../../store/useTextStore';
import { 
    Sliders, FlipHorizontal, FlipVertical, Trash2, Square, Sun, RotateCw, 
    Maximize, Magnet, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Copy
} from 'lucide-react';
import { clsx } from 'clsx';

export const AssetProperties: React.FC = () => {
  // 1. ALL HOOKS
  const assets = useMapStore((state) => state.assets);
  const selectedAssetIds = useMapStore((state) => state.selectedAssetIds);
  const selectedRoomId = useMapStore((state) => state.selectedRoomId);
  const pointLights = useMapStore((state) => state.lighting.pointLights);
  const updateAsset = useMapStore((state) => state.updateAsset);
  const updatePointLight = useMapStore((state) => state.updatePointLight);
  const removeAsset = useMapStore((state) => state.removeAsset);
  const removePointLight = useMapStore((state) => state.removePointLight);
  const { showConfirm } = useNotificationStore();
  const { customFontFamilies } = useTextStore();

  // 2. DERIVED STATE
  const selectedAsset = assets.find((a) => a.id === selectedAssetIds[0]);
  const selectedLight = pointLights.find((l) => l.id === selectedAssetIds[0]);
  const isText = selectedAsset?.type === 'text';

  const systemFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Trebuchet MS',
    'Alternity', 'Breathe Fire', 'Britannian', 'Dragnel', 'Dragonfly', 'Dragonwick', 
    'Eyvindr', 'High Drowic', 'Magna Veritas', 'Runewood', 'The Wild Breath of Zelda', 'Vecna'
  ];

  // 3. HANDLERS
  const handlePropertyChange = (key: string, value: any) => {
    if (selectedAsset) {
      const transformKeys = ['x', 'y', 'rotation', 'scale'];
      if (transformKeys.includes(key)) {
        if (key === 'scale') {
          updateAsset(selectedAsset.id, { 
            scale: value,
            scaleX: value,
            scaleY: value
          });
        } else {
          updateAsset(selectedAsset.id, { [key]: value });
        }
      } else {
        updateAsset(selectedAsset.id, {
          properties: { ...selectedAsset.properties, [key]: value },
        });
      }
    } else if (selectedLight) {
      updatePointLight(selectedLight.id, { [key]: value });
    }
  };

  const handleDelete = () => {
    if (selectedAsset) removeAsset(selectedAsset.id);
    else if (selectedLight) removePointLight(selectedLight.id);
  };

  // 4. EARLY RETURNS
  if (selectedAssetIds.length > 1) {
      return (
          <div className="p-8 text-center flex flex-col items-center gap-4 opacity-40">
              <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center text-muted">
                  <Sliders size={24} />
              </div>
              <p className="text-[10px] text-muted leading-relaxed uppercase font-bold tracking-tighter">
                  Multiple objects selected.<br/>Properties are shown only with a single object selected.
              </p>
          </div>
      );
  }

  if (selectedRoomId === 'room-system') {
    return (
        <div className="p-4 bg-panel border-b border-theme space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Square size={16} className="text-orange-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-main">Room System</h3>
            </div>
            
            <div className="p-4 bg-black/20 rounded-xl border border-theme space-y-4">
                <p className="text-[10px] text-muted font-bold uppercase leading-relaxed">
                    The smart room system is managed globally per layer. 
                    Individual room segments cannot be transformed yet.
                </p>
                <button
                    onClick={() => {
                        showConfirm(
                            "Delete All Rooms?",
                            "This will permanently delete all room segments from the current layer.",
                            () => useMapStore.getState().resetState(),
                            { type: 'error', confirmLabel: 'Delete All' }
                        );
                    }}
                    className="w-full py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-900/30 transition-all"
                >
                    Clear All Rooms
                </button>
            </div>
        </div>
    );
  }

  if (!selectedAsset && !selectedLight) {
    return (
      <div className="p-12 text-center flex flex-col items-center gap-4 opacity-30">
        <div className="w-16 h-16 rounded-3xl bg-black/20 flex items-center justify-center text-muted border border-theme">
            <Sliders size={32} />
        </div>
        <p className="text-[10px] text-muted font-black uppercase tracking-widest leading-relaxed">
          No object selected.<br/>Click an element to view properties.
        </p>
      </div>
    );
  }

  // 5. RENDER
  return (
    <div className="p-4 bg-panel flex flex-col gap-6 overflow-y-auto custom-scrollbar h-full pb-20">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-main flex items-center gap-2">
            <Sliders size={14} className="text-orange-500" />
            {selectedLight ? 'Light Properties' : isText ? 'Text Properties' : 'Asset Properties'}
        </h3>
        <div className="flex gap-1">
            <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-900/40 text-muted hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-900/30"
                title="Delete Selection"
            >
                <Trash2 size={16} />
            </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Text Specific Settings */}
        {isText && selectedAsset && (
            <div className="space-y-4 p-4 bg-black/20 rounded-2xl border border-orange-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-orange-500">Text Content</label>
                    <textarea
                        value={selectedAsset.properties?.text || ''}
                        onChange={(e) => handlePropertyChange('text', e.target.value)}
                        className="w-full bg-black/40 border border-theme rounded-xl p-3 text-xs text-main outline-none focus:border-orange-500 min-h-[60px] font-bold"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-muted uppercase">Size</label>
                        <input
                            type="number"
                            value={selectedAsset.properties?.fontSize || 24}
                            onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value) || 12)}
                            className="w-full bg-black/40 border border-theme rounded-xl px-3 py-1.5 text-xs text-main outline-none focus:border-orange-500"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-muted uppercase">Color</label>
                        <div className="flex items-center gap-2 bg-black/40 border border-theme rounded-xl px-2 py-1">
                            <input
                                type="color"
                                value={selectedAsset.properties?.fill || '#000000'}
                                onChange={(e) => handlePropertyChange('fill', e.target.value)}
                                className="w-6 h-6 bg-transparent border-none cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-main uppercase">{selectedAsset.properties?.fill || '#000000'}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted uppercase">Font Family</label>
                    <select
                        value={selectedAsset.properties?.fontFamily || 'Arial'}
                        onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}
                        className="w-full bg-black/40 border border-theme rounded-xl px-3 py-1.5 text-xs text-main outline-none focus:border-orange-500"
                    >
                        <optgroup label="System Fonts">
                            {systemFonts.map(f => <option key={f} value={f}>{f}</option>)}
                        </optgroup>
                        {customFontFamilies.length > 0 && (
                            <optgroup label="Custom Fonts">
                                {customFontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
                            </optgroup>
                        )}
                    </select>
                </div>

                <div className="flex gap-2">
                    <div className="flex bg-black/40 border border-theme rounded-xl p-1 gap-1">
                        <button
                            onClick={() => {
                                const current = selectedAsset.properties?.fontStyle || 'normal';
                                const isBold = current.includes('bold');
                                const isItalic = current.includes('italic');
                                handlePropertyChange('fontStyle', `${!isBold ? 'bold' : ''} ${isItalic ? 'italic' : ''}`.trim() || 'normal');
                            }}
                            className={clsx("p-2 rounded-lg transition-all", selectedAsset.properties?.fontStyle?.includes('bold') ? "bg-orange-600 text-white" : "text-muted hover:bg-black/40")}
                        >
                            <Bold size={12} />
                        </button>
                        <button
                            onClick={() => {
                                const current = selectedAsset.properties?.fontStyle || 'normal';
                                const isBold = current.includes('bold');
                                const isItalic = current.includes('italic');
                                handlePropertyChange('fontStyle', `${isBold ? 'bold' : ''} ${!isItalic ? 'italic' : ''}`.trim() || 'normal');
                            }}
                            className={clsx("p-2 rounded-lg transition-all", selectedAsset.properties?.fontStyle?.includes('italic') ? "bg-orange-600 text-white" : "text-muted hover:bg-black/40")}
                        >
                            <Italic size={12} />
                        </button>
                    </div>
                    <div className="flex-1 flex bg-black/40 border border-theme rounded-xl p-1 gap-1">
                        {(['left', 'center', 'right'] as const).map(a => (
                            <button
                                key={a}
                                onClick={() => handlePropertyChange('align', a)}
                                className={clsx("flex-1 flex items-center justify-center p-2 rounded-lg transition-all", selectedAsset.properties?.align === a ? "bg-orange-600 text-white" : "text-muted hover:bg-black/40")}
                            >
                                {a === 'left' && <AlignLeft size={12} />}
                                {a === 'center' && <AlignCenter size={12} />}
                                {a === 'right' && <AlignRight size={12} />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Transform Group */}
        <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-2">Transform</label>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[9px] text-muted uppercase font-bold px-1">X Position</label>
                    <input
                        type="number"
                        value={Math.round(selectedAsset?.x ?? selectedLight?.x ?? 0)}
                        onChange={(e) => handlePropertyChange('x', parseInt(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-theme rounded-xl px-3 py-2 text-xs text-main outline-none focus:border-orange-500 transition-colors font-mono"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[9px] text-muted uppercase font-bold px-1">Y Position</label>
                    <input
                        type="number"
                        value={Math.round(selectedAsset?.y ?? selectedLight?.y ?? 0)}
                        onChange={(e) => handlePropertyChange('y', parseInt(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-theme rounded-xl px-3 py-2 text-xs text-main outline-none focus:border-orange-500 transition-colors font-mono"
                    />
                </div>
            </div>

            {selectedAsset && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[9px] text-muted uppercase font-bold px-1 flex items-center gap-1.5">
                            <RotateCw size={10} /> Rotation
                        </label>
                        <input
                            type="number"
                            value={Math.round(selectedAsset.rotation)}
                            onChange={(e) => handlePropertyChange('rotation', parseInt(e.target.value) || 0)}
                            className="w-full bg-black/40 border border-theme rounded-xl px-3 py-2 text-xs text-main outline-none focus:border-orange-500 transition-colors font-mono"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] text-muted uppercase font-bold px-1 flex items-center gap-1.5">
                            <Maximize size={10} /> Scale
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={selectedAsset.scaleX ?? selectedAsset.scale}
                            onChange={(e) => handlePropertyChange('scale', parseFloat(e.target.value) || 1)}
                            className="w-full bg-black/40 border border-theme rounded-xl px-3 py-2 text-xs text-main outline-none focus:border-orange-500 transition-colors font-mono"
                        />
                    </div>
                </div>
            )}
        </div>

        {selectedAsset && (
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-2">Appearance</label>
            
            <div className="space-y-2 px-1">
                <div className="flex justify-between items-center mb-1">
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

            {!isText && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                        onClick={() => handlePropertyChange('flipX', !selectedAsset.properties?.flipX)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                        selectedAsset.properties?.flipX ? 'bg-orange-600 border-orange-500 text-white shadow-lg' : 'bg-black/20 border-theme text-muted hover:bg-black/40'
                        }`}
                    >
                        <FlipHorizontal size={16} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Flip X</span>
                    </button>
                    <button
                        onClick={() => handlePropertyChange('flipY', !selectedAsset.properties?.flipY)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                        selectedAsset.properties?.flipY ? 'bg-orange-600 border-orange-500 text-white shadow-lg' : 'bg-black/20 border-theme text-muted hover:bg-black/40'
                        }`}
                    >
                        <FlipVertical size={16} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Flip Y</span>
                    </button>
                </div>
            )}

            <button
                onClick={() => handlePropertyChange('freeTransform', !selectedAsset.properties?.freeTransform)}
                className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    selectedAsset.properties?.freeTransform ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-black/20 border-theme text-muted hover:bg-black/40'
                }`}
            >
                <Maximize size={16} />
                <span className="text-[10px] font-black uppercase tracking-tighter">
                    {selectedAsset.properties?.freeTransform ? 'Fixed Ratio: Off' : 'Fixed Ratio: On'}
                </span>
            </button>

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

        {selectedLight && (
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-2">Lighting FX</label>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-muted uppercase">Radius</label>
                    <span className="text-[9px] font-mono text-main">{selectedLight.radius}px</span>
                </div>
                <input
                  type="range" min="50" max="1000" step="10"
                  value={selectedLight.radius}
                  onChange={(e) => handlePropertyChange('radius', parseInt(e.target.value))}
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
                  onChange={(e) => handlePropertyChange('intensity', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-muted uppercase block px-1">Light Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={selectedLight.color}
                    onChange={(e) => handlePropertyChange('color', e.target.value)}
                    className="flex-1 h-8 rounded bg-black/20 border-theme cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedLight.color}
                    onChange={(e) => handlePropertyChange('color', e.target.value)}
                    className="w-20 bg-black/20 border-theme rounded px-2 py-1 text-xs text-main outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
