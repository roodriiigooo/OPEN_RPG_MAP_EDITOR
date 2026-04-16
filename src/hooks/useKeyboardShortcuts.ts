import { useEffect } from 'react';
import { useMapStore } from '../store/useMapStore';
import { useEditorStore } from '../store/useEditorStore';
import { useProjectStore } from '../store/useProjectStore';
import { useNotificationStore } from '../store/useNotificationStore';

export const useKeyboardShortcuts = () => {
  const { undo, redo } = useMapStore.temporal.getState();
  const { 
    setActiveTool, 
    isSidebarVisible, setIsSidebarVisible,
    isRightSidebarVisible, setIsRightSidebarVisible
  } = useEditorStore();
  
  const { 
    selectedAssetIds, 
    removeAsset, 
    selectedRoomId, 
    removeRoom,
    updateAsset,
    updatePointLight,
    removeObjects,
    setSelectedAssetIds,
    moveObjects
  } = useMapStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const { maps, activeMapId, setActiveMapId } = useProjectStore.getState();
      const resetMapStore = useMapStore.getState().resetState;

      // Quick Level Switch (CTRL + SHIFT + Arrows)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['ArrowUp', 'ArrowDown'].includes(e.key)) {
          e.preventDefault();
          if (maps.length <= 1) return;

          const currentIndex = maps.findIndex(m => m.id === activeMapId);
          let nextIndex = currentIndex;

          if (e.key === 'ArrowUp') {
              nextIndex = currentIndex > 0 ? currentIndex - 1 : maps.length - 1;
          } else {
              nextIndex = currentIndex < maps.length - 1 ? currentIndex + 1 : 0;
          }

          const nextMap = maps[nextIndex];
          if (nextMap) {
              setActiveMapId(nextMap.id);
              resetMapStore({
                  ...nextMap,
                  selectedAssetIds: [],
                  selectedRoomId: null
              } as any);
              
              useNotificationStore.getState().showToast(
                  "Level Switched", 
                  `${nextMap.metadata.name}`, 
                  "info", 
                  2000
              );
          }
          return;
      }

      // Deselect (ESC)
      if (e.key === 'Escape') {
          setSelectedAssetIds([]);
          useMapStore.getState().setSelectedRoom(null);
          return;
      }

      // Sidebar Toggle (TAB)
      if (e.key === 'Tab') {
          e.preventDefault();
          const editorState = useEditorStore.getState();
          const leftVisible = editorState.isSidebarVisible;
          const rightVisible = editorState.isRightSidebarVisible;

          if (leftVisible !== rightVisible) {
              editorState.setIsSidebarVisible(false);
              editorState.setIsRightSidebarVisible(false);
          } else {
              const nextState = !leftVisible;
              editorState.setIsSidebarVisible(nextState);
              editorState.setIsRightSidebarVisible(nextState);
          }
          return;
      }

      // Nudge Mode (Arrow Keys) - Only if NOT switching levels
      if (selectedAssetIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !e.shiftKey) {
          const state = useMapStore.getState();
          const selectedAssets = state.assets.filter(a => selectedAssetIds.includes(a.id));
          const selectedLights = state.lighting.pointLights.filter(l => selectedAssetIds.includes(l.id));
          
          const anyLocked = selectedAssets.some(a => a.locked) || selectedLights.some(l => l.locked);
          if (anyLocked) return;
          
          e.preventDefault();
          const grid = state.grid;
          
          let shouldSnap = false;
          if (selectedAssetIds.length === 1 && selectedAssets.length > 0) {
              shouldSnap = selectedAssets[0].snapToGrid !== undefined ? selectedAssets[0].snapToGrid : grid.snapToGrid;
          }
          
          const step = shouldSnap ? grid.size : 1;
          let dx = 0; let dy = 0;
          if (e.key === 'ArrowUp') dy = -step;
          if (e.key === 'ArrowDown') dy = step;
          if (e.key === 'ArrowLeft') dx = -step;
          if (e.key === 'ArrowRight') dx = step;

          if (selectedAssetIds.length > 1) {
              moveObjects(selectedAssetIds, dx, dy);
          } else {
              if (selectedAssets.length > 0) updateAsset(selectedAssets[0].id, { x: selectedAssets[0].x + dx, y: selectedAssets[0].y + dy });
              else if (selectedLights.length > 0) updatePointLight(selectedLights[0].id, { x: selectedLights[0].x + dx, y: selectedLights[0].y + dy });
          }
          return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }

      // Tool Switching
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'v': setActiveTool('select'); break;
          case 'h': setActiveTool('hand'); break;
          case 's': setActiveTool('stamp'); break;
          case 'w': setActiveTool('wall'); break;
          case 't': setActiveTool('terrain'); break;
          case 'r': setActiveTool('room'); break;
          case 'x': setActiveTool('text'); break;
          case 'm': setActiveTool('project'); break;
          case 'c': setActiveTool('catalog'); break;
          case 'g': 
            const { grid, updateGrid } = useMapStore.getState();
            const { activeMapId: currentMapId, updateMap } = useProjectStore.getState();
            const nextVisible = !grid.visible;
            updateGrid({ visible: nextVisible });
            if (currentMapId) updateMap(currentMapId, { grid: { ...grid, visible: nextVisible } });
            break;
        }
      }

      // Deletion
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAssetIds.length > 0) {
            const state = useMapStore.getState();
            const anyLocked = selectedAssetIds.some(id => 
                state.assets.find(a => a.id === id)?.locked || 
                state.lighting.pointLights.find(l => l.id === id)?.locked
            );

            if (anyLocked) {
                useNotificationStore.getState().showToast("Deletion Blocked", "Unlock selected objects before deleting.", "warn");
                return;
            }
            removeObjects(selectedAssetIds);
        } else if (selectedRoomId) {
          removeRoom(selectedRoomId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setActiveTool, selectedAssetIds, removeAsset, selectedRoomId, removeRoom, updateAsset, updatePointLight, removeObjects, setSelectedAssetIds, moveObjects]);
};
