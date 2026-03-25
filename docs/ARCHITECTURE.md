# Architecture

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.7 |
| Build tool | Vite 6 |
| UI framework | React 19 |
| Canvas rendering | Konva 9 + react-konva |
| Global state | Zustand 5 with `persist` middleware |
| Routing | react-router-dom 7 (single route `/`) |
| Persistence | Browser `localStorage` (automatic via Zustand persist) |

## Directory Structure

```
src/
├── App.tsx                      # Root — Router only
├── main.tsx                     # React bootstrap
├── index.css                    # Global styles
├── components/
│   ├── boards/
│   │   ├── BoardList.tsx        # Sidebar: list, create, rename, delete boards
│   │   └── TemplatePreview.tsx  # Template thumbnail picker
│   ├── canvas/
│   │   ├── Canvas.tsx           # Konva stage, drawing, sticky note placement
│   │   └── CanvasBackground.tsx # Tiled background patterns (grid, dots, lines)
│   ├── notes/
│   │   └── StickyNote.tsx       # Draggable, resizable, editable sticky note
│   └── ui/
│       ├── AppLayout.tsx        # Shell: sidebar + toolbar + canvas area
│       ├── Toolbar.tsx          # Tool buttons, zoom, export controls
│       └── StyledComponents.tsx # Design system primitives (Button, Input, Modal…)
├── constants/
│   └── boardTemplates.ts        # Preset background templates
├── hooks/                       # (empty — add custom hooks here)
├── store/
│   └── boardStore.ts            # Zustand store — boards, elements, tool state
├── styles/
│   └── design-system.ts         # Color tokens, spacing, shadows
├── types/
│   └── shims.d.ts               # Ambient module declarations
└── utils/
    ├── exportUtils.ts           # PNG export (Konva toDataURL) + JSON export/import
    └── path.ts                  # Stroke smoothing (moving average) + RDP simplification
```

## Data Flow

```
User interaction
      │
      ▼
 React component
      │
      ▼
 useBoardStore()  ◄──── Zustand persist ────► localStorage
      │                  (auto-save on             "whiteboard-storage"
      ▼                   every set())
 State update
      │
      ▼
 Re-render
```

## State Shape

```ts
{
  boards: Board[];          // all boards with their elements
  currentBoardId: string | null;
  selectedElements: string[];
  currentTool: 'select' | 'pan' | 'sticky-note' | 'pen';
  zoomLevel: number;        // 0.1 – 5
  penColor: string;
  penWidth: number;
  smoothing: number;        // moving-average window 1–15
  simplify: boolean;        // apply Ramer–Douglas–Peucker
}
```

### Board element types

```ts
// StickyNote — rendered as Konva Rect + Text + Transformer
{ type: 'sticky-note'; content; position; size; color; zIndex }

// DrawingElement — rendered as Konva Line
{ type: 'drawing'; tool: 'pen'; points; strokeWidth; stroke; zIndex }
```

## Persistence

Zustand `persist` middleware automatically serializes and deserializes state to/from `localStorage` under the key `whiteboard-storage`. No manual save calls needed.

On first run, if no Zustand state exists, `onRehydrateStorage` checks the legacy key `whiteboard.boards` and migrates any existing boards (then deletes the old key).

## Stroke Processing Pipeline

```
Raw pointer events → toCanvasPoint (screen→canvas coords)
      │
      ▼
smoothMovingAverage (optional, reduces noise)
      │
      ▼
simplifyRDP (optional, reduces point count via Ramer–Douglas–Peucker)
      │
      ▼
Stored as points[] in DrawingElement
```

## Canvas Export

`Canvas.tsx` registers an export callback via `registerExportPNG()`. The Toolbar calls `triggerExportPNG()` which invokes `stage.toDataURL({ pixelRatio: 2 })` and triggers a download. This avoids prop drilling the stage ref.
