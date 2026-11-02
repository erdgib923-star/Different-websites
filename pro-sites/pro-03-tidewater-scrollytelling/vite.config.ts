import { defineConfig, type Plugin } from 'vite';
// @ts-ignore — plain JS modules shared with the browser bundle
import { mapSvg, dataTables, landscapeSvg } from './src/static-map.js';
// @ts-ignore
import { tide, anomalyHexes, shoreChange } from './src/geo.js';

/** Injects the pre-rendered map, field prints, data tables and computed stats so the page works without JS. */
function atlasStatic(): Plugin {
  return {
    name: 'atlas-static',
    transformIndexHtml(html) {
      const t = tide().map((d: { h: number }) => d.h);
      const hex = anomalyHexes().map((d: { v: number }) => d.v);
      const sc = shoreChange().map((s: { segment: string; values: { m: number }[] }) => ({ s: s.segment, m: s.values[s.values.length - 1].m }));
      const worst = sc.reduce((a: { m: number }, b: { m: number }) => (b.m > a.m ? b : a));
      const stats: Record<string, string> = {
        RANGE: (Math.max(...t) - Math.min(...t)).toFixed(1),
        ANOM: (hex.reduce((a: number, b: number) => a + b, 0) / hex.length).toFixed(1),
        WORST: String(worst.m),
        WORST_SEG: worst.s,
        ZONES: String(hex.length),
      };
      return html
        .replace('<!--BASEMAP-->', mapSvg())
        .replace('<!--TABLES-->', dataTables())
        .replace(/<!--FIELD:(\d+):([^>]+)-->/g, (_m, seed, label) => landscapeSvg(Number(seed), label))
        .replace(/\{\{STAT:(\w+)\}\}/g, (_m, k) => stats[k] ?? '?');
    },
  };
}

export default defineConfig({ plugins: [atlasStatic()] });
