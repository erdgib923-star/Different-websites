// Reads the generated tokens CSS, resolves every semantic token to its OKLCH value
// and checks each text/background pair in palette.config.mjs against its WCAG 2.x target.
// Exits with code 1 if any pair fails. Writes a Markdown table to scripts/contrast-report.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrastRgb, compositeRgb, parseOklch, toHex, toSrgb } from './color.mjs';
import config from './palette.config.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(here, '..', config.out), 'utf8')
  // ignore the display-p3 block: contrast is judged on the sRGB/OKLCH values every browser gets
  .replace(/@media \(color-gamut: p3\)[\s\S]*?\n}\n/, '');

const decls = {};
for (const m of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) decls[m[1]] = m[2].trim();

function resolveToken(name, theme, depth = 0) {
  if (depth > 10) throw new Error(`cycle at ${name}`);
  let v = decls[name];
  if (!v) throw new Error(`unknown token --${name}`);
  const ld = v.match(/^light-dark\((.+),\s*(.+)\)$/);
  if (ld) v = theme === 'dark' ? ld[2] : ld[1];
  const ref = v.match(/^var\(--([\w-]+)\)$/);
  if (ref) return resolveToken(ref[1], theme, depth + 1);
  const c = parseOklch(v);
  if (!c) throw new Error(`--${name} is not an oklch() value: ${v}`);
  return c;
}

// A pair side is a token name, or { layer, alpha, over } for a translucent layer composited
// over another token (e.g. a frosted-glass card over the brightest colour that can sit behind it).
function resolveSide(side, theme) {
  if (typeof side === 'string') {
    const c = resolveToken(side, theme);
    return { rgb: toSrgb(...c), name: `\`--${side}\` ${toHex(...c)}` };
  }
  const top = toSrgb(...resolveToken(side.layer, theme));
  const bottom = toSrgb(...resolveToken(side.over, theme));
  const rgb = compositeRgb(top, side.alpha, bottom);
  const hex = '#' + rgb.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  return { rgb, name: `\`--${side.layer}\` @${Math.round(side.alpha * 100)}% over \`--${side.over}\` = ${hex}` };
}

const themes = config.themes ?? ['default'];
const rows = [];
let failed = 0;
for (const theme of themes) {
  for (const [fg, bg, target, label] of config.pairs) {
    const a = resolveSide(fg, theme), b = resolveSide(bg, theme);
    const ratio = contrastRgb(a.rgb, b.rgb);
    const ok = ratio >= target;
    if (!ok) failed++;
    rows.push(`| ${themes.length > 1 ? theme + ' · ' : ''}${label} | ${a.name} | ${b.name} | ${ratio.toFixed(2)}:1 | ${target}:1 | ${ok ? 'pass' : '**FAIL**'} |`);
  }
}

const table = [
  '| Pair | Foreground | Background | Ratio | Target | Result |',
  '|---|---|---|---|---|---|',
  ...rows,
].join('\n');
writeFileSync(resolve(here, 'contrast-report.md'), table + '\n');
console.log(table);
console.log(failed ? `\n${failed} pair(s) below target` : `\nAll ${rows.length} pairs meet their targets.`);
process.exit(failed ? 1 : 0);
