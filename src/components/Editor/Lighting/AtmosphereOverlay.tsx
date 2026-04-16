import React, { useMemo } from 'react';
import { Rect, Group } from 'react-konva';
import { useMapStore } from '../../../store/useMapStore';

export const AtmosphereOverlay: React.FC = () => {
  const atmosphere = useMapStore((state) => state.lighting.atmosphere);
  const metadata = useMapStore((state) => state.metadata);

  if (!atmosphere || !atmosphere.enabled) return null;

  const { width, height } = metadata.resolution;

  return (
    <Group listening={false}>
      {/* Color Grading / Global Tint */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={atmosphere.colorGrading}
        opacity={0.1}
        globalCompositeOperation="overlay"
        perfectDrawEnabled={false}
      />

      {/* Vignette Effect */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fillRadialGradientStartPoint={{ x: width / 2, y: height / 2 }}
        fillRadialGradientStartRadius={Math.max(width, height) * 0.2}
        fillRadialGradientEndPoint={{ x: width / 2, y: height / 2 }}
        fillRadialGradientEndRadius={Math.max(width, height) * 0.8}
        fillRadialGradientColorStops={[
          0, 'transparent',
          1, `rgba(0,0,0,${atmosphere.vignette})`,
        ]}
        perfectDrawEnabled={false}
      />

      {/* Noise/Grain Simulation (Simplified with low-opacity overlay) */}
      {atmosphere.noise > 0 && (
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="#888888"
          opacity={atmosphere.noise * 0.05}
          globalCompositeOperation="overlay"
          perfectDrawEnabled={false}
        />
      )}
    </Group>
  );
};
