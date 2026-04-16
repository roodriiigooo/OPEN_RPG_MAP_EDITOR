import { useEffect, useRef } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useMapStore } from '../store/useMapStore';
import { db } from '../db/projectDB';
import { sanitizeMapState } from '../utils/project/serialization';

/**
 * Robust AutoSave hook that:
 * 1. Monitors MapStore changes to mark project as unsaved.
 * 2. Periodically persists the entire ProjectStore (including active map) to IndexedDB.
 */
export const useAutoSave = (intervalMs: number = 5000) => {
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef<string>('');

  // 1. Mark project as unsaved whenever MapStore changes
  useEffect(() => {
    console.log("[AutoSave] Initializing map change listener...");
    
    const unsub = useMapStore.subscribe((state, prevState) => {
        // Skip initialization run
        if (!prevState) return;

        // Check for meaningful data changes
        const hasDataChanged = 
            state.lastTileUpdate !== prevState.lastTileUpdate || 
            state.assets !== prevState.assets || 
            state.layers !== prevState.layers ||
            state.metadata !== prevState.metadata ||
            state.id !== prevState.id;

        if (hasDataChanged) {
            useProjectStore.getState().markUnsaved();
        }
    });
    return unsub;
  }, []);

  // 2. Periodic persistence to IndexedDB
  useEffect(() => {
    const saveToDB = async () => {
      const projectStore = useProjectStore.getState();
      const mapStore = useMapStore.getState();
      
      if (!projectStore.isLoaded || !projectStore.id) return;

      // SYNC: Always push latest map state to project store maps array
      // This is crucial because MapStore is the source of truth for the active editor
      if (mapStore.id && projectStore.activeMapId === mapStore.id) {
          try {
              const sanitized = sanitizeMapState(mapStore);
              projectStore.saveMap(sanitized);
          } catch (err) {
              console.error("[AutoSave] Sync error (sanitize failed):", err);
          }
      }

      // Re-fetch project state AFTER sync to get latest 'saveStatus' and 'maps'
      const currentProject = useProjectStore.getState();
      
      // Prepare data for comparison and storage
      const projectData = {
        id: currentProject.id,
        name: currentProject.name,
        author: currentProject.author,
        defaultGridType: currentProject.defaultGridType,
        maps: currentProject.maps,
        activeMapId: currentProject.activeMapId
      };

      let currentStateString = '';
      try {
          currentStateString = JSON.stringify(projectData);
      } catch (err) {
          console.error("[AutoSave] Serialization error:", err);
          return;
      }
      
      // Handle first run / reference initialization
      if (!lastSavedRef.current) {
          console.log("[AutoSave] Initializing reference state.");
          lastSavedRef.current = currentStateString;
          return;
      }

      // Skip if data hasn't changed since last successful DB write
      if (lastSavedRef.current === currentStateString) {
          if (currentProject.saveStatus === 'unsaved') {
              // Status was 'unsaved' but data is actually current
              currentProject.setSaveStatus('saved');
          }
          return;
      }

      // If we are here, we have actual changes to persist
      console.log(`[AutoSave] Saving changes for project "${currentProject.name}"...`);
      currentProject.setSaveStatus('saving');
      
      try {
        // Use a clean version of data for IndexedDB
        await db.projects.put(JSON.parse(currentStateString));
        
        lastSavedRef.current = currentStateString;
        currentProject.setSaveStatus('saved');
        currentProject.setLastError(null);
        console.log("[AutoSave] Local persistence successful.");
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('[AutoSave] Persistence FAILED:', err);
        currentProject.setSaveStatus('error');
        currentProject.setLastError(errorMsg);
      }
    };

    // Clean up existing timer
    if (saveTimer.current) clearInterval(saveTimer.current);
    
    // Start interval
    saveTimer.current = setInterval(saveToDB, intervalMs);
    
    return () => {
      if (saveTimer.current) clearInterval(saveTimer.current);
    };
  }, [intervalMs]);
};
