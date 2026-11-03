import { defineConfig, type Plugin } from 'vite';
import { toySvg, toyboxSvg, STICKERS, type Shape, type Face } from './src/art';

/** Pre-renders the toy art, toy box and stickers into index.html so the page is complete without JS. */
function bubbleStatic(): Plugin {
  return {
    name: 'bubbletown-static',
    transformIndexHtml(html) {
      return html
        .replace('<!--TOYBOX-->', toyboxSvg())
        .replace(/<!--TOY:(\w+):(\w+):(\w+)-->/g, (_m, shape, color, face) => toySvg(shape as Shape, `var(--p-${color})`, face as Face))
        .replace(/<!--STICKER:(\w+)-->/g, (_m, id) => STICKERS.find((s) => s.id === id)?.svg ?? '');
    },
  };
}

export default defineConfig({ plugins: [bubbleStatic()] });
