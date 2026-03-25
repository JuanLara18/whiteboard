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
  const stageRef = useRef(null as any);
  const containerRef = useRef(null as any);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([] as number[]);

  const {
    selectedElements,
    setSelectedElements,
    clearSelection,
    currentTool,
    addElement,
    penColor,
    penWidth,
    smoothing,
    simplify,
    setZoom,
    zoomLevel,
  } = useBoardStore();

  // Resize observer — keep stage filling its container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setStageSize({ width: Math.max(0, rect.width), height: Math.max(0, rect.height) });
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

  // Keep local scale in sync with store zoom (e.g. toolbar buttons)
  useEffect(() => {
    setScale(zoomLevel);
  }, [zoomLevel]);

  // Register PNG export so Toolbar can trigger it
  useEffect(() => {
    registerExportPNG(() => {
      const stage = stageRef.current;
      if (!stage) return;
      const dataURL = stage.toDataURL({ pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `${board.name.replace(/[^a-z0-9]/gi, '_')}.png`;
      a.click();
    });
  }, [board.name]);

  // Wheel zoom — zoom toward pointer
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
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
        id: `sticky_${Date.now()}`,
        type: 'sticky-note',
        content: 'New Note',
        position: {
          x: (pointer.x - position.x) / scale,
          y: (pointer.y - position.y) / scale,
        },
        size: { width: 200, height: 150 },
        color: noteColors[Math.floor(Math.random() * noteColors.length)],
        zIndex: Date.now(),
      };
      addElement(board.id, newNote);
    } else {
      clearSelection();
    }
  }, [currentTool, position, scale, board.id, addElement, clearSelection]);

  // Drawing helpers
  const toCanvasPoint = (pos: { x: number; y: number }) => ({
    x: (pos.x - position.x) / scale,
    y: (pos.y - position.y) / scale,
  });

  const handleMouseDown = useCallback(() => {
    if (currentTool !== 'pen') return;
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;
    const p = toCanvasPoint(pointer);
    setIsDrawing(true);
    setCurrentPoints([p.x, p.y]);
  }, [currentTool, position, scale]);

  const handleMouseMove = useCallback(() => {
    if (!isDrawing || currentTool !== 'pen') return;
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;
    const p = toCanvasPoint(pointer);
    setCurrentPoints((prev: number[]) => [...prev, p.x, p.y]);
  }, [isDrawing, currentTool, position, scale]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || currentTool !== 'pen') return;
    setIsDrawing(false);
    if (currentPoints.length < 4) {
      setCurrentPoints([]);
      return;
    }
    const smoothed = smoothing > 1 ? smoothMovingAverage(currentPoints, smoothing) : currentPoints;
    const finalPoints = simplify
      ? simplifyRDP(smoothed, Math.max(1, Math.round(penWidth)))
      : smoothed;

    const newDrawing: BoardElement = {
      id: `draw_${Date.now()}`,
      type: 'drawing',
      tool: 'pen',
      points: finalPoints,
      strokeWidth: penWidth,
      stroke: penColor,
      zIndex: Date.now(),
    } as any;
    addElement(board.id, newDrawing);
    setCurrentPoints([]);
  }, [isDrawing, currentTool, currentPoints, addElement, board.id, penColor, penWidth, smoothing, simplify]);

  const stickyNotes = board.elements.filter(el => el.type === 'sticky-note') as any[];
  const drawings = board.elements.filter(el => el.type === 'drawing') as any[];

  const canvasContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: designSystem.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    ...getCanvasBackgroundStyle(board.template),
    cursor: currentTool === 'pen' ? 'crosshair' : currentTool === 'pan' ? 'grab' : 'default',
  };

  return (
    <div ref={containerRef} style={canvasContainerStyle} className="canvas-container">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
        draggable={(currentTool === 'select' || currentTool === 'pan') && !isDrawing}
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
            width={stageSize.width / scale}
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
                onSelect={() => {
                  setSelectedElements(selectedElements.includes(note.id) ? [] : [note.id]);
                }}
              />
            </Fragment>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
