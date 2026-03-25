// src/components/canvas/CanvasBackground.tsx
import React from 'react';
import { Rect, Group, Line } from 'react-konva';
import { BoardTemplate } from '../../store/boardStore';

interface CanvasBackgroundProps {
  template: BoardTemplate;
  /** Visible width in canvas coords  (stageSize.width  / scale) */
  width: number;
  /** Visible height in canvas coords (stageSize.height / scale) */
  height: number;
  /** Left edge of the viewport in canvas coords  (-position.x / scale) */
  viewX: number;
  /** Top edge of the viewport in canvas coords   (-position.y / scale) */
  viewY: number;
}

export const CanvasBackground = ({
  template,
  width,
  height,
  viewX,
  viewY,
}: CanvasBackgroundProps) => {
  const renderBackground = () => {
    const { background } = template;
    const endX = viewX + width;
    const endY = viewY + height;

    switch (background.type) {
      case 'solid':
        return (
          <Rect
            x={viewX} y={viewY}
            width={width} height={height}
            fill={background.color}
            listening={false}
          />
        );

      case 'grid': {
        const step  = background.gridSize || 20;
        const color = background.gridColor || '#e5e7eb';
        // Snap start to the nearest grid multiple so lines are always
        // anchored to absolute canvas (0,0), giving an infinite-canvas feel.
        const startX = Math.floor(viewX / step) * step;
        const startY = Math.floor(viewY / step) * step;
        const lines: React.ReactElement[] = [];

        for (let x = startX; x <= endX; x += step) {
          lines.push(
            <Line key={`v${x}`} points={[x, viewY, x, endY]}
              stroke={color} strokeWidth={1} listening={false} />,
          );
        }
        for (let y = startY; y <= endY; y += step) {
          lines.push(
            <Line key={`h${y}`} points={[viewX, y, endX, y]}
              stroke={color} strokeWidth={1} listening={false} />,
          );
        }

        return (
          <Group>
            <Rect x={viewX} y={viewY} width={width} height={height}
              fill={background.color} listening={false} />
            {lines}
          </Group>
        );
      }

      case 'dots': {
        const step  = background.gridSize || 20;
        const color = background.gridColor || '#e5e7eb';
        const r     = 1.5;
        const startX = Math.floor(viewX / step) * step;
        const startY = Math.floor(viewY / step) * step;
        const dots: React.ReactElement[] = [];

        for (let y = startY; y <= endY; y += step) {
          for (let x = startX; x <= endX; x += step) {
            dots.push(
              <Rect key={`${x}-${y}`}
                x={x - r} y={y - r} width={r * 2} height={r * 2}
                fill={color} listening={false} />,
            );
          }
        }

        return (
          <Group>
            <Rect x={viewX} y={viewY} width={width} height={height}
              fill={background.color} listening={false} />
            {dots}
          </Group>
        );
      }

      case 'lines': {
        const step  = background.gridSize || 20;
        const color = background.gridColor || '#e5e7eb';
        const startY = Math.floor(viewY / step) * step;
        const lines: React.ReactElement[] = [];

        for (let y = startY; y <= endY; y += step) {
          lines.push(
            <Line key={`hl${y}`} points={[viewX, y, endX, y]}
              stroke={color} strokeWidth={1} listening={false} />,
          );
        }

        return (
          <Group>
            <Rect x={viewX} y={viewY} width={width} height={height}
              fill={background.color} listening={false} />
            {lines}
          </Group>
        );
      }

      default:
        return (
          <Rect x={viewX} y={viewY} width={width} height={height}
            fill="#ffffff" listening={false} />
        );
    }
  };

  return renderBackground();
};

// Helper function to generate CSS background patterns
export const getCanvasBackgroundStyle = (template: BoardTemplate): React.CSSProperties => {
  const { background } = template;
  return { backgroundColor: background.color };
};
