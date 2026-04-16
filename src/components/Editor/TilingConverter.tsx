import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronRight, ChevronLeft, LayoutGrid, Wand2, Info, Eye } from 'lucide-react';

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

  const processConversion = async () => {
    if (!sourceImgRef.current || !canvasRef.current) return;
    setIsProcessing(true);

    const img = sourceImgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tw = img.naturalWidth / 5;
    const th = img.naturalHeight / 3;
    const qs = tw / 2;

    canvas.width = tw * 6;
    canvas.height = th * 8;
    ctx.imageSmoothingEnabled = false;

    const newMap: {sIdx: number, sqIdx: number}[][] = [];

    const getSourceTile = (tx: number, ty: number) => ({ x: tx * tw, y: ty * th });

    const getTileForQ = (mask: number, subPos: 'TL' | 'TR' | 'BL' | 'BR'): {sx: number, sy: number, sqx: number, sqy: number, sIdx: number, sqIdx: number} => {
        // Correct Mapping based on user feedback for 5x3 set:
        // Tile 4 (index 3): NW Internal -> Corner at Quad 4 (BR)
        // Tile 5 (index 4): NE Internal -> Corner at Quad 3 (BL)
        // Tile 9 (index 8): SW Internal -> Corner at Quad 2 (TR)
        // Tile 10 (index 9): SE Internal -> Corner at Quad 1 (TL)

        const getQ = (sx: number, sy: number, qPos: 'TL' | 'TR' | 'BL' | 'BR') => ({
            sx, sy, 
            sqx: (qPos === 'TR' || qPos === 'BR') ? qs : 0,
            sqy: (qPos === 'BL' || qPos === 'BR') ? qs : 0,
            sIdx: sy * 5 + sx,
            sqIdx: qPos === 'TL' ? 0 : qPos === 'TR' ? 1 : qPos === 'BL' ? 2 : 3
        });

        // Isolated state
        if (mask === 0) return getQ(3, 2, subPos); 
        
        if (subPos === 'TL') {
            const hasN = mask & N, hasW = mask & W, hasNW = mask & NW;
            if (!hasN && !hasW) return getQ(0, 0, 'TL'); // Tile 1
            if (hasN && !hasW) return getQ(0, 1, 'TL');  // Tile 6
            if (!hasN && hasW) return getQ(1, 0, 'TL');  // Tile 2
            if (hasN && hasW && !hasNW) return getQ(4, 1, 'TL'); // Internal Corner: Use Tile 10, Quad 1 (TL)
            return getQ(1, 1, 'TL'); // Center
        }
        if (subPos === 'TR') {
            const hasN = mask & N, hasE = mask & E, hasNE = mask & NE;
            if (!hasN && !hasE) return getQ(2, 0, 'TR'); // Tile 3
            if (hasN && !hasE) return getQ(2, 1, 'TR');  // Tile 8
            if (!hasN && hasE) return getQ(1, 0, 'TR');  // Tile 2
            if (hasN && hasE && !hasNE) return getQ(3, 1, 'TR'); // Internal Corner: Use Tile 9, Quad 2 (TR)
            return getQ(1, 1, 'TR');
        }
        if (subPos === 'BL') {
            const hasS = mask & S, hasW = mask & W, hasSW = mask & SW;
            if (!hasS && !hasW) return getQ(0, 2, 'BL'); // Tile 11
            if (hasS && !hasW) return getQ(0, 1, 'BL');  // Tile 6
            if (!hasS && hasW) return getQ(1, 2, 'BL');  // Tile 12
            if (hasS && hasW && !hasSW) return getQ(4, 0, 'BL'); // Internal Corner: Use Tile 5, Quad 3 (BL)
            return getQ(1, 1, 'BL');
        }
        if (subPos === 'BR') {
            const hasS = mask & S, hasE = mask & E, hasSE = mask & SE;
            if (!hasS && !hasE) return getQ(2, 2, 'BR'); // Tile 13
            if (hasS && !hasE) return getQ(2, 1, 'BR');  // Tile 8
            if (!hasS && hasE) return getQ(1, 2, 'BR');  // Tile 12
            if (hasS && hasE && !hasSE) return getQ(3, 0, 'BR'); // Internal Corner: Use Tile 4, Quad 4 (BR)
            return getQ(1, 1, 'BR');
        }
        return getQ(1, 1, subPos);
    };

    BLOB_MASKS.forEach((mask, i) => {
        const tx = i % 6;
        const ty = Math.floor(i / 6);
        const dx = tx * tw;
        const dy = ty * th;

        const tileUsage: {sIdx: number, sqIdx: number}[] = [];
        ['TL', 'TR', 'BL', 'BR'].forEach((qPos: any) => {
            const { sx, sy, sqx, sqy, sIdx, sqIdx } = getTileForQ(mask, qPos);
            tileUsage.push({ sIdx, sqIdx });
            const src = getSourceTile(sx, sy);
            let dx_q = qPos === 'TR' || qPos === 'BR' ? qs : 0;
            let dy_q = qPos === 'BL' || qPos === 'BR' ? qs : 0;
            ctx.drawImage(img, src.x + sqx, src.y + sqy, qs, qs, dx + dx_q, dy + dy_q, qs, qs);
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
            // V2: Pass both the generated atlas and the original source image blob
            if (blob) onFinish(blob, { 
                tileSize: sourceImgRef.current!.naturalWidth / 5, 
                importMode: 'blob', 
                isBlobSet: 1,
                originalBlob: safeOriginal // Forced copy
            });
        });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-950">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6 border-r border-white/5">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3"><LayoutGrid className="text-orange-500" /> Input: 5x3 Grid</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Standard 15-tile Mini-set Layout</p>
            </div>
            <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center gap-2">
                <Eye size={12} className="text-orange-500" /><span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Debug Active</span>
            </div>
          </div>

          <div className="relative group bg-black/40 rounded-3xl border-2 border-dashed border-zinc-800 flex items-center justify-center p-8 transition-all hover:border-orange-500/50">
            <div className="relative inline-block shadow-2xl bg-checkered">
                <img ref={sourceImgRef} src={file.url} alt="Source" className="max-w-[400px] block" style={{ imageRendering: 'pixelated' }} onLoad={processConversion} />
                <div className="absolute inset-0 grid grid-cols-5 grid-rows-3 pointer-events-auto">
                    {Array.from({ length: 15 }).map((_, i) => {
                        const isHoveredIn = hoveredInput === i;
                        const isRelatedToOutput = hoveredOutput !== null && conversionMap[hoveredOutput]?.some(u => u.sIdx === i);
                        
                        return (
                            <div 
                                key={i} 
                                onMouseEnter={() => setHoveredInput(i)} 
                                onMouseLeave={() => setHoveredInput(null)} 
                                className={`border border-white/5 flex items-center justify-center transition-all relative overflow-hidden ${isHoveredIn ? 'bg-orange-500/20 border-orange-500 ring-2 ring-orange-500/50 z-10' : isRelatedToOutput ? 'border-blue-400/50 z-10 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]' : ''}`}
                            >
                                {hoveredOutput !== null && conversionMap[hoveredOutput] && (
                                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5 opacity-80">
                                        {[0, 1, 2, 3].map((slotIdx) => {
                                            const isThisQuadrantUsed = conversionMap[hoveredOutput].some(usage => usage.sIdx === i && usage.sqIdx === slotIdx);
                                            return (
                                                <div 
                                                    key={slotIdx}
                                                    className={`rounded-sm transition-all ${isThisQuadrantUsed ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)] border border-white/20' : ''}`} 
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                                <span className="absolute top-0.5 right-1 text-[8px] font-black text-white/40 pointer-events-none z-20">{i + 1}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[480px] p-8 bg-black/20 flex flex-col gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Generated 6x8 Atlas</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">Standard 47-Tile Blob</p>
          </div>

          <div className="flex-1 relative bg-zinc-900/50 rounded-3xl border border-white/5 p-6 flex items-center justify-center overflow-auto custom-scrollbar">
            {isProcessing ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /><span className="text-[10px] font-black text-orange-500 uppercase animate-pulse">Building Atlas...</span>
                </div>
            ) : previewUrl ? (
                <div className="relative inline-block bg-checkered shadow-2xl">
                    <img src={previewUrl} alt="Preview" className="max-w-full block" style={{ imageRendering: 'pixelated' }} />
                    <div className="absolute inset-0 grid grid-cols-6 grid-rows-8 pointer-events-auto">
                        {BLOB_MASKS.map((_, i) => (
                            <div key={i} onMouseEnter={() => setHoveredOutput(i)} onMouseLeave={() => setHoveredOutput(null)} className={`border border-white/5 transition-all relative ${hoveredOutput === i ? 'bg-blue-500/20 border-blue-400 ring-2 ring-blue-500/50 z-10' : hoveredInput !== null && conversionMap[i]?.some(u => u.sIdx === hoveredInput) ? 'bg-orange-500/40 border-orange-400 z-10' : ''}`}>
                                <span className="absolute top-0.5 right-1 text-[7px] font-black text-white/10 pointer-events-none">{i + 1}</span>
                            </div>
                        ))}
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
