import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Square, Circle, Triangle, Pentagon, Upload, Trash2,
  Flame, Search, Filter, FileArchive, Layers,
  Globe, Download, CheckCircle2, User, ShieldCheck, Briefcase, Heart, Star,
  MoreVertical, Edit3, Paintbrush, Fence, Stamp, Package, Check, X, Tag, Type
} from 'lucide-react';
import { useAssetStore } from '../../store/useAssetStore';
import { useMapStore } from '../../store/useMapStore';
import { useEditorStore } from '../../store/useEditorStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useTerrainStore } from '../../store/useTerrainStore';
import { useWallStore } from '../../store/useWallStore';
import { useRoomStore } from '../../store/useRoomStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useTextStore } from '../../store/useTextStore';
import { CustomAsset } from '../../types/map';

import { TileType, TerrainTileset, Tileset } from '../../types/tiling';
import { LibraryManager } from './LibraryManager';
import { FontLibrary } from './FontLibrary';
import { RemoteAsset, RemoteManifest } from '../../types/library';
import { exportCommunityAssets } from '../../utils/export/communityExport';
import { db } from '../../db/projectDB';
import JSZip from 'jszip';
import { clsx } from 'clsx';
import { PackPreviewDialog } from './PackPreviewDialog';

interface StampItemProps {
  id?: string;
  type: string;
  icon?: React.ReactNode;
  previewUrl?: string;
  label: string;
}

const BUILTIN_STAMPS: Record<string, StampItemProps[]> = {
  'Effects': [
    { type: 'light', icon: <Flame size={24} className="text-amber-400" />, label: 'Light Source' },
  ]
};

const Section: React.FC<{ 
  title: string; 
  children: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, children, action, icon }) => (
  <div className="border-b border-theme last:border-0 pb-6">
    <div className="flex items-center justify-between p-3 bg-black/10">
      <div className="flex items-center gap-2">
        {icon && <div className="text-orange-500">{icon}</div>}
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">{title}</h3>
      </div>
      {action}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

interface AssetCatalogProps {
    mode?: 'library' | 'stamp' | 'terrain' | 'wall' | 'room-terrain' | 'room-wall';
}

export const AssetCatalog: React.FC<AssetCatalogProps> = ({ mode = 'library' }) => {
  const { 
    customAssets, loadAssets, removeAsset, categories, setCategories,
    remoteCatalogs, downloadRemoteAsset, isLoadingRemote,
    setIsImportDialogOpen, setPendingFiles, toggleFavorite, addAsset,
    setIsImportProgressOpen, setImportStats, setCurrentConflict, 
    setResolveConflictCallback, clearImportStats, rememberChoice,
    setIsPackExportDialogOpen, setIsPackPreviewOpen, setPackPreviewData, packPreviewData
  } = useAssetStore();
  const { addTileset, removeTileset, tilesets } = useMapStore();
  const setActiveTool = useEditorStore(s => s.setActiveTool);
  const { showAlert, showConfirm, showToast } = useNotificationStore();
  
  // Selection tracking for all tools
  const activeTerrainId = useTerrainStore(s => s.brushSettings.tilingSetId);
  const activeWallId = useWallStore(s => s.activeTilesetId);
  const { selectedWallId, selectedTerrainId, setSelectedWallId, setSelectedTerrainId } = useRoomStore();

  const setTilingSetId = useTerrainStore(s => s.setTilingSetId);
  const setPaintingMode = useTerrainStore(s => s.setPaintingMode);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'library' | 'fonts' | 'community'>('library');
  const [typeFilter, setTypeFilter] = useState<'all' | 'stamp' | 'terrain' | 'wall'>(
      (mode === 'library' || mode.startsWith('room-')) ? 'all' : mode as any
  );
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  
  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  
  const cancelImportRef = useRef(false);

  // Synchronize custom assets with MapStore tilesets
  useEffect(() => {
    const sync = async () => {
      await loadAssets();
    };
    sync();
  }, [loadAssets]);

  useEffect(() => {
    customAssets.forEach(asset => {
      if ((asset.type === 'terrain' || asset.type === 'wall') && !tilesets.find(ts => ts.id === asset.id)) {
        const imageUrl = asset.previewUrl || '';
        const isBlob = asset.tilingMetadata?.importMode === 'blob';
        
        if (isBlob) {
          addTileset({
            id: asset.id,
            name: asset.name,
            type: asset.type === 'terrain' ? TileType.GROUND : TileType.WALL,
            imageUrl,
            tileSize: asset.tilingMetadata?.tileSize || 64,
            bitmaskMap: { isBlobSet: 1 }
          } as any);
        } else {
          // Quadrant Mode mapping
          const roles = asset.tilingMetadata?.bitmaskMap || {};
          const bitmaskMap: Record<number, number> = {
              0: typeof roles.inner === 'number' ? roles.inner : 0,
              1: typeof roles['v-edge'] === 'number' ? roles['v-edge'] : 1,
              2: typeof roles['h-edge'] === 'number' ? roles['h-edge'] : 2,
              3: typeof roles.center === 'number' ? roles.center : 3,
              4: typeof roles.outer === 'number' ? roles.outer : 4,
          };

          addTileset({
            id: asset.id,
            name: asset.name,
            type: asset.type === 'terrain' ? TileType.GROUND : TileType.WALL,
            imageUrl,
            tileSize: asset.tilingMetadata?.tileSize || 64,
            quadrantSize: (asset.tilingMetadata?.tileSize || 64) / 2,
            bitmaskMap
          } as any);
        }
      }
    });
  }, [customAssets, tilesets, addTileset]);

  const onDragStart = (e: React.DragEvent, type: string, assetId?: string) => {
    if (mode !== 'stamp') {
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData('assetType', type);
    if (assetId) {
      e.dataTransfer.setData('customAssetId', assetId);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const navigateToTool = (asset: CustomAsset) => {
    if (asset.type === 'terrain') {
        setTilingSetId(asset.id);
        setPaintingMode('auto-tile');
        setActiveTool('terrain');
    } else if (asset.type === 'wall') {
        useWallStore.getState().setActiveTilesetId(asset.id);
        setActiveTool('wall');
    } else {
        setActiveTool('stamp');
    }
  };

  const handleAssetClick = (asset: CustomAsset, e?: React.MouseEvent) => {
    // Multi-select logic
    if (e && (e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        const newSelected = new Set(selectedIds);
        if (newSelected.has(asset.id)) newSelected.delete(asset.id);
        else newSelected.add(asset.id);
        setSelectedIds(newSelected);
        return;
    }

    // Normal selection (only if not currently multi-selecting)
    if (selectedIds.size > 0) {
        setSelectedIds(new Set());
        return;
    }

    if (mode === 'library') {
        if (asset.type === 'stamp') {
            useEditorStore.getState().setActiveStamp({ type: 'custom', customAssetId: asset.id });
            setActiveTool('stamp');
        } else {
            navigateToTool(asset);
        }
    } else if (mode === 'terrain') {
        setTilingSetId(asset.id);
        setPaintingMode('auto-tile');
    } else if (mode === 'wall') {
        useWallStore.getState().setActiveTilesetId(asset.id);
    } else if (mode === 'room-terrain') {
        setSelectedTerrainId(asset.id);
    } else if (mode === 'room-wall') {
        setSelectedWallId(asset.id);
    }
  };

  const handleBulkFavorite = async () => {
      const ids = Array.from(selectedIds);
      const anyUnfavorite = ids.some(id => !customAssets.find(a => a.id === id)?.favorite);
      for (const id of ids) {
          const asset = customAssets.find(a => a.id === id);
          if (asset && asset.favorite !== anyUnfavorite) {
              await toggleFavorite(id);
          }
      }
      setSelectedIds(new Set());
  };

  const handleBulkRemove = async () => {
      const ids = Array.from(selectedIds);
      const usedIds = ids.filter(id => useProjectStore.getState().checkAssetUsage(id));
      
      const performBulkDelete = async () => {
          for (const id of ids) {
              await removeAsset(id);
              removeTileset(id);
              useProjectStore.getState().cleanupAssetUsageGlobal(id);
              useMapStore.getState().cleanupAssetUsage(id);
          }
          setSelectedIds(new Set());
          showToast("Assets Deleted", `${ids.length} assets were removed from the project.`, "success");
      };

      if (usedIds.length > 0) {
          showConfirm(
              "Assets in Use!",
              `${usedIds.length} of the selected assets are currently in use. Deleting them will remove ALL their instances from ALL maps. Proceed?`,
              performBulkDelete,
              { type: "error", confirmLabel: "Delete All Everywhere" }
          );
      } else {
          showConfirm(
              "Delete Multiple?",
              `Are you sure you want to delete ${selectedIds.size} assets? This cannot be undone.`,
              performBulkDelete,
              { type: "error" }
          );
      }
  };

  const handleBulkMove = async (cat: string) => {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
          await useAssetStore.getState().updateAssetMetadata(id, { category: cat });
      }
      setSelectedIds(new Set());
      setIsMoveMenuOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const zipFile = Array.from(files).find(f => f.name.endsWith('.zip'));
    if (zipFile) {
        handleZipUpload(zipFile);
    } else {
        setPendingFiles(Array.from(files));
        setIsImportDialogOpen(true);
    }
    e.target.value = '';
  };

  const handleZipUpload = async (file: File) => {
    setIsProcessingZip(true);
    try {
        const zip = new JSZip();
        const content = await zip.loadAsync(file);
        const manifestFile = content.file('manifest.json');
        
        if (!manifestFile) {
            showAlert("Invalid Bundle", "This is not a valid Community Pack (manifest.json missing).", "error");
            setIsProcessingZip(false);
            return;
        }

        const manifestData = JSON.parse(await manifestFile.async('string')) as RemoteManifest;
        const assetsToPreview: any[] = [];
        const fontsToPreview: any[] = [];

        for (const assetMeta of manifestData.assets) {
            const assetFile = content.file(`assets/${assetMeta.path}`);
            if (assetFile) {
                const blob = await assetFile.async('blob');
                
                // Read thumbnail if it exists in the bundle (for terrain/wall)
                let thumbBlob: Blob | undefined = undefined;
                if (assetMeta.thumbnailPath) {
                    const thumbFile = content.file(`assets/${assetMeta.thumbnailPath}`);
                    if (thumbFile) thumbBlob = await thumbFile.async('blob');
                }

                assetsToPreview.push({
                    meta: assetMeta,
                    blob: blob,
                    thumbnailBlob: thumbBlob,
                    url: URL.createObjectURL(thumbBlob || blob), // Use thumbnail for catalog preview
                    selected: true
                });
            }
        }

        // Process fonts if present in manifest
        if (manifestData.fonts) {
            for (const fontMeta of manifestData.fonts) {
                const fontFile = content.file(`assets/${fontMeta.path}`);
                if (fontFile) {
                    const blob = await fontFile.async('blob');
                    fontsToPreview.push({
                        meta: fontMeta,
                        blob: blob,
                        selected: true
                    });
                }
            }
        }

        setPackPreviewData({ manifest: manifestData, assets: assetsToPreview, fonts: fontsToPreview } as any);
        setIsPackPreviewOpen(true);

    } catch (err) {
        console.error("Failed to parse community pack:", err);
        showAlert("Parse Error", "Error reading zip bundle structure.", "error");
    } finally {
        setIsProcessingZip(false);
    }
  };

  const startFinalImport = async (selectedIds: string[]) => {
    if (!packPreviewData) return;
    
    setIsPackPreviewOpen(false);
    setIsImportProgressOpen(true);
    setIsProcessingZip(true);
    cancelImportRef.current = false;
    
    let imported = 0;
    let skipped = 0;
    let sessionChoice: 'replace' | 'keep' | 'skip' | null = null;
    const sessionImportedIds: string[] = [];

    const selectedAssets = packPreviewData.assets.filter(a => selectedIds.includes(a.meta.id));
    const selectedFonts = (packPreviewData.fonts || []).filter(f => selectedIds.includes(f.meta.id));
    const totalToImport = selectedAssets.length + selectedFonts.length;
    
    setImportStats({ total: totalToImport, imported: 0, conflicts: 0, skipped: 0 });

    try {
        // 1. Process Assets
        for (const asset of selectedAssets) {
            if (cancelImportRef.current) break;

            const existing = await db.customAssets.get(asset.meta.id);
            let finalAsset = {
                id: asset.meta.id,
                name: asset.meta.name,
                category: asset.meta.category,
                type: asset.meta.type,
                blob: asset.blob,
                thumbnailBlob: asset.thumbnailBlob,
                snapToGrid: true,
                tilingMetadata: asset.meta.tiling ? {
                    tileSize: asset.meta.tiling.tileSize,
                    quadrantSize: asset.meta.tiling.quadrantSize,
                    importMode: asset.meta.tiling.importMode,
                    bitmaskMap: asset.meta.tiling.bitmaskMap
                } : undefined
            };

            if (existing) {
                let resolution: 'replace' | 'keep' | 'skip' | 'cancel' = sessionChoice || 'skip';

                if (!sessionChoice) {
                    resolution = await new Promise<'replace' | 'keep' | 'skip' | 'cancel'>((resolve) => {
                        setCurrentConflict({ id: asset.meta.id, name: asset.meta.name, type: asset.meta.type });
                        setResolveConflictCallback((action: 'replace' | 'keep' | 'skip' | 'cancel') => {
                            if (useAssetStore.getState().rememberChoice && action !== 'cancel') {
                                sessionChoice = action;
                            }
                            resolve(action);
                        });
                    });
                }

                setCurrentConflict(null);
                setResolveConflictCallback(null);

                if (resolution === 'cancel') {
                    cancelImportRef.current = true;
                    break;
                }
                if (resolution === 'skip') {
                    skipped++;
                    setImportStats({ total: totalToImport, imported, conflicts: 0, skipped });
                    continue;
                } else if (resolution === 'keep') {
                    finalAsset.id = crypto.randomUUID();
                    finalAsset.name = `${finalAsset.name} (Copy)`;
                }
            }

            await addAsset(finalAsset);
            sessionImportedIds.push(finalAsset.id);
            imported++;
            setImportStats({ total: totalToImport, imported, conflicts: 0, skipped });
        }

        // 2. Process Fonts
        if (!cancelImportRef.current && selectedFonts.length > 0) {
            // Pre-fetch all custom fonts for rigorous comparison
            const localFonts = await db.customFonts.toArray();

            for (const font of selectedFonts) {
                if (cancelImportRef.current) break;

                const normalizedNewFamily = font.meta.family.toLowerCase().replace(/\s+/g, "");
                
                // Check by ID OR by Rigorous Family Name comparison
                const existingById = await db.customFonts.get(font.meta.id);
                const existingByFamily = localFonts.find(lf => 
                    lf.family.toLowerCase().replace(/\s+/g, "") === normalizedNewFamily
                );
                
                const existing = existingById || existingByFamily;

                let finalFont = {
                    id: font.meta.id,
                    name: font.meta.name,
                    family: font.meta.family,
                    blob: font.blob,
                    fileName: font.meta.name
                };

                if (existing) {
                    let resolution: 'replace' | 'keep' | 'skip' | 'cancel' = sessionChoice || 'skip';

                    if (!sessionChoice) {
                        resolution = await new Promise<'replace' | 'keep' | 'skip' | 'cancel'>((resolve) => {
                            setCurrentConflict({ id: font.meta.id, name: font.meta.name, type: 'font' });
                            setResolveConflictCallback((action: 'replace' | 'keep' | 'skip' | 'cancel') => {
                                if (useAssetStore.getState().rememberChoice && action !== 'cancel') {
                                    sessionChoice = action;
                                }
                                resolve(action);
                            });
                        });
                    }

                    setCurrentConflict(null);
                    setResolveConflictCallback(null);

                    if (resolution === 'cancel') {
                        cancelImportRef.current = true;
                        break;
                    }
                    if (resolution === 'skip') {
                        skipped++;
                        setImportStats({ total: totalToImport, imported, conflicts: 0, skipped });
                        continue;
                    } else if (resolution === 'keep') {
                        finalFont.id = crypto.randomUUID();
                        finalFont.family = `${finalFont.family} (Copy)`;
                    }
                }

                await db.customFonts.put(finalFont);
                imported++;
                setImportStats({ total: totalToImport, imported, conflicts: 0, skipped });
            }
            // Sync fonts globally
            const allFonts = await db.customFonts.toArray();
            useTextStore.getState().setCustomFontFamilies(allFonts.map(f => f.family));
        }

        if (cancelImportRef.current) {
            // Revert asset imports if cancelled (simple version)
            for (const id of sessionImportedIds) {
                await removeAsset(id);
            }
            setIsImportProgressOpen(false);
            clearImportStats();
        }

    } catch (err) {
        console.error("Extraction FAILED:", err);
        showAlert("Import Error", `Extraction failed: ${err instanceof Error ? err.message : 'Unknown error'}`, "error");
        setIsImportProgressOpen(false);
        clearImportStats();
    } finally {
        setIsProcessingZip(false);
        if (packPreviewData.assets) {
            packPreviewData.assets.forEach(a => URL.revokeObjectURL(a.url));
        }
        setPackPreviewData(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        const zipFile = Array.from(files).find(f => f.name.endsWith('.zip'));
        if (zipFile) {
            handleZipUpload(zipFile);
        } else {
            setPendingFiles(Array.from(files));
            setIsImportDialogOpen(true);
        }
    }
  };

  const handleRemoveAsset = async (id: string) => {
    const asset = customAssets.find(a => a.id === id);
    if (!asset) return;

    const isUsed = useProjectStore.getState().checkAssetUsage(id);
    
    const performDelete = async () => {
        await removeAsset(id);
        removeTileset(id);
        useProjectStore.getState().cleanupAssetUsageGlobal(id);
        // Also cleanup active map specifically to trigger UI update
        useMapStore.getState().cleanupAssetUsage(id);
        showToast("Asset Deleted", `"${asset.name}" and all its instances were removed.`, "success");
    };

    if (isUsed) {
        showConfirm(
            "Asset in Use!",
            `"${asset.name}" is currently used in one or more maps. Deleting it will remove ALL its instances from ALL maps in the project. Proceed?`,
            performDelete,
            { type: "error", confirmLabel: "Delete Everywhere" }
        );
    } else {
        showConfirm(
            "Delete Asset?",
            `Are you sure you want to delete "${asset.name}" from the library?`,
            performDelete,
            { type: "error" }
        );
    }
  };

  const filteredCustomAssets = useMemo(() => {
    return customAssets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesType = true;
      if (mode === 'library') matchesType = typeFilter === 'all' || asset.type === typeFilter;
      else if (mode === 'terrain' || mode === 'room-terrain') matchesType = asset.type === 'terrain';
      else if (mode === 'wall' || mode === 'room-wall') matchesType = asset.type === 'wall';
      else if (mode === 'stamp') matchesType = asset.type === 'stamp';
      
      return matchesSearch && matchesType;
    });
  }, [customAssets, searchTerm, typeFilter, mode]);

  const favoriteAssets = useMemo(() => {
    return filteredCustomAssets.filter(a => a.favorite);
  }, [filteredCustomAssets]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    const effectiveType = (mode === 'library' || mode.startsWith('room-')) ? typeFilter : mode;
    if (effectiveType === 'all' || effectiveType === 'stamp') {
      Object.keys(BUILTIN_STAMPS).forEach(cat => cats.add(cat));
    }
    filteredCustomAssets.forEach(a => cats.add(a.category));
    return Array.from(cats);
  }, [filteredCustomAssets, typeFilter, mode]);

  const renderAssetRow = (asset: CustomAsset) => {
    const isActive = (mode === 'terrain' && activeTerrainId === asset.id) || 
                     (mode === 'wall' && activeWallId === asset.id) ||
                     (mode === 'room-terrain' && selectedTerrainId === asset.id) ||
                     (mode === 'room-wall' && selectedWallId === asset.id);
    
    return (
      <div
        key={asset.id}
        onClick={(e) => handleAssetClick(asset, e)}
        className={clsx(
            "group flex items-center gap-3 p-2 rounded-xl transition-all border cursor-pointer mb-1",
            isActive 
                ? "bg-orange-500/20 border-orange-500 ring-1 ring-orange-500/50" 
                : "bg-black/20 hover:bg-black/40 border-theme hover:border-orange-500/50"
        )}
      >
        <div className="w-10 h-10 shrink-0 bg-black/40 rounded-lg overflow-hidden border border-theme">
            <img src={asset.thumbnailUrl || asset.previewUrl} alt={asset.name} className="w-full h-full object-contain drop-shadow-md" />
        </div>
        
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase text-main truncate tracking-tight">{asset.name}</p>
            <p className="text-[8px] font-bold text-muted uppercase tracking-tighter opacity-60">{asset.category}</p>
        </div>

        <div className="flex items-center gap-2 pr-2">
            {isActive && <Check size={14} className="text-orange-500" strokeWidth={3} />}
            <button 
                onClick={(e) => { e.stopPropagation(); toggleFavorite(asset.id); }}
                className="p-1.5 rounded-lg hover:bg-black/40 text-red-500 transition-all"
            >
                <Heart size={12} fill="currentColor" />
            </button>
        </div>
      </div>
    );
  };

  const renderAssetCard = (asset: CustomAsset) => {
    const isActive = (mode === 'terrain' && activeTerrainId === asset.id) || 
                     (mode === 'wall' && activeWallId === asset.id) ||
                     (mode === 'room-terrain' && selectedTerrainId === asset.id) ||
                     (mode === 'room-wall' && selectedWallId === asset.id);
    
    const isMultiSelected = selectedIds.has(asset.id);

    return (
      <div
        key={asset.id}
        draggable={mode === 'stamp'}
        onDragStart={(e) => onDragStart(e, asset.type === 'stamp' ? 'custom' : asset.type, asset.id)}
        onClick={(e) => handleAssetClick(asset, e)}
        className={clsx(
            "group relative flex flex-col items-center justify-center p-2 rounded-xl transition-all border aspect-square overflow-hidden",
            isActive && selectedIds.size === 0
                ? "bg-orange-500/20 border-orange-500 ring-2 ring-orange-500/50 z-10" 
                : isMultiSelected
                ? "bg-blue-500/30 border-blue-400 ring-2 ring-blue-500/50 z-10"
                : "bg-black/20 hover:bg-black/40 border-theme hover:border-orange-500/50",
            mode === 'stamp' ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
        )}
        style={{ touchAction: 'none' }}
      >
        <img src={asset.thumbnailUrl || asset.previewUrl} alt={asset.name} className="w-full h-full object-contain mb-1 rounded drop-shadow-md transition-transform group-hover:scale-110 duration-300" />
        
        {/* Selection Indicator Badge */}
        {(isActive && selectedIds.size === 0) && (
            <div className="absolute top-1 left-1 bg-orange-500 text-white p-1 rounded-lg shadow-lg">
                <Check size={10} strokeWidth={4} />
            </div>
        )}

        {isMultiSelected && (
            <div className="absolute top-1 left-1 bg-blue-500 text-white p-1 rounded-lg shadow-lg">
                <Check size={10} strokeWidth={4} />
            </div>
        )}

        {/* Action Buttons Layer */}
        <div className="absolute top-1.5 inset-x-1.5 flex justify-between gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          {/* Delete (Top Left) */}
          {mode === 'library' ? (
              <button 
                  onClick={(e) => { e.stopPropagation(); handleRemoveAsset(asset.id); }}
                  className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all shadow-lg shadow-red-900/40"
                  title="Delete Asset"
              >
                  <Trash2 size={12} />
              </button>
          ) : <div />}

          {/* Favorite (Top Right) */}
          <button 
              onClick={(e) => { e.stopPropagation(); toggleFavorite(asset.id); }}
              className={clsx(
                  "p-1.5 rounded-lg border transition-all shadow-lg backdrop-blur-md",
                  asset.favorite 
                      ? "bg-red-500 border-red-400 text-white" 
                      : "bg-black/60 border-theme text-white/40 hover:text-red-400"
              )}
          >
            <Heart size={12} fill={asset.favorite ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Tool Type Badge (Only in Library mode) */}
        {mode === 'library' && (
            <div className={clsx(
                "absolute bottom-1.5 right-1.5 p-1.5 rounded-lg border shadow-lg backdrop-blur-md transition-all group-hover:translate-y-12",
                asset.type === 'stamp' ? 'bg-blue-600/80 border-blue-400/40 text-white' :
                asset.type === 'terrain' ? 'bg-emerald-600/80 border-emerald-400/40 text-white' :
                'bg-rose-600/80 border-rose-400/40 text-white'
            )}>
              {asset.type === 'stamp' && <Stamp size={10} />}
              {asset.type === 'terrain' && <Paintbrush size={10} />}
              {asset.type === 'wall' && <Fence size={10} />}
            </div>
        )}

        {/* Name Overlay (Center - strictly information) */}
        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center pointer-events-none">
          <span className="text-[10px] text-white font-black uppercase tracking-tight line-clamp-2">{asset.name}</span>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={clsx(
        "flex flex-col h-full bg-panel transition-all duration-300 relative",
        isDraggingOver && mode === 'library' && "ring-4 ring-inset ring-orange-500/50 bg-orange-500/5"
      )}
      onDragOver={(e) => { if (mode === 'library') e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => { if (mode === 'library') handleDrop(e); }}
    >
      {/* Header & Tabs */}
      {(mode === 'library' || mode.startsWith('room-')) && (
        <div className="p-4 border-b border-theme bg-black/20 flex flex-col gap-4">
            {mode === 'library' && (
                <div className="flex items-center justify-between">
                    <div className="flex gap-6">
                        <button 
                            onClick={() => setActiveTab('library')}
                            className={clsx(
                                "text-[11px] font-black uppercase tracking-[0.2em] transition-all relative pb-2",
                                activeTab === 'library' ? "text-orange-500" : "text-muted hover:text-main"
                            )}
                        >
                            Library
                            {activeTab === 'library' && <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-full" />}
                        </button>

                        <button 
                            onClick={() => setActiveTab('fonts')}
                            className={clsx(
                                "text-[11px] font-black uppercase tracking-[0.2em] transition-all relative pb-2",
                                activeTab === 'fonts' ? "text-orange-500" : "text-muted hover:text-main"
                            )}
                        >
                            Fonts
                            {activeTab === 'fonts' && <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-full" />}
                        </button>

                        {/* REQUIREMENT: Community Tab restored but DISABLED */}
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-muted/30 relative pb-2 cursor-not-allowed select-none" title="Community Tab is currently disabled">
                            Community
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'library' && (
                <>
                    <div className="relative group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-orange-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder={`Search assets...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-theme rounded-xl py-2 pl-10 pr-4 text-xs text-main placeholder:text-muted/50 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-bold"
                    />
                    </div>

                    {mode === 'library' && (
                        <div className="grid grid-cols-2 gap-1.5">
                        {(['all', 'stamp', 'terrain', 'wall'] as const).map((type) => (
                            <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={clsx(
                                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                                typeFilter === type 
                                ? "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/20" 
                                : "bg-black/20 border-theme text-muted hover:border-muted hover:bg-black/40"
                            )}
                            >
                            {type === 'stamp' && <Stamp size={10} />}
                            {type === 'terrain' && <Paintbrush size={10} />}
                            {type === 'wall' && <Fence size={10} />}
                            {type}
                            </button>
                        ))}
                        </div>
                    )}
                </>
            )}
        </div>
      )}

      {activeTab === 'fonts' && mode === 'library' ? (
          <div className="flex-1 min-h-0">
            <FontLibrary />
          </div>
      ) : (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/5">
                {favoriteAssets.length > 0 && (
                    <Section title="Favorites" icon={<Star size={14} fill="currentColor" />}>
                        <div className="grid grid-cols-5 gap-2">
                            {favoriteAssets.map(renderAssetCard)}
                        </div>
                    </Section>
                )}

                {allCategories.map(cat => {
                    const builtinStamps = (mode === 'library' ? (typeFilter === 'all' || typeFilter === 'stamp') : mode === 'stamp') 
                        ? (BUILTIN_STAMPS[cat] || []) : [];
                    const assetsForCat = filteredCustomAssets.filter(a => a.category === cat);
                    
                    if (builtinStamps.length === 0 && assetsForCat.length === 0) return null;

                    return (
                    <Section key={cat} title={cat}>
                        <div className="grid grid-cols-5 gap-2">
                        {builtinStamps.map((stamp) => (
                            <div
                            key={stamp.type}
                            draggable={mode === 'stamp'}
                            onDragStart={(e) => onDragStart(e, stamp.type)}
                            onClick={() => { 
                                if (mode === 'library') {
                                    setActiveTool('stamp'); 
                                }
                            }}
                            className={clsx(
                                "group flex flex-col items-center justify-center p-4 rounded-xl bg-black/20 hover:bg-black/40 transition-all border border-theme hover:border-orange-500/50 aspect-square",
                                mode === 'stamp' ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                            )}
                            style={{ touchAction: 'none' }}
                            >
                            <div className="text-muted group-hover:text-orange-500 mb-3 transition-colors scale-125 group-hover:scale-150 duration-300">
                                {stamp.icon}
                            </div>
                            <span className="text-[10px] text-muted font-black uppercase tracking-tighter text-center">{stamp.label}</span>
                            </div>
                        ))}
                        
                        {assetsForCat.map(renderAssetCard)}
                        </div>
                    </Section>
                    );
                })}
            </div>

            {/* Multi-Selection Action Toolbar */}
            {selectedIds.size > 0 && (
                <div className="absolute bottom-20 left-4 right-4 bg-orange-600 rounded-2xl p-3 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-4 duration-300 z-50">
                    <div className="flex items-center gap-3 ml-2">
                        <div className="bg-white text-orange-600 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-inner">
                            {selectedIds.size}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Assets Selected</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <div className="relative">
                            <button 
                                onClick={() => setIsMoveMenuOpen(!isMoveMenuOpen)}
                                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                                title="Move to Category"
                            >
                                <Tag size={16} />
                            </button>
                            
                            {isMoveMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-panel border border-theme rounded-xl shadow-2xl p-2 flex flex-col gap-1">
                                    <p className="text-[8px] font-black text-muted uppercase p-2 tracking-widest">Move to:</p>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => handleBulkMove(cat)}
                                            className="px-3 py-2 text-left text-[10px] font-bold text-main hover:bg-orange-600 hover:text-white rounded-lg transition-colors"
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleBulkFavorite}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                            title="Toggle Favorite"
                        >
                            <Heart size={16} fill="currentColor" />
                        </button>
                        
                        <button 
                            onClick={handleBulkRemove}
                            className="p-2 bg-red-500 hover:bg-red-400 text-white rounded-xl transition-all"
                            title="Delete Selected"
                        >
                            <Trash2 size={16} />
                        </button>
                        
                        <div className="w-px h-6 bg-white/20 mx-1" />
                        
                        <button 
                            onClick={() => setSelectedIds(new Set())}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                            title="Clear Selection"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Library Actions Toolbar (At the bottom) */}
            {mode === 'library' && (
                <div className="p-4 border-t border-theme bg-black/20 flex items-center justify-between gap-2 shadow-2xl">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-muted uppercase tracking-tighter leading-none mb-1">Local Management</span>
                        <span className="text-[8px] font-bold text-muted/50 uppercase leading-none italic">
                            {isProcessingZip ? 'Processing bundle...' : 'Import/Export Assets'}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsPackExportDialogOpen(true)}
                            disabled={isProcessingZip}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white rounded-xl cursor-pointer transition-all shadow-xl shadow-blue-900/40 active:scale-95"
                            title="Export Community Pack"
                        >
                            <Package size={16} />
                            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Export Pack</span>
                        </button>
                        <div className="w-px h-8 bg-theme mx-1" />
                        <label className={clsx(
                            "p-2 rounded-xl cursor-pointer transition-all border border-theme shadow-lg active:scale-95 flex items-center gap-2",
                            isProcessingZip ? "bg-zinc-900 text-zinc-600" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        )} title="Import Community Pack (.zip)">
                            <FileArchive size={16} />
                            <input type="file" accept=".zip" onChange={handleFileUpload} className="hidden" disabled={isProcessingZip} />
                        </label>
                        <label className={clsx(
                            "p-2 rounded-xl cursor-pointer transition-all shadow-xl active:scale-95 flex items-center gap-2",
                            isProcessingZip ? "bg-orange-900 text-orange-200/50" : "bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/40"
                        )} title="Import PNG Assets">
                            <Upload size={16} />
                            <input type="file" multiple accept=".png" onChange={handleFileUpload} className="hidden" disabled={isProcessingZip} />
                        </label>
                    </div>
                </div>
            )}
          </>
      )}

      {/* Pack Preview Overlay */}
      <PackPreviewDialog onConfirm={startFinalImport} />
    </div>
  );
};
