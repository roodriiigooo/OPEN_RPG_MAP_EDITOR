import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { MousePointer2, Hand, Stamp, Paintbrush, Fence, Lightbulb, Square, Settings2, Layers, LayoutGrid, Type } from 'lucide-react';
import { MetadataPanel } from './MetadataPanel';
import { AssetCatalog } from './AssetCatalog';
import { TerrainPanel } from './TerrainPanel';
import { WallTool } from './WallTool';
import { LightingPanel } from './LightingPanel';
import { RoomPanel } from './RoomPanel';
import { TextPanel } from './TextPanel';
import { LevelManager } from './LevelManager';
import { clsx } from 'clsx';

const ToolHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
    <div className="p-6 border-b border-theme bg-black/20 flex flex-col gap-1">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-lg text-white shadow-lg shadow-orange-900/40">
                {icon}
            </div>
            <h2 className="text-lg font-black uppercase tracking-widest text-main leading-tight">{title}</h2>
        </div>
        <p className="text-[10px] text-muted font-bold uppercase tracking-tighter ml-11 opacity-60">{subtitle}</p>
    </div>
);

export const ToolPanel: React.FC = () => {
  const activeTool = useEditorStore((state) => state.activeTool);
  const selectionMode = useEditorStore(s => s.selectionMode);
  const setSelectionMode = useEditorStore(s => s.setSelectionMode);

  const renderContent = () => {
    switch (activeTool) {
      case 'room':
        return (
          <div className="flex flex-col h-full">
            <ToolHeader 
                icon={<Square size={20} />} 
                title="Room Builder" 
                subtitle="Smart room generation & CSG"
            />
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <RoomPanel />
            </div>
          </div>
        );
      case 'hand':
        return (
          <div className="flex flex-col h-full">
            <ToolHeader 
                icon={<Hand size={20} />} 
                title="Pan Tool" 
                subtitle="Navigate through the canvas"
            />
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/5">
                <div className="w-20 h-20 rounded-3xl bg-black/20 flex items-center justify-center text-muted mb-6">
                    <Hand size={40} />
                </div>
                <h2 className="text-sm font-black text-main uppercase tracking-widest mb-3">Navigation</h2>
                <p className="text-[10px] text-muted leading-relaxed uppercase font-bold tracking-tight max-w-[200px]">
                    Click and drag anywhere on the canvas to move your view.
                </p>
                <div className="mt-8 p-4 bg-orange-600/10 rounded-2xl border border-orange-500/20">
                    <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest">Quick Tip</p>
                    <p className="text-[10px] text-muted font-bold uppercase mt-1">You can also use the Middle Mouse Button at any time!</p>
                </div>
            </div>
          </div>
        );
      case 'select':
        return (
          <div className="flex flex-col h-full">
            <ToolHeader 
                icon={<MousePointer2 size={20} />} 
                title="Selection" 
                subtitle="Manage and transform objects"
            />
            
            <div className="p-4 space-y-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Selection Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => setSelectionMode('single')}
                            className={clsx(
                                "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group",
                                selectionMode === 'single' 
                                    ? "bg-orange-600/10 border-orange-500 text-orange-500 shadow-lg shadow-orange-900/20" 
                                    : "bg-black/20 border-theme text-muted hover:border-muted hover:text-main"
                            )}
                        >
                            <MousePointer2 size={24} className={selectionMode === 'single' ? "animate-bounce" : ""} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Single Select</span>
                        </button>
                        <button 
                            onClick={() => setSelectionMode('area')}
                            className={clsx(
                                "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group",
                                selectionMode === 'area' 
                                    ? "bg-orange-600/10 border-orange-500 text-orange-500 shadow-lg shadow-orange-900/20" 
                                    : "bg-black/20 border-theme text-muted hover:border-muted hover:text-main"
                            )}
                        >
                            <LayoutGrid size={24} className={selectionMode === 'area' ? "animate-pulse" : ""} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Area Select</span>
                        </button>
                    </div>
                </div>

                <div className="bg-black/20 rounded-2xl p-4 border border-theme/50 space-y-3">
                    <div className="flex items-center gap-2 text-orange-500">
                        <Settings2 size={14} />
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Usage Tips</h4>
                    </div>
                    <ul className="space-y-2">
                        <li className="flex gap-2 text-[9px] text-muted font-bold uppercase tracking-tight leading-relaxed">
                            <span className="text-orange-500">•</span>
                            <span>Hold <kbd className="bg-black/40 px-1 rounded border border-theme text-main">CTRL</kbd> to add to selection</span>
                        </li>
                        <li className="flex gap-2 text-[9px] text-muted font-bold uppercase tracking-tight leading-relaxed">
                            <span className="text-orange-500">•</span>
                            <span>Press <kbd className="bg-black/40 px-1 rounded border border-theme text-main">DEL</kbd> to remove selected items</span>
                        </li>
                        <li className="flex gap-2 text-[9px] text-muted font-bold uppercase tracking-tight leading-relaxed">
                            <span className="text-orange-500">•</span>
                            <span>Use <kbd className="bg-black/40 px-1 rounded border border-theme text-main">Arrows</kbd> to nudge objects</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-30">
                <div className="w-16 h-16 rounded-full bg-black/20 flex items-center justify-center mb-4">
                    {selectionMode === 'single' ? <MousePointer2 size={32} /> : <LayoutGrid size={32} />}
                </div>
                <p className="text-[9px] text-muted font-black uppercase tracking-widest leading-relaxed">
                    {selectionMode === 'single' 
                        ? "Click any object to select" 
                        : "Click and drag to select multiple objects"}
                </p>
            </div>
          </div>
        );
      case 'catalog':
        return (
          <div className="flex flex-col h-full">
            <ToolHeader 
                icon={<Layers size={20} />} 
                title="Library" 
                subtitle="Browse & Global Navigation"
            />
            <div className="flex-1 overflow-hidden">
              <AssetCatalog mode="library" />
            </div>
          </div>
        );
      case 'stamp':
        return (
          <div className="flex flex-col h-full">
            <ToolHeader 
                icon={<Stamp size={20} />} 
                title="Stamp Tool" 
                subtitle="Place props and objects"
            />
            <div className="flex-1 overflow-hidden">
              <AssetCatalog mode="stamp" />
            </div>
          </div>
        );
      case 'terrain':
        return (
          <div className="flex flex-col h-full">
            <ToolHeader 
                icon={<Paintbrush size={20} />} 
                title="Terrain" 
                subtitle="Painting & Auto-tiling"
            />
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <TerrainPanel />
            </div>
          </div>
        );
      case 'wall':
        return (
          <div className="flex flex-col h-full">
            <ToolHeader 
                icon={<Fence size={20} />} 
                title="Building" 
                subtitle="Walls, Fences & Boundaries"
            />
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <WallTool />
            </div>
          </div>
        );
      case 'project':
        return (
          <div className="flex flex-col h-full">
            <ToolHeader 
                icon={<Settings2 size={20} />} 
                title="Project" 
                subtitle="Global settings & Map list"
            />
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <LevelManager />
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="flex flex-col h-full">
            <ToolHeader 
                icon={<Type size={20} />} 
                title="Text Tool" 
                subtitle="Add labels and annotations"
            />
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <TextPanel />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-panel border-r border-theme flex flex-col shrink-0 shadow-2xl z-10">
      {renderContent()}
    </div>
  );
};
