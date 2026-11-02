// The Harbor Gazette palette: newsprint cream, ink, and one spot red (25) used sparingly
// (kickers, the "EXTRA" stamp, the live dot on the tide chart). Brand = ink; neutrals are
// newsprint greys tinted toward the paper hue (90).
export default {
  ramps: {
    neutral: { hue: 90, chroma: 0.014, neutral: true },
    accent: { hue: 25, chroma: 0.19 },
  },
  colors: {
    newsprint: [0.95, 0.02, 90],
    'newsprint-2': [0.915, 0.022, 88],
    ink: [0.19, 0.01, 80],
    'ink-soft': [0.36, 0.012, 80],
    spot: [0.52, 0.19, 27],
    white: [1, 0, 0],
  },
  themes: {
    light: {
      selector: ':root',
      colorScheme: 'light',
      tokens: {
        bg: 'newsprint',
        surface: 'newsprint',
        'surface-2': 'newsprint-2',
        text: 'ink',
        'text-muted': 'ink-soft',
        border: 'ink',
        'border-soft': 'neutral-600',
        brand: 'ink',
        'brand-contrast': 'newsprint',
        accent: 'spot',
        'accent-contrast': 'newsprint',
        focus: 'spot',
        'shadow-color': 'ink',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy on newsprint' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Bylines, captions' },
    { fg: 'text', bg: 'surface-2', kind: 'body', use: 'Boxed panels (weather, tides)' },
    { fg: 'text-muted', bg: 'surface-2', kind: 'body', use: 'Captions in boxes' },
    { fg: 'accent', bg: 'bg', kind: 'body', use: 'Red kickers' },
    { fg: 'accent', bg: 'surface-2', kind: 'body', use: 'Red kickers in boxes' },
    { fg: 'accent-contrast', bg: 'accent', kind: 'body', use: 'EXTRA stamp, ticker label' },
    { fg: 'brand-contrast', bg: 'brand', kind: 'body', use: 'Inverted ink bars (ticker, buttons)' },
    { fg: 'border-soft', bg: 'bg', kind: 'ui', use: 'Hairline column rules' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
  ],
};
