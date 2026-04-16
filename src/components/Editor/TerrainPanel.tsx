import React from 'react';
import { useTerrainStore } from '../../store/useTerrainStore';
import { useMapStore } from '../../store/useMapStore';
import { useEditorStore } from '../../store/useEditorStore';
import { PencilLine, Eraser, Maximize, Paintbrush } from 'lucide-react';
import { AssetCatalog } from './AssetCatalog';

export const TerrainPanel: React.FC = () => {
  const { 
    brushSettings, 
    setPaintingMode
  } = useTerrainStore();
  
  const activeTool = useEditorStore((state) => state.activeTool);
  const activeLayerId = useMapStore((state) => state.activeLayerId);
  const layers = useMapStore((state) => state.layers);
  const addLayer = useMapStore((state) => state.addLayer);
  const setActiveLayer = useMapStore((state) => state.setActiveLayer);

  // V2: Ensure terrain layer exists when tool is opened
  React.useEffect(() => {
    if (activeTool === 'terrain') {
        const terrainLayer = layers.find(l => l.type === 'terrain');
        if (!terrainLayer) {
            addLayer({
                id: 'terrain-layer',
                name: 'Terrains',
                type: 'terrain',
                visible: true,
                locked: false,
                opacity: 1,
                filters: { brightness: 0, contrast: 0, sepia: 0 }
            });
        } else if (activeLayerId !== terrainLayer.id) {
            // Auto-select terrain layer when opening tool
            setActiveLayer(terrainLayer.id);
        }
    }
  }, [activeTool, layers, addLayer, setActiveLayer, activeLayerId]);

  if (activeTool !== 'terrain') return null;

  return (
    <div className="flex flex-col h-full bg-panel">
        <div className="flex flex-col gap-4 p-4 border-b border-theme">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Terrain Mode</h3>
                <div className="flex gap-1">
                    <button
                        onClick={() => setPaintingMode('paint')}
                        className={`p-2 rounded-md transition-colors ${
                        brushSettings.mode === 'paint' ? 'bg-orange-600 text-white' : 'bg-black/20 text-muted hover:bg-black/40 hover:text-main'
                        }`}
                        title="Freehand Terrains"
                    >
                        <PencilLine size={18} />
                    </button>
                    <button
                        onClick={() => setPaintingMode('area')}
                        className={`p-2 rounded-md transition-colors ${
                        brushSettings.mode === 'area' ? 'bg-orange-600 text-white' : 'bg-black/20 text-muted hover:bg-black/40 hover:text-main'
                        }`}
                        title="Area Fill"
                    >
                        <Maximize size={18} />
                    </button>
                    <button
                        onClick={() => setPaintingMode('erase')}
                        className={`p-2 rounded-md transition-colors ${
                        brushSettings.mode === 'erase' ? 'bg-orange-600 text-white' : 'bg-black/20 text-muted hover:bg-black/40 hover:text-main'
                        }`}
                        title="Eraser"
                    >
                        <Eraser size={18} />
                    </button>
                </div>
            </div>

            <div className="bg-black/20 rounded-lg p-3 border border-theme/50">
                <p className="text-[10px] text-muted italic text-center leading-relaxed uppercase font-bold tracking-tighter">
                {brushSettings.mode === 'erase' 
                    ? 'Click or drag to remove terrain'
                    : brushSettings.mode === 'area'
                    ? 'Click and drag to fill a rectangular area'
                    : 'Click and drag to paint terrain'}
                </p>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AssetCatalog mode="terrain" />
        </div>
    </div>
  );
};
