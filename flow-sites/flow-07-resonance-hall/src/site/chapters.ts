// Resonance Hall: the ONE chapter table. One landscape of sound along -z: a still plain,
// broad bass hills, sharp midrange ridges, then fine treble ripples. The camera glides over it.
// Hue path (contour glow, `primary`): dark plum base 320 -> low 280 -> mid 200 -> high 90.
// The *_Level fx keys set the generative music mix per chapter (used only while sound plays).

import type { Vec3 } from '../engine/curve'
import type { LCH } from '../engine/color'
import { type BaseFx, type ChapterDef, type PaletteKey, createFlow } from '../engine/timeline'

export interface SoundFx extends BaseFx {
  /** contour-line glow */
  lineGlow: number
  /** contour spacing multiplier (denser = higher frequency) */
  contour: number
  /** grid-line glow */
  grid: number
  /** floating shimmer motes */
  shimmer: number
  /** how strongly live audio displaces the terrain */
  audioGain: number
  /** music mix (0..1) */
  droneLevel: number
  bassLevel: number
  midLevel: number
  trebleLevel: number
}

/** Terrain regions along z (world units). */
export const REGIONS = { silenceEnd: -10, bassEnd: -170, midEnd: -340, length: 560, width: 180, zStart: 40 }

function key(at: number, h: number, o: { glowL?: number; lift?: number; accentH?: number } = {}): PaletteKey {
  const lift = o.lift ?? 0
  return {
    at,
    bg: [0.1 + lift, 0.04, h],
    fog: [0.14 + lift, 0.05, h],
    primary: [o.glowL ?? 0.8, 0.15, h],
    secondary: [0.3 + lift, 0.06, h],
    accent: [0.86, 0.12, o.accentH ?? h + 20] as LCH,
    text: [0.97, 0.012, h],
    scrim: [0.17, 0.035, h],
  }
}

const P = (pos: Vec3, look: Vec3, at: number) => ({ at, pos, look })
const base = { fov: 52, bloom: 0.95, grain: 0.22, vignette: 0.55, chroma: 0.25, fogDensity: 0.011, exposure: 1 }

export const chapters: ChapterDef<SoundFx>[] = [
  {
    id: 'silence',
    title: 'Silence',
    start: 0,
    end: 0.15,
    copy: {
      eyebrow: '01 · Silence',
      heading: 'Resonance Hall is a venue for listening.',
      body: [
        'We are a small sound-art venue: installations, long-form performances and quiet rooms built for one sound at a time.',
        'Everything here starts from silence. Press "Play sound" below for a generative piece made live in your browser, or keep scrolling in quiet. The landscape is shaped either way.',
      ],
    },
    fx: { ...base, bloom: 0.8, lineGlow: 0.45, contour: 0.7, grid: 0.35, shimmer: 0, audioGain: 0.4, droneLevel: 0.5, bassLevel: 0, midLevel: 0, trebleLevel: 0 },
    palette: [key(0, 320, { glowL: 0.76, lift: -0.02 }), key(0.8, 318)],
    camera: [P([0, 5.5, 44], [0, 2.5, 0], 0), P([1.5, 6.5, 24], [0, 3, -20], 0.85)],
  },
  {
    id: 'bass',
    title: 'Bass hills',
    start: 0.15,
    end: 0.4,
    copy: {
      eyebrow: '02 · Low frequencies',
      heading: 'Low sound moves the room before it reaches the ear.',
      body: [
        'Below roughly a hundred hertz you feel sound as much as you hear it: in the floor, the chest, the air pressure of the room. Our main hall is tuned for those long, slow waves.',
        'Residencies here often begin with a single sustained tone and a week to listen to what it does.',
      ],
    },
    fx: { ...base, lineGlow: 0.8, contour: 1.5, grid: 0.3, shimmer: 0, audioGain: 1, droneLevel: 0.7, bassLevel: 1, midLevel: 0.15, trebleLevel: 0 },
    palette: [key(0.4, 285), key(0.9, 275)],
    camera: [P([-3, 8, 0], [0, 3, -45], 0.15), P([4, 12, -60], [0, 4, -110], 0.55), P([-2, 10, -128], [0, 5, -175], 0.92)],
  },
  {
    id: 'mid',
    title: 'Midrange ridges',
    start: 0.4,
    end: 0.7,
    copy: {
      eyebrow: '03 · Midrange',
      heading: 'The midrange is where voices live.',
      body: [
        'Speech, most instruments and most of what we call timbre sit in the middle of the spectrum. It is also where a room reveals itself, in reflections and in the ridges of standing waves.',
        'Our studio programme pairs artists with acousticians to build pieces around a specific space.',
      ],
    },
    fx: { ...base, bloom: 1.0, lineGlow: 1, contour: 1.4, grid: 0.4, shimmer: 0.15, audioGain: 1, droneLevel: 0.45, bassLevel: 0.5, midLevel: 1, trebleLevel: 0.25 },
    palette: [key(0.35, 210, { glowL: 0.82 }), key(0.9, 195, { glowL: 0.82 })],
    camera: [P([5, 9, -192], [0, 4, -240], 0.2), P([-6, 13, -262], [0, 5, -310], 0.6), P([3, 11, -326], [0, 4, -372], 0.95)],
  },
  {
    id: 'treble',
    title: 'Treble shimmer',
    start: 0.7,
    end: 1,
    copy: {
      eyebrow: '04 · High frequencies',
      heading: 'Come and listen with us.',
      body: [
        'High frequencies are fragile: absorbed by air, scattered by surfaces, gone in a few metres. They are also what makes a room feel alive. Our listening sessions run every Thursday evening, in the dark.',
      ],
    },
    fx: { ...base, bloom: 1.15, grain: 0.18, lineGlow: 0.9, contour: 2.4, grid: 0.25, shimmer: 1, audioGain: 0.9, droneLevel: 0.3, bassLevel: 0.15, midLevel: 0.4, trebleLevel: 1 },
    palette: [key(0.25, 105, { glowL: 0.84, lift: 0.01, accentH: 95 }), key(1, 90, { glowL: 0.86, lift: 0.02, accentH: 85 })],
    camera: [P([-4, 8, -356], [0, 3, -402], 0.2), P([5, 10, -410], [0, 3, -456], 0.6), P([0, 15, -440], [0, 2, -500], 1)],
  },
]

export const flow = createFlow<SoundFx>({
  chapters,
  blend: 0.06,
  textFade: 0.035,
  bounds: {
    l: { bg: [0.07, 0.14], fog: [0.1, 0.18], text: [0.95, 0.99], scrim: [0.15, 0.2], accent: [0.8, 0.9], primary: [0.72, 0.9], secondary: [0.22, 0.36] },
    c: { bg: 0.05, fog: 0.06, text: 0.02, scrim: 0.05, accent: 0.14, primary: 0.17, secondary: 0.08 },
  },
})

export const COUNTS = {
  /** terrain grid (columns x rows) */
  grid: { high: [256, 900], mid: [192, 680], low: [128, 450] } as Record<'high' | 'mid' | 'low', [number, number]>,
  motes: { high: 4000, mid: 2500, low: 1200 },
}
