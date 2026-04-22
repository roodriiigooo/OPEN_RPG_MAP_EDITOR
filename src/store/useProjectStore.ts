import { create } from 'zustand';
import { Project, MapState } from '../types/map';
import { db } from '../db/projectDB';

export type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved';

interface ProjectStore extends Project {
  saveStatus: SaveStatus;
  setSaveStatus: (status: SaveStatus) => void;
  lastError: string | null;
  setLastError: (error: string | null) => void;
  isLoaded: boolean;
  setIsLoaded: (loaded: boolean) => void;
  addMap: (map: MapState) => void;
  removeMap: (mapId: string) => void;
  updateMap: (mapId: string, updates: Partial<MapState>) => void;
  saveMap: (mapState: MapState) => void;
  reorderMaps: (mapIds: string[]) => void;
  setActiveMapId: (mapId: string | null) => void;
  updateProjectMetadata: (updates: Partial<Pick<Project, 'name' | 'author' | 'defaultGridType'>>) => void;
  setProject: (project: Project) => void;
  newProject: (metadata?: { name: string; author: string; defaultGridType: Project['defaultGridType'] }) => void;
  closeProject: () => Promise<void>;
  checkAssetUsage: (assetId: string) => boolean;
  cleanupAssetUsageGlobal: (assetId: string) => void;
  checkFontUsage: (fontFamily: string) => boolean;
  cleanupFontUsageGlobal: (fontFamily: string) => void;
  markUnsaved: () => void;
}

// Default initial state should have no maps
export const useProjectStore = create<ProjectStore>((set) => ({
  id: '', // Will be set on load or new project
  name: '',
  author: '',
  defaultGridType: 'square',
  maps: [],
  activeMapId: null,
  saveStatus: 'saved',
  isLoaded: false,
  lastError: null,
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setLastError: (lastError) => set({ lastError }),
  setIsLoaded: (isLoaded) => set({ isLoaded }),

  markUnsaved: () => set((state) => {
      if (!state.isLoaded) return state;
      if (state.saveStatus === 'unsaved') return state;
      console.log("[ProjectStore] Status changed to UNSAVED.");
      return { saveStatus: 'unsaved' };
  }),

  addMap: (map) =>
    set((state) => {
      // If project has no ID, it's a "ghost" project, initialize it properly
      if (!state.id) {
          console.log("[ProjectStore] No project ID found. Initializing new project before adding map.");
          return {
            id: crypto.randomUUID(),
            name: state.name || 'New Project',
            author: state.author || '',
            defaultGridType: state.defaultGridType || 'square',
            maps: [map],
            activeMapId: map.id,
            saveStatus: 'unsaved',
            isLoaded: true
          };
      }
      return {
        maps: [...state.maps, map],
        activeMapId: map.id,
        saveStatus: 'unsaved',
      };
    }),

  removeMap: (mapId) =>
    set((state) => {
      const isRemovingActive = state.activeMapId === mapId;
      const newMaps = state.maps.filter((m) => m.id !== mapId);
      
      let newActiveMapId = state.activeMapId;
      if (isRemovingActive) {
        // If removing the last map, set to null, otherwise pick the first available
        newActiveMapId = newMaps.length > 0 ? newMaps[0].id : null;
      }

      return {
        maps: newMaps,
        activeMapId: newActiveMapId,
        saveStatus: 'unsaved',
      };
    }),

  updateMap: (mapId, updates) =>
    set((state) => {
      console.log(`[ProjectStore] Updating map ${mapId} with:`, updates);
      return {
        maps: state.maps.map((m) => (m.id === mapId ? { ...m, ...updates } : m)),
        saveStatus: 'unsaved',
      };
    }),

  saveMap: (mapState) =>
    set((state) => {
      if (!state.isLoaded || !mapState.id) return state;

      const exists = state.maps.some(m => m.id === mapState.id);
      const currentMap = state.maps.find(m => m.id === mapState.id);
      
      // Normalize comparison to avoid false positives
      const hasChanged = !currentMap || JSON.stringify(currentMap) !== JSON.stringify(mapState);
      
      if (!hasChanged) return state;

      console.log(`[ProjectStore] Syncing map changes: ${mapState.id}`);
      return {
        saveStatus: 'unsaved',
        maps: exists 
            ? state.maps.map((m) => (m.id === mapState.id ? mapState : m))
            : [...state.maps, mapState],
      };
    }),

  reorderMaps: (mapIds) =>
    set((state) => {
      const reordered = mapIds
        .map((id) => state.maps.find((m) => m.id === id))
        .filter((m): m is MapState => !!m);
      return { maps: reordered, saveStatus: 'unsaved' };
    }),

  setActiveMapId: (mapId) => set({ activeMapId: mapId, saveStatus: 'unsaved' }),

  updateProjectMetadata: (updates) => set((state) => ({ ...state, ...updates, saveStatus: 'unsaved' })),

  setProject: (project) => {
      const validMaps = (project.maps || []).filter(m => m && m.id);
      set({ 
          ...project, 
          maps: validMaps,
          saveStatus: 'saved', 
          isLoaded: true 
      });
  },

  newProject: (metadata) => {
    const newId = typeof crypto?.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    set({
      id: newId,
      name: metadata?.name || 'New Project',
      author: metadata?.author || '',
      defaultGridType: metadata?.defaultGridType || 'square',
      maps: [],
      activeMapId: null,
      saveStatus: 'unsaved',
      isLoaded: true
    });
  },

  closeProject: async () => {
    // 1. Clear project from IndexedDB
    await db.projects.clear();
    
    // 2. Reset store
    set({
        id: '',
        name: '',
        author: '',
        defaultGridType: 'square',
        maps: [],
        activeMapId: null,
        saveStatus: 'saved',
        isLoaded: false
    });
  },

  checkAssetUsage: (assetId) => {
    const { maps } = useProjectStore.getState();
    return maps.some(map => 
        map.assets.some(a => a.customAssetId === assetId) ||
        map.tiles.some(t => t.tilesetId === assetId)
    );
  },

  cleanupAssetUsageGlobal: (assetId) => {
    set((state) => ({
        maps: state.maps.map(map => ({
            ...map,
            assets: map.assets.filter(a => a.customAssetId !== assetId),
            tiles: map.tiles.filter(t => t.tilesetId !== assetId),
            tilesets: map.tilesets.filter(ts => ts.id !== assetId)
        })),
        saveStatus: 'unsaved'
    }));
  },

  checkFontUsage: (fontFamily) => {
    const { maps } = useProjectStore.getState();
    return maps.some(map => 
        map.assets.some(a => a.type === 'text' && a.properties?.fontFamily === fontFamily)
    );
  },

  cleanupFontUsageGlobal: (fontFamily) => {
    set((state) => ({
        maps: state.maps.map(map => ({
            ...map,
            assets: map.assets.map(a => {
                if (a.type === 'text' && a.properties?.fontFamily === fontFamily) {
                    return { ...a, properties: { ...a.properties, fontFamily: 'Arial' } };
                }
                return a;
            })
        })),
        saveStatus: 'unsaved'
    }));
  }
}));
