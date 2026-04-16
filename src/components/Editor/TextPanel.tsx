import React, { useRef } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { useEditorStore } from '../../store/useEditorStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useTextStore } from '../../store/useTextStore';
import { useCustomFonts } from '../../hooks/useCustomFonts';
import { Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Upload } from 'lucide-react';
import { clsx } from 'clsx';

export const TextPanel: React.FC = () => {
  const {
    text, setText,
    fontSize, setFontSize,
    fontFamily, setFontFamily,
    customFontFamilies,
    color, setColor,
    isBold, setIsBold,
    isItalic, setIsItalic,
    align, setAlign
  } = useTextStore();

  const { activeLayerId, addAsset } = useMapStore();
  const { showToast } = useNotificationStore();
  const { importFont } = useCustomFonts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddText = () => {
    if (!activeLayerId) {
        showToast("No active layer", "Select a layer in the Object Tree first.", "warn");
        return;
    }

    const { layers } = useMapStore.getState();
    const layer = layers.find(l => l.id === activeLayerId);
    if (layer?.type === 'background' || layer?.type === 'terrain' || layer?.type === 'wall') {
        showToast("Restricted Layer", "Text can only be added to Object layers.", "warn");
        return;
    }

    addAsset({
      id: crypto.randomUUID(),
      layerId: activeLayerId,
      type: 'text',
      name: text.substring(0, 20) || 'Text',
      x: 500, // Default position, should ideally be center of view
      y: 500,
      rotation: 0,
      scale: 1,
      visible: true,
      locked: false,
      snapToGrid: false,
      properties: {
        text,
        fontSize,
        fontFamily,
        fill: color,
        fontStyle: `${isBold ? 'bold' : ''} ${isItalic ? 'italic' : ''}`.trim() || 'normal',
        align,
        opacity: 1
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const family = await importFont(file);
        setFontFamily(family);
        showToast("Font Imported", `Successfully loaded ${family}`, "success");
      } catch (err: any) {
        showToast("Import Failed", err.message, "error");
      }
    }
  };

  const systemFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Trebuchet MS',
    'Alternity', 'Breathe Fire', 'Britannian', 'Dragnel', 'Dragonfly', 'Dragonwick', 
    'Eyvindr', 'High Drowic', 'Magna Veritas', 'Runewood', 'The Wild Breath of Zelda', 'Vecna'
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Text Content</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your text here..."
          className="w-full bg-black/40 border border-theme rounded-xl p-3 text-xs text-main outline-none focus:border-orange-500 min-h-[80px] font-bold"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted">Font Size</label>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
            className="w-full bg-black/40 border border-theme rounded-xl px-3 py-2 text-xs text-main outline-none focus:border-orange-500 font-mono"
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted">Color</label>
          <div className="flex items-center gap-2 bg-black/40 border border-theme rounded-xl px-3 py-1.5">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-6 h-6 bg-transparent border-none cursor-pointer"
            />
            <span className="text-[10px] font-mono text-main uppercase">{color}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted">Font Family</label>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-[9px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-1.5 hover:text-orange-400 transition-colors"
          >
            <Upload size={12} /> Import Font
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden" 
          />
        </div>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="w-full bg-black/40 border border-theme rounded-xl px-3 py-2 text-xs text-main outline-none focus:border-orange-500"
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

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Style & Alignment</label>
        <div className="flex gap-2">
          <div className="flex bg-black/40 border border-theme rounded-xl p-1 gap-1">
            <button
              onClick={() => setIsBold(!isBold)}
              className={clsx("p-2 rounded-lg transition-all", isBold ? "bg-orange-600 text-white" : "text-muted hover:bg-black/40")}
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => setIsItalic(!isItalic)}
              className={clsx("p-2 rounded-lg transition-all", isItalic ? "bg-orange-600 text-white" : "text-muted hover:bg-black/40")}
            >
              <Italic size={14} />
            </button>
          </div>
          <div className="flex-1 flex bg-black/40 border border-theme rounded-xl p-1 gap-1">
            {(['left', 'center', 'right'] as const).map(a => (
              <button
                key={a}
                onClick={() => setAlign(a)}
                className={clsx("flex-1 flex items-center justify-center p-2 rounded-lg transition-all", align === a ? "bg-orange-600 text-white" : "text-muted hover:bg-black/40")}
              >
                {a === 'left' && <AlignLeft size={14} />}
                {a === 'center' && <AlignCenter size={14} />}
                {a === 'right' && <AlignRight size={14} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleAddText}
        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/40 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group"
      >
        <Type size={16} className="group-hover:scale-110 transition-transform" />
        Add Text to Map
      </button>
    </div>
  );
};
