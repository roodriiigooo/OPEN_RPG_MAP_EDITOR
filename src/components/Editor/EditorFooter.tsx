import React, { useState, useEffect, useMemo } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useMapStore } from '../../store/useMapStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { 
    ZoomIn, Palette, Keyboard, Pipette, Maximize2, Minimize2,
    Cloud, CloudUpload, CloudOff, AlertCircle, Map as MapIcon,
    X, MousePointer2, ChevronUp, Focus, Plus, Minus
} from 'lucide-react';
import { clsx } from 'clsx';

export const EditorFooter: React.FC = () => {
  const activeMapId = useProjectStore(s => s.activeMapId);
  const { maps, saveStatus, lastError, setActiveMapId } = useProjectStore();
  const { showAlert } = useNotificationStore();
  const zoom = useEditorStore(s => s.viewportZoom);
  const setZoom = useEditorStore(s => s.setViewportZoom);
  const bgColor = useEditorStore(s => s.editorBgColor);
  const setBgColor = useEditorStore(s => s.setEditorBgColor);
  const triggerCenter = useEditorStore(s => s.triggerCenter);
  const resetMapStore = useMapStore(s => s.resetState);

  const activeMap = useMemo(() => {
    return maps.find(m => m.id === activeMapId);
  }, [activeMapId, maps]);

  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isLevelSelectorOpen, setIsLevelSelectorOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [localZoom, setLocalZoom] = useState(Math.round(zoom * 100).toString());

  // Monitor full screen changes
  useEffect(() => {
    const handleFSChange = () => {
        setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

  // Sync local zoom when external zoom changes
  useEffect(() => {
    setLocalZoom(Math.round(zoom * 100).toString());
  }, [zoom]);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalZoom(e.target.value);
  };

  const handleZoomBlur = () => {
    const val = parseInt(localZoom);
    if (!isNaN(val)) {
        const clamped = Math.max(1, Math.min(val, 500)) / 100;
        setZoom(clamped);
    } else {
        setLocalZoom(Math.round(zoom * 100).toString());
    }
  };

  const handleZoomKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleZoomBlur();
  };

  const handleErrorClick = () => {
    if (saveStatus === 'error' && lastError) {
        showAlert("Database Save Error", lastError, "error");
    }
  };

  const handleLevelSelect = (id: string) => {
      if (id === activeMapId) return;
      
      const targetMap = maps.find(m => m.id === id);
      if (targetMap) {
          setActiveMapId(id);
          resetMapStore({
              ...targetMap,
              selectedAssetIds: [],
              selectedRoomId: null
          } as any);
      }
      setIsLevelSelectorOpen(false);
  };

  const colors = [
    { name: 'Default', hex: '#282828' },
    { name: 'Black', hex: '#000000' },
    { name: 'Dark Gray', hex: '#333333' },
    { name: 'Medium Gray', hex: '#626262' },
    { name: 'Light Gray', hex: '#bfbfbf' },
  ];

  const hasMaps = maps.length > 0;

  return (
    <footer className="h-8 bg-sidebar border-t border-theme flex items-center justify-between px-4 shrink-0 z-[60] font-sans relative">
      {/* 0. Save Status */}
      <div 
        onClick={handleErrorClick}
        className={clsx(
            "flex items-center gap-3 px-4 border-r border-theme h-full group relative",
            saveStatus === 'error' ? "cursor-pointer hover:bg-red-500/10" : "cursor-help"
        )}
      >
        {saveStatus === 'saved' && (
            <>
                <Cloud size={14} className="text-emerald-500" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter hidden group-hover:block whitespace-nowrap">Local Save OK</span>
            </>
        )}
        {saveStatus === 'saving' && (
            <>
                <CloudUpload size={14} className="text-blue-500 animate-pulse" />
                <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter hidden group-hover:block whitespace-nowrap">Syncing DB...</span>
            </>
        )}
        {saveStatus === 'unsaved' && (
            <>
                <CloudUpload size={14} className="text-orange-500 opacity-50" />
                <span className="text-[8px] font-black text-orange-500 uppercase tracking-tighter hidden group-hover:block whitespace-nowrap">Unsaved Changes</span>
            </>
        )}
        {saveStatus === 'error' && (
            <>
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter hidden group-hover:block whitespace-nowrap underline">Click for error logs</span>
            </>
        )}
      </div>

      {/* 1. Viewport Controls */}
      <div className={clsx("flex items-center gap-3 px-6 border-r border-theme h-full transition-opacity", !activeMapId && "opacity-20 pointer-events-none")}>
        <button
            onClick={triggerCenter}
            className="p-1.5 hover:bg-black/40 text-muted hover:text-main rounded transition-colors"
            title="Recenter Canvas"
        >
            <Focus size={14} />
        </button>
        <div className="flex items-center gap-2 bg-black/20 px-2.5 py-0.5 rounded border border-theme/50 focus-within:border-orange-500/50 transition-colors">
            <ZoomIn size={10} className="text-muted" />
            <input
                type="text"
                value={localZoom}
                onChange={handleZoomChange}
                onBlur={handleZoomBlur}
                onKeyDown={handleZoomKey}
                className="w-8 bg-transparent text-[10px] font-mono font-bold text-main outline-none text-right"
            />
            <span className="text-[10px] font-mono font-bold text-muted">%</span>
        </div>
        <div className="flex gap-1">
            <button
                onClick={() => {
                    const newVal = Math.max(0.01, zoom - 0.03);
                    setZoom(newVal);
                }}
                className="p-1 hover:bg-black/40 text-muted hover:text-main rounded transition-colors border border-theme/30"
                title="Zoom Out (-3%)"
            >
                <Minus size={10} />
            </button>
            <button
                onClick={() => {
                    const newVal = Math.min(5, zoom + 0.03);
                    setZoom(newVal);
                }}
                className="p-1 hover:bg-black/40 text-muted hover:text-main rounded transition-colors border border-theme/30"
                title="Zoom In (+3%)"
            >
                <Plus size={10} />
            </button>
        </div>
      </div>

      {/* 2. Shortcuts Legend */}
      <div className="flex-1 flex items-center gap-8 px-8 overflow-hidden">
        <div className="flex items-center gap-3">
            <button 
                onClick={toggleFullScreen}
                className="p-1 hover:bg-white/10 rounded transition-all group"
                title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
            >
                {isFullScreen ? (
                    <Minimize2 size={14} className="text-white transition-transform group-hover:scale-110" />
                ) : (
                    <Maximize2 size={14} className="text-white transition-transform group-hover:scale-110" />
                )}
            </button>
            <button 
                onClick={() => setIsShortcutsOpen(true)}
                className="p-1 hover:bg-orange-600/20 hover:text-orange-500 rounded transition-all group"
                title="View All Shortcuts"
            >
                <Keyboard size={14} className="text-orange-500 transition-transform group-hover:scale-110" />
            </button>
            <div className="flex gap-4 text-[9px] font-black uppercase tracking-tighter text-muted/60">
                <span className="flex gap-1.5 items-center"><kbd className="text-main bg-black/40 px-1 rounded border border-theme">TAB</kbd> UI</span>
                <span className="flex gap-1.5 items-center"><kbd className="text-main bg-black/40 px-1 rounded border border-theme">CTRL+Z</kbd> Undo</span>
                <span className="flex gap-1.5 items-center"><kbd className="text-main bg-black/40 px-1 rounded border border-theme">DEL</kbd> Delete</span>
                <span className="flex gap-1.5 items-center"><kbd className="text-main bg-black/40 px-1 rounded border border-theme">G</kbd> GRID</span>
            </div>
        </div>
      </div>

      {/* 3. Editor Background Color */}
      <div className="flex items-center gap-4 px-6 border-l border-theme h-full">
        <Palette size={12} className="text-muted" />
        <div className="flex gap-2 items-center">
            {colors.map(c => (
                <button
                    key={c.hex}
                    onClick={() => setBgColor(c.hex)}
                    className={clsx(
                        "w-3.5 h-3.5 rounded-full border transition-all hover:scale-110",
                        bgColor === c.hex ? "border-orange-500 ring-1 ring-orange-500/50" : "border-white/10"
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                />
            ))}
            
            {/* Custom Color Trigger */}
            <div className="relative flex items-center ml-1">
                <button
                    onClick={() => setIsCustomOpen(!isCustomOpen)}
                    className={clsx(
                        "w-3.5 h-3.5 rounded-full border border-white/10 bg-gradient-to-tr from-orange-500 to-blue-500 transition-all hover:scale-110 flex items-center justify-center overflow-hidden",
                        !colors.some(c => c.hex === bgColor) ? "border-orange-500 ring-1 ring-orange-500/50" : ""
                    )}
                    title="Custom Color"
                >
                    <Pipette size={8} className="text-white" />
                </button>
                
                {isCustomOpen && (
                    <div className="absolute bottom-full right-0 mb-2 p-2 bg-panel border border-theme rounded-xl shadow-2xl animate-in slide-in-from-bottom-2 duration-200 z-50">
                        <input 
                            type="color" 
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                        />
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* 4. Level Selector Dropdown */}
      <div className="relative h-full flex items-center border-l border-theme">
          <button 
            onClick={() => hasMaps && setIsLevelSelectorOpen(!isLevelSelectorOpen)}
            disabled={!hasMaps}
            className={clsx(
                "h-full px-6 flex items-center gap-3 transition-all outline-none",
                isLevelSelectorOpen ? "bg-orange-600 text-white" : "bg-black/10 hover:bg-black/20 text-main",
                !hasMaps && "opacity-40 cursor-not-allowed"
            )}
          >
              <MapIcon size={12} className={isLevelSelectorOpen ? "text-white" : "text-orange-500"} />
              <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">
                  {activeMap?.metadata.name || (hasMaps ? 'Select Level' : 'Empty')}
              </span>
              <ChevronUp size={12} className={clsx("transition-transform duration-300", isLevelSelectorOpen ? "rotate-180" : "rotate-0")} />
          </button>

          {isLevelSelectorOpen && hasMaps && (
              <div className="absolute bottom-full right-0 mb-px w-64 bg-sidebar border border-theme border-b-0 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200 rounded-t-xl z-50">
                  <div className="p-3 bg-black/20 border-b border-theme text-center">
                      <p className="text-[9px] font-black text-muted uppercase tracking-widest">Switch Level</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar flex flex-col py-1">
                      {maps.map(map => (
                          <button
                            key={map.id}
                            onClick={() => handleLevelSelect(map.id)}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-2.5 text-left transition-all group",
                                map.id === activeMapId 
                                    ? "bg-orange-600/10 border-l-4 border-orange-500 text-orange-500" 
                                    : "hover:bg-black/40 text-muted hover:text-main border-l-4 border-transparent"
                            )}
                          >
                              <MapIcon size={12} className={map.id === activeMapId ? "text-orange-500" : "text-muted group-hover:text-main"} />
                              <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] font-black uppercase tracking-tight truncate">{map.metadata.name}</span>
                                  <span className="text-[8px] font-bold opacity-40 uppercase">
                                      {map.layers?.length || 0} Layers • {map.tiles?.length || 0} Tiles
                                  </span>
                              </div>
                          </button>
                      ))}
                  </div>
              </div>
          )}
      </div>

      {/* Shortcuts Modal Overlay */}
      {isShortcutsOpen && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsShortcutsOpen(false)}
          >
              <div 
                className="bg-sidebar border border-theme rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
              >
                  {/* Header */}
                  <div className="p-6 border-b border-theme bg-black/20 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-orange-600 rounded-2xl text-white shadow-lg shadow-orange-900/40">
                              <Keyboard size={24} />
                          </div>
                          <div>
                              <h2 className="text-xl font-black uppercase tracking-widest text-main leading-tight">Keyboard Shortcuts</h2>
                              <p className="text-[10px] text-muted font-bold uppercase tracking-tighter opacity-60">Master the editor speed</p>
                          </div>
                      </div>
                      <button 
                        onClick={() => setIsShortcutsOpen(false)}
                        className="p-2 hover:bg-black/40 text-muted hover:text-main rounded-xl transition-all"
                      >
                          <X size={20} />
                      </button>
                  </div>

                  {/* Content */}
                  <div className="p-8 grid grid-cols-2 gap-12">
                      {/* Left Column: Tools */}
                      <div className="space-y-6">
                          <section className="space-y-3">
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-500 border-b border-orange-500/20 pb-2">Tools</h3>
                              <div className="grid grid-cols-1 gap-2">
                                  {[
                                      { key: 'V', label: 'Selection Tool' },
                                      { key: 'H', label: 'Hand Tool (Pan)' },
                                      { key: 'S', label: 'Stamp Tool' },
                                      { key: 'T', label: 'Terrain Tool' },
                                      { key: 'W', label: 'Wall Tool' },
                                      { key: 'R', label: 'Room Builder' },
                                      { key: 'X', label: 'Text Tool' },
                                      { key: 'C', label: 'Asset Library' },
                                      { key: 'M', label: 'Level Manager' },
                                  ].map(s => (
                                      <div key={s.key} className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
                                          <span className="text-muted">{s.label}</span>
                                          <kbd className="bg-black/40 px-2 py-0.5 rounded border border-theme text-main min-w-[24px] text-center font-mono">{s.key}</kbd>
                                      </div>
                                  ))}
                              </div>
                          </section>

                          <section className="space-y-3">
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-500 border-b border-orange-500/20 pb-2">System</h3>
                              <div className="grid grid-cols-1 gap-2">
                                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
                                      <span className="text-muted">Toggle UI Sidebars</span>
                                      <kbd className="bg-black/40 px-2 py-0.5 rounded border border-theme text-main font-mono">TAB</kbd>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
                                      <span className="text-muted">Toggle Grid</span>
                                      <kbd className="bg-black/40 px-2 py-0.5 rounded border border-theme text-main font-mono">G</kbd>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
                                      <span className="text-muted">Quick Level Switch</span>
                                      <kbd className="bg-black/40 px-2 py-0.5 rounded border border-theme text-main text-[8px] font-mono">CTRL+SHIFT+↑/↓</kbd>
                                  </div>
                              </div>
                          </section>
                      </div>

                      {/* Right Column: Interaction */}
                      <div className="space-y-6">
                          <section className="space-y-3">
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 border-b border-blue-500/20 pb-2">Manipulation</h3>
                              <div className="grid grid-cols-1 gap-2">
                                  {[
                                      { key: 'CTRL+Z', label: 'Undo Action' },
                                      { key: 'CTRL+SHIFT+Z', label: 'Redo Action' },
                                      { key: 'DEL / BKSP', label: 'Delete Selected' },
                                      { key: 'ESC', label: 'Deselect All' },
                                      { key: 'ARROWS', label: 'Nudge Objects' },
                                  ].map(s => (
                                      <div key={s.key} className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
                                          <span className="text-muted">{s.label}</span>
                                          <kbd className="bg-black/40 px-2 py-0.5 rounded border border-theme text-main text-[9px] font-mono">{s.key}</kbd>
                                      </div>
                                  ))}
                              </div>
                          </section>

                          <section className="space-y-3">
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 border-b border-emerald-500/20 pb-2">Mouse</h3>
                              <div className="grid grid-cols-1 gap-3">
                                  <div className="flex gap-3 items-start text-emerald-500">
                                      <div className="p-1.5 bg-black/20 rounded border border-theme mt-0.5 shrink-0">
                                          <MousePointer2 size={12} />
                                      </div>
                                      <p className="text-[10px] text-muted font-bold uppercase leading-relaxed">
                                          <span className="text-main">Middle Mouse / Hand Tool:</span> Click & drag to pan the view.
                                      </p>
                                  </div>
                                  <div className="flex gap-3 items-start text-emerald-500">
                                      <div className="p-1.5 bg-black/20 rounded border border-theme mt-0.5 shrink-0 text-[8px] font-black font-mono">CTRL</div>
                                      <p className="text-[10px] text-muted font-bold uppercase leading-relaxed">
                                          <span className="text-main">CTRL + Click:</span> Multi-select multiple objects.
                                      </p>
                                  </div>
                                  <div className="flex gap-3 items-start text-emerald-500">
                                      <div className="p-1.5 bg-black/20 rounded border border-theme mt-0.5 shrink-0 text-[8px] font-black font-mono">SCRL</div>
                                      <p className="text-[10px] text-muted font-bold uppercase leading-relaxed">
                                          <span className="text-main">Mouse Wheel:</span> Zoom in and out of the map.
                                      </p>
                                  </div>
                              </div>
                          </section>
                      </div>
                  </div>

                  {/* Footer Tip */}
                  <div className="p-4 bg-black/40 border-t border-theme text-center">
                      <p className="text-[9px] text-muted font-black uppercase tracking-widest leading-relaxed">
                          Tip: Use <span className="text-orange-500 underline decoration-dotted">Area Select</span> in the selection tab to select many items at once!
                      </p>
                  </div>
              </div>
          </div>
      )}
    </footer>
  );
};
