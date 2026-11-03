// Springline palette: a near-black (270) developer UI, violet (295) as the brand, cyan (215) as
// the single accent. Two themes: dark (default) and light, both switchable from the Cmd/Ctrl+K
// palette. In diffs, additions are cyan and removals violet, and every line also carries a +/- sign,
// so colour is never the only signal.
export default {
  ramps: {
    neutral: { hue: 270, chroma: 0.014, neutral: true },
    brand: { hue: 295, chroma: 0.2 },
    accent: { hue: 215, chroma: 0.13 },
  },
  colors: {
    void: [0.14, 0.014, 270],
    'void-2': [0.18, 0.018, 272],
    'void-3': [0.23, 0.022, 275],
    paper: [0.985, 0.004, 270],
    'paper-2': [0.96, 0.008, 275],
    'paper-3': [0.925, 0.012, 280],
    violet: [0.7, 0.18, 295],
    'violet-deep': [0.5, 0.2, 295],
    cyan: [0.82, 0.12, 215],
    'cyan-deep': [0.5, 0.1, 220],
  },
  themes: {
    dark: {
      selector: ':root, :root[data-theme="dark"]',
      colorScheme: 'dark',
      tokens: {
        bg: 'void', surface: 'void-2', 'surface-2': 'void-3',
        text: 'neutral-50', 'text-muted': 'neutral-400', border: 'neutral-600', 'border-soft': 'neutral-800',
        brand: 'violet', 'brand-text': 'brand-300', 'brand-contrast': 'void',
        accent: 'cyan', 'accent-text': 'cyan', 'accent-contrast': 'void',
        add: 'cyan', 'add-bg': 'accent-950', del: 'brand-300', 'del-bg': 'brand-950',
        focus: 'cyan', 'shadow-color': 'neutral-950',
      },
    },
    light: {
      selector: ':root[data-theme="light"]',
      colorScheme: 'light',
      tokens: {
        bg: 'paper', surface: 'paper-2', 'surface-2': 'paper-3',
        text: 'neutral-950', 'text-muted': 'neutral-700', border: 'neutral-500', 'border-soft': 'neutral-200',
        brand: 'violet-deep', 'brand-text': 'violet-deep', 'brand-contrast': 'paper',
        accent: 'cyan-deep', 'accent-text': 'cyan-deep', 'accent-contrast': 'paper',
        add: 'cyan-deep', 'add-bg': 'accent-100', del: 'violet-deep', 'del-bg': 'brand-100',
        focus: 'violet-deep', 'shadow-color': 'neutral-700',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy', themes: ['dark', 'light'] },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Secondary copy', themes: ['dark', 'light'] },
    { fg: 'text', bg: 'surface-2', kind: 'body', use: 'Cards, palette', themes: ['dark', 'light'] },
    { fg: 'text-muted', bg: 'surface-2', kind: 'body', use: 'Card details', themes: ['dark', 'light'] },
    { fg: 'brand-text', bg: 'bg', kind: 'body', use: 'Violet links, kickers', themes: ['dark', 'light'] },
    { fg: 'accent-text', bg: 'bg', kind: 'body', use: 'Cyan labels', themes: ['dark', 'light'] },
    { fg: 'brand-contrast', bg: 'brand', kind: 'body', use: 'Primary buttons', themes: ['dark', 'light'] },
    { fg: 'add', bg: 'add-bg', kind: 'body', use: 'Added diff lines', themes: ['dark', 'light'] },
    { fg: 'del', bg: 'del-bg', kind: 'body', use: 'Removed diff lines', themes: ['dark', 'light'] },
    { fg: 'text', bg: 'add-bg', kind: 'body', use: 'Code on added lines', themes: ['dark', 'light'] },
    { fg: 'text', bg: 'del-bg', kind: 'body', use: 'Code on removed lines', themes: ['dark', 'light'] },
    { fg: 'border', bg: 'bg', kind: 'ui', use: 'Inputs, outlines', themes: ['dark', 'light'] },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring', themes: ['dark', 'light'] },
  ],
};
