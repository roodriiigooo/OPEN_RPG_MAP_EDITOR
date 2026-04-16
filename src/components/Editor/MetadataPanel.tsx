import React from 'react';
import { useMapStore } from '../../store/useMapStore';
import { useEditorStore, EditorTheme } from '../../store/useEditorStore';
import { Palette } from 'lucide-react';

export const MetadataPanel: React.FC = () => {
  const metadata = useMapStore((state) => state.metadata);
  const updateMetadata = useMapStore((state) => state.updateMetadata);
  const { theme, setTheme } = useEditorStore();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateMetadata({ ...metadata, name: e.target.value });
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value) || 0;
    updateMetadata({
      ...metadata,
      resolution: { ...metadata.resolution, width },
    });
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = parseInt(e.target.value) || 0;
    updateMetadata({
      ...metadata,
      resolution: { ...metadata.resolution, height },
    });
  };

  const handleRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateMetadata({ ...metadata, ratio: e.target.value });
  };

  return (
    <div className="p-4 bg-panel text-main flex flex-col gap-4 border-r border-theme h-full w-64">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted">Map Metadata</h2>
      
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-muted">Map Name</label>
        <input
          type="text"
          value={metadata.name}
          onChange={handleNameChange}
          className="bg-black/20 border border-theme rounded px-2 py-1 text-xs outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-muted">Width (px)</label>
        <input
          type="number"
          value={metadata.resolution.width}
          onChange={handleWidthChange}
          className="bg-black/20 border border-theme rounded px-2 py-1 text-xs outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-muted">Height (px)</label>
        <input
          type="number"
          value={metadata.resolution.height}
          onChange={handleHeightChange}
          className="bg-black/20 border border-theme rounded px-2 py-1 text-xs outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-muted">Ratio</label>
        <input
          type="text"
          value={metadata.ratio}
          onChange={handleRatioChange}
          className="bg-black/20 border border-theme rounded px-2 py-1 text-xs outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-theme flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase text-muted flex items-center gap-2">
            <Palette size={12} className="text-orange-500" />
            Editor Theme
        </label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as EditorTheme)}
          className="bg-black/40 border border-theme rounded px-2 py-1.5 text-xs text-main outline-none focus:border-orange-500 transition-colors font-bold uppercase tracking-wider"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="dracula">Dracula</option>
          <option value="comic">Comic</option>
          <option value="high-contrast">High Contrast</option>
        </select>
      </div>
    </div>
  );
};
