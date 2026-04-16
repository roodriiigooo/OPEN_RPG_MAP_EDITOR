import React from 'react';
import { useAssetStore } from '../../store/useAssetStore';
import { X, CheckCircle2, AlertCircle, Copy, RefreshCw, SkipForward, Package, Ban } from 'lucide-react';
import { clsx } from 'clsx';

export const ImportProgressDialog: React.FC = () => {
  const { 
    isImportProgressOpen, setIsImportProgressOpen, 
    importStats, currentConflict, resolveConflictAction, clearImportStats,
    rememberChoice, setRememberChoice
  } = useAssetStore();

  if (!isImportProgressOpen) return null;

  const handleClose = () => {
    setIsImportProgressOpen(false);
    clearImportStats();
  };

  const isFinished = !currentConflict && importStats.total > 0 && (importStats.imported + importStats.skipped === importStats.total);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-panel border-theme rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-main">Importing Bundle</h2>
              <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">Community Pack Processing</p>
            </div>
          </div>
          {isFinished && (
            <button 
                onClick={handleClose}
                className="text-muted hover:text-main transition-colors p-2 hover:bg-black/20 rounded-full"
            >
                <X size={24} />
            </button>
          )}
        </div>

        <div className="p-8 space-y-8">
          {/* Progress Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 p-4 rounded-xl border border-theme flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-blue-500">{importStats.imported}</span>
                <span className="text-[9px] font-black uppercase text-muted tracking-widest">Imported</span>
            </div>
            <div className="bg-black/20 p-4 rounded-xl border border-theme flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-orange-500">{importStats.skipped}</span>
                <span className="text-[9px] font-black uppercase text-muted tracking-widest">Skipped</span>
            </div>
          </div>

          {/* Conflict Resolver */}
          {currentConflict ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-start gap-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                    <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500 shrink-0">
                        <AlertCircle size={20} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold text-main uppercase tracking-tight">Asset Conflict Detected</h3>
                        <p className="text-xs text-muted leading-relaxed">
                            The asset <span className="text-orange-400 font-bold">"{currentConflict.name}"</span> already exists in your library. How would you like to proceed?
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 px-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                            type="checkbox"
                            checked={rememberChoice}
                            onChange={(e) => setRememberChoice(e.target.checked)}
                            className="w-4 h-4 rounded border-theme bg-black/40 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                        />
                        <span className="text-[10px] font-black uppercase text-muted group-hover:text-main transition-colors tracking-widest">Apply to all remaining conflicts</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    <button 
                        onClick={() => resolveConflictAction('replace')}
                        className="flex items-center gap-3 p-3 bg-black/40 hover:bg-red-600/20 border border-theme hover:border-red-500/50 rounded-xl transition-all group"
                    >
                        <RefreshCw size={18} className="text-muted group-hover:text-red-500 transition-colors" />
                        <div className="text-left">
                            <div className="text-[11px] font-black uppercase text-main">Replace Existing</div>
                            <div className="text-[9px] text-muted">Overwrite the current asset with the new version</div>
                        </div>
                    </button>

                    <button 
                        onClick={() => resolveConflictAction('keep')}
                        className="flex items-center gap-3 p-3 bg-black/40 hover:bg-blue-600/20 border border-theme hover:border-blue-500/50 rounded-xl transition-all group"
                    >
                        <Copy size={18} className="text-muted group-hover:text-blue-500 transition-colors" />
                        <div className="text-left">
                            <div className="text-[11px] font-black uppercase text-main">Keep Both</div>
                            <div className="text-[9px] text-muted">Import as a copy with a unique name</div>
                        </div>
                    </button>

                    <button 
                        onClick={() => resolveConflictAction('skip')}
                        className="flex items-center gap-3 p-3 bg-black/40 hover:bg-zinc-600/20 border border-theme hover:border-zinc-500/50 rounded-xl transition-all group"
                    >
                        <SkipForward size={18} className="text-muted group-hover:text-zinc-400 transition-colors" />
                        <div className="text-left">
                            <div className="text-[11px] font-black uppercase text-main">Skip Asset</div>
                            <div className="text-[9px] text-muted">Ignore this asset and continue with the rest</div>
                        </div>
                    </button>

                    <div className="h-px bg-theme opacity-20 my-2" />

                    <button 
                        onClick={() => resolveConflictAction('cancel')}
                        className="flex items-center justify-center gap-2 p-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 rounded-xl transition-all group text-red-400 font-bold uppercase text-[10px] tracking-widest"
                    >
                        <Ban size={14} />
                        Cancel Entire Process
                    </button>
                </div>
            </div>
          ) : isFinished ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-4 animate-in fade-in duration-500">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 size={40} />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-black text-main uppercase">Import Complete!</h3>
                    <p className="text-xs text-muted uppercase font-bold tracking-tighter">
                        Library successfully updated with {importStats.imported} new items.
                    </p>
                </div>
                <button
                    onClick={handleClose}
                    className="mt-4 px-12 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-900/40 active:scale-95"
                >
                    Back to Library
                </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                <p className="text-xs text-muted font-bold uppercase tracking-widest animate-pulse">Extracting assets...</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {!isFinished && (
            <div className="h-1 bg-black/40 w-full relative border-t border-theme/20">
                <div 
                    className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                    style={{ width: `${( (importStats.imported + importStats.skipped) / (importStats.total || 1) ) * 100}%` }}
                />
            </div>
        )}
      </div>
    </div>
  );
};
