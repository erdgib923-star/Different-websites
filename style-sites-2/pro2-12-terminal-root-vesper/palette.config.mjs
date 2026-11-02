// root@vesper palette: a phosphor terminal. Near-black base (hue 200), phosphor green (brand,
// 145) and amber (the one accent, 75). Two themes: green (default) and amber; each uses the other
// hue for highlights (command names, links), so there is always exactly one accent on screen.
export default {
  ramps: {
    neutral: { hue: 200, chroma: 0.015, neutral: true },
    brand: { hue: 145, chroma: 0.19 },
    accent: { hue: 75, chroma: 0.15 },
  },
  colors: {
    void: [0.16, 0.015, 200],
    pane: [0.2, 0.02, 200],
    'pane-2': [0.24, 0.022, 200],
    phosphor: [0.86, 0.2, 145],
    'phosphor-dim': [0.7, 0.13, 145],
    'phosphor-faint': [0.54, 0.09, 145],
    amber: [0.84, 0.15, 75],
    'amber-dim': [0.7, 0.11, 70],
    'amber-faint': [0.54, 0.08, 70],
    red: [0.7, 0.17, 25],
  },
  themes: {
    green: {
      selector: ':root',
      colorScheme: 'dark',
      tokens: {
        bg: 'void', surface: 'pane', 'surface-2': 'pane-2',
        text: 'phosphor', 'text-muted': 'phosphor-dim', border: 'phosphor-faint',
        accent: 'amber', 'accent-contrast': 'void', focus: 'amber', 'shadow-color': 'void',
        brand: 'phosphor', 'brand-contrast': 'void', error: 'red',
      },
    },
    amber: {
      selector: '[data-theme="amber"]',
      colorScheme: 'dark',
      tokens: {
        bg: 'void', surface: 'pane', 'surface-2': 'pane-2',
        text: 'amber', 'text-muted': 'amber-dim', border: 'amber-faint',
        accent: 'phosphor', 'accent-contrast': 'void', focus: 'phosphor', 'shadow-color': 'void',
        brand: 'amber', 'brand-contrast': 'void', error: 'red',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Terminal text' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Dim output' },
    { fg: 'text', bg: 'surface', kind: 'body', use: 'Panes' },
    { fg: 'text-muted', bg: 'surface-2', kind: 'body', use: 'Dim text on raised pane' },
    { fg: 'accent', bg: 'bg', kind: 'body', use: 'Highlighted commands and links' },
    { fg: 'brand-contrast', bg: 'brand', kind: 'body', use: 'Inverted-video buttons' },
    { fg: 'accent-contrast', bg: 'accent', kind: 'body', use: 'Inverted accent badges' },
    { fg: 'error', bg: 'bg', kind: 'body', use: 'Error output' },
    { fg: 'border', bg: 'bg', kind: 'ui', use: 'Pane and input borders' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
  ],
};
