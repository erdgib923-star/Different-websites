import { defineConfig } from 'vite';

// Relative base so `dist/` works from any sub-path (e.g. a project page or a subfolder).
export default defineConfig({
  base: './',
  // p5 (~1 MB, 254 kB gzip) is a separate chunk loaded only when the poster lab nears the viewport.
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 1100 },
});
