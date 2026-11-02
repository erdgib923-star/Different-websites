// Auralis colour system.
// Brand: deep indigo-violet (h 285). Imagery: analogous aurora teal (195) → violet (295) → magenta (340),
// used only inside the shader / gradients, never as UI colour. One warm accent: amber (h 68) for CTAs.
export default {
  out: 'src/styles/tokens.css',
  ramps: {
    neutral: { hue: 282, chroma: 0.014, lMax: 0.975, lMin: 0.14, flat: true },
    brand: { hue: 285, chroma: 0.19, lMax: 0.96, lMin: 0.15, hueShift: -10 },
    accent: { hue: 68, chroma: 0.17, lMax: 0.97, lMin: 0.22, hueShift: -16 },
  },
  extra: {
    // aurora anchors (imagery only)
    'aurora-teal': [0.8, 0.13, 195],
    'aurora-violet': [0.62, 0.2, 295],
    'aurora-magenta': [0.68, 0.22, 340],
    'aurora-night': [0.18, 0.07, 280],
    // brightest colour the shader can output (lightness is clamped to 0.62 in the fragment shader)
    'aurora-cap': [0.62, 0.13, 195],
  },
  p3: { 'amber-hi': [0.84, 0.19, 72], 'aurora-hi': [0.72, 0.28, 330] },
  semantic: {
    bg: 'brand-950',
    surface: 'brand-900',
    'surface-2': 'brand-800',
    glass: 'brand-900',
    text: 'neutral-50',
    'text-muted': 'neutral-300',
    border: 'brand-700',
    'border-strong': 'brand-500',
    accent: 'accent-200',
    'accent-strong': 'accent-100',
    'accent-contrast': 'brand-950',
    focus: 'accent-200',
  },
  pairs: [
    ['text', 'bg', 4.5, 'Body text on page'],
    ['text-muted', 'bg', 4.5, 'Muted text on page'],
    ['text', 'surface', 4.5, 'Body text on surface'],
    ['text-muted', 'surface', 4.5, 'Muted text on surface'],
    ['text-muted', 'surface-2', 4.5, 'Muted text on raised surface'],
    // frosted glass cards are 84% opaque; worst case is the brightest aurora colour behind them
    ['text', { layer: 'glass', alpha: 0.84, over: 'aurora-teal' }, 4.5, 'Text on glass over brightest aurora (teal)'],
    ['text-muted', { layer: 'glass', alpha: 0.84, over: 'aurora-teal' }, 4.5, 'Muted text on glass over teal'],
    ['text-muted', { layer: 'glass', alpha: 0.84, over: 'aurora-magenta' }, 4.5, 'Muted text on glass over magenta'],
    // hero headline sits directly on the shader; the shader's brightest band is capped (see aurora.ts)
    ['text', 'aurora-cap', 3, 'Large hero headline over brightest shader colour'],
    ['text', { layer: 'bg', alpha: 0.55, over: 'aurora-cap' }, 4.5, 'Hero body copy on its scrim over brightest shader colour'],
    ['accent', 'bg', 4.5, 'Amber labels on page'],
    ['accent-contrast', 'accent', 4.5, 'CTA label on amber'],
    ['accent-contrast', 'accent-strong', 4.5, 'CTA label on amber (hover)'],
    ['focus', 'bg', 3, 'Focus ring (UI)'],
    ['border-strong', 'bg', 3, 'Control outlines (UI)'],
    ['border-strong', 'surface', 3, 'Control outlines on surface (UI)'],
  ],
};
