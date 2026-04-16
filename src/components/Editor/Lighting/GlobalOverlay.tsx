import React from 'react';
import { Rect } from 'react-konva';
import { GlobalLighting } from '../../../types/map';
import { useMapStore } from '../../../store/useMapStore';

interface GlobalOverlayProps extends GlobalLighting {}

export const GlobalOverlay: React.FC<GlobalOverlayProps> = ({ color, intensity, blendMode }) => {
  const metadata = useMapStore((state) => state.metadata);

  return (
    <Rect
      x={0}
      y={0}
      width={metadata.resolution.width}
      height={metadata.resolution.height}
      fill={color}
      opacity={intensity}
      globalCompositeOperation={blendMode as any}
      listening={false}
      perfectDrawEnabled={false}
    />
  );
};
