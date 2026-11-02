import { defineConfig, type Plugin } from 'vite';
// @ts-ignore: plain JS module of drawing generators
import { elevation, floorPlan, axo } from './src/drawings.js';

/** Pre-renders every technical drawing into index.html (complete without JavaScript). */
function drawings(): Plugin {
  return {
    name: 'drawings',
    transformIndexHtml(html) {
      return html
        .replace(/<!--ELEV:(\d+):(\w+):(\w+):(\w+)-->/g, (_m, seed, state, dims, roof) => elevation(Number(seed), { state, dims: dims === 'dims', roof: roof === 'auto' ? undefined : roof }))
        .replace('<!--PLAN-->', floorPlan())
        .replace(/<!--AXO:(\w+)-->/g, (_m, stage) => axo(stage));
    },
  };
}

export default defineConfig({ plugins: [drawings()] });
