// Utilities for exporting board content

import type { Board } from '../store/boardStore';

// ── PNG export ────────────────────────────────────────────────────────────────

/** Registered by Canvas; called by Toolbar to trigger PNG download. */
let _exportPNGFn: (() => void) | null = null;

export const registerExportPNG = (fn: () => void) => {
  _exportPNGFn = fn;
};

export const triggerExportPNG = () => {
  _exportPNGFn?.();
};

// ── JSON export / import ─────────────────────────────────────────────────────

export const exportBoardAsJSON = (board: Board) => {
  const json = JSON.stringify(board, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${board.name.replace(/[^a-z0-9]/gi, '_')}.whiteboard.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importBoardFromJSON = (): Promise<Board> =>
  new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.whiteboard.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('No file selected'));
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const board = JSON.parse(e.target?.result as string) as Board;
          // Basic validation
          if (!board.id || !board.name || !Array.isArray(board.elements)) {
            throw new Error('Invalid board file');
          }
          // Give it a fresh ID to avoid collisions
          resolve({ ...board, id: `board_${Date.now()}`, createdAt: Date.now(), updatedAt: Date.now() });
        } catch {
          reject(new Error('Could not read board file. Make sure it is a valid .whiteboard.json export.'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
