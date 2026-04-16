import React, { useState, useRef } from 'react';
import { Check, ChevronRight, ChevronLeft, LayoutGrid, Info, Target } from 'lucide-react';
import { BLOB_MASKS, getTileForQ } from '../../utils/terrain/tiling';

interface TilingConfigScreenProps {
  file: { file: File, url: string, id: string };
  type: 'terrain' | 'wall';
  onBack: () => void;
  onFinish: (blob: Blob, metadata: any) => void;
}

export const TilingConfigScreen: React.FC<TilingConfigScreenProps> = ({ 
  file, onBack, onFinish 
}) => {
  const [mappings, setMappings] = useState<Record<number, {sx: number, sy: number}>>({});
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);

  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImgRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImageSize({ width: naturalWidth, height: naturalHeight });
  };

  const roles = [
    { id: 0, label: 'TL Outer', standardIndex: 0, desc: 'Top-Left Corner (Outer)' },
    { id: 1, label: 'T Edge', standardIndex: 1, desc: 'Top Edge' },
    { id: 2, label: 'TR Outer', standardIndex: 2, desc: 'Top-Right Corner (Outer)' },
    { id: 3, label: 'Inner NW', standardIndex: 3, desc: 'Internal NW Junction' },
    { id: 4, label: 'Inner NE', standardIndex: 4, desc: 'Internal NE Junction' },
    { id: 5, label: 'L Edge', standardIndex: 5, desc: 'Left Edge' },
    { id: 6, label: 'Center', standardIndex: 6, desc: 'Full Tile / Center' },
    { id: 7, label: 'R Edge', standardIndex: 7, desc: 'Right Edge' },
    { id: 8, label: 'Inner SW', standardIndex: 8, desc: 'Internal SW Junction' },
    { id: 9, label: 'Inner SE', standardIndex: 9, desc: 'Internal SE Junction' },
    { id: 10, label: 'BL Outer', standardIndex: 10, desc: 'Bottom-Left Corner (Outer)' },
    { id: 11, label: 'B Edge', standardIndex: 11, desc: 'Bottom Edge' },
    { id: 12, label: 'BR Outer', standardIndex: 12, desc: 'Bottom-Right Corner (Outer)' },
    { id: 13, label: 'Isolated', standardIndex: 13, desc: 'Single isolated tile' },
  ];

  const cols = 5;
  const rows = 3;
  const totalTiles = cols * rows;

  const handleTileClick = (index: number) => {
    const sx = index % cols;
    const sy = Math.floor(index / cols);
    setMappings(prev => ({ ...prev, [roles[currentRoleIndex].id]: { sx, sy } }));
    if (currentRoleIndex < roles.length - 1) {
        setCurrentRoleIndex(currentRoleIndex + 1);
    }
  };

  const isComplete = roles.every(r => mappings[r.id] !== undefined);

  const handleFinish = async () => {
    if (!sourceImgRef.current || !canvasRef.current) return;
    
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

    BLOB_MASKS.forEach((mask, i) => {
        const dx = (i % 6) * tw;
        const dy = Math.floor(i / 6) * th;

        ['TL', 'TR', 'BL', 'BR'].forEach((qPos: any) => {
            const result: any = getTileForQ(mask, qPos, mappings);
            const { sx, sy } = result;
            const srcX = sx * tw;
            const srcY = sy * th;
            
            let sqx, sqy;
            if (result.forceQ) {
                sqx = (result.forceQ === 'TR' || result.forceQ === 'BR') ? qs : 0;
                sqy = (result.forceQ === 'BL' || result.forceQ === 'BR') ? qs : 0;
            } else {
                sqx = (qPos === 'TR' || qPos === 'BR') ? qs : 0;
                sqy = (qPos === 'BL' || qPos === 'BR') ? qs : 0;
            }

            let dx_q = qPos === 'TR' || qPos === 'BR' ? qs : 0;
            let dy_q = qPos === 'BL' || qPos === 'BR' ? qs : 0;
            
            ctx.drawImage(img, srcX + sqx, srcY + sqy, qs, qs, dx + dx_q, dy + dy_q, qs, qs);
        });
    });

    canvas.toBlob(async blob => {
        // V2: Pass generated blob and original input blob for library thumbnail
        if (blob) {
            const safeOriginal = await (new Response(file.file)).blob();
            onFinish(blob, { 
                tileSize: tw, 
                importMode: 'blob', 
                isBlobSet: 1,
                originalBlob: safeOriginal
            });
        }
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-950">
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Source Image & Helper */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8 border-r border-white/5">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3"><LayoutGrid className="text-orange-500" /> Manual 5x3 Mapper</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Select the tiles from your source image</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-8">
            <div className="relative group bg-black/40 rounded-3xl border-2 border-dashed border-zinc-800 flex items-center justify-center p-8 transition-all hover:border-orange-500/50">
                <div className="relative inline-block shadow-2xl bg-checkered">
                <img ref={sourceImgRef} src={file.url} alt="Source" onLoad={handleImageLoad} className="max-w-[400px] block" style={{ imageRendering: 'pixelated' }} />
                {imageSize.width > 0 && (
                    <div className="absolute inset-0 grid grid-cols-5 grid-rows-3 pointer-events-auto">
                    {Array.from({ length: totalTiles }).map((_, i) => {
                        const isSelectedBySomeRole = Object.values(mappings).some(pos => pos.sx + pos.sy * 5 === i);
                        return (
                            <div 
                                key={i} 
                                onClick={() => handleTileClick(i)} 
                                className={`border border-white/10 cursor-pointer transition-all hover:bg-orange-500/20 flex flex-wrap gap-0.5 p-0.5 items-start justify-start overflow-hidden relative ${isSelectedBySomeRole ? 'bg-orange-500/10' : ''}`}
                            >
                                <span className="absolute top-0.5 right-1 text-[8px] font-black text-white/40 pointer-events-none z-20">{i + 1}</span>
                                {Object.entries(mappings).map(([roleId, pos]) => {
                                    if (pos.sx + pos.sy * 5 === i) {
                                        const role = roles.find(r => r.id === parseInt(roleId));
                                        return (
                                            <div key={roleId} className="bg-orange-600 text-[7px] font-black px-1 rounded text-white uppercase leading-none py-0.5 z-10">
                                                {role?.label}
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        );
                    })}
                    </div>
                )}
                </div>
            </div>

            {/* Visual Reference Helper */}
            <div className="w-full max-w-[500px] space-y-4">
                <div className="flex items-center gap-3">
                    <Target size={16} className="text-orange-500" />
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Template Reference Guide</h4>
                </div>
                
                <div className="grid grid-cols-5 gap-2 bg-black/40 p-4 rounded-2xl border border-white/5 relative">
                    {Array.from({ length: 15 }).map((_, i) => {
                        const targetRole = roles.find(r => r.standardIndex === i);
                        const isCurrentTarget = roles[currentRoleIndex].standardIndex === i;
                        const mappedPos = targetRole ? mappings[targetRole.id] : null;
                        
                        return (
                            <div key={i} className={`aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center relative overflow-hidden bg-black/20 ${isCurrentTarget ? 'border-orange-500 shadow-lg shadow-orange-900/20 scale-105 z-10' : 'border-white/5 opacity-40'}`}>
                                <span className="absolute top-0.5 right-1 text-[7px] font-black text-white/50 z-30 pointer-events-none">{i + 1}</span>
                                {mappedPos ? (
                                    <div 
                                        className="absolute inset-0 bg-no-repeat bg-cover"
                                        style={{ 
                                            backgroundImage: `url(${file.url})`,
                                            backgroundSize: `${500}% ${300}%`,
                                            backgroundPosition: `${mappedPos.sx * 25}% ${mappedPos.sy * 50}%`,
                                            imageRendering: 'pixelated'
                                        }}
                                    />
                                ) : (
                                    <span className="text-[10px] font-black text-white/20">{targetRole?.label || 'Empty'}</span>
                                )}
                                {isCurrentTarget && (
                                    <div className="absolute inset-0 border-2 border-orange-500 animate-pulse pointer-events-none" />
                                )}
                                <div className={`absolute bottom-0 left-0 right-0 py-0.5 px-1 bg-black/80 text-[6px] font-black text-center truncate ${isCurrentTarget ? 'text-orange-500' : 'text-white/40'}`}>
                                    {targetRole?.label || '---'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full md:w-96 border-l border-white/5 p-8 space-y-6 bg-black/20 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="p-4 bg-orange-600/10 border border-orange-500/30 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-orange-500 font-black uppercase text-[10px] tracking-widest">
                <Info size={14} /> Assigning:
            </div>
            <h4 className="text-xl font-black text-white uppercase leading-none">{roles[currentRoleIndex].label}</h4>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{roles[currentRoleIndex].desc}</p>
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-4">Mapping Progress ({Object.keys(mappings).length}/{roles.length})</label>
            <div className="grid grid-cols-1 gap-2">
                {roles.map((role, idx) => (
                    <button 
                        key={role.id} 
                        onClick={() => setCurrentRoleIndex(idx)}
                        className={`w-full p-3 rounded-xl border transition-all text-left flex items-center justify-between group ${
                            currentRoleIndex === idx 
                                ? 'bg-orange-600/20 border-orange-500 text-white' 
                                : mappings[role.id] !== undefined
                                ? 'bg-emerald-900/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-black/20 border-white/5 text-zinc-500 hover:border-zinc-700'
                        }`}
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest">{role.label}</span>
                            <span className="text-[8px] opacity-50 uppercase font-bold">{role.desc}</span>
                        </div>
                        {mappings[role.id] !== undefined && <Check size={14} className="text-emerald-500" />}
                    </button>
                ))}
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      <div className="p-6 border-t border-white/5 bg-zinc-900/50 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-main hover:bg-black/20 transition-all uppercase tracking-widest"><ChevronLeft size={16} /> Back</button>
        <button onClick={handleFinish} disabled={!isComplete} className="flex items-center gap-2 px-8 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl text-xs font-black text-white transition-all shadow-xl shadow-orange-900/40 uppercase tracking-widest active:scale-95">Generate 47-Tile Blob <ChevronRight size={16} /></button>
      </div>
    </div>
  );
};
