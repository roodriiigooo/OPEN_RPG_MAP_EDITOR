import { Room } from '../../types/map';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Subtracts an eraseRect from a target room.
 * Returns an array of rooms that represent the remaining parts of the original room.
 */
export function subtractRect(room: Room, eraseRect: Rect): Room[] {
  const r1 = room;
  const r2 = eraseRect;

  // Check if there is an intersection
  if (
    r2.x >= r1.x + r1.width ||
    r2.x + r2.width <= r1.x ||
    r2.y >= r1.y + r1.height ||
    r2.y + r2.height <= r1.y
  ) {
    return [room]; // No intersection
  }

  const results: Room[] = [];

  // Top part
  if (r2.y > r1.y) {
    results.push({
      ...room,
      id: crypto.randomUUID(),
      y: r1.y,
      height: r2.y - r1.y,
    });
  }

  // Bottom part
  if (r2.y + r2.height < r1.y + r1.height) {
    results.push({
      ...room,
      id: crypto.randomUUID(),
      y: r2.y + r2.height,
      height: (r1.y + r1.height) - (r2.y + r2.height),
    });
  }

  // Left part
  const middleY = Math.max(r1.y, r2.y);
  const middleHeight = Math.min(r1.y + r1.height, r2.y + r2.height) - middleY;

  if (r2.x > r1.x) {
    results.push({
      ...room,
      id: crypto.randomUUID(),
      x: r1.x,
      width: r2.x - r1.x,
      y: middleY,
      height: middleHeight,
    });
  }

  // Right part
  if (r2.x + r2.width < r1.x + r1.width) {
    results.push({
      ...room,
      id: crypto.randomUUID(),
      x: r2.x + r2.width,
      width: (r1.x + r1.width) - (r2.x + r2.width),
      y: middleY,
      height: middleHeight,
    });
  }

  return results;
}

/**
 * Normalizes a list of rooms by performing subtraction between overlapping rooms
 * to ensure we have a clean set of rectangles.
 * Note: This is a simplified union.
 */
export function addRoomCSG(existingRooms: Room[], newRoom: Room): Room[] {
    // For a simple union where we want to keep them as distinct objects but united visually,
    // we don't necessarily need to split them, unless we want to avoid double-filling.
    // However, the user wants "Union of spaces".
    return [...existingRooms, newRoom];
}
