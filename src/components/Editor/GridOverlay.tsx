import React from 'react';
import { Layer, Line, Group } from 'react-konva';
import { useMapStore } from '../../store/useMapStore';
import { axialToPixel } from '../../utils/terrain/hex';

export const GridOverlay: React.FC = () => {
  const grid = useMapStore((state) => state.grid);
  const metadata = useMapStore((state) => state.metadata);

  if (!grid.visible || grid.type === 'none') {
    return null;
  }

  const { width, height } = metadata.resolution;
  const { size, color, opacity, type, lineStyle = 'solid' } = grid;

  const getDashPattern = (style: string) => {
    switch (style) {
      case 'dashed': return [10, 5];
      case 'dotted': return [2, 2];
      case 'double': return undefined; // Will handle separately or just solid for now
      default: return undefined;
    }
  };

  const dash = getDashPattern(lineStyle);
  const isDouble = lineStyle === 'double';

  const lines = [];

  if (type === 'square') {
    // Vertical lines
    for (let i = 0; i <= width; i += size) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, height]}
          stroke={color}
          strokeWidth={isDouble ? 3 : 1}
          dash={dash}
          opacity={opacity}
          listening={false}
        />
      );
      if (isDouble) {
        lines.push(
          <Line
            key={`v-${i}-inner`}
            points={[i, 0, i, height]}
            stroke={metadata.backgroundColor || '#ffffff'}
            strokeWidth={1}
            opacity={opacity}
            listening={false}
          />
        );
      }
    }

    // Horizontal lines
    for (let j = 0; j <= height; j += size) {
      lines.push(
        <Line
          key={`h-${j}`}
          points={[0, j, width, j]}
          stroke={color}
          strokeWidth={isDouble ? 3 : 1}
          dash={dash}
          opacity={opacity}
          listening={false}
        />
      );
      if (isDouble) {
        lines.push(
          <Line
            key={`h-${j}-inner`}
            points={[0, j, width, j]}
            stroke={metadata.backgroundColor || '#ffffff'}
            strokeWidth={1}
            opacity={opacity}
            listening={false}
          />
        );
      }
    }
  } else {
    // Hexagonal Grid
    const hexType = type === 'hex-pointy' ? 'pointy' : 'flat';
    
    // Determine range of axial coordinates to cover the map
    // This is a rough estimation to ensure full coverage
    const qMin = -Math.ceil(width / size);
    const qMax = Math.ceil(width / size) * 2;
    const rMin = -Math.ceil(height / size);
    const rMax = Math.ceil(height / size) * 2;

    for (let q = qMin; q <= qMax; q++) {
      for (let r = rMin; r <= rMax; r++) {
        const center = axialToPixel(q, r, size, hexType);
        
        // Only render if roughly within map bounds
        if (center.x < -size || center.x > width + size || center.y < -size || center.y > height + size) {
          continue;
        }

        const points = [];
        for (let i = 0; i < 6; i++) {
          const angle_deg = hexType === 'pointy' ? 60 * i - 30 : 60 * i;
          const angle_rad = (Math.PI / 180) * angle_deg;
          points.push(center.x + size * Math.cos(angle_rad));
          points.push(center.y + size * Math.sin(angle_rad));
        }

        lines.push(
          <Line
            key={`hex-${q}-${r}`}
            points={points}
            closed
            stroke={color}
            strokeWidth={isDouble ? 3 : 1}
            dash={dash}
            opacity={opacity}
            listening={false}
          />
        );
        if (isDouble) {
            lines.push(
              <Line
                key={`hex-${q}-${r}-inner`}
                points={points}
                closed
                stroke={metadata.backgroundColor || '#ffffff'}
                strokeWidth={1}
                opacity={opacity}
                listening={false}
              />
            );
        }
      }
    }
  }

  return (
    <Layer id="grid-layer">
      <Group clipX={0} clipY={0} clipWidth={width} clipHeight={height}>
        {lines}
      </Group>
    </Layer>
  );
};
