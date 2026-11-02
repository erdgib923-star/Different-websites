// Maison Aurelle: colour system.
// Very-low-chroma warm neutrals (ivory → ink, h 80, C 0.007). Brand: deep bordeaux (h 15), used for ONE
// full-bleed moment and the bordeaux fabrics. Accent: champagne gold (h 86), used for hairlines, numerals
// and the cursor preview frame. No other hues.
export default {
  out: 'src/styles/tokens.css',
  ramps: {
    neutral: { hue: 80, chroma: 0.007, lMax: 0.975, lMin: 0.16, flat: true },
    brand: { hue: 15, chroma: 0.13, lMax: 0.95, lMin: 0.2, hueShift: 6 },
    accent: { hue: 86, chroma: 0.085, lMax: 0.965, lMin: 0.26, hueShift: -6 },
  },
  p3: { 'gold-hi': [0.82, 0.11, 84] },
  semantic: {
    bg: 'neutral-50',
    surface: 'neutral-100',
    'surface-2': 'neutral-200',
    text: 'neutral-950',
    'text-muted': 'neutral-700',
    border: 'neutral-200',
    'border-strong': 'neutral-500',
    accent: 'accent-700',
    'accent-line': 'accent-400',
    'accent-contrast': 'neutral-50',
    focus: 'accent-600',
    // ink sections
    ink: 'neutral-950',
    'ink-text': 'neutral-50',
    'ink-muted': 'neutral-400',
    'ink-accent': 'accent-300',
    // the bordeaux moment
    bordeaux: 'brand-800',
    'bordeaux-text': 'neutral-50',
    'bordeaux-muted': 'neutral-200',
    'bordeaux-accent': 'accent-200',
  },
  pairs: [
    ['text', 'bg', 4.5, 'Ink text on ivory'],
    ['text-muted', 'bg', 4.5, 'Muted text on ivory'],
    ['text-muted', 'surface', 4.5, 'Muted text on oat surface'],
    ['accent', 'bg', 4.5, 'Bronze-gold labels on ivory'],
    ['accent-contrast', 'text', 4.5, 'Ivory label on ink button'],
    ['focus', 'bg', 3, 'Focus ring (UI)'],
    ['border-strong', 'bg', 3, 'Control outlines (UI)'],
    ['accent-line', 'bg', 1.5, 'Decorative gold hairline (non-text, decorative)'],
    ['ink-text', 'ink', 4.5, 'Text on ink section'],
    ['ink-muted', 'ink', 4.5, 'Muted text on ink section'],
    ['ink-accent', 'ink', 4.5, 'Gold numerals on ink'],
    ['bordeaux-text', 'bordeaux', 4.5, 'Text on bordeaux moment'],
    ['bordeaux-muted', 'bordeaux', 4.5, 'Muted text on bordeaux'],
    ['bordeaux-accent', 'bordeaux', 4.5, 'Gold labels on bordeaux'],
  ],
};
