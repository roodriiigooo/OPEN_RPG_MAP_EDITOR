import { create } from 'zustand';
import { BrushSettings, PaintingMode } from '../types/terrain';

interface TerrainState {
  brushSettings: BrushSettings;
  isPainting: boolean;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushTexture: (textureId: string) => void;
  setPaintingMode: (mode: PaintingMode) => void;
  setTilingSetId: (id: string | null) => void;
  setIsPainting: (isPainting: boolean) => void;
  isEraser: boolean;
  setIsEraser: (isEraser: boolean) => void;
}

export const useTerrainStore = create<TerrainState>((set) => ({
  brushSettings: {
    size: 50,
    opacity: 1,
    hardness: 1,
    textureId: 'default',
    mode: 'paint',
    tilingSetId: undefined,
  },
  isPainting: false,
  isEraser: false,
  setIsEraser: (isEraser) => set((state) => ({ 
    isEraser,
    brushSettings: { ...state.brushSettings, mode: isEraser ? 'erase' : (state.brushSettings.mode === 'erase' ? 'paint' : state.brushSettings.mode) }
  })),
  setBrushSize: (size) =>
    set((state) => ({ brushSettings: { ...state.brushSettings, size } })),
  setBrushOpacity: (opacity) =>
    set((state) => ({ brushSettings: { ...state.brushSettings, opacity } })),
  setBrushTexture: (textureId) =>
    set((state) => ({ brushSettings: { ...state.brushSettings, textureId } })),
  setPaintingMode: (mode) =>
    set((state) => ({ 
        brushSettings: { ...state.brushSettings, mode },
        isEraser: mode === 'erase'
    })),
  setTilingSetId: (id) =>
    set((state) => ({ brushSettings: { ...state.brushSettings, tilingSetId: id || undefined } })),
  setIsPainting: (isPainting) => set({ isPainting }),
}));
