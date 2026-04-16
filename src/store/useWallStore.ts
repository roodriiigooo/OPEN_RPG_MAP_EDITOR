import { create } from 'zustand';

export type WallDrawingMode = 'freehand' | 'line';

interface WallToolState {
  isDrawing: boolean;
  setIsDrawing: (isDrawing: boolean) => void;
  drawingPoints: number[];
  setDrawingPoints: (points: number[]) => void;
  addPoint: (x: number, y: number) => void;
  clearDrawing: () => void;
  drawingMode: WallDrawingMode;
  setDrawingMode: (mode: WallDrawingMode) => void;
  isEraser: boolean;
  setIsEraser: (isEraser: boolean) => void;
  activeTilesetId: string | null;
  setActiveTilesetId: (id: string | null) => void;
}

export const useWallStore = create<WallToolState>((set) => ({
  isDrawing: false,
  setIsDrawing: (isDrawing) => set({ isDrawing, drawingPoints: [] }),
  drawingPoints: [],
  setDrawingPoints: (points) => set({ drawingPoints: points }),
  addPoint: (x, y) => set((state) => ({ drawingPoints: [...state.drawingPoints, x, y] })),
  clearDrawing: () => set({ drawingPoints: [], isDrawing: false }),
  drawingMode: 'freehand',
  setDrawingMode: (mode) => set({ drawingMode: mode }),
  isEraser: false,
  setIsEraser: (isEraser) => set({ isEraser }),
  activeTilesetId: null,
  setActiveTilesetId: (id) => set({ activeTilesetId: id }),
}));
