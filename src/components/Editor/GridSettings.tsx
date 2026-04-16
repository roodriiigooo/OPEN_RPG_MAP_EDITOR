import React from 'react';
import { useMapStore } from '../../store/useMapStore';
import { Grid, Eye, EyeOff, Magnet } from 'lucide-react';
import { GridType } from '../../types/map';

export const GridSettings: React.FC = () => {
  const grid = useMapStore((state) => state.grid);
  const updateGrid = useMapStore((state) => state.updateGrid);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateGrid({ type: e.target.value as GridType });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateGrid({ size: parseInt(e.target.value) || 50 });
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateGrid({ opacity: parseFloat(e.target.value) });
  };

  return (
    <div className="p-4 border-t border-theme bg-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
          <Grid size={14} className="text-orange-500" /> Grid Settings
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => updateGrid({ visible: !grid.visible })}
            className={`p-1.5 rounded-md transition-colors ${
              grid.visible ? 'bg-orange-500/20 text-orange-400' : 'text-muted hover:text-main'
            }`}
            title={grid.visible ? 'Hide Grid' : 'Show Grid'}
          >
            {grid.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button
            onClick={() => updateGrid({ snapToGrid: !grid.snapToGrid })}
            className={`p-1.5 rounded-md transition-colors ${
              grid.snapToGrid ? 'bg-orange-500/20 text-orange-400' : 'text-muted hover:text-main'
            }`}
            title={grid.snapToGrid ? 'Disable Snapping' : 'Enable Snapping'}
          >
            <Magnet size={16} className={grid.snapToGrid ? '' : 'opacity-50'} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Type */}
        <div>
          <label className="text-[10px] font-bold text-muted uppercase block mb-1">Grid Type</label>
          <select
            value={grid.type}
            onChange={handleTypeChange}
            className="w-full bg-black/20 border border-theme rounded px-2 py-1.5 text-xs text-main outline-none focus:border-orange-500 font-bold uppercase"
          >
            <option value="none">No Grid</option>
            <option value="square">Square</option>
            <option value="hex-pointy">Hex (Pointy Top)</option>
            <option value="hex-flat">Hex (Flat Top)</option>
          </select>
        </div>

        {/* Size */}
        <div>
          <label className="text-[10px] font-bold text-muted uppercase block mb-1">Grid Size (px)</label>
          <input
            type="number"
            min="10"
            max="500"
            value={grid.size}
            onChange={handleSizeChange}
            className="w-full bg-black/20 border border-theme rounded px-2 py-1.5 text-xs text-main outline-none focus:border-orange-500 font-bold"
          />
        </div>

        {/* Opacity */}
        <div>
          <label className="text-[10px] font-bold text-muted uppercase block mb-1">Grid Opacity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={grid.opacity}
            onChange={handleOpacityChange}
            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>
      </div>
    </div>
  );
};
