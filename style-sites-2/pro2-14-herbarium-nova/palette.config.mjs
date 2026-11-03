// Herbarium Nova palette: natural-history plates. Parchment paper (85), sepia ink (60) for text
// and line-work, verdigris (175) as the brand colour for leaves and UI, vermilion (30) as the one
// accent for numbered labels and flowers. Neutrals are tinted toward sepia, the ink of the plates.
export default {
  ramps: {
    neutral: { hue: 65, chroma: 0.014, neutral: true },
    brand: { hue: 175, chroma: 0.09 },
    accent: { hue: 30, chroma: 0.17 },
  },
  colors: {
    parchment: [0.94, 0.035, 85],
    'parchment-2': [0.895, 0.045, 80],
    'parchment-3': [0.85, 0.05, 76],
    sepia: [0.31, 0.05, 55],
    'sepia-line': [0.45, 0.06, 58],
    verdigris: [0.58, 0.09, 175],
    vermilion: [0.56, 0.17, 30],
    brass: [0.72, 0.1, 80],
  },
  themes: {
    light: {
      selector: ':root',
      colorScheme: 'light',
      tokens: {
        bg: 'parchment',
        surface: 'parchment',
        'surface-2': 'parchment-2',
        text: 'sepia',
        'text-muted': [0.44, 0.05, 58],
        border: 'sepia-line',
        brand: 'brand-700',
        'brand-contrast': 'parchment',
        accent: 'accent-600',
        'accent-text': 'accent-700',
        'accent-contrast': 'parchment',
        focus: 'brand-800',
        'shadow-color': 'sepia',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy on parchment' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Captions, legends' },
    { fg: 'text', bg: 'surface-2', kind: 'body', use: 'Drawer fronts' },
    { fg: 'text-muted', bg: 'surface-2', kind: 'body', use: 'Drawer labels' },
    { fg: 'text', bg: 'parchment-3', kind: 'body', use: 'Open drawer interior' },
    { fg: 'brand', bg: 'bg', kind: 'body', use: 'Verdigris links and Latin names' },
    { fg: 'accent-text', bg: 'bg', kind: 'body', use: 'Vermilion plate numbers' },
    { fg: 'accent-contrast', bg: 'accent', kind: 'body', use: 'Numbered label discs' },
    { fg: 'brand-contrast', bg: 'brand', kind: 'body', use: 'Verdigris buttons' },
    { fg: 'border', bg: 'bg', kind: 'ui', use: 'Plate frames, leader lines' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
    { fg: 'verdigris', bg: 'bg', kind: 'ui', use: 'Leaves as graphics' },
  ],
};
