/**
 * Seeded, seamless terrazzo + squiggle tiles, generated as SVG.
 *
 * - Chips: irregular 5–9-sided stones placed by rejection sampling on a torus (distance wraps
 *   around the tile edges), so nothing overlaps across the seam either.
 * - Squiggles: sine-wave strokes with round caps. Confetti: dots, rings and tiny triangles.
 * - Every element that crosses an edge is also drawn on the opposite side, so the tile repeats
 *   with no visible seam. Same seed + settings = same tile.
 */
export const TILE = 400;

export function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Params { seed: number; density: number; size: number; squiggles: number; confetti: number; palette: PaletteName }
export type PaletteName = 'house' | 'sorbet' | 'night' | 'mono';
/** Palettes are lists of CSS custom properties; resolve() turns them into hex for SVG output. */
export const PALETTES: Record<PaletteName, { label: string; bg: string; chips: string[]; lines: string[] }> = {
  house: { label: 'House', bg: '--offwhite', chips: ['--teal', '--pink', '--yellow', '--ink'], lines: ['--ink', '--teal', '--pink'] },
  sorbet: { label: 'Sorbet', bg: '--accent-100', chips: ['--brand-300', '--yellow', '--accent-400', '--lilac', '--paper'], lines: ['--brand-700', '--accent-600'] },
  night: { label: 'Night', bg: '--ink', chips: ['--teal', '--pink', '--yellow', '--offwhite'], lines: ['--yellow', '--pink', '--offwhite'] },
  mono: { label: 'Mono', bg: '--offwhite', chips: ['--neutral-900', '--neutral-600', '--neutral-400', '--neutral-300'], lines: ['--neutral-800'] },
};

/** Resolve any CSS colour (oklch, lab, hex…) to #rrggbb by painting one pixel. */
const cache = new Map<string, string>();
let ctx2d: CanvasRenderingContext2D | null = null;
export function resolve(varName: string): string {
  const key = varName;
  if (cache.has(key)) return cache.get(key)!;
  const css = getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000';
  ctx2d ??= Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true })!;
  ctx2d.clearRect(0, 0, 1, 1);
  ctx2d.fillStyle = '#000';
  ctx2d.fillStyle = css;
  ctx2d.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx2d.getImageData(0, 0, 1, 1).data;
  const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  cache.set(key, hex);
  return hex;
}

const f = (n: number) => n.toFixed(1);

/** Emit `markup` at (x, y), plus wrapped copies wherever its radius crosses a tile edge. */
function wrapped(x: number, y: number, rad: number, markup: (x: number, y: number) => string) {
  let out = '';
  for (const dx of [-TILE, 0, TILE]) for (const dy of [-TILE, 0, TILE]) {
    const cx = x + dx, cy = y + dy;
    if (cx + rad < 0 || cx - rad > TILE || cy + rad < 0 || cy - rad > TILE) continue;
    out += markup(cx, cy);
  }
  return out;
}

export interface Layers { bg: string; chips: string; squiggles: string; confetti: string }

export function generate(p: Params): Layers {
  const r = mulberry32(p.seed);
  const pal = PALETTES[p.palette];
  const chipCols = pal.chips.map(resolve);
  const lineCols = pal.lines.map(resolve);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];

  // Chips: toroidal rejection sampling.
  const placed: { x: number; y: number; rad: number }[] = [];
  let chips = '';
  for (let tries = 0; placed.length < p.density && tries < p.density * 40; tries++) {
    const rad = (7 + r() * r() * 26) * p.size;
    const x = r() * TILE, y = r() * TILE;
    const ok = placed.every((q) => {
      let dx = Math.abs(q.x - x), dy = Math.abs(q.y - y);
      dx = Math.min(dx, TILE - dx); dy = Math.min(dy, TILE - dy);
      return Math.hypot(dx, dy) > (q.rad + rad) * 0.92 + 3;
    });
    if (!ok) continue;
    placed.push({ x, y, rad });
    const sides = 5 + Math.floor(r() * 5);
    const rot = r() * Math.PI * 2;
    const pts: [number, number][] = [];
    for (let i = 0; i < sides; i++) {
      const a = rot + (i / sides) * Math.PI * 2 + (r() - 0.5) * 0.5;
      const rr = rad * (0.62 + r() * 0.38);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    const col = pick(chipCols);
    chips += wrapped(x, y, rad, (cx, cy) => `<path d="M${pts.map(([px, py]) => `${f(cx + px)} ${f(cy + py)}`).join('L')}Z" fill="${col}"/>`);
  }

  // Squiggles: sine strokes.
  let squiggles = '';
  for (let i = 0; i < p.squiggles; i++) {
    const len = 50 + r() * 80, amp = 5 + r() * 8, waves = 2 + Math.floor(r() * 3);
    const x = r() * TILE, y = r() * TILE, rot = r() * 180;
    let d = '';
    for (let s = 0; s <= 24; s++) {
      const t = s / 24;
      d += `${s ? 'L' : 'M'}${f(t * len - len / 2)} ${f(Math.sin(t * waves * Math.PI * 2) * amp)}`;
    }
    const col = pick(lineCols);
    squiggles += wrapped(x, y, len / 2 + amp, (cx, cy) => `<path d="${d}" transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})" fill="none" stroke="${col}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  // Confetti.
  let confetti = '';
  for (let i = 0; i < p.confetti; i++) {
    const x = r() * TILE, y = r() * TILE, kind = r();
    const col = pick([...lineCols, ...chipCols]);
    if (kind < 0.5) confetti += wrapped(x, y, 4, (cx, cy) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(1.8 + r() * 2)}" fill="${col}"/>`);
    else if (kind < 0.75) confetti += wrapped(x, y, 7, (cx, cy) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="5" fill="none" stroke="${col}" stroke-width="2"/>`);
    else {
      const rot = r() * 360;
      confetti += wrapped(x, y, 7, (cx, cy) => `<path d="M0 -6L5.5 4H-5.5Z" transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})" fill="${col}"/>`);
    }
  }

  return { bg: resolve(pal.bg), chips, squiggles, confetti };
}

export function toSvg(l: Layers): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE} ${TILE}" width="${TILE}" height="${TILE}"><rect width="${TILE}" height="${TILE}" fill="${l.bg}"/><g>${l.chips}</g><g>${l.squiggles}</g><g>${l.confetti}</g></svg>`;
}

export const dataUri = (svg: string) => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
