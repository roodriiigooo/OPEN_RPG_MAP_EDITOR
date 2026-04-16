import React from 'react';
import { Group, Rect, Line } from 'react-konva';
import { MapState } from '../../types/map';
import { TileType } from '../../types/tiling';

interface GhostFloorRendererProps {
  map: MapState;
  opacity: number;
}

/**
 * Renders a non-interactive, simplified version of a map to serve as an overlay.
 * Optimized with React.memo to prevent unnecessary re-renders of the ghost floor.
 */
export const GhostFloorRenderer: React.FC<GhostFloorRendererProps> = React.memo(({ map, opacity }) => {
  const { resolution, name } = map.metadata;
  
  return (
    <Group opacity={opacity} listening={false}>
      {/* Background outline */}
      <Rect
        x={0}
        y={0}
        width={resolution.width}
        height={resolution.height}
        stroke="#3b82f6"
        strokeWidth={2}
        dash={[10, 10]}
      />

      {/* Rooms (Floors) */}
      {map.rooms.filter(r => r.fillEnabled).map((room) => (
        <Rect
          key={`ghost-room-${room.id}`}
          x={room.x}
          y={room.y}
          width={room.width}
          height={room.height}
          fill="rgba(59, 130, 246, 0.1)"
          stroke="rgba(59, 130, 246, 0.3)"
          strokeWidth={1}
        />
      ))}

      {/* Smart Walls */}
      {map.walls.filter(w => w.type === 'smart').map(w => 
        w.points.map((p, i) => (
          <Line
            key={`ghost-smart-wall-${w.id}-${i}`}
            points={p}
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth={4}
            lineCap="round"
          />
        ))
      )}

      {/* Manual Walls / Tiles */}
      {map.tiles.filter(t => t.type === TileType.WALL).map(t => (
        <Rect
          key={`ghost-tile-wall-${t.x}-${t.y}`}
          x={t.x * map.grid.size}
          y={t.y * map.grid.size}
          width={map.grid.size}
          height={map.grid.size}
          fill="rgba(59, 130, 246, 0.2)"
        />
      ))}
    </Group>
  );
});
