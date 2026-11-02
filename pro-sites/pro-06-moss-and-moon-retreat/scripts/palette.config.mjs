// Mossmere: colour system with day and night themes (light-dark()).
// Brand: an analogous green ramp that walks from pale sage (h ~145) to deep moss (h ~123).
// Neutrals: warm cream (h 88, chroma 0.012-0.016). Accent: terracotta (h 42) at ~10% of any view.
// Note: terracotta is the traditional painter's "complement" of moss green. In OKLCH the exact
// opposite of h 134 is ~314 (magenta), so terracotta acts as a warm split-complement here.
export default {
  out: 'src/styles/tokens.css',
  themes: ['light', 'dark'],
  ramps: {
    neutral: { hue: 88, chroma: 0.014, lMax: 0.975, lMin: 0.16, flat: true },
    brand: { hue: 134, chroma: 0.085, lMax: 0.96, lMin: 0.18, hueShift: -22 },
    accent: { hue: 42, chroma: 0.13, lMax: 0.95, lMin: 0.26, hueShift: 4 },
  },
  p3: { 'clay-hi': [0.66, 0.17, 40] },
  semantic: {
    bg: { light: 'neutral-50', dark: 'brand-950' },
    surface: { light: 'neutral-100', dark: 'brand-900' },
    'surface-2': { light: 'brand-100', dark: 'brand-800' },
    text: { light: 'brand-950', dark: 'neutral-50' },
    'text-muted': { light: 'brand-800', dark: 'neutral-300' },
    border: { light: 'neutral-300', dark: 'brand-700' },
    'border-strong': { light: 'brand-600', dark: 'brand-400' },
    accent: { light: 'accent-700', dark: 'accent-300' },
    'accent-strong': { light: 'accent-800', dark: 'accent-200' },
    'accent-contrast': { light: 'neutral-50', dark: 'brand-950' },
    focus: { light: 'accent-600', dark: 'accent-300' },
    leaf: { light: 'brand-500', dark: 'brand-400' },
    'leaf-deep': { light: 'brand-700', dark: 'brand-600' },
    'leaf-pale': { light: 'brand-200', dark: 'brand-800' },
    blob: { light: 'brand-100', dark: 'brand-900' },
    disabled: { light: 'neutral-500', dark: 'neutral-400' },
  },
  pairs: [
    ['text', 'bg', 4.5, 'Body text'],
    ['text-muted', 'bg', 4.5, 'Muted text'],
    ['text', 'surface', 4.5, 'Text on card'],
    ['text-muted', 'surface', 4.5, 'Muted text on card'],
    ['text-muted', 'surface-2', 4.5, 'Muted text on sage panel'],
    ['text', 'blob', 4.5, 'Text over hero blobs'],
    ['accent', 'bg', 4.5, 'Terracotta labels / links'],
    ['accent', 'surface', 4.5, 'Terracotta on card'],
    ['accent-contrast', 'accent', 4.5, 'Button label on terracotta'],
    ['accent-contrast', 'accent-strong', 4.5, 'Button label on terracotta (hover)'],
    ['disabled', 'surface', 3, 'Booked-out dates (UI, also struck through)'],
    ['focus', 'bg', 3, 'Focus ring (UI)'],
    ['focus', 'surface', 3, 'Focus ring on card (UI)'],
    ['border-strong', 'bg', 3, 'Control outlines (UI)'],
    ['border-strong', 'surface', 3, 'Control outlines on card (UI)'],
    ['leaf', 'bg', 3, 'Botanical line art (graphic)'],
  ],
};
