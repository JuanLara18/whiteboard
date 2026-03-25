# Contributing

Thanks for your interest in contributing! This is a small, focused project — PRs and issues are welcome.

## Development Setup

```bash
git clone https://github.com/JuanLara18/whiteboard.git
cd whiteboard
npm install
npm run dev
```

The dev server runs at [http://localhost:5173](http://localhost:5173) with hot-module replacement.

## Other Commands

```bash
npm run build    # production build → dist/
npm run preview  # preview the production build locally
npm run lint     # ESLint
```

## Project Conventions

- **TypeScript** — all new code should be typed. Avoid `any` where possible.
- **Inline styles** — UI uses inline styles + tokens from `src/styles/design-system.ts`. Prefer extending the design system over arbitrary values.
- **No external UI library** — the component primitives live in `src/components/ui/StyledComponents.tsx`. Add new primitives there.
- **State in Zustand** — all persistent state goes through `useBoardStore`. Component-local UI state (modals, hover) stays in `useState`.
- **No side effects in actions** — store actions only call `set()`. Persistence happens automatically via Zustand middleware.

## Adding a New Tool

1. Add the tool id to the `currentTool` union type in `boardStore.ts`
2. Add the button + shortcut to `Toolbar.tsx`
3. Add the shortcut handler in `AppLayout.tsx`
4. Handle the tool's pointer events in `Canvas.tsx`
5. If the tool produces a new element type, add the interface to `boardStore.ts` and the render code in `Canvas.tsx`

## Adding a New Background Template

Edit `src/constants/boardTemplates.ts` and add an entry to `BOARD_TEMPLATES`. The `CanvasBackground` component reads the template's `background` object to draw the pattern.

## Ideas for Contributions

- Shape tools (rectangle, ellipse, arrow, line)
- Text tool (standalone text box)
- Eraser tool
- Undo / redo (Zustand temporal middleware)
- Dark mode
- Board thumbnails in the sidebar
- Keyboard shortcut help modal (`?` key)
- Tauri or Electron wrapper for a true desktop app

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Add a short description of what changed and why
- Make sure `npm run lint` and `npm run build` pass
