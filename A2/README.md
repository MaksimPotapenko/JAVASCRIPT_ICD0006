# Assignment 2: TypeScript Task Manager

Browser-based task manager built with TypeScript, then compiled to JavaScript for the browser.

## Requirements Covered

- TypeScript modules and interfaces
- CRUD operations for tasks
- Browser storage via `localStorage`
- Extra features including categories, recurrence, dependencies, statistics, and sorting
- AI assistance evidence in `AI_codex.md`

## Project Files

- `index.html` - UI structure
- `styles.css` - page styling
- `src/` - TypeScript source files
- `dist/` - compiled browser-ready JavaScript
- `tsconfig.json` - TypeScript compiler configuration
- `package.json` - build and local serve scripts
- `AI_codex.md` - AI-assisted development notes
- `assigment_plan.md` - assignment planning notes

## How To Run

Install dependencies if needed:

```bash
npm ci
```

Build the TypeScript project:

```bash
npm run build
```

Then open `index.html` in a browser or serve the folder locally:

```bash
npm run serve
```

## Deployment Path

When deployed through the course VPS container, this project is served from:

- `/a2/`
- `https://mpotap.proxy.itcollege.ee/a2/` if `mpotap` is your assigned proxy hostname
