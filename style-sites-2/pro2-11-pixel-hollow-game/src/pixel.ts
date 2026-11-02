/**
 * Tiny pixel engine. Sprites are arrays of strings, one character per pixel, drawn in the fixed
 * 16-colour palette (resolved from the OKLCH tokens at start-up). Sprites are rasterised once per
 * palette variant into small canvases, then blitted with imageSmoothing off.
 */
export const KEY: Record<string, string> = {
  k: '--ink', c: '--cream', G: '--grass-d', g: '--grass', l: '--grass-l', S: '--soil-d', s: '--soil', w: '--wood-l',
  B: '--sky-d', b: '--sky', i: '--sky-l', y: '--sun', h: '--wheat', r: '--berry', p: '--berry-l', u: '--dusk',
};

const hexCache = new Map<string, string>();
let probe: CanvasRenderingContext2D | null = null;
/** Resolve a CSS custom property to #rrggbb by painting one pixel (works for oklch/lab output). */
export function hex(varName: string): string {
  if (hexCache.has(varName)) return hexCache.get(varName)!;
  probe ??= Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true })!;
  probe.fillStyle = '#000';
  probe.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000';
  probe.clearRect(0, 0, 1, 1);
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  const out = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  hexCache.set(varName, out);
  return out;
}
export const rgb = (ch: string): [number, number, number] => {
  const h = hex(KEY[ch]);
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
};

/** Palette swaps used for dusk and night (pixel games recolour, they don't tint). */
export const SWAP: Record<string, Record<string, string>> = {
  day: {},
  dusk: { l: 'g', g: 'G', i: 'p', b: 'B', w: 's', h: 'w', c: 'w' },
  night: { l: 'G', g: 'G', G: 'u', i: 'B', b: 'u', B: 'u', w: 'S', s: 'S', h: 's', y: 'h', c: 'i', r: 'S', p: 'u' },
};

export type Sprite = string[];
const spriteCache = new Map<string, HTMLCanvasElement>();
export function rasterise(name: string, sprite: Sprite, swap = 'day', flip = false): HTMLCanvasElement {
  const key = `${name}|${swap}|${flip}`;
  const hit = spriteCache.get(key);
  if (hit) return hit;
  const w = sprite[0].length, h = sprite.length;
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
  const x = c.getContext('2d')!;
  const map = SWAP[swap];
  sprite.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === '.') return;
    const col = map[ch] ?? ch;
    x.fillStyle = hex(KEY[col]);
    x.fillRect(flip ? w - 1 - i : i, j, 1, 1);
  }));
  spriteCache.set(key, c);
  return c;
}
export function draw(ctx: CanvasRenderingContext2D, name: string, sprite: Sprite, x: number, y: number, swap = 'day', flip = false) {
  ctx.drawImage(rasterise(name, sprite, swap, flip), Math.round(x), Math.round(y));
}

/** 4 × 4 Bayer matrix, normalised to 0..1, for ordered dithering between two palette colours. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];

export function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ sprites */
const HEAD = [
  '...hhhhhh...',
  '..hhhhhhhh..',
  '.hhhhhhhhhh.',
  '...pppppp...',
  '...pkppkp...',
  '...pppppp...',
  '....pppp....',
  '..bbbbbbbb..',
  '.pbbbbbbbbp.',
  '.pbbbbbbbbp.',
  '..bbbbbbbb..',
  '...SSSSSS...',
];
export const FARMER: Sprite[] = [
  [...HEAD, '...SS..SS...', '...SS..SS...', '..kkk..kkk..'],
  [...HEAD, '...SS.SS....', '..SS...SS...', '.kkk...kkk..'],
];
export const CHICKEN: Sprite = [
  '......rr..',
  '.....cccc.',
  '.....ckcch',
  '.cc.cccc..',
  'cccccccc..',
  'cccccccc..',
  '.cccccc...',
  '..h..h....',
];
export const SEED: Sprite = ['.hh.', 'hwwh', 'hwwh', '.hh.'];
export const CROP: Sprite[] = [
  ['..........', '..........', '..........', '..........', '..........', '..........', '..........', '....hh....', '..........'],
  ['..........', '..........', '..........', '..........', '....l.....', '...lgl....', '....g.....', '....g.....', '..........'],
  ['..........', '..........', '..l...l...', '.lgl.lgl..', '..lglgl...', '...lgl....', '....g.....', '....g.....', '..........'],
  ['....h.....', '...hyh.h..', '..h.hyhyh.', '.hyh.hgh..', '..hgh.g...', '...ggg....', '....g.....', '....g.....', '..........'],
];
export const TREE: Sprite = [
  '.....gggggg.....',
  '...gglglggggg...',
  '..ggllgggglggg..',
  '.gglggggGggglgg.',
  '.ggggGgglgggggg.',
  'gglgggggggGgggg.',
  'ggggGglggggglgg.',
  '.ggggggGggggGgg.',
  '.gGgggggglgggg..',
  '..ggGgggggggg...',
  '....ggGGgGg.....',
  '.......Ss.......',
  '.......Ss.......',
  '.......Ss.......',
  '......SSss......',
];
export const HOUSE: Sprite = [
  '..........rrrr..........',
  '........rrrrrrrr........',
  '......rrrrrrrrrrrr......',
  '....rrrrrrrrrrrrrrrr....',
  '..rrrrrrrrrrrrrrrrrrrr..',
  'rrrrrrrrrrrrrrrrrrrrrrrr',
  '..wwwwwwwwwwwwwwwwwwww..',
  '..wwwwwwwwwwwwwwwwwwww..',
  '..wwbbbbwwwwwwwwbbbbww..',
  '..wwbiibwwwSSwwwbiibww..',
  '..wwbbbbwwwSSwwwbbbbww..',
  '..wwwwwwwwwSSwwwwwwwww..',
  '..wwwwwwwwwSySwwwwwwww..',
  '..wwwwwwwwwSSwwwwwwwww..',
  '..ssssssssssssssssssss..',
];
export const CLOUD: Sprite = ['....cccc.......', '..cccccccc.....', '.cccccccccccc..', 'ccccccccccccccc', '.ccccccccccccc.'];
export const SUN: Sprite = ['...yyyy...', '..yyyyyy..', '.yyyyyyyy.', 'yyyyyyyyyy', 'yyyyyyyyyy', 'yyyyyyyyyy', 'yyyyyyyyyy', '.yyyyyyyy.', '..yyyyyy..', '...yyyy...'];
export const MOON: Sprite = ['..cccc..', '.ccccc..', 'cccc....', 'ccc.....', 'ccc.....', 'cccc....', '.ccccc..', '..cccc..'];
export const FENCE: Sprite = ['.w...w...', 'wwwwwwwww', '.w...w...', '.w...w...', 'wwwwwwwww', '.w...w...', '.s...s...'];
export const COIN: Sprite = ['.yy.', 'yhhy', 'yhhy', '.yy.'];
