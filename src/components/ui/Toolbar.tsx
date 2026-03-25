// src/components/ui/Toolbar.tsx
import React, { type ChangeEvent } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { colors, spacing, shadows, layout, components } from '../../styles/design-system';
import {
  IconSelect, IconHand, IconNote, IconPencil, IconTrash,
  IconDownload, IconUpload, IconImage,
} from './Icons';
import { triggerExportPNG, exportBoardAsJSON, importBoardFromJSON } from '../../utils/exportUtils';

// ── Preset pen colors ─────────────────────────────────────────────────────────
const PEN_PRESETS = [
  { color: '#111827', label: 'Black' },
  { color: '#DC2626', label: 'Red' },
  { color: '#2563EB', label: 'Blue' },
];

// ── Tool definitions ──────────────────────────────────────────────────────────
type ToolId = 'select' | 'pan' | 'sticky-note' | 'pen';
const TOOLS: { id: ToolId; label: string; shortcut: string; Icon: React.FC }[] = [
  { id: 'select',      label: 'Select',     shortcut: 'S', Icon: () => <IconSelect /> },
  { id: 'pan',         label: 'Pan',        shortcut: 'P', Icon: () => <IconHand /> },
  { id: 'sticky-note', label: 'Sticky Note',shortcut: 'N', Icon: () => <IconNote /> },
  { id: 'pen',         label: 'Draw',       shortcut: 'D', Icon: () => <IconPencil /> },
];

// ── Toolbar icon button ───────────────────────────────────────────────────────
interface ToolBtnProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}
const ToolBtn: React.FC<ToolBtnProps> = ({ active, onClick, title, disabled, danger, children }) => {
  const [hover, setHover] = React.useState(false);

  const base = components.button.base;
  const bg = disabled
    ? 'transparent'
    : danger
      ? hover ? colors.error[700] : colors.error[600]
      : active
        ? colors.gray[900]
        : hover
          ? colors.gray[100]
          : 'transparent';

  const col = disabled
    ? colors.gray[300]
    : danger
      ? colors.white
      : active
        ? colors.white
        : hover
          ? colors.gray[700]
          : colors.gray[500];

  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...base,
        width: 34,
        height: 34,
        padding: 0,
        borderRadius: 7,
        backgroundColor: bg,
        color: col,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: '120ms',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
};

// ── Divider ───────────────────────────────────────────────────────────────────
const Div = () => (
  <div style={{ width: 1, height: 20, backgroundColor: colors.gray[200], flexShrink: 0 }} />
);

// ── Toolbar ───────────────────────────────────────────────────────────────────
export const Toolbar = () => {
  const {
    currentTool, setCurrentTool,
    currentBoardId, boards,
    selectedElements, deleteSelectedElements, clearSelection,
    zoomLevel, zoomIn, zoomOut, resetZoom,
    penColor, penWidth, setPenColor, setPenWidth,
    smoothing, setSmoothing, simplify, setSimplify,
    createBoard,
  } = useBoardStore();

  const [importError, setImportError] = React.useState<string | null>(null);
  const activeBoardData = boards.find((b: any) => b.id === currentBoardId);

  const handleDeleteSelected = () => {
    if (!currentBoardId) return;
    deleteSelectedElements(currentBoardId);
    clearSelection();
  };

  const handleImportJSON = async () => {
    setImportError(null);
    try {
      const board = await importBoardFromJSON();
      createBoard(board.name, board.template);
      setTimeout(() => {
        const state = useBoardStore.getState();
        const latest = state.boards.find((b: any) => b.name === board.name && b.elements.length === 0);
        if (latest && board.elements.length > 0) {
          state.updateBoard(latest.id, { elements: board.elements });
        }
      }, 0);
    } catch (err: any) {
      setImportError(err.message ?? 'Import failed');
      setTimeout(() => setImportError(null), 4000);
    }
  };

  const toolbarStyle: React.CSSProperties = {
    display:          'flex',
    alignItems:       'center',
    gap:              spacing[2],
    height:           layout.toolbar.height,
    padding:          `0 ${spacing[3]}`,
    backgroundColor:  layout.toolbar.backgroundColor,
    borderBottom:     `1px solid ${layout.toolbar.borderColor}`,
    boxShadow:        shadows.sm,
    flexShrink:       0,
    overflowX:        'auto',
    overflowY:        'hidden',
  };

  return (
    <div style={toolbarStyle}>
      {/* ── Tools ── */}
      <div style={{ display: 'flex', gap: spacing[0.5] }}>
        {TOOLS.map(({ id, label, shortcut, Icon }) => (
          <ToolBtn
            key={id}
            active={currentTool === id}
            onClick={() => setCurrentTool(id)}
            title={`${label}  [${shortcut}]`}
          >
            <Icon />
          </ToolBtn>
        ))}
      </div>

      <Div />

      {/* ── Delete ── */}
      <ToolBtn
        danger
        disabled={selectedElements.length === 0}
        onClick={handleDeleteSelected}
        title={`Delete selected  [Delete]`}
      >
        <IconTrash />
      </ToolBtn>

      <Div />

      {/* ── Board name ── */}
      <div style={{ flex: 1, overflow: 'hidden', textAlign: 'center', minWidth: 0 }}>
        {activeBoardData ? (
          <span style={{
            fontSize:     '13px',
            fontWeight:   600,
            color:        colors.gray[700],
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            display:      'block',
          }}>
            {activeBoardData.name}
          </span>
        ) : null}
      </div>

      <Div />

      {/* ── Pen settings (only when pen active) ── */}
      {currentTool === 'pen' && (
        <>
          {/* Color presets */}
          <div style={{ display: 'flex', gap: spacing[1], alignItems: 'center' }}>
            {PEN_PRESETS.map(({ color, label }) => (
              <button
                key={color}
                title={label}
                onClick={() => setPenColor(color)}
                style={{
                  width:        20,
                  height:       20,
                  borderRadius: '50%',
                  backgroundColor: color,
                  border:       penColor === color ? `2px solid ${colors.primary[500]}` : `2px solid transparent`,
                  outline:      penColor === color ? `2px solid ${colors.primary[200]}` : 'none',
                  cursor:       'pointer',
                  padding:      0,
                  transition:   '100ms',
                  flexShrink:   0,
                }}
              />
            ))}
            {/* Custom color */}
            <input
              type="color"
              value={penColor}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPenColor(e.target.value)}
              title="Custom color"
              style={{
                width:        20,
                height:       20,
                borderRadius: '50%',
                border:       `2px solid ${colors.gray[300]}`,
                padding:      0,
                cursor:       'pointer',
                background:   'none',
                flexShrink:   0,
              }}
            />
          </div>

          <Div />

          {/* Width */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1.5] }}>
            <span style={{ fontSize: '11px', color: colors.gray[400], whiteSpace: 'nowrap' }}>Width</span>
            <input
              type="range"
              min={1}
              max={12}
              value={penWidth}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPenWidth(parseInt(e.target.value))}
              title="Stroke width"
              style={{ width: 64, accentColor: colors.primary[500] }}
            />
            <span style={{ fontSize: '11px', color: colors.gray[500], minWidth: 22 }}>{penWidth}px</span>
          </div>

          <Div />

          {/* Smoothing + Simplify */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1.5] }}>
            <span style={{ fontSize: '11px', color: colors.gray[400], whiteSpace: 'nowrap' }}>Smooth</span>
            <input
              type="range"
              min={1}
              max={15}
              value={smoothing}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSmoothing(parseInt(e.target.value))}
              title="Stroke smoothing"
              style={{ width: 52, accentColor: colors.primary[500] }}
            />
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: spacing[1], cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={simplify}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSimplify(e.target.checked)}
                title="Reduce points (Simplify)"
                style={{ accentColor: colors.primary[500] }}
              />
              <span style={{ fontSize: '11px', color: colors.gray[400] }}>Simplify</span>
            </label>
          </div>

          <Div />
        </>
      )}

      {/* ── Zoom ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
        <ToolBtn onClick={zoomOut} title="Zoom out  [Scroll ↓]">
          <span style={{ fontSize: 16, lineHeight: 1, marginBottom: 1 }}>−</span>
        </ToolBtn>
        <button
          onClick={resetZoom}
          title="Reset zoom  [click]"
          style={{
            background:   'none',
            border:       'none',
            cursor:       'pointer',
            fontSize:     '12px',
            fontWeight:   500,
            color:        colors.gray[500],
            minWidth:     42,
            textAlign:    'center',
            padding:      `${spacing[1]} ${spacing[1.5]}`,
            borderRadius: 6,
          }}
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <ToolBtn onClick={zoomIn} title="Zoom in  [Scroll ↑]">
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
        </ToolBtn>
      </div>

      <Div />

      {/* ── Export / Import ── */}
      <div style={{ display: 'flex', gap: spacing[0.5] }}>
        <ToolBtn
          onClick={() => { if (currentBoardId) triggerExportPNG(); }}
          disabled={!currentBoardId}
          title="Export as PNG image"
        >
          <IconImage />
        </ToolBtn>
        <ToolBtn
          onClick={() => { if (activeBoardData) exportBoardAsJSON(activeBoardData); }}
          disabled={!currentBoardId}
          title="Export board as JSON (backup / share)"
        >
          <IconDownload />
        </ToolBtn>
        <ToolBtn
          onClick={handleImportJSON}
          title="Import board from JSON file"
        >
          <IconUpload />
        </ToolBtn>
      </div>

      {importError && (
        <span style={{ fontSize: '11px', color: colors.error[600], maxWidth: 160 }}>
          {importError}
        </span>
      )}
    </div>
  );
};
