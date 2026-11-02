// Mochi Money palette. Six candy hues share one lightness (0.82) and chroma (0.09) so no
// colour shouts louder than another; plum (320) carries all text. Mint (150) is the one accent,
// near-complementary to plum. Run `npm run palette`, then `npm run contrast`.
const CANDY = { cherry: 20, apricot: 60, mint: 150, sky: 200, grape: 290, bubble: 340 };
export default {
  ramps: {
    neutral: { hue: 320, chroma: 0.012, neutral: true },
    brand: { hue: 320, chroma: 0.14 },   // plum
    accent: { hue: 150, chroma: 0.13 },  // mint
  },
  colors: {
    ...Object.fromEntries(Object.entries(CANDY).map(([k, h]) => [`candy-${k}`, [0.82, 0.09, h]])),
    // Darker clay rims, same hues, for shadows and outlines on the candy cards.
    ...Object.fromEntries(Object.entries(CANDY).map(([k, h]) => [`rim-${k}`, [0.66, 0.11, h]])),
    canvas: [0.972, 0.014, 320],
    white: [1, 0, 0],
  },
  themes: {
    light: {
      selector: ':root',
      colorScheme: 'light',
      tokens: {
        bg: 'canvas',
        surface: 'neutral-50',
        'surface-2': 'neutral-100',
        text: 'brand-950',
        'text-muted': [0.42, 0.07, 320],
        border: 'neutral-200',
        'border-strong': 'brand-500',
        brand: 'brand-600',
        'brand-contrast': 'white',
        accent: 'accent-300',
        'accent-strong': 'accent-700',
        'accent-contrast': 'brand-950',
        focus: 'brand-800',
        'shadow-color': 'brand-900',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Secondary copy' },
    { fg: 'text', bg: 'surface', kind: 'body', use: 'Card text' },
    { fg: 'text-muted', bg: 'surface', kind: 'body', use: 'Card captions' },
    { fg: 'text-muted', bg: 'surface-2', kind: 'body', use: 'Inset wells' },
    ...['cherry', 'apricot', 'mint', 'sky', 'grape', 'bubble'].flatMap((c) => [
      { fg: 'text', bg: `candy-${c}`, kind: 'body', use: `Text on ${c} clay` },
      { fg: 'text-muted', bg: `candy-${c}`, kind: 'body', use: `Muted text on ${c} clay` },
    ]),
    { fg: 'brand-contrast', bg: 'brand', kind: 'body', use: 'Primary button' },
    { fg: 'brand-contrast', bg: 'brand-800', kind: 'body', use: 'Primary button gradient (dark end)' },
    { fg: 'accent-contrast', bg: 'accent', kind: 'body', use: 'Mint badge' },
    { fg: 'accent-strong', bg: 'surface', kind: 'body', use: 'Savings figures' },
    { fg: 'border-strong', bg: 'surface', kind: 'ui', use: 'Slider track, input outline' },
    { fg: 'brand', bg: 'surface-2', kind: 'ui', use: 'Slider thumb on well' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
    { fg: 'focus', bg: 'candy-grape', kind: 'ui', use: 'Focus ring on darkest candy' },
    { fg: 'accent-strong', bg: 'surface-2', kind: 'ui', use: 'Jar fill vs well' },
  ],
};
