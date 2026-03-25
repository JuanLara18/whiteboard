// Inline SVG icons — stroke-based, 20×20 viewBox, 1.5px stroke weight
// All icons use currentColor so they inherit text color automatically.

type IconProps = { size?: number };
const S = { fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const IconSelect = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M4 2.5L4 15.5L7.5 12L9.5 16L11 15.2L9 11.5L13.5 11.5L4 2.5Z" fill="currentColor" />
  </svg>
);

export const IconHand = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M10 3.5V10.5M10 3.5a1.25 1.25 0 012.5 0V10.5M10 3.5a1.25 1.25 0 00-2.5 0V10.5M12.5 5a1.25 1.25 0 012.5 0V11.5a5.5 5.5 0 01-5.5 5.5h-.5A5.5 5.5 0 014 11.5V9.5a1.25 1.25 0 012.5 0V10.5"
      stroke="currentColor" {...S}
    />
  </svg>
);

export const IconNote = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M3 4a1 1 0 011-1h9l4 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm9-1v4h4" stroke="currentColor" {...S} />
  </svg>
);

export const IconPencil = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M13.5 3.5a2.121 2.121 0 113 3L6 17H3v-3L13.5 3.5z" stroke="currentColor" {...S} />
  </svg>
);

export const IconTrash = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M3 5.5h14M8 5.5V4a1 1 0 012 0v1.5M7 8.5v6M10 8.5v6M13 8.5v6M5 5.5l.75 10a1 1 0 001 .917h6.5a1 1 0 001-.917L15 5.5"
      stroke="currentColor" {...S}
    />
  </svg>
);

export const IconDownload = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M10 3v10M7 10l3 3 3-3M3.5 15.5h13" stroke="currentColor" {...S} />
  </svg>
);

export const IconUpload = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M10 13V3M7 6l3-3 3 3M3.5 15.5h13" stroke="currentColor" {...S} />
  </svg>
);

export const IconImage = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M2.5 3.5h15a1 1 0 011 1v11a1 1 0 01-1 1h-15a1 1 0 01-1-1v-11a1 1 0 011-1zM1.5 13.5l4.5-5 3.5 4 2.5-2.5 4 5.5"
      stroke="currentColor" {...S}
    />
    <circle cx="6.5" cy="7.5" r="1" fill="currentColor" />
  </svg>
);

// ── Eraser (stroke eraser) — classic eraser parallelogram shape ───────────────
export const IconEraser = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    {/* Eraser body: parallelogram */}
    <path d="M17 17H6L2.5 13 11 5l6 6Z" stroke="currentColor" {...S} />
    {/* Inner divider line (highlight band) */}
    <path d="M5 14L7.5 11.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
);

// ── Eraser area — dashed rectangle with an X ──────────────────────────────────
export const IconEraserArea = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect
      x="3" y="4" width="14" height="12" rx="1"
      stroke="currentColor" strokeWidth={1.5}
      strokeDasharray="3 2" fill="none"
    />
    <path d="M8 8l4 4M12 8l-4 4" stroke="currentColor" {...S} />
  </svg>
);

// ── Undo — U-turn arrow pointing left ─────────────────────────────────────────
export const IconUndo = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    {/* Chevron arrowhead on the left */}
    <path d="M7.5 12.5L2.5 7.5L7.5 2.5" stroke="currentColor" {...S} />
    {/* U-curve going right then down */}
    <path d="M2.5 7.5H13a4.5 4.5 0 010 9H10" stroke="currentColor" {...S} />
  </svg>
);

// ── Redo — U-turn arrow pointing right ───────────────────────────────────────
export const IconRedo = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    {/* Chevron arrowhead on the right */}
    <path d="M12.5 12.5L17.5 7.5L12.5 2.5" stroke="currentColor" {...S} />
    {/* U-curve going left then down */}
    <path d="M17.5 7.5H7a4.5 4.5 0 000 9H10" stroke="currentColor" {...S} />
  </svg>
);

// ── Close / dismiss (modal, compact actions) ────────────────────────────────
export const IconX = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" {...S} />
  </svg>
);

// ── Sidebar collapse / expand ────────────────────────────────────────────────
export const IconChevronLeft = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M12.5 5L7.5 10l5 5" stroke="currentColor" {...S} />
  </svg>
);

export const IconChevronRight = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M7.5 5l5 5-5 5" stroke="currentColor" {...S} />
  </svg>
);

export const IconPlus = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M10 4v12M4 10h12" stroke="currentColor" {...S} />
  </svg>
);

// ── Background / Template picker ─────────────────────────────────────────────
export const IconGrid = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="2.5" y="2.5" width="15" height="15" rx="2"
      stroke="currentColor" strokeWidth={1.5} fill="none" />
    <path d="M2.5 8h15M2.5 13h15M8 2.5v15M13 2.5v15"
      stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" />
  </svg>
);
