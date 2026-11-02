import { defineConfig, type Plugin } from 'vite';
// @ts-ignore: plain JS module shared with the browser bundle
import { blobPath, sprigSvg, cabinArt } from './src/botanica.js';

/** Injects the first frame of every generated botanical so the page is complete without JavaScript. */
function botanica(): Plugin {
  return {
    name: 'botanica',
    transformIndexHtml(html) {
      return html
        .replace(/<!--BLOB:(\d+):([\d.]+):([\d.]+):([\d.]+)-->/g, (_m, seed, cx, cy, r) => blobPath(Number(seed), 0, { cx: Number(cx), cy: Number(cy), r: Number(r) }))
        .replace(/<!--SPRIG:(\d+):(\w+)-->/g, (_m, seed, v) => sprigSvg(Number(seed), v))
        .replace(/<!--CABIN:(\d+):(\w+)-->/g, (_m, seed, v) => cabinArt(Number(seed), v));
    },
  };
}

export default defineConfig({ plugins: [botanica()] });
