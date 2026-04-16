import React from 'react';
import { useMapStore } from '../../store/useMapStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { Square, Eye, EyeOff, Lock, Unlock, Trash2, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';

interface UnifiedRoomListProps {
    layerId: string;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
}

export const UnifiedRoomList: React.FC<UnifiedRoomListProps> = ({ layerId, onDragStart, onDragEnd }) => {
  const rooms = useMapStore((state) => state.rooms);
  const selectedRoomId = useMapStore((state) => state.selectedRoomId);
  const setSelectedRoom = useMapStore((state) => state.setSelectedRoom);
  const setSelectedAsset = useMapStore((state) => state.setSelectedAsset);
  const setRooms = useMapStore((state) => state.setRooms);
  const updateRoom = useMapStore((state) => state.updateRoom);
  const { showConfirm } = useNotificationStore();

  // Filter rooms belonging to this layer
  const layerRooms = rooms.filter(r => r.layerId === layerId);

  if (layerRooms.length === 0) return null;

  const isSelected = selectedRoomId === `room-system-${layerId}`;

  const handleSelect = () => {
    setSelectedRoom(`room-system-${layerId}`);
    setSelectedAsset(null);
  };

  const toggleAllVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    const anyVisible = layerRooms.some(r => r.visible);
    layerRooms.forEach(r => updateRoom(r.id, { visible: !anyVisible }));
  };

  const toggleAllLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    const anyLocked = layerRooms.some(r => r.locked);
    layerRooms.forEach(r => updateRoom(r.id, { locked: !anyLocked }));
  };

  const deleteAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm(
        "Delete Room System?",
        "Are you sure you want to delete all room segments in this layer? This cannot be undone.",
        () => {
            setRooms(rooms.filter(r => r.layerId !== layerId));
        },
        { type: 'error', confirmLabel: 'Delete All' }
    );
  };

  const anyVisible = layerRooms.some(r => r.visible);
  const anyLocked = layerRooms.some(r => r.locked);

  return (
    <div
      onClick={handleSelect}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={clsx(
        "flex items-center gap-2 px-2 py-1.5 cursor-pointer border-l-2 transition-all ml-4",
        isSelected 
          ? 'bg-orange-600/20 border-orange-500 text-main' 
          : 'border-transparent text-muted hover:bg-black/20 hover:text-main'
      )}
    >
      <div className="cursor-grab active:cursor-grabbing text-muted/30 hover:text-muted transition-colors">
        <GripVertical size={10} />
      </div>

      <div className={clsx(isSelected ? 'text-orange-500' : 'text-muted')}>
        <Square size={14} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase truncate">
          Room System
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={toggleAllVisibility}
          className={clsx("p-1 rounded hover:bg-black/20 transition-colors", !anyVisible ? 'text-muted/40' : 'text-muted hover:text-main')}
        >
          {anyVisible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
        <button
          onClick={toggleAllLock}
          className={clsx("p-1 rounded hover:bg-black/20 transition-colors", anyLocked ? 'text-orange-500' : 'text-muted hover:text-main')}
        >
          {anyLocked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>
        <button
          onClick={deleteAll}
          className="p-1 rounded hover:bg-red-900/40 text-muted hover:text-red-400 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};
