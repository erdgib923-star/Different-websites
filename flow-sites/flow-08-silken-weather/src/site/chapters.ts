// Silken Weather: the ONE chapter table. Silk ribbons stream along the camera's own path through
// a soft studio void. Hue path (silk, `primary`): champagne 80 -> deep wine 10 -> midnight 265 ->
// pearl (h 250, near-neutral). Hues are unwrapped (-95 = 265) so the turn is continuous.

import type { Vec3 } from '../engine/curve'
import type { LCH } from '../engine/color'
import { type BaseFx, type ChapterDef, type PaletteKey, createFlow } from '../engine/timeline'

export interface SilkFx extends BaseFx {
  /** distance of the ribbons from the path (bundle -> spread) */
  spread: number
  /** ribbon width */
  width: number
  /** twist turns along the visible length */
  twist: number
  /** wave amplitude across the ribbon */
  wave: number
  /** edge flutter */
  flutter: number
  /** sheen strength (anisotropic highlight) */
  sheen: number
  /** translucency 0 (opaque silk) .. 1 (veil) */
  veil: number
}

function key(at: number, o: { back: LCH; silk: LCH; silk2: LCH; ui: LCH; hue: number }): PaletteKey {
  return {
    at,
    bg: o.back,
    fog: [o.back[0] * 0.92 + 0.02, o.back[1], o.back[2]],
    primary: o.silk,
    secondary: o.silk2,
    accent: o.ui,
    text: [0.97, 0.01, o.hue],
    scrim: [0.17, 0.025, o.hue],
  }
}

const P = (pos: Vec3, look: Vec3, at: number) => ({ at, pos, look })
const base = { fov: 48, bloom: 0.5, grain: 0.12, vignette: 0.45, chroma: 0.12, fogDensity: 0.011, exposure: 1 }

export const chapters: ChapterDef<SilkFx>[] = [
  {
    id: 'unfurl',
    title: 'Unfurl',
    start: 0,
    end: 0.2,
    copy: {
      eyebrow: 'Collection 01 · Unfurl',
      heading: 'Silken Weather dresses the space between seasons.',
      body: [
        'We are a small label making garments in washed silk and fine wool, cut to move. Each collection is named for a kind of weather and made in short runs.',
        'It begins folded: a length of champagne silk, waiting for the first breath of air.',
      ],
    },
    fx: { ...base, spread: 0.7, width: 0.8, twist: 0.5, wave: 0.15, flutter: 0.15, sheen: 1, veil: 0 },
    palette: [
      key(0, { back: [0.6, 0.035, 70], silk: [0.9, 0.07, 82], silk2: [0.8, 0.06, 70], ui: [0.86, 0.08, 80], hue: 80 }),
      key(0.8, { back: [0.55, 0.04, 62], silk: [0.88, 0.075, 76], silk2: [0.78, 0.07, 60], ui: [0.86, 0.08, 75], hue: 75 }),
    ],
    camera: [P([0, 0.6, 6], [0, 0, -10], 0), P([1.2, 0.8, -6], [0.5, 0, -24], 0.85)],
  },
  {
    id: 'twist',
    title: 'Twist',
    start: 0.2,
    end: 0.45,
    copy: {
      eyebrow: 'Collection 02 · Twist',
      heading: 'A bias cut lets fabric turn with you.',
      body: [
        'Cut at forty-five degrees to the grain, woven cloth gains stretch and drape. We use it for dresses and shirts that follow the body instead of hanging from the shoulders.',
        'This season is dyed deep wine, with madder-red linings.',
      ],
    },
    fx: { ...base, bloom: 0.55, spread: 1.9, width: 0.95, twist: 2.4, wave: 0.3, flutter: 0.35, sheen: 1.2, veil: 0 },
    palette: [
      key(0.35, { back: [0.3, 0.05, 15], silk: [0.47, 0.15, 12], silk2: [0.36, 0.12, 2], ui: [0.85, 0.09, 15], hue: 15 }),
      key(0.9, { back: [0.24, 0.05, 8], silk: [0.44, 0.15, 8], silk2: [0.34, 0.12, -4], ui: [0.85, 0.09, 8], hue: 8 }),
    ],
    camera: [P([-1.8, 1.4, -38], [0, 0, -58], 0.2), P([2.2, -0.4, -66], [0, 0.3, -88], 0.85)],
  },
  {
    id: 'wave',
    title: 'Wave',
    start: 0.45,
    end: 0.7,
    copy: {
      eyebrow: 'Collection 03 · Wave',
      heading: 'At night, silk carries the light.',
      body: [
        'Satin weaves float long threads across the surface, so the fabric reflects in streaks rather than spots. In midnight blue it reads almost black until it moves.',
        'Every piece is finished by hand in our studio and sold with a care guide written by the people who made it.',
      ],
    },
    fx: { ...base, bloom: 0.65, spread: 2.5, width: 1.05, twist: 1.2, wave: 1, flutter: 0.6, sheen: 1.5, veil: 0.1 },
    palette: [
      key(0.3, { back: [0.14, 0.05, -82], silk: [0.38, 0.1, -95], silk2: [0.3, 0.09, -108], ui: [0.84, 0.08, -85], hue: 265 }),
      key(0.85, { back: [0.12, 0.045, -92], silk: [0.4, 0.1, -96], silk2: [0.32, 0.08, -110], ui: [0.84, 0.08, -92], hue: 265 }),
    ],
    camera: [P([1.6, 0.8, -102], [0, -0.3, -124], 0.2), P([-2.4, 1.6, -132], [0, 0, -154], 0.85)],
  },
  {
    id: 'veil',
    title: 'Veil',
    start: 0.7,
    end: 1,
    copy: {
      eyebrow: 'Collection 04 · Veil',
      heading: 'Join the list for the next weather.',
      body: [
        'Pearl silk organza, light enough to hold a breath of air. The next collection opens to the list first, in small numbers.',
      ],
    },
    fx: { ...base, bloom: 0.6, grain: 0.1, vignette: 0.38, spread: 2.8, width: 1.7, twist: 0.6, wave: 0.6, flutter: 0.9, sheen: 1.1, veil: 1 },
    palette: [
      key(0.25, { back: [0.5, 0.02, -105], silk: [0.93, 0.015, -110], silk2: [0.86, 0.02, -95], ui: [0.86, 0.04, -110], hue: 250 }),
      key(1, { back: [0.54, 0.018, -110], silk: [0.95, 0.012, -110], silk2: [0.88, 0.018, -100], ui: [0.87, 0.04, -110], hue: 250 }),
    ],
    camera: [P([0, 1.2, -168], [0, 0, -190], 0.2), P([1.4, 0.4, -196], [0, 0, -218], 0.6), P([0, 0.2, -214], [0, 0, -238], 1)],
  },
]

export const flow = createFlow<SilkFx>({
  chapters,
  blend: 0.06,
  textFade: 0.035,
  bounds: {
    l: { bg: [0.1, 0.65], fog: [0.11, 0.64], text: [0.95, 0.99], scrim: [0.15, 0.2], accent: [0.8, 0.9], primary: [0.36, 0.96], secondary: [0.28, 0.9] },
    c: { bg: 0.06, fog: 0.06, text: 0.02, scrim: 0.04, accent: 0.1, primary: 0.16, secondary: 0.13 },
  },
})

export const COUNTS = {
  ribbons: { high: 7, mid: 5, low: 3 },
  segments: { high: [420, 28], mid: [300, 20], low: [200, 12] } as Record<'high' | 'mid' | 'low', [number, number]>,
}
