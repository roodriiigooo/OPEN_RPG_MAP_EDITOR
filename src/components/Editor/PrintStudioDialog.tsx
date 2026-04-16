import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Group, Line, Text as KonvaText, Image as KonvaImage } from 'react-konva';
import { useEditorStore } from '../../store/useEditorStore';
import { useMapStore } from '../../store/useMapStore';
import { X, Download, Maximize2, Settings2, Printer, ShieldCheck, Plus, Minus, Loader2, LayoutGrid, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import jsPDF from 'jspdf';
import Konva from 'konva';

const INCH_TO_MM = 25.4;

const PAPER_SIZES = {
  A4: { name: 'A4', w: 210, h: 297 }, 
  A3: { name: 'A3', w: 297, h: 420 },
  Letter: { name: 'Letter', w: 215.9, h: 279.4 },
  Tabloid: { name: 'Tabloid', w: 279.4, h: 431.8 },
};

export const PrintStudioDialog: React.FC = () => {
  const { isPrintStudioOpen, setIsPrintStudioOpen, setIsExportDialogOpen } = useEditorStore();
  const mapState = useMapStore((state) => state);
  const { metadata, grid } = mapState;

  const [paperSize, setPaperSize] = useState<keyof typeof PAPER_SIZES>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [gridPhysicalSize, setGridPhysicalSize] = useState<number>(INCH_TO_MM); 
  const [printMargin, setPrintMargin] = useState<number>(5); // mm
  const [mapPosition, setMapPosition] = useState({ x: 5, y: 5 }); // mm
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [mapPreviewImage, setMapPreviewImage] = useState<HTMLImageElement | null>(null);

  const previewStageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const isMiddlePanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // SYNC FROM EXPORT STUDIO PREVIEW
  const refreshPreview = useCallback(() => {
      const capturedData = (window as any)._exportMapCapture;
      if (capturedData) {
          const img = new Image();
          img.onload = () => setMapPreviewImage(img);
          img.src = capturedData;
      } else {
          // Fallback to basic stage capture if no studio capture exists
          const mainStage = useEditorStore.getState().stageRef?.current;
          if (mainStage) {
              const oldPos = { x: mainStage.x(), y: mainStage.y() };
              const oldScale = mainStage.scaleX();
              mainStage.setAttrs({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
              const dataUrl = mainStage.toDataURL({
                  x: 0, y: 0,
                  width: metadata.resolution.width,
                  height: metadata.resolution.height,
                  pixelRatio: 1,
                  mimeType: 'image/jpeg',
                  quality: 0.8
              });
              const img = new Image();
              img.onload = () => setMapPreviewImage(img);
              img.src = dataUrl;
              mainStage.setAttrs({ ...oldPos, scaleX: oldScale, scaleY: oldScale });
          }
      }
  }, [metadata.resolution]);

  useEffect(() => {
      if (isPrintStudioOpen) {
          refreshPreview();
      } else {
          setMapPreviewImage(null);
          (window as any)._exportMapCapture = null; // Clean up
      }
  }, [isPrintStudioOpen, refreshPreview]);

  const paper = useMemo(() => {
    const p = PAPER_SIZES[paperSize];
    return orientation === 'portrait' ? { w: p.w, h: p.h } : { w: p.h, h: p.w };
  }, [paperSize, orientation]);

  const safeArea = useMemo(() => ({
      w: paper.w - (printMargin * 2),
      h: paper.h - (printMargin * 2)
  }), [paper, printMargin]);

  const mapScale = grid.type !== 'none' && grid.size > 0 
      ? gridPhysicalSize / grid.size 
      : (INCH_TO_MM / 100); 

  const mapPhysicalWidth = metadata.resolution.width * mapScale;
  const mapPhysicalHeight = metadata.resolution.height * mapScale;

  const cols = Math.max(1, Math.ceil((mapPosition.x - printMargin + mapPhysicalWidth) / safeArea.w));
  const rows = Math.max(1, Math.ceil((mapPosition.y - printMargin + mapPhysicalHeight) / safeArea.h));

  const centerPreview = useCallback(() => {
      if (dimensions.width > 0) {
          const totalW = cols * paper.w;
          const totalH = rows * paper.h;
          const sX = (dimensions.width - 150) / totalW;
          const sY = (dimensions.height - 150) / totalH;
          const newZoom = Math.min(sX, sY, 2);
          setPreviewZoom(newZoom);
          setPreviewPan({ x: (dimensions.width - totalW * newZoom) / 2, y: (dimensions.height - totalH * newZoom) / 2 });
      }
  }, [dimensions, paper, cols, rows]);

  const snapToCorner = () => setMapPosition({ x: printMargin, y: printMargin });
  const handleManualZoom = (factor: number) => setPreviewZoom(prev => Math.max(0.1, Math.min(prev * factor, 10)));

  const handleBack = () => {
      setIsPrintStudioOpen(false);
      setIsExportDialogOpen(true);
  };

  useEffect(() => {
      if (isPrintStudioOpen && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setDimensions({ width: rect.width, height: rect.height });
      }
  }, [isPrintStudioOpen]);

  useEffect(() => { centerPreview(); }, [centerPreview]);

  const handleMouseDown = useCallback((e: any) => {
      if (e.evt.button === 1 || e.evt.button === 2) {
          isMiddlePanning.current = true;
          lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY };
          if (previewStageRef.current) previewStageRef.current.container().style.cursor = 'grabbing';
      }
  }, []);

  const handleMouseMove = useCallback((e: any) => {
      if (isMiddlePanning.current) {
          const dx = e.evt.clientX - lastMousePos.current.x;
          const dy = e.evt.clientY - lastMousePos.current.y;
          setPreviewPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
          lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY };
      }
  }, []);

  const handleMouseUp = useCallback(() => {
      isMiddlePanning.current = false;
      if (previewStageRef.current) previewStageRef.current.container().style.cursor = 'default';
  }, []);

  const handleWheel = useCallback((e: any) => {
      e.evt.preventDefault();
      const stage = previewStageRef.current; if (!stage) return;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition() || { x: 0, y: 0 };
      const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
      const newScale = Math.max(0.1, Math.min(e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1, 10));
      setPreviewZoom(newScale);
      setPreviewPan({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
  }, []);

  const exportPDF = async () => {
      setIsExporting(true);
      setExportProgress(5);
      
      try {
          const pdf = new jsPDF({ orientation: orientation, unit: 'mm', format: paperSize.toLowerCase() });
          
          // Use the captured image (which is already 300DPI or high-res from Export Studio)
          const dataUrl = mapPreviewImage?.src;
          if (!dataUrl) throw new Error("No capture data found");

          setExportProgress(20);
          const totalPages = rows * cols;

          for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                  const currentPage = r * cols + c + 1;
                  if (currentPage > 1) pdf.addPage();
                  
                  const mapXOnPage = mapPosition.x - (c * safeArea.w);
                  const mapYOnPage = mapPosition.y - (r * safeArea.h);

                  pdf.addImage(dataUrl, 'JPEG', mapXOnPage, mapYOnPage, mapPhysicalWidth, mapPhysicalHeight);

                  pdf.setFillColor(255, 255, 255);
                  pdf.setDrawColor(255, 255, 255);
                  pdf.rect(0, 0, paper.w, printMargin + 0.1, 'F');
                  pdf.rect(0, paper.h - printMargin - 0.1, paper.w, printMargin + 0.1, 'F');
                  pdf.rect(0, 0, printMargin + 0.1, paper.h, 'F');
                  pdf.rect(paper.w - printMargin - 0.1, 0, printMargin + 0.1, paper.h, 'F');
                  
                  setExportProgress(20 + Math.floor((currentPage / totalPages) * 75));
                  await new Promise(res => setTimeout(res, 5));
              }
          }
          
          setExportProgress(100);
          pdf.save(`${metadata.name.replace(/\s+/g, '_')}_Printable.pdf`);
      } catch (err) {
          console.error("PDF Export Error:", err);
          alert("Failed to generate PDF.");
      }
      
      setTimeout(() => {
          setIsExporting(false);
          setExportProgress(0);
      }, 500);
  };

  const Rulers = useMemo(() => {
      const step = 10; 
      const totalW = cols * paper.w;
      const totalH = rows * paper.h;
      const lines = [];
      for (let x = 0; x <= totalW; x += step) {
          const isMajor = x % 50 === 0;
          lines.push(<Line key={`rx-${x}`} points={[x, -5, x, isMajor ? -15 : -10]} stroke="#3b82f6" strokeWidth={1 / previewZoom} />);
          if (isMajor) lines.push(<KonvaText key={`rtx-${x}`} x={x + 2} y={-14} text={`${x/10}cm`} fontSize={8 / previewZoom} fill="#3b82f6" />);
      }
      for (let y = 0; y <= totalH; y += step) {
          const isMajor = y % 50 === 0;
          lines.push(<Line key={`ry-${y}`} points={[-5, y, isMajor ? -15 : -10, y]} stroke="#3b82f6" strokeWidth={1 / previewZoom} />);
          if (isMajor) lines.push(<KonvaText key={`rty-${y}`} x={-22} y={y + 2} text={`${y/10}`} fontSize={8 / previewZoom} fill="#3b82f6" rotation={-90} />);
      }
      return <Group>{lines}</Group>;
  }, [cols, rows, paper, previewZoom]);

  if (!isPrintStudioOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 lg:p-8 font-sans text-main">
      <div className="bg-panel border border-theme rounded-3xl shadow-2xl w-full h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-theme bg-black/20 shrink-0">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-900/40"><Printer size={24} /></div>
              <div><h2 className="text-xl font-black uppercase tracking-widest text-main leading-tight">Print Studio</h2><p className="text-[10px] text-muted font-bold uppercase tracking-tighter opacity-60">Physical scale layout & PDF generation</p></div>
          </div>
          <div className="flex items-center gap-2">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-3 bg-black/20 hover:bg-black/40 text-muted hover:text-main rounded-2xl border border-theme transition-all font-black text-[10px] uppercase tracking-widest group"
              >
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                  Back to Export
              </button>
              <button onClick={() => setIsPrintStudioOpen(false)} className="text-muted hover:text-main transition-colors p-3 hover:bg-black/20 rounded-2xl"><X size={24} /></button>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 lg:w-96 border-r border-theme bg-black/10 flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-8 space-y-8">
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2"><Settings2 size={14} />Paper Settings</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><label className="text-[9px] text-muted font-black uppercase tracking-tighter">Size</label><select value={paperSize} onChange={(e) => setPaperSize(e.target.value as any)} className="w-full bg-black/40 border-theme rounded-xl px-3 py-2 text-xs text-main outline-none focus:border-indigo-500">
                                {Object.keys(PAPER_SIZES).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5"><label className="text-[9px] text-muted font-black uppercase tracking-tighter">Orientation</label><select value={orientation} onChange={(e) => setOrientation(e.target.value as any)} className="w-full bg-black/40 border-theme rounded-xl px-3 py-2 text-xs text-main outline-none focus:border-indigo-500">
                                <option value="portrait">Portrait</option>
                                <option value="landscape">Landscape</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center"><label className="text-[9px] font-bold text-muted uppercase flex items-center gap-1.5"><ShieldCheck size={10} className="text-emerald-500"/> Safe Margin</label><span className="text-[9px] font-mono text-main">{printMargin} mm</span></div>
                        <input type="range" min="0" max="30" step="1" value={printMargin} onChange={(e) => setPrintMargin(parseInt(e.target.value))} className="w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                    </div>
                </section>
                <div className="h-px bg-theme opacity-20" />
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2"><Maximize2 size={14} />Physical Scale (D&D)</h3>
                    <div className="space-y-3">
                        <div className="p-4 bg-orange-600/10 border border-orange-500/20 rounded-2xl">
                            <p className="text-[10px] font-bold text-orange-500 uppercase leading-relaxed">1 Map Square = {gridPhysicalSize.toFixed(1)} mm</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center"><label className="text-[9px] font-bold text-muted uppercase">Grid Size (mm)</label><span className="text-[9px] font-mono text-main">{gridPhysicalSize.toFixed(1)} mm</span></div>
                            <input type="range" min="5" max="100" step="0.1" value={gridPhysicalSize} onChange={(e) => setGridPhysicalSize(parseFloat(e.target.value))} className="w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setGridPhysicalSize(25.4)} className="flex-1 py-2 text-[9px] font-black bg-black/40 hover:bg-black/60 rounded-xl border border-theme text-muted transition-all">1 Inch (D&D)</button>
                            <button onClick={() => setGridPhysicalSize(20)} className="flex-1 py-2 text-[9px] font-black bg-black/40 hover:bg-black/60 rounded-xl border border-theme text-muted transition-all">2cm</button>
                        </div>
                    </div>
                </section>
                <div className="h-px bg-theme opacity-20" />
                <section className="space-y-4">
                    <div className="p-4 bg-black/20 border border-theme rounded-2xl space-y-2">
                        <h4 className="text-[10px] font-black uppercase text-main">Map Dimensions</h4>
                        <p className="text-xs font-mono text-muted">{(mapPhysicalWidth/10).toFixed(1)}cm x {(mapPhysicalHeight/10).toFixed(1)}cm</p>
                        <p className="text-[9px] font-bold uppercase text-indigo-500 mt-2">Requires {cols * rows} Page(s)</p>
                    </div>
                    <button onClick={exportPDF} disabled={isExporting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-900/40 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                        {isExporting ? `Exporting ${exportProgress}%` : 'Print PDF Layout'}
                    </button>
                </section>
          </div>
          <div ref={containerRef} className="flex-1 bg-editor relative group overflow-hidden">
              <Stage 
                ref={previewStageRef} width={dimensions.width} height={dimensions.height} 
                scaleX={previewZoom} scaleY={previewZoom} x={previewPan.x} y={previewPan.y} 
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel} 
                onContextMenu={e => e.evt.preventDefault()}
              >
                  <Layer>
                      {Array.from({ length: rows }).map((_, r) => (
                          Array.from({ length: cols }).map((_, c) => (
                              <Group key={`page-${r}-${c}`} x={c * paper.w} y={r * paper.h}>
                                  <Rect width={paper.w} height={paper.h} fill="#f3f4f6" stroke="#d1d5db" strokeWidth={1 / previewZoom} />
                                  <Group clipX={printMargin} clipY={printMargin} clipWidth={safeArea.w} clipHeight={safeArea.h}>
                                      <Rect x={printMargin} y={printMargin} width={safeArea.w} height={safeArea.h} stroke="#10b981" strokeWidth={0.5 / previewZoom} lineDash={[2 / previewZoom, 2 / previewZoom]} opacity={0.3} />
                                      {mapPreviewImage && (
                                          <KonvaImage image={mapPreviewImage} x={mapPosition.x - (c * safeArea.w)} y={mapPosition.y - (r * safeArea.h)} width={mapPhysicalWidth} height={mapPhysicalHeight} opacity={1} />
                                      )}
                                  </Group>
                                  <KonvaText text={`Page ${r * cols + c + 1}`} x={printMargin + 2} y={printMargin + 2} fontSize={8 / previewZoom} fill="#10b981" fontStyle="bold" opacity={0.5} />
                              </Group>
                          ))
                      ))}
                      <Rect x={mapPosition.x} y={mapPosition.y} width={mapPhysicalWidth} height={mapPhysicalHeight} fill="transparent" draggable onDragMove={(e) => setMapPosition({ x: e.target.x(), y: e.target.y() })} onMouseEnter={(e: any) => e.target.getStage().container().style.cursor = 'move'} onMouseLeave={(e: any) => e.target.getStage().container().style.cursor = 'default'} />
                      <Group x={mapPosition.x + mapPhysicalWidth / 2} y={mapPosition.y + mapPhysicalHeight / 2} listening={false}>
                          <Group offsetX={40 / previewZoom} offsetY={10 / previewZoom}>
                              <Rect width={80 / previewZoom} height={20 / previewZoom} fill="#f97316" cornerRadius={4 / previewZoom} shadowBlur={10} shadowColor="black" shadowOpacity={0.3} />
                              <KonvaText text="MAP AREA" width={80 / previewZoom} align="center" y={5 / previewZoom} fontSize={10 / previewZoom} fill="white" fontStyle="bold" />
                          </Group>
                      </Group>
                      {Rulers}
                  </Layer>
              </Stage>

              {/* Progress Overlay */}
              {isExporting && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
                      <div className="bg-panel border border-theme p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4">
                          <Loader2 size={48} className="text-indigo-500 animate-spin" />
                          <div className="space-y-2 w-full">
                              <div className="flex justify-between items-end mb-1">
                                  <h3 className="text-[10px] font-black uppercase tracking-widest text-main">Slicing PDF</h3>
                                  <span className="text-[9px] font-bold text-muted">{exportProgress}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${exportProgress}%` }} />
                              </div>
                          </div>
                      </div>
                  </div>
              )}
              
              <div className="absolute bottom-6 left-6 flex flex-col gap-2 p-1.5 bg-sidebar/80 backdrop-blur border border-theme rounded-2xl shadow-2xl z-[70]">
                  <button onClick={() => handleManualZoom(1.2)} className="p-3 hover:bg-black/40 text-muted hover:text-indigo-500 rounded-xl transition-all" title="Zoom In"><Plus size={18} /></button>
                  <button onClick={() => handleManualZoom(0.8)} className="p-3 hover:bg-black/40 text-muted hover:text-indigo-500 rounded-xl transition-all" title="Zoom Out"><Minus size={18} /></button>
                  <div className="h-px bg-theme opacity-20 mx-2" />
                  <button onClick={snapToCorner} className="p-3 hover:bg-black/40 text-muted hover:text-emerald-500 rounded-xl transition-all" title="Snap to Corner"><LayoutGrid size={18} /></button>
                  <button onClick={centerPreview} className="p-3 hover:bg-black/40 text-muted hover:text-orange-500 rounded-xl transition-all" title="Recenter View"><Maximize2 size={18} /></button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
