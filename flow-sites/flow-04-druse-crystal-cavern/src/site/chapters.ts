// Druse: the ONE chapter table. The camera travels along the axis of a single noise-carved cave:
// flared mouth -> narrow quartz corridor -> wide amethyst chamber -> spherical heart geode.
// Hue path (light / glow, `primary` + `accent`): amethyst 300 -> rose 350 -> teal 190 -> amber 80.
// Crystal bodies (`secondary`) keep their mineral colour: amethyst, rose quartz, amethyst, citrine.

import type { Vec3 } from '../engine/curve'
import type { LCH } from '../engine/color'
import { type BaseFx, type ChapterDef, type PaletteKey, createFlow } from '../engine/timeline'

export interface DruseFx extends BaseFx {
  /** crystal inner glow */
  glow: number
  /** floating dust */
  dust: number
  /** glitter on the rock */
  sparkle: number
  /** light reaching the walls */
  wallLight: number
  /** daylight from the mouth */
  daylight: number
  /** hero crystals in the geode (scale-in + light) */
  hero: number
}

/** Cave centreline control points and radius at each (passed through by a Catmull-Rom curve). */
export const CAVE = {
  points: [
    [0, 1, 46],
    [0, 0, 14],
    [2, -1, -18],
    [-3, -3, -52],
    [3, -5, -88],
    [0, -6, -128],
    [-5, -8, -170],
    [0, -10, -214],
    [0, -10, -238],
    [0, -10, -260],
    [0, -10, -271],
  ] as Vec3[],
  // the last ring closes the geode (no open end where the sky would show through)
  radius: [34, 16, 8, 7, 8, 21, 11, 24, 27, 19, 1.5],
  geode: [0, -10, -238] as Vec3,
}

function key(at: number, light: number, crystal: LCH, o: { lift?: number } = {}): PaletteKey {
  const lift = o.lift ?? 0
  return {
    at,
    bg: [0.11 + lift, 0.03, light],
    fog: [0.15 + lift, 0.045, light],
    primary: [0.82, 0.14, light],
    secondary: crystal,
    accent: [0.85, 0.11, light + 12],
    text: [0.97, 0.012, light],
    scrim: [0.17, 0.035, light],
  }
}

const P = (pos: Vec3, look: Vec3, at: number) => ({ at, pos, look })
const base = { fov: 56, bloom: 1.0, grain: 0.2, vignette: 0.6, chroma: 0.35, fogDensity: 0.02, exposure: 1 }
const G = CAVE.geode

export const chapters: ChapterDef<DruseFx>[] = [
  {
    id: 'mouth',
    title: 'Cave mouth',
    start: 0,
    end: 0.2,
    copy: {
      eyebrow: '01 · The mouth',
      heading: 'Druse: we collect the inside of stones.',
      body: [
        'Druse is a small collective of collectors, cutters and field geologists. We share finds, tools and know-how, and we put the best pieces on show twice a year.',
        'A druse is a crust of small crystals lining a cavity in rock. Every specimen we keep started as an empty space that slowly filled with mineral-rich water.',
      ],
    },
    fx: { ...base, fogDensity: 0.012, glow: 0.45, dust: 0.6, sparkle: 0.4, wallLight: 1, daylight: 1, hero: 0 },
    palette: [key(0, 300, [0.62, 0.15, 300], { lift: 0.05 }), key(0.85, 305, [0.6, 0.15, 302], { lift: 0.02 })],
    camera: [P([0, 1.5, 44], [0, 0, 0], 0), P([0.8, 0.6, 22], [0.5, -0.5, -10], 0.55), P([1.2, -0.4, 4], [1, -1.5, -30], 0.95)],
  },
  {
    id: 'quartz',
    title: 'Quartz corridor',
    start: 0.2,
    end: 0.45,
    copy: {
      eyebrow: '02 · Quartz corridor',
      heading: 'Pink light, slow growth.',
      body: [
        'Rose quartz takes its colour from tiny fibrous inclusions. Its crystals are rare; most rose quartz grows as massive rock instead.',
        'In the corridor we teach the basics: how to read a vein, how to split a nodule without crushing what is inside, and when to leave a pocket where it is.',
      ],
    },
    fx: { ...base, fogDensity: 0.024, glow: 0.8, dust: 0.9, sparkle: 0.7, wallLight: 0.55, daylight: 0.15, hero: 0 },
    palette: [key(0.3, 345, [0.72, 0.1, 352]), key(0.85, 355, [0.72, 0.1, 355])],
    camera: [P([1.5, -1.2, -22], [-1.5, -2.5, -48], 0.2), P([-2.2, -2.6, -50], [1.5, -4.2, -80], 0.55), P([2.4, -4.6, -84], [0.5, -5.5, -112], 0.92)],
  },
  {
    id: 'amethyst',
    title: 'Amethyst chamber',
    start: 0.45,
    end: 0.7,
    copy: {
      eyebrow: '03 · Amethyst chamber',
      heading: 'The chamber opens.',
      body: [
        'Amethyst is quartz coloured violet by traces of iron and natural irradiation. Large cavities can be lined with thousands of crystal points, all growing toward the centre.',
        'Members bring pieces here to be photographed, weighed and catalogued, so every specimen in the collective has a documented origin.',
      ],
    },
    fx: { ...base, fogDensity: 0.016, bloom: 1.15, glow: 1, dust: 0.75, sparkle: 0.9, wallLight: 0.7, daylight: 0, hero: 0 },
    palette: [key(0.25, 195, [0.58, 0.16, 298]), key(0.85, 185, [0.6, 0.16, 292])],
    camera: [P([-1, -5.6, -116], [0, -6, -140], 0.15), P([10, -3.5, -126], [-3, -7, -146], 0.5), P([-6, -6.5, -152], [-3, -8.5, -180], 0.9)],
  },
  {
    id: 'geode',
    title: 'Heart geode',
    start: 0.7,
    end: 1,
    copy: {
      eyebrow: '04 · The heart',
      heading: 'Come and see the heart of the stone.',
      body: [
        'Our open show is held twice a year: specimens, cutting demonstrations and a table where you can bring your own finds to be identified. Tell us you are coming and we will save you a place.',
      ],
    },
    fx: { ...base, fogDensity: 0.011, bloom: 1.25, vignette: 0.55, glow: 1.15, dust: 0.6, sparkle: 1, wallLight: 0.9, daylight: 0, hero: 1 },
    palette: [key(0.2, 80, [0.8, 0.13, 78], { lift: 0.02 }), key(1, 75, [0.8, 0.13, 72], { lift: 0.03 })],
    camera: [P([-2, -9, -200], [0, -10, -226], 0.15), P([11, -6, -226], [G[0], G[1], G[2]], 0.55), P([7, -7.5, -224], [G[0], G[1] + 0.5, G[2]], 1)],
  },
]

export const flow = createFlow<DruseFx>({
  chapters,
  blend: 0.06,
  textFade: 0.035,
  bounds: {
    l: { bg: [0.08, 0.2], fog: [0.1, 0.24], text: [0.95, 0.99], scrim: [0.14, 0.2], accent: [0.8, 0.9], primary: [0.75, 0.9], secondary: [0.5, 0.85] },
    c: { bg: 0.05, fog: 0.07, text: 0.02, scrim: 0.05, accent: 0.13, primary: 0.16, secondary: 0.17 },
  },
})

export const COUNTS = {
  prisms: { high: 3200, mid: 1900, low: 900 },
  octa: { high: 900, mid: 550, low: 260 },
  dust: { high: 5000, mid: 3000, low: 1500 },
}
