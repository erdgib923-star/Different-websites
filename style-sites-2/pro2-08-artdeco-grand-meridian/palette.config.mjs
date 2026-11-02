// The Grand Meridian palette: obsidian near-black (hue 270), emerald velvet (brand, 165),
// metallic gold (the one accent, 85) and ivory text. High tonal contrast, gold used decisively.
export default {
  ramps: {
    neutral: { hue: 270, chroma: 0.014, neutral: true },
    brand: { hue: 165, chroma: 0.11 },   // emerald
    accent: { hue: 85, chroma: 0.12 },   // gold
  },
  colors: {
    obsidian: [0.165, 0.014, 270],
    lacquer: [0.205, 0.016, 270],
    'lacquer-2': [0.25, 0.018, 270],
    ivory: [0.95, 0.025, 90],
    champagne: [0.82, 0.03, 85],
    gold: [0.79, 0.12, 85],
    'gold-deep': [0.62, 0.11, 80],
    'gold-pale': [0.9, 0.07, 90],
    emerald: [0.36, 0.08, 165],
    'emerald-deep': [0.26, 0.06, 165],
  },
  themes: {
    dark: {
      selector: ':root',
      colorScheme: 'dark',
      tokens: {
        bg: 'obsidian',
        surface: 'lacquer',
        'surface-2': 'lacquer-2',
        text: 'ivory',
        'text-muted': 'champagne',
        border: 'neutral-700',
        'border-strong': 'gold-deep',
        brand: 'emerald',
        'brand-contrast': 'ivory',
        accent: 'gold',
        'accent-contrast': 'obsidian',
        focus: 'gold-pale',
        'shadow-color': 'neutral-950',
      },
    },
  },
  pairs: [
    { fg: 'text', bg: 'bg', kind: 'body', use: 'Body copy' },
    { fg: 'text-muted', bg: 'bg', kind: 'body', use: 'Secondary copy' },
    { fg: 'text', bg: 'surface', kind: 'body', use: 'Room cards' },
    { fg: 'text-muted', bg: 'surface', kind: 'body', use: 'Card details' },
    { fg: 'text-muted', bg: 'surface-2', kind: 'body', use: 'Form panel' },
    { fg: 'accent', bg: 'bg', kind: 'body', use: 'Gold labels and prices' },
    { fg: 'accent', bg: 'surface', kind: 'body', use: 'Gold on cards' },
    { fg: 'gold-deep', bg: 'bg', kind: 'large', use: 'Darkest stop of gold gradient headings' },
    { fg: 'text', bg: 'emerald', kind: 'body', use: 'Ivory on emerald band' },
    { fg: 'text-muted', bg: 'emerald-deep', kind: 'body', use: 'Champagne on deep emerald' },
    { fg: 'accent', bg: 'emerald', kind: 'body', use: 'Gold on emerald' },
    { fg: 'accent-contrast', bg: 'accent', kind: 'body', use: 'Solid gold button' },
    { fg: 'border-strong', bg: 'surface-2', kind: 'ui', use: 'Form field borders' },
    { fg: 'focus', bg: 'bg', kind: 'ui', use: 'Focus ring' },
    { fg: 'focus', bg: 'emerald', kind: 'ui', use: 'Focus ring on emerald' },
  ],
};
