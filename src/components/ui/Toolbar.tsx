// src/components/ui/Toolbar.tsx
import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { colors, spacing, shadows, layout } from '../../styles/design-system';
import { StyledButton, StyledBadge, StyledText } from './StyledComponents';
import { triggerExportPNG, exportBoardAsJSON, importBoardFromJSON } from '../../utils/exportUtils';

const tools = [
  { id: 'select',      label: 'Select',    shortcut: 'S', title: 'Select & move elements (S)' },
  { id: 'pan',         label: 'Pan',       shortcut: 'P', title: 'Pan the canvas (P)' },
  { id: 'sticky-note', label: 'Note',      shortcut: 'N', title: 'Add sticky note (N)' },
  { id: 'pen',         label: 'Draw',      shortcut: 'D', title: 'Freehand drawing (D)' },
];

export const Toolbar = () => {
  const {
    currentTool,
    setCurrentTool,
    currentBoardId,
    boards,
    selectedElements,
    deleteSelectedElements,
    clearSelection,
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    penColor,
    penWidth,
    setPenColor,
    setPenWidth,
    smoothing,
    setSmoothing,
    simplify,
    setSimplify,
    createBoard,
  } = useBoardStore();

  const [importError, setImportError] = useState<string | null>(null);

  const activeBoardData = boards.find((board: any) => board.id === currentBoardId);

  const handleDeleteSelected = () => {
    if (!currentBoardId) return;
    deleteSelectedElements(currentBoardId);
    clearSelection();
  };

  const handleExportPNG = () => {
    if (!currentBoardId) return;
    triggerExportPNG();
  };

  const handleExportJSON = () => {
    if (!activeBoardData) return;
    exportBoardAsJSON(activeBoardData);
  };

  const handleImportJSON = async () => {
    setImportError(null);
    try {
      const board = await importBoardFromJSON();
      createBoard(board.name, board.template);
      // The new board is created empty by createBoard; we need to populate it
      // We'll add elements after creation via store update
      // For simplicity, use updateBoard to set elements on the newly created board
      // The createBoard sets currentBoardId to the new board, so we look it up after a tick
      setTimeout(() => {
        const state = useBoardStore.getState();
        const newBoard = state.boards.find((b: any) => b.name === board.name);
        if (newBoard && board.elements.length > 0) {
          state.updateBoard(newBoard.id, { elements: board.elements });
        }
      }, 0);
    } catch (err: any) {
      setImportError(err.message ?? 'Import failed');
      setTimeout(() => setImportError(null), 4000);
    }
  };

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: layout.toolbar.height,
    padding: `0 ${spacing[4]}`,
    backgroundColor: layout.toolbar.backgroundColor,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: layout.toolbar.borderColor,
    boxShadow: shadows.sm,
    gap: spacing[3],
    flexShrink: 0,
  };

  const dividerStyle = {
    width: '1px',
    height: '24px',
    backgroundColor: colors.gray[300],
    flexShrink: 0,
  };

  return (
    <div style={toolbarStyle}>
      {/* Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: spacing[1] }}>
          {tools.map((tool) => (
            <StyledButton
              key={tool.id}
              variant={currentTool === tool.id ? 'primary' : 'secondary'}
              size="sm"
              title={tool.title}
              onClick={() => setCurrentTool(tool.id)}
            >
              {tool.label}
              <span style={{
                marginLeft: spacing[1],
                fontSize: '10px',
                opacity: 0.6,
                fontWeight: 'normal',
                letterSpacing: '0.05em',
              }}>
                {tool.shortcut}
              </span>
            </StyledButton>
          ))}
        </div>

        <div style={dividerStyle} />

        <StyledButton
          variant="danger"
          size="sm"
          title="Delete selected elements (Delete / Backspace)"
          disabled={selectedElements.length === 0}
          onClick={handleDeleteSelected}
        >
          Delete {selectedElements.length > 0 && `(${selectedElements.length})`}
        </StyledButton>
      </div>

      {/* Board info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], flexShrink: 0 }}>
        {activeBoardData ? (
          <>
            <StyledText size="base" weight="semibold" color={colors.gray[800]}>
              {activeBoardData.name}
            </StyledText>
            <StyledBadge variant="default">
              {activeBoardData.elements.length} {activeBoardData.elements.length === 1 ? 'element' : 'elements'}
            </StyledBadge>
          </>
        ) : (
          <StyledText size="sm" color={colors.gray[400]}>No board selected</StyledText>
        )}
        {selectedElements.length > 0 && (
          <StyledBadge variant="success">
            {selectedElements.length} selected
          </StyledBadge>
        )}
      </div>

      {/* Pen settings — only when pen tool is active */}
      {currentTool === 'pen' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], flexShrink: 0 }}>
          <div style={dividerStyle} />
          <input
            type="color"
            value={penColor}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPenColor(e.target.value)}
            title="Pen color"
            style={{ width: 28, height: 24, border: `1px solid ${colors.gray[300]}`, borderRadius: 6, padding: 0, cursor: 'pointer' }}
          />
          <StyledText size="xs" color={colors.gray[600]}>Width</StyledText>
          <input
            type="range"
            min={1}
            max={12}
            value={penWidth}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPenWidth(parseInt(e.target.value))}
            title="Pen width"
            style={{ width: 72 }}
          />
          <StyledText size="xs" color={colors.gray[700]} style={{ minWidth: 28 }}>{penWidth}px</StyledText>
          <div style={dividerStyle} />
          <StyledText size="xs" color={colors.gray[600]}>Smooth</StyledText>
          <input
            type="range"
            min={1}
            max={15}
            value={smoothing}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSmoothing(parseInt(e.target.value))}
            title="Stroke smoothing"
            style={{ width: 60 }}
          />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: spacing[1], cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={simplify}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSimplify(e.target.checked)}
              title="Simplify strokes (reduces point count)"
            />
            <StyledText as="span" size="xs" color={colors.gray[600]}>Simplify</StyledText>
          </label>
        </div>
      )}

      {/* Zoom + Export */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], flexShrink: 0 }}>
        <StyledButton variant="secondary" size="sm" onClick={zoomOut} title="Zoom out (scroll down)">−</StyledButton>
        <StyledText
          size="sm"
          color={colors.gray[700]}
          style={{ minWidth: '44px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
          onClick={resetZoom}
          title="Click to reset zoom"
        >
          {Math.round(zoomLevel * 100)}%
        </StyledText>
        <StyledButton variant="secondary" size="sm" onClick={zoomIn} title="Zoom in (scroll up)">+</StyledButton>

        <div style={dividerStyle} />

        <StyledButton
          variant="ghost"
          size="sm"
          onClick={handleExportPNG}
          disabled={!currentBoardId}
          title="Export board as PNG image"
        >
          PNG
        </StyledButton>
        <StyledButton
          variant="ghost"
          size="sm"
          onClick={handleExportJSON}
          disabled={!currentBoardId}
          title="Export board as JSON (for backup or sharing)"
        >
          Export
        </StyledButton>
        <StyledButton
          variant="ghost"
          size="sm"
          onClick={handleImportJSON}
          title="Import a board from a JSON file"
        >
          Import
        </StyledButton>

        {importError && (
          <StyledText size="xs" color={colors.error[600]} style={{ maxWidth: '200px' }}>
            {importError}
          </StyledText>
        )}
      </div>
    </div>
  );
};
