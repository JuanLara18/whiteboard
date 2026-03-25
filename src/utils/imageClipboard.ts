// Clipboard image → board-ready data URL (size-capped for storage & perf)

const MAX_STORE_EDGE = 1800;
const MAX_INITIAL_DISPLAY_EDGE = 520;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}

/** Scale dimensions so longest edge ≤ maxEdge. */
function fitInside(nw: number, nh: number, maxEdge: number): { w: number; h: number } {
  const m = Math.max(nw, nh);
  if (m <= maxEdge) return { w: nw, h: nh };
  const s = maxEdge / m;
  return { w: Math.round(nw * s), h: Math.round(nh * s) };
}

/**
 * Read first image file from a paste event (screenshots, copied images, files).
 */
export function getImageFileFromPasteEvent(e: ClipboardEvent): File | null {
  const items = e.clipboardData?.items;
  if (!items) return null;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const f = item.getAsFile();
      if (f) return f;
    }
  }
  return null;
}

export type PreparedBoardImage = {
  dataUrl: string;
  width: number;
  height: number;
};

/**
 * Produce a PNG data URL (max edge MAX_STORE_EDGE) and display size (max edge MAX_INITIAL_DISPLAY_EDGE).
 */
export async function prepareImageForBoard(file: Blob): Promise<PreparedBoardImage | null> {
  try {
    const buf = await file.arrayBuffer();
    const mime = file.type && file.type.startsWith('image/') ? file.type : 'image/png';
    const objectUrl = URL.createObjectURL(new Blob([buf], { type: mime }));
    try {
      const img = await loadImage(objectUrl);
      const nw = img.naturalWidth || img.width;
      const nh = img.naturalHeight || img.height;
      if (!nw || !nh) return null;

      const store = fitInside(nw, nh, MAX_STORE_EDGE);
      const canvas = document.createElement('canvas');
      canvas.width = store.w;
      canvas.height = store.h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, store.w, store.h);
      const dataUrl = canvas.toDataURL('image/png');

      const display = fitInside(store.w, store.h, MAX_INITIAL_DISPLAY_EDGE);
      return { dataUrl, width: display.w, height: display.h };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

/** Copy a data URL image to the system clipboard as PNG (best effort). */
export async function copyDataUrlToClipboard(dataUrl: string): Promise<void> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/png';
  if (typeof ClipboardItem === 'undefined') {
    throw new Error('Clipboard images not supported in this browser');
  }
  await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
}
