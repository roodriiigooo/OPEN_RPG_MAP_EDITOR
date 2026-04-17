import { create } from 'zustand';

export type WallDrawingMode = 'freehand' | 'line';

interface WallToolState {
  isDrawing: boolean;
  setIsDrawing: (isDrawing: boolean) => void;
  drawingPoints: number[];
  setDrawingPoints: (points: number[]) => void;
  drawingMode: WallDrawingMode;
  setDrawingMode: (mode: WallDrawingMode) => void;
  isEraser: boolean;
  setIsEraser: (isEraser: boolean) => void;
  activeTilesetId: string | null;
  setActiveTilesetId: (id: string | null) => void;
}

export const useWallStore = create<WallToolState>((set) => ({
  isDrawing: false,
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  drawingPoints: [],
  setDrawingPoints: (points) => set({ drawingPoints: points }),
  drawingMode: 'freehand',
  setDrawingMode: (mode) => set({ drawingMode: mode }),
  isEraser: false,
  setIsEraser: (isEraser) => set({ isEraser }),
  activeTilesetId: null,
  setActiveTilesetId: (id) => set({ activeTilesetId: id }),
}));
