<div align="center">

# 🎨 Whiteboard

**A lightweight, local-first whiteboard that lives in your browser.**  
Sketch ideas, add sticky notes, draw freely — everything saves automatically. No account needed.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite)](https://vitejs.dev)
[![GitHub Stars](https://img.shields.io/github/stars/JuanLara18/whiteboard?style=social)](https://github.com/JuanLara18/whiteboard)

</div>

---

## ✨ Features

- **Multiple boards** — create as many as you need, each with its own name and template
- **Freehand drawing** — pen tool with smoothing and stroke simplification
- **Sticky notes** — drag, resize, and double-click to edit
- **Background templates** — plain, grid, dot grid, ruled lines
- **Zoom & pan** — mouse wheel to zoom, drag to pan
- **Auto-save** — boards persist in your browser's localStorage, no setup required
- **Export to PNG** — one click to save your board as an image
- **Export / Import JSON** — back up boards or share them with others
- **Keyboard shortcuts** — work fast without touching the mouse

---

## 🚀 Get Started in 3 Steps

```bash
# 1. Clone the repo
git clone https://github.com/JuanLara18/whiteboard.git
cd whiteboard

# 2. Install dependencies
npm install

# 3. Start the app
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — that's it. No database, no backend, no config.

> **No Node.js?** Download it at [nodejs.org](https://nodejs.org) (LTS version). It takes 2 minutes.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `S` | Select tool |
| `P` | Pan tool |
| `N` | Sticky note tool |
| `D` | Draw (pen) tool |
| `Delete` / `Backspace` | Delete selected elements |
| `Escape` | Switch back to Select tool |
| Scroll wheel | Zoom in / out |

---

## 🖼️ Screenshot

<!-- Add a screenshot here after running the app -->
> _Run the app and take a screenshot to add here!_  
> Replace this section with: `![Whiteboard screenshot](docs/screenshot.png)`

---

## 📦 Export & Backup

**Export as PNG** — click the `PNG` button in the toolbar to download the current board as an image.

**Export as JSON** — click `Export` to save a `.whiteboard.json` file you can share or back up.

**Import JSON** — click `Import` to load a board from a file. It is added as a new board so nothing gets overwritten.

---

## 🛠️ Build for Production

```bash
npm run build
# Output goes to dist/ — serve it with any static file server
```

---

## 🤝 Contributing

Contributions are welcome! See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for development setup and guidelines.

For architecture details and design decisions, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 📄 License

MIT © [JuanLara18](https://github.com/JuanLara18) — see [LICENSE](LICENSE)
