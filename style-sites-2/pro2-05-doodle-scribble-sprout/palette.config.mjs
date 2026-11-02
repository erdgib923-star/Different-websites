// Scribble & Sprout palette: four felt-tip markers on graph paper.
// Brand = blue marker (255); the single UI accent = red marker (25). Green (145) and yellow (95)
// markers are drawing colours (doodles, playground, sticky notes), never text or controls.
export default {
  ramps: {
    neutral: { hue: 255, chroma: 0.012, neutral: true }, // pencil + graph-paper greys
    brand: { hue: 255, chroma: 0.17 },                   // blue marker
    accent: { hue: 25, chroma: 0.19 },                   // red marker
  },
  colors: {
    paper: [0.988, 0.006, 95],
    grid: [0.9, 0.035, 235],
    'grid-strong': [0.84, 0.05, 235],
    graphite: [0.3, 0.02, 255],
    'marker-blue': [0.52, 0.17, 255],
    'marker-red': [0.6, 0.2, 25],
    'marker-green': [0.64, 0.16, 145],
    'marker-yellow': [0.88, 0.16, 95],
    'note-yellow': [0.95, 0.08, 98],
    'note-green': [0.94, 0.06, 145],
    'note-blue': [0.94, 0.035, 235],
    'note-pink': [0.94, 0.04, 20],
    white: [1, 0, 0],
  },
  themes: {
    light: {
      selector: ':root',
      colorScheme: 'light',
      tokens: {
        bg: 'paper',
        surface: 'white',
        'surface-2': 'neutral-100',
        text: 'graphite',
        'text-muted': [0.44, 0.03, 255],
        border: 'graphite',
        'border-soft': 'neutral-300',
        brand: 'marker-blue',
        'brand-text': 'brand-700',
        'brand-contrast': 'white',
        accent: 'marker-red',
        'accent-text': 'accent-700',
        'accent-contrast': 'white',
        focus: 'brand-700',
        'shadow-color': 'graphite',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy on paper' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Secondary copy' },
    { fg: 'text', bg: 'grid-strong', kind: 'body', use: 'Text crossing a grid line (worst case)' },
    { fg: 'text', bg: 'surface', kind: 'body', use: 'Cards' },
    { fg: 'text-muted', bg: 'surface', kind: 'body', use: 'Card captions' },
    ...['yellow', 'green', 'blue', 'pink'].flatMap((n) => [
      { fg: 'text', bg: `note-${n}`, kind: 'body', use: `Text on ${n} sticky note` },
      { fg: 'text-muted', bg: `note-${n}`, kind: 'body', use: `Muted text on ${n} note` },
    ]),
    { fg: 'brand-text', bg: 'bg', kind: 'body', use: 'Blue headings, links' },
    { fg: 'accent-text', bg: 'bg', kind: 'body', use: 'Red labels' },
    { fg: 'brand-contrast', bg: 'brand', kind: 'body', use: 'Blue button' },
    { fg: 'accent-contrast', bg: 'accent-text', kind: 'body', use: 'Red button (red-700 fill)' },
    { fg: 'border', bg: 'bg', kind: 'ui', use: 'Pencil outlines on controls' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
    { fg: 'marker-blue', bg: 'bg', kind: 'ui', use: 'Blue marker swatch' },
    { fg: 'marker-red', bg: 'bg', kind: 'ui', use: 'Red marker swatch' },
    { fg: 'marker-green', bg: 'bg', kind: 'ui', use: 'Green marker swatch' },
  ],
};
