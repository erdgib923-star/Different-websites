// Atlas & Ember colour system. Single source of truth for tokens + contrast checks.
// Harmony: analogous warm (neutral h≈62, bone h≈80, ember h≈42), one accent hue.
export default {
  out: 'app/tokens.css',
  ramps: {
    // warm near-black → bone neutral, chroma kept in the 0.005–0.02 band
    neutral: { hue: 62, chroma: 0.016, lMax: 0.975, lMin: 0.13, flat: true },
    // "bone / ash" brand ramp: low-chroma warm sand used for type and paper planes
    brand: { hue: 80, chroma: 0.045, lMax: 0.97, lMin: 0.17 },
    // ember accent (the only accent hue)
    accent: { hue: 42, chroma: 0.2, lMax: 0.96, lMin: 0.2, hueShift: -8 },
  },
  p3: {
    // wide-gamut ember for glows / cursor only (never for text)
    'ember-hi': [0.7, 0.24, 40],
  },
  semantic: {
    bg: 'neutral-950',
    surface: 'neutral-900',
    'surface-2': 'neutral-800',
    text: 'brand-50',
    'text-muted': 'neutral-300',
    border: 'neutral-700',
    'border-strong': 'neutral-500',
    accent: 'accent-400',
    'accent-strong': 'accent-300',
    'accent-contrast': 'neutral-950',
    focus: 'accent-300',
    paper: 'brand-100',
    ink: 'neutral-950',
    'ink-muted': 'neutral-700',
    shadow: 'neutral-950',
  },
  pairs: [
    ['text', 'bg', 4.5, 'Body text on page'],
    ['text', 'surface', 4.5, 'Body text on surface'],
    ['text', 'surface-2', 4.5, 'Body text on raised surface'],
    ['text-muted', 'bg', 4.5, 'Muted text on page'],
    ['text-muted', 'surface', 4.5, 'Muted text on surface'],
    ['text-muted', 'surface-2', 4.5, 'Muted text on raised surface'],
    ['accent', 'bg', 4.5, 'Ember links / labels on page'],
    ['accent', 'surface', 4.5, 'Ember labels on surface'],
    ['accent-contrast', 'accent', 4.5, 'Button label on ember'],
    ['accent-contrast', 'accent-strong', 4.5, 'Button label on ember (hover)'],
    ['focus', 'bg', 3, 'Focus ring vs page (UI)'],
    ['border-strong', 'bg', 3, 'Control outlines (UI)'],
    ['ink', 'paper', 4.5, 'Ink text on bone paper section'],
    ['ink-muted', 'paper', 4.5, 'Muted ink on bone paper'],
    ['accent-contrast', 'text', 4.5, 'Cursor label on bone'],
  ],
};
