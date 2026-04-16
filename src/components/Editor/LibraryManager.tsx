import React, { useState } from 'react';
import { useAssetStore } from '../../store/useAssetStore';
import { Plus, Trash2, Globe, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LibraryManager: React.FC = () => {
  const { remoteSources, addRemoteSource, removeRemoteSource, fetchManifest, isLoadingRemote } = useAssetStore();
  const [newUrl, setNewUrl] = useState('');

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    await addRemoteSource(newUrl);
    setNewUrl('');
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <form onSubmit={handleAddSource} className="space-y-2">
        <label className="text-[10px] font-bold uppercase text-muted tracking-wider block">
          Add Community Source (JSON URL)
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/assets.json"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 bg-black/40 border border-theme rounded-md px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-orange-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoadingRemote}
            className="p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-md transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
      </form>

      <div className="space-y-2 pt-2 border-t border-theme">
        <h4 className="text-[10px] font-bold uppercase text-muted tracking-wider">Connected Sources</h4>
        
        {remoteSources.length === 0 && (
          <div className="py-4 text-center border border-dashed border-theme rounded-lg opacity-50">
            <p className="text-[10px] uppercase font-bold text-muted">No remote sources connected</p>
          </div>
        )}

        {remoteSources.map((source) => (
          <div key={source.url} className="bg-black/20 border border-theme rounded-lg p-3 space-y-2 group">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Globe size={14} className={source.status === 'online' ? 'text-emerald-500' : 'text-red-500'} />
                <span className="text-[10px] font-mono text-zinc-400 truncate">{source.url}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => fetchManifest(source.url)}
                  className="p-1 hover:bg-black/40 text-muted hover:text-main rounded"
                  title="Refresh"
                >
                  <RefreshCw size={12} className={isLoadingRemote ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => removeRemoteSource(source.url)}
                  className="p-1 hover:bg-black/40 text-muted hover:text-red-400 rounded"
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {source.status === 'online' ? (
                <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold uppercase">
                  <CheckCircle2 size={10} /> Online
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[9px] text-red-400 font-bold uppercase">
                  <AlertCircle size={10} /> {source.error || 'Connection Failed'}
                </div>
              )}
              <span className="text-[9px] text-muted font-medium italic">
                Last synced: {new Date(source.lastFetched).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
