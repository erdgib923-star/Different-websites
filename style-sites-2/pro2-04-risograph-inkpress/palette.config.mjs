// Inkpress Collective palette: three risograph spot inks on cream stock.
// Real fluorescent pink sits outside sRGB, so it is gamut-mapped (chroma reduced, L and H kept).
// Blue is the brand ink (headings, text); pink is the single interaction accent; yellow is a third
// ink used only in artwork and overprints, never for text or UI. Overprints are previewed with
// mix-blend-mode: multiply, exactly like stacked inks.
export default {
  ramps: {
    neutral: { hue: 85, chroma: 0.012, neutral: true }, // cream paper greys
    brand: { hue: 250, chroma: 0.17 },                  // riso blue (federal blue)
    accent: { hue: 350, chroma: 0.24 },                 // fluorescent pink
    yellow: { hue: 100, chroma: 0.17 },                 // riso yellow
  },
  colors: {
    cream: [0.955, 0.03, 88],
    stock: [0.975, 0.02, 90],
    'ink-pink': [0.68, 0.26, 355],
    'ink-blue': [0.45, 0.17, 262],
    'ink-yellow': [0.9, 0.17, 100],
  },
  themes: {
    light: {
      selector: ':root',
      colorScheme: 'light',
      tokens: {
        bg: 'cream',
        surface: 'stock',
        'surface-2': 'neutral-100',
        text: 'brand-950',
        'text-muted': [0.42, 0.07, 255],
        border: 'neutral-300',
        'border-strong': 'brand-700',
        brand: 'ink-blue',
        'brand-contrast': 'stock',
        accent: 'ink-pink',
        'accent-contrast': 'brand-950',
        'accent-text': 'accent-700',
        focus: 'accent-700',
        'shadow-color': 'brand-900',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Secondary copy' },
    { fg: 'text', bg: 'surface', kind: 'body', use: 'Cards' },
    { fg: 'text-muted', bg: 'surface', kind: 'body', use: 'Card captions' },
    { fg: 'brand', bg: 'bg', kind: 'body', use: 'Blue ink headings and links' },
    { fg: 'brand', bg: 'surface', kind: 'body', use: 'Blue ink on stock' },
    { fg: 'brand-contrast', bg: 'brand', kind: 'body', use: 'Blue button' },
    { fg: 'accent-contrast', bg: 'accent', kind: 'body', use: 'Pink button, stickers' },
    { fg: 'accent-text', bg: 'bg', kind: 'body', use: 'Pink labels' },
    { fg: 'text', bg: 'ink-yellow', kind: 'body', use: 'Text on yellow ink' },
    { fg: 'border-strong', bg: 'surface', kind: 'ui', use: 'Inputs, controls' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
    { fg: 'focus', bg: 'ink-yellow', kind: 'ui', use: 'Focus ring on yellow' },
    { fg: 'accent-text', bg: 'surface', kind: 'ui', use: 'Checked control fill (pink-700)' },
  ],
};
