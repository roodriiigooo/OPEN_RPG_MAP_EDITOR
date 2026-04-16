import { create } from 'zustand';
import { calculateBitmask, getNeighborCoords } from '../utils/terrain/tiling';

export interface SmartTile {
  x: number;
  y: number;
  tilingSetId: string;
  bitmask: number;
}

interface SmartTerrainState {
  tiles: Map<string, SmartTile>; // Key: "x,y"
  placeTile: (x: number, y: number, tilingSetId: string) => void;
  removeTile: (x: number, y: number) => void;
  getTileKey: (x: number, y: number) => string;
}

export const useSmartTerrainStore = create<SmartTerrainState>((set, get) => ({
  tiles: new Map<string, SmartTile>(),
  
  getTileKey: (x, y) => `${x},${y}`,

  placeTile: (x, y, tilingSetId) => {
    set((state) => {
      const newTiles = new Map(state.tiles);
      const key = state.getTileKey(x, y);
      
      const isTilePresent = (nx: number, ny: number, setId: string) => {
        const t = newTiles.get(state.getTileKey(nx, ny));
        return t?.tilingSetId === setId;
      };

      // Add the tile
      newTiles.set(key, { 
        x, y, tilingSetId, 
        bitmask: calculateBitmask(x, y, tilingSetId, isTilePresent) 
      });

      // Update neighbors
      getNeighborCoords(x, y).forEach(neighbor => {
        const neighborKey = state.getTileKey(neighbor.x, neighbor.y);
        const neighborTile = newTiles.get(neighborKey);
        if (neighborTile) {
          newTiles.set(neighborKey, {
            ...neighborTile,
            bitmask: calculateBitmask(neighbor.x, neighbor.y, neighborTile.tilingSetId, isTilePresent)
          });
        }
      });

      return { tiles: newTiles };
    });
  },

  removeTile: (x, y) => {
    set((state) => {
      const newTiles = new Map(state.tiles);
      const key = state.getTileKey(x, y);
      const removedTile = newTiles.get(key);
      if (!removedTile) return state;

      const isTilePresent = (nx: number, ny: number, setId: string) => {
        const t = newTiles.get(state.getTileKey(nx, ny));
        return t?.tilingSetId === setId;
      };

      newTiles.delete(key);

      // Update neighbors of the removed tile
      getNeighborCoords(x, y).forEach(neighbor => {
        const neighborKey = state.getTileKey(neighbor.x, neighbor.y);
        const neighborTile = newTiles.get(neighborKey);
        if (neighborTile) {
          newTiles.set(neighborKey, {
            ...neighborTile,
            bitmask: calculateBitmask(neighbor.x, neighbor.y, neighborTile.tilingSetId, isTilePresent)
          });
        }
      });

      return { tiles: newTiles };
    });
  },
}));
