import React, { useMemo, useRef, useEffect } from 'react';
import { Group, Image } from 'react-konva';
import { useMapStore } from '../../store/useMapStore';
import { useAssetStore } from '../../store/useAssetStore';
import { TileData, Tileset, TileType, TerrainTileset } from '../../types/tiling';
import useImage from 'use-image';
import Konva from 'konva';

const QuadrantRenderer: React.FC<{
  image: HTMLImageElement;
  tileset: TerrainTileset;
  quadrantIndex: number;
  pos: { x: number; y: number };
  gridSize: number;
  subPos: 'TL' | 'TR' | 'BL' | 'BR';
}> = ({ image, tileset, quadrantIndex, pos, gridSize, subPos }) => {
  const crop = useMemo(() => {
    const qs = tileset.quadrantSize;
    
    const actualTileIndex = tileset.bitmaskMap[quadrantIndex] ?? quadrantIndex;
    
    const cols = Math.floor(image.width / tileset.tileSize);
    const tileCol = actualTileIndex % cols;
    const tileRow = Math.floor(actualTileIndex / cols);
    
    const offsetX = tileCol * tileset.tileSize;
    const offsetY = tileRow * tileset.tileSize;

    let subX = 0;
    let subY = 0;
    if (subPos === 'TR' || subPos === 'BR') subX = qs;
    if (subPos === 'BL' || subPos === 'BR') subY = qs;

    return { x: offsetX + subX, y: offsetY + subY, width: qs, height: qs };
  }, [tileset, quadrantIndex, subPos, image.width]);

  const subOffset = gridSize / 2;
  let x = pos.x * gridSize;
  let y = pos.y * gridSize;
  if (subPos === 'TR' || subPos === 'BR') x += subOffset;
  if (subPos === 'BL' || subPos === 'BR') y += subOffset;

  return (
    <Image
      x={x} y={y} width={subOffset} height={subOffset}
      image={image} crop={crop}
      listening={false} perfectDrawEnabled={false}
      imageSmoothingEnabled={false}
    />
  );
};

export const TileRenderer: React.FC<{ tile: TileData; tileset: Tileset; gridSize: number }> = React.memo(({ tile, tileset, gridSize }) => {
  const customAssets = useAssetStore(s => s.customAssets);
  const resolvedImageUrl = useMemo(() => {
    const custom = customAssets.find(a => a.id === tileset.id);
    return custom?.previewUrl || tileset.imageUrl;
  }, [customAssets, tileset.id, tileset.imageUrl]);

  const [image] = useImage(resolvedImageUrl);
  const isBlobSet = (tileset as any).bitmaskMap?.isBlobSet;
  
  const crop = useMemo(() => {
    if (!image) return { x: 0, y: 0, width: 0, height: 0 };
    if (!isBlobSet && (tile.type === TileType.GROUND || tile.type === TileType.WALL) && tile.quadrants) return { x: 0, y: 0, width: 0, height: 0 };
    
    const cols = Math.floor(image.width / tileset.tileSize);
    const col = tile.variantIndex % cols;
    const row = Math.floor(tile.variantIndex / cols);
    return { x: col * tileset.tileSize, y: row * tileset.tileSize, width: tileset.tileSize, height: tileset.tileSize };
  }, [image, tile.variantIndex, tileset.tileSize, tile.type, isBlobSet, tile.quadrants]);

  if (!image) return null;

  if (!isBlobSet && (tile.type === TileType.GROUND || tile.type === TileType.WALL) && tile.quadrants) {
    const ts = tileset as TerrainTileset;
    return (
      <Group>
        <QuadrantRenderer image={image} tileset={ts} quadrantIndex={tile.quadrants[0]} pos={tile} gridSize={gridSize} subPos="TL" />
        <QuadrantRenderer image={image} tileset={ts} quadrantIndex={tile.quadrants[1]} pos={tile} gridSize={gridSize} subPos="TR" />
        <QuadrantRenderer image={image} tileset={ts} quadrantIndex={tile.quadrants[2]} pos={tile} gridSize={gridSize} subPos="BL" />
        <QuadrantRenderer image={image} tileset={ts} quadrantIndex={tile.quadrants[3]} pos={tile} gridSize={gridSize} subPos="BR" />
      </Group>
    );
  }

  return (
    <Image
      x={tile.x * gridSize} y={tile.y * gridSize} width={gridSize} height={gridSize}
      image={image} crop={crop}
      listening={false} perfectDrawEnabled={false}
      imageSmoothingEnabled={false}
    />
  );
});

export const TilingRenderer: React.FC<{ layerId: string; type?: TileType }> = React.memo(({ layerId, type }) => {
  const activeMapId = useMapStore(s => s.id);
  const tiles = useMapStore((state) => state.tiles);
  const tilesets = useMapStore((state) => state.tilesets);
  const gridSize = useMapStore((state) => state.grid.size);
  const lastTileUpdate = useMapStore((state) => state.lastTileUpdate);
  const groupRef = useRef<Konva.Group>(null);

  const filteredTiles = useMemo(() => {
    let t = tiles.filter(tile => tile.layerId === layerId);
    if (type) t = t.filter(tile => tile.type === type);
    return t;
  }, [tiles, layerId, type]);

  useEffect(() => {
    if (groupRef.current) {
        const group = groupRef.current;
        group.clearCache();
        
        // Use a longer delay for the initial load after a level switch
        const delay = 300; 
        
        const timeout = setTimeout(() => {
            if (group && filteredTiles.length > 50) {
                const box = group.getClientRect();
                if (box.width > 0 && box.height > 0) {
                    group.cache();
                    group.getLayer()?.batchDraw();
                }
            }
        }, delay);
        return () => clearTimeout(timeout);
    }
  }, [lastTileUpdate, filteredTiles.length, activeMapId]);

  return (
    <Group ref={groupRef}>
      {filteredTiles.map((tile) => {
        const tileset = tilesets.find(ts => ts.id === tile.tilesetId);
        if (!tileset) return null;
        return (
          <TileRenderer
            key={`${tile.x}-${tile.y}-${tile.type}`}
            tile={tile}
            tileset={tileset}
            gridSize={gridSize}
          />
        );
      })}
    </Group>
  );
});
