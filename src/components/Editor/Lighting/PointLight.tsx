import React, { useState, useEffect } from 'react';
import { Line, Group, Circle } from 'react-konva';
import { PointLight as PointLightType } from '../../../types/map';
import { useMapStore } from '../../../store/useMapStore';

interface PointLightProps extends PointLightType {}

export const PointLight: React.FC<PointLightProps> = ({ x, y, color, radius, intensity }) => {
  const tiles = useMapStore(state => state.tiles);
  const manualWalls = useMapStore(state => state.walls);
  const rooms = useMapStore(state => state.rooms);
  const gridSize = useMapStore(state => state.grid.size);
  const metadata = useMapStore(state => state.metadata);
  
  const [visPoints, setVisPoints] = useState<number[]>([]);

  useEffect(() => {
    const worker = new Worker(new URL('../../../workers/lighting.worker.ts', import.meta.url), { type: 'module' });
    
    worker.onmessage = (e) => {
      setVisPoints(e.data.visPoints);
    };

    worker.postMessage({
      lightX: x,
      lightY: y,
      radius,
      tiles,
      manualWalls,
      rooms,
      gridSize,
      resolution: metadata.resolution
    });

    return () => worker.terminate();
  }, [x, y, radius, tiles, manualWalls, rooms, gridSize, metadata.resolution]);

  return (
    <Group listening={false}>
      {/* The light itself with visibility polygon masking */}
      {visPoints.length > 0 && (
        <Line
          points={visPoints}
          fillRadialGradientStartPoint={{ x, y }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndPoint={{ x, y }}
          fillRadialGradientEndRadius={radius}
          fillRadialGradientColorStops={[
            0, color,
            0.1, color, // Core intensity maintained within masked polygon
            0.5, color,
            1, 'transparent',
          ]}
          opacity={intensity}
          closed={true}
          globalCompositeOperation="lighter"
          perfectDrawEnabled={false}
        />
      )}
    </Group>
  );
};
