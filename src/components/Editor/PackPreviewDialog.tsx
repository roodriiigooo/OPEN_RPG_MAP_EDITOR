import React, { useState } from 'react';
import { useAssetStore } from '../../store/useAssetStore';
import { X, Package, Check, User, Info, ShieldCheck, CheckSquare, Square, Layers, Paintbrush, Fence, Stamp, Type } from 'lucide-react';
import { clsx } from 'clsx';

interface PackPreviewDialogProps {
    onConfirm: (selectedIds: string[]) => void;
}

export const PackPreviewDialog: React.FC<PackPreviewDialogProps> = ({ onConfirm }) => {
  const { isPackPreviewOpen, setIsPackPreviewOpen, packPreviewData } = useAssetStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'assets' | 'fonts'>('assets');

  // Initialize selection when data loads
  React.useEffect(() => {
    if (packPreviewData) {
        const ids = new Set(packPreviewData.assets.map(a => a.meta.id));
        if (packPreviewData.fonts) {
            packPreviewData.fonts.forEach(f => ids.add(f.meta.id));
        }
        setSelectedIds(ids);

        // Auto-switch tab if first is empty
        if (packPreviewData.assets.length === 0 && packPreviewData.fonts && packPreviewData.fonts.length > 0) {
            setActiveTab('fonts');
        } else {
            setActiveTab('assets');
        }
    }
  }, [packPreviewData]);

  if (!isPackPreviewOpen || !packPreviewData) return null;

  const { manifest, assets, fonts } = packPreviewData;
  const selectedAssetsCount = assets.filter(a => selectedIds.has(a.meta.id)).length;
  const selectedFontsCount = (fonts || []).filter(f => selectedIds.has(f.meta.id)).length;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const totalItems = assets.length + (fonts?.length || 0);

  const toggleAll = () => {
    if (selectedIds.size === totalItems) setSelectedIds(new Set());
    else {
        const ids = new Set(assets.map(a => a.meta.id));
        if (fonts) fonts.forEach(f => ids.add(f.meta.id));
        setSelectedIds(ids);
    }
  };

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-panel border-theme rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-main">Bundle Preview</h2>
              <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">Review and select assets to import</p>
            </div>
          </div>
          <button 
            onClick={() => setIsPackPreviewOpen(false)}
            className="text-muted hover:text-main transition-colors p-2 hover:bg-black/20 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Metadata Sidebar */}
            <div className="w-full md:w-72 border-r border-theme bg-black/10 p-6 space-y-6 overflow-y-auto shrink-0">
                <div className="space-y-4">
                    <div className="p-4 bg-black/40 rounded-xl border border-theme/50 space-y-3">
                        <h3 className="text-xs font-black uppercase text-orange-500 tracking-widest">{manifest.name}</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted">
                                <User size={14} />
                                <span className="text-[10px] font-bold uppercase">{manifest.author}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted">
                                <Info size={14} />
                                <span className="text-[10px] font-bold uppercase">v{manifest.version}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted">
                                <ShieldCheck size={14} />
                                <span className="text-[10px] font-bold uppercase truncate">{manifest.license}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted tracking-widest px-1">Import Summary</label>
                        <div className="grid grid-cols-1 gap-2">
                            <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-theme">
                                <span className="text-[10px] font-bold uppercase text-muted">Selected</span>
                                <span className="text-sm font-black text-main">{selectedIds.size} / {totalItems}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={toggleAll}
                    className="w-full py-2 bg-black/40 hover:bg-black/60 border border-theme rounded-xl text-[10px] font-black uppercase tracking-widest text-muted hover:text-main transition-all"
                >
                    {selectedIds.size === totalItems ? 'Deselect All' : 'Select All Items'}
                </button>
            </div>

            {/* Main Content Area with Tabs */}
            <div className="flex-1 flex flex-col overflow-hidden bg-black/5">
                {/* Tabs */}
                <div className="flex gap-4 px-6 pt-4 border-b border-theme/30 bg-black/10">
                    <button 
                        onClick={() => setActiveTab('assets')}
                        className={clsx(
                            "flex items-center gap-2 pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                            activeTab === 'assets' ? "text-orange-500" : "text-muted hover:text-main"
                        )}
                    >
                        <Layers size={14} />
                        Assets
                        <span className="bg-black/40 px-1.5 py-0.5 rounded-full text-[8px]">{selectedAssetsCount}/{assets.length}</span>
                        {activeTab === 'assets' && <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-full" />}
                    </button>

                    {fonts && fonts.length > 0 && (
                        <button 
                            onClick={() => setActiveTab('fonts')}
                            className={clsx(
                                "flex items-center gap-2 pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                                activeTab === 'fonts' ? "text-orange-500" : "text-muted hover:text-main"
                            )}
                        >
                            <Type size={14} />
                            Fonts
                            <span className="bg-black/40 px-1.5 py-0.5 rounded-full text-[8px]">{selectedFontsCount}/{fonts.length}</span>
                            {activeTab === 'fonts' && <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-full" />}
                        </button>
                    )}
                </div>

                {/* Content Grid */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    {activeTab === 'assets' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                            {assets.map((asset) => {
                                const isSelected = selectedIds.has(asset.meta.id);
                                return (
                                    <div 
                                        key={asset.meta.id}
                                        onClick={() => toggleSelect(asset.meta.id)}
                                        className={clsx(
                                            "group relative aspect-square rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center p-2 overflow-hidden",
                                            isSelected 
                                                ? "bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-900/20" 
                                                : "bg-black/40 border-theme grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
                                        )}
                                    >
                                        <img src={asset.url} alt={asset.meta.name} className="max-w-full max-h-full object-contain mb-1 drop-shadow-md" />
                                        
                                        <div className="absolute top-1.5 right-1.5">
                                            {isSelected ? (
                                                <div className="p-1 bg-orange-600 rounded-lg text-white shadow-lg">
                                                    <CheckSquare size={12} />
                                                </div>
                                            ) : (
                                                <div className="p-1 bg-black/60 rounded-lg text-white/20">
                                                    <Square size={12} />
                                                </div>
                                            )}
                                        </div>

                                        <div className={clsx(
                                            "absolute bottom-1.5 left-1.5 p-1 rounded-md text-white text-[8px] font-black uppercase tracking-tighter",
                                            asset.meta.type === 'stamp' ? 'bg-blue-600' : 
                                            asset.meta.type === 'terrain' ? 'bg-emerald-600' : 'bg-rose-600'
                                        )}>
                                            {asset.meta.type}
                                        </div>

                                        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center pointer-events-none">
                                            <span className="text-[9px] text-white font-black uppercase leading-tight line-clamp-2">{asset.meta.name}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'fonts' && fonts && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-right-2 duration-300">
                            {fonts.map((font) => {
                                const isSelected = selectedIds.has(font.meta.id);
                                return (
                                    <div 
                                        key={font.meta.id}
                                        onClick={() => toggleSelect(font.meta.id)}
                                        className={clsx(
                                            "group relative aspect-square rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center p-4 overflow-hidden",
                                            isSelected 
                                                ? "bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-900/20" 
                                                : "bg-black/40 border-theme grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
                                        )}
                                    >
                                        <div className="flex-1 flex items-center justify-center w-full">
                                            <Type size={32} className="text-main opacity-40 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <span className="text-[10px] font-black text-main uppercase tracking-tight text-center truncate w-full mt-2">
                                            {font.meta.family}
                                        </span>
                                        
                                        <div className="absolute top-1.5 right-1.5">
                                            {isSelected ? (
                                                <div className="p-1 bg-orange-600 rounded-lg text-white shadow-lg">
                                                    <CheckSquare size={12} />
                                                </div>
                                            ) : (
                                                <div className="p-1 bg-black/60 rounded-lg text-white/20">
                                                    <Square size={12} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute bottom-1.5 left-1.5 p-1 rounded-md bg-zinc-700 text-white text-[8px] font-black uppercase tracking-tighter">
                                            font
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-theme bg-black/20 flex gap-3 justify-end">
            <button
              onClick={() => setIsPackPreviewOpen(false)}
              className="px-8 py-3 rounded-xl text-xs font-black text-muted hover:text-main hover:bg-black/20 transition-all uppercase tracking-widest"
            >
              Discard
            </button>
            <button
              onClick={() => onConfirm(Array.from(selectedIds))}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-12 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-muted rounded-xl text-xs font-black text-white transition-all shadow-xl shadow-blue-900/40 uppercase tracking-widest active:scale-[0.98]"
            >
              <Check size={18} /> Confirm Import ({selectedIds.size})
            </button>
        </div>
      </div>
    </div>
  );
};
