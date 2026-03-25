// src/components/canvas/Canvas.tsx
import { useRef, useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { Stage, Layer, Line, Rect } from 'react-konva';
import { useBoardStore, Board, BoardElement, type ImageElement } from '../../store/boardStore';
import { StickyNote } from '../notes/StickyNote';
import { PlacedImage } from './PlacedImage';
import { getImageFileFromPasteEvent, prepareImageForBoard } from '../../utils/imageClipboard';
import { designSystem } from '../../styles/design-system';
import { CanvasBackground, getCanvasBackgroundStyle } from './CanvasBackground';
import { simplifyRDP, smoothMovingAverage } from '../../utils/path';
import { registerExportPNG } from '../../utils/exportUtils';

interface CanvasProps {
  board: Board;
}

// ── Intersection helpers for area-eraser ─────────────────────────────────────
const pointInRect = (px: number, py: number, rx: number, ry: number, rw: number, rh: number) => {
  const x0 = Math.min(rx, rx + rw), x1 = Math.max(rx, rx + rw);
  const y0 = Math.min(ry, ry + rh), y1 = Math.max(ry, ry + rh);
  return px >= x0 && px <= x1 && py >= y0 && py <= y1;
};

const strokeInRect = (points: number[], rx: number, ry: number, rw: number, rh: number) => {
  for (let i = 0; i < points.length - 1; i += 2) {
    if (pointInRect(points[i], points[i + 1], rx, ry, rw, rh)) return true;
  }
  return false;
};

const noteInRect = (
  nx: number, ny: number, nw: number, nh: number,
  rx: number, ry: number, rw: number, rh: number,
) => {
  const x0 = Math.min(rx, rx + rw), x1 = Math.max(rx, rx + rw);
  const y0 = Math.min(ry, ry + rh), y1 = Math.max(ry, ry + rh);
  return nx < x1 && nx + nw > x0 && ny < y1 && ny + nh > y0;
};

// ─────────────────────────────────────────────────────────────────────────────
export const Canvas = ({ board }: CanvasProps) => {
  const stageRef     = useRef(null as any);
  const containerRef = useRef(null as any);

  const [scale,     setScale]     = useState(1);
  const [position,  setPosition]  = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  // Freehand drawing
  const [isDrawing,     setIsDrawing]     = useState(false);
  const [currentPoints, setCurrentPoints] = useState([] as number[]);

  // Area eraser
  const [eraseRect,  setEraseRect]  = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const eraseStart = useRef({ x: 0, y: 0 });

  // Manual canvas pan (replaces Stage.draggable to prevent note-drag conflicts)
  const [isPanning,    setIsPanning]    = useState(false);
  const panStart = useRef({ mouseX: 0, mouseY: 0, stageX: 0, stageY: 0 });

  // Temporary pan: spacebar held down
  const [isSpaceDown,  setIsSpaceDown]  = useState(false);

  // Middle-mouse pan
  const [isMidPanning, setIsMidPanning] = useState(false);
  const midPanOrigin = useRef({ mouseX: 0, mouseY: 0, stageX: 0, stageY: 0 });

  const {
    selectedElements, setSelectedElements, clearSelection,
    currentTool,
    addElement, deleteElement, deleteElements,
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

  useEffect(() => { setScale(zoomLevel); }, [zoomLevel]);

  // Paste images from clipboard (Ctrl+V) — ignore inputs / sticky editor
  const pasteCtxRef = useRef({
    stageSize: { width: 0, height: 0 },
    position:  { x: 0, y: 0 },
    scale:     1,
    boardId:   board.id,
  });
  pasteCtxRef.current = { stageSize, position, scale, boardId: board.id };

  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, [contenteditable="true"]')) return;

      const file = getImageFileFromPasteEvent(e);
      if (!file) return;

      e.preventDefault();
      const prepared = await prepareImageForBoard(file);
      if (!prepared) return;

      const { stageSize: ss, position: pos, scale: sc, boardId } = pasteCtxRef.current;
      if (ss.width < 20 || ss.height < 20) return;

      const cx = (ss.width / 2 - pos.x) / sc - prepared.width / 2;
      const cy = (ss.height / 2 - pos.y) / sc - prepared.height / 2;

      const imgEl: ImageElement = {
        id:        `img_${Date.now()}`,
        type:      'image',
        src:       prepared.dataUrl,
        position:  { x: cx, y: cy },
        size:      { width: prepared.width, height: prepared.height },
        zIndex:    Date.now(),
      };
      useBoardStore.getState().addElement(boardId, imgEl);
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  // ── PNG export ──────────────────────────────────────────────────────────────
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

  // ── Spacebar (temporary pan) ─────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
      e.preventDefault();
      setIsSpaceDown(true);
    };
    const onUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpaceDown(false); };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  // ── Wheel: trackpad two-finger scroll → pan, pinch / scroll wheel → zoom ────
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    // Browsers set ctrlKey=true for pinch-to-zoom gestures on Mac and Windows
    // precision trackpads. Plain two-finger scroll leaves ctrlKey=false.
    if (!e.evt.ctrlKey) {
      // Trackpad two-finger scroll → pan
      const cur  = stage.position() as { x: number; y: number };
      const newX = cur.x - e.evt.deltaX;
      const newY = cur.y - e.evt.deltaY;
      setPosition({ x: newX, y: newY });
      stage.position({ x: newX, y: newY });
      stage.batchDraw();
      return;
    }

    // Pinch-to-zoom or Ctrl+scroll → zoom toward pointer
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
    };
    const newZoom = Math.max(0.1, Math.min(5, e.evt.deltaY < 0 ? zoomLevel * 1.1 : zoomLevel / 1.1));
    setZoom(newZoom);
    setScale(newZoom);
    setPosition({ x: pointer.x - mousePointTo.x * newZoom, y: pointer.y - mousePointTo.y * newZoom });
  }, [scale, position, zoomLevel, setZoom]);

  // ── Coordinate helper ───────────────────────────────────────────────────────
  const toCanvas = useCallback((pos: { x: number; y: number }) => ({
    x: (pos.x - position.x) / scale,
    y: (pos.y - position.y) / scale,
  }), [position, scale]);

  // ── Mouse down ──────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: any) => {
    // Middle mouse → pan
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      const pos = stageRef.current?.position() ?? { x: 0, y: 0 };
      midPanOrigin.current = { mouseX: e.evt.clientX, mouseY: e.evt.clientY, stageX: pos.x, stageY: pos.y };
      setIsMidPanning(true);
      return;
    }

    const onBackground = e.target === e.target.getStage();

    // Start manual pan when:
    //  – explicit pan tool, or spacebar held (pan from anywhere)
    //  – select tool AND click is on the empty canvas background
    const wantPan =
      currentTool === 'pan' ||
      isSpaceDown ||
      (currentTool === 'select' && onBackground);

    if (wantPan) {
      const pos = stageRef.current?.position() ?? { x: 0, y: 0 };
      panStart.current = { mouseX: e.evt.clientX, mouseY: e.evt.clientY, stageX: pos.x, stageY: pos.y };
      setIsPanning(true);
      return;
    }

    if (currentTool === 'pen') {
      const pointer = stageRef.current?.getPointerPosition();
      if (!pointer) return;
      const p = toCanvas(pointer);
      setIsDrawing(true);
      setCurrentPoints([p.x, p.y]);
      return;
    }

    if (currentTool === 'eraser-area') {
      const pointer = stageRef.current?.getPointerPosition();
      if (!pointer) return;
      const p = toCanvas(pointer);
      eraseStart.current = { x: p.x, y: p.y };
      setEraseRect({ x: p.x, y: p.y, w: 0, h: 0 });
    }
  }, [currentTool, isSpaceDown, toCanvas]);

  // ── Mouse move ──────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: any) => {
    if (isMidPanning) {
      const dx   = e.evt.clientX - midPanOrigin.current.mouseX;
      const dy   = e.evt.clientY - midPanOrigin.current.mouseY;
      const newX = midPanOrigin.current.stageX + dx;
      const newY = midPanOrigin.current.stageY + dy;
      setPosition({ x: newX, y: newY });
      stageRef.current?.position({ x: newX, y: newY });
      stageRef.current?.batchDraw();
      return;
    }

    if (isPanning) {
      const dx   = e.evt.clientX - panStart.current.mouseX;
      const dy   = e.evt.clientY - panStart.current.mouseY;
      const newX = panStart.current.stageX + dx;
      const newY = panStart.current.stageY + dy;
      setPosition({ x: newX, y: newY });
      stageRef.current?.position({ x: newX, y: newY });
      stageRef.current?.batchDraw();
      return;
    }

    if (isDrawing && currentTool === 'pen') {
      const pointer = stageRef.current?.getPointerPosition();
      if (!pointer) return;
      const p = toCanvas(pointer);
      setCurrentPoints(prev => [...prev, p.x, p.y]);
      return;
    }

    if (currentTool === 'eraser-area' && eraseRect) {
      const pointer = stageRef.current?.getPointerPosition();
      if (!pointer) return;
      const p = toCanvas(pointer);
      setEraseRect({
        x: eraseStart.current.x,
        y: eraseStart.current.y,
        w: p.x - eraseStart.current.x,
        h: p.y - eraseStart.current.y,
      });
    }
  }, [isMidPanning, isPanning, isDrawing, currentTool, eraseRect, toCanvas]);

  // ── Mouse up ────────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback((e: any) => {
    if (e?.evt?.button === 1 || isMidPanning) {
      setIsMidPanning(false);
      return;
    }

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && currentTool === 'pen') {
      setIsDrawing(false);
      if (currentPoints.length < 4) { setCurrentPoints([]); return; }
      const smoothed    = smoothing > 1 ? smoothMovingAverage(currentPoints, smoothing) : currentPoints;
      const finalPoints = simplify ? simplifyRDP(smoothed, Math.max(1, Math.round(penWidth))) : smoothed;
      const newDrawing: BoardElement = {
        id: `draw_${Date.now()}`, type: 'drawing', tool: 'pen',
        points: finalPoints, strokeWidth: penWidth, stroke: penColor, zIndex: Date.now(),
      } as any;
      addElement(board.id, newDrawing);
      setCurrentPoints([]);
      return;
    }

    if (currentTool === 'eraser-area' && eraseRect) {
      const { x, y, w, h } = eraseRect;
      const toErase = board.elements
        .filter((el: BoardElement) => {
          if (el.type === 'drawing')     return strokeInRect(el.points, x, y, w, h);
          if (el.type === 'sticky-note') return noteInRect(el.position.x, el.position.y, el.size.width, el.size.height, x, y, w, h);
          if (el.type === 'image')       return noteInRect(el.position.x, el.position.y, el.size.width, el.size.height, x, y, w, h);
          return false;
        })
        .map((el: BoardElement) => el.id);
      if (toErase.length > 0) deleteElements(board.id, toErase);
      setEraseRect(null);
    }
  }, [isMidPanning, isPanning, isDrawing, currentTool, currentPoints, eraseRect,
      addElement, deleteElements, board.id, board.elements,
      penColor, penWidth, smoothing, simplify]);

  // Stop panning when mouse is released anywhere (even outside the stage)
  useEffect(() => {
    const up = (e: MouseEvent) => {
      if (e.button === 1) setIsMidPanning(false);
      if (e.button === 0) setIsPanning(false);
    };
    document.addEventListener('mouseup', up);
    return () => document.removeEventListener('mouseup', up);
  }, []);

  // ── Stage click (sticky notes + deselect) ───────────────────────────────────
  const handleStageClick = useCallback((e: any) => {
    if (e.target !== e.target.getStage()) return;
    if (currentTool === 'pen' || currentTool === 'eraser-area') return;

    if (currentTool === 'sticky-note') {
      const pointer = e.target.getStage().getPointerPosition();
      if (!pointer) return;
      const noteColors = [
        designSystem.colors.accent.yellow, designSystem.colors.accent.pink,
        designSystem.colors.accent.green,  designSystem.colors.accent.blue,
      ];
      const newNote: BoardElement = {
        id: `sticky_${Date.now()}`, type: 'sticky-note', content: 'New Note',
        position: { x: (pointer.x - position.x) / scale, y: (pointer.y - position.y) / scale },
        size: { width: 200, height: 150 },
        color: noteColors[Math.floor(Math.random() * noteColors.length)],
        zIndex: Date.now(),
      };
      addElement(board.id, newNote);
    } else {
      clearSelection();
    }
  }, [currentTool, position, scale, board.id, addElement, clearSelection]);

  // ── Eraser stroke: click a drawing to delete it ───────────────────────────
  const handleEraseStroke = useCallback((id: string) => {
    deleteElement(board.id, id);
  }, [board.id, deleteElement]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const sortedElements = useMemo(
    () => [...board.elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)),
    [board.elements],
  );

  const activePanning = isMidPanning || isPanning;
  const cursor =
    activePanning         ? 'grabbing'
    : isSpaceDown         ? 'grab'
    : currentTool === 'pen'          ? 'crosshair'
    : currentTool === 'pan'          ? 'grab'
    : currentTool === 'eraser-area'  ? 'crosshair'
    : currentTool === 'eraser-stroke'? 'cell'
    : 'default';

  // Visible area in canvas coordinates (for background tiling)
  const viewX = -position.x / scale;
  const viewY = -position.y / scale;

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      style={{
        width: '100%', height: '100%',
        overflow: 'hidden', position: 'relative',
        cursor,
        ...getCanvasBackgroundStyle(board.template),
      }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
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
            viewX={viewX}
            viewY={viewY}
          />

          {sortedElements.map((el) => {
            if (el.type === 'drawing') {
              const d = el;
              return (
                <Line
                  key={d.id}
                  points={d.points}
                  stroke={currentTool === 'eraser-stroke' ? `${d.stroke}99` : d.stroke}
                  strokeWidth={d.strokeWidth}
                  tension={0.4}
                  lineCap="round"
                  lineJoin="round"
                  bezier={false}
                  hitStrokeWidth={currentTool === 'eraser-stroke' ? Math.max(24, d.strokeWidth * 4) : d.strokeWidth}
                  onClick={currentTool === 'eraser-stroke' ? () => handleEraseStroke(d.id) : undefined}
                  onTap={currentTool === 'eraser-stroke'   ? () => handleEraseStroke(d.id) : undefined}
                />
              );
            }
            if (el.type === 'image') {
              return (
                <Fragment key={el.id}>
                  <PlacedImage
                    image={el}
                    isSelected={selectedElements.includes(el.id) && currentTool === 'select'}
                    onSelect={() => {
                      if (currentTool === 'eraser-stroke') deleteElement(board.id, el.id);
                      else setSelectedElements(selectedElements.includes(el.id) ? [] : [el.id]);
                    }}
                  />
                </Fragment>
              );
            }
            if (el.type === 'sticky-note') {
              const note = el;
              return (
                <Fragment key={note.id}>
                  <StickyNote
                    note={note}
                    isSelected={selectedElements.includes(note.id) && currentTool === 'select'}
                    onSelect={() => {
                      if (currentTool === 'eraser-stroke') deleteElement(board.id, note.id);
                      else setSelectedElements(selectedElements.includes(note.id) ? [] : [note.id]);
                    }}
                  />
                </Fragment>
              );
            }
            return null;
          })}

          {/* Live drawing preview */}
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

          {/* Area eraser preview rectangle */}
          {eraseRect && (
            <Rect
              x={eraseRect.w >= 0 ? eraseRect.x : eraseRect.x + eraseRect.w}
              y={eraseRect.h >= 0 ? eraseRect.y : eraseRect.y + eraseRect.h}
              width={Math.abs(eraseRect.w)}
              height={Math.abs(eraseRect.h)}
              fill="rgba(239,68,68,0.08)"
              stroke="#EF4444"
              strokeWidth={1.5 / scale}
              dash={[6 / scale, 3 / scale]}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};
