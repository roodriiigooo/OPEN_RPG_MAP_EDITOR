import Konva from 'konva';

export interface ExportOptions {
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  pixelRatio: number;
  fileName: string;
  // Added precise bounding box for export
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * Exports a Konva Stage or Node to an image file, 
 * strictly constrained to the provided dimensions.
 */
export const exportToImage = (stage: Konva.Stage, options: ExportOptions) => {
  // Clear selection before export
  const transformer = stage.findOne('Transformer') as Konva.Transformer;
  if (transformer) {
    transformer.nodes([]);
  }

  // Generate data URL from the specific map area
  const dataURL = stage.toDataURL({
    pixelRatio: options.pixelRatio,
    mimeType: options.mimeType,
    x: options.x || 0,
    y: options.y || 0,
    width: options.width,
    height: options.height,
    quality: 0.95
  });

  const link = document.createElement('a');
  link.download = options.fileName;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
