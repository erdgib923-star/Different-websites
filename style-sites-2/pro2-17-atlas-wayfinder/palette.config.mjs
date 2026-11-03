// Atlas Wayfinder palette: a hand-drawn sea chart. Parchment (85) paper, ocean teal (200) as the
// brand (sea, links, headings' accents), coral (30) as the single accent (the route, waypoints).
// Ink is a deep sea-tinted neutral rather than black, as on an old chart.
export default {
  ramps: {
    neutral: { hue: 200, chroma: 0.012, neutral: true },
    brand: { hue: 200, chroma: 0.09 },
    accent: { hue: 30, chroma: 0.16 },
  },
  colors: {
    parchment: [0.955, 0.024, 85],
    'parchment-2': [0.925, 0.03, 85],
    'parchment-3': [0.885, 0.036, 82],
    land: [0.9, 0.05, 88],
    'land-2': [0.84, 0.06, 85],
    ink: [0.28, 0.035, 215],
    'ink-soft': [0.46, 0.03, 210],
    sea: [0.87, 0.035, 200],
    'sea-2': [0.8, 0.055, 200],
    'sea-deep': [0.46, 0.085, 205],
    coral: [0.64, 0.16, 32],
    'coral-deep': [0.49, 0.15, 30],
  },
  themes: {
    light: {
      selector: ':root',
      colorScheme: 'light',
      tokens: {
        bg: 'parchment', surface: 'parchment-2', 'surface-2': 'parchment-3',
        text: 'ink', 'text-muted': 'ink-soft', border: 'neutral-500',
        brand: 'sea-deep', 'brand-contrast': 'parchment',
        accent: 'coral', 'accent-text': 'coral-deep', 'accent-contrast': 'parchment',
        focus: 'coral-deep', 'shadow-color': 'ink',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Captions, log notes' },
    { fg: 'text', bg: 'surface-2', kind: 'body', use: 'Waypoint cards' },
    { fg: 'text-muted', bg: 'surface-2', kind: 'body', use: 'Card details' },
    { fg: 'brand', bg: 'bg', kind: 'body', use: 'Teal links and labels' },
    { fg: 'accent-text', bg: 'bg', kind: 'body', use: 'Coral kickers' },
    { fg: 'accent-text', bg: 'surface-2', kind: 'body', use: 'Day labels on waypoint cards' },
    { fg: 'brand-contrast', bg: 'brand', kind: 'body', use: 'Teal buttons' },
    { fg: 'accent-contrast', bg: 'accent-text', kind: 'body', use: 'Waypoint marker numerals' },
    { fg: 'text', bg: 'sea', kind: 'body', use: 'Sea names on the map' },
    { fg: 'text', bg: 'land', kind: 'body', use: 'Island names on land' },
    { fg: 'accent-text', bg: 'sea', kind: 'ui', use: 'Route line over the sea' },
    { fg: 'ink-soft', bg: 'sea', kind: 'ui', use: 'Coastlines' },
    { fg: 'border', bg: 'bg', kind: 'ui', use: 'Card and table rules' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
  ],
};
