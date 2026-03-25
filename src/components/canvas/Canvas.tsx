// src/components/canvas/Canvas.tsx
import { useRef, useState, useEffect, useCallback, Fragment } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { useBoardStore, Board, BoardElement } from '../../store/boardStore';
import { StickyNote } from '../notes/StickyNote';
import { designSystem } from '../../styles/design-system';
import { CanvasBackground, getCanvasBackgroundStyle } from './CanvasBackground';
import { simplifyRDP, smoothMovingAverage } from '../../utils/path';
import { registerExportPNG } from '../../utils/exportUtils';

interface CanvasProps {
  board: Board;
}

export const Canvas = ({ board }: CanvasProps) => {
  const stageRef     = useRef(null as any);
  const containerRef = useRef(null as any);

  const [scale,     setScale]     = useState(1);
  const [position,  setPosition]  = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([] as number[]);

  // ── Temporary pan via Spacebar ──────────────────────────────────────────────
  const [isSpaceDown, setIsSpaceDown] = useState(false);

  // ── Middle-mouse pan ────────────────────────────────────────────────────────
  const [isMidPanning, setIsMidPanning] = useState(false);
  const midPanOrigin = useRef({ mouseX: 0, mouseY: 0, stageX: 0, stageY: 0 });

  const {
    selectedElements, setSelectedElements, clearSelection,
    currentTool,
    addElement,
    penColor, penWidth, smoothing, simplify,
    setZoom, zoomLevel,
  } = useBoardStore();

  // ── Resize observer ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setStageSize({ width: Math.max(0, r.width), height: Math.max(0, r.height) });
    };
    update();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Keep local scale synced when toolbar changes zoom level
  useEffect(() => { setScale(zoomLevel); }, [zoomLevel]);

  // ── Register PNG export callback ────────────────────────────────────────────
  useEffect(() => {
    registerExportPNG(() => {
      const stage = stageRef.current;
      if (!stage) return;
      const url = stage.toDataURL({ pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${board.name.replace(/[^a-z0-9]/gi, '_')}.png`;
      a.click();
    });
  }, [board.name]);

  // ── Spacebar global listeners ───────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      setIsSpaceDown(true);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpaceDown(false);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
    };
  }, []);

  // ── Wheel zoom ──────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const oldScale = scale;
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };
    const newZoom = Math.max(0.1, Math.min(5, e.evt.deltaY < 0 ? zoomLevel * 1.1 : zoomLevel / 1.1));
    setZoom(newZoom);
    setScale(newZoom);
    setPosition({
      x: pointer.x - mousePointTo.x * newZoom,
      y: pointer.y - mousePointTo.y * newZoom,
    });
  }, [scale, position, zoomLevel, setZoom]);

  const handleStageDragEnd = useCallback((e: any) => {
    setPosition({ x: e.target.x(), y: e.target.y() });
  }, []);

  // ── Pointer helpers ─────────────────────────────────────────────────────────
  const toCanvasPoint = (pos: { x: number; y: number }) => ({
    x: (pos.x - position.x) / scale,
    y: (pos.y - position.y) / scale,
  });

  // ── Mouse / touch handlers ──────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: any) => {
    // Middle mouse button — start panning
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      const stage = stageRef.current;
      const pos   = stage?.position() ?? { x: 0, y: 0 };
      midPanOrigin.current = {
        mouseX: e.evt.clientX,
        mouseY: e.evt.clientY,
        stageX: pos.x,
        stageY: pos.y,
      };
      setIsMidPanning(true);
      return;
    }
    if (currentTool !== 'pen') return;
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;
    const p = toCanvasPoint(pointer);
    setIsDrawing(true);
    setCurrentPoints([p.x, p.y]);
  }, [currentTool, position, scale]);

  const handleMouseMove = useCallback((e: any) => {
    // Middle mouse pan
    if (isMidPanning) {
      const dx = e.evt.clientX - midPanOrigin.current.mouseX;
      const dy = e.evt.clientY - midPanOrigin.current.mouseY;
      const newX = midPanOrigin.current.stageX + dx;
      const newY = midPanOrigin.current.stageY + dy;
      setPosition({ x: newX, y: newY });
      stageRef.current?.position({ x: newX, y: newY });
      stageRef.current?.batchDraw();
      return;
    }
    if (!isDrawing || currentTool !== 'pen') return;
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;
    const p = toCanvasPoint(pointer);
    setCurrentPoints((prev: number[]) => [...prev, p.x, p.y]);
  }, [isMidPanning, isDrawing, currentTool, position, scale]);

  const handleMouseUp = useCallback((e: any) => {
    if (e?.evt?.button === 1 || isMidPanning) {
      setIsMidPanning(false);
      return;
    }
    if (!isDrawing || currentTool !== 'pen') return;
    setIsDrawing(false);
    if (currentPoints.length < 4) { setCurrentPoints([]); return; }
    const smoothed = smoothing > 1 ? smoothMovingAverage(currentPoints, smoothing) : currentPoints;
    const finalPoints = simplify ? simplifyRDP(smoothed, Math.max(1, Math.round(penWidth))) : smoothed;
    const newDrawing: BoardElement = {
      id:          `draw_${Date.now()}`,
      type:        'drawing',
      tool:        'pen',
      points:      finalPoints,
      strokeWidth: penWidth,
      stroke:      penColor,
      zIndex:      Date.now(),
    } as any;
    addElement(board.id, newDrawing);
    setCurrentPoints([]);
  }, [isMidPanning, isDrawing, currentTool, currentPoints, addElement, board.id, penColor, penWidth, smoothing, simplify]);

  // Safety: release mid-pan if mouse leaves document
  useEffect(() => {
    const onGlobalUp = (e: MouseEvent) => { if (e.button === 1) setIsMidPanning(false); };
    document.addEventListener('mouseup', onGlobalUp);
    return () => document.removeEventListener('mouseup', onGlobalUp);
  }, []);

  const handleStageClick = useCallback((e: any) => {
    if (e.target !== e.target.getStage()) return;
    if (currentTool === 'pen') return;
    if (currentTool === 'sticky-note') {
      const pointer = e.target.getStage().getPointerPosition();
      if (!pointer) return;
      const noteColors = [
        designSystem.colors.accent.yellow,
        designSystem.colors.accent.pink,
        designSystem.colors.accent.green,
        designSystem.colors.accent.blue,
      ];
      const newNote: BoardElement = {
        id:      `sticky_${Date.now()}`,
        type:    'sticky-note',
        content: 'New Note',
        position: {
          x: (pointer.x - position.x) / scale,
          y: (pointer.y - position.y) / scale,
        },
        size:    { width: 200, height: 150 },
        color:   noteColors[Math.floor(Math.random() * noteColors.length)],
        zIndex:  Date.now(),
      };
      addElement(board.id, newNote);
    } else {
      clearSelection();
    }
  }, [currentTool, position, scale, board.id, addElement, clearSelection]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const stickyNotes = board.elements.filter(el => el.type === 'sticky-note') as any[];
  const drawings    = board.elements.filter(el => el.type === 'drawing')     as any[];

  const isPanMode = currentTool === 'select' || currentTool === 'pan' || isSpaceDown;
  const cursor    = isMidPanning || (isSpaceDown && isPanMode)
    ? 'grabbing'
    : isSpaceDown
      ? 'grab'
      : currentTool === 'pen'
        ? 'crosshair'
        : currentTool === 'pan'
          ? 'grab'
          : 'default';

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      style={{
        width:    '100%',
        height:   '100%',
        overflow: 'hidden',
        position: 'relative',
        cursor,
        ...getCanvasBackgroundStyle(board.template),
      }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
        draggable={isPanMode && !isDrawing && !isMidPanning}
        onDragEnd={handleStageDragEnd}
        onClick={handleStageClick}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <Layer>
          <CanvasBackground
            template={board.template}
            width={stageSize.width  / scale}
            height={stageSize.height / scale}
          />
          {drawings.map((d) => (
            <Line
              key={d.id}
              points={d.points}
              stroke={d.stroke}
              strokeWidth={d.strokeWidth}
              tension={0.4}
              lineCap="round"
              lineJoin="round"
              bezier={false}
            />
          ))}
          {isDrawing && currentTool === 'pen' && currentPoints.length >= 2 && (
            <Line
              points={smoothing > 1 ? smoothMovingAverage(currentPoints, smoothing) : currentPoints}
              stroke={penColor}
              strokeWidth={penWidth}
              tension={0.4}
              lineCap="round"
              lineJoin="round"
              bezier={false}
            />
          )}
          {stickyNotes.map((note) => (
            <Fragment key={note.id}>
              <StickyNote
                note={note}
                isSelected={selectedElements.includes(note.id)}
                onSelect={() => setSelectedElements(selectedElements.includes(note.id) ? [] : [note.id])}
              />
            </Fragment>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
