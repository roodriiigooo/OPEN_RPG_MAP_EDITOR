import { useEffect, useRef } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useMapStore } from '../store/useMapStore';
import { sanitizeMapState } from '../utils/project/serialization';

/**
 * Synchronizes the active MapStore with the ProjectStore's map list.
 * Handles saving the current map before switching to a new one.
 */
export const useMapSync = () => {
  const activeMapId = useProjectStore((s) => s.activeMapId);
  const maps = useProjectStore((s) => s.maps);
  const isLoaded = useProjectStore((s) => s.isLoaded);
  const saveMap = useProjectStore((s) => s.saveMap);
  const resetMapStore = useMapStore((s) => s.resetState);
  
  const lastActiveIdRef = useRef<string | null>(activeMapId);

  useEffect(() => {
    // When the active map ID changes
    if (activeMapId !== lastActiveIdRef.current) {
      // 1. Save current state of the PREVIOUS active map (only if project is still loaded)
      if (lastActiveIdRef.current && isLoaded) {
        const currentMapState = useMapStore.getState();
        // Ensure we only save if the ID in MapStore still matches what we thought was active
        if (currentMapState.id === lastActiveIdRef.current) {
            saveMap(sanitizeMapState(currentMapState));
        }
      }

      // 2. Load the NEW active map into MapStore (or reset if none)
      const newMap = maps.find((m) => m.id === activeMapId);
      if (newMap) {
        resetMapStore(newMap as any);
      } else if (!activeMapId) {
        resetMapStore(); // Reset to initial empty state
      }

      lastActiveIdRef.current = activeMapId;
    }
  }, [activeMapId, maps, saveMap, resetMapStore, isLoaded]);
};
