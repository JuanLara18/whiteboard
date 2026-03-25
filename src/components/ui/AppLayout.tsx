// src/components/ui/AppLayout.tsx
import { useEffect } from 'react';
import { colors, layout, spacing } from '../../styles/design-system';
import { BoardList } from '../boards/BoardList';
import { Toolbar } from './Toolbar';
import { Canvas } from '../canvas/Canvas';
import { useBoardStore } from '../../store/boardStore';

export const AppLayout = () => {
  const {
    boards,
    currentBoardId,
    selectedElements,
    setCurrentTool,
    deleteSelectedElements,
    undo,
    redo,
  } = useBoardStore();

  const currentBoard = boards.find((board: any) => board.id === currentBoardId);

  // Global keyboard shortcuts (Space is handled inside Canvas)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) redo(); else undo();
          return;
        }
        if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
          return;
        }
      }

      // Single-key tool shortcuts (no modifier)
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case 's': setCurrentTool('select'); break;
        case 'p': setCurrentTool('pan'); break;
        case 'n': setCurrentTool('sticky-note'); break;
        case 'd': setCurrentTool('pen'); break;
        case 'e': setCurrentTool('eraser-stroke'); break;
        case 'r': setCurrentTool('eraser-area'); break;
        case 'delete':
        case 'backspace':
          if (currentBoardId && selectedElements.length > 0) {
            deleteSelectedElements(currentBoardId);
          }
          break;
        case 'escape':
          setCurrentTool('select');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentBoardId, selectedElements, setCurrentTool, deleteSelectedElements, undo, redo]);

  return (
    <div style={{
      display:         'flex',
      height:          '100vh',
      backgroundColor: colors.gray[100],
      fontFamily:      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <BoardList />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Toolbar />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: layout.canvas.backgroundColor }}>
          {currentBoard ? (
            <Canvas key={currentBoard.id} board={currentBoard} />
          ) : (
            /* ── Empty state: no board selected ── */
            <div style={{
              height:         '100%',
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              padding:        spacing[8],
              textAlign:      'center',
            }}>
              <h2 style={{
                fontSize:     '17px',
                fontWeight:   600,
                color:        colors.gray[700],
                margin:       `0 0 ${spacing[2]}`,
                letterSpacing: '-0.02em',
              }}>
                No board open
              </h2>
              <p style={{
                fontSize:     '13px',
                color:        colors.gray[500],
                maxWidth:     '280px',
                lineHeight:   1.55,
                margin:       0,
              }}>
                {boards.length === 0 ? (
                  <>
                    Use <span style={{ fontWeight: 600, color: colors.gray[700] }}>New</span> in the sidebar to create a board.
                  </>
                ) : (
                  <>Select a board in the sidebar to open it here.</>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
