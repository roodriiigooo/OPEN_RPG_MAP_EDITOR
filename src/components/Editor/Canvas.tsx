import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Circle, RegularPolygon, Transformer, Image, Group, Line, Text as KonvaText } from 'react-konva';
import { useMapStore } from '../../store/useMapStore';
import { useProjectStore } from '../../store/useProjectStore';
import { Asset, MapMetadata, Layer as MapLayer, PointLight as IPointLight } from '../../types/map';
import { GridOverlay } from './GridOverlay';
import Konva from 'konva';
import { useOffscreenPainter, Point } from '../../hooks/useOffscreenPainter';
import { useTerrainStore } from '../../store/useTerrainStore';
import { AVAILABLE_TEXTURES } from '../../types/terrain';
import { GlobalOverlay } from './Lighting/GlobalOverlay';
import { AtmosphereOverlay } from './Lighting/AtmosphereOverlay';
import { PointLight } from './Lighting/PointLight';
import { useShadowOffset } from '../../hooks/useShadowOffset';
import { useEditorStore } from '../../store/useEditorStore';
import { useWallStore } from '../../store/useWallStore';
import { useRoomStore } from '../../store/useRoomStore';
import { useAssetStore } from '../../store/useAssetStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import useImage from 'use-image';
import { TilingRenderer } from './TilingRenderer';
import { GhostFloorRenderer } from './GhostFloorRenderer';
import { TileType } from '../../types/tiling';
import { pixelToAxial, axialToPixel } from '../../utils/terrain/hex';
import { getLinePoints } from '../../utils/terrain/tiling';

const CustomImageRenderer: React.FC<{ url: string; commonProps: any }> = ({ url, commonProps }) => {
  const [image] = useImage(url);
  if (!image) return null;
  return <Image {...commonProps} image={image} offsetX={image.width / 2} offsetY={image.height / 2} />;
};

const LightInteractionPoint: React.FC<{ light: IPointLight; isSelected: boolean; onSelect: (id: string, shift: boolean) => void; onDragMove: (id: string, e: any) => void; onDragEnd: (id: string, e: any) => void; scale: number; canInteract: boolean; }> = ({ light, isSelected, onSelect, onDragMove, onDragEnd, scale, canInteract }) => {
    return <Circle 
        x={light.x} 
        y={light.y} 
        radius={15 / scale} 
        fill={isSelected ? '#f97316' : 'rgba(249, 115, 22, 0.3)'} 
        stroke={isSelected ? 'white' : '#f97316'} 
        strokeWidth={2 / scale} 
        draggable={canInteract && !light.locked} 
        onClick={(e) => canInteract && onSelect(light.id, e.evt.ctrlKey || e.evt.shiftKey)} 
        onTap={(e) => canInteract && onSelect(light.id, e.evt.ctrlKey || e.evt.shiftKey)} 
        onDragStart={(e) => { if (canInteract && !isSelected) onSelect(light.id, e.evt.ctrlKey || e.evt.shiftKey); }} 
        onDragMove={(e) => canInteract && onDragMove(light.id, e)} 
        onDragEnd={(e) => onDragEnd(light.id, e)} 
        onMouseEnter={(e: any) => { if (canInteract && !light.locked) e.target.getStage().container().style.cursor = 'move'; }} 
        onMouseLeave={(e: any) => { e.target.getStage().container().style.cursor = 'default'; }} 
        listening={canInteract} 
    />;
};

const AssetRenderer: React.FC<{ asset: Asset; isSelected: boolean; onSelect: (id: string, shift: boolean) => void; onDragMove: (id: string, e: any) => void; onDragEnd: (id: string, e: any) => void; onTransformEnd: (id: string, e: any) => void; multiSelect: boolean; canInteract: boolean; }> = React.memo(({ asset, isSelected, onSelect, onDragMove, onDragEnd, onTransformEnd, multiSelect, canInteract }) => {
  const pointLights = useMapStore((state) => state.lighting.pointLights);
  const globalLighting = useMapStore((state) => state.lighting.global);
  const props = asset.properties || { opacity: 1, flipX: false, flipY: false };
  const shadow = useShadowOffset(asset.x, asset.y, pointLights, globalLighting, props.shadow);
  const shapeRef = useRef<any>(null);
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [textSize, setTextSize] = useState({ w: 0, h: 0 });
  
  const customAssets = useAssetStore(s => s.customAssets);

  useEffect(() => { 
      if (isSelected && !multiSelect && trRef.current && shapeRef.current) { 
          trRef.current.nodes([shapeRef.current]); 
          trRef.current.getLayer()?.batchDraw(); 
      } 
  }, [isSelected, multiSelect, asset]);

  useEffect(() => {
      if (asset.type === 'text' && textRef.current) {
          const node = textRef.current;
          if (document.fonts) {
              document.fonts.ready.then(() => {
                  setTextSize({ w: node.width(), h: node.height() });
                  node.getLayer()?.batchDraw();
              });
          } else {
              setTextSize({ w: node.width(), h: node.height() });
              node.getLayer()?.batchDraw();
          }
      }
  }, [asset.properties?.text, asset.properties?.fontSize, asset.properties?.fontFamily, asset.properties?.fontStyle, isSelected]);

  if (!asset.visible) return null;
  
  const shadowProps = props.shadow?.enabled 
    ? { shadowColor: props.shadow.color || 'black', shadowBlur: shadow.blur, shadowOffset: { x: shadow.x, y: shadow.y }, shadowOpacity: shadow.opacity } 
    : {};

  const commonProps = { 
      id: asset.id, 
      ref: shapeRef, 
      x: asset.x, 
      y: asset.y, 
      rotation: asset.rotation, 
      scaleX: (asset.scaleX ?? asset.scale) * (props.flipX ? -1 : 1), 
      scaleY: (asset.scaleY ?? asset.scale) * (props.flipY ? -1 : 1), 
      opacity: props.opacity ?? 1, 
      draggable: canInteract && !asset.locked, 
      stroke: isSelected && asset.type !== 'text' ? '#f97316' : (canInteract && isHovered && asset.type !== 'text' ? 'rgba(249, 115, 22, 0.5)' : 'transparent'), 
      strokeWidth: isSelected ? 2 : (isHovered ? 1 : 0), 
      ...shadowProps, 
      onClick: (e: any) => canInteract && onSelect(asset.id, e.evt.ctrlKey || e.evt.shiftKey), 
      onTap: (e: any) => canInteract && onSelect(asset.id, e.evt.ctrlKey || e.evt.shiftKey), 
      onDragStart: (e: any) => { if (canInteract && !isSelected) onSelect(asset.id, e.evt.ctrlKey || e.evt.shiftKey); }, 
      onDragMove: (e: any) => canInteract && onDragMove(asset.id, e), 
      onDragEnd: (e: any) => canInteract && onDragEnd(asset.id, e), 
      onTransformEnd: (e: any) => canInteract && onTransformEnd(asset.id, e), 
      onMouseEnter: () => canInteract && setIsHovered(true), 
      onMouseLeave: () => setIsHovered(false), 
      perfectDrawEnabled: false, 
      listening: canInteract 
  };

  const renderShape = () => {
    switch (asset.type) { 
        case 'square': return <Rect {...commonProps} width={100} height={100} fill="#64748b" offsetX={50} offsetY={50} />; 
        case 'circle': return <Circle {...commonProps} radius={50} fill="#64748b" />; 
        case 'triangle': return <RegularPolygon {...commonProps} sides={3} radius={60} fill="#64748b" />; 
        case 'pentagon': return <RegularPolygon {...commonProps} sides={5} radius={60} fill="#64748b" />; 
        case 'text': 
            const textText = props.text || 'TEXT';
            const textFontSize = props.fontSize || 24;
            const textFontFamily = props.fontFamily || 'Arial';
            const textFontStyle = props.fontStyle || 'normal';
            
            return (
                <Group
                    x={asset.x}
                    y={asset.y}
                    rotation={asset.rotation}
                    scaleX={commonProps.scaleX}
                    scaleY={commonProps.scaleY}
                    draggable={canInteract && !asset.locked}
                    onClick={commonProps.onClick}
                    onTap={commonProps.onTap}
                    onDragStart={commonProps.onDragStart}
                    onDragMove={commonProps.onDragMove}
                    onDragEnd={commonProps.onDragEnd}
                    onTransformEnd={commonProps.onTransformEnd}
                    onMouseEnter={commonProps.onMouseEnter}
                    onMouseLeave={commonProps.onMouseLeave}
                    ref={shapeRef}
                    {...shadowProps}
                >
                    <KonvaText 
                        ref={textRef}
                        text={textText} 
                        fontSize={textFontSize} 
                        fontFamily={textFontFamily} 
                        fontStyle={textFontStyle}
                        fill={props.fill || '#000000'}
                        align={props.align || 'left'}
                        opacity={props.text ? (props.opacity ?? 1) : 0.3}
                    />
                    {(isSelected || isHovered) && (
                        <Rect 
                            width={textSize.w}
                            height={textSize.h}
                            stroke="#f97316"
                            strokeWidth={2 / Math.abs(commonProps.scaleX || 1)}
                            dash={[4, 2]}
                            listening={false}
                        />
                    )}
                </Group>
            );
        case 'custom':
            if (asset.customAssetId) { 
                const customAsset = customAssets.find(a => a.id === asset.customAssetId); 
                if (customAsset?.previewUrl) return <CustomImageRenderer url={customAsset.previewUrl} commonProps={commonProps} />; 
            }
            return null;
        default: return null; 
    }
  };
  return <React.Fragment>{renderShape()}{isSelected && canInteract && !asset.locked && !multiSelect && <Transformer ref={trRef} centeredScaling={false} enabledAnchors={props.freeTransform ? ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right'] : ['top-left', 'top-right', 'bottom-left', 'bottom-right']} rotateEnabled={true} keepRatio={!props.freeTransform} boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) ? oldBox : newBox} />}</React.Fragment>;
});

const InternalCanvas: React.FC = () => {
  const metadata = useMapStore(s => s.metadata);
  const layers = useMapStore(s => s.layers);
  const assets = useMapStore(s => s.assets);
  const activeLayerId = useMapStore(s => s.activeLayerId);
  const selectedAssetIds = useMapStore(s => s.selectedAssetIds);
  const lighting = useMapStore(s => s.lighting);
  const ghostFloorId = useMapStore(s => s.ghostFloorId);
  const ghostFloorOpacity = useMapStore(s => s.ghostFloorOpacity);
  const maps = useProjectStore(s => s.maps);
  const updateAsset = useMapStore(s => s.updateAsset);
  const moveObjects = useMapStore(s => s.moveObjects);
  const setSelectedAsset = useMapStore(s => s.setSelectedAsset);
  const setSelectedAssetIds = useMapStore(s => s.setSelectedAssetIds);
  const updatePointLight = useMapStore(s => s.updatePointLight);
  
  const activeTool = useEditorStore(s => s.activeTool);
  const selectionMode = useEditorStore(s => s.selectionMode);
  const setStageRef = useEditorStore(s => s.setStageRef);
  const viewportZoom = useEditorStore(s => s.viewportZoom);
  const setViewportZoom = useEditorStore(s => s.setViewportZoom);
  const viewportPosition = useEditorStore(s => s.viewportPosition);
  const setViewportPosition = useEditorStore(s => s.setViewportPosition);
  const editorBgColor = useEditorStore(s => s.editorBgColor);
  const requestCenter = useEditorStore(s => s.requestCenter);

  const { isDrawing: isDrawingRoom, startPoint: roomStartPoint, currentPoint: roomCurrentPoint, setIsDrawing: setIsDrawingRoom, setStartPoint: setRoomStartPoint, setCurrentPoint: setRoomCurrentPoint, reset: resetRoom } = useRoomStore();
  const { drawingPoints, drawingMode: wallDrawingMode, setIsDrawing: setIsDrawingWall } = useWallStore();
  const terrainSettings = useTerrainStore(s => s.brushSettings);
  const setIsPainting = useTerrainStore(s => s.setIsPainting);

  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const isPaintingRef = useRef(false);
  const isMiddlePanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const [dragStartCoord, setDragStartCoord] = useState<{ x: number, y: number } | null>(null);
  const [currentCoord, setCurrentCoord] = useState<{ x: number, y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);

  // Touch Support
  const lastDist = useRef(0);
  const lastCenter = useRef<{x: number, y: number} | null>(null);

  const ghostMap = useMemo(() => (!ghostFloorId ? null : maps.find(m => m.id === ghostFloorId)), [maps, ghostFloorId]);

  useEffect(() => { if (stageRef.current) setStageRef(stageRef); }, [setStageRef]);

  const centerCanvas = useCallback(() => {
    if (dimensions.width > 1) {
      const padding = 50;
      const sX = (dimensions.width - padding * 2) / metadata.resolution.width;
      const sY = (dimensions.height - padding * 2) / metadata.resolution.height;
      const newScale = Math.min(sX, sY, 1);
      setViewportZoom(newScale);
      setViewportPosition({ 
        x: (dimensions.width - metadata.resolution.width * newScale) / 2, 
        y: (dimensions.height - metadata.resolution.height * newScale) / 2 
      });
    }
  }, [dimensions, metadata.resolution, setViewportZoom, setViewportPosition]);

  useEffect(() => { centerCanvas(); }, [requestCenter, centerCanvas]);
  
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const getGridCoord = useCallback((px: number, py: number) => {
    const grid = useMapStore.getState().grid;
    const clampedPx = Math.max(0, Math.min(px, metadata.resolution.width - 1));
    const clampedPy = Math.max(0, Math.min(py, metadata.resolution.height - 1));
    if (grid.type === 'square') return { x: Math.floor(clampedPx / grid.size), y: Math.floor(clampedPy / grid.size) };
    const axial = pixelToAxial(clampedPx, clampedPy, grid.size, grid.type === 'hex-pointy' ? 'pointy' : 'flat');
    return { x: axial.q, y: axial.r };
  }, [metadata.resolution]);

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current; if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition() || { x: 0, y: 0 };
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const newScale = Math.max(e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1, 0.01);
    setViewportZoom(newScale);
    setViewportPosition({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
  }, [setViewportZoom, setViewportPosition]);

  const handleSelect = useCallback((id: string, append: boolean) => {
      const asset = assets.find(a => a.id === id);
      const isLight = lighting.pointLights.some(l => l.id === id);

      if (activeTool === 'text' && asset?.type !== 'text') return;

      if (append) {
          const next = selectedAssetIds.includes(id) 
            ? selectedAssetIds.filter(i => i !== id) 
            : [...selectedAssetIds, id];
          setSelectedAssetIds(next);
      } else {
          if (!selectedAssetIds.includes(id)) {
              setSelectedAsset(id);
          }
      }
  }, [selectedAssetIds, setSelectedAsset, setSelectedAssetIds, activeTool, assets, lighting.pointLights]);

  const handleMouseDown = useCallback((e: any) => {
    const stage = stageRef.current; if (!stage) return;
    const pointer = stage.getRelativePointerPosition(); if (!pointer) return;
    
    // Hand tool or middle mouse
    if (e.evt.button === 1 || (activeTool === 'hand' && e.evt.button === 0)) { 
        isMiddlePanning.current = true; 
        lastMousePos.current = { x: e.evt.clientX || e.evt.touches?.[0]?.clientX, y: e.evt.clientY || e.evt.touches?.[0]?.clientY }; 
        stage.container().style.cursor = 'grabbing'; 
        return; 
    }

    pointer.x = Math.max(0, Math.min(pointer.x, metadata.resolution.width - 1));
    pointer.y = Math.max(0, Math.min(pointer.y, metadata.resolution.height - 1));

    const coord = getGridCoord(pointer.x, pointer.y);
    
    const isAreaSelectTool = (activeTool === 'select' || activeTool === 'text') && selectionMode === 'area';
    if (isAreaSelectTool && (e.target === stage || e.target.id() === 'map-background')) {
        setSelectionRect({ x1: pointer.x, y1: pointer.y, x2: pointer.x, y2: pointer.y });
        return;
    }

    if (activeTool === 'wall' && (e.evt.button === 0 || e.evt.touches)) {
      const { layers, tilesets } = useMapStore.getState();
      const wallLayer = layers.find(l => l.type === 'wall');
      if (wallLayer?.locked) { useNotificationStore.getState().showToast("Walls Locked", "Unlock the 'Walls' layer in the tree to edit.", "warn"); return; }
      const { isEraser, activeTilesetId } = useWallStore.getState();
      if (isEraser || wallDrawingMode === 'line') { setDragStartCoord(coord); setCurrentCoord(coord); }
      else { useWallStore.getState().setIsDrawing(true); const ts = tilesets.find(t => t.id === activeTilesetId) || tilesets.find(t => t.type === TileType.WALL); if (ts) useMapStore.getState().addTile({ x: coord.x, y: coord.y, tilesetId: ts.id, type: TileType.WALL }); }
      isPaintingRef.current = true;
    } else if (activeTool === 'terrain' && (e.evt.button === 0 || e.evt.touches)) {
      const { brushSettings, isEraser } = useTerrainStore.getState();
      if (isEraser || brushSettings.mode === 'area') { setDragStartCoord(coord); setCurrentCoord(coord); }
      else { setIsPainting(true); const ts = useMapStore.getState().tilesets.find(t => t.id === brushSettings.tilingSetId) || useMapStore.getState().tilesets.find(t => t.type === TileType.GROUND); if (ts) useMapStore.getState().addTile({ x: coord.x, y: coord.y, tilesetId: ts.id, type: TileType.GROUND }); }
      isPaintingRef.current = true;
    } else if (activeTool === 'room' && (e.evt.button === 0 || e.evt.touches)) {
      const { mode, selectedWallId, selectedTerrainId, fillEnabled } = useRoomStore.getState();
      if (mode === 'add') {
          const needsWall = !selectedWallId; const needsTerrain = fillEnabled && !selectedTerrainId;
          if (needsWall || needsTerrain) { useNotificationStore.getState().showToast("Selection Required", "Select Style from the sidebar before drawing.", "warn"); return; }
      }
      setIsDrawingRoom(true); setRoomStartPoint(pointer); setRoomCurrentPoint(pointer); 
    }
    else if ((e.target === stage || e.target.id() === 'map-background') && (e.evt.button === 0 || e.evt.touches)) { 
        if (activeTool === 'select' || activeTool === 'stamp' || activeTool === 'text') {
            setSelectedAssetIds([]); 
        }
    }
  }, [activeTool, selectionMode, wallDrawingMode, metadata.resolution, getGridCoord, setSelectedAssetIds, setIsDrawingRoom, setRoomCurrentPoint, setRoomStartPoint, setIsPainting]);

  const handleMouseMove = useCallback((e: any) => {
    if (isMiddlePanning.current) { 
        const clientX = e.evt.clientX || e.evt.touches?.[0]?.clientX;
        const clientY = e.evt.clientY || e.evt.touches?.[0]?.clientY;
        const dx = clientX - lastMousePos.current.x; 
        const dy = clientY - lastMousePos.current.y; 
        setViewportPosition({ x: viewportPosition.x + dx, y: viewportPosition.y + dy });
        lastMousePos.current = { x: clientX, y: clientY }; 
        return; 
    }
    const stage = stageRef.current; if (!stage) return;
    const pointer = stage.getRelativePointerPosition(); if (!pointer) return;
    pointer.x = Math.max(0, Math.min(pointer.x, metadata.resolution.width - 1));
    pointer.y = Math.max(0, Math.min(pointer.y, metadata.resolution.height - 1));

    if (selectionRect) { setSelectionRect(prev => ({ ...prev!, x2: pointer.x, y2: pointer.y })); return; }

    const coord = getGridCoord(pointer.x, pointer.y);
    if (activeTool === 'wall' && isPaintingRef.current) {
      const { layers, tilesets } = useMapStore.getState();
      const wallLayer = layers.find(l => l.type === 'wall'); if (wallLayer?.locked) return;
      const { isEraser, activeTilesetId } = useWallStore.getState();
      if (wallDrawingMode === 'line') setCurrentCoord(coord);
      else if (isEraser) useMapStore.getState().removeTile(coord.x, coord.y, TileType.WALL);
      else { const ts = tilesets.find(t => t.id === activeTilesetId) || tilesets.find(t => t.type === TileType.WALL); if (ts) useMapStore.getState().addTile({ x: coord.x, y: coord.y, tilesetId: ts.id, type: TileType.WALL }); }
    } else if (activeTool === 'terrain' && isPaintingRef.current) {
      const { brushSettings, isEraser } = useTerrainStore.getState();
      if (brushSettings.mode === 'area') setCurrentCoord(coord);
      else if (isEraser) useMapStore.getState().removeTile(coord.x, coord.y, TileType.GROUND);
      else { const ts = useMapStore.getState().tilesets.find(t => t.id === brushSettings.tilingSetId) || useMapStore.getState().tilesets.find(t => t.type === TileType.GROUND); if (ts) useMapStore.getState().addTile({ x: coord.x, y: coord.y, tilesetId: ts.id, type: TileType.GROUND }); }
    } else if (isDrawingRoom) setRoomCurrentPoint(pointer);
  }, [selectionRect, activeTool, wallDrawingMode, metadata.resolution, isDrawingRoom, getGridCoord, setRoomCurrentPoint, setViewportPosition, viewportPosition]);

  const handleMouseUp = useCallback((e: any) => {
    isMiddlePanning.current = false; 
    if (stageRef.current) stageRef.current.container().style.cursor = activeTool === 'hand' ? 'grab' : 'default'; 
    
    if (selectionRect) {
        const x1 = Math.min(selectionRect.x1, selectionRect.x2);
        const y1 = Math.min(selectionRect.y1, selectionRect.y2);
        const x2 = Math.max(selectionRect.x1, selectionRect.x2);
        const y2 = Math.max(selectionRect.y1, selectionRect.y2);
        
        const selected = [
            ...assets.filter(a => a.x >= x1 && a.x <= x2 && a.y >= y1 && a.y <= y2),
            ...lighting.pointLights.filter(l => l.x >= x1 && l.x <= x2 && l.y >= y1 && l.y <= y2)
        ].map(o => o.id);
        
        setSelectedAssetIds(selected);
        setSelectionRect(null);
        return;
    }

    if (activeTool === 'wall' && isPaintingRef.current) {
      const { isEraser, activeTilesetId } = useWallStore.getState();
      if ((isEraser || wallDrawingMode === 'line') && dragStartCoord && currentCoord) {
        const areaPoints: { x: number, y: number }[] = [];
        if (wallDrawingMode === 'line' && !isEraser) areaPoints.push(...getLinePoints(dragStartCoord.x, dragStartCoord.y, currentCoord.x, currentCoord.y));
        else { for (let x = Math.min(dragStartCoord.x, currentCoord.x); x <= Math.max(dragStartCoord.x, currentCoord.x); x++) for (let y = Math.min(dragStartCoord.y, currentCoord.y); y <= Math.max(dragStartCoord.y, currentCoord.y); y++) areaPoints.push({ x, y }); }
        if (isEraser) useMapStore.getState().removeTiles(areaPoints, TileType.WALL);
        else { const ts = useMapStore.getState().tilesets.find(t => t.id === activeTilesetId) || useMapStore.getState().tilesets.find(t => t.type === TileType.WALL); if (ts) useMapStore.getState().addTiles(areaPoints.map(p => ({ ...p, tilesetId: ts.id, type: TileType.WALL }))); }
      }
      useWallStore.getState().setIsDrawing(false); isPaintingRef.current = false; setDragStartCoord(null); setCurrentCoord(null);
    } else if (activeTool === 'terrain' && isPaintingRef.current) {
      const { brushSettings, isEraser } = useTerrainStore.getState();
      if ((brushSettings.mode === 'area' || isEraser) && dragStartCoord && currentCoord) {
        const areaPoints: { x: number, y: number }[] = [];
        for (let x = Math.min(dragStartCoord.x, currentCoord.x); x <= Math.max(dragStartCoord.x, currentCoord.x); x++) for (let y = Math.min(dragStartCoord.y, currentCoord.y); y <= Math.max(dragStartCoord.y, currentCoord.y); y++) areaPoints.push({ x, y });
        if (isEraser) useMapStore.getState().removeTiles(areaPoints, TileType.GROUND);
        else { const ts = useMapStore.getState().tilesets.find(t => t.id === brushSettings.tilingSetId) || useMapStore.getState().tilesets.find(t => t.type === TileType.GROUND); if (ts) useMapStore.getState().addTiles(areaPoints.map(p => ({ ...p, tilesetId: ts.id, type: TileType.GROUND }))); }
      }
      setIsPainting(false); isPaintingRef.current = false; setDragStartCoord(null); setCurrentCoord(null);
    } else if (isDrawingRoom && roomStartPoint && roomCurrentPoint) {
      const { grid, layers, tiles, metadata } = useMapStore.getState();
      const { mode, fillEnabled, selectedWallId, selectedTerrainId } = useRoomStore.getState();
      const tx1 = Math.floor(Math.min(roomStartPoint.x, roomCurrentPoint.x) / grid.size);
      const ty1 = Math.floor(Math.min(roomStartPoint.y, roomCurrentPoint.y) / grid.size);
      const tx2 = Math.floor(Math.max(roomStartPoint.x, roomCurrentPoint.x) / grid.size);
      const ty2 = Math.floor(Math.max(roomStartPoint.y, roomCurrentPoint.y) / grid.size);
      const limitX = Math.floor(metadata.resolution.width / grid.size);
      const limitY = Math.floor(metadata.resolution.height / grid.size);
      const terrainLayer = layers.find(l => l.type === 'terrain');
      const wallLayer = layers.find(l => l.type === 'wall');

      if (mode === 'add') {
          const toAdd: any[] = []; const toRemove: any[] = [];
          if (fillEnabled && selectedTerrainId && terrainLayer) {
              for (let x = tx1 + 1; x <= tx2 - 1; x++) for (let y = ty1 + 1; y <= ty2 - 1; y++) if (x >= 0 && x < limitX && y >= 0 && y < limitY) { toAdd.push({ x, y, tilesetId: selectedTerrainId, type: TileType.GROUND, layerId: terrainLayer.id }); toRemove.push({ x, y, type: TileType.WALL, layerId: wallLayer?.id }); }
          }
          if (selectedWallId && wallLayer) {
              const perimeter: {x: number, y: number}[] = [];
              for (let x = tx1; x <= tx2; x++) { perimeter.push({ x, y: ty1 }); perimeter.push({ x, y: ty2 }); }
              for (let y = ty1 + 1; y <= ty2 - 1; y++) { perimeter.push({ x: tx1, y }); perimeter.push({ x: tx2, y }); }
              for (const p of perimeter) {
                  if (p.x < 0 || p.x >= limitX || p.y < 0 || p.y >= limitY) continue;
                  const hasSameFloor = tiles.some(t => t.x === p.x && t.y === p.y && t.type === TileType.GROUND && t.tilesetId === selectedTerrainId) || toAdd.some(t => t.x === p.x && t.y === p.y && t.type === TileType.GROUND);
                  if (!hasSameFloor) toAdd.push({ x: p.x, y: p.y, tilesetId: selectedWallId, type: TileType.WALL, layerId: wallLayer.id });
                  else toRemove.push({ x: p.x, y: p.y, type: TileType.WALL, layerId: wallLayer.id });
              }
          }
          if (toAdd.length > 0 || toRemove.length > 0) useMapStore.getState().bulkUpdateTiles(toAdd, toRemove);
      } else { 
          const areaCoords: { x: number, y: number }[] = [];
          for (let x = tx1; x <= tx2; x++) for (let y = ty1; y <= ty2; y++) if (x >= 0 && x < limitX && y >= 0 && y < limitY) areaCoords.push({ x, y });
          if (areaCoords.length > 0) {
              const toRemove: any[] = [];
              if (selectedTerrainId) areaCoords.forEach(p => toRemove.push({ ...p, type: TileType.GROUND }));
              if (selectedWallId) areaCoords.forEach(p => toRemove.push({ ...p, type: TileType.WALL }));
              if (!selectedTerrainId && !selectedWallId) areaCoords.forEach(p => { toRemove.push({ ...p, type: TileType.GROUND }); toRemove.push({ ...p, type: TileType.WALL }); });
              useMapStore.getState().bulkUpdateTiles([], toRemove);
          }
      }
      resetRoom();
    }
  }, [selectionRect, activeTool, wallDrawingMode, dragStartCoord, currentCoord, roomStartPoint, roomCurrentPoint, assets, lighting.pointLights, setSelectedAssetIds, resetRoom]);

  // Cleanup tool states when switching tools
  useEffect(() => {
    isPaintingRef.current = false;
    isMiddlePanning.current = false;
    setDragStartCoord(null);
    setCurrentCoord(null);
    setSelectionRect(null);
    
    // Reset store-based drawing states
    setIsPainting(false);
    setIsDrawingWall(false);
    resetRoom();
    
    if (stageRef.current) {
        stageRef.current.container().style.cursor = activeTool === 'hand' ? 'grab' : 'default';
    }
  }, [activeTool, setIsPainting, setIsDrawingWall, resetRoom]);

  // Touch Support Implementation
  const getDistance = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const getCenter = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
      return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  };

  const handleTouchStart = (e: any) => {
      const touches = e.evt.touches;
      if (touches.length === 1) {
          handleMouseDown(e);
      } else if (touches.length === 2) {
          isPaintingRef.current = false;
          setIsPainting(false);
          setIsDrawingRoom(false);
          
          const p1 = { x: touches[0].clientX, y: touches[0].clientY };
          const p2 = { x: touches[1].clientX, y: touches[1].clientY };
          lastDist.current = getDistance(p1, p2);
          lastCenter.current = getCenter(p1, p2);
      }
  };

  const handleTouchMove = (e: any) => {
      const touches = e.evt.touches;
      if (touches.length === 1) {
          // If Hand tool is active, single finger moves the map
          if (activeTool === 'hand') {
              e.evt.preventDefault();
              const clientX = touches[0].clientX;
              const clientY = touches[0].clientY;
              
              if (lastCenter.current) {
                  const dx = clientX - lastCenter.current.x;
                  const dy = clientY - lastCenter.current.y;
                  setViewportPosition({ 
                      x: viewportPosition.x + dx, 
                      y: viewportPosition.y + dy 
                  });
              }
              lastCenter.current = { x: clientX, y: clientY };
          } else {
              handleMouseMove(e);
          }
      } else if (touches.length === 2 && stageRef.current) {
          e.evt.preventDefault();
          const p1 = { x: touches[0].clientX, y: touches[0].clientY };
          const p2 = { x: touches[1].clientX, y: touches[1].clientY };
          
          const dist = getDistance(p1, p2);
          const center = getCenter(p1, p2);
          
          if (!lastCenter.current) return;

          // Panning
          const dx = center.x - lastCenter.current.x;
          const dy = center.y - lastCenter.current.y;
          
          // Zooming
          const stage = stageRef.current;
          const oldScale = stage.scaleX();
          const scaleBy = dist / lastDist.current;
          const newScale = Math.max(0.01, oldScale * scaleBy);
          
          const pointer = stage.getPointerPosition() || center;
          const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
          
          setViewportZoom(newScale);
          setViewportPosition({ 
              x: pointer.x - mousePointTo.x * newScale + dx, 
              y: pointer.y - mousePointTo.y * newScale + dy 
          });
          
          lastDist.current = dist;
          lastCenter.current = center;
      }
  };

  const handleTouchEnd = (e: any) => {
      // 1. If we have an active stamp (from touchstart in catalog), place it
      const activeStamp = useEditorStore.getState().activeStamp;
      if (activeStamp && lastCenter.current) {
          const stage = stageRef.current;
          if (stage) {
              const clientX = lastCenter.current.x;
              const clientY = lastCenter.current.y;
              
              handleDrop({ 
                  preventDefault: () => {}, 
                  stopPropagation: () => {},
                  clientX, 
                  clientY,
                  dataTransfer: { getData: () => null }
              } as any);
          }
      }

      lastDist.current = 0;
      lastCenter.current = null;
      handleMouseUp({ evt: { button: 0 } });
  };

  const handleAssetDragMove = useCallback((id: string, e: any) => {
    const node = e.target;
    const assets = useMapStore.getState().assets;
    const lighting = useMapStore.getState().lighting;
    const selectedAssetIds = useMapStore.getState().selectedAssetIds;
    
    const originalAsset = assets.find(a => a.id === id) || (lighting.pointLights.find(l => l.id === id) as any);
    if (!originalAsset) return;

    const dx = node.x() - originalAsset.x;
    const dy = node.y() - originalAsset.y;

    if (selectedAssetIds.length > 1) {
        const anyLocked = selectedAssetIds.some(sid => assets.find(a => a.id === sid)?.locked || lighting.pointLights.find(l => l.id === sid)?.locked);
        if (anyLocked) {
            node.x(originalAsset.x);
            node.y(originalAsset.y);
            useNotificationStore.getState().showToast("Selection Locked", "One or more selected objects are locked.", "warn");
            return;
        }
        
        moveObjects(selectedAssetIds, dx, dy);
    } else {
        const isLight = lighting.pointLights.some(l => l.id === id);
        const grid = useMapStore.getState().grid;
        let x = node.x(), y = node.y(); 
        
        const shouldSnap = !isLight && (originalAsset.snapToGrid !== undefined ? originalAsset.snapToGrid : grid.snapToGrid);
        
        if (shouldSnap) { if (grid.type === 'square') { x = Math.round(x / grid.size) * grid.size; y = Math.round(y / grid.size) * grid.size; } else { const axial = pixelToAxial(x, y, grid.size, grid.type === 'hex-pointy' ? 'pointy' : 'flat'); const sn = axialToPixel(axial.q, axial.r, grid.size, grid.type === 'hex-pointy' ? 'pointy' : 'flat'); x = sn.x; y = sn.y; } }
        x = Math.max(0, Math.min(x, metadata.resolution.width - 1)); y = Math.max(0, Math.min(y, metadata.resolution.height - 1)); 
        node.x(x); node.y(y);
    }
  }, [metadata.resolution, moveObjects]);

  const handleAssetDragEnd = useCallback((id: string, e: any) => {
      const selectedAssetIds = useMapStore.getState().selectedAssetIds;
      if (selectedAssetIds.length <= 1) {
          const isLight = useMapStore.getState().lighting.pointLights.some(l => l.id === id);
          if (isLight) useMapStore.getState().updatePointLight(id, { x: e.target.x(), y: e.target.y() });
          else useMapStore.getState().updateAsset(id, { x: e.target.x(), y: e.target.y() });
      }
  }, []);

  const handleAssetTransformEnd = useCallback((id: string, e: any) => {
    const node = e.target; 
    const assets = useMapStore.getState().assets; 
    const existingAsset = assets.find(a => a.id === id);
    if (!existingAsset) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Base updates for all assets
    const updates: any = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation()
    };

    if (existingAsset.type === 'text') {
        const currentFontSize = existingAsset.properties?.fontSize || 24;
        const absScaleX = Math.abs(scaleX);
        const absScaleY = Math.abs(scaleY);
        const newFontSize = Math.round(currentFontSize * absScaleY);
        const isUniform = Math.abs(absScaleX - absScaleY) < 0.05;

        if (isUniform) {
            updates.scale = 1;
            updates.scaleX = 1;
            updates.scaleY = 1;
            updates.properties = {
                ...existingAsset.properties,
                fontSize: newFontSize,
                flipX: scaleX < 0,
                flipY: scaleY < 0
            };
            node.scaleX(scaleX < 0 ? -1 : 1);
            node.scaleY(scaleY < 0 ? -1 : 1);
        } else {
            const remainingScaleX = absScaleX / absScaleY;
            updates.scaleX = remainingScaleX;
            updates.scaleY = 1;
            updates.properties = {
                ...existingAsset.properties,
                fontSize: newFontSize,
                flipX: scaleX < 0,
                flipY: scaleY < 0
            };
            node.scaleX(scaleX < 0 ? -remainingScaleX : remainingScaleX);
            node.scaleY(scaleY < 0 ? -1 : 1);
        }
    }
 else {
        updates.scaleX = Math.abs(scaleX);
        updates.scaleY = Math.abs(scaleY);
        updates.properties = {
            ...existingAsset.properties,
            flipX: scaleX < 0,
            flipY: scaleY < 0
        };
    }

    useMapStore.getState().updateAsset(id, updates);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const stage = stageRef.current;
    if (!stage) return;

    // 1. Precise Coordinate Detection (Works for Mouse and Polyfilled Touch)
    const clientX = e.clientX || (e as any).changedTouches?.[0]?.clientX;
    const clientY = e.clientY || (e as any).changedTouches?.[0]?.clientY;

    if (clientX === undefined || clientY === undefined) return;

    const containerRect = stage.container().getBoundingClientRect();
    const xRaw = (clientX - containerRect.left - stage.x()) / stage.scaleX();
    const yRaw = (clientY - containerRect.top - stage.y()) / stage.scaleY();

    let x = Math.max(0, Math.min(xRaw, metadata.resolution.width - 1));
    let y = Math.max(0, Math.min(yRaw, metadata.resolution.height - 1));

    // 2. Data Recovery with Fallback
    let assetType = e.dataTransfer?.getData('assetType');
    let customAssetId = e.dataTransfer?.getData('customAssetId');

    if (!assetType) {
        const activeStamp = useEditorStore.getState().activeStamp;
        if (activeStamp) {
            assetType = activeStamp.type;
            customAssetId = activeStamp.customAssetId || '';
        }
    }

    if (!assetType) return;

    // 3. Layer Validation
    let targetLayerId = activeLayerId;
    const currentLayer = layers.find(l => l.id === targetLayerId);
    if (!currentLayer || (currentLayer.type !== 'object' && currentLayer.id !== 'stamp-layer')) {
        const fallbackLayer = layers.find(l => l.type === 'object' || l.id === 'stamp-layer');
        if (fallbackLayer) {
            targetLayerId = fallbackLayer.id;
            useMapStore.getState().setActiveLayer(fallbackLayer.id);
        } else {
            useNotificationStore.getState().showToast("No Object Layer", "Please select or create an Object layer.", "warn");
            return;
        }
    }

    // 4. Grid Snapping
    const grid = useMapStore.getState().grid;
    const isLight = assetType === 'light';
    if (grid.snapToGrid && !isLight) {
        if (grid.type === 'square') {
            x = Math.round(x / grid.size) * grid.size;
            y = Math.round(y / grid.size) * grid.size;
        } else {
            const axial = pixelToAxial(x, y, grid.size, grid.type === 'hex-pointy' ? 'pointy' : 'flat');
            const sn = axialToPixel(axial.q, axial.r, grid.size, grid.type === 'hex-pointy' ? 'pointy' : 'flat');
            x = sn.x; y = sn.y;
        }
    }

    // 5. Add to Store
    if (isLight) {
        useMapStore.getState().addPointLight({
            id: crypto.randomUUID(), layerId: targetLayerId!, x, y,
            color: '#ffffff', radius: 300, intensity: 1, visible: true, locked: false
        });
    } else {
        const name = customAssetId ? (useAssetStore.getState().customAssets.find(a => a.id === customAssetId)?.name || assetType) : assetType;
        useMapStore.getState().addAsset({
            id: crypto.randomUUID(), layerId: targetLayerId!, type: assetType as any, name,
            customAssetId: customAssetId || undefined, x, y, rotation: 0, scale: 1,
            visible: true, locked: false, snapToGrid: true,
            properties: { 
                opacity: 1, 
                flipX: false, 
                flipY: false, 
                shadow: { 
                    enabled: true, 
                    opacity: 0.6, 
                    blur: 15, 
                    x: 30, 
                    y: 0 
                } 
            }
        });
    }

    // Cleanup
    setTimeout(() => useEditorStore.getState().setActiveStamp(null), 50);
  }, [metadata.resolution, layers, activeLayerId]);

  // Use native listeners to bypass React synthetic event issues with touch polyfills
  useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const onDragOver = (e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      };

      // Global touch handler to catch drops that started outside the canvas
      const onGlobalTouchEnd = (e: TouchEvent) => {
          const activeStamp = useEditorStore.getState().activeStamp;
          if (!activeStamp) return;

          const touch = e.changedTouches[0];
          const clientX = touch.clientX;
          const clientY = touch.clientY;

          const rect = container.getBoundingClientRect();
          // Check if the touch ended inside the canvas bounds
          if (
              clientX >= rect.left && 
              clientX <= rect.right && 
              clientY >= rect.top && 
              clientY <= rect.bottom
          ) {
              handleDrop({
                  preventDefault: () => {},
                  stopPropagation: () => {},
                  clientX,
                  clientY,
                  dataTransfer: { getData: () => null }
              } as any);
          } else {
              // If dropped outside, still clear the stamp to avoid accidental placements
              useEditorStore.getState().setActiveStamp(null);
          }
      };

      container.addEventListener('dragover', onDragOver);
      container.addEventListener('drop', handleDrop);
      window.addEventListener('touchend', onGlobalTouchEnd, { passive: false });

      return () => {
          container.removeEventListener('dragover', onDragOver);
          container.removeEventListener('drop', handleDrop);
          window.removeEventListener('touchend', onGlobalTouchEnd);
      };
  }, [handleDrop]);

  const renderLayer = (layer: MapLayer) => {
    const layerAssets = assets.filter(a => a.layerId === layer.id);
    const layerLights = lighting.pointLights.filter(l => l.layerId === layer.id);
    const sortedObjects = [...layerAssets, ...layerLights].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const isSelectOrStamp = activeTool === 'select' || activeTool === 'stamp';

    return (
        <Layer key={layer.id} visible={layer.visible} opacity={layer.opacity}>
          {layer.id === 'background-layer' && <Rect id="map-background" x={0} y={0} width={metadata.resolution.width} height={metadata.resolution.height} fill={metadata.backgroundColor || '#ffffff'} perfectDrawEnabled={false} />}
          {layer.type === 'terrain' && <TilingRenderer layerId={layer.id} type={TileType.GROUND} />}
          {layer.type === 'wall' && <TilingRenderer layerId={layer.id} type={TileType.WALL} />}
          {sortedObjects.map(obj => {
              const isSelected = selectedAssetIds.includes(obj.id);
              let canInteractWithThis = false;
              if (isSelectOrStamp) canInteractWithThis = true;
              else if (activeTool === 'text') canInteractWithThis = ('type' in obj && obj.type === 'text');

              if ('radius' in obj) {
                  const l = obj as IPointLight;
                  return (
                    <Group key={l.id} visible={l.visible}>
                        <PointLight {...l} />
                        <LightInteractionPoint light={l} isSelected={isSelected} scale={viewportZoom} onSelect={handleSelect} onDragMove={handleAssetDragMove} onDragEnd={handleAssetDragEnd} canInteract={canInteractWithThis} />
                    </Group>
                  );
              } else {
                  const asset = obj as Asset;
                  return <AssetRenderer key={asset.id} asset={asset} isSelected={isSelected} onSelect={handleSelect} onDragMove={handleAssetDragMove} onDragEnd={handleAssetDragEnd} onTransformEnd={handleAssetTransformEnd} multiSelect={selectedAssetIds.length > 1} canInteract={canInteractWithThis} />;
              }
          })}
        </Layer>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: editorBgColor, touchAction: 'none' }} onContextMenu={e => e.preventDefault()}>
      <Stage 
        ref={stageRef} width={dimensions.width} height={dimensions.height} scaleX={viewportZoom} scaleY={viewportZoom} x={viewportPosition.x} y={viewportPosition.y} 
        draggable={false} onWheel={handleWheel} 
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} 
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        onContextMenu={e => e.evt.preventDefault()}
        onMouseEnter={() => { if (activeTool === 'hand' && stageRef.current) stageRef.current.container().style.cursor = 'grab'; }}
        onMouseLeave={() => { if (stageRef.current) stageRef.current.container().style.cursor = 'default'; }}
        className="touch-none"
      >
        {ghostMap && <Layer id="ghost-layer"><GhostFloorRenderer map={ghostMap} opacity={ghostFloorOpacity} /></Layer>}
        {layers.map(renderLayer)}
        <GridOverlay />
        <Layer>
          {drawingPoints.length >= 2 && <Line points={drawingPoints} stroke="#ef4444" strokeWidth={3/viewportZoom} lineDash={[5, 5]} lineCap="round" perfectDrawEnabled={false} />}
          {dragStartCoord && currentCoord && (
            <Group>
              {activeTool === 'wall' && wallDrawingMode === 'line' && <Line points={[dragStartCoord.x * useMapStore.getState().grid.size + useMapStore.getState().grid.size/2, dragStartCoord.y * useMapStore.getState().grid.size + useMapStore.getState().grid.size/2, currentCoord.x * useMapStore.getState().grid.size + useMapStore.getState().grid.size/2, currentCoord.y * useMapStore.getState().grid.size + useMapStore.getState().grid.size/2]} stroke="#ef4444" strokeWidth={2/viewportZoom} dash={[5, 5]} />}
              {activeTool === 'terrain' && terrainSettings.mode === 'area' && <Rect x={Math.min(dragStartCoord.x, currentCoord.x) * useMapStore.getState().grid.size} y={Math.min(dragStartCoord.y, currentCoord.y) * useMapStore.getState().grid.size} width={(Math.abs(currentCoord.x - dragStartCoord.x) + 1) * useMapStore.getState().grid.size} height={(Math.abs(currentCoord.y - dragStartCoord.y) + 1) * useMapStore.getState().grid.size} stroke="#f97316" strokeWidth={2/viewportZoom} dash={[5, 5]} fill="rgba(249, 115, 22, 0.1)" />}
            </Group>
          )}
          {selectionRect && (
              <Rect x={Math.min(selectionRect.x1, selectionRect.x2)} y={Math.min(selectionRect.y1, selectionRect.y2)} width={Math.abs(selectionRect.x2 - selectionRect.x1)} height={Math.abs(selectionRect.y2 - selectionRect.y1)} stroke="#3b82f6" strokeWidth={1/viewportZoom} dash={[4, 2]} fill="rgba(59, 130, 246, 0.1)" />
          )}
          {activeTool === 'room' && isDrawingRoom && roomStartPoint && roomCurrentPoint && (
              <Rect x={Math.min(roomStartPoint.x, roomCurrentPoint.x)} y={Math.min(roomStartPoint.y, roomCurrentPoint.y)} width={Math.abs(roomCurrentPoint.x - roomStartPoint.x)} height={Math.abs(roomCurrentPoint.y - roomStartPoint.y)} stroke={useRoomStore.getState().mode === 'erase' ? "#ef4444" : "#f97316"} dash={[5, 5]} fill={useRoomStore.getState().mode === 'erase' ? "rgba(239, 68, 68, 0.1)" : "rgba(249, 115, 22, 0.1)"} perfectDrawEnabled={false} />
          )}
        </Layer>
        <Layer listening={false}>{lighting.global.enabled && <GlobalOverlay {...lighting.global} />}<AtmosphereOverlay /></Layer>
      </Stage>
    </div>
  );
};

export const Canvas = React.memo(InternalCanvas);
