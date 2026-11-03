// Hydrargyr Audio: the ONE chapter table. A single body of liquid metal in a dark studio:
// pool -> headphone-like form -> watch-like form -> sphere. The four shape weights (wPool...)
// are fx values, so the smootherstep chapter blend IS the morph.
// Palette: chrome neutrals; cool 250 (primary) and warm 60 (secondary) studio reflections.

import type { Vec3 } from '../engine/curve'
import { type BaseFx, type ChapterDef, type PaletteKey, createFlow } from '../engine/timeline'

export interface MetalFx extends BaseFx {
  wPool: number
  wHead: number
  wWatch: number
  wSphere: number
  /** surface ripple / wobble amount */
  ripple: number
  /** cool vs warm softbox balance (0 cool .. 1 warm) */
  warmth: number
  /** softbox brightness */
  studio: number
}

function key(at: number, o: { cool: number; warm: number; uiH: number; uiC?: number; back?: number }): PaletteKey {
  return {
    at,
    bg: [o.back ?? 0.13, 0.012, 250],
    fog: [(o.back ?? 0.13) + 0.06, 0.016, 250],
    primary: [0.84, o.cool, 250],
    secondary: [0.82, o.warm, 60],
    accent: [0.86, o.uiC ?? 0.06, o.uiH],
    text: [0.97, 0.008, 250],
    scrim: [0.17, 0.012, 250],
  }
}

const P = (pos: Vec3, look: Vec3, at: number) => ({ at, pos, look })
const base = { fov: 38, bloom: 0.55, grain: 0.12, vignette: 0.5, chroma: 0.15, fogDensity: 0, exposure: 1 }

export const chapters: ChapterDef<MetalFx>[] = [
  {
    id: 'pool',
    title: 'Pool',
    start: 0,
    end: 0.2,
    copy: {
      eyebrow: '01 · Pool',
      heading: 'Hydrargyr Audio: sound, poured into shape.',
      body: [
        'We are a small audio brand designing listening objects: headphones, a listening watch, and the smallest speaker we could make sound full.',
        'Every product starts as a pool of possibilities: one material, one surface, and a single question about how it should feel in the hand.',
      ],
    },
    fx: { ...base, wPool: 1, wHead: 0, wWatch: 0, wSphere: 0, ripple: 1, warmth: 0.25, studio: 1 },
    palette: [key(0, { cool: 0.08, warm: 0.05, uiH: 250 }), key(0.8, { cool: 0.085, warm: 0.05, uiH: 245 })],
    camera: [P([0, 2.4, 5.6], [0, -0.55, 0], 0), P([1.4, 1.8, 5.2], [0, -0.4, 0], 0.85)],
  },
  {
    id: 'headphones',
    title: 'Headphones',
    start: 0.2,
    end: 0.5,
    copy: {
      eyebrow: '02 · Over-ear',
      heading: 'A headband that weighs almost nothing.',
      body: [
        'Our over-ear model rests on two points instead of clamping your head, and its cups are tuned to stay neutral for long listening sessions.',
        'The finish is a single continuous surface, with no seams to collect dust and nothing to rattle.',
      ],
    },
    fx: { ...base, bloom: 0.6, wPool: 0, wHead: 1, wWatch: 0, wSphere: 0, ripple: 0.25, warmth: 0.7, studio: 1.1 },
    palette: [key(0.3, { cool: 0.06, warm: 0.09, uiH: 70 }), key(0.85, { cool: 0.06, warm: 0.095, uiH: 62 })],
    camera: [P([3.0, 0.9, 4.6], [0, 0, 0], 0.2), P([2.0, 0.45, 5.2], [0, 0.03, 0], 0.72)],
  },
  {
    id: 'watch',
    title: 'Watch',
    start: 0.5,
    end: 0.8,
    copy: {
      eyebrow: '03 · Listening watch',
      heading: 'Your music, on your wrist, without a phone.',
      body: [
        'The listening watch stores your library and streams it to your headphones on its own. One crown controls everything; the face shows only what you are playing.',
        'Battery life is designed around a full working day of listening.',
      ],
    },
    fx: { ...base, wPool: 0, wHead: 0, wWatch: 1, wSphere: 0, ripple: 0.2, warmth: 0.35, studio: 1.05 },
    palette: [key(0.3, { cool: 0.095, warm: 0.06, uiH: 255 }), key(0.85, { cool: 0.09, warm: 0.065, uiH: 250 })],
    camera: [P([-1.4, 0.5, 4.8], [0, 0.05, 0], 0.32), P([-0.6, 0.2, 5.0], [0, 0.05, 0], 0.85)],
  },
  {
    id: 'sphere',
    title: 'Sphere',
    start: 0.8,
    end: 1,
    copy: {
      eyebrow: '04 · The sphere',
      heading: 'Hear it before anyone else.',
      body: [
        'Our next object is a palm-sized speaker shaped like a single drop. Join the list and we will invite you to a listening session before it launches.',
      ],
    },
    fx: { ...base, bloom: 0.65, vignette: 0.45, wPool: 0, wHead: 0, wWatch: 0, wSphere: 1, ripple: 0.45, warmth: 0.5, studio: 1.15 },
    palette: [key(0.3, { cool: 0.075, warm: 0.08, uiH: 60, uiC: 0.05, back: 0.15 }), key(1, { cool: 0.07, warm: 0.08, uiH: 55, uiC: 0.05, back: 0.16 })],
    camera: [P([0.6, 0.6, 5.6], [0, 0, 0], 0.3), P([0, 0.45, 5.4], [0, 0, 0], 1)],
  },
]

export const flow = createFlow<MetalFx>({
  chapters,
  blend: 0.07,
  textFade: 0.035,
  bounds: {
    l: { bg: [0.1, 0.2], fog: [0.14, 0.26], text: [0.95, 0.99], scrim: [0.15, 0.2], accent: [0.8, 0.9], primary: [0.75, 0.9], secondary: [0.75, 0.9] },
    c: { bg: 0.02, fog: 0.025, text: 0.012, scrim: 0.02, accent: 0.1, primary: 0.11, secondary: 0.11 },
  },
})

/** Ray-march budget per tier: render scale (of the DPR-capped canvas), max steps, AO taps. */
export const MARCH = {
  high: { scale: 1, steps: 110, ao: 1 },
  mid: { scale: 0.7, steps: 72, ao: 1 },
  low: { scale: 0.5, steps: 48, ao: 0 },
}
