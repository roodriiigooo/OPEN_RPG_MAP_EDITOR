import React, { useState, useEffect, useMemo } from 'react';
import { useAssetStore } from '../../store/useAssetStore';
import { X, Upload, Check, Image as ImageIcon, Layers, Maximize, PlusCircle, ChevronRight, Wand2, Paintbrush, Trash2, Search, Tag } from 'lucide-react';
import { CustomAsset, AssetType } from '../../types/map';
import { TilingConfigScreen } from './TilingConfigScreen';
import { TilingConverter } from './TilingConverter';
import { convert5x3ToBlob } from '../../utils/terrain/conversion';
import { clsx } from 'clsx';

interface FileConfig {
    name: string;
    type: 'stamp' | 'terrain' | 'wall';
    category: string;
}

export const AssetImportDialog: React.FC = () => {
  const { 
    isImportDialogOpen, setIsImportDialogOpen, 
    pendingFiles, setPendingFiles, 
    addAsset, categories, setCategories 
  } = useAssetStore();

  const [step, setStep] = useState(0); // 0: Config List, 1: Mapper, 2: Converter
  const [previews, setPreviews] = useState<{ file: File, url: string, id: string }[]>([]);
  const [fileConfigs, setFileConfigs] = useState<Record<string, FileConfig>>({});
  
  const [globalCategory, setGlobalCategory] = useState('Default');
  const [globalType, setGlobalType] = useState<'stamp' | 'terrain' | 'wall'>('stamp');
  
  const [isImporting, setIsImporting] = useState(false);
  const [processingFileId, setProcessingFileId] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      applyGlobalCategory(trimmed);
      setNewCategoryName('');
      setIsCreatingCategory(false);
    }
  };

  // Initialize previews and configs
  useEffect(() => {
    if (pendingFiles.length > 0) {
      const newPreviews = pendingFiles.map(file => ({
        file,
        url: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(2, 9)
      }));
      
      const initialConfigs: Record<string, FileConfig> = {};
      newPreviews.forEach(p => {
          initialConfigs[p.id] = {
              name: p.file.name.replace('.png', ''),
              type: globalType,
              category: globalCategory
          };
      });

      setPreviews(newPreviews);
      setFileConfigs(initialConfigs);

      return () => {
        newPreviews.forEach(p => URL.revokeObjectURL(p.url));
      };
    } else {
      setPreviews([]);
      setFileConfigs({});
    }
  }, [pendingFiles]);

  // Sync global changes to all files if desired
  const applyGlobalType = (type: 'stamp' | 'terrain' | 'wall') => {
      setGlobalType(type);
      setFileConfigs(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(id => next[id].type = type);
          return next;
      });
  };

  const applyGlobalCategory = (cat: string) => {
      setGlobalCategory(cat);
      setFileConfigs(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(id => next[id].category = cat);
          return next;
      });
  };

  const updateFileConfig = (id: string, updates: Partial<FileConfig>) => {
      setFileConfigs(prev => ({
          ...prev,
          [id]: { ...prev[id], ...updates }
      }));
  };

  const removeFile = (id: string) => {
      const p = previews.find(p => p.id === id);
      if (p) URL.revokeObjectURL(p.url);
      setPreviews(prev => prev.filter(p => p.id !== id));
      setFileConfigs(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
      });
  };

  if (!isImportDialogOpen) return null;

  const forceBlobCopy = async (file: File | Blob): Promise<Blob> => {
      return await (new Response(file)).blob();
  };

  const handleImportAll = async () => {
    setIsImporting(true);
    
    for (const p of previews) {
        const config = fileConfigs[p.id];
        if (!config) continue;

        if (config.type === 'stamp') {
            const safeBlob = await forceBlobCopy(p.file);
            await addAsset({
                id: crypto.randomUUID(),
                name: config.name,
                category: config.category,
                type: 'stamp',
                blob: safeBlob,
                snapToGrid: true
            });
        } else {
            try {
                const { blob, tileSize } = await convert5x3ToBlob(p.file);
                const safeThumbnail = await forceBlobCopy(p.file);
                await addAsset({
                    id: crypto.randomUUID(),
                    name: config.name,
                    category: config.category,
                    type: config.type,
                    blob: blob,
                    thumbnailBlob: safeThumbnail,
                    snapToGrid: true,
                    tilingMetadata: {
                        tileSize,
                        quadrantSize: tileSize / 2,
                        bitmaskMap: { isBlobSet: 1 },
                        importMode: 'blob'
                    }
                });
            } catch (err) {
                console.error(`Failed to convert ${config.name}:`, err);
            }
        }
    }

    finalize();
  };

  const handleSingleImport = async (id: string) => {
      const p = previews.find(p => p.id === id);
      const config = fileConfigs[id];
      if (!p || !config) return;

      setIsImporting(true);
      
      // Stamps are imported directly
      if (config.type === 'stamp') {
          await addAsset({
              id: crypto.randomUUID(),
              name: config.name,
              category: config.category,
              type: config.type,
              blob: p.file,
              snapToGrid: true
          });
          setPreviews(prev => prev.filter(item => item.id !== id));
          if (previews.length <= 1) finalize();
          else setIsImporting(false);
      } else {
          // Terrain/Wall: Redirect to Converter for single "Ready" import to ensure correct atlas generation
          startSmartProcessing(id, 'converter');
          setIsImporting(false);
      }
  };

  const finalize = () => {
    setIsImporting(false);
    setPendingFiles([]);
    setIsImportDialogOpen(false);
    setStep(0);
    setProcessingFileId(null);
  };

  const startSmartProcessing = (id: string, mode: 'mapper' | 'converter') => {
      setProcessingFileId(id);
      setStep(mode === 'mapper' ? 1 : 2);
  };

  const handleSmartFinish = async (blob: Blob, meta: any) => {
      if (!processingFileId) return;
      
      const config = fileConfigs[processingFileId];
      await addAsset({
          id: crypto.randomUUID(),
          name: config.name,
          category: config.category,
          type: config.type,
          blob: blob,
          thumbnailBlob: meta.originalBlob,
          snapToGrid: true,
          tilingMetadata: {
              tileSize: meta.tileSize,
              quadrantSize: meta.tileSize / 2,
              bitmaskMap: meta.mappings || { isBlobSet: 1 },
              importMode: meta.importMode
          }
      });

      const smartFiles = previews.filter(p => fileConfigs[p.id].type !== 'stamp');
      
      setPreviews(prev => prev.filter(p => p.id !== processingFileId));
      setProcessingFileId(null);
      setStep(0);
      
      // If we were processing the last smart file, finalize
      if (smartFiles.length <= 1 && previews.length <= 1) {
          finalize();
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-panel border-theme rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col h-[90vh]">
        
        {step === 0 && (
            <>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-theme bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-600 rounded-lg shadow-lg shadow-orange-900/40">
                            <Upload size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-main leading-tight">Import Assets</h2>
                            <p className="text-xs text-muted font-medium uppercase tracking-tighter">Configure each file before importing</p>
                        </div>
                    </div>
                    <button onClick={() => setIsImportDialogOpen(false)} className="text-muted hover:text-main transition-colors p-2 hover:bg-black/20 rounded-full"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Global Configuration Bar */}
                    <div className="bg-black/40 border-b border-theme p-4 flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Bulk Type:</label>
                            <div className="flex bg-black/40 p-1 rounded-xl border border-theme">
                                {(['stamp', 'terrain', 'wall'] as const).map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => applyGlobalType(t)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                            globalType === t ? "bg-orange-600 text-white shadow-lg" : "text-muted hover:text-main"
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Bulk Category:</label>
                            {!isCreatingCategory ? (
                                <select 
                                    value={globalCategory} 
                                    onChange={(e) => e.target.value === 'NEW' ? setIsCreatingCategory(true) : applyGlobalCategory(e.target.value)}
                                    className="bg-black/40 border border-theme rounded-xl px-3 py-1.5 text-[10px] text-main font-black uppercase appearance-none min-w-[150px]"
                                >
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    <option value="NEW" className="text-orange-500 font-bold">+ New Category</option>
                                </select>
                            ) : (
                                <div className="flex gap-1 animate-in slide-in-from-left-2">
                                    <input 
                                        autoFocus type="text" value={newCategoryName} 
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                                        placeholder="Category name..."
                                        className="bg-black/40 border border-orange-500/50 rounded-xl px-3 py-1.5 text-[10px] text-main font-black uppercase outline-none"
                                    />
                                    <button onClick={handleCreateCategory} className="p-1.5 bg-orange-600 text-white rounded-lg"><Check size={12} /></button>
                                    <button onClick={() => setIsCreatingCategory(false)} className="p-1.5 bg-black/40 text-muted rounded-lg"><X size={12} /></button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1" />
                        
                        <p className="text-[10px] text-muted font-bold uppercase italic">{previews.length} file{previews.length !== 1 ? 's' : ''} pending</p>
                    </div>

                    {/* Files List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                        {previews.map((p) => {
                            const config = fileConfigs[p.id];
                            if (!config) return null;

                            return (
                                <div key={p.id} className="group bg-black/20 hover:bg-black/30 border border-theme hover:border-orange-500/30 p-3 rounded-2xl flex items-center gap-6 transition-all">
                                    {/* Preview */}
                                    <div className="w-16 h-16 rounded-lg bg-black/40 border border-theme overflow-hidden shrink-0 flex items-center justify-center p-1">
                                        <img src={p.url} className="max-w-full max-h-full object-contain" alt="preview" />
                                    </div>

                                    {/* Name Input */}
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-muted ml-1">Asset Name</label>
                                        <input 
                                            type="text" 
                                            value={config.name}
                                            onChange={(e) => updateFileConfig(p.id, { name: e.target.value })}
                                            className="w-full bg-black/40 border border-theme focus:border-orange-500/50 rounded-xl px-3 py-2 text-xs text-main font-bold outline-none transition-all"
                                        />
                                    </div>

                                    {/* Type Selector */}
                                    <div className="w-40 space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-muted ml-1">Type</label>
                                        <select 
                                            value={config.type}
                                            onChange={(e) => updateFileConfig(p.id, { type: e.target.value as any })}
                                            className="w-full bg-black/40 border border-theme rounded-xl px-3 py-2 text-xs text-main font-bold appearance-none cursor-pointer"
                                        >
                                            <option value="stamp">Stamp / Prop</option>
                                            <option value="terrain">Terrain</option>
                                            <option value="wall">Wall</option>
                                        </select>
                                    </div>

                                    {/* Category Selector */}
                                    <div className="w-48 space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-muted ml-1">Category</label>
                                        <select 
                                            value={config.category}
                                            onChange={(e) => updateFileConfig(p.id, { category: e.target.value })}
                                            className="w-full bg-black/40 border border-theme rounded-xl px-3 py-2 text-xs text-main font-bold appearance-none cursor-pointer"
                                        >
                                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>

                                    {/* Action / Status */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {config.type !== 'stamp' ? (
                                                <>
                                                    <button 
                                                        onClick={() => startSmartProcessing(p.id, 'converter')}
                                                        className="p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl border border-blue-500/30 transition-all flex items-center gap-2"
                                                        title="47-Tile Converter"
                                                    >
                                                        <Wand2 size={16} />
                                                        <span className="text-[9px] font-black uppercase">Conv</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => startSmartProcessing(p.id, 'mapper')}
                                                        className="p-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl border border-emerald-500/30 transition-all flex items-center gap-2"
                                                        title="Manual Mapper"
                                                    >
                                                        <Layers size={16} />
                                                        <span className="text-[9px] font-black uppercase">Map</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => handleSingleImport(p.id)}
                                                    className="p-2 bg-orange-600/20 hover:bg-orange-600 text-orange-500 hover:text-white rounded-xl border border-orange-500/30 transition-all flex items-center gap-2"
                                                    title="Quick Import"
                                                >
                                                    <Check size={16} />
                                                    <span className="text-[9px] font-black uppercase">Import</span>
                                                </button>
                                            )}
                                        </div>
                                        
                                        <button 
                                            onClick={() => removeFile(p.id)}
                                            className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-theme bg-black/20 flex items-center justify-between">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl border border-theme">
                            <ImageIcon size={14} className="text-blue-400" />
                            <span className="text-[10px] font-black text-main">{previews.filter(p => fileConfigs[p.id]?.type === 'stamp').length} Stamps</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl border border-theme">
                            <Paintbrush size={14} className="text-orange-500" />
                            <span className="text-[10px] font-black text-main">{previews.filter(p => fileConfigs[p.id]?.type !== 'stamp').length} Smart Tiles</span>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <button onClick={() => setIsImportDialogOpen(false)} className="px-6 py-2 rounded-xl text-xs font-bold text-muted hover:text-main uppercase tracking-widest">Cancel</button>
                        <button 
                            onClick={handleImportAll} 
                            disabled={isImporting || previews.length === 0} 
                            className="px-8 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 rounded-xl text-xs font-black text-white transition-all shadow-xl shadow-orange-900/40 uppercase tracking-widest flex items-center gap-2"
                        >
                            {isImporting ? 'Processing...' : <><Check size={18} /> Batch Import All</>}
                        </button>
                    </div>
                </div>
            </>
        )}

        {step === 1 && processingFileId && (
            <TilingConfigScreen 
                file={previews.find(p => p.id === processingFileId)!}
                type={fileConfigs[processingFileId].type as any}
                onBack={() => setStep(0)} 
                onFinish={handleSmartFinish}
            />
        )}

        {step === 2 && processingFileId && (
            <TilingConverter 
                file={previews.find(p => p.id === processingFileId)!}
                onBack={() => setStep(0)}
                onFinish={handleSmartFinish}
            />
        )}
      </div>
    </div>
  );
};
