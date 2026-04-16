import { TileData, TileType } from '../types/tiling';
import { 
    NEIGHBORS, 
    NW, N, NE, W, E, SW, S, SE, 
    BLOB_MAP, 
    getMinimalMask,
    calculateTerrainQuadrants 
} from '../utils/terrain/tiling';

self.onmessage = (e: MessageEvent) => {
  const { tiles, affectedKeys, tilesets, isHex, layerId } = e.data;
  const nextTiles = [...tiles] as TileData[];
  const updatedTiles: TileData[] = [];

  affectedKeys.forEach((key: string) => {
    const [cx, cy] = key.split(',').map(Number);
    
    // Find all tiles at this coordinate (regardless of layerId, but filtered by those provided in nextTiles)
    // If layerId is provided in message, we can still use it as a primary filter if we want to be strict,
    // but for "Walls" and unified layers, it's safer to process whatever is there or filter by the provided layerId only if it exists.
    const tilesAtCoord = layerId 
        ? nextTiles.filter(t => t.x === cx && t.y === cy && t.layerId === layerId)
        : nextTiles.filter(t => t.x === cx && t.y === cy);
    
    tilesAtCoord.forEach(tile => {
      let rawMask = 0;
      for (const n of NEIGHBORS) {
        // STRICT TEXTURE ISOLATION: Connect only to tiles with the EXACT SAME tilesetId AND layerId
        if (nextTiles.some(t => t.x === cx + n.dx && t.y === cy + n.dy && t.tilesetId === tile.tilesetId && t.layerId === tile.layerId)) {
          rawMask |= n.bit;
        }
      }

      const mask = isHex ? rawMask : getMinimalMask(rawMask);
      const tileset = tilesets.find((ts: any) => ts.id === tile.tilesetId);
      const isBlobSet = (tileset as any)?.bitmaskMap?.isBlobSet;

      if (isBlobSet) {
        tile.bitmask = mask;
        tile.variantIndex = BLOB_MAP[mask] ?? 0;
        tile.quadrants = undefined;
      } else if (!isHex) {
        tile.bitmask = mask;
        tile.quadrants = calculateTerrainQuadrants(mask);
        tile.variantIndex = 0;
      } else {
        const variantIndex = tileset?.bitmaskMap ? (tileset.bitmaskMap[mask] ?? tileset.bitmaskMap[mask & (NW|N|NE|W|E|SW|S|SE)] ?? 0) : 0;
        tile.bitmask = mask;
        tile.variantIndex = variantIndex;
      }
      updatedTiles.push(tile);
    });
  });

  self.postMessage({ updatedTiles });
};
