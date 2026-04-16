import React, { useState } from 'react';
import { useAssetStore } from '../../store/useAssetStore';
import { exportCommunityAssets } from '../../utils/export/communityExport';
import { X, Package, Check, User, Info, ShieldCheck, Tag } from 'lucide-react';

export const PackExportDialog: React.FC = () => {
  const { isPackExportDialogOpen, setIsPackExportDialogOpen, customAssets } = useAssetStore();
  
  const [name, setName] = useState('My Custom Pack');
  const [author, setAuthor] = useState('Anonymous');
  const [version, setVersion] = useState('1.0.0');
  const [license, setLicense] = useState('CC BY 4.0');
  const [isExporting, setIsExporting] = useState(false);

  if (!isPackExportDialogOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    await exportCommunityAssets({
        name,
        author,
        version,
        license
    });
    setIsExporting(false);
    setIsPackExportDialogOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-panel border-theme rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-main">Export Pack</h2>
              <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">Prepare community bundle</p>
            </div>
          </div>
          <button 
            onClick={() => setIsPackExportDialogOpen(false)}
            className="text-muted hover:text-main transition-colors p-2 hover:bg-black/20 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
              <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted font-bold uppercase leading-relaxed">
                  You are about to export <span className="text-blue-400">{customAssets.length} assets</span>. 
                  Please fill in the metadata for your community bundle.
              </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted tracking-widest flex items-center gap-2">
                    <Tag size={12} className="text-orange-500" /> Pack Name
                </label>
                <input 
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Enter pack name..."
                    className="w-full bg-black/40 border border-theme rounded-xl px-4 py-2.5 text-xs text-main outline-none focus:border-orange-500 transition-all font-bold"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted tracking-widest flex items-center gap-2">
                    <User size={12} className="text-orange-500" /> Author
                </label>
                <input 
                    type="text" value={author} onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Your name or handle..."
                    className="w-full bg-black/40 border border-theme rounded-xl px-4 py-2.5 text-xs text-main outline-none focus:border-orange-500 transition-all font-bold"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted tracking-widest flex items-center gap-2">
                        <Info size={12} className="text-orange-500" /> Version
                    </label>
                    <input 
                        type="text" value={version} onChange={(e) => setVersion(e.target.value)}
                        placeholder="1.0.0"
                        className="w-full bg-black/40 border border-theme rounded-xl px-4 py-2.5 text-xs text-main outline-none focus:border-orange-500 transition-all font-bold font-mono"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted tracking-widest flex items-center gap-2">
                        <ShieldCheck size={12} className="text-orange-500" /> License
                    </label>
                    <select 
                        value={license} onChange={(e) => setLicense(e.target.value)}
                        className="w-full bg-black/40 border border-theme rounded-xl px-4 py-2.5 text-xs text-main outline-none focus:border-orange-500 transition-all font-bold appearance-none"
                    >
                        <option value="CC BY 4.0">CC BY 4.0</option>
                        <option value="CC0 (Public Domain)">CC0 (Public Domain)</option>
                        <option value="Personal Use Only">Personal Use</option>
                        <option value="MIT">MIT</option>
                    </select>
                </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-theme bg-black/20 flex gap-3">
            <button
              onClick={() => setIsPackExportDialogOpen(false)}
              className="flex-1 py-3 rounded-xl text-xs font-black text-muted hover:text-main hover:bg-black/20 transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || !name || !author}
              className="flex-[2] flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-muted rounded-xl text-xs font-black text-white transition-all shadow-xl shadow-blue-900/40 uppercase tracking-widest active:scale-[0.98]"
            >
              {isExporting ? 'Packaging Assets...' : <><Check size={18} /> Export Community Pack</>}
            </button>
        </div>
      </div>
    </div>
  );
};
