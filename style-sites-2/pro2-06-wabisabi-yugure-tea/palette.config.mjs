// Yugure Tea Atelier palette: wabi-sabi restraint. Ash neutrals (chroma <= 0.02) tinted toward
// the clay hue, a low-chroma moss, charcoal ink, and one vermilion accent used on well under 2%
// of the page (the seal stamps and the current-season mark only).
export default {
  ramps: {
    neutral: { hue: 60, chroma: 0.012, neutral: true },  // ash, tinted toward clay
    brand: { hue: 50, chroma: 0.06 },                    // muted clay
    moss: { hue: 135, chroma: 0.04 },                    // low-chroma moss
    accent: { hue: 30, chroma: 0.17 },                   // vermilion
  },
  colors: {
    washi: [0.962, 0.008, 75],
    'washi-2': [0.935, 0.01, 70],
    ink: [0.24, 0.008, 60],
    'ink-wash': [0.42, 0.01, 60],
    vermilion: [0.56, 0.17, 30],
    white: [1, 0, 0],
  },
  themes: {
    light: {
      selector: ':root',
      colorScheme: 'light',
      tokens: {
        bg: 'washi',
        surface: [0.978, 0.006, 75],
        'surface-2': 'washi-2',
        text: 'ink',
        'text-muted': [0.47, 0.012, 60],
        border: 'neutral-300',
        'border-strong': 'neutral-600',
        brand: 'brand-700',
        'brand-text': 'brand-800',
        moss: 'moss-700',
        accent: 'vermilion',
        'accent-contrast': 'washi',
        focus: 'ink',
        'shadow-color': 'ink',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Secondary copy, captions' },
    { fg: 'text', bg: 'surface-2', kind: 'body', use: 'Menu panel' },
    { fg: 'text-muted', bg: 'surface-2', kind: 'body', use: 'Tasting notes' },
    { fg: 'brand-text', bg: 'bg', kind: 'body', use: 'Clay headings and links' },
    { fg: 'moss', bg: 'bg', kind: 'body', use: 'Moss labels' },
    { fg: 'moss', bg: 'surface-2', kind: 'body', use: 'Moss labels on panel' },
    { fg: 'accent-contrast', bg: 'accent', kind: 'large', use: 'Seal characters (large)' },
    { fg: 'border-strong', bg: 'bg', kind: 'ui', use: 'Tab underline, inputs' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
    { fg: 'accent', bg: 'bg', kind: 'ui', use: 'Current-season mark' },
  ],
};
