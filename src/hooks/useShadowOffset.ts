import { useMemo } from 'react';
import { PointLight, GlobalLighting } from '../types/map';

interface ShadowOffset {
  x: number;
  y: number;
  opacity: number;
  blur: number;
}

/**
 * Calculates shadow offset based on surrounding light sources or a manual direction.
 */
export const useShadowOffset = (
  assetX: number,
  assetY: number,
  pointLights: PointLight[],
  globalLighting: GlobalLighting,
  settings?: any
): ShadowOffset => {
  return useMemo(() => {
    // 1. Fixed Direction Mode
    if (settings && settings.useDynamicDirection === false) {
        const rad = (settings.direction || 45) * (Math.PI / 180);
        return {
            x: Math.cos(rad) * settings.x,
            y: Math.sin(rad) * settings.x,
            blur: settings.blur,
            opacity: settings.opacity
        };
    }

    // 2. Dynamic Direction Mode (Standard logic)
    let totalX = 0;
    let totalY = 0;
    let totalOpacity = 0;
    let totalBlur = 0;
    let weightSum = 0;

    // Process Point Lights
    for (const light of pointLights) {
      if (!light.visible) continue;
      const dx = assetX - light.x;
      const dy = assetY - light.y;
      const distSq = dx * dx + dy * dy;
      const radiusSq = Math.pow(light.radius, 2);
      
      if (distSq < radiusSq) {
        const distance = Math.sqrt(distSq);
        const weight = (1 - distance / light.radius) * light.intensity;
        
        const maxOffset = settings?.enabled ? settings.x : 30; 
        const offsetX = (dx / (distance || 1)) * maxOffset * (distance / light.radius);
        const offsetY = (dy / (distance || 1)) * maxOffset * (distance / light.radius);
        
        totalX += offsetX * weight;
        totalY += offsetY * weight;
        totalBlur += (settings?.enabled ? settings.blur : (5 + (distance / light.radius) * 15)) * weight;
        totalOpacity += (settings?.enabled ? settings.opacity : 0.6) * weight;
        weightSum += weight;
      }
    }

    // Process Sun (Directional)
    if (globalLighting.sunEnabled) {
      const rad = (globalLighting.sunDirection * Math.PI) / 180;
      const weight = globalLighting.sunIntensity;
      
      const maxOffset = settings?.enabled ? settings.x : 15;
      const sunX = Math.cos(rad) * maxOffset;
      const sunY = Math.sin(rad) * maxOffset;
      
      totalX += sunX * weight;
      totalY += sunY * weight;
      totalBlur += (settings?.enabled ? settings.blur : 8) * weight;
      totalOpacity += (settings?.enabled ? settings.opacity : 0.4) * weight;
      weightSum += weight;
    }

    if (weightSum === 0) {
      return { x: 0, y: 0, opacity: 0, blur: 0 };
    }

    return {
      x: totalX / weightSum,
      y: totalY / weightSum,
      blur: totalBlur / weightSum,
      opacity: Math.min(totalOpacity / weightSum, 1.0),
    };
  }, [assetX, assetY, pointLights, globalLighting, settings]);
};
