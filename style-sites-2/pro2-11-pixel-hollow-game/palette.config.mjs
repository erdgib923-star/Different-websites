// Pixel Hollow: a fixed 16-colour game palette tuned in OKLCH. Each hue family has 2–3 lightness
// steps so sprites can shade without leaving the palette. Brand = grass green (140); the one UI
// accent = sun yellow (90). Every sprite, tile and UI colour comes from these 16 entries.
export default {
  ramps: {
    neutral: { hue: 280, chroma: 0.015, neutral: true }, // UI greys, tinted toward the night ink
    brand: { hue: 140, chroma: 0.15 },
    accent: { hue: 90, chroma: 0.16 },
  },
  colors: {
    // 16-colour palette (p01–p16)
    ink: [0.2, 0.03, 280],
    cream: [0.95, 0.04, 90],
    'grass-d': [0.45, 0.11, 145],
    grass: [0.62, 0.15, 140],
    'grass-l': [0.8, 0.15, 130],
    'soil-d': [0.36, 0.06, 55],
    soil: [0.5, 0.08, 60],
    'wood-l': [0.68, 0.09, 70],
    'sky-d': [0.45, 0.1, 255],
    sky: [0.65, 0.11, 240],
    'sky-l': [0.85, 0.07, 225],
    sun: [0.86, 0.16, 92],
    wheat: [0.74, 0.14, 75],
    berry: [0.58, 0.19, 25],
    'berry-l': [0.76, 0.12, 20],
    dusk: [0.4, 0.1, 300],
  },
  themes: {
    light: {
      selector: ':root',
      colorScheme: 'light',
      tokens: {
        bg: 'ink',
        surface: 'cream',
        'surface-2': 'wood-l',
        text: 'ink',
        'text-muted': 'soil-d',
        border: 'ink',
        brand: 'grass',
        'brand-contrast': 'ink',
        accent: 'sun',
        'accent-contrast': 'ink',
        focus: 'berry',
        'shadow-color': 'ink',
        'on-dark': 'cream',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'surface', kind: 'body', use: 'Panel text (ink on cream)' },
    { fg: 'text-muted', bg: 'surface', kind: 'body', use: 'Panel captions (dark soil on cream)' },
    { fg: 'text', bg: 'surface-2', kind: 'body', use: 'Ink on wood panel' },
    { fg: 'text', bg: 'brand', kind: 'body', use: 'Green button' },
    { fg: 'text', bg: 'accent', kind: 'body', use: 'Sun button, coin badges' },
    { fg: 'text', bg: 'grass-l', kind: 'body', use: 'Ink on light grass tag' },
    { fg: 'text', bg: 'berry-l', kind: 'body', use: 'Ink on berry tag' },
    { fg: 'on-dark', bg: 'ink', kind: 'body', use: 'Cream on ink (footer, game HUD)' },
    { fg: 'on-dark', bg: 'dusk', kind: 'body', use: 'Cream on dusk panel' },
    { fg: 'sun', bg: 'ink', kind: 'body', use: 'Sun labels on ink' },
    { fg: 'border', bg: 'surface', kind: 'ui', use: 'Pixel borders' },
    { fg: 'focus', bg: 'surface', kind: 'ui', use: 'Focus ring on cream' },
    { fg: 'focus', bg: 'ink', kind: 'ui', use: 'Focus ring on ink (berry)' },
  ],
};
