import React from 'react';
import { useTextStore } from '../../store/useTextStore';
import { Type, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface FontLibrarySelectorProps {
    currentFont: string;
    onSelect: (font: string) => void;
}

export const FontLibrarySelector: React.FC<FontLibrarySelectorProps> = ({ currentFont, onSelect }) => {
    const { customFontFamilies } = useTextStore();

    const systemFonts = [
        'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Trebuchet MS',
        'Alternity', 'Breathe Fire', 'Britannian', 'Dragnel', 'Dragonfly', 'Dragonwick', 
        'Eyvindr', 'High Drowic', 'Magna Veritas', 'Runewood', 'The Wild Breath of Zelda', 'Vecna'
    ];

    const allFonts = [...systemFonts, ...customFontFamilies];

    return (
        <div className="space-y-2">
            <label className="text-[8px] font-black uppercase tracking-widest text-muted px-1 flex items-center gap-2">
                <Type size={10} /> Quick Font Swap
            </label>
            <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {allFonts.map((font) => (
                    <button
                        key={font}
                        onClick={() => onSelect(font)}
                        className={clsx(
                            "flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-left group",
                            currentFont === font 
                                ? "bg-orange-600/10 border-orange-500 text-orange-500 shadow-inner" 
                                : "bg-black/20 border-theme text-muted hover:bg-black/40 hover:border-muted hover:text-main"
                        )}
                    >
                        <span 
                            className="text-sm truncate" 
                            style={{ fontFamily: font }}
                        >
                            {font}
                        </span>
                        {currentFont === font && <Check size={12} className="shrink-0" />}
                    </button>
                ))}
            </div>
        </div>
    );
};
