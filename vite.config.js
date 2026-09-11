import { defineConfig } from 'vite';

// Vite configuration for SMIP.
// Kept intentionally minimal for Phase 1 - no extra plugins are needed yet.
// Future phases (e.g. adding a UI framework, testing, or bundling physics
// worker modules) can extend this file without touching project structure.
export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    open: true, // Automatically opens the browser on `npm run dev`
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
