import React, { useEffect } from 'react';
import { ToolSidebar } from './components/Editor/ToolSidebar';
import { ToolPanel } from './components/Editor/ToolPanel';
import { Canvas } from './components/Editor/Canvas';
import { AssetProperties } from './components/Editor/AssetProperties';
import { ExportDialog } from './components/Editor/ExportDialog';
import { PrintStudioDialog } from './components/Editor/PrintStudioDialog';
import { AssetImportDialog } from './components/Editor/AssetImportDialog';
import { ImportProgressDialog } from './components/Editor/ImportProgressDialog';
import { PackExportDialog } from './components/Editor/PackExportDialog';
import { ProjectSetupModal } from './components/Editor/ProjectSetupModal';
import { NotificationModal } from './components/Editor/NotificationModal';
import { ToastContainer } from './components/Editor/ToastContainer';
import { ProjectActions } from './components/Editor/ProjectActions';
import { ObjectList } from './components/Editor/ObjectList';
import { ThemeManager } from './components/Editor/ThemeManager';
import { EditorFooter } from './components/Editor/EditorFooter';
import { Map as MapIcon, Plus, ChevronLeft, ChevronRight, Layers, Settings2 } from 'lucide-react';
import { useAutoSave } from './hooks/useAutoSave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useMapSync } from './hooks/useMapSync';
import { useCustomFonts } from './hooks/useCustomFonts';
import { db } from './db/projectDB';
import { useProjectStore } from './store/useProjectStore';
import { useMapStore } from './store/useMapStore';
import { useEditorStore } from './store/useEditorStore';
import { useAssetStore } from './store/useAssetStore';
import { clsx } from 'clsx';

function App() {
  // Frequent auto-save (every 5 seconds now for better responsiveness)
  useAutoSave(5000); 
  useKeyboardShortcuts();
  useMapSync();
  useCustomFonts();

  const activeMapId = useProjectStore(s => s.activeMapId);
  const editorBgColor = useEditorStore(s => s.editorBgColor);
  
  const isSidebarVisible = useEditorStore(s => s.isSidebarVisible);
  const isRightSidebarVisible = useEditorStore(s => s.isRightSidebarVisible);
  const setIsRightSidebarVisible = useEditorStore(s => s.setIsRightSidebarVisible);
  
  const isHoveringLeft = useEditorStore(s => s.isHoveringLeft);
  const setIsHoveringLeft = useEditorStore(s => s.setIsHoveringLeft);
  const isHoveringRight = useEditorStore(s => s.isHoveringRight);
  const setIsHoveringRight = useEditorStore(s => s.setIsHoveringRight);
  const activeTool = useEditorStore(s => s.activeTool);
  const projectName = useProjectStore(s => s.name);
  const projectAuthor = useProjectStore(s => s.author);

  // Update document title based on active project
  useEffect(() => {
    if (projectName) {
      const authorSuffix = projectAuthor ? ` by ${projectAuthor}` : '';
      document.title = `Open Source RPG Map Editor - ${projectName}${authorSuffix}`;
    } else {
      document.title = 'Open Source RPG Map Editor';
    }
  }, [projectName, projectAuthor]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        console.log("[App] Restoring session...");
        
        // 1. Load Custom Assets first
        const customAssets = await db.customAssets.toArray();
        if (customAssets.length > 0) {
            useAssetStore.getState().setCustomAssets(customAssets);
        }

        // 2. Load latest Project
        const projects = await db.projects.toArray();
        if (projects.length > 0) {
          const lastProject = projects[projects.length - 1];
          console.log(`[App] Found project: ${lastProject.name} (${lastProject.id})`);
          
          useProjectStore.getState().setProject(lastProject);
          
          const activeMap = lastProject.maps.find(m => m.id === lastProject.activeMapId);
          if (activeMap) {
            useMapStore.getState().resetState({
              ...activeMap,
              selectedAssetIds: [], // Fix: Use the new array field
            } as any);
          } else {
            useMapStore.getState().resetState();
          }
        } else {
            console.log("[App] No project found in local storage. Waiting for user action.");
        }
        // Always set loaded to true at the end
        useProjectStore.getState().setIsLoaded(true);
      } catch (err) {
        console.error('Failed to restore session:', err);
        useProjectStore.getState().setIsLoaded(true);
      }
    };
    restoreSession();
  }, []);

  return (
    <div className="flex h-[100dvh] w-screen text-main overflow-hidden font-sans" style={{ backgroundColor: editorBgColor }}>
      <ThemeManager />
      
      {/* 1. Permanent Slim Toolbar (Left) */}
      <div 
        onMouseEnter={() => setIsHoveringLeft(true)}
        onMouseLeave={() => setIsHoveringLeft(false)}
        className="h-full z-50 w-20 shrink-0 bg-sidebar border-r border-theme"
      >
        <ToolSidebar />
      </div>

      {/* Main Container */}
      <main className="flex-1 relative overflow-hidden flex flex-col bg-editor/50">
        {/* Top Header */}
        <ProjectActions />

        {/* WORK AREA (Sidebars overlap here) */}
        <div className="flex-1 relative flex overflow-hidden">
          
          {/* 2. Left Context Panel (Overlay or Relative) */}
          <div 
            onMouseEnter={() => setIsHoveringLeft(true)}
            onMouseLeave={() => setIsHoveringLeft(false)}
            className={clsx(
                "h-full transition-all duration-300 z-40 overflow-hidden shrink-0 bg-panel",
                isSidebarVisible 
                    ? "relative border-r border-theme" 
                    : "absolute left-0 top-0 bottom-0 shadow-2xl",
                
                // Consolidated Width Logic: Only apply width if visible or hovering
                (isSidebarVisible || isHoveringLeft) ? (
                    (activeTool === 'catalog' || activeTool === 'stamp' || activeTool === 'terrain' || activeTool === 'wall' || activeTool === 'room')
                        ? "w-[480px]" 
                        : "w-80"
                ) : "w-0",

                (!isSidebarVisible && isHoveringLeft) && "shadow-[20px_0_60px_-15px_rgba(0,0,0,0.7)] border-r border-theme"
            )}
          >
            <ToolPanel />
          </div>

          {/* 3. Canvas (Central) */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {activeMapId ? (
              <Canvas />
            ) : (
              <div className="flex flex-col items-center gap-6 p-12 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-24 h-24 rounded-full bg-black/20 flex items-center justify-center text-muted shadow-2xl border border-theme/50 relative">
                      <MapIcon size={48} className="opacity-20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                          <Plus size={32} className="text-orange-500 animate-pulse" />
                      </div>
                  </div>
                  <div className="space-y-2">
                      <h2 className="text-2xl font-black text-main uppercase tracking-widest">No Active Level</h2>
                      <p className="text-sm text-muted leading-relaxed uppercase font-bold tracking-tighter max-w-xs">
                          You need at least one level to start editing.<br/>
                          Use the <span className="text-orange-500">Level Manager</span> in the Project tab to create or select a map.
                      </p>
                  </div>
              </div>
            )}
          </div>

          {/* 4. Right Sidebar (Inspector) */}
          <aside 
            onMouseEnter={() => !isRightSidebarVisible && setIsHoveringRight(true)}
            onMouseLeave={() => setIsHoveringRight(false)}
            className={clsx(
              "h-full bg-panel border-l border-theme flex flex-col shrink-0 transition-all duration-300 overflow-hidden z-40",
              isRightSidebarVisible 
                ? "relative w-80" 
                : "absolute right-0 top-0 bottom-0 w-12 shadow-2xl hover:w-80 shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.7)]",
              (!isRightSidebarVisible && isHoveringRight) && "w-80",
              !activeMapId && "opacity-20 pointer-events-none"
          )}>
            {/* Toggle Button Container - Always at the top */}
            <div className={clsx(
                "flex items-center p-3 bg-black/20 shrink-0 transition-all",
                (isRightSidebarVisible || isHoveringRight) ? "justify-between" : "justify-center h-12"
            )}>
                {(isRightSidebarVisible || isHoveringRight) && (
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-orange-600/20 rounded-lg text-orange-500">
                            <Settings2 size={14} />
                        </div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-main">Inspector</h2>
                    </div>
                )}
                <button
                    onClick={() => setIsRightSidebarVisible(!isRightSidebarVisible)}
                    className={clsx(
                        "p-1.5 rounded-lg transition-all border",
                        isRightSidebarVisible 
                            ? "bg-black/40 border-theme text-muted hover:text-main" 
                            : "bg-orange-600 border-orange-500 text-white shadow-lg"
                    )}
                    title={isRightSidebarVisible ? "Collapse Inspector" : "Expand Inspector"}
                >
                    {isRightSidebarVisible ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Visual Hints when collapsed */}
            {!isRightSidebarVisible && !isHoveringRight && (
                <div className="flex-1 flex flex-col items-center py-8 gap-8 text-muted/20">
                    <Layers size={18} />
                    <Settings2 size={18} />
                    <div className="w-px flex-1 bg-gradient-to-b from-[var(--border)] via-transparent to-transparent opacity-20" />
                </div>
            )}

            {/* Inspector Content */}
            <div className={clsx(
                "flex-1 overflow-y-auto custom-scrollbar flex flex-col divide-y divide-slate-800 transition-all duration-300",
                (!isRightSidebarVisible && !isHoveringRight) && "opacity-0 pointer-events-none"
            )}>
              <section className="flex flex-col">
                <div className="p-4 bg-black/10 border-b border-theme">
                  <h2 className="text-sm font-bold text-muted uppercase tracking-wider">Properties</h2>
                </div>
                <AssetProperties />
              </section>

              <section className="flex flex-col">
                <ObjectList />
              </section>
            </div>
          </aside>
        </div>

        {/* Bottom Footer */}
        <EditorFooter />
      </main>

      {/* Overlays */}
      <ExportDialog />
      <PrintStudioDialog />
      <AssetImportDialog />
      <ImportProgressDialog />
      <PackExportDialog />
      <ProjectSetupModal />
      <NotificationModal />
      <ToastContainer />
    </div>
  );
}

export default App;
