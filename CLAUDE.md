# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Vue 3 + TypeScript + Vite web application - an AI-powered "Draw and Guess" game where users draw on a canvas and AI recognizes the content using Zhipu AI or Ollama local models.

## Development Commands

```bash
npm run dev     # Start development server on http://localhost:3000
npm run build   # Build for production (vue-tsc && vite build)
npm run preview # Preview production build locally
```

## Project Structure

```
src/
├── main.ts           # Application entry point
├── App.vue           # Root component (renders Game component)
├── types/
│   └── game.d.ts     # TypeScript interfaces: Stroke, Point, BrushConfig, GameStatus, GuessResultData
├── services/
│   └── imageRecognizer.ts  # AI image recognition service (Zhipu API & Ollama support)
├── components/
│   ├── DrawingCanvas.vue   # Canvas drawing component with toolbar
│   └── GuessResult.vue     # Game results panel with score/timer
├── composables/
│   └── useDrawing.ts       # Drawing logic: stroke history, undo/redo, canvas operations
├── utils/
│   └── canvasHelper.ts     # Canvas helpers: getEventPosition, clearCanvas, saveCanvas
├── views/
│   └── Game.vue            # Main game page layout and orchestration
└── vite-env.d.ts           # TypeScript declarations for Vite
```

## Key Architecture Patterns

### Component Communication Flow

1. **Game.vue** is the master controller:
   - Manages global state: `guesses`, `timeLeft`, `score`, `gameStatus`
   - Orchestrates game lifecycle: start, submit, end, restart
   - Calls AI recognition via `imageRecognizer.ts`

2. **DrawingCanvas.vue** handles user input:
   - Uses `useDrawing` composable for canvas operations
   - Emits events: `check`, `clear`, `update:image`
   - Supports mouse and touch drawing with stroke history (undo/redo)

3. **GuessResult.vue** displays results:
   - Shows timer, progress bar, submission list
   - Displays score statistics and accuracy metrics

### State Management

- No external state management - uses Vue Composition API `ref()` and `reactive()`
- Props pass down config (`maxGuesses`, `baseScore`)
- Events bubble up changes (`emit('check')`, `emit('clear')`)

### AI Recognition Service (`services/imageRecognizer.ts`)

Supports two backends configured via `.env`:

- **Zhipu AI** (default): Uses `cogview-3.5` model
- **Ollama**: Local model (default: `qwen2.5-vl:7b` at `http://localhost:11434`)

Fallback mechanism: If API fails, returns random word from preset pool.

## Environment Configuration

Create a `.env` file with:

```env
VITE_ZHIPU_API_KEY=your_api_key_here
VITE_USE_OLLAMA=false      # Set to 'true' to use Ollama
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=qwen2.5-vl:7b
```

## Code Conventions

- File naming: PascalCase for components (`*.vue`), camelCase for utilities/composables
- TypeScript strict mode enabled via `tsconfig.json`
- Path alias: `@/` points to `src/` directory
- All styles use scoped `<style>` in Vue components
- Functions are arrow functions; variables use `const` by default with `let` only when reassignment needed

## Canvas Drawing Implementation

The drawing system uses a stroke-based approach:

```typescript
interface Stroke {
  points: Point[]    // Array of {x, y} coordinates
  color: string
  lineWidth: number
}
```

History stack enables undo/redo by maintaining array of strokes and current index pointer. Re-drawing clears and replays all strokes up to current index.

## Known Behaviors

- Random correctness determination (40% chance of correct guess) - placeholder for actual validation
- Confidence score is mock-generated (random 60-100%)
- Score formula: `baseScore * multiplier * timeEfficiency` where multiplier is 2x for correct, 0.5x for incorrect
