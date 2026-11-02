// Thalassa Deep: the ONE chapter table (copy, fx, OKLCH palette keys, camera keys).
// World units: 1 unit ~ "a few metres"; the camera sinks from y = -2 to y = -392 along an S-curve.
// The displayed depth in metres is a separate, non-linear mapping (DEPTH_M) for the gauge.

import type { Vec3 } from '../engine/curve'
import type { LCH } from '../engine/color'
import { MonotoneTrack } from '../engine/math'
import { type BaseFx, type ChapterDef, type PaletteKey, createFlow } from '../engine/timeline'

export interface DeepFx extends BaseFx {
  /** caustic light on the reef wall and floor */
  caustics: number
  /** god-ray strength */
  rays: number
  /** marine snow brightness */
  snow: number
  /** bioluminescence (creatures, wall speckles, lures) */
  bio: number
  /** brightness of the surface / Snell's window above */
  surface: number
  /** ambient light reaching the wall */
  ambient: number
}

export const WORLD = {
  wallX: -54,
  floorY: -408,
  surfaceY: 0,
}

/** Progress -> displayed depth in metres (sunlit 0-200, twilight 200-1000, midnight 1000-4000, abyss 4000-6000). */
export const DEPTH_M = new MonotoneTrack([0, 0.2, 0.45, 0.7, 1], [0, 200, 1000, 4000, 5900])

function key(at: number, o: { water: LCH; light: LCH; rock: LCH; glow: LCH; hue: number }): PaletteKey {
  return {
    at,
    bg: o.water,
    fog: [o.water[0] + 0.05, o.water[1] * 1.1, o.water[2] - 4],
    primary: o.light,
    secondary: o.rock,
    accent: o.glow,
    text: [0.97, 0.012, o.hue],
    scrim: [0.17, 0.035, o.hue + 10],
  }
}

const P = (pos: Vec3, look: Vec3, at: number) => ({ at, pos, look })
const base = { fov: 55, bloom: 0.8, grain: 0.3, vignette: 0.55, chroma: 0.25, fogDensity: 0.012, exposure: 1 }

export const chapters: ChapterDef<DeepFx>[] = [
  {
    id: 'sunlit',
    title: 'Sunlit',
    start: 0,
    end: 0.2,
    copy: {
      eyebrow: '0–200 m · Sunlit zone',
      heading: 'Thalassa Deep: notes from one long descent.',
      body: [
        'We are a small, reader-funded journal. Each issue follows a single dive from the bright surface down to the abyssal plain, and records what the water does to light along the way.',
        'Up here the sea is lit from above. Sunlight bends through the waves and draws moving nets of caustic light on the reef.',
      ],
    },
    fx: { ...base, bloom: 0.9, grain: 0.18, fogDensity: 0.011, caustics: 1, rays: 1, snow: 0.35, bio: 0, surface: 1, ambient: 1 },
    palette: [
      key(0, { water: [0.5, 0.085, 195], light: [0.95, 0.06, 185], rock: [0.62, 0.06, 165], glow: [0.86, 0.1, 190], hue: 195 }),
      key(0.85, { water: [0.4, 0.085, 200], light: [0.92, 0.07, 190], rock: [0.55, 0.06, 175], glow: [0.86, 0.1, 195], hue: 200 }),
    ],
    camera: [P([4, -3, 34], [0, 6, 4], 0), P([7, -22, 18], [0, -34, -4], 0.55), P([0, -42, 6], [-6, -62, -14], 0.92)],
  },
  {
    id: 'twilight',
    title: 'Twilight',
    start: 0.2,
    end: 0.45,
    copy: {
      eyebrow: '200–1,000 m · Twilight zone',
      heading: 'The light gives up its reds first.',
      body: [
        'Water absorbs long wavelengths quickly. Red is gone within the first few metres, then orange and yellow, until only a thin blue remains.',
        'Below about 200 metres there is too little sunlight for photosynthesis. Many animals here rise to feed at night and sink again before dawn.',
      ],
    },
    fx: { ...base, fogDensity: 0.018, bloom: 0.85, caustics: 0.25, rays: 0.45, snow: 0.6, bio: 0.35, surface: 0.15, ambient: 0.45 },
    palette: [
      key(0.4, { water: [0.27, 0.075, 215], light: [0.86, 0.08, 205], rock: [0.42, 0.05, 215], glow: [0.84, 0.11, 200], hue: 215 }),
      key(0.9, { water: [0.19, 0.065, 235], light: [0.82, 0.09, 205], rock: [0.34, 0.045, 230], glow: [0.84, 0.11, 205], hue: 235 }),
    ],
    camera: [P([-9, -80, -6], [-2, -102, -28], 0.25), P([6, -128, -24], [1, -150, -44], 0.6), P([-3, -168, -38], [-4, -190, -56], 0.95)],
  },
  {
    id: 'midnight',
    title: 'Midnight',
    start: 0.45,
    end: 0.7,
    copy: {
      eyebrow: '1,000–4,000 m · Midnight zone',
      heading: 'Here, the only light is made by animals.',
      body: [
        'No sunlight reaches this far. What you see instead is bioluminescence: chemical light that animals use to hunt, to hide their silhouettes and to find each other.',
        'Marine snow drifts through the dark: flakes of organic matter falling from the water above, food for almost everything that lives below.',
      ],
    },
    fx: { ...base, fogDensity: 0.019, bloom: 1.1, grain: 0.32, caustics: 0, rays: 0, snow: 1, bio: 0.8, surface: 0, ambient: 0.12 },
    palette: [
      key(0.4, { water: [0.12, 0.05, 245], light: [0.8, 0.12, 200], rock: [0.26, 0.04, 245], glow: [0.84, 0.12, 215], hue: 245 }),
      key(0.95, { water: [0.09, 0.045, 255], light: [0.8, 0.13, 200], rock: [0.22, 0.035, 255], glow: [0.83, 0.12, 280], hue: 255 }),
    ],
    camera: [P([7, -212, -56], [2, -234, -78], 0.25), P([-5, -255, -74], [0, -278, -96], 0.6), P([4, -292, -90], [0, -314, -112], 0.95)],
  },
  {
    id: 'abyss',
    title: 'Abyss',
    start: 0.7,
    end: 1,
    copy: {
      eyebrow: '4,000–6,000 m · Abyssal plain',
      heading: 'Read the next descent.',
      body: [
        'The abyssal plain is one of the largest and least-explored habitats on Earth: cold, dark, under enormous pressure, and still full of small lights.',
        'Thalassa Deep publishes one long descent each season. Leave an address and we will send the next issue when it surfaces.',
      ],
    },
    fx: { ...base, fogDensity: 0.013, bloom: 1.2, grain: 0.3, vignette: 0.6, caustics: 0, rays: 0, snow: 0.8, bio: 1, surface: 0, ambient: 0.06 },
    palette: [
      key(0.3, { water: [0.075, 0.04, 262], light: [0.8, 0.13, 200], rock: [0.2, 0.03, 262], glow: [0.82, 0.13, 330], hue: 262 }),
      key(1, { water: [0.07, 0.04, 266], light: [0.8, 0.13, 200], rock: [0.2, 0.03, 266], glow: [0.82, 0.13, 340], hue: 265 }),
    ],
    camera: [P([-6, -334, -106], [0, -360, -128], 0.25), P([3, -366, -118], [0, -392, -146], 0.65), P([0, -384, -122], [0, -398, -156], 1)],
  },
]

export const flow = createFlow<DeepFx>({
  chapters,
  blend: 0.05,
  textFade: 0.035,
  bounds: {
    l: { bg: [0.06, 0.52], fog: [0.1, 0.56], text: [0.95, 0.99], scrim: [0.15, 0.2], accent: [0.8, 0.9], primary: [0.75, 0.96], secondary: [0.18, 0.65] },
    c: { bg: 0.1, fog: 0.1, text: 0.02, scrim: 0.05, accent: 0.14, primary: 0.14, secondary: 0.08 },
  },
})

export const COUNTS = {
  snow: { high: 14000, mid: 8000, low: 3500 },
  jellies: { high: 54, mid: 40, low: 26 },
  lures: { high: 1400, mid: 900, low: 450 },
}
