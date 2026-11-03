// Ardent Coachworks palette: carbon near-black (260), brushed-metal neutrals, one signal red
// (25) as the brand, and a cool ice blue (220) as the single accent for data and secondary
// marks. Red vs ice blue stays distinguishable for red-green colour-blind viewers.
export default {
  ramps: {
    neutral: { hue: 260, chroma: 0.012, neutral: true },
    brand: { hue: 25, chroma: 0.2 },
    accent: { hue: 220, chroma: 0.08 },
  },
  colors: {
    carbon: [0.15, 0.01, 260],
    'carbon-2': [0.19, 0.012, 260],
    'carbon-3': [0.235, 0.014, 260],
    black: [0.09, 0.006, 260],
    chrome: [0.94, 0.006, 250],
    steel: [0.76, 0.012, 250],
    'steel-2': [0.6, 0.012, 250],
    'steel-3': [0.42, 0.012, 255],
    signal: [0.6, 0.215, 25],
    'signal-deep': [0.5, 0.19, 25],
    'signal-bright': [0.7, 0.18, 25],
    ice: [0.8, 0.07, 220],
  },
  themes: {
    dark: {
      selector: ':root',
      colorScheme: 'dark',
      tokens: {
        bg: 'carbon', surface: 'carbon-2', 'surface-2': 'carbon-3',
        text: 'chrome', 'text-muted': 'steel', border: 'steel-2', 'border-soft': 'steel-3',
        brand: 'signal', 'brand-text': 'signal-bright', 'brand-contrast': 'chrome', 'button-bg': 'signal-deep',
        accent: 'ice', 'accent-contrast': 'black',
        focus: 'ice', 'shadow-color': 'black',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Captions, labels' },
    { fg: 'text', bg: 'surface-2', kind: 'body', use: 'Spec cards' },
    { fg: 'text-muted', bg: 'surface-2', kind: 'body', use: 'Spec card copy' },
    { fg: 'brand-text', bg: 'bg', kind: 'body', use: 'Red kickers and links' },
    { fg: 'brand-text', bg: 'surface-2', kind: 'body', use: 'Red labels on cards' },
    { fg: 'accent', bg: 'bg', kind: 'body', use: 'Ice-blue data labels' },
    { fg: 'brand-contrast', bg: 'button-bg', kind: 'body', use: 'Primary button' },
    { fg: 'accent-contrast', bg: 'accent', kind: 'body', use: 'Callout chips' },
    { fg: 'brand', bg: 'bg', kind: 'ui', use: 'Red light bar, caliper, rules' },
    { fg: 'border', bg: 'bg', kind: 'ui', use: 'Input outlines' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
  ],
};
