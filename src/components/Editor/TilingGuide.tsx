import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Info, HelpCircle, Wand2, MousePointer2, LayoutGrid, CheckCircle2, Eye, ChevronLeft, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { 
    NW, N, NE, W, E, SW, S, SE, 
    BLOB_MASKS 
} from '../../utils/terrain/tiling';

interface TilingGuideProps {
    onBack: () => void;
}

export const TilingGuide: React.FC<TilingGuideProps> = ({ onBack }) => {
    const [hoveredInput, setHoveredInput] = useState<number | null>(null);
    const [hoveredOutput, setHoveredOutput] = useState<number | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [conversionMap, setConversionMap] = useState<any[][]>([]);
    
    const sampleUrl = '/assets/sample/sample.png';
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Official Conversion Logic for Simulation (matching TilingConverter.tsx)
    const getTileForQ = (mask: number, subPos: 'TL' | 'TR' | 'BL' | 'BR', qs: number) => {
        const getQ = (sx: number, sy: number, qPos: 'TL' | 'TR' | 'BL' | 'BR') => ({
            sx, sy, 
            sqx: (qPos === 'TR' || qPos === 'BR') ? qs : 0,
            sqy: (qPos === 'BL' || qPos === 'BR') ? qs : 0,
            sIdx: sy * 5 + sx,
            sqIdx: qPos === 'TL' ? 0 : qPos === 'TR' ? 1 : qPos === 'BL' ? 2 : 3
        });

        if (mask === 0) return getQ(3, 2, subPos); 
        
        if (subPos === 'TL') {
            const hasN = mask & N, hasW = mask & W, hasNW = mask & NW;
            if (!hasN && !hasW) return getQ(0, 0, 'TL');
            if (hasN && !hasW) return getQ(0, 1, 'TL');
            if (!hasN && hasW) return getQ(1, 0, 'TL');
            if (hasN && hasW && !hasNW) return getQ(4, 1, 'TL');
            return getQ(1, 1, 'TL');
        }
        if (subPos === 'TR') {
            const hasN = mask & N, hasE = mask & E, hasNE = mask & NE;
            if (!hasN && !hasE) return getQ(2, 0, 'TR');
            if (hasN && !hasE) return { ...getQ(2, 1, 'TR'), sIdx: 2*5+2, sx: 2, sy: 1 }; // Fix for sample align
            if (!hasN && hasE) return getQ(1, 0, 'TR');
            if (hasN && hasE && !hasNE) return getQ(3, 1, 'TR');
            return getQ(1, 1, 'TR');
        }
        if (subPos === 'BL') {
            const hasS = mask & S, hasW = mask & W, hasSW = mask & SW;
            if (!hasS && !hasW) return getQ(0, 2, 'BL');
            if (hasS && !hasW) return getQ(0, 1, 'BL');
            if (!hasS && hasW) return getQ(1, 2, 'BL');
            if (hasS && hasW && !hasSW) return getQ(4, 0, 'BL');
            return getQ(1, 1, 'BL');
        }
        if (subPos === 'BR') {
            const hasS = mask & S, hasE = mask & E, hasSE = mask & SE;
            if (!hasS && !hasE) return getQ(2, 2, 'BR');
            if (hasS && !hasE) return { ...getQ(2, 1, 'BR'), sIdx: 2*5+2, sx: 2, sy: 1 }; // Fix for sample align
            if (!hasS && hasE) return getQ(1, 2, 'BR');
            if (hasS && hasE && !hasSE) return getQ(3, 0, 'BR');
            return getQ(1, 1, 'BR');
        }
        return getQ(1, 1, subPos);
    };

    // Generate the preview atlas on mount
    useEffect(() => {
        const img = new Image();
        img.src = sampleUrl;
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const tw = 64; 
            const th = 64;
            const qs = 32;

            canvas.width = tw * 6;
            canvas.height = th * 8;
            ctx.imageSmoothingEnabled = false;

            const newMap: any[][] = [];

            BLOB_MASKS.forEach((mask, i) => {
                const tx = i % 6;
                const ty = Math.floor(i / 6);
                const dx = tx * tw;
                const dy = ty * th;

                const tileUsage: any[] = [];
                ['TL', 'TR', 'BL', 'BR'].forEach((qPos: any) => {
                    const { sx, sy, sqx, sqy, sIdx, sqIdx } = getTileForQ(mask, qPos, 32);
                    tileUsage.push({ sIdx, sqIdx });
                    const srcX = sx * 64 + sqx;
                    const srcY = sy * 64 + sqy;
                    let dx_q = qPos === 'TR' || qPos === 'BR' ? 32 : 0;
                    let dy_q = qPos === 'BL' || qPos === 'BR' ? 32 : 0;
                    ctx.drawImage(img, srcX, srcY, 32, 32, dx + dx_q, dy + dy_q, 32, 32);
                });
                newMap.push(tileUsage);
            });

            setConversionMap(newMap);
            canvas.toBlob(blob => {
                if (blob) setPreviewUrl(URL.createObjectURL(blob));
            });
        };
    }, []);

    const handleDownloadSample = () => {
        const link = document.createElement('a');
        link.href = sampleUrl;
        link.download = 'sample_tiling_template.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const segments = [
        "Top-Left Corner", "Top Edge", "Top-Right Corner", "Alone Tile", "TL Inner Corner",
        "Left Edge", "Inner Fill", "Right Edge", "TR Inner Corner", "BL Inner Corner",
        "Bottom-Left Corner", "Bottom Edge", "Bottom-Right Corner", "BR Inner Corner", "Diagonal Fill"
    ];

    const quadColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
    const quadLabels = ['TL', 'TR', 'BL', 'BR'];

    return (
        <div className="flex flex-col h-full bg-panel animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="p-6 border-b border-theme bg-black/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-900/40">
                        <HelpCircle size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-widest text-main leading-tight">Auto-Tiling Guide</h2>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-tighter opacity-60">Interactive technical manual for 5x3 Grid conversion</p>
                    </div>
                </div>
                <button onClick={onBack} className="text-muted hover:text-main transition-colors p-2 hover:bg-black/20 rounded-xl"><X size={24} /></button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Logic & Preview Info */}
                <div className="w-96 border-r border-theme bg-black/10 p-8 overflow-y-auto custom-scrollbar space-y-8 shrink-0">
                    <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2"><Info size={14} /> The Logic</h3>
                        <p className="text-xs text-muted leading-relaxed">
                            The editor uses a <span className="text-main font-bold">47-tile Blob System</span>. We require <span className="text-main font-bold">15 base tiles</span> arranged in a 5x3 grid.
                        </p>
                        <p className="text-xs text-muted leading-relaxed">
                            The converter slices these into <span className="text-indigo-400 font-bold">60 quadrants</span> and recombines them.
                        </p>
                    </section>

                    <section className="space-y-3 p-4 rounded-2xl bg-white/5 border border-theme">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                            <LayoutGrid size={12} /> Technical Specs
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                <span className="text-[9px] text-muted uppercase font-bold">File Dimension</span>
                                <span className="text-[10px] text-main font-mono">320 x 192 px</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                <span className="text-[9px] text-muted uppercase font-bold">Base Tile</span>
                                <span className="text-[10px] text-main font-mono">64 x 64 px</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-muted uppercase font-bold">Quadrant</span>
                                <span className="text-[10px] text-main font-mono">32 x 32 px</span>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                            <MousePointer2 size={14} /> Interactive Preview
                        </h3>
                        <p className="text-[10px] text-muted italic">Hover over either grid to see the reconstruction logic:</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-[10px] font-bold uppercase"><div className="w-3 h-3 rounded bg-red-500/50 border border-red-500" /><span className="text-main">Top-Left Quadrant</span></div>
                            <div className="flex items-center gap-3 text-[10px] font-bold uppercase"><div className="w-3 h-3 rounded bg-blue-500/50 border border-blue-500" /><span className="text-main">Top-Right Quadrant</span></div>
                            <div className="flex items-center gap-3 text-[10px] font-bold uppercase"><div className="w-3 h-3 rounded bg-green-500/50 border border-green-500" /><span className="text-main">Bottom-Left Quadrant</span></div>
                            <div className="flex items-center gap-3 text-[10px] font-bold uppercase"><div className="w-3 h-3 rounded bg-yellow-500/50 border border-yellow-500" /><span className="text-main">Bottom-Right Quadrant</span></div>
                        </div>
                    </section>

                    {(hoveredInput !== null || hoveredOutput !== null) && (
                        <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 animate-in zoom-in-95 duration-200">
                            {hoveredInput !== null ? (
                                <><p className="text-[10px] font-black uppercase text-indigo-400 mb-1">Source Segment {hoveredInput + 1}</p><p className="text-sm font-bold text-main uppercase">{segments[hoveredInput] || "Variation Source"}</p></>
                            ) : (
                                <><p className="text-[10px] font-black uppercase text-orange-400 mb-1">Generated Tile {hoveredOutput! + 1}</p><p className="text-[10px] font-mono text-muted uppercase text-center bg-black/40 py-1 rounded mt-1 border border-theme">Mask: {BLOB_MASKS[hoveredOutput!]}</p></>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT PANEL: INPUT 5X3 */}
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6 border-r border-white/5 bg-editor">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3"><LayoutGrid className="text-orange-500" /> Input: 5x3 Grid</h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase">Source segments from sample.png</p>
                            </div>
                            <button 
                                onClick={handleDownloadSample}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-600/10 border border-orange-500/20 text-orange-500 hover:bg-orange-600 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-900/10"
                            >
                                <Download size={14} />
                                Download Template
                            </button>
                        </div>

                        <div className="relative group bg-black/40 rounded-3xl border-2 border-dashed border-zinc-800 flex items-center justify-center p-8 transition-all hover:border-orange-500/50">
                            <div className="relative inline-block shadow-2xl bg-checkered">
                                <img src={sampleUrl} alt="Source" className="w-[400px] block" style={{ imageRendering: 'pixelated' }} />
                                <div className="absolute inset-0 grid grid-cols-5 grid-rows-3 pointer-events-auto">
                                    {Array.from({ length: 15 }).map((_, i) => {
                                        const isHoveredIn = hoveredInput === i;
                                        const isRelatedToOutput = hoveredOutput !== null && conversionMap[hoveredOutput]?.some(u => u.sIdx === i);

                                        return (
                                            <div
                                                key={i}
                                                onMouseEnter={() => setHoveredInput(i)}
                                                onMouseLeave={() => setHoveredInput(null)}
                                                className={clsx(
                                                    "border border-white/5 flex items-center justify-center transition-all relative overflow-hidden",
                                                    isHoveredIn ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/50 z-10' : 
                                                    isRelatedToOutput ? 'border-blue-400/50 z-10 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]' : ''
                                                )}
                                            >
                                                {/* Quadrant Highlights (Transparent 0.4) */}
                                                {(isHoveredIn || hoveredOutput !== null) && (
                                                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5 pointer-events-none transition-all">
                                                        {[0, 1, 2, 3].map((slotIdx) => {
                                                            const isThisQuadrantUsedInHoveredOutput = hoveredOutput !== null && conversionMap[hoveredOutput]?.some(usage => usage.sIdx === i && usage.sqIdx === slotIdx);
                                                            const isDirectHover = isHoveredIn;
                                                            
                                                            if (!isDirectHover && !isThisQuadrantUsedInHoveredOutput) return <div key={slotIdx} />;

                                                            return (
                                                                <div
                                                                    key={slotIdx}
                                                                    className={clsx(
                                                                        "rounded-sm transition-all flex items-center justify-center border border-white/5",
                                                                        quadColors[slotIdx],
                                                                        isDirectHover ? "opacity-40" : "opacity-70 shadow-[0_0_10px_rgba(255,255,255,0.3)] ring-1 ring-white/50"
                                                                    )}
                                                                >
                                                                    {isDirectHover && <span className="text-[6px] font-black text-white/50">{quadLabels[slotIdx]}</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                <span className="absolute top-0.5 right-1 text-[8px] font-black text-white/80 bg-black/60 px-1 rounded-sm pointer-events-none z-20 shadow-sm border border-white/5">
                                                    {i + 1}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: GENERATED 6X8 ATLAS */}
                    <div className="w-full lg:w-[480px] p-8 bg-black/20 flex flex-col gap-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Generated 6x8 Atlas</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">Standard 47-Tile Blob</p>
                        </div>

                        <div className="flex-1 relative bg-zinc-900/50 rounded-3xl border border-white/5 p-6 flex items-center justify-center overflow-auto custom-scrollbar">
                            {previewUrl && (
                                <div className="relative inline-block bg-checkered shadow-2xl">
                                    <img src={previewUrl} alt="Preview" className="max-w-full block" style={{ imageRendering: 'pixelated' }} />
                                    <div className="absolute inset-0 grid grid-cols-6 grid-rows-8 pointer-events-auto">
                                        {BLOB_MASKS.map((_, i) => {
                                            const isHoveredOut = hoveredOutput === i;
                                            const isRelatedToInput = hoveredInput !== null && conversionMap[i]?.some(u => u.sIdx === hoveredInput);
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    onMouseEnter={() => setHoveredOutput(i)} 
                                                    onMouseLeave={() => setHoveredOutput(null)} 
                                                    className={clsx(
                                                        "border border-white/5 transition-all relative",
                                                        isHoveredOut ? 'bg-blue-500/20 border-blue-400 ring-2 ring-blue-500/50 z-10' : 
                                                        isRelatedToInput ? 'border-orange-500/10 border-orange-500/50 z-10' : ''
                                                    )}
                                                >
                                                    {/* Atlas Quadrant Highlights (Transparent 0.4) */}
                                                    {hoveredInput !== null && (
                                                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5 opacity-60 pointer-events-none">
                                                            {[0, 1, 2, 3].map((slotIdx) => {
                                                                const isFromHoveredInput = conversionMap[i]?.some(usage => usage.sIdx === hoveredInput && usage.sqIdx === slotIdx);
                                                                return (
                                                                    <div
                                                                        key={slotIdx}
                                                                        className={clsx("rounded-sm transition-all", isFromHoveredInput ? `${quadColors[slotIdx]} opacity-40 shadow-[0_0_5px_rgba(255,255,255,0.3)] border border-white/10` : '')}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                    <span className="absolute top-0.5 right-1 text-[8px] font-black text-white/80 bg-black/60 px-1 rounded-sm pointer-events-none z-20 shadow-sm border border-white/5">
                                                        {i + 1}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-theme bg-black/20 flex justify-center shrink-0">
                <div className="flex items-center gap-3 px-6 py-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
                    <Wand2 size={16} className="text-indigo-400" />
                    <p className="text-xs font-bold text-muted uppercase tracking-tight">
                        Our <span className="text-main font-bold">47-Tile Converter</span> does all the math for you. Just follow this 5x3 layout!
                    </p>
                </div>
            </div>
        </div>
    );
};
