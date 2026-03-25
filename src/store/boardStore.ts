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

export type ToolId = 'select' | 'pan' | 'sticky-note' | 'pen' | 'eraser-stroke' | 'eraser-area';

const MAX_HISTORY = 40;

interface BoardStore {
  // ── Board management ────────────────────────────────────────────────────────
  boards: Board[];
  currentBoardId: string | null;
  createBoard: (name: string, template?: BoardTemplate) => void;
  selectBoard: (id: string) => void;
  updateBoard: (id: string, updates: Partial<Board>) => void;
  deleteBoard: (id: string) => void;
  renameBoard: (id: string, name: string) => void;

  // ── Element management ───────────────────────────────────────────────────────
  selectedElements: string[];
  setSelectedElements: (ids: string[]) => void;
  clearSelection: () => void;
  addElement: (boardId: string, element: BoardElement) => void;
  updateElement: (boardId: string, element: BoardElement | string, updates?: Partial<BoardElement>) => void;
  deleteElement: (boardId: string, elementId: string) => void;
  deleteElements: (boardId: string, elementIds: string[]) => void;
  deleteSelectedElements: (boardId: string) => void;

  // ── Tool state ───────────────────────────────────────────────────────────────
  currentTool: ToolId;
  setCurrentTool: (tool: ToolId) => void;

  // ── Zoom ────────────────────────────────────────────────────────────────────
  zoomLevel: number;
  setZoom: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  // ── Drawing settings ─────────────────────────────────────────────────────────
  penColor: string;
  penWidth: number;
  setPenColor: (color: string) => void;
  setPenWidth: (width: number) => void;
  smoothing: number;
  simplify: boolean;
  setSmoothing: (n: number) => void;
  setSimplify: (v: boolean) => void;

  // ── Undo / Redo ──────────────────────────────────────────────────────────────
  past: Board[][];
  future: Board[][];
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useBoardStore = (create as any)(
  persist(
    (set: any, get: () => BoardStore) => ({
      boards:           [],
      currentBoardId:   null,
      selectedElements: [],
      currentTool:      'select' as ToolId,
      zoomLevel:        1,
      penColor:         '#111827',
      penWidth:         2,
      smoothing:        3,
      simplify:         true,
      past:             [],
      future:           [],

      // ── History helpers (internal) ───────────────────────────────────────────
      canUndo: () => get().past.length > 0,
      canRedo: () => get().future.length > 0,

      undo: () => {
        set((state: BoardStore) => {
          if (state.past.length === 0) return {};
          const previous = state.past[state.past.length - 1];
          const restoredId = previous.some((b: Board) => b.id === state.currentBoardId)
            ? state.currentBoardId
            : previous.length > 0 ? previous[0].id : null;
          return {
            boards:         previous,
            currentBoardId: restoredId,
            past:           state.past.slice(0, -1),
            future:         [state.boards, ...state.future.slice(0, MAX_HISTORY - 1)],
            selectedElements: [],
          };
        });
      },

      redo: () => {
        set((state: BoardStore) => {
          if (state.future.length === 0) return {};
          const next = state.future[0];
          const restoredId = next.some((b: Board) => b.id === state.currentBoardId)
            ? state.currentBoardId
            : next.length > 0 ? next[0].id : null;
          return {
            boards:         next,
            currentBoardId: restoredId,
            past:           [...state.past.slice(-(MAX_HISTORY - 1)), state.boards],
            future:         state.future.slice(1),
            selectedElements: [],
          };
        });
      },

      // ── Board actions ────────────────────────────────────────────────────────
      selectBoard: (boardId: string) => {
        set({ currentBoardId: boardId, selectedElements: [] });
      },

      createBoard: (name: string, template?: BoardTemplate) => {
        const newBoard: Board = {
          id:        `board_${Date.now()}`,
          name,
          elements:  [],
          template:  template || getDefaultTemplate(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state: BoardStore) => ({
          past:           [...state.past.slice(-(MAX_HISTORY - 1)), state.boards],
          future:         [],
          boards:         [...state.boards, newBoard],
          currentBoardId: newBoard.id,
        }));
      },

      updateBoard: (boardId: string, updates: Partial<Board>) => {
        set((state: BoardStore) => ({
          past:   [...state.past.slice(-(MAX_HISTORY - 1)), state.boards],
          future: [],
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
            past:           [...state.past.slice(-(MAX_HISTORY - 1)), state.boards],
            future:         [],
            boards:         remaining,
            currentBoardId: state.currentBoardId === boardId
              ? (remaining.length > 0 ? remaining[0].id : null)
              : state.currentBoardId,
            selectedElements: [],
          };
        });
      },

      renameBoard: (boardId: string, newName: string) => {
        set((state: BoardStore) => ({
          past:   [...state.past.slice(-(MAX_HISTORY - 1)), state.boards],
          future: [],
          boards: state.boards.map((board: Board) =>
            board.id === boardId
              ? { ...board, name: newName, updatedAt: Date.now() }
              : board
          ),
        }));
      },

      // ── Element actions ──────────────────────────────────────────────────────
      addElement: (boardId: string, element: BoardElement) => {
        set((state: BoardStore) => ({
          past:   [...state.past.slice(-(MAX_HISTORY - 1)), state.boards],
          future: [],
          boards: state.boards.map((board: Board) =>
            board.id === boardId
              ? { ...board, elements: [...board.elements, element], updatedAt: Date.now() }
              : board
          ),
        }));
      },

      updateElement: (boardId: string, element: BoardElement | string, updates?: Partial<BoardElement>) => {
        set((state: BoardStore) => {
          const isPartial = typeof element === 'string';
          const elementId = isPartial ? element : (element as BoardElement).id;
          return {
            past:   [...state.past.slice(-(MAX_HISTORY - 1)), state.boards],
            future: [],
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
          past:   [...state.past.slice(-(MAX_HISTORY - 1)), state.boards],
          future: [],
          boards: state.boards.map((board: Board) =>
            board.id === boardId
              ? {
                  ...board,
                  elements: board.elements.filter((el: BoardElement) => el.id !== elementId),
                  updatedAt: Date.now(),
                }
              : board
          ),
          selectedElements: (state.selectedElements as string[]).filter((id: string) => id !== elementId),
        }));
      },

      // Delete multiple elements as a single undo step
      deleteElements: (boardId: string, elementIds: string[]) => {
        if (elementIds.length === 0) return;
        const idSet = new Set(elementIds);
        set((state: BoardStore) => ({
          past:   [...state.past.slice(-(MAX_HISTORY - 1)), state.boards],
          future: [],
          boards: state.boards.map((board: Board) =>
            board.id === boardId
              ? {
                  ...board,
                  elements:  board.elements.filter((el: BoardElement) => !idSet.has(el.id)),
                  updatedAt: Date.now(),
                }
              : board
          ),
          selectedElements: (state.selectedElements as string[]).filter((id: string) => !idSet.has(id)),
        }));
      },

      deleteSelectedElements: (boardId: string) => {
        const { selectedElements } = get();
        if (selectedElements.length === 0) return;
        const idSet = new Set(selectedElements as string[]);
        set((state: BoardStore) => ({
          past:   [...state.past.slice(-(MAX_HISTORY - 1)), state.boards],
          future: [],
          boards: state.boards.map((board: Board) =>
            board.id === boardId
              ? {
                  ...board,
                  elements:  board.elements.filter((el: BoardElement) => !idSet.has(el.id)),
                  updatedAt: Date.now(),
                }
              : board
          ),
          selectedElements: [],
        }));
      },

      setSelectedElements: (ids: string[]) => set({ selectedElements: ids }),
      clearSelection:      ()              => set({ selectedElements: [] }),

      setCurrentTool: (tool: string) => set({ currentTool: tool, selectedElements: [] }),

      // ── Zoom ────────────────────────────────────────────────────────────────
      setZoom: (level: number) => set({ zoomLevel: Math.max(0.1, Math.min(5, level)) }),
      zoomIn:  () => { const { zoomLevel, setZoom } = get(); setZoom(zoomLevel * 1.2); },
      zoomOut: () => { const { zoomLevel, setZoom } = get(); setZoom(zoomLevel / 1.2); },
      resetZoom: () => set({ zoomLevel: 1 }),

      // ── Drawing settings ─────────────────────────────────────────────────────
      setPenColor:  (color: string) => set({ penColor: color }),
      setPenWidth:  (width: number) => set({ penWidth: Math.max(1, Math.min(20, width)) }),
      setSmoothing: (n: number)     => set({ smoothing: Math.max(1, Math.min(15, Math.round(n))) }),
      setSimplify:  (v: boolean)    => set({ simplify: v }),
    }),
    {
      name: 'whiteboard-storage',
      // past/future are intentionally excluded — no need to persist history
      partialize: (state: BoardStore) => ({
        boards:        state.boards,
        currentBoardId:state.currentBoardId,
        currentTool:   state.currentTool,
        zoomLevel:     state.zoomLevel,
        penColor:      state.penColor,
        penWidth:      state.penWidth,
        smoothing:     state.smoothing,
        simplify:      state.simplify,
      }),
      onRehydrateStorage: () => (state: BoardStore | undefined) => {
        // One-time migration from old storage key
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
        } catch { /* silent */ }
      },
    }
  )
);
