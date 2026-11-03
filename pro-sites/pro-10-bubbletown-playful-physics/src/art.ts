/**
 * Shared procedural art (used at build time by vite.config.ts for the no-JS markup, and at runtime).
 * Six pastels at identical OKLCH L/C; colours are referenced as CSS custom properties in SVG and
 * converted to rgb() for canvas.
 */
export const L = 0.86;
export const C = 0.068;
export const PASTELS = [
  { key: 'peach', name: 'Peach', h: 25 },
  { key: 'butter', name: 'Butter', h: 85 },
  { key: 'mint', name: 'Mint', h: 150 },
  { key: 'sky', name: 'Sky', h: 215 },
  { key: 'lilac', name: 'Lilac', h: 285 },
  { key: 'rose', name: 'Rose', h: 345 },
] as const;
export type PastelKey = (typeof PASTELS)[number]['key'];

/** OKLCH → sRGB string for canvas (gamut-safe values only; clamps as a last resort). */
export function oklchRgb(l: number, c: number, hDeg: number, a = 1) {
  const h = (hDeg * Math.PI) / 180, A = c * Math.cos(h), B = c * Math.sin(h);
  const lc = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const mc = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const sc = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const lin = [4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc, -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc, -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc];
  const [r, g, b] = lin.map((v) => {
    const x = Math.min(1, Math.max(0, v));
    return Math.round((x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055) * 255);
  });
  return `rgb(${r} ${g} ${b} / ${a})`;
}
export const pastelRgb = (i: number) => oklchRgb(L, C, PASTELS[i % 6].h);
// canvas copies of tokens (sRGB hex of --border-strong / --text / --paper, see src/styles/tokens.css)
export const PLUM = '#4e2d4e';
export const PLUM_TEXT = '#332033';
export const PAPER = '#fffcf3';

export type Face = 'smile' | 'sleepy' | 'wow';
export type Shape = 'round' | 'bear' | 'bunny' | 'cloud' | 'tall' | 'star';

function faceSvg(face: Face, cx: number, cy: number, s = 1) {
  const ex = 22 * s, ey = cy - 6 * s;
  const eyes =
    face === 'sleepy'
      ? `<path d="M${cx - ex - 9 * s} ${ey} q9 ${8 * s} 18 0 M${cx + ex - 9 * s} ${ey} q9 ${8 * s} 18 0" fill="none" stroke="var(--text)" stroke-width="${5 * s}" stroke-linecap="round"/>`
      : `<circle cx="${cx - ex}" cy="${ey}" r="${7 * s}" fill="var(--text)"/><circle cx="${cx + ex}" cy="${ey}" r="${7 * s}" fill="var(--text)"/>` +
        `<circle cx="${cx - ex + 2.5 * s}" cy="${ey - 2.5 * s}" r="${2.2 * s}" fill="var(--paper)"/><circle cx="${cx + ex + 2.5 * s}" cy="${ey - 2.5 * s}" r="${2.2 * s}" fill="var(--paper)"/>`;
  const mouth =
    face === 'wow'
      ? `<ellipse cx="${cx}" cy="${cy + 16 * s}" rx="${7 * s}" ry="${9 * s}" fill="var(--text)"/>`
      : `<path d="M${cx - 12 * s} ${cy + 12 * s} q12 ${12 * s} 24 0" fill="none" stroke="var(--text)" stroke-width="${5 * s}" stroke-linecap="round"/>`;
  const cheeks = `<circle cx="${cx - 38 * s}" cy="${cy + 10 * s}" r="${8 * s}" fill="var(--accent-ui)" opacity=".28"/><circle cx="${cx + 38 * s}" cy="${cy + 10 * s}" r="${8 * s}" fill="var(--accent-ui)" opacity=".28"/>`;
  return cheeks + eyes + mouth;
}

/** A soft bubble toy, 200×200 viewBox. `fill` is a CSS colour (usually var(--p-*)). */
export function toySvg(shape: Shape, fill: string, face: Face = 'smile', extra = '') {
  const o = `stroke="var(--border-strong)" stroke-width="6" stroke-linejoin="round"`;
  let body = '';
  let cy = 112;
  switch (shape) {
    case 'bear':
      body = `<circle cx="58" cy="58" r="24" fill="${fill}" ${o}/><circle cx="142" cy="58" r="24" fill="${fill}" ${o}/><circle cx="100" cy="112" r="70" fill="${fill}" ${o}/>`;
      break;
    case 'bunny':
      body = `<rect x="58" y="6" width="30" height="80" rx="15" fill="${fill}" ${o}/><rect x="112" y="6" width="30" height="80" rx="15" fill="${fill}" ${o}/><circle cx="100" cy="122" r="64" fill="${fill}" ${o}/>`;
      cy = 122;
      break;
    case 'cloud':
      body = `<path d="M44 150a34 34 0 0 1 4-66 46 46 0 0 1 86-14 38 38 0 0 1 26 80z" fill="${fill}" ${o}/>`;
      cy = 116;
      break;
    case 'tall':
      body = `<rect x="46" y="24" width="108" height="160" rx="54" fill="${fill}" ${o}/>`;
      cy = 104;
      break;
    case 'star':
      body = `<path d="M100 14l24 52 56 6-42 38 12 56-50-28-50 28 12-56-42-38 56-6z" fill="${fill}" ${o}/>`;
      cy = 108;
      break;
    default:
      body = `<circle cx="100" cy="106" r="80" fill="${fill}" ${o}/>`;
      cy = 108;
  }
  const shine = `<ellipse cx="70" cy="72" rx="16" ry="10" transform="rotate(-30 70 72)" fill="var(--paper)" opacity=".7"/>`;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${body}${shine}${faceSvg(face, 100, cy, shape === 'star' ? 0.7 : 1)}${extra}</svg>`;
}

export const WORD = 'BUBBLETOWN';

/** Static, tidy arrangement of the letter bubbles (no-JS and reduced-motion first paint). */
export function toyboxSvg() {
  const w = 1000, h = 520, r = 46;
  let out = '';
  const rows = [WORD.slice(0, 6), WORD.slice(6)];
  rows.forEach((row, ri) => {
    const y = h - r - 8 - (1 - ri) * (r * 2 + 4) - 4;
    const startX = w / 2 - ((row.length - 1) * (r * 2 + 6)) / 2;
    [...row].forEach((ch, i) => {
      const idx = ri * 6 + i;
      const x = startX + i * (r * 2 + 6);
      const rot = ((idx * 37) % 17) - 8;
      out += `<g transform="translate(${x} ${y}) rotate(${rot})"><circle r="${r}" fill="var(--p-${PASTELS[idx % 6].key})" stroke="var(--border-strong)" stroke-width="5"/><text y="17" text-anchor="middle" font-family="var(--display)" font-weight="700" font-size="52" fill="var(--text)">${ch}</text></g>`;
    });
  });
  // a few blank bubbles resting on top
  [[180, 300, 30], [820, 290, 36], [260, 120, 22], [760, 140, 26]].forEach(([x, y, rr], i) => {
    out += `<circle cx="${x}" cy="${y}" r="${rr}" fill="var(--p-${PASTELS[(i + 2) % 6].key})" stroke="var(--border-strong)" stroke-width="5"/>`;
  });
  return `<svg class="toybox__static" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">${out}</svg>`;
}

/** Sticker art (SVG strings), 160×160. */
export const STICKERS: { id: string; label: string; svg: string }[] = (() => {
  const s = (inner: string) => `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${inner}</svg>`;
  const edge = `stroke="var(--paper)" stroke-width="10" paint-order="stroke" stroke-linejoin="round"`;
  const line = `stroke="var(--border-strong)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;
  return [
    { id: 'pop', label: 'POP! sticker', svg: s(`<path d="M80 8l14 28 30-12-6 32 32 12-28 18 18 28-32-2-4 32-24-22-24 22-4-32-32 2 18-28-28-18 32-12-6-32 30 12z" fill="var(--p-butter)" ${edge}/><path d="M80 8l14 28 30-12-6 32 32 12-28 18 18 28-32-2-4 32-24-22-24 22-4-32-32 2 18-28-28-18 32-12-6-32 30 12z" fill="none" ${line}/><text x="80" y="92" text-anchor="middle" font-family="var(--display)" font-weight="700" font-size="34" fill="var(--text)">POP!</text>`) },
    { id: 'star', label: 'Smiling star sticker', svg: s(`<path d="M80 12l20 42 46 5-34 31 10 46-42-24-42 24 10-46-34-31 46-5z" fill="var(--p-peach)" ${edge}/><path d="M80 12l20 42 46 5-34 31 10 46-42-24-42 24 10-46-34-31 46-5z" fill="none" ${line}/><circle cx="68" cy="80" r="5" fill="var(--text)"/><circle cx="92" cy="80" r="5" fill="var(--text)"/><path d="M70 94q10 9 20 0" fill="none" ${line}/>`) },
    { id: 'cloud', label: 'Sleepy cloud sticker', svg: s(`<path d="M34 118a26 26 0 0 1 4-50 36 36 0 0 1 68-10 30 30 0 0 1 20 60z" fill="var(--p-sky)" ${edge}/><path d="M34 118a26 26 0 0 1 4-50 36 36 0 0 1 68-10 30 30 0 0 1 20 60z" fill="none" ${line}/><path d="M60 88q6 5 12 0M88 88q6 5 12 0" fill="none" ${line}/>`) },
    { id: 'boing', label: 'BOING sticker', svg: s(`<rect x="12" y="44" width="136" height="72" rx="36" fill="var(--p-mint)" ${edge}/><rect x="12" y="44" width="136" height="72" rx="36" fill="none" ${line}/><text x="80" y="92" text-anchor="middle" font-family="var(--display)" font-weight="700" font-size="34" fill="var(--text)">BOING</text>`) },
    { id: 'moon', label: 'Moon sticker', svg: s(`<path d="M104 20a62 62 0 1 0 36 96 50 50 0 1 1-36-96z" fill="var(--p-lilac)" ${edge}/><path d="M104 20a62 62 0 1 0 36 96 50 50 0 1 1-36-96z" fill="none" ${line}/><circle cx="62" cy="76" r="5" fill="var(--text)"/><path d="M56 96q10 8 20 0" fill="none" ${line}/>`) },
    { id: 'heart', label: 'Bubble heart sticker', svg: s(`<path d="M80 136C26 100 14 74 22 52c9-24 42-28 58-4 16-24 49-20 58 4 8 22-4 48-58 84z" fill="var(--p-rose)" ${edge}/><path d="M80 136C26 100 14 74 22 52c9-24 42-28 58-4 16-24 49-20 58 4 8 22-4 48-58 84z" fill="none" ${line}/><ellipse cx="50" cy="58" rx="10" ry="6" transform="rotate(-30 50 58)" fill="var(--paper)" opacity=".75"/>`) },
    { id: 'squish', label: 'Squish me sticker', svg: s(`<circle cx="80" cy="80" r="64" fill="var(--accent-ui)" ${edge}/><circle cx="80" cy="80" r="64" fill="none" ${line}/><text x="80" y="76" text-anchor="middle" font-family="var(--display)" font-weight="700" font-size="25" fill="var(--paper)">SQUISH</text><text x="80" y="104" text-anchor="middle" font-family="var(--display)" font-weight="700" font-size="25" fill="var(--paper)">ME</text>`) },
    { id: 'bubbles', label: 'Three bubbles sticker', svg: s(`<g ${edge}><circle cx="58" cy="94" r="38" fill="var(--p-sky)"/><circle cx="108" cy="62" r="30" fill="var(--p-rose)"/><circle cx="112" cy="118" r="20" fill="var(--p-butter)"/></g><g fill="none" ${line}><circle cx="58" cy="94" r="38"/><circle cx="108" cy="62" r="30"/><circle cx="112" cy="118" r="20"/></g>`) },
  ];
})();
