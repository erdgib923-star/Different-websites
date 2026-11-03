// Flux palette: a lime (130) to orange (55) gradient brand on a pale citrus cream, with deep
// green (160) for all text. Brand = lime, the one accent = orange. Each flavour has its own pair
// of light colours (f1a…f4b); all stay light (L >= 0.78) so the deep-green type reads on any of them.
export default {
  ramps: {
    neutral: { hue: 160, chroma: 0.012, neutral: true },
    brand: { hue: 130, chroma: 0.2 },
    accent: { hue: 55, chroma: 0.17 },
  },
  colors: {
    cream: [0.985, 0.018, 110],
    'cream-2': [0.96, 0.03, 110],
    lime: [0.88, 0.19, 128],
    orange: [0.79, 0.15, 58],
    'green-deep': [0.3, 0.07, 160],
    'green-2': [0.42, 0.07, 160],
    'green-ink': [0.22, 0.05, 160],
    f1a: [0.88, 0.19, 128], f1b: [0.79, 0.15, 58],
    f2a: [0.8, 0.12, 350], f2b: [0.79, 0.11, 305],
    f3a: [0.87, 0.11, 78], f3b: [0.8, 0.13, 42],
    f4a: [0.9, 0.12, 150], f4b: [0.85, 0.09, 195],
  },
  themes: {
    light: {
      selector: ':root',
      colorScheme: 'light',
      tokens: {
        bg: 'cream', surface: 'cream-2', 'surface-2': 'brand-100',
        text: 'green-deep', 'text-muted': 'green-2', border: 'neutral-500',
        brand: 'lime', 'brand-contrast': 'green-deep', accent: 'orange', 'accent-contrast': 'green-deep',
        'button-bg': 'green-deep', 'button-text': 'cream',
        focus: 'green-ink', 'shadow-color': 'green-deep',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Captions' },
    { fg: 'text', bg: 'surface-2', kind: 'body', use: 'Pale lime panels' },
    { fg: 'button-text', bg: 'button-bg', kind: 'body', use: 'Buttons' },
    { fg: 'text', bg: 'lime', kind: 'body', use: 'Text over lime blobs' },
    { fg: 'text', bg: 'orange', kind: 'body', use: 'Text over orange blobs' },
    { fg: 'text', bg: 'f2a', kind: 'body', use: 'Berry card / blobs' },
    { fg: 'text', bg: 'f2b', kind: 'body', use: 'Berry gradient end' },
    { fg: 'text', bg: 'f3a', kind: 'body', use: 'Peach card / blobs' },
    { fg: 'text', bg: 'f3b', kind: 'body', use: 'Peach gradient end' },
    { fg: 'text', bg: 'f4a', kind: 'body', use: 'Cucumber card / blobs' },
    { fg: 'text', bg: 'f4b', kind: 'body', use: 'Cucumber gradient end' },
    { fg: 'border', bg: 'bg', kind: 'ui', use: 'Radio outlines' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
    { fg: 'focus', bg: 'lime', kind: 'ui', use: 'Focus ring on lime' },
  ],
};
