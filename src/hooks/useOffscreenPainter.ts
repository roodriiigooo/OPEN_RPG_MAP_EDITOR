import { useRef, useCallback } from 'react';
import { BrushSettings, PaintingMode } from '../types/terrain';

export interface Point {
  x: number;
  y: number;
}

/**
 * Hook to manage an offscreen canvas for terrain painting.
 * Decouples painting logic from React/Konva rendering for performance.
 */
export function useOffscreenPainter() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const texturesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  /**
   * Initializes the canvas dimensions and optionally loads existing data.
   */
  const initPainter = useCallback((width: number, height: number, initialDataUrl?: string) => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      if (initialDataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = initialDataUrl;
      }
    }
  }, []);

  /**
   * Pre-loads a texture image into memory.
   */
  const loadTexture = useCallback(async (id: string, url: string) => {
    if (texturesRef.current.has(id)) return;
    
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        texturesRef.current.set(id, img);
        resolve();
      };
      img.onerror = () => {
        console.error(`Failed to load texture: ${id} from ${url}`);
        resolve();
      };
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }, []);

  /**
   * Internal common painting logic.
   */
  const drawStroke = useCallback((points: Point[], settings: BrushSettings, forceMode?: PaintingMode) => {
    if (!canvasRef.current || points.length === 0) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const mode = forceMode || settings.mode;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = settings.size;
    ctx.globalAlpha = settings.opacity;

    // Softness implementation using shadowBlur
    const isSoft = settings.hardness < 1;
    if (isSoft) {
      ctx.shadowBlur = (1 - settings.hardness) * settings.size;
      ctx.shadowColor = mode === 'erase' || mode === 'mask' ? 'white' : 'black';
    } else {
      ctx.shadowBlur = 0;
    }

    if (mode === 'erase' || mode === 'mask') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      const texture = texturesRef.current.get(settings.textureId);
      if (texture) {
        const pattern = ctx.createPattern(texture, 'repeat');
        if (pattern) {
          ctx.strokeStyle = pattern;
        } else {
          ctx.strokeStyle = '#000000';
        }
      } else {
        ctx.strokeStyle = '#000000';
      }
    }

    ctx.beginPath();
    if (points.length >= 2) {
      const p1 = points[points.length - 2];
      const p2 = points[points.length - 1];
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    } else {
      const p = points[0];
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }, []);

  /**
   * Draws strokes on the canvas using the provided brush settings.
   */
  const paint = useCallback((points: Point[], settings: BrushSettings) => {
    drawStroke(points, settings);
  }, [drawStroke]);

  /**
   * Clears parts of the canvas using the eraser mode.
   */
  const erase = useCallback((points: Point[], settings: BrushSettings) => {
    drawStroke(points, settings, 'erase');
  }, [drawStroke]);

  /**
   * Masks parts of the canvas.
   */
  const mask = useCallback((points: Point[], settings: BrushSettings) => {
    drawStroke(points, settings, 'mask');
  }, [drawStroke]);

  /**
   * Returns the canvas element for Konva integration.
   */
  const getCanvas = useCallback(() => canvasRef.current, []);

  /**
   * Exports the current state for persistence.
   */
  const toDataURL = useCallback(() => {
    return canvasRef.current?.toDataURL() || '';
  }, []);

  /**
   * Fills a rectangular area with the provided brush settings.
   */
  const fillRect = useCallback((x: number, y: number, w: number, h: number, settings: BrushSettings) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.globalAlpha = settings.opacity;
    
    const texture = texturesRef.current.get(settings.textureId);
    if (texture) {
      const pattern = ctx.createPattern(texture, 'repeat');
      if (pattern) ctx.fillStyle = pattern;
      else ctx.fillStyle = '#000000';
    } else {
      ctx.fillStyle = '#000000';
    }

    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }, []);

  return {
    initPainter,
    loadTexture,
    paint,
    erase,
    fillRect,
    getCanvas,
    toDataURL,
  };
}
