// src/components/ui/AppLayout.tsx
import { useEffect } from 'react';
import { colors, layout, spacing } from '../../styles/design-system';
import { StyledButton, StyledText } from './StyledComponents';
import { BoardList } from '../boards/BoardList';
import { Toolbar } from './Toolbar';
import { Canvas } from '../canvas/Canvas';
import { useBoardStore } from '../../store/boardStore';

export const AppLayout = () => {
  const {
    boards,
    currentBoardId,
    currentTool,
    selectedElements,
    setCurrentTool,
    deleteSelectedElements,
    createBoard,
  } = useBoardStore();

  const currentBoard = boards.find((board: any) => board.id === currentBoardId);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 's':
          setCurrentTool('select');
          break;
        case 'p':
          setCurrentTool('pan');
          break;
        case 'n':
          setCurrentTool('sticky-note');
          break;
        case 'd':
          setCurrentTool('pen');
          break;
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
  }, [currentBoardId, selectedElements, setCurrentTool, deleteSelectedElements, currentTool]);

  const mainLayoutStyle = {
    display: 'flex',
    height: '100vh',
    backgroundColor: colors.gray[50],
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const contentAreaStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  };

  const canvasAreaStyle = {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden',
    backgroundColor: layout.canvas.backgroundColor,
  };

  const emptyStateStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    textAlign: 'center' as const,
  };

  return (
    <div style={mainLayoutStyle}>
      <BoardList />
      <div style={contentAreaStyle}>
        <Toolbar />
        <div style={canvasAreaStyle}>
          {currentBoard ? (
            <Canvas key={currentBoard.id} board={currentBoard} />
          ) : (
            <div style={emptyStateStyle}>
              <div style={{
                width: '96px',
                height: '96px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                marginBottom: spacing[6],
                boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
              }}>
                🎨
              </div>
              <StyledText size="2xl" weight="bold" color={colors.gray[800]} style={{ marginBottom: spacing[3] }}>
                Welcome to Whiteboard
              </StyledText>
              <StyledText size="lg" color={colors.gray[500]} style={{ marginBottom: spacing[6], maxWidth: '360px' }}>
                Create boards to sketch ideas, add sticky notes, and draw freely — all saved locally in your browser.
              </StyledText>
              <StyledButton variant="primary" onClick={() => createBoard('My First Board')}>
                + Create your first board
              </StyledButton>
              <StyledText size="xs" color={colors.gray[400]} style={{ marginTop: spacing[4] }}>
                Or use the sidebar to get started
              </StyledText>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
