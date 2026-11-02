// The Shoalreach Atlas: colour system.
// Paper white + deep-sea navy (brand h 252). One accent: coral (h 40), which is also the warm
// pole of the diverging scale. Data scales are built from the same OKLCH ramps:
//   sequential (depth):    brand-300 … brand-800   (one hue, light → dark, even L steps; validated as ordinal)
//   diverging (anomaly):   brand-700/500/300 · neutral-200 (grey midpoint) · accent-300/500/700 (equal L per arm)
//   two-series lines:      brand-600 + accent-500 (validated categorical, light surface)
export default {
  out: 'src/styles/tokens.css',
  ramps: {
    neutral: { hue: 250, chroma: 0.012, lMax: 0.985, lMin: 0.15, flat: true },
    brand: { hue: 252, chroma: 0.14, lMax: 0.96, lMin: 0.17 },
    accent: { hue: 40, chroma: 0.16, lMax: 0.96, lMin: 0.24, hueShift: 6 },
  },
  p3: { 'coral-hi': [0.66, 0.21, 38] },
  semantic: {
    bg: 'neutral-50',
    surface: 'neutral-100',
    'surface-2': 'neutral-200',
    text: 'brand-950',
    'text-muted': 'neutral-700',
    border: 'neutral-300',
    'border-strong': 'neutral-500',
    accent: 'accent-700',
    'accent-strong': 'accent-800',
    'accent-contrast': 'neutral-50',
    focus: 'brand-600',
    // night (deep-sea) sections
    night: 'brand-900',
    'night-2': 'brand-800',
    'night-text': 'neutral-50',
    'night-muted': 'neutral-300',
    'night-accent': 'accent-300',
    // map / chart
    land: 'neutral-100',
    'land-line': 'neutral-300',
    coast: 'brand-900',
  },
  pairs: [
    ['text', 'bg', 4.5, 'Body text on paper'],
    ['text-muted', 'bg', 4.5, 'Muted text on paper'],
    ['text-muted', 'surface', 4.5, 'Muted text on card'],
    ['text-muted', 'surface-2', 4.5, 'Muted text on raised card'],
    ['accent', 'bg', 4.5, 'Coral links / labels on paper'],
    ['accent-contrast', 'accent', 4.5, 'Button label on coral'],
    ['accent-contrast', 'accent-strong', 4.5, 'Button label on coral (hover)'],
    ['focus', 'bg', 3, 'Focus ring (UI)'],
    ['border-strong', 'bg', 3, 'Slider track / control outline (UI)'],
    ['night-text', 'night', 4.5, 'Text on deep-sea section'],
    ['night-muted', 'night', 4.5, 'Muted text on deep-sea section'],
    ['night-accent', 'night', 4.5, 'Coral labels on deep-sea section'],
    ['night-muted', 'night-2', 4.5, 'Muted text on deep-sea card'],
    ['text', 'land', 4.5, 'Place labels on land'],
    ['coast', 'brand-300', 3, 'Coastline vs shallowest water (graphic)'],
    ['text', 'brand-300', 4.5, 'Map labels on shallowest water band'],
    ['night-text', 'brand-800', 4.5, 'Map labels on deepest water band'],
    ['brand-600', 'bg', 3, 'Shoreline 2025 series vs paper (graphic)'],
    ['accent-500', 'bg', 3, 'Historic shoreline series vs paper (graphic)'],
  ],
};
