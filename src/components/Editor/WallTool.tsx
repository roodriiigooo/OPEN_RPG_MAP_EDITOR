import React from 'react';
import { useWallStore } from '../../store/useWallStore';
import { useEditorStore } from '../../store/useEditorStore';
import { PencilLine, Eraser, MoveRight } from 'lucide-react';
import { AssetCatalog } from './AssetCatalog';
import { useMapStore } from '../../store/useMapStore';

export const WallTool: React.FC = () => {
  const { isEraser, setIsEraser, drawingMode, setDrawingMode } = useWallStore();
  const activeTool = useEditorStore((state) => state.activeTool);
  const layers = useMapStore(s => s.layers);
  const addLayer = useMapStore(s => s.addLayer);

  // V2: Ensure Wall layer exists in the tree as soon as the tool is opened
  // Note: initialState already has it, but this is a safety for legacy maps
  React.useEffect(() => {
    if (activeTool === 'wall' && !layers.some(l => l.type === 'wall')) {
        addLayer({
            id: 'wall-layer',
            name: 'Walls',
            type: 'wall',
            visible: true,
            locked: false,
            opacity: 1,
            filters: { brightness: 0, contrast: 0, sepia: 0 }
        });
    }
  }, [layers, addLayer, activeTool]);

  if (activeTool !== 'wall') return null;

  return (
    <div className="flex flex-col h-full bg-panel">
        <div className="flex flex-col gap-4 p-4 border-b border-theme">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Wall Mode</h3>
                <div className="flex gap-1">
                <button
                    onClick={() => { setIsEraser(false); setDrawingMode('freehand'); }}
                    className={`p-2 rounded-md transition-colors ${
                    !isEraser && drawingMode === 'freehand' ? 'bg-orange-600 text-white' : 'bg-black/20 text-muted hover:bg-black/40 hover:text-main'
                    }`}
                    title="Freehand Walls"
                >
                    <PencilLine size={18} />
                </button>
                <button
                    onClick={() => { setIsEraser(false); setDrawingMode('line'); }}
                    className={`p-2 rounded-md transition-colors ${
                    !isEraser && drawingMode === 'line' ? 'bg-orange-600 text-white' : 'bg-black/20 text-muted hover:bg-black/40 hover:text-main'
                    }`}
                    title="Straight Lines"
                >
                    <MoveRight size={18} />
                </button>
                <button
                    onClick={() => setIsEraser(true)}
                    className={`p-2 rounded-md transition-colors ${
                    isEraser ? 'bg-orange-600 text-white' : 'bg-black/20 text-muted hover:bg-black/40 hover:text-main'
                    }`}
                    title="Eraser"
                >
                    <Eraser size={18} />
                </button>
                </div>
            </div>

            <div className="bg-black/20 rounded-lg p-3 border border-theme">
                <p className="text-[10px] text-muted leading-relaxed italic">
                    {isEraser ? 'Click or drag over walls to remove them' : 'Click and drag to draw walls'}
                </p>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AssetCatalog mode="wall" />
        </div>
    </div>
  );
};
