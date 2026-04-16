import { WallSegment, Room } from '../../types/map';

interface Point {
  x: number;
  y: number;
}

export interface RoomLayout {
  walls: WallSegment[];
  tiles: { x: number; y: number }[];
}

/**
 * Calculates all tile coordinates for floors and walls based on room occupancy.
 */
export function calculateRoomTileData(rooms: Room[], gridSize: number) {
  const floorOccupancy = new Set<string>();
  const wallOccupancy = new Set<string>();
  const size = gridSize || 100;

  rooms.forEach(room => {
    if (!room.visible) return;
    const startX = Math.floor(room.x / size);
    const startY = Math.floor(room.y / size);
    const endX = Math.ceil((room.x + room.width) / size);
    const endY = Math.ceil((room.y + room.height) / size);

    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        floorOccupancy.add(`${x},${y}`);
      }
    }
  });

  // Calculate walls: any empty neighbor of a floor tile
  floorOccupancy.forEach(cellKey => {
    const [cx, cy] = cellKey.split(',').map(Number);
    const neighbors = [
        {x: cx-1, y: cy-1}, {x: cx, y: cy-1}, {x: cx+1, y: cy-1},
        {x: cx-1, y: cy},                     {x: cx+1, y: cy},
        {x: cx-1, y: cy+1}, {x: cx, y: cy+1}, {x: cx+1, y: cy+1}
    ];

    neighbors.forEach(n => {
        const key = `${n.x},${n.y}`;
        if (!floorOccupancy.has(key)) {
            wallOccupancy.add(key);
        }
    });
  });

  return {
    floors: Array.from(floorOccupancy).map(key => {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
    }),
    walls: Array.from(wallOccupancy).map(key => {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
    })
  };
}

/**
 * Generates wall segments and tile coordinates for a rectangular room.
 * Coordinates are grid-snapped based on the provided gridSize.
 */
export function generateRoom(
  start: Point,
  end: Point,
  gridSize: number,
  layerId: string = 'background-layer'
): RoomLayout {
  // ... rest of the function remains the same but update type
  // Actually I'll just rewrite it to match WallSegment update
  const x1 = Math.floor(Math.min(start.x, end.x) / gridSize) * gridSize;
  const y1 = Math.floor(Math.min(start.y, end.y) / gridSize) * gridSize;
  const x2 = Math.floor(Math.max(start.x, end.x) / gridSize) * gridSize;
  const y2 = Math.floor(Math.max(start.y, end.y) / gridSize) * gridSize;

  const walls: WallSegment[] = [
    { id: crypto.randomUUID(), layerId, points: [[x1, y1, x2, y1]], type: 'manual' }, // North
    { id: crypto.randomUUID(), layerId, points: [[x2, y1, x2, y2]], type: 'manual' }, // East
    { id: crypto.randomUUID(), layerId, points: [[x2, y2, x1, y2]], type: 'manual' }, // South
    { id: crypto.randomUUID(), layerId, points: [[x1, y2, x1, y1]], type: 'manual' }, // West
  ];

  const tiles: { x: number; y: number }[] = [];
  const startTileX = x1 / gridSize;
  const startTileY = y1 / gridSize;
  const endTileX = x2 / gridSize;
  const endTileY = y2 / gridSize;

  for (let ix = startTileX; ix < endTileX; ix++) {
    for (let iy = startTileY; iy < endTileY; iy++) {
      tiles.push({ x: ix, y: iy });
    }
  }

  return { walls, tiles };
}
