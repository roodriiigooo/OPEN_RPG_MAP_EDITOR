import React, { useMemo, useCallback } from 'react';
import { Group, Rect } from 'react-konva';
import { useMapStore } from '../../store/useMapStore';
import { Room } from '../../types/map';
import { TileRenderer } from './TilingRenderer';
import { TileType, TileData } from '../../types/tiling';
import { calculateRoomTileData } from '../../utils/terrain/room';
import { 
  calculateBitmask, 
  getMinimalMask, 
  calculateTerrainQuadrants, 
  BLOB_MAP 
} from '../../utils/terrain/tiling';

/**
 * Optimized Smart Room Renderer
 * Groups rooms by their selected styles and calculates bitmasks for a seamless "Smart" look.
 */
export const SmartRoomRenderer: React.FC<{ layerId?: string }> = React.memo(({ layerId }) => {
  const allRooms = useMapStore((state) => state.rooms);
  const tilesets = useMapStore((state) => state.tilesets);
  const gridSize = useMapStore((state) => state.grid.size);
  const selectedRoomId = useMapStore((state) => state.selectedRoomId);
  const setSelectedRoom = useMapStore((state) => state.setSelectedRoom);

  // Filter rooms for this layer
  const rooms = useMemo(() => 
    layerId ? allRooms.filter(r => r.layerId === layerId) : allRooms
  , [allRooms, layerId]);

  // Group rooms by style combination to render merged chunks correctly
  const roomGroups = useMemo(() => {
    const groups: Record<string, Room[]> = {};
    rooms.forEach(r => {
        const key = `${r.floorSetId || 'none'}-${r.wallStyleId || 'none'}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
    });
    return groups;
  }, [rooms]);

  const isSystemSelected = selectedRoomId === 'room-system';

  const handleSelectSystem = useCallback((e: any) => {
    e.cancelBubble = true;
    setSelectedRoom('room-system');
    useMapStore.getState().setSelectedAsset(null);
  }, [setSelectedRoom]);

  if (rooms.length === 0) return null;

  return (
    <Group onClick={handleSelectSystem} onTap={handleSelectSystem}>
      {Object.entries(roomGroups).map(([styleKey, groupedRooms]) => {
          const floorId = groupedRooms[0].floorSetId;
          const wallId = groupedRooms[0].wallStyleId;
          
          const floorTileset = tilesets.find(ts => ts.id === floorId);
          const wallTileset = tilesets.find(ts => ts.id === wallId);
          
          // 1. Calculate floor and wall occupancy for this style group
          const { floors, walls } = calculateRoomTileData(groupedRooms, gridSize);
          
          // Create occupancy sets for bitmask calculation
          const floorSet = new Set(floors.map(f => `${f.x},${f.y}`));
          const wallSet = new Set(walls.map(w => `${w.x},${w.y}`));

          return (
            <Group key={styleKey}>
                {/* Group Floors with Smart Tiling */}
                {floorTileset && floors.map((pos) => {
                    const rawMask = calculateBitmask(pos.x, pos.y, '', (nx, ny) => floorSet.has(`${nx},${ny}`));
                    const mask = getMinimalMask(rawMask);
                    const isBlob = (floorTileset as any).bitmaskMap?.isBlobSet;

                    const tile: TileData = {
                        x: pos.x, y: pos.y, 
                        type: TileType.GROUND, 
                        tilesetId: floorTileset.id,
                        layerId: layerId || 'background-layer',
                        bitmask: mask,
                        variantIndex: isBlob ? (BLOB_MAP[mask] ?? 0) : 0,
                        quadrants: isBlob ? undefined : calculateTerrainQuadrants(mask)
                    };
                    return <TileRenderer key={`floor-${pos.x}-${pos.y}`} tile={tile} tileset={floorTileset} gridSize={gridSize} />;
                })}

                {/* Fallback Floor */}
                {!floorTileset && groupedRooms.filter(r => r.fillEnabled).map(r => (
                    <Rect
                        key={`fallback-${r.id}`}
                        x={r.x} y={r.y} width={r.width} height={r.height}
                        fill="rgba(45, 45, 45, 0.5)"
                    />
                ))}

                {/* Group Walls with Smart Tiling */}
                {wallTileset && walls.map((pos) => {
                    // Walls are smart-tiled against other walls OR floors (to prevent gaps)
                    const rawMask = calculateBitmask(pos.x, pos.y, '', (nx, ny) => wallSet.has(`${nx},${ny}`) || floorSet.has(`${nx},${ny}`));
                    const mask = getMinimalMask(rawMask);
                    const isBlob = (wallTileset as any).bitmaskMap?.isBlobSet;

                    const tile: TileData = {
                        x: pos.x, y: pos.y, 
                        type: TileType.WALL, 
                        tilesetId: wallTileset.id,
                        layerId: layerId || 'background-layer',
                        bitmask: mask,
                        variantIndex: isBlob ? (BLOB_MAP[mask] ?? 0) : 0,
                        quadrants: isBlob ? undefined : calculateTerrainQuadrants(mask)
                    };
                    return <TileRenderer key={`wall-${pos.x}-${pos.y}`} tile={tile} tileset={wallTileset} gridSize={gridSize} />;
                })}
            </Group>
          );
      })}

      {/* Selection Highlight */}
      {isSystemSelected && rooms.map(room => (
        <Rect
          key={`select-${room.id}`}
          x={room.x} y={room.y} width={room.width} height={room.height}
          stroke="#f97316" strokeWidth={2} dash={[5, 5]} opacity={0.5} listening={false}
        />
      ))}
    </Group>
  );
});
