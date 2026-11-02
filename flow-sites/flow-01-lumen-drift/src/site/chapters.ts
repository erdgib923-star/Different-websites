// Lumen Drift: the ONE chapter table. Copy, effect strengths, OKLCH palette keys and camera keys
// all live here; sceneState() is derived from it by the engine (src/engine/timeline.ts).

import type { Vec3 } from '../engine/curve'
import type { LCH } from '../engine/color'
import { type BaseFx, type ChapterDef, type PaletteKey, createFlow } from '../engine/timeline'

export interface LumenFx extends BaseFx {
  /** particle HDR brightness */
  intensity: number
  /** point size multiplier */
  size: number
  /** curl-noise displacement amount */
  turbulence: number
  /** extra vortex spin */
  spin: number
  /** cursor repulsion strength */
  repel: number
  /** ribbon trail opacity */
  ribbon: number
  /** luminous horizon band in the background */
  horizon: number
  /** fbm nebula amount in the background */
  nebula: number
}

/** World anchors shared by the chapter table and the particle targets. */
export const WORLD = {
  river: [
    [0, -0.6, 3],
    [2, -0.8, -12],
    [-2.5, -0.6, -28],
    [2, -0.9, -44],
    [-1.5, -0.7, -60],
    [0, -0.5, -76],
  ] as Vec3[],
  canyon: { zStart: -74, zEnd: -138, floor: -2.2 },
  storm: [0, 6, -165] as Vec3,
  flower: [0, 4, -205] as Vec3,
  horizon: { zNear: -236, zFar: -640 },
}

/** Palette key from a hue (unwrapped degrees) plus per-chapter lift/saturation. */
function key(at: number, h: number, o: { lift?: number; sat?: number; accentShift?: number } = {}): PaletteKey {
  const lift = o.lift ?? 0
  const sat = o.sat ?? 1
  const ah = h + (o.accentShift ?? 42)
  const c = (l: number, ch: number, hue: number): LCH => [l, ch, hue]
  return {
    at,
    bg: c(0.12 + lift, 0.035 * sat, h),
    fog: c(0.2 + lift * 1.4, 0.055 * sat, h - 8),
    primary: c(0.8, 0.15 * sat, h),
    secondary: c(0.72, 0.13 * sat, h - 34),
    accent: c(0.86, 0.1 * sat, ah),
    text: c(0.97, 0.012, h),
    scrim: c(0.17 + lift * 0.4, 0.03 * sat, h),
  }
}

const P = (pos: Vec3, look: Vec3, at: number) => ({ at, pos, look })
const F = WORLD.flower
const orbit = (deg: number, r = 25, y = 13): Vec3 => [F[0] + Math.sin((deg * Math.PI) / 180) * r, F[1] + y, F[2] + Math.cos((deg * Math.PI) / 180) * r]

const base = { fov: 50, bloom: 0.9, grain: 0.32, vignette: 0.55, chroma: 0.4, fogDensity: 0.012, exposure: 1 }

export const chapters: ChapterDef<LumenFx>[] = [
  {
    id: 'spark',
    title: 'Spark',
    start: 0,
    end: 0.12,
    copy: {
      eyebrow: '01 · Spark',
      heading: 'Lumen Drift builds things that glow on purpose.',
      body: [
        'We are a small creative-technology studio. We write the shaders, sensors and software behind light installations, launch films and interactive rooms.',
        'Every project starts the same way: one point of light, and a question about where it wants to go.',
      ],
    },
    fx: { ...base, bloom: 0.9, fov: 46, intensity: 1.3, size: 1, turbulence: 0.15, spin: 0, repel: 0.6, ribbon: 0, horizon: 0, nebula: 0.25 },
    palette: [key(0, 255, { lift: -0.02, sat: 0.9 }), key(0.8, 250)],
    camera: [P([0, 0.2, 9], [0, 0, 0], 0), P([0.6, 0.5, 5.2], [0, 0, -1.5], 0.7)],
  },
  {
    id: 'stream',
    title: 'Stream',
    start: 0.12,
    end: 0.3,
    copy: {
      eyebrow: '02 · Stream',
      heading: 'Ideas move like water before they set.',
      body: [
        'In the first weeks we prototype quickly and in the open: sketches in code, test rigs on the studio floor, dozens of small experiments we fully expect to throw away.',
        'Each one is a particle in the stream. The good ones keep moving.',
      ],
    },
    fx: { ...base, intensity: 1.9, size: 1.1, turbulence: 0.35, spin: 0, repel: 1, ribbon: 0.9, horizon: 0, nebula: 0.4 },
    palette: [key(0.5, 215)],
    camera: [P([1.6, 1.6, -2], [0.5, -0.4, -16], 0.15), P([-1.0, 1.3, -24], [-1, -0.6, -40], 0.5), P([1.0, 1.2, -50], [0, -0.4, -70], 0.9)],
  },
  {
    id: 'canyon',
    title: 'Canyon',
    start: 0.3,
    end: 0.48,
    copy: {
      eyebrow: '03 · Canyon',
      heading: 'Constraints carve the shape.',
      body: [
        'Budgets, venues, fire codes, the exact throw of a projector: we treat limits as the walls of a canyon. They are what gives the river its speed.',
        'This is where we measure, simulate and commit to one direction.',
      ],
    },
    fx: { ...base, fogDensity: 0.016, intensity: 2.1, size: 1.25, turbulence: 0.12, spin: 0, repel: 0.8, ribbon: 1, horizon: 0, nebula: 0.2 },
    palette: [key(0.5, 175, { lift: -0.01 })],
    camera: [P([0.2, 1.0, -79], [0, 0.8, -96], 0.2), P([-0.6, 1.6, -103], [0.5, 1.5, -122], 0.6), P([0.4, 2.6, -128], [0, 4, -150], 0.95)],
  },
  {
    id: 'storm',
    title: 'Storm',
    start: 0.48,
    end: 0.66,
    copy: {
      eyebrow: '04 · Storm',
      heading: 'Production is weather.',
      body: [
        'Lighting rigs, render nodes, late builds and live data feeds all arrive at once. We run production as a calm core inside the turbulence: one shared plan and a short checkpoint every morning.',
        'Our rule is simple. The storm can be loud; the team cannot.',
      ],
    },
    fx: { ...base, bloom: 1.1, chroma: 1, grain: 0.4, vignette: 0.68, fov: 54, intensity: 2.3, size: 1.15, turbulence: 0.8, spin: 1, repel: 1.2, ribbon: 0.8, horizon: 0, nebula: 0.7 },
    palette: [key(0.2, 85, { sat: 1.15, lift: -0.015, accentShift: 50 }), key(0.8, 30, { sat: 1.2, lift: -0.02 })],
    camera: [P([3, 5, -136], [0, 6, -165], 0.3), P([27, 9, -152], [0, 6, -166], 0.68), P([16, 13, -184], [0, 6, -201], 0.9)],
  },
  {
    id: 'bloom',
    title: 'Bloom',
    start: 0.66,
    end: 0.84,
    copy: {
      eyebrow: '05 · Bloom',
      heading: 'Then it opens.',
      body: [
        'Launch is when a piece meets people. We stay on site through opening week, tune the work in the room and hand over documentation your own team can maintain.',
        'Typical commissions: a reactive atrium ceiling, a tidal light walk along a harbour, a field of four hundred small singing lamps.',
      ],
    },
    fx: { ...base, bloom: 1.15, fov: 48, intensity: 2.4, size: 1.2, turbulence: 0.2, spin: 0, repel: 1, ribbon: 0.6, horizon: 0.15, nebula: 0.45 },
    palette: [key(0.2, -15, { sat: 1.05 }), key(0.8, -30)],
    camera: [P(orbit(10), F, 0.12), P(orbit(55), F, 0.38), P(orbit(100), F, 0.7), P(orbit(140, 22, 9), [0, 5, -240], 0.97)],
  },
  {
    id: 'horizon',
    title: 'Horizon',
    start: 0.84,
    end: 1,
    copy: {
      eyebrow: '06 · Horizon',
      heading: 'Start with one point of light.',
      body: [
        'Tell us about the room, the audience and the date. We reply within two working days, with questions rather than a sales deck.',
      ],
    },
    fx: { ...base, bloom: 1.0, grain: 0.26, vignette: 0.42, fov: 44, fogDensity: 0.006, intensity: 1.25, size: 1, turbulence: 0.08, spin: 0, repel: 0.6, ribbon: 0.35, horizon: 1, nebula: 0.3 },
    palette: [key(0.25, -65, { lift: 0.03 }), key(1, -110, { lift: 0.05, sat: 0.95 })],
    camera: [P([-4, 7, -232], [0, 4.5, -268], 0.2), P([0, 4.2, -250], [0, 3.2, -350], 0.6), P([0, 3.2, -262], [0, 2.8, -430], 1)],
  },
]

export const flow = createFlow<LumenFx>({
  chapters,
  blend: 0.035,
  textFade: 0.03,
  bounds: {
    l: { bg: [0.08, 0.24], fog: [0.14, 0.3], text: [0.94, 0.99], scrim: [0.12, 0.22], accent: [0.8, 0.9], primary: [0.7, 0.86], secondary: [0.62, 0.8] },
    c: { bg: 0.06, fog: 0.08, text: 0.02, scrim: 0.05, accent: 0.14, primary: 0.2, secondary: 0.18 },
  },
})

export const PARTICLES = { high: 120_000, mid: 60_000, low: 25_000 }
