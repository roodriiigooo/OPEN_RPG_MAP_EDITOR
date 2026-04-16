import { create } from 'zustand';

interface Point {
  x: number;
  y: number;
}

export type RoomMode = 'add' | 'erase';

interface RoomToolState {
  isDrawing: boolean;
  mode: RoomMode;
  fillEnabled: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  selectedWallId: string | null;
  selectedTerrainId: string | null;
  setIsDrawing: (isDrawing: boolean) => void;
  setMode: (mode: RoomMode) => void;
  setFillEnabled: (enabled: boolean) => void;
  setStartPoint: (point: Point | null) => void;
  setCurrentPoint: (point: Point | null) => void;
  setSelectedWallId: (id: string | null) => void;
  setSelectedTerrainId: (id: string | null) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomToolState>((set) => ({
  isDrawing: false,
  mode: 'add',
  fillEnabled: true,
  startPoint: null,
  currentPoint: null,
  selectedWallId: null,
  selectedTerrainId: null,
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setMode: (mode) => set({ mode }),
  setFillEnabled: (fillEnabled) => set({ fillEnabled }),
  setStartPoint: (point) => set({ startPoint: point }),
  setCurrentPoint: (point) => set({ currentPoint: point }),
  setSelectedWallId: (id) => set({ selectedWallId: id }),
  setSelectedTerrainId: (id) => set({ selectedTerrainId: id }),
  reset: () => set({ isDrawing: false, startPoint: null, currentPoint: null }),
}));
