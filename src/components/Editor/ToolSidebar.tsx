import React from 'react';
import { MousePointer2, Hand, Stamp, Paintbrush, Fence, Lightbulb, Square, Map, Layers, Github, ChevronLeft, ChevronRight, Coffee, Type } from 'lucide-react';
import { useEditorStore, ToolType } from '../../store/useEditorStore';

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ tool, icon, label }) => {
  const activeTool = useEditorStore((state) => state.activeTool);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const isActive = activeTool === tool;

  return (
    <button
      onClick={() => setActiveTool(tool)}
      className={`p-3 rounded-xl mb-1 transition-all flex flex-col items-center justify-center gap-1 group relative border-2
        ${isActive 
          ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/20 active:scale-95' 
          : 'bg-black/20 border-transparent text-muted hover:bg-black/40 hover:text-main'
        }`}
      title={label}
    >
      {icon}
      <span className="text-[10px] font-black uppercase hidden group-hover:block absolute left-16 bg-slate-900 px-3 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-2xl border border-theme text-white tracking-widest animate-in fade-in slide-in-from-left-2 duration-200">
        {label}
      </span>
    </button>
  );
};

export const ToolSidebar: React.FC = () => {
  const isSidebarVisible = useEditorStore(s => s.isSidebarVisible);
  const setIsSidebarVisible = useEditorStore(s => s.setIsSidebarVisible);

  return (
    <div className="w-20 h-full bg-sidebar border-r border-theme flex flex-col items-center py-6 shrink-0 gap-4 overflow-y-auto custom-scrollbar overflow-x-hidden">
      {/* Projects */}
      <div className="flex flex-col items-center">
        <ToolButton 
          tool="project" 
          icon={<Map size={22} />} 
          label="Maps (M)" 
        />
      </div>

      <div className="w-10 h-px bg-theme opacity-50" />

      {/* Interaction */}
      <div className="flex flex-col items-center gap-1">
        <ToolButton 
            tool="select" 
            icon={<MousePointer2 size={22} />} 
            label="Select (V)" 
        />
        <ToolButton 
            tool="hand" 
            icon={<Hand size={22} />} 
            label="Hand (H)" 
        />
      </div>

      <div className="w-10 h-px bg-theme opacity-50" />

      {/* Assets & Stamps */}
      <div className="flex flex-col items-center">
        <ToolButton 
            tool="catalog" 
            icon={<Layers size={22} />} 
            label="Library (C)" 
        />
        <ToolButton 
            tool="stamp" 
            icon={<Stamp size={22} />} 
            label="Stamps (S)" 
        />

        {/* Terrain & Building */}
        <ToolButton 
            tool="terrain" 
            icon={<Paintbrush size={22} />} 
            label="Terrain (T)" 
        />
        <ToolButton 
            tool="wall" 
            icon={<Fence size={22} />} 
            label="Walls (W)" 
        />
        <ToolButton 
            tool="room" 
            icon={<Square size={22} />} 
            label="Rooms (R)" 
        />
        <ToolButton 
            tool="text" 
            icon={<Type size={22} />} 
            label="Text Tool (X)" 
        />
      </div>

      <div className="w-10 h-px bg-theme opacity-50" />

      {/* Footer Controls */}
      <div className="mt-auto flex flex-col items-center gap-2">
        {/* Sidebar Toggle */}
        <button
          onClick={() => setIsSidebarVisible(!isSidebarVisible)}
          className={`p-3 rounded-xl transition-all flex flex-col items-center justify-center border-2
            ${isSidebarVisible 
              ? 'bg-black/20 border-transparent text-muted hover:bg-black/40 hover:text-main' 
              : 'bg-orange-600/20 border-orange-500/50 text-orange-500 hover:bg-orange-600/40 hover:text-orange-400'
            }`}
          title={isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
        >
          {isSidebarVisible ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
        </button>

        <a 
          href="https://github.com/roodriiigooo" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-3 rounded-xl transition-all flex flex-col items-center justify-center bg-black/20 border-2 border-transparent text-muted hover:bg-black/40 hover:text-main group relative"
          title="GitHub Profile"
        >
          <Github size={22} />
          <span className="text-[10px] font-black uppercase hidden group-hover:block absolute left-16 bg-slate-900 px-3 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-2xl border border-theme text-white tracking-widest animate-in fade-in slide-in-from-left-2 duration-200">
            GitHub
          </span>
        </a>
      </div>
    </div>
  );
};
