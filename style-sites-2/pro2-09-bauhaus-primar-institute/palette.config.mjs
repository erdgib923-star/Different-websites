// Primar Institute palette: the three primaries, black, white and a warm grey.
// Brand = blue (255), the single UI accent = red (25); yellow (95) is the third primary, used for
// colour blocks and shapes with black text on it. Neutrals are WARM grey as requested (hue 75),
// not tinted toward the brand hue; that is a deliberate exception noted in the README.
export default {
  ramps: {
    neutral: { hue: 75, chroma: 0.01, neutral: true },
    brand: { hue: 262, chroma: 0.18 },
    accent: { hue: 27, chroma: 0.2 },
    yellow: { hue: 95, chroma: 0.17 },
  },
  colors: {
    canvas: [0.955, 0.006, 80],
    paper: [0.985, 0.004, 80],
    black: [0.19, 0.004, 80],
    red: [0.555, 0.205, 28],
    blue: [0.455, 0.19, 263],
    yellow: [0.84, 0.165, 92],
    white: [1, 0, 0],
  },
  themes: {
    light: {
      selector: ':root',
      colorScheme: 'light',
      tokens: {
        bg: 'canvas',
        surface: 'paper',
        'surface-2': 'neutral-200',
        text: 'black',
        'text-muted': 'neutral-700',
        border: 'black',
        brand: 'blue',
        'brand-contrast': 'white',
        accent: 'red',
        'accent-contrast': 'white',
        focus: 'blue',
        'shadow-color': 'black',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Captions' },
    { fg: 'text', bg: 'surface', kind: 'body', use: 'Cards' },
    { fg: 'text-muted', bg: 'surface-2', kind: 'body', use: 'Grey blocks' },
    { fg: 'text', bg: 'yellow', kind: 'body', use: 'Black on yellow block' },
    { fg: 'white', bg: 'blue', kind: 'body', use: 'White on blue block and button' },
    { fg: 'white', bg: 'red', kind: 'body', use: 'White on red block and button' },
    { fg: 'brand', bg: 'bg', kind: 'body', use: 'Blue links' },
    { fg: 'accent', bg: 'bg', kind: 'large', use: 'Red display words' },
    { fg: 'white', bg: 'black', kind: 'body', use: 'Footer and dark blocks' },
    { fg: 'yellow', bg: 'black', kind: 'body', use: 'Yellow labels on black' },
    { fg: 'border', bg: 'bg', kind: 'ui', use: 'Black borders and controls' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
    { fg: 'focus', bg: 'yellow', kind: 'ui', use: 'Focus ring on yellow' },
    { fg: 'red', bg: 'canvas', kind: 'ui', use: 'Red shape vs canvas' },
    { fg: 'yellow', bg: 'black', kind: 'ui', use: 'Yellow shape vs black' },
  ],
};
