// Lumi & Lind palette: Scandinavian calm. Birch whites, sage (brand), dusty blue (illustration,
// sky), and one candle-glow amber accent. The page shifts from a day palette to an evening
// palette as you scroll: every shifting colour is color-mix(in oklch, day, evening p%), so the
// endpoints below are the worst cases for contrast (luminance changes monotonically between them).
export default {
  ramps: {
    neutral: { hue: 85, chroma: 0.01, neutral: true },  // birch greys
    brand: { hue: 150, chroma: 0.06 },                  // sage
    blue: { hue: 235, chroma: 0.06 },                   // dusty blue
    accent: { hue: 70, chroma: 0.15 },                  // candle-glow amber
  },
  colors: {
    'birch-day': [0.975, 0.012, 85],
    'birch-evening': [0.885, 0.035, 62],
    'card-day': [0.99, 0.006, 85],
    'card-evening': [0.935, 0.028, 65],
    'sky-day': [0.86, 0.05, 230],
    'sky-dusk': [0.78, 0.09, 55],
    'sky-night': [0.33, 0.05, 260],
    night: [0.235, 0.028, 258],
    'night-2': [0.29, 0.03, 258],
    ink: [0.27, 0.02, 245],
    linen: [0.94, 0.02, 80],
    wood: [0.62, 0.06, 65],
    glow: [0.86, 0.13, 78],
  },
  themes: {
    light: {
      selector: ':root',
      colorScheme: 'light',
      tokens: {
        bg: 'birch-day',
        surface: 'card-day',
        'surface-2': 'neutral-100',
        text: 'ink',
        'text-muted': [0.45, 0.02, 245],
        border: 'neutral-300',
        'border-strong': 'neutral-600',
        brand: 'brand-700',
        'brand-text': 'brand-800',
        'brand-contrast': 'card-day',
        accent: 'glow',
        'accent-text': 'accent-800',
        'accent-contrast': 'ink',
        focus: 'blue-700',
        'shadow-color': 'blue-900',
        'night-text': 'birch-day',
        'night-muted': [0.8, 0.02, 85],
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'birch-day', kind: 'body', use: 'Body copy, day end' },
    { fg: 'text', bg: 'birch-evening', kind: 'body', use: 'Body copy, evening end' },
    { fg: 'text-muted', bg: 'birch-day', kind: 'body', use: 'Secondary copy, day' },
    { fg: 'text-muted', bg: 'birch-evening', kind: 'body', use: 'Secondary copy, evening' },
    { fg: 'text', bg: 'card-day', kind: 'body', use: 'Product cards, day' },
    { fg: 'text-muted', bg: 'card-evening', kind: 'body', use: 'Card captions, evening' },
    { fg: 'brand-text', bg: 'birch-evening', kind: 'body', use: 'Sage headings and links, evening' },
    { fg: 'accent-text', bg: 'birch-day', kind: 'body', use: 'Amber labels' },
    { fg: 'brand-contrast', bg: 'brand', kind: 'body', use: 'Sage button' },
    { fg: 'accent-contrast', bg: 'accent', kind: 'body', use: 'Amber button, price tags' },
    { fg: 'night-text', bg: 'night', kind: 'body', use: 'Evening band text' },
    { fg: 'night-muted', bg: 'night', kind: 'body', use: 'Evening band secondary' },
    { fg: 'accent', bg: 'night', kind: 'ui', use: 'Glow button on night' },
    { fg: 'night-muted', bg: 'night-2', kind: 'body', use: 'Evening band secondary (lighter corner)' },
    { fg: 'border-strong', bg: 'birch-evening', kind: 'ui', use: 'Outlines, evening' },
    { fg: 'focus', bg: 'birch-evening', kind: 'ui', use: 'Focus ring, evening end' },
    { fg: 'focus', bg: 'birch-day', kind: 'ui', use: 'Focus ring, day end' },
  ],
};
