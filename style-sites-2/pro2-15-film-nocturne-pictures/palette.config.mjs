// Nocturne Pictures palette: a cinematic split-complementary grade. Teal (200) lives in the
// shadows, amber (70) in the highlights, on a near-black base. Brand = amber (titles, key light);
// the one accent = teal (secondary labels, the "now screening" marks). The WebGL shader grades
// with the same two hues, read from these tokens.
export default {
  ramps: {
    neutral: { hue: 220, chroma: 0.012, neutral: true },
    brand: { hue: 70, chroma: 0.13 },
    accent: { hue: 200, chroma: 0.09 },
  },
  colors: {
    night: [0.14, 0.012, 220],
    'night-2': [0.18, 0.016, 215],
    'night-3': [0.22, 0.02, 210],
    bone: [0.92, 0.025, 80],
    ash: [0.72, 0.02, 80],
    amber: [0.8, 0.13, 70],
    'amber-deep': [0.62, 0.12, 60],
    teal: [0.68, 0.09, 200],
    'teal-deep': [0.38, 0.06, 205],
    black: [0.08, 0.005, 220],
  },
  themes: {
    dark: {
      selector: ':root',
      colorScheme: 'dark',
      tokens: {
        bg: 'night', surface: 'night-2', 'surface-2': 'night-3',
        text: 'bone', 'text-muted': 'ash', border: 'neutral-600',
        brand: 'amber', 'brand-contrast': 'night', accent: 'teal', 'accent-contrast': 'night',
        focus: 'amber', 'shadow-color': 'black',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Credits roles, captions' },
    { fg: 'text', bg: 'surface-2', kind: 'body', use: 'Cards' },
    { fg: 'text-muted', bg: 'surface-2', kind: 'body', use: 'Card captions' },
    { fg: 'brand', bg: 'bg', kind: 'body', use: 'Amber titles and links' },
    { fg: 'accent', bg: 'bg', kind: 'body', use: 'Teal labels' },
    { fg: 'brand-contrast', bg: 'brand', kind: 'body', use: 'Amber buttons' },
    { fg: 'text', bg: 'black', kind: 'body', use: 'Title cards on letterbox black' },
    { fg: 'border', bg: 'bg', kind: 'ui', use: 'Outlines' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
  ],
};
