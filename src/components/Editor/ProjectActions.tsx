import React, { useState, useEffect, useRef } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useAssetStore } from '../../store/useAssetStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useProjectIO } from '../../hooks/useProjectIO';
import { useEditorStore } from '../../store/useEditorStore';
import { Undo2, Redo2, FolderOpen, Download, Save, Palette, Plus, X, Settings2 } from 'lucide-react';
import { exportProjectBundle } from '../../utils/export/assetBundle';
import { EditorTheme } from '../../store/useEditorStore';
import { clsx } from 'clsx';

export const ProjectActions: React.FC = () => {
  const { triggerBundleImport, syncActiveMap } = useProjectIO();
  const { undo, redo } = useMapStore.temporal.getState();
  const theme = useEditorStore((state) => state.theme);
  const setTheme = useEditorStore((state) => state.setTheme);
  const setIsExportDialogOpen = useEditorStore((state) => state.setIsExportDialogOpen);
  const setIsProjectSetupOpen = useEditorStore((state) => state.setIsProjectSetupOpen);
  
  const { activeMapId, closeProject, name: projectName, author: projectAuthor } = useProjectStore();
  const { clearAllAssets } = useAssetStore();
  
  const { showConfirm, showToast, removeToast } = useNotificationStore();

  // Scrolling title logic
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleTextRef = useRef<HTMLSpanElement>(null);
  const [isTitleLong, setIsLong] = useState(false);
  const [scrollDist, setScrollDist] = useState(0);
  const [isHoveringTitle, setIsHoveringTitle] = useState(false);

  useEffect(() => {
    if (titleContainerRef.current && titleTextRef.current) {
      const containerWidth = titleContainerRef.current.offsetWidth;
      const textWidth = titleTextRef.current.scrollWidth;
      if (textWidth > containerWidth) {
        setIsLong(true);
        setScrollDist(containerWidth - textWidth);
      } else {
        setIsLong(false);
        setScrollDist(0);
      }
    }
  }, [projectName]);

  const handleBundleExport = async () => {
    const toastId = showToast("Preparing Bundle...", "Bundling project data and assets...", "info", 0);
    try {
        // 1. Sync the current map state to the Project Store
        syncActiveMap();

        // 2. Export the bundle from the Project Store (which now has latest data)
        const projectToExport = useProjectStore.getState();
        await exportProjectBundle(projectToExport);
        showToast("Success", "Project saved as .zip bundle.", "success", 3000);
    } catch (err) {
        console.error("[ProjectActions] Failed to export bundle:", err);
        showToast("Save Error", "Failed to create project bundle. Check console for details.", "error", 5000);
    } finally {
        removeToast(toastId);
    }
  };

  const handleNewProject = () => {
    const currentProject = useProjectStore.getState();
    
    // If no project is loaded, just open setup directly
    if (!currentProject.id) {
        setIsProjectSetupOpen(true);
        return;
    }

    showConfirm(
        "Save Progress?", 
        "Would you like to save your current project as a .zip bundle before starting a new one?",
        async () => {
            await handleBundleExport();
            performPurge().then(() => setIsProjectSetupOpen(true));
        },
        {
            confirmLabel: "Save & New",
            cancelLabel: "Discard & New",
            onCancel: () => performPurge().then(() => setIsProjectSetupOpen(true))
        }
    );
  };

  const handleCloseProject = () => {
    showConfirm(
        "Close Project?",
        "This will permanently delete all custom assets and levels from memory. Ensure you have saved your work (.zip) first.",
        async () => {
            const toastId = showToast("Purging...", "Destroying project data from local memory...", "info", 0);
            try {
                // Minimum delay to ensure toast is visible and user feels the action
                await new Promise(resolve => setTimeout(resolve, 800));
                await performPurge();
                showToast("Project Purged", "All data has been cleared.", "success", 3000);
            } catch (err) {
                console.error("[ProjectActions] Failed to purge:", err);
                showToast("Purge Failed", "Some data might still remain.", "error", 5000);
            } finally {
                removeToast(toastId);
            }
        },
        {
            type: "error",
            confirmLabel: "Close & Purge",
            cancelLabel: "Go Back"
        }
    );
  };

  const performPurge = async () => {
    useMapStore.getState().resetState();
    await clearAllAssets();
    await closeProject();
  };

  return (
    <div className="flex gap-4 p-4 bg-panel border-b border-theme items-center justify-between">
      <div className="flex gap-3 items-center">
        {/* System Icon */}
        <div className="w-10 h-10 rounded-xl bg-black/20 border border-theme shrink-0 shadow-inner flex items-center justify-center">
            <img src="./favicon.ico" alt="System Icon" className="w-full h-full object-contain" />
        </div>

        {/* Project Identity */}
        <div 
            className="flex flex-col min-w-0"
            onMouseEnter={() => setIsHoveringTitle(true)}
            onMouseLeave={() => setIsHoveringTitle(false)}
        >
            <div className="flex items-center gap-2 overflow-hidden">
                <div 
                    ref={titleContainerRef}
                    className="max-w-[150px] overflow-hidden whitespace-nowrap"
                    style={{ '--scroll-dist': `${scrollDist}px` } as any}
                >
                    <span 
                        ref={titleTextRef}
                        className={clsx(
                            "text-[10px] font-black uppercase text-orange-500 tracking-widest inline-block",
                            (isTitleLong && isHoveringTitle) ? "animate-scroll-text" : "truncate w-full"
                        )}
                    >
                        {projectName || 'Unnamed Project'}
                    </span>
                </div>
                <button 
                    onClick={() => setIsProjectSetupOpen(true)}
                    className="p-1 hover:bg-black/20 rounded text-muted hover:text-main transition-all shrink-0"
                    title="Project Settings"
                >
                    <Settings2 size={10} />
                </button>
            </div>
            <span className="text-[8px] font-bold text-muted uppercase tracking-tighter opacity-50 truncate">
                by {projectAuthor || 'Unknown Author'}
            </span>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {/* Theme Selector */}
        <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-md border border-theme mr-2">
          <Palette size={14} className="text-accent" />
          <select 
            value={theme}
            onChange={(e) => setTheme(e.target.value as EditorTheme)}
            className="bg-panel text-[10px] font-bold text-main outline-none cursor-pointer uppercase tracking-tighter"
          >
            <option value="dark" className="bg-panel">Dark</option>
            <option value="light" className="bg-panel">Light</option>
            <option value="dracula" className="bg-panel">Dracula</option>
            <option value="comic" className="bg-panel">Comic</option>
            <option value="high-contrast" className="bg-panel">High Contrast</option>
          </select>
        </div>

        {/* History Controls */}
        <div className="flex gap-1 mr-2">
            <button
                onClick={() => undo()}
                className="bg-black/20 hover:bg-black/40 text-muted p-1.5 rounded transition-colors border border-theme hover:text-orange-500"
                title="Undo"
            >
                <Undo2 size={16} />
            </button>
            <button
                onClick={() => redo()}
                className="bg-black/20 hover:bg-black/40 text-muted p-1.5 rounded transition-colors border border-theme hover:text-orange-500"
                title="Redo"
            >
                <Redo2 size={16} />
            </button>
        </div>

        {/* Project Actions */}
        <div className="flex gap-1 bg-black/10 p-1 rounded-lg border border-theme">
          <button
            onClick={handleNewProject}
            className="hover:bg-black/20 text-muted px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
            title="New Project"
          >
            <Plus size={14} className="text-accent" />
            New
          </button>
          <button
            onClick={triggerBundleImport}
            className="hover:bg-black/20 text-muted px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
            title="Load Project Bundle (.zip)"
          >
            <FolderOpen size={14} className="text-accent" />
            Load
          </button>
          <button
            onClick={handleBundleExport}
            className="hover:bg-black/20 text-muted px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
            title="Save Project Bundle (.zip)"
          >
            <Save size={14} className="text-accent" />
            Save project
          </button>
          <button
            onClick={handleCloseProject}
            className="hover:bg-red-900/20 text-muted hover:text-red-400 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
            title="Close Project"
          >
            <X size={14} />
            Close
          </button>
        </div>

        <button
          onClick={() => setIsExportDialogOpen(true)}
          className="bg-accent hover:opacity-90 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2 ml-2"
        >
          <Download size={14} />
          Export Map
        </button>
      </div>
    </div>
  );
};
