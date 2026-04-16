import React, { useState, useEffect } from 'react';
import { MapMetadata, GridType, MapState } from '../../types/map';
import { Settings, Check, X, Grid, Eye, EyeOff, Magnet } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useMapStore } from '../../store/useMapStore';

interface MapSettingsProps {
    map: MapState;
    onUpdate: (id: string, updates: Partial<MapState>) => void;
    isActive?: boolean;
}

export const MapSettings: React.FC<MapSettingsProps> = ({ map, onUpdate, isActive }) => {
  const defaultGridType = useProjectStore(s => s.defaultGridType);
  const [localName, setLocalName] = useState(map.metadata.name);
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    setLocalName(map.metadata.name);
  }, [map.metadata.name]);

  const handleSaveName = () => {
    const newName = localName.trim() || 'Untitled Map';
    onUpdate(map.id, { metadata: { ...map.metadata, name: newName } });
    setIsEditingName(false);
  };

  const handleCancelName = () => {
    setLocalName(map.metadata.name);
    setIsEditingName(false);
  };

  return (
    <div className="flex flex-col bg-black/40 rounded-lg border border-theme overflow-hidden p-3 gap-4">
      {/* Metadata Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings size={12} className="text-orange-500" />
          <h4 className="text-[9px] font-bold uppercase text-muted tracking-wider">Configuration</h4>
        </div>
        
        <div>
          <label className="text-[9px] text-muted uppercase font-bold mb-1 block">Map Name</label>
          <div className="flex gap-1">
              <input
                  type="text"
                  value={localName}
                  onChange={(e) => { setLocalName(e.target.value); setIsEditingName(true); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') handleCancelName(); }}
                  className="flex-1 bg-black/20 border border-theme rounded px-2 py-1 text-[10px] text-main outline-none focus:border-orange-500 transition-colors font-bold"
              />
              {isEditingName && (
                  <div className="flex gap-1 animate-in fade-in zoom-in duration-200">
                      <button onClick={handleSaveName} className="p-1 bg-green-600 hover:bg-green-500 text-white rounded"><Check size={12} /></button>
                      <button onClick={handleCancelName} className="p-1 bg-black/40 border border-theme text-muted rounded"><X size={12} /></button>
                  </div>
              )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-muted uppercase font-bold mb-1 block text-center">Width (px)</label>
            <input
              type="number"
              value={map.metadata.resolution.width}
              onChange={(e) => onUpdate(map.id, { metadata: { ...map.metadata, resolution: { ...map.metadata.resolution, width: parseInt(e.target.value) || 0 } } })}
              className="w-full bg-black/20 border border-theme rounded px-2 py-1 text-[10px] text-main text-center outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="text-[9px] text-muted uppercase font-bold mb-1 block text-center">Height (px)</label>
            <input
              type="number"
              value={map.metadata.resolution.height}
              onChange={(e) => onUpdate(map.id, { metadata: { ...map.metadata, resolution: { ...map.metadata.resolution, height: parseInt(e.target.value) || 0 } } })}
              className="w-full bg-black/20 border border-theme rounded px-2 py-1 text-[10px] text-main text-center outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[9px] text-muted uppercase font-bold mb-1 block">Canvas Color</label>
          <div className="grid grid-cols-3 gap-1">
              {[
                  { label: 'Paper', color: '#c3c3c3' },
                  { label: 'White', color: '#ffffff' },
                  { label: 'Black', color: '#000000' }
              ].map(opt => (
                  <button
                      key={opt.label}
                      onClick={() => onUpdate(map.id, { metadata: { ...map.metadata, backgroundColor: opt.color } })}
                      className={`py-1 rounded text-[8px] font-black uppercase transition-all border ${
                          map.metadata.backgroundColor === opt.color ? 'bg-orange-600 border-orange-500 text-white' : 'bg-black/20 border-theme text-muted'
                      }`}
                  >
                      {opt.label}
                  </button>
              ))}
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="space-y-3 pt-3 border-t border-theme/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid size={12} className="text-orange-500" />
            <h4 className="text-[9px] font-bold uppercase text-muted tracking-wider">Grid Controls</h4>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onUpdate(map.id, { grid: { ...map.grid, visible: !map.grid.visible } })}
              className={`p-1 rounded ${map.grid.visible ? 'bg-orange-600 text-white' : 'bg-black/40 text-muted'}`}
            >
              {map.grid.visible ? <Eye size={10} /> : <EyeOff size={10} />}
            </button>
            <button
              onClick={() => onUpdate(map.id, { grid: { ...map.grid, snapToGrid: !map.grid.snapToGrid } })}
              className={`p-1 rounded ${map.grid.snapToGrid ? 'bg-orange-600 text-white' : 'bg-black/40 text-muted'}`}
            >
              <Magnet size={10} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-muted uppercase font-bold px-1">Grid Style</label>
            <select
                value={map.grid.type}
                onChange={(e) => onUpdate(map.id, { grid: { ...map.grid, type: e.target.value as GridType } })}
                className="bg-black/20 border border-theme rounded px-1 py-1 text-[9px] text-main outline-none"
            >
                <option value="none">None {defaultGridType === 'none' && '(Default)'}</option>
                <option value="square">Square {defaultGridType === 'square' && '(Default)'}</option>
                <option value="hex-pointy" disabled className="opacity-50 italic">Hex P. (Soon)</option>
                <option value="hex-flat" disabled className="opacity-50 italic">Hex F. (Soon)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-muted uppercase font-bold px-1">Cell Size</label>
            <input
                type="number"
                value={map.grid.size}
                onChange={(e) => onUpdate(map.id, { grid: { ...map.grid, size: parseInt(e.target.value) || 50 } })}
                className="w-full bg-black/20 border border-theme rounded px-2 py-1 text-[10px] text-main text-center outline-none"
            />
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex justify-between items-center">
            <label className="text-[9px] text-muted uppercase font-bold">Grid Opacity</label>
            <span className="text-[9px] font-mono text-muted">{Math.round((map.grid.opacity ?? 1) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={map.grid.opacity ?? 1}
            onChange={(e) => onUpdate(map.id, { grid: { ...map.grid, opacity: parseFloat(e.target.value) } })}
            className="w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        <div className="flex items-center justify-between bg-black/20 p-2 rounded-md border border-theme">
          <label className="text-[9px] text-muted uppercase font-bold">Grid Color</label>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-main uppercase">{map.grid.color || '#666666'}</span>
            <input
                type="color"
                value={map.grid.color || '#666666'}
                onChange={(e) => onUpdate(map.id, { grid: { ...map.grid, color: e.target.value } })}
                className="w-6 h-4 bg-transparent border-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
