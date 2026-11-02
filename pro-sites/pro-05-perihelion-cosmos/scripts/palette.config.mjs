// Halcyra: colour system.
// Space: near-black blue neutrals (h 262). Brand: deep space blue (h 262). Accent: warm star-gold (h 78).
// Planet palettes (imagery only): five OKLCH hue rotations of 68° from h 30, each at the SAME
// lightness/chroma steps, so no planet is visually "louder" than another.
const PLANET_HUES = [30, 98, 166, 234, 302];
const planets = {};
PLANET_HUES.forEach((h, i) => {
  planets[`planet-${i + 1}-dark`] = [0.34, 0.07, h];
  planets[`planet-${i + 1}`] = [0.64, 0.12, h];
  planets[`planet-${i + 1}-light`] = [0.86, 0.06, h];
});

export default {
  out: 'src/styles/tokens.css',
  ramps: {
    neutral: { hue: 262, chroma: 0.014, lMax: 0.97, lMin: 0.11, flat: true },
    brand: { hue: 262, chroma: 0.1, lMax: 0.95, lMin: 0.13 },
    accent: { hue: 78, chroma: 0.15, lMax: 0.97, lMin: 0.28, hueShift: -14 },
  },
  extra: planets,
  p3: { 'star-hi': [0.86, 0.17, 80] },
  semantic: {
    bg: 'neutral-950',
    surface: 'brand-950',
    'surface-2': 'brand-900',
    text: 'neutral-50',
    'text-muted': 'neutral-300',
    border: 'brand-800',
    'border-strong': 'brand-500',
    accent: 'accent-300',
    'accent-strong': 'accent-200',
    'accent-contrast': 'neutral-950',
    focus: 'accent-300',
    star: 'accent-200',
  },
  pairs: [
    ['text', 'bg', 4.5, 'Text on space'],
    ['text-muted', 'bg', 4.5, 'Muted text on space'],
    ['text', 'surface', 4.5, 'Text on HUD / card'],
    ['text-muted', 'surface', 4.5, 'Muted text on HUD / card'],
    ['accent', 'surface', 4.5, 'Gold readouts on HUD'],
    // cards/HUD are 86% opaque over the 3D scene; worst case behind them is the star's glow
    ['text-muted', { layer: 'surface', alpha: 0.86, over: 'star' }, 4.5, 'Muted text on card over star glow (worst case)'],
    ['accent', { layer: 'surface', alpha: 0.86, over: 'star' }, 4.5, 'Gold readout on HUD over star glow (worst case)'],
    ['text', { layer: 'surface', alpha: 0.86, over: 'planet-3-light' }, 4.5, 'Text on card over brightest planet limb'],
    ['accent-contrast', 'accent', 4.5, 'Button label on gold'],
    ['accent-contrast', 'accent-strong', 4.5, 'Button label on gold (hover)'],
    ['focus', 'bg', 3, 'Focus ring (UI)'],
    ['border-strong', 'surface', 3, 'Control outline (UI)'],
  ],
};
