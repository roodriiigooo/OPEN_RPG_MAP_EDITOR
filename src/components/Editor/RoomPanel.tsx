import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { useRoomStore } from '../../store/useRoomStore';
import { Info, Plus, Eraser, Square, Fence, Paintbrush } from 'lucide-react';
import { AssetCatalog } from './AssetCatalog';

export const RoomPanel: React.FC = () => {
  const activeTool = useEditorStore((state) => state.activeTool);
  const { mode, setMode } = useRoomStore();
  
  if (activeTool !== 'room') return null;

  return (
    <div className="flex flex-col h-full bg-panel">
      {/* Modes & Settings Header */}
      <div className="flex flex-col gap-4 p-4 border-b border-theme bg-black/10">
        <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                <Square size={14} className="text-orange-500" />
                Room Builder
            </h3>
            <div className="flex bg-black/20 rounded-lg p-1 border border-theme">
            <button
                onClick={() => setMode('add')}
                className={`p-2 rounded-md transition-all ${mode === 'add' ? 'bg-orange-600 text-white shadow-lg' : 'text-muted hover:text-main'}`}
                title="Add Room"
            >
                <Plus size={18} />
            </button>
            <button
                onClick={() => setMode('erase')}
                className={`p-2 rounded-md transition-all ${mode === 'erase' ? 'bg-red-600 text-white shadow-lg' : 'text-muted hover:text-main'}`}
                title="Erase Area"
            >
                <Eraser size={18} />
            </button>
            </div>
        </div>

        <div className="bg-orange-500/5 border border-orange-500/20 p-3 rounded-lg flex gap-3">
            <Info size={18} className="text-orange-500 shrink-0" />
            <p className="text-[9px] text-muted leading-relaxed uppercase font-bold tracking-tighter">
            {mode === 'add' 
                ? "Define area. Selected Wall & Terrain will be applied automatically."
                : "Erase area. This will cut or remove existing rooms and their walls."}
            </p>
        </div>
      </div>

      {/* Asset Selection Sections */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/5">
        <div className="p-4 bg-black/20 border-b border-theme">
            <div className="flex items-center gap-2 mb-4">
                <Fence size={14} className="text-orange-500" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-main">Select Wall Style</h4>
            </div>
            {/* Height adjusted to show approx 8 cards (4 rows of 2) without internal scrollbar */}
            <div className="h-[520px] rounded-xl border border-theme overflow-hidden">
                <AssetCatalog mode="room-wall" />
            </div>
        </div>

        <div className="p-4 bg-black/20">
            <div className="flex items-center gap-2 mb-4">
                <Paintbrush size={14} className="text-orange-500" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-main">Select Floor Terrain</h4>
            </div>
            {/* Height adjusted to show approx 8 cards (4 rows of 2) without internal scrollbar */}
            <div className="h-[520px] rounded-xl border border-theme overflow-hidden">
                <AssetCatalog mode="room-terrain" />
            </div>
        </div>
      </div>
    </div>
  );
};
