import { defineConfig } from 'vite';

// Relative base so `dist/` works from any sub-path (e.g. a project page or a subfolder).
// cssTarget: browsers with native oklch() and color-mix() (Chrome/Edge 111, Firefox 113, Safari 16.4).
// Without it the CSS minifier rewrites every oklch() token to lab(), and color-mix(in oklch, <lab>,
// transparent) then loses its hue in Chromium and tints translucent surfaces pink. Older browsers
// still get the hex fallbacks from tokens.css (@supports not (color: oklch(0 0 0))).
export default defineConfig({
  base: './',
  build: { target: 'es2022', cssTarget: ['chrome111', 'edge111', 'firefox113', 'safari16.4'], assetsInlineLimit: 0 },
});
