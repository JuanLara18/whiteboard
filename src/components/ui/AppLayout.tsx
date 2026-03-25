// src/components/ui/AppLayout.tsx
import { useEffect } from 'react';
import { colors, layout, spacing } from '../../styles/design-system';
import { StyledButton } from './StyledComponents';
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
    createBoard,
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
            /* ── Empty / welcome state ── */
            <div style={{
              height:         '100%',
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              padding:        spacing[8],
              textAlign:      'center',
            }}>
              <div style={{
                width:        80,
                height:       80,
                background:   `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[800]} 100%)`,
                borderRadius: '20px',
                display:      'flex',
                alignItems:   'center',
                justifyContent:'center',
                fontSize:     '36px',
                marginBottom: spacing[6],
                boxShadow:    `0 8px 24px rgba(99,102,241,0.3)`,
              }}>
                🎨
              </div>
              <h2 style={{
                fontSize:     '22px',
                fontWeight:   700,
                color:        colors.gray[800],
                margin:       `0 0 ${spacing[3]}`,
              }}>
                Whiteboard
              </h2>
              <p style={{
                fontSize:     '14px',
                color:        colors.gray[500],
                marginBottom: spacing[6],
                maxWidth:     '320px',
                lineHeight:   1.6,
                margin:       `0 0 ${spacing[6]}`,
              }}>
                Sketch ideas, add sticky notes, draw freely.<br />
                Everything saves automatically to your browser.
              </p>
              <StyledButton variant="primary" onClick={() => createBoard('Untitled')}>
                + Create your first board
              </StyledButton>
              <p style={{
                marginTop:  spacing[5],
                fontSize:   '12px',
                color:      colors.gray[400],
              }}>
                Or use the sidebar on the left
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
