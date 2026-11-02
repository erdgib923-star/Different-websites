// Fernfold Journeys palette. Brand forest (150), one accent mustard (90), teal (195) for sky and
// water in the illustrations, all on cream paper. Each season below is a full set of paper-layer
// colours; src/seasons.ts reads them from CSS and interpolates between seasons in OKLCH as you scroll.
const season = (name, s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [`${name}-${k}`, v]));
export default {
  ramps: {
    neutral: { hue: 150, chroma: 0.012, neutral: true },
    brand: { hue: 150, chroma: 0.11 },   // forest
    accent: { hue: 90, chroma: 0.14 },   // mustard
    teal: { hue: 195, chroma: 0.09 },
  },
  colors: {
    cream: [0.965, 0.022, 90],
    paper: [0.985, 0.012, 90],
    ...season('spring', { sky: [0.93, 0.045, 195], far: [0.84, 0.06, 175], mid: [0.74, 0.1, 150], back: [0.64, 0.11, 148], water: [0.78, 0.08, 195], front: [0.53, 0.11, 150], leaf: [0.8, 0.14, 128], sun: [0.9, 0.12, 95] }),
    ...season('summer', { sky: [0.9, 0.065, 210], far: [0.76, 0.07, 195], mid: [0.62, 0.11, 160], back: [0.52, 0.1, 158], water: [0.7, 0.1, 200], front: [0.42, 0.09, 155], leaf: [0.66, 0.15, 142], sun: [0.88, 0.15, 90] }),
    ...season('autumn', { sky: [0.92, 0.05, 80], far: [0.78, 0.08, 62], mid: [0.66, 0.13, 52], back: [0.56, 0.12, 42], water: [0.74, 0.06, 190], front: [0.44, 0.09, 40], leaf: [0.74, 0.15, 68], sun: [0.86, 0.14, 80] }),
    ...season('winter', { sky: [0.95, 0.018, 230], far: [0.86, 0.025, 220], mid: [0.76, 0.035, 205], back: [0.64, 0.04, 200], water: [0.82, 0.04, 210], front: [0.5, 0.045, 195], leaf: [0.93, 0.01, 220], sun: [0.92, 0.06, 90] }),
    white: [1, 0, 0],
  },
  themes: {
    light: {
      selector: ':root',
      colorScheme: 'light',
      tokens: {
        bg: 'cream',
        surface: 'paper',
        'surface-2': 'neutral-100',
        text: 'brand-950',
        'text-muted': [0.43, 0.045, 150],
        border: 'neutral-300',
        'border-strong': 'neutral-600',
        brand: 'brand-700',
        'brand-contrast': 'paper',
        accent: 'accent-400',
        'accent-text': 'accent-800',
        'accent-contrast': 'brand-950',
        focus: 'teal-700',
        'shadow-color': 'brand-950',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy on cream' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Secondary copy' },
    { fg: 'text', bg: 'surface', kind: 'body', use: 'Paper cards' },
    { fg: 'text-muted', bg: 'surface', kind: 'body', use: 'Card captions' },
    { fg: 'text-muted', bg: 'surface-2', kind: 'body', use: 'Fact chips' },
    { fg: 'brand-contrast', bg: 'brand', kind: 'body', use: 'Primary button' },
    { fg: 'accent-contrast', bg: 'accent', kind: 'body', use: 'Mustard badges' },
    { fg: 'accent-text', bg: 'bg', kind: 'body', use: 'Eyebrow labels' },
    { fg: 'brand', bg: 'bg', kind: 'body', use: 'Links' },
    { fg: 'border-strong', bg: 'surface', kind: 'ui', use: 'Form field outline' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
    { fg: 'focus', bg: 'surface', kind: 'ui', use: 'Focus ring on cards' },
    // Hero headline sits on the sky layer, which shifts through the seasons.
    { fg: 'text', bg: 'spring-sky', kind: 'large', use: 'Hero title on spring sky' },
    { fg: 'text', bg: 'summer-sky', kind: 'large', use: 'Hero title on summer sky' },
    { fg: 'text', bg: 'autumn-sky', kind: 'large', use: 'Hero title on autumn sky' },
    { fg: 'text', bg: 'winter-sky', kind: 'large', use: 'Hero title on winter sky' },
    { fg: 'text', bg: 'spring-sky', kind: 'body', use: 'Hero lead on spring sky' },
    { fg: 'text', bg: 'summer-sky', kind: 'body', use: 'Hero lead on summer sky' },
    { fg: 'paper', bg: 'brand-900', kind: 'body', use: 'Booking band text' },
  ],
};
