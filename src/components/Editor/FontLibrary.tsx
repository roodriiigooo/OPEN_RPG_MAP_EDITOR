import React, { useEffect, useState, useRef } from 'react';
import { useTextStore } from '../../store/useTextStore';
import { useCustomFonts } from '../../hooks/useCustomFonts';
import { db } from '../../db/projectDB';
import { Trash2, Upload, Search, Type } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useMapStore } from '../../store/useMapStore';
import { clsx } from 'clsx';

export const FontLibrary: React.FC = () => {
  const { customFontFamilies } = useTextStore();
  const { importFont } = useCustomFonts();
  const { showToast, showConfirm } = useNotificationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fonts, setFonts] = useState<{ id: string, family: string, name: string }[]>([]);

  const loadFonts = async () => {
    const allFonts = await db.customFonts.toArray();
    setFonts(allFonts.map(f => ({ id: f.id, family: f.family, name: f.name })));
  };

  useEffect(() => {
    loadFonts();
  }, [customFontFamilies]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const family = await importFont(file);
        showToast("Font Imported", `Successfully loaded ${family}`, "success");
        loadFonts();
      } catch (err: any) {
        showToast("Import Failed", err.message, "error");
      }
    }
    e.target.value = '';
  };

  const handleDeleteFont = async (id: string, family: string) => {
    const isUsed = useProjectStore.getState().checkFontUsage(family);

    const performDelete = async () => {
        try {
          await db.customFonts.delete(id);
          // Cleanup project-wide usage
          useProjectStore.getState().cleanupFontUsageGlobal(family);
          // Cleanup active map specifically to trigger UI update
          useMapStore.getState().cleanupFontUsage(family);
          
          // Update store list of families
          const remainingFonts = await db.customFonts.toArray();
          useTextStore.getState().setCustomFontFamilies(remainingFonts.map(f => f.family));
          loadFonts();
          showToast("Font Deleted", `"${family}" was removed and affected text reset to Arial.`, "success");
        } catch (err) {
          showToast("Error", "Failed to delete font", "error");
        }
    };

    if (isUsed) {
        showConfirm(
          "Font in Use!",
          `The font "${family}" is currently used in one or more maps. Deleting it will reset ALL affected text objects to Arial. Proceed?`,
          performDelete,
          { type: 'error', confirmLabel: "Delete & Reset Text" }
        );
    } else {
        showConfirm(
          "Delete Font?",
          `Are you sure you want to remove the font "${family}" from the library?`,
          performDelete,
          { type: 'error' }
        );
    }
  };

  const filteredFonts = fonts.filter(f => 
    f.family.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-panel overflow-hidden">
      {/* Search - FIXED TOP */}
      <div className="p-4 space-y-4 border-b border-theme bg-black/20 shrink-0">
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search custom fonts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-theme rounded-xl py-2 pl-10 pr-4 text-xs text-main placeholder:text-muted/50 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-bold"
          />
        </div>
      </div>

      {/* Font List - SCROLLABLE MIDDLE */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 bg-black/5 min-h-0">
        {filteredFonts.length === 0 ? (
          <div className="py-12 text-center opacity-30 flex flex-col items-center gap-4">
            <Type size={48} />
            <p className="text-xs font-black uppercase tracking-widest">No custom fonts found</p>
          </div>
        ) : (
          filteredFonts.map((font) => (
            <div 
              key={font.id}
              className="group bg-black/20 hover:bg-black/40 border border-theme hover:border-orange-500/30 rounded-xl p-4 transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-lg truncate mb-1" 
                    style={{ fontFamily: font.family }}
                  >
                    {font.family}
                  </p>
                  <p className="text-[8px] font-mono text-muted uppercase tracking-tighter opacity-50">
                    {font.name}
                  </p>
                </div>
                
                <button
                  onClick={() => handleDeleteFont(font.id, font.family)}
                  className="p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Delete Font"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Actions - FIXED BOTTOM */}
      <div className="p-4 border-t border-theme bg-black/20 shadow-2xl shrink-0">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-orange-900/40 active:scale-95"
        >
          <Upload size={16} />
          Import New Font
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".ttf,.otf,.woff,.woff2"
          className="hidden" 
        />
      </div>
    </div>
  );
};
