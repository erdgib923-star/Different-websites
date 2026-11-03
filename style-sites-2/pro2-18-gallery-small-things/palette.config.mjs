// Museum of Small Things palette: gallery white walls and charcoal type, warm-neutral throughout.
// Brand = charcoal-bronze (hue 60, the museum's own mark, very low chroma), accent = gallery blue
// (250: links and focus). Each of the eight exhibits brings its own single hue (`ex-1`…`ex-8`);
// those are the art, not UI colour, and are spaced 35–50° apart around the wheel.
export default {
  ramps: {
    neutral: { hue: 70, chroma: 0.008, neutral: true },
    brand: { hue: 60, chroma: 0.05 },
    accent: { hue: 250, chroma: 0.14 },
  },
  colors: {
    wall: [0.975, 0.004, 80],
    'wall-2': [0.945, 0.006, 80],
    'wall-3': [0.91, 0.008, 75],
    floor: [0.36, 0.012, 60],
    charcoal: [0.24, 0.008, 60],
    'charcoal-2': [0.44, 0.01, 60],
    bronze: [0.48, 0.05, 60],
    'gallery-blue': [0.48, 0.15, 255],
    'ex-1': [0.58, 0.17, 27],
    'ex-2': [0.6, 0.15, 55],
    'ex-3': [0.6, 0.12, 88],
    'ex-4': [0.6, 0.13, 145],
    'ex-5': [0.6, 0.1, 190],
    'ex-6': [0.55, 0.15, 245],
    'ex-7': [0.52, 0.16, 290],
    'ex-8': [0.58, 0.18, 345],
  },
  themes: {
    light: {
      selector: ':root',
      colorScheme: 'light',
      tokens: {
        bg: 'wall', surface: 'wall-2', 'surface-2': 'wall-3',
        text: 'charcoal', 'text-muted': 'charcoal-2', border: 'neutral-500',
        brand: 'bronze', 'brand-contrast': 'wall',
        accent: 'gallery-blue', 'accent-contrast': 'wall',
        focus: 'gallery-blue', 'shadow-color': 'charcoal',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy, wall labels' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Label details (medium, year)' },
    { fg: 'text', bg: 'surface-2', kind: 'body', use: 'Detail dialog' },
    { fg: 'text-muted', bg: 'surface-2', kind: 'body', use: 'Dialog captions' },
    { fg: 'brand', bg: 'bg', kind: 'body', use: 'Bronze kickers' },
    { fg: 'accent', bg: 'bg', kind: 'body', use: 'Links' },
    { fg: 'accent-contrast', bg: 'accent', kind: 'body', use: 'Buttons' },
    { fg: 'wall', bg: 'floor', kind: 'body', use: 'Text on the corridor floor' },
    { fg: 'border', bg: 'bg', kind: 'ui', use: 'Frames, rules' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
    { fg: 'ex-1', bg: 'bg', kind: 'ui', use: 'Exhibit 1 label dot' },
    { fg: 'ex-2', bg: 'bg', kind: 'ui', use: 'Exhibit 2 label dot' },
    { fg: 'ex-3', bg: 'bg', kind: 'ui', use: 'Exhibit 3 label dot' },
    { fg: 'ex-4', bg: 'bg', kind: 'ui', use: 'Exhibit 4 label dot' },
    { fg: 'ex-5', bg: 'bg', kind: 'ui', use: 'Exhibit 5 label dot' },
    { fg: 'ex-6', bg: 'bg', kind: 'ui', use: 'Exhibit 6 label dot' },
    { fg: 'ex-7', bg: 'bg', kind: 'ui', use: 'Exhibit 7 label dot' },
    { fg: 'ex-8', bg: 'bg', kind: 'ui', use: 'Exhibit 8 label dot' },
  ],
};
