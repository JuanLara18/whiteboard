// src/store/boardStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDefaultTemplate } from '../constants/boardTemplates';

export interface BoardFolder {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Board {
  id: string;
  name: string;
  elements: Array<StickyNote | DrawingElement>;
  template: BoardTemplate;
  /** null / undefined = not inside a folder */
  folderId?: string | null;
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

/** Single undo step: boards + folder tree */
export type WorkspaceSnapshot = { boards: Board[]; folders: BoardFolder[] };

interface BoardStore {
  // ── Folders ─────────────────────────────────────────────────────────────────
  folders: BoardFolder[];
  createFolder: (name: string) => void;
  /** Create a folder and move one board into it (single undo step). Name is auto-generated if omitted. */
  createFolderAndMoveBoard: (boardId: string, folderName?: string) => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  moveBoardToFolder: (boardId: string, folderId: string | null) => void;

  // ── Board management ────────────────────────────────────────────────────────
  boards: Board[];
  currentBoardId: string | null;
  createBoard: (name: string, template?: BoardTemplate, folderId?: string | null) => void;
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
  past: WorkspaceSnapshot[];
  future: WorkspaceSnapshot[];
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const pushPast = (state: BoardStore): Pick<BoardStore, 'past' | 'future'> => ({
  past: [...state.past.slice(-(MAX_HISTORY - 1)), { boards: state.boards, folders: state.folders }],
  future: [],
});

function uniqueNewFolderName(folders: BoardFolder[], preferred?: string): string {
  const base = (preferred?.trim() || 'New folder') || 'New folder';
  if (!folders.some((f) => f.name === base)) return base;
  let n = 2;
  while (folders.some((f) => f.name === `${base} (${n})`)) n++;
  return `${base} (${n})`;
}

export const useBoardStore = (create as any)(
  persist(
    (set: any, get: () => BoardStore) => ({
      boards:           [],
      folders:          [],
      currentBoardId:   null,
      selectedElements: [],
      currentTool:      'select' as ToolId,
      zoomLevel:        1,
      penColor:         '#111827',
      penWidth:         2,
      smoothing:        3,
      simplify:         true,
      past:             [],
      future:             [],

      canUndo: () => get().past.length > 0,
      canRedo: () => get().future.length > 0,

      undo: () => {
        set((state: BoardStore) => {
          if (state.past.length === 0) return {};
          const snap = state.past[state.past.length - 1];
          const restoredId = snap.boards.some((b: Board) => b.id === state.currentBoardId)
            ? state.currentBoardId
            : snap.boards.length > 0 ? snap.boards[0].id : null;
          return {
            boards:         snap.boards,
            folders:        snap.folders,
            currentBoardId: restoredId,
            past:           state.past.slice(0, -1),
            future:         [{ boards: state.boards, folders: state.folders }, ...state.future.slice(0, MAX_HISTORY - 1)],
            selectedElements: [],
          };
        });
      },

      redo: () => {
        set((state: BoardStore) => {
          if (state.future.length === 0) return {};
          const snap = state.future[0];
          const restoredId = snap.boards.some((b: Board) => b.id === state.currentBoardId)
            ? state.currentBoardId
            : snap.boards.length > 0 ? snap.boards[0].id : null;
          return {
            boards:         snap.boards,
            folders:        snap.folders,
            currentBoardId: restoredId,
            past:           [...state.past.slice(-(MAX_HISTORY - 1)), { boards: state.boards, folders: state.folders }],
            future:         state.future.slice(1),
            selectedElements: [],
          };
        });
      },

      // ── Folders ──────────────────────────────────────────────────────────────
      createFolder: (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const folder: BoardFolder = {
          id:        `folder_${Date.now()}`,
          name:      trimmed,
          sortOrder: Date.now(),
        };
        set((state: BoardStore) => ({
          ...pushPast(state),
          folders: [...state.folders, folder],
        }));
      },

      createFolderAndMoveBoard: (boardId: string, folderName?: string) => {
        set((state: BoardStore) => {
          if (!state.boards.some((b) => b.id === boardId)) return {};
          const fname = uniqueNewFolderName(state.folders, folderName);
          const folder: BoardFolder = {
            id:        `folder_${Date.now()}`,
            name:      fname,
            sortOrder: Date.now(),
          };
          return {
            ...pushPast(state),
            folders: [...state.folders, folder],
            boards:  state.boards.map((b: Board) =>
              b.id === boardId ? { ...b, folderId: folder.id, updatedAt: Date.now() } : b
            ),
          };
        });
      },

      renameFolder: (folderId: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        set((state: BoardStore) => ({
          ...pushPast(state),
          folders: state.folders.map((f) =>
            f.id === folderId ? { ...f, name: trimmed } : f
          ),
        }));
      },

      deleteFolder: (folderId: string) => {
        set((state: BoardStore) => ({
          ...pushPast(state),
          folders: state.folders.filter((f) => f.id !== folderId),
          boards:  state.boards.map((b: Board) =>
            (b.folderId ?? null) === folderId ? { ...b, folderId: null, updatedAt: Date.now() } : b
          ),
        }));
      },

      moveBoardToFolder: (boardId: string, folderId: string | null) => {
        set((state: BoardStore) => {
          const b = state.boards.find((x) => x.id === boardId);
          if (!b || (b.folderId ?? null) === folderId) return {};
          return {
            ...pushPast(state),
            boards: state.boards.map((bb: Board) =>
              bb.id === boardId ? { ...bb, folderId, updatedAt: Date.now() } : bb
            ),
          };
        });
      },

      // ── Board actions ────────────────────────────────────────────────────────
      selectBoard: (boardId: string) => {
        set({ currentBoardId: boardId, selectedElements: [] });
      },

      createBoard: (name: string, template?: BoardTemplate, folderId?: string | null) => {
        const fid = folderId === undefined ? null : folderId;
        const newBoard: Board = {
          id:        `board_${Date.now()}`,
          name,
          elements:  [],
          template:  template || getDefaultTemplate(),
          folderId:  fid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state: BoardStore) => ({
          ...pushPast(state),
          boards:         [...state.boards, newBoard],
          currentBoardId: newBoard.id,
        }));
      },

      updateBoard: (boardId: string, updates: Partial<Board>) => {
        set((state: BoardStore) => ({
          ...pushPast(state),
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
            ...pushPast(state),
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
          ...pushPast(state),
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
          ...pushPast(state),
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
            ...pushPast(state),
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
          ...pushPast(state),
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

      deleteElements: (boardId: string, elementIds: string[]) => {
        if (elementIds.length === 0) return;
        const idSet = new Set(elementIds);
        set((state: BoardStore) => ({
          ...pushPast(state),
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
          ...pushPast(state),
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

      setZoom: (level: number) => set({ zoomLevel: Math.max(0.1, Math.min(5, level)) }),
      zoomIn:  () => { const { zoomLevel, setZoom } = get(); setZoom(zoomLevel * 1.2); },
      zoomOut: () => { const { zoomLevel, setZoom } = get(); setZoom(zoomLevel / 1.2); },
      resetZoom: () => set({ zoomLevel: 1 }),

      setPenColor:  (color: string) => set({ penColor: color }),
      setPenWidth:  (width: number) => set({ penWidth: Math.max(1, Math.min(20, width)) }),
      setSmoothing: (n: number)     => set({ smoothing: Math.max(1, Math.min(15, Math.round(n))) }),
      setSimplify:  (v: boolean)    => set({ simplify: v }),
    }),
    {
      name: 'whiteboard-storage',
      partialize: (state: BoardStore) => ({
        boards:         state.boards,
        folders:        state.folders,
        currentBoardId: state.currentBoardId,
        currentTool:    state.currentTool,
        zoomLevel:      state.zoomLevel,
        penColor:       state.penColor,
        penWidth:       state.penWidth,
        smoothing:      state.smoothing,
        simplify:       state.simplify,
      }),
      onRehydrateStorage: () => (state: BoardStore | undefined) => {
        if (!state) return;
        if (!Array.isArray(state.folders)) state.folders = [];
        state.boards = state.boards.map((b: Board) => ({
          ...b,
          folderId: b.folderId ?? null,
        }));
        if (!state.boards.length) {
          try {
            const raw = localStorage.getItem('whiteboard.boards');
            if (raw) {
              const boards = JSON.parse(raw) as Board[];
              if (Array.isArray(boards) && boards.length > 0) {
                state.boards = boards.map((b: Board) => ({ ...b, folderId: b.folderId ?? null }));
                state.currentBoardId = state.currentBoardId ?? boards[0].id;
              }
              localStorage.removeItem('whiteboard.boards');
            }
          } catch { /* silent */ }
        }
      },
    }
  )
);
