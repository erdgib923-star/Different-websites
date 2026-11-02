import { defineConfig } from 'vite';

// Relative base so `dist/` works from any sub-path (e.g. a project page or a subfolder).
export default defineConfig({
  base: './',
  build: { target: 'es2022', assetsInlineLimit: 0 },
});
