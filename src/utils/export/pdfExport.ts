import Konva from 'konva';

export interface PDFExportOptions {
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  ppi: number; // usually 300 for high-res
  fileName: string;
}

/**
 * High-res Multi-page PDF Export using a native print approach.
 * It slices the map into printable pages and triggers the browser print dialog.
 */
export const exportToPDF = async (stage: Konva.Stage, options: PDFExportOptions) => {
  const { width, height } = stage.getSize();
  
  // A4 at 300 PPI: ~2480 x 3508 px
  // Letter at 300 PPI: ~2550 x 3300 px
  const pagePx = {
    A4: options.orientation === 'portrait' ? { w: 2480, h: 3508 } : { w: 3508, h: 2480 },
    Letter: options.orientation === 'portrait' ? { w: 2550, h: 3300 } : { w: 3300, h: 2550 },
  }[options.pageSize];

  const cols = Math.ceil(width / pagePx.w);
  const rows = Math.ceil(height / pagePx.h);

  // Create a hidden printing container
  const printContainer = document.createElement('div');
  printContainer.id = 'print-container';
  printContainer.style.position = 'fixed';
  printContainer.style.left = '-9999px';
  printContainer.style.top = '0';
  
  // Add CSS for printing
  const style = document.createElement('style');
  style.innerHTML = `
    @media print {
      body * { visibility: hidden; }
      #print-container, #print-container * { visibility: visible; }
      #print-container { position: absolute; left: 0; top: 0; }
      .print-page { page-break-after: always; break-after: page; }
    }
  `;
  document.head.appendChild(style);

  // Hide selection before slicing
  const transformer = stage.findOne('Transformer') as Konva.Transformer;
  if (transformer) transformer.nodes([]);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = pagePx.w;
      pageCanvas.height = pagePx.h;
      pageCanvas.className = 'print-page';
      pageCanvas.style.display = 'block';
      
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        // Draw slice of the stage
        // We use stage.toCanvas() or stage.toDataURL() for high-res
        const dataUrl = stage.toDataURL({
            x: c * pagePx.w,
            y: r * pagePx.h,
            width: pagePx.w,
            height: pagePx.h,
            pixelRatio: 1 // Stage is already at base size, ppi handle handled by pagePx math
        });
        
        const img = new Image();
        await new Promise((resolve) => {
            img.onload = resolve;
            img.src = dataUrl;
        });
        ctx.drawImage(img, 0, 0);
      }
      printContainer.appendChild(pageCanvas);
    }
  }

  document.body.appendChild(printContainer);
  window.print();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(printContainer);
    document.head.removeChild(style);
  }, 1000);
};
