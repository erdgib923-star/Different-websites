// Inkfold: the ONE chapter table. A sheet of paper, a GPU fluid on it, a camera that drifts over
// the sheet. Emitters, vorticity and the "settle into type" attraction are fx values here, so the
// way the ink is driven is a pure function of progress (the fluid itself is a simulation: see README).
// Palette: cream paper (bg), blue-black ink hue 265 (primary), vermilion 30 (accent).

import type { Vec3 } from '../engine/curve'
import { type BaseFx, type ChapterDef, type PaletteKey, createFlow } from '../engine/timeline'

export interface InkFx extends BaseFx {
  /** central drop emitter */
  drop: number
  /** radial bloom emitters */
  bloomInk: number
  /** left-to-right current emitters */
  currents: number
  /** vermilion injection */
  vermilion: number
  /** attraction of the ink into the headline mask (0..1) */
  settle: number
  /** vorticity confinement strength */
  curl: number
  /** ink added by pointer movement */
  pointerInk: number
  /** velocity dissipation (higher = calmer) */
  calm: number
}

export const SHEET = { w: 16, h: 10 }
export const HEADLINE = 'Inkfold'

function key(at: number, o: { paper: number; ink: number; inkL: number; ver: number }): PaletteKey {
  return {
    at,
    bg: [o.paper, 0.022, 85],
    fog: [o.paper - 0.03, 0.026, 80],
    primary: [o.inkL, 0.06, o.ink],
    secondary: [o.inkL + 0.14, 0.08, o.ink - 10],
    accent: [0.46, 0.17, o.ver],
    text: [0.22, 0.03, o.ink],
    scrim: [0.975, 0.012, 85],
  }
}

const P = (pos: Vec3, look: Vec3, at: number) => ({ at, pos, look })
const base = { fov: 42, bloom: 0.15, grain: 0.14, vignette: 0.32, chroma: 0.12, fogDensity: 0, exposure: 1 }

export const chapters: ChapterDef<InkFx>[] = [
  {
    id: 'drop',
    title: 'Drop',
    start: 0,
    end: 0.2,
    copy: {
      eyebrow: '01 · Drop',
      heading: 'Inkfold makes letters out of liquid.',
      body: [
        'We are a small type-and-ink studio. We draw typefaces, mix inks and print short runs, and we test every letterform the old way: wet, on paper, under a loupe.',
        'Everything begins with one drop. Scroll slowly, or move your pointer across the sheet to push the ink yourself.',
      ],
    },
    fx: { ...base, drop: 1, bloomInk: 0, currents: 0, vermilion: 0, settle: 0, curl: 18, pointerInk: 0.5, calm: 0.25 },
    palette: [key(0, { paper: 0.95, ink: 265, inkL: 0.24, ver: 30 }), key(0.8, { paper: 0.95, ink: 266, inkL: 0.24, ver: 30 })],
    camera: [P([0, -1.4, 6.2], [0, 0.2, 0], 0), P([0.4, -1.8, 7], [0.1, 0.1, 0], 0.9)],
  },
  {
    id: 'bloom',
    title: 'Bloom of ink',
    start: 0.2,
    end: 0.5,
    copy: {
      eyebrow: '02 · Bloom',
      heading: 'A drop never spreads evenly.',
      body: [
        'Paper fibres, humidity and the weight of the pigment all pull at the edge of a drop. That uneven bloom is where a typeface gets its texture, and we design for it rather than against it.',
        'Our inks are mixed in small batches and tested on six papers before we use them for a specimen.',
      ],
    },
    fx: { ...base, drop: 0.2, bloomInk: 1, currents: 0, vermilion: 0.2, settle: 0, curl: 30, pointerInk: 0.8, calm: 0.15 },
    palette: [key(0.4, { paper: 0.945, ink: 265, inkL: 0.23, ver: 30 })],
    camera: [P([1.6, -3.2, 9], [0, 0, 0], 0.2), P([-0.6, -2.6, 10], [0, 0.2, 0], 0.8)],
  },
  {
    id: 'currents',
    title: 'Currents',
    start: 0.5,
    end: 0.8,
    copy: {
      eyebrow: '03 · Currents',
      heading: 'Then the ink starts to move with intent.',
      body: [
        'A stroke is a current: it has speed, pressure and direction. We study how a brush or nib drags ink across a surface and draw those currents into the stems and curves of our letters.',
        'Vermilion is our only second colour. We use it for corrections, for counters, and for the occasional flourish.',
      ],
    },
    fx: { ...base, drop: 0, bloomInk: 0.25, currents: 1, vermilion: 1, settle: 0, curl: 34, pointerInk: 1, calm: 0.1 },
    palette: [key(0.5, { paper: 0.94, ink: 262, inkL: 0.25, ver: 30 })],
    camera: [P([-3.2, -2.4, 8.6], [-0.8, 0, 0], 0.25), P([2.6, -2.2, 9.2], [0.6, 0.1, 0], 0.85)],
  },
  {
    id: 'settle',
    title: 'Settle',
    start: 0.8,
    end: 1,
    copy: {
      eyebrow: '04 · Settle',
      heading: 'Finally, the ink settles into type.',
      body: [
        'When the movement stops, what is left is lettering. If you would like a specimen book, a custom face, or simply to see the inks, write to us.',
      ],
    },
    fx: { ...base, vignette: 0.26, drop: 0, bloomInk: 0, currents: 0, vermilion: 0.15, settle: 1, curl: 6, pointerInk: 0.25, calm: 1.4 },
    palette: [key(0.3, { paper: 0.955, ink: 265, inkL: 0.22, ver: 30 }), key(1, { paper: 0.96, ink: 265, inkL: 0.2, ver: 30 })],
    camera: [P([0.4, -0.8, 13.2], [0.4, 0.05, 0], 0.35), P([0.5, -0.3, 13.8], [0.5, 0, 0], 1)],
  },
]

export const flow = createFlow<InkFx>({
  chapters,
  blend: 0.05,
  textFade: 0.035,
  bounds: {
    l: { bg: [0.9, 0.97], fog: [0.86, 0.95], text: [0.15, 0.26], scrim: [0.95, 0.99], accent: [0.42, 0.52], primary: [0.18, 0.3], secondary: [0.3, 0.45] },
    c: { bg: 0.03, fog: 0.035, text: 0.04, scrim: 0.02, accent: 0.19, primary: 0.08, secondary: 0.1 },
  },
})

/** Simulation sizes per tier (velocity/pressure grid, dye grid, Jacobi iterations). */
export const SIM = {
  high: { sim: 256, dye: 1024, iterations: 20 },
  mid: { sim: 192, dye: 768, iterations: 14 },
  low: { sim: 128, dye: 512, iterations: 8 },
}
