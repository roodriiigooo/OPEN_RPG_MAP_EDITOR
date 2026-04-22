import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronRight, ChevronLeft, LayoutGrid, Wand2, Info, Eye } from 'lucide-react';
import { clsx } from 'clsx';

interface TilingConverterProps {
  file: { file: File, url: string, id: string };
  onBack: () => void;
  onFinish: (blob: Blob, metadata: any) => void;
}

import { 
    NW, N, NE, W, E, SW, S, SE, 
    BLOB_MAP, BLOB_MASKS 
} from '../../utils/terrain/tiling';

export const TilingConverter: React.FC<TilingConverterProps> = ({ file, onBack, onFinish }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hoveredInput, setHoveredInput] = useState<number | null>(null);
  const [hoveredOutput, setHoveredOutput] = useState<number | null>(null);
  const [conversionMap, setConversionMap] = useState<{sIdx: number, sqIdx: number}[][]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImgRef = useRef<HTMLImageElement>(null);

  const getTileForQ = (mask: number, subPos: 'TL' | 'TR' | 'BL' | 'BR', index: number) => {
    const qs = 32;
    const getQ = (sx: number, sy: number, qPos: 'TL' | 'TR' | 'BL' | 'BR') => ({
        sx, sy, 
        sqx: (qPos === 'TR' || qPos === 'BR') ? qs : 0,
        sqy: (qPos === 'BL' || qPos === 'BR') ? qs : 0,
        sIdx: sy * 5 + sx,
        sqIdx: qPos === 'TL' ? 0 : qPos === 'TR' ? 1 : qPos === 'BL' ? 2 : 3
    });

    // Diagonal Tiles Logic (48-51) Refined
    if (index >= 47) {
        if (index === 47) { // Tile 48: Diag TR Refined (TL=T15/Q1, TR=T9/Q4, BL=T9/Q4, BR=T4/Q1)
            if (subPos === 'TL') return getQ(4, 2, 'TL'); 
            if (subPos === 'TR') return getQ(3, 1, 'BR'); 
            if (subPos === 'BL') return getQ(3, 1, 'BR'); 
            if (subPos === 'BR') return getQ(3, 0, 'TL'); 
            return getQ(1, 1, 'TL');
        }
        if (index === 48) { // Tile 49: Diag TL Refined (TL=T9/Q3, TR=T15/Q2, BL=T4/Q1, BR=T9/Q3)
            if (subPos === 'TL') return getQ(3, 1, 'BL');
            if (subPos === 'TR') return getQ(4, 2, 'TR');
            if (subPos === 'BL') return getQ(3, 0, 'TL');
            if (subPos === 'BR') return getQ(3, 1, 'BL');
            return getQ(1, 1, 'TL');
        }
        if (index === 49) { // Tile 50: Diag BR Refined (TL=T4/Q1, TR=T10/Q3, BL=T10/Q3, BR=T15/Q4)
            if (subPos === 'TL') return getQ(3, 0, 'TL');
            if (subPos === 'TR') return getQ(4, 1, 'BL');
            if (subPos === 'BL') return getQ(4, 1, 'BL');
            if (subPos === 'BR') return getQ(4, 2, 'BR');
            return getQ(1, 1, 'TL');
        }
        if (index === 50) { // Tile 51: Diag BL Refined (TL=T10/Q4, TR=T4/Q1, BL=T15/Q3, BR=T10/Q4)
            if (subPos === 'TL') return getQ(4, 1, 'BR');
            if (subPos === 'TR') return getQ(3, 0, 'TL');
            if (subPos === 'BL') return getQ(4, 2, 'BL');
            if (subPos === 'BR') return getQ(4, 1, 'BR');
            return getQ(1, 1, 'TL');
        }
    }

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
        if (hasN && !hasE) return getQ(2, 1, 'TR');
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
        if (hasS && !hasE) return getQ(2, 1, 'BR');
        if (!hasS && hasE) return getQ(1, 2, 'BR');
        if (hasS && hasE && !hasSE) return getQ(3, 0, 'BR');
        return getQ(1, 1, 'BR');
    }
    return getQ(1, 1, subPos);
  };

  const processConversion = async () => {
    if (!sourceImgRef.current || !canvasRef.current) return;
    setIsProcessing(true);

    const img = sourceImgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tw = 64; 
    const th = 64;
    const qs = 32;

    canvas.width = tw * 6;
    canvas.height = th * 9; 
    ctx.imageSmoothingEnabled = false;

    const newMap: {sIdx: number, sqIdx: number}[][] = [];

    BLOB_MASKS.forEach((mask, i) => {
        const tx = i % 6;
        const ty = Math.floor(i / 6);
        const dx = tx * tw;
        const dy = ty * th;

        const tileUsage: {sIdx: number, sqIdx: number}[] = [];
        ['TL', 'TR', 'BL', 'BR'].forEach((qPos: any) => {
            const { sx, sy, sqx, sqy, sIdx, sqIdx } = getTileForQ(mask, qPos, i);
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
        if (blob) { setPreviewUrl(URL.createObjectURL(blob)); setIsProcessing(false); }
    });
  };

  const handleFinish = async () => {
    if (canvasRef.current) {
        const safeOriginal = await (new Response(file.file)).blob();
        canvasRef.current.toBlob(blob => {
            if (blob) onFinish(blob, { 
                tileSize: 64, 
                importMode: 'blob', 
                isBlobSet: 1,
                originalBlob: safeOriginal
            });
        });
    }
  };

  const quadColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
  const quadLabels = ['TL', 'TR', 'BL', 'BR'];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-950">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6 border-r border-white/5">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3"><LayoutGrid className="text-orange-500" /> Input: 5x3 Grid</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Standard 15-tile Mini-set Layout</p>
            </div>
          </div>

          <div className="relative group bg-black/40 rounded-3xl border-2 border-dashed border-zinc-800 flex items-center justify-center p-8 transition-all hover:border-orange-500/50">
            <div className="relative inline-block shadow-2xl bg-checkered">
                <img ref={sourceImgRef} src={file.url} alt="Source" className="w-[320px] block" style={{ imageRendering: 'pixelated' }} onLoad={processConversion} />
                <div className="absolute inset-0 grid grid-cols-5 grid-rows-3 pointer-events-auto">
                    {Array.from({ length: 15 }).map((_, i) => {
                        const isHoveredIn = hoveredInput === i;
                        const isRelatedToOutput = hoveredOutput !== null && conversionMap[hoveredOutput]?.some(u => u.sIdx === i);
                        
                        return (
                            <div 
                                key={i} 
                                onMouseEnter={() => setHoveredInput(i)} 
                                onMouseLeave={() => setHoveredInput(null)} 
                                className={clsx("border border-white/5 flex items-center justify-center transition-all relative overflow-hidden", isHoveredIn ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/50 z-10' : isRelatedToOutput ? 'border-blue-400/50 z-10 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]' : '')}
                            >
                                {(isHoveredIn || hoveredOutput !== null) && (
                                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5 pointer-events-none transition-all">
                                        {[0, 1, 2, 3].map((slotIdx) => {
                                            const isThisQuadrantUsed = hoveredOutput !== null && conversionMap[hoveredOutput]?.some(usage => usage.sIdx === i && usage.sqIdx === slotIdx);
                                            if (!isHoveredIn && !isThisQuadrantUsed) return <div key={slotIdx} />;
                                            return (
                                                <div 
                                                    key={slotIdx}
                                                    className={clsx("rounded-sm transition-all flex items-center justify-center border border-white/5", quadColors[slotIdx], isHoveredIn ? "opacity-40" : "opacity-70 shadow-[0_0_10px_rgba(255,255,255,0.3)] ring-1 ring-white/50")}
                                                >
                                                    {isHoveredIn && <span className="text-[6px] font-black text-white/50">{quadLabels[slotIdx]}</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <span className="absolute top-0.5 right-1 text-[8px] font-black text-white/80 bg-black/60 px-1 rounded-sm pointer-events-none z-20 shadow-sm border border-white/5">{i + 1}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[480px] p-8 bg-black/20 flex flex-col gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Generated 6x9 Atlas</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">Standard 51-Tile Blob</p>
          </div>

          <div className="flex-1 relative bg-zinc-900/50 rounded-3xl border border-white/5 p-6 flex items-center justify-center overflow-auto custom-scrollbar">
            {isProcessing ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /><span className="text-[10px] font-black text-orange-500 uppercase animate-pulse">Building Atlas...</span>
                </div>
            ) : previewUrl ? (
                <div className="relative inline-block bg-checkered shadow-2xl">
                    <img src={previewUrl} alt="Preview" className="max-w-full block" style={{ imageRendering: 'pixelated' }} />
                    <div className="absolute inset-0 grid grid-cols-6 grid-rows-9 pointer-events-auto">
                        {BLOB_MASKS.map((_, i) => {
                            const isHoveredOut = hoveredOutput === i;
                            const isRelatedToInput = hoveredInput !== null && conversionMap[i]?.some(u => u.sIdx === hoveredInput);
                            return (
                                <div key={i} onMouseEnter={() => setHoveredOutput(i)} onMouseLeave={() => setHoveredOutput(null)} className={clsx("border border-white/5 transition-all relative", isHoveredOut ? 'bg-blue-500/20 border-blue-400 ring-2 ring-blue-500/50 z-10' : isRelatedToInput ? 'border-orange-500/10 border-orange-500/50 z-10' : '')}>
                                    {hoveredInput !== null && (
                                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5 opacity-60 pointer-events-none">
                                            {[0, 1, 2, 3].map((slotIdx) => {
                                                const isFromHoveredInput = conversionMap[i]?.some(usage => usage.sIdx === hoveredInput && usage.sqIdx === slotIdx);
                                                return <div key={slotIdx} className={clsx("rounded-sm transition-all", isFromHoveredInput ? `${quadColors[slotIdx]} opacity-40 shadow-[0_0_5px_rgba(255,255,255,0.3)] border border-white/10` : '')} />;
                                            })}
                                        </div>
                                    )}
                                    <span className="absolute top-0.5 right-1 text-[8px] font-black text-white/80 bg-black/60 px-1 rounded-sm pointer-events-none z-20 shadow-sm border border-white/5">{i + 1}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="space-y-3">
              <button onClick={handleFinish} disabled={isProcessing || !previewUrl} className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-900/20 active:scale-95 flex items-center justify-center gap-2">
                <Check size={20} /> Import Result
              </button>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-white/5 bg-zinc-900/50 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-white transition-all uppercase tracking-widest"><ChevronLeft size={16} /> Back</button>
        <div className="flex items-center gap-4"><p className="text-[9px] text-zinc-500 font-bold uppercase max-w-[200px] leading-tight">Hover over tiles to visualize mapping logic.</p></div>
      </div>
    </div>
  );
};
