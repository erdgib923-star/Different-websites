// Echoes of Static: colour system.
// Six tracks, six OKLCH hues 60° apart at IDENTICAL lightness and chroma. The page interpolates the
// hue between tracks as you scroll (shortest path), so contrast stays constant at every hue.
// The per-track tokens below exist so this script can check every hue; the live page derives the
// same colours from a single CSS variable (--h) in src/styles/main.css.
export const TRACK_HUES = [20, 80, 140, 200, 260, 320];
const extra = {};
TRACK_HUES.forEach((h, i) => {
  extra[`t${i + 1}-bg`] = [0.17, 0.035, h];
  extra[`t${i + 1}-surface`] = [0.235, 0.045, h];
  extra[`t${i + 1}-accent`] = [0.8, 0.13, h];
  extra[`t${i + 1}-muted`] = [0.8, 0.025, h];
});
export default {
  out: 'src/styles/tokens.css',
  ramps: {
    neutral: { hue: 20, chroma: 0.012, lMax: 0.97, lMin: 0.13, flat: true },
    brand: { hue: 20, chroma: 0.13, lMax: 0.95, lMin: 0.17 },
  },
  extra,
  p3: { 'signal-hi': [0.8, 0.2, 20] },
  semantic: {
    bg: 't1-bg',
    surface: 't1-surface',
    text: 'neutral-50',
    'text-muted': 't1-muted',
    accent: 't1-accent',
    'accent-contrast': 'neutral-950',
    border: 'neutral-600',
    focus: 'neutral-50',
  },
  pairs: TRACK_HUES.flatMap((h, i) => {
    const n = i + 1;
    return [
      ['neutral-50', `t${n}-bg`, 4.5, `Track ${n} (h ${h}) · text on page`],
      [`t${n}-muted`, `t${n}-bg`, 4.5, `Track ${n} · muted text on page`],
      [`t${n}-accent`, `t${n}-bg`, 4.5, `Track ${n} · accent text on page`],
      ['neutral-50', `t${n}-surface`, 4.5, `Track ${n} · text on card`],
      [`t${n}-muted`, `t${n}-surface`, 4.5, `Track ${n} · muted on card`],
      ['neutral-950', `t${n}-accent`, 4.5, `Track ${n} · label on accent button`],
    ];
  }).concat([['neutral-600', 't1-bg', 1.5, 'Hairline borders (decorative)']]),
};
