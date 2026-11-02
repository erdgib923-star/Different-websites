// Checks WCAG 2.x contrast for every text/background pair listed in palette.config.mjs.
// Targets: body text 4.5:1, large text and UI components 3:1.
// It also fails if src/styles/tokens.css is out of date with the config, and writes the
// results table into README.md between the contrast-table markers.
// Run: npm run contrast
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrast, over } from './color.mjs';
import { loadConfig, resolvePalette, renderCss, TOKENS_PATH } from './palette.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = { body: 4.5, large: 3, ui: 3 };
const LABEL = { body: 'Body text', large: 'Large text', ui: 'UI / graphics' };

const cfg = await loadConfig();
const { primitives, themes } = resolvePalette(cfg);
let failed = 0;

if (!existsSync(TOKENS_PATH) || readFileSync(TOKENS_PATH, 'utf8') !== renderCss(cfg)) {
  console.error('✗ src/styles/tokens.css is stale. Run `npm run palette`.');
  failed++;
}

const lookup = (theme, name) => {
  const t = themes[theme];
  const c = t.get(name) ?? primitives.get(name);
  if (!c) throw new Error(`Unknown colour "${name}" in theme ${theme}`);
  return c;
};

const rows = [];
for (const p of cfg.pairs) {
  for (const theme of p.themes ?? Object.keys(themes)) {
    const fg = lookup(theme, p.fg), bg = lookup(theme, p.bg);
    const fgRgb = toRgb(fg), bRgb = toRgb(bg);
    // `alpha` models translucent text composited over the background.
    const fgFinal = p.alpha ? over(fgRgb, p.alpha, bRgb) : fgRgb;
    const ratio = contrast(fgFinal, bRgb);
    const target = TARGET[p.kind];
    const pass = ratio >= target;
    if (!pass) failed++;
    rows.push({ theme, fg: p.fg + (p.alpha ? ` @${p.alpha}` : ''), bg: p.bg, use: p.use ?? '', kind: p.kind, ratio, target, pass });
  }
}

function toRgb(c) {
  // triples carry hex; convert back (hex is the exact sRGB we ship as fallback; OKLCH maps to the same 8-bit value)
  const h = c.hex.slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

const table = [
  '| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |',
  '|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.theme} | \`${r.fg}\` | \`${r.bg}\` | ${r.use} | ${LABEL[r.kind]} | ${r.ratio.toFixed(2)}:1 | ${r.target}:1 | ${r.pass ? 'Pass' : '**FAIL**'} |`),
].join('\n');

console.log(table);
console.log(`\n${rows.length} pairs checked, ${rows.filter((r) => !r.pass).length} below target.`);

const readme = resolve(root, 'README.md');
if (existsSync(readme)) {
  const src = readFileSync(readme, 'utf8');
  const re = /(<!-- contrast-table:start -->)[\s\S]*?(<!-- contrast-table:end -->)/;
  if (re.test(src)) {
    writeFileSync(readme, src.replace(re, `$1\n${table}\n\n_${rows.length} pairs checked by \`npm run contrast\`; ${rows.filter((r) => !r.pass).length} below target._\n$2`));
    console.log('README.md contrast table updated.');
  }
}
process.exit(failed ? 1 : 0);
