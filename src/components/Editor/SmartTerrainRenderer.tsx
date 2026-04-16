import React from 'react';
import { Group, Image } from 'react-konva';
import { useSmartTerrainStore } from '../../store/useSmartTerrainStore';
import { TILING_SETS } from '../../data/tilingSets';
import { useMapStore } from '../../store/useMapStore';
import useImage from 'use-image';

export const SmartTerrainRenderer: React.FC = () => {
  const tiles = useSmartTerrainStore((state) => state.tiles);
  const metadata = useMapStore((state) => state.metadata);

  // Convert map to array for rendering
  const tileList = Array.from(tiles.values());

  return (
    <Group>
      {tileList.map((tile) => (
        <SmartTileItem 
          key={`${tile.x},${tile.y}`} 
          tile={tile} 
        />
      ))}
    </Group>
  );
};

const SmartTileItem: React.FC<{ tile: any }> = ({ tile }) => {
  const tilingSet = TILING_SETS.find(s => s.id === tile.tilingSetId);
  // We'll need a way to get the actual texture URL from the tilingSet.textureId
  // For now, let's assume textureId is the URL or we look it up in AVAILABLE_TEXTURES
  const [image] = useImage('https://placehold.co/100x100/3d550c/white?text=GrassTile');

  if (!tilingSet) return null;

  // In a real tileset, we would use tile.bitmask to find the rule and crop the image
  // For this prototype, we'll just render the tile at its grid position
  const size = tilingSet.tileSize;

  return (
    <Image
      x={tile.x * size}
      y={tile.y * size}
      width={size}
      height={size}
      image={image}
      opacity={0.8}
    />
  );
};
