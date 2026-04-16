import { create } from 'zustand';
import { CustomAsset } from '../types/map';
import { db } from '../db/projectDB';
import { RemoteAsset, RemoteManifest, AssetSource } from '../types/library';
import { useNotificationStore } from './useNotificationStore';

interface AssetStore {
  customAssets: CustomAsset[];
  loadAssets: () => Promise<void>;
  addAsset: (asset: Omit<CustomAsset, 'previewUrl'>) => Promise<void>;
  updateAssetMetadata: (id: string, updates: Partial<CustomAsset>) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  categories: string[];
  setCategories: (categories: string[]) => void;
  
  // Import Dialog State
  isImportDialogOpen: boolean;
  setIsImportDialogOpen: (open: boolean) => void;
  pendingFiles: File[];
  setPendingFiles: (files: File[]) => void;

  // Import Progress & Conflict State
  isImportProgressOpen: boolean;
  setIsImportProgressOpen: (open: boolean) => void;
  isPackExportDialogOpen: boolean;
  setIsPackExportDialogOpen: (open: boolean) => void;
  isPackPreviewOpen: boolean;
  setIsPackPreviewOpen: (open: boolean) => void;
  packPreviewData: { 
    manifest: RemoteManifest; 
    assets: { meta: RemoteAsset; blob: Blob; url: string; selected: boolean }[];
    fonts?: { meta: any; blob: Blob; selected: boolean }[];
  } | null;
  setPackPreviewData: (data: any) => void;
  importStats: { total: number; imported: number; conflicts: number; skipped: number };
  setImportStats: (stats: { total: number; imported: number; conflicts: number; skipped: number }) => void;
  currentConflict: { id: string; name: string; type: string } | null;
  setCurrentConflict: (conflict: { id: string; name: string; type: string } | null) => void;
  rememberChoice: boolean;
  setRememberChoice: (remember: boolean) => void;
  resolveConflictAction: (action: 'replace' | 'keep' | 'skip' | 'cancel') => void;
  setResolveConflictCallback: (fn: ((action: 'replace' | 'keep' | 'skip' | 'cancel') => void) | null) => void;
  clearImportStats: () => void;
  
  // V2 Library Integration
  remoteSources: AssetSource[];
  remoteCatalogs: Record<string, RemoteManifest>;
  isLoadingRemote: boolean;
  addRemoteSource: (url: string) => Promise<void>;
  removeRemoteSource: (url: string) => void;
  fetchManifest: (url: string) => Promise<void>;
  downloadRemoteAsset: (manifest: RemoteManifest, asset: RemoteAsset) => Promise<void>;
  clearAllAssets: () => Promise<void>;
  setCustomAssets: (assets: CustomAsset[]) => void;
}

let resolveConflictFn: ((action: 'replace' | 'keep' | 'skip' | 'cancel') => void) | null = null;

export const useAssetStore = create<AssetStore>((set, get) => ({
  customAssets: [],
  categories: ['Default', 'Nature', 'Dungeon', 'Furniture'],
  
  // V2 Initial State
  remoteSources: [],
  remoteCatalogs: {},
  isLoadingRemote: false,
  isImportDialogOpen: false,
  pendingFiles: [],
  isImportProgressOpen: false,
  importStats: { total: 0, imported: 0, conflicts: 0, skipped: 0 },
  currentConflict: null,
  rememberChoice: false,

  isPackPreviewOpen: false,
  packPreviewData: null,

  setIsImportDialogOpen: (open) => set({ isImportDialogOpen: open }),
  setPendingFiles: (files) => set({ pendingFiles: files }),
  setIsImportProgressOpen: (open) => set({ isImportProgressOpen: open }),
  setIsPackExportDialogOpen: (open) => set({ isPackExportDialogOpen: open }),
  setIsPackPreviewOpen: (open) => set({ isPackPreviewOpen: open }),
  setPackPreviewData: (data) => set({ packPreviewData: data }),
  setImportStats: (stats) => set({ importStats: stats }),
  setCurrentConflict: (conflict) => set({ currentConflict: conflict }),
  setRememberChoice: (remember) => set({ rememberChoice: remember }),
  
  setResolveConflictCallback: (fn) => {
    resolveConflictFn = fn;
  },

  resolveConflictAction: (action) => {
    if (resolveConflictFn) {
        resolveConflictFn(action);
    }
  },

  clearImportStats: () => set({ 
    importStats: { total: 0, imported: 0, conflicts: 0, skipped: 0 },
    currentConflict: null,
    rememberChoice: false
  }),

  seedDefaultBundle: async () => {
    try {
      const response = await fetch('/assets/default-bundle/manifest.json');
      if (!response.ok) return;
      const manifest = await response.json();
      
      for (const asset of manifest.assets) {
        // Check if already exists
        const exists = await db.customAssets.get(asset.id);
        if (exists) continue;

        const imgResponse = await fetch(asset.url);
        if (!imgResponse.ok) continue;
        const blob = await imgResponse.blob();

        const newAsset: CustomAsset = {
          id: asset.id,
          name: asset.name,
          category: asset.category,
          type: asset.type,
          blob: blob,
          thumbnailBlob: asset.type !== 'stamp' ? blob : undefined,
          snapToGrid: true,
          tilingMetadata: asset.tiling ? {
            tileSize: asset.tiling.tileSize,
            quadrantSize: asset.tiling.quadrantSize || asset.tiling.tileSize / 2
          } : undefined
        };
        await db.customAssets.add(newAsset);
      }
      await get().loadAssets();
    } catch (err) {
      console.error('Failed to seed default bundle:', err);
    }
  },

  loadAssets: async () => {
    const assets = await db.customAssets.toArray();
    
    if (assets.length === 0) {
      await get().seedDefaultBundle();
      return;
    }

    // Create transient preview URLs
    const assetsWithPreviews = assets.map(asset => ({
      ...asset,
      previewUrl: URL.createObjectURL(asset.blob),
      thumbnailUrl: asset.thumbnailBlob ? URL.createObjectURL(asset.thumbnailBlob) : undefined
    }));
    set({ customAssets: assetsWithPreviews });
  },

  addAsset: async (asset) => {
    await db.customAssets.put(asset as CustomAsset);
    const withPreview = { 
        ...asset, 
        previewUrl: URL.createObjectURL(asset.blob),
        thumbnailUrl: asset.thumbnailBlob ? URL.createObjectURL(asset.thumbnailBlob) : undefined
    };
    set(state => ({
      customAssets: [
          ...state.customAssets.filter(a => a.id !== asset.id), 
          withPreview as CustomAsset
      ]
    }));
  },

  updateAssetMetadata: async (id, updates) => {
    await db.customAssets.update(id, updates);
    set(state => ({
      customAssets: state.customAssets.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  },

  removeAsset: async (id) => {
    const asset = get().customAssets.find(a => a.id === id);
    if (asset?.previewUrl) {
      URL.revokeObjectURL(asset.previewUrl);
    }
    if (asset?.thumbnailUrl) {
      URL.revokeObjectURL(asset.thumbnailUrl);
    }
    await db.customAssets.delete(id);
    set(state => ({
      customAssets: state.customAssets.filter(a => a.id !== id)
    }));
  },

  toggleFavorite: async (id) => {
    const asset = get().customAssets.find(a => a.id === id);
    if (!asset) return;
    const favorite = !asset.favorite;
    await db.customAssets.update(id, { favorite });
    set(state => ({
      customAssets: state.customAssets.map(a => a.id === id ? { ...a, favorite } : a)
    }));
  },

  setCategories: (categories) => set({ categories }),

  // V2 Actions
  addRemoteSource: async (url) => {
    if (get().remoteSources.find(s => s.url === url)) return;
    
    const newSource: AssetSource = {
      url,
      lastFetched: Date.now(),
      status: 'online'
    };
    
    set(state => ({ remoteSources: [...state.remoteSources, newSource] }));
    await get().fetchManifest(url);
  },

  removeRemoteSource: (url) => {
    set(state => ({
      remoteSources: state.remoteSources.filter(s => s.url !== url),
      remoteCatalogs: Object.fromEntries(
        Object.entries(state.remoteCatalogs).filter(([key]) => key !== url)
      )
    }));
  },

  fetchManifest: async (url) => {
    set({ isLoadingRemote: true });
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch manifest');
      const manifest: RemoteManifest = await response.json();
      
      set(state => ({
        remoteCatalogs: { ...state.remoteCatalogs, [url]: manifest },
        remoteSources: state.remoteSources.map(s => 
          s.url === url ? { ...s, lastFetched: Date.now(), status: 'online' } : s
        )
      }));
    } catch (err) {
      set(state => ({
        remoteSources: state.remoteSources.map(s => 
          s.url === url ? { ...s, status: 'error', error: (err as Error).message } : s
        )
      }));
    } finally {
      set({ isLoadingRemote: false });
    }
  },

  downloadRemoteAsset: async (manifest, remoteAsset) => {
    // Check if already in library
    if (get().customAssets.find(a => a.id === remoteAsset.id)) {
      console.log(`Asset ${remoteAsset.id} already in library.`);
      return;
    }

    try {
      const fullUrl = manifest.baseUrl + remoteAsset.path;
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Failed to download asset blob');
      const blob = await response.blob();

      let thumbnailBlob: Blob | undefined = undefined;
      if (remoteAsset.thumbnailPath) {
          const thumbUrl = manifest.baseUrl + remoteAsset.thumbnailPath;
          const thumbResponse = await fetch(thumbUrl);
          if (thumbResponse.ok) {
              thumbnailBlob = await thumbResponse.blob();
          }
      }
      
      const newCustomAsset: Omit<CustomAsset, 'previewUrl'> = {
        id: remoteAsset.id,
        name: remoteAsset.name,
        category: remoteAsset.category,
        type: remoteAsset.type,
        blob: blob,
        thumbnailBlob: thumbnailBlob,
        tilingMetadata: remoteAsset.tiling ? {
          tileSize: remoteAsset.tiling.tileSize,
          quadrantSize: remoteAsset.tiling.quadrantSize,
          importMode: remoteAsset.tiling.importMode,
          bitmaskMap: remoteAsset.tiling.bitmaskMap
        } : undefined
      };
      
      await get().addAsset(newCustomAsset);
    } catch (err) {
      console.error('Failed to download remote asset:', err);
      useNotificationStore.getState().showAlert("Download Error", `Error downloading ${remoteAsset.name}: ${(err as Error).message}`, "error");
    }
  },

  setCustomAssets: (assets) => {
    // Revoke old previews
    get().customAssets.forEach(a => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
        if (a.thumbnailUrl) URL.revokeObjectURL(a.thumbnailUrl);
    });
    
    // Create new previews
    const withPreviews = assets.map(asset => ({
        ...asset,
        previewUrl: URL.createObjectURL(asset.blob),
        thumbnailUrl: asset.thumbnailBlob ? URL.createObjectURL(asset.thumbnailBlob) : undefined
    }));
    
    set({ customAssets: withPreviews });
  },

  clearAllAssets: async () => {
    // 1. Revoke all object URLs
    get().customAssets.forEach(a => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    });
    // 2. Clear database
    await db.customAssets.clear();
    // 3. Reset store
    set({ customAssets: [] });
  }
}));
