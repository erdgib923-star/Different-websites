// Foundry Nord: Swiss palette. White, black and ONE signal red.
// Neutral ramp is barely tinted toward the red (h 25, chroma 0.006) so greys stay warm-neutral.
// Deliberately no second accent ramp: the brief allows a single signal colour, so accent = brand red.
export default {
  out: 'src/styles/tokens.css',
  ramps: {
    neutral: { hue: 25, chroma: 0.006, lMax: 0.99, lMin: 0.14, flat: true },
    brand: { hue: 27, chroma: 0.23, lMax: 0.95, lMin: 0.22, hueShift: 4 },
  },
  p3: { 'signal-hi': [0.6, 0.27, 27] },
  semantic: {
    bg: 'neutral-50',
    surface: 'neutral-50',
    'surface-2': 'neutral-100',
    text: 'neutral-950',
    'text-muted': 'neutral-700',
    border: 'neutral-950',
    'border-soft': 'neutral-200',
    'border-strong': 'neutral-600',
    accent: 'brand-500',
    'accent-text': 'brand-600',
    'accent-contrast': 'neutral-50',
    focus: 'brand-500',
    ink: 'neutral-950',
    'ink-text': 'neutral-50',
    'ink-muted': 'neutral-300',
    'ink-accent': 'brand-400',
  },
  pairs: [
    ['text', 'bg', 4.5, 'Black on white'],
    ['text-muted', 'bg', 4.5, 'Muted on white'],
    ['text-muted', 'surface-2', 4.5, 'Muted on grey panel'],
    ['accent-text', 'bg', 4.5, 'Red text on white'],
    ['accent', 'bg', 3, 'Red large type / UI on white'],
    ['accent-contrast', 'accent', 4.5, 'White on red'],
    ['accent-contrast', 'accent-text', 4.5, 'White on deep red (hover)'],
    ['focus', 'bg', 3, 'Focus ring (UI)'],
    ['border-strong', 'bg', 3, 'Control outlines (UI)'],
    ['ink-text', 'ink', 4.5, 'White on black'],
    ['ink-muted', 'ink', 4.5, 'Muted on black'],
    ['ink-accent', 'ink', 4.5, 'Red on black'],
  ],
};
