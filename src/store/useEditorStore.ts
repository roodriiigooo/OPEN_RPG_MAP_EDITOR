import { create } from 'zustand';
import Konva from 'konva';

export type ToolType = 'select' | 'hand' | 'catalog' | 'stamp' | 'terrain' | 'wall' | 'light' | 'room' | 'project' | 'text';
export type SelectionMode = 'single' | 'area';
export type EditorTheme = 'dark' | 'light' | 'dracula' | 'comic' | 'high-contrast';

interface EditorStore {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  selectionMode: SelectionMode;
  setSelectionMode: (mode: SelectionMode) => void;
  stageRef: React.RefObject<Konva.Stage | null> | null;
  setStageRef: (ref: React.RefObject<Konva.Stage | null>) => void;
  isExportDialogOpen: boolean;
  setIsExportDialogOpen: (open: boolean) => void;
  isPrintStudioOpen: boolean;
  setIsPrintStudioOpen: (open: boolean) => void;
  isProjectSetupOpen: boolean;
  setIsProjectSetupOpen: (open: boolean) => void;
  theme: EditorTheme;
  setTheme: (theme: EditorTheme) => void;
  viewportZoom: number;
  setViewportZoom: (zoom: number) => void;
  editorBgColor: string;
  setEditorBgColor: (color: string) => void;
  viewportPosition: { x: number; y: number };
  setViewportPosition: (pos: { x: number; y: number }) => void;
  requestCenter: boolean;
  triggerCenter: () => void;
  isSidebarVisible: boolean;
  setIsSidebarVisible: (visible: boolean) => void;
  isRightSidebarVisible: boolean;
  setIsRightSidebarVisible: (visible: boolean) => void;
  isHoveringLeft: boolean;
  setIsHoveringLeft: (hovering: boolean) => void;
  isHoveringRight: boolean;
  setIsHoveringRight: (hovering: boolean) => void;
  activeStamp: { type: string; customAssetId?: string } | null;
  setActiveStamp: (stamp: { type: string; customAssetId?: string } | null) => void;
  toggleUI: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  activeTool: 'project',
  setActiveTool: (tool) => set({ activeTool: tool }), 
  selectionMode: 'single',
  setSelectionMode: (mode) => set({ selectionMode: mode }),
  stageRef: null,
  setStageRef: (ref) => set({ stageRef: ref }),
  isExportDialogOpen: false,
  setIsExportDialogOpen: (open) => set({ isExportDialogOpen: open }),
  isPrintStudioOpen: false,
  setIsPrintStudioOpen: (open) => set({ isPrintStudioOpen: open }),
  isProjectSetupOpen: false,
  setIsProjectSetupOpen: (open) => set({ isProjectSetupOpen: open }),
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  viewportZoom: 1,
  setViewportZoom: (zoom) => set({ viewportZoom: zoom }),
  editorBgColor: '#282828',
  setEditorBgColor: (color) => set({ editorBgColor: color }),
  viewportPosition: { x: 0, y: 0 },
  setViewportPosition: (pos) => set({ viewportPosition: pos }),
  requestCenter: false,
  triggerCenter: () => set((state) => ({ requestCenter: !state.requestCenter })),
  isSidebarVisible: true,
  setIsSidebarVisible: (visible) => set({ isSidebarVisible: visible }),
  isRightSidebarVisible: true,
  setIsRightSidebarVisible: (visible) => set({ isRightSidebarVisible: visible }),
  isHoveringLeft: false,
  setIsHoveringLeft: (hovering) => set({ isHoveringLeft: hovering }),
  isHoveringRight: false,
  setIsHoveringRight: (hovering) => set({ isHoveringRight: hovering }),
  activeStamp: null,
  setActiveStamp: (activeStamp) => set({ activeStamp }),
  toggleUI: () => {
      const { isSidebarVisible: left, isRightSidebarVisible: right } = get();
      if (left !== right) {
          set({ isSidebarVisible: false, isRightSidebarVisible: false });
      } else {
          const next = !left;
          set({ isSidebarVisible: next, isRightSidebarVisible: next });
      }
  }
}));
