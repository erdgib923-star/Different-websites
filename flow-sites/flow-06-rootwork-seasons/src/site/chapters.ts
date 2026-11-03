// Rootwork: the ONE chapter table. One tree on one meadow; a year passes as you scroll.
// Hue path (leaf colour, `primary`): spring green 140 -> summer green 150 (+ gold 95 in
// `accent`) -> autumn 55 -> 30 -> winter blue-grey 250.

import type { Vec3 } from '../engine/curve'
import type { LCH } from '../engine/color'
import { smootherstep } from '../engine/math'
import { type BaseFx, type ChapterDef, type Flow, type PaletteKey, type SceneState, createFlow } from '../engine/timeline'

export interface RootFx extends BaseFx {
  /** tree growth 0 (seed) .. 1 (mature) */
  growth: number
  /** leaf amount on the tree 0..1 */
  foliage: number
  /** share of leaves that have dropped 0..1 */
  fall: number
  /** airborne leaves in the wind */
  flyingLeaves: number
  /** falling snow */
  snow: number
  /** snow lying on ground and branches */
  snowCover: number
  /** wind strength */
  wind: number
  /** sun warmth on the scene */
  sun: number
}

interface Pal {
  sky: LCH
  haze: LCH
  leaf: LCH
  ground: LCH
  ui: LCH
  hue: number
}
function key(at: number, p: Pal): PaletteKey {
  return {
    at,
    bg: p.sky,
    fog: p.haze,
    primary: p.leaf,
    secondary: p.ground,
    accent: p.ui,
    text: [0.97, 0.012, p.hue],
    scrim: [0.2, 0.03, p.hue],
  }
}

const P = (pos: Vec3, look: Vec3, at: number) => ({ at, pos, look })
const base = { fov: 45, bloom: 0.45, grain: 0.14, vignette: 0.42, chroma: 0.15, fogDensity: 0.012, exposure: 1 }

export const chapters: ChapterDef<RootFx>[] = [
  {
    id: 'seed',
    title: 'Seed',
    start: 0,
    end: 0.15,
    copy: {
      eyebrow: '01 · Seed',
      heading: 'Rootwork plants forests that look after themselves.',
      body: [
        'We are a small regenerative-forestry nonprofit. We work with landowners to restore mixed native woodland on degraded ground, one site at a time.',
        'Every forest starts as a seed in poor soil, and a commitment to stay for decades, not seasons.',
      ],
    },
    fx: { ...base, growth: 0, foliage: 0, fall: 0, flyingLeaves: 0, snow: 0, snowCover: 0, wind: 0.2, sun: 0.8 },
    palette: [key(0, { sky: [0.82, 0.05, 210], haze: [0.88, 0.035, 150], leaf: [0.72, 0.14, 140], ground: [0.46, 0.06, 95], ui: [0.86, 0.12, 140], hue: 140 })],
    camera: [P([0.4, 0.45, 3.2], [0, 0.08, 0], 0), P([0.9, 0.7, 3.6], [0, 0.45, 0], 0.9)],
  },
  {
    id: 'sapling',
    title: 'Sapling',
    start: 0.15,
    end: 0.4,
    copy: {
      eyebrow: '02 · Sapling · spring',
      heading: 'The first years are the fragile ones.',
      body: [
        'Young trees need protection from browsing, competition and drought. We plant in mixed groups, so faster pioneer species shelter the slower ones, and we monitor every site for at least five years.',
        'Soil life comes back first: fungi, insects and the roots of the ground flora knit the ground together again.',
      ],
    },
    fx: { ...base, growth: 0.38, foliage: 0.75, fall: 0, flyingLeaves: 0, snow: 0, snowCover: 0, wind: 0.35, sun: 1 },
    palette: [key(0.4, { sky: [0.8, 0.06, 220], haze: [0.88, 0.04, 160], leaf: [0.74, 0.15, 140], ground: [0.52, 0.09, 130], ui: [0.86, 0.12, 140], hue: 140 })],
    camera: [P([2.2, 1.6, 6.2], [0, 1.15, 0], 0.15), P([-1.6, 2.6, 7.6], [0, 2.3, 0], 0.85)],
  },
  {
    id: 'summer',
    title: 'Summer canopy',
    start: 0.4,
    end: 0.65,
    copy: {
      eyebrow: '03 · Canopy · summer',
      heading: 'A canopy is an economy of light.',
      body: [
        'A mature crown captures sunlight, shades the soil, slows the rain and gives shelter to everything beneath it. In summer the whole site works at full capacity.',
        'We measure success in species returning, not in trees planted. Birds and insects tell us more than our spreadsheets.',
      ],
    },
    fx: { ...base, bloom: 0.55, growth: 0.88, foliage: 1, fall: 0, flyingLeaves: 0, snow: 0, snowCover: 0, wind: 0.45, sun: 1.15 },
    palette: [
      key(0.3, { sky: [0.78, 0.07, 228], haze: [0.86, 0.05, 120], leaf: [0.56, 0.14, 150], ground: [0.5, 0.1, 135], ui: [0.86, 0.12, 95], hue: 150 }),
      key(0.85, { sky: [0.77, 0.07, 232], haze: [0.86, 0.06, 100], leaf: [0.58, 0.14, 145], ground: [0.52, 0.1, 115], ui: [0.86, 0.13, 95], hue: 150 }),
    ],
    camera: [P([4.6, 4.0, 10.5], [0, 3.3, 0], 0.2), P([-5.2, 5.4, 10.8], [0, 4.3, 0], 0.85)],
  },
  {
    id: 'autumn',
    title: 'Autumn into winter',
    start: 0.65,
    end: 1,
    copy: {
      eyebrow: '04 · Autumn into winter',
      heading: 'Then the forest rests, and so can you.',
      body: [
        'Leaves fall and feed the soil; snow insulates the roots. A regenerative forest does not need us forever, and that is the point.',
        'Rootwork is funded by small regular donations. Tell us you are interested and we will send you our planting reports, twice a year.',
      ],
    },
    fx: { ...base, bloom: 0.5, growth: 1, foliage: 1, fall: 1, flyingLeaves: 1, snow: 1, snowCover: 1, wind: 0.6, sun: 0.75 },
    palette: [
      key(0.08, { sky: [0.76, 0.06, 70], haze: [0.84, 0.06, 65], leaf: [0.66, 0.16, 55], ground: [0.5, 0.09, 75], ui: [0.86, 0.12, 60], hue: 60 }),
      key(0.42, { sky: [0.72, 0.06, 45], haze: [0.8, 0.06, 40], leaf: [0.6, 0.17, 30], ground: [0.45, 0.07, 50], ui: [0.86, 0.11, 40], hue: 40 }),
      key(0.85, { sky: [0.84, 0.025, 250], haze: [0.9, 0.02, 245], leaf: [0.82, 0.03, 250], ground: [0.92, 0.015, 250], ui: [0.86, 0.06, 250], hue: 250 }),
    ],
    camera: [P([-3.4, 6.8, 12.6], [0, 4.8, 0], 0.15), P([2.6, 7.8, 14.2], [0, 5, 0], 0.55), P([0, 8.6, 15.6], [0, 5.2, 0], 1)],
  },
]

const baseFlow = createFlow<RootFx>({
  chapters,
  blend: 0.06,
  textFade: 0.035,
  bounds: {
    l: { bg: [0.6, 0.9], fog: [0.7, 0.94], text: [0.95, 0.99], scrim: [0.16, 0.22], accent: [0.8, 0.9], primary: [0.5, 0.86], secondary: [0.4, 0.94] },
    c: { bg: 0.08, fog: 0.07, text: 0.02, scrim: 0.05, accent: 0.14, primary: 0.18, secondary: 0.11 },
  },
})

/**
 * The last chapter spans a whole change of season, so its weather keys are staged by the
 * chapter's own local progress (still a pure, continuous function of progress):
 * leaves drop over the first half, fly in the wind early on, snow starts after the midpoint
 * and settles toward the end. The continuity test samples this wrapped function.
 */
function stageSeasons(s: SceneState<RootFx>) {
  const l = s.local[3]
  s.fx.fall *= smootherstep(0.02, 0.5, l)
  s.fx.flyingLeaves *= smootherstep(0.02, 0.18, l) * (1 - smootherstep(0.5, 0.72, l))
  s.fx.snow *= smootherstep(0.48, 0.74, l)
  s.fx.snowCover *= smootherstep(0.6, 0.95, l)
  return s
}

export const flow: Flow<RootFx> = { ...baseFlow, sample: (p, out) => stageSeasons(baseFlow.sample(p, out)) }

export const COUNTS = {
  /** L-system iterations: segments grow ~3x per level */
  iterations: { high: 6, mid: 6, low: 5 },
  leavesPerTip: { high: 3, mid: 2, low: 2 },
  weather: { high: 7000, mid: 4500, low: 2000 },
}
