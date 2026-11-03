// Bubbletown: colour system.
// Brand: plum (h 330), used for text, outlines and primary buttons. Neutrals are tinted toward plum.
// Accent: coral (h 32), the single accent hue, for stars, prices and highlights (~10%).
// Toys: six pastels at IDENTICAL OKLCH lightness and chroma (L 0.86, C 0.068), 60° apart-ish, so
// they rotate without any one looking heavier. C 0.068 is the largest chroma that keeps every one
// of the six hues inside sRGB at L 0.86 (blue h 265 is the limiting hue at ≈0.069).
// Pastel fills always get a plum outline (the "border trick"): fill vs. outline ≥ 3:1, so the
// pastels never need contrast against the cream page or each other.
export const PASTELS = { peach: 25, butter: 85, mint: 150, sky: 215, lilac: 285, rose: 345 };
const extra = {
  cream: [0.972, 0.026, 88],
  'cream-2': [0.94, 0.034, 82],
  paper: [0.99, 0.012, 90],
  night: [0.22, 0.06, 310],
  'night-2': [0.3, 0.07, 310],
};
for (const [name, h] of Object.entries(PASTELS)) extra[`p-${name}`] = [0.86, 0.068, h];

export default {
  out: 'src/styles/tokens.css',
  ramps: {
    neutral: { hue: 330, chroma: 0.014, lMax: 0.975, lMin: 0.17, flat: true },
    brand: { hue: 330, chroma: 0.12, lMax: 0.96, lMin: 0.2, hueShift: -8 },
    accent: { hue: 32, chroma: 0.16, lMax: 0.95, lMin: 0.26, hueShift: 6 },
  },
  extra,
  p3: { 'coral-hi': [0.7, 0.2, 32] },
  semantic: {
    bg: 'cream',
    surface: 'paper',
    'surface-2': 'cream-2',
    text: 'brand-900',
    'text-muted': 'brand-700',
    border: 'brand-200',
    'border-strong': 'brand-800',
    accent: 'accent-700',
    'accent-ui': 'accent-500',
    'accent-contrast': 'paper',
    button: 'brand-800',
    'button-hover': 'brand-700',
    focus: 'accent-700',
  },
  pairs: [
    ['text', 'bg', 4.5, 'Body text on cream'],
    ['text', 'surface', 4.5, 'Text on card'],
    ['text', 'surface-2', 4.5, 'Text on cream panel'],
    ['text-muted', 'bg', 4.5, 'Muted text on cream'],
    ['text-muted', 'surface', 4.5, 'Muted text on card'],
    ['text-muted', 'surface-2', 4.5, 'Muted text on cream panel'],
    ['accent', 'bg', 4.5, 'Coral labels and prices on cream'],
    ['accent', 'surface', 4.5, 'Coral labels on card'],
    ['accent-contrast', 'button', 4.5, 'Button label on plum'],
    ['accent-contrast', 'button-hover', 4.5, 'Button label on plum (hover)'],
    ['focus', 'bg', 3, 'Focus ring (UI)'],
    ['focus', 'surface', 3, 'Focus ring on card (UI)'],
    ['border-strong', 'bg', 3, 'Control and toy outlines (UI)'],
    ['accent-ui', 'night', 3, 'Coral stars on the night sky (graphic)'],
    ['accent-contrast', 'accent-ui', 3, 'Paper on coral sticker (large bold text)'],
    ['paper', 'night', 4.5, 'Text on the night-sky game'],
    ['p-butter', 'night', 3, 'Butter stars on the night sky (graphic)'],
    ...Object.keys(PASTELS).flatMap((n) => [
      ['text', `p-${n}`, 4.5, `Plum text on ${n}`],
      ['border-strong', `p-${n}`, 3, `Plum outline around ${n} (UI)`],
      ['focus', `p-${n}`, 3, `Focus ring on ${n} (UI)`],
    ]),
  ],
};
