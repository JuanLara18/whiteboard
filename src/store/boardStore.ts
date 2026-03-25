// src/store/boardStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDefaultTemplate } from '../constants/boardTemplates';

export interface Board {
  id: string;
  name: string;
  elements: Array<StickyNote | DrawingElement>;
  template: BoardTemplate;
  createdAt: number;
  updatedAt: number;
}

export interface BoardTemplate {
  id: string;
  name: string;
  background: {
    type: 'solid' | 'grid' | 'dots' | 'lines';
    color: string;
    gridSize?: number;
    gridColor?: string;
    opacity?: number;
  };
}

export interface StickyNote {
  id: string;
  type: 'sticky-note';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  zIndex: number;
}

export interface DrawingElement {
  id: string;
  type: 'drawing';
  tool: 'pen';
  points: number[];
  strokeWidth: number;
  stroke: string;
  zIndex: number;
}

export type BoardElement = StickyNote | DrawingElement;

interface BoardStore {
  // Board management
  boards: Board[];
  currentBoardId: string | null;
  createBoard: (name: string, template?: BoardTemplate) => void;
  selectBoard: (id: string) => void;
  updateBoard: (id: string, updates: Partial<Board>) => void;
  deleteBoard: (id: string) => void;
  renameBoard: (id: string, name: string) => void;

  // Element management
  selectedElements: string[];
  setSelectedElements: (elementIds: string[]) => void;
  clearSelection: () => void;
  addElement: (boardId: string, element: BoardElement) => void;
  updateElement: (
    boardId: string,
    element: BoardElement | string,
    updates?: Partial<BoardElement>
  ) => void;
  deleteElement: (boardId: string, elementId: string) => void;
  deleteSelectedElements: (boardId: string) => void;

  // Tool state
  currentTool: 'select' | 'pan' | 'sticky-note' | 'pen';
  setCurrentTool: (tool: 'select' | 'pan' | 'sticky-note' | 'pen') => void;

  // Zoom state
  zoomLevel: number;
  setZoom: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  // Drawing settings
  penColor: string;
  penWidth: number;
  setPenColor: (color: string) => void;
  setPenWidth: (width: number) => void;
  smoothing: number;
  simplify: boolean;
  setSmoothing: (n: number) => void;
  setSimplify: (v: boolean) => void;
}

export const useBoardStore = (create as any)(
  persist(
    (set: any, get: () => BoardStore) => ({
      boards: [],
      currentBoardId: null,
      selectedElements: [],
      currentTool: 'select',
      zoomLevel: 1,
      penColor: '#111827',
      penWidth: 2,
      smoothing: 3,
      simplify: true,

      selectBoard: (boardId: string) => {
        set({ currentBoardId: boardId, selectedElements: [] });
      },

      createBoard: (name: string, template?: BoardTemplate) => {
        const newBoard: Board = {
          id: `board_${Date.now()}`,
          name,
          elements: [],
          template: template || getDefaultTemplate(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state: BoardStore) => ({
          boards: [...state.boards, newBoard],
          currentBoardId: newBoard.id,
        }));
      },

      updateBoard: (boardId: string, updates: Partial<Board>) => {
        set((state: BoardStore) => ({
          boards: state.boards.map((board: Board) =>
            board.id === boardId
              ? { ...board, ...updates, updatedAt: Date.now() }
              : board
          ),
        }));
      },

      deleteBoard: (boardId: string) => {
        set((state: BoardStore) => {
          const remaining = state.boards.filter((b: Board) => b.id !== boardId);
          return {
            boards: remaining,
            currentBoardId:
              state.currentBoardId === boardId
                ? remaining.length > 0 ? remaining[0].id : null
                : state.currentBoardId,
            selectedElements: [],
          };
        });
      },

      renameBoard: (boardId: string, newName: string) => {
        set((state: BoardStore) => ({
          boards: state.boards.map((board: Board) =>
            board.id === boardId
              ? { ...board, name: newName, updatedAt: Date.now() }
              : board
          ),
        }));
      },

      addElement: (boardId: string, element: BoardElement) => {
        set((state: BoardStore) => ({
          boards: state.boards.map((board: Board) =>
            board.id === boardId
              ? { ...board, elements: [...board.elements, element], updatedAt: Date.now() }
              : board
          ),
        }));
      },

      updateElement: (
        boardId: string,
        element: BoardElement | string,
        updates?: Partial<BoardElement>
      ) => {
        set((state: BoardStore) => {
          const isPartial = typeof element === 'string';
          const elementId = isPartial ? element : (element as BoardElement).id;
          return {
            boards: state.boards.map((board: Board) =>
              board.id === boardId
                ? {
                    ...board,
                    elements: board.elements.map((el: BoardElement) => {
                      if (el.id !== elementId) return el;
                      if (isPartial) return { ...el, ...(updates as Partial<BoardElement>) } as BoardElement;
                      return element as BoardElement;
                    }),
                    updatedAt: Date.now(),
                  }
                : board
            ),
          };
        });
      },

      deleteElement: (boardId: string, elementId: string) => {
        set((state: BoardStore) => ({
          boards: state.boards.map((board: Board) =>
            board.id === boardId
              ? {
                  ...board,
                  elements: board.elements.filter((el: BoardElement) => el.id !== elementId),
                  updatedAt: Date.now(),
                }
              : board
          ),
          selectedElements: (state.selectedElements as string[]).filter(
            (id: string) => id !== elementId
          ),
        }));
      },

      deleteSelectedElements: (boardId: string) => {
        const { selectedElements } = get();
        if (selectedElements.length === 0) return;
        set((state: BoardStore) => ({
          boards: state.boards.map((board: Board) =>
            board.id === boardId
              ? {
                  ...board,
                  elements: board.elements.filter(
                    (el: BoardElement) => !selectedElements.includes(el.id)
                  ),
                  updatedAt: Date.now(),
                }
              : board
          ),
          selectedElements: [],
        }));
      },

      setSelectedElements: (elementIds: string[]) => {
        set({ selectedElements: elementIds });
      },

      clearSelection: () => {
        set({ selectedElements: [] });
      },

      setCurrentTool: (tool: string) => {
        set({ currentTool: tool, selectedElements: [] });
      },

      setZoom: (level: number) => {
        set({ zoomLevel: Math.max(0.1, Math.min(5, level)) });
      },

      zoomIn: () => {
        const { zoomLevel, setZoom } = get();
        setZoom(zoomLevel * 1.2);
      },

      zoomOut: () => {
        const { zoomLevel, setZoom } = get();
        setZoom(zoomLevel / 1.2);
      },

      resetZoom: () => {
        set({ zoomLevel: 1 });
      },

      setPenColor: (color: string) => set({ penColor: color }),
      setPenWidth: (width: number) => set({ penWidth: Math.max(1, Math.min(20, width)) }),
      setSmoothing: (n: number) => set({ smoothing: Math.max(1, Math.min(15, Math.round(n))) }),
      setSimplify: (v: boolean) => set({ simplify: v }),
    }),
    {
      name: 'whiteboard-storage',
      partialize: (state: BoardStore) => ({
        boards: state.boards,
        currentBoardId: state.currentBoardId,
        currentTool: state.currentTool,
        zoomLevel: state.zoomLevel,
        penColor: state.penColor,
        penWidth: state.penWidth,
        smoothing: state.smoothing,
        simplify: state.simplify,
      }),
      onRehydrateStorage: () => (state: BoardStore | undefined) => {
        // One-time migration: import boards from the old storage key
        if (!state || state.boards.length > 0) return;
        try {
          const raw = localStorage.getItem('whiteboard.boards');
          if (raw) {
            const boards = JSON.parse(raw) as Board[];
            if (Array.isArray(boards) && boards.length > 0) {
              state.boards = boards;
              state.currentBoardId = state.currentBoardId ?? boards[0].id;
            }
            localStorage.removeItem('whiteboard.boards');
          }
        } catch {
          // Migration failed silently — no data loss, just a fresh start
        }
      },
    }
  )
);
