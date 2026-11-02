// Skyline Almanac: the ONE chapter table. A single flyover from dawn over the peaks, through the
// cloud valley, to a city that rises at dusk and lights up at night.
// The spec's hue path (pink-gold 40 -> blue 240 -> amber 60 -> indigo 280) is carried by the
// horizon colour (`fog` role); city lights stay on hue 85 (`accent`).

import type { Vec3 } from '../engine/curve'
import type { LCH } from '../engine/color'
import { type BaseFx, type ChapterDef, type PaletteKey, createFlow } from '../engine/timeline'

export interface SkyFx extends BaseFx {
  /** sun elevation (radians) and azimuth (radians, 0 = straight down -z) */
  sunElev: number
  sunAz: number
  /** cloud coverage 0..1 */
  clouds: number
  /** city construction 0..1 (buildings rise with per-building delays) */
  rise: number
  /** window + street lights 0..1 */
  lights: number
  /** star field 0..1 */
  stars: number
  /** aerial haze multiplier */
  haze: number
}

export const WORLD = {
  city: [0, -800] as [number, number],
  cityRadius: 230,
  terrain: { size: 1500, centerZ: -480 },
  cloudLayers: [176, 218, 262],
}

interface Pal {
  sky: LCH
  horizon: LCH
  sun: LCH
  land: LCH
  hue: number
}
function key(at: number, p: Pal): PaletteKey {
  return {
    at,
    bg: p.sky,
    fog: p.horizon,
    primary: p.sun,
    secondary: p.land,
    accent: [0.86, 0.13, 85],
    text: [0.97, 0.012, p.hue],
    scrim: [0.19, 0.035, p.hue],
  }
}

const P = (pos: Vec3, look: Vec3, at: number) => ({ at, pos, look })
const base = { fov: 52, bloom: 0.7, grain: 0.1, vignette: 0.45, chroma: 0.2, fogDensity: 0.0009, exposure: 1 }

export const chapters: ChapterDef<SkyFx>[] = [
  {
    id: 'dawn',
    title: 'Dawn peaks',
    start: 0,
    end: 0.25,
    copy: {
      eyebrow: 'Edition 01 · Dawn',
      heading: 'Skyline Almanac: one day over one city.',
      body: [
        'We are a small publication about how cities and weather shape each other. Each edition follows a single day, from first light on the ridges to the last lit window downtown.',
        'At dawn the air is still and cold. Low sun turns the snowfields pink and leaves the valleys in shadow.',
      ],
    },
    fx: { ...base, bloom: 0.85, sunElev: 0.07, sunAz: 0.35, clouds: 0.3, rise: 0, lights: 0, stars: 0.1, haze: 1 },
    palette: [
      key(0, { sky: [0.5, 0.06, 5], horizon: [0.8, 0.085, 40], sun: [0.92, 0.1, 55], land: [0.5, 0.05, 35], hue: 30 }),
      key(0.8, { sky: [0.56, 0.065, -20], horizon: [0.84, 0.07, 50], sun: [0.95, 0.08, 65], land: [0.52, 0.05, 60], hue: 30 }),
    ],
    camera: [P([0, 205, 150], [30, 150, -200], 0), P([-30, 178, -20], [0, 125, -260], 0.5), P([-12, 165, -160], [0, 100, -370], 0.9)],
  },
  {
    id: 'valley',
    title: 'Valley & clouds',
    start: 0.25,
    end: 0.5,
    copy: {
      eyebrow: 'Midday · The valley',
      heading: 'Weather is made in the valleys.',
      body: [
        'By midday the sun has warmed the slopes. Air rises along them and cools, and the moisture it carries condenses into the cumulus layers you are flying through.',
        'Our weather desk reports on these local systems: why one side of the river gets the shower and the other gets the shade.',
      ],
    },
    fx: { ...base, sunElev: 0.8, sunAz: 0.7, clouds: 0.5, rise: 0.12, lights: 0, stars: 0, haze: 0.5 },
    palette: [
      key(0.3, { sky: [0.6, 0.09, -115], horizon: [0.86, 0.04, -130], sun: [0.98, 0.03, 90], land: [0.55, 0.08, 140], hue: 245 }),
      key(0.85, { sky: [0.58, 0.09, -112], horizon: [0.85, 0.045, -128], sun: [0.97, 0.04, 85], land: [0.54, 0.08, 130], hue: 245 }),
    ],
    camera: [P([20, 142, -300], [0, 104, -500], 0.22), P([-15, 112, -420], [0, 70, -640], 0.5), P([10, 96, -545], [0, 34, -770], 0.92)],
  },
  {
    id: 'dusk',
    title: 'City at dusk',
    start: 0.5,
    end: 0.75,
    copy: {
      eyebrow: 'Evening · Downtown',
      heading: 'At dusk, the city builds itself again.',
      body: [
        'Towers catch the last amber light while the streets below already sit in shadow. The city stores the heat of the day in stone and concrete and gives it back slowly after sunset.',
        'Our city desk covers what that means: warmer nights, shifting breezes and the small decisions that make streets livable.',
      ],
    },
    fx: { ...base, bloom: 0.9, sunElev: 0.06, sunAz: -0.45, clouds: 0.45, rise: 1, lights: 0.35, stars: 0.05, haze: 1.2 },
    palette: [
      key(0.25, { sky: [0.46, 0.07, -30], horizon: [0.76, 0.12, 60], sun: [0.86, 0.14, 55], land: [0.42, 0.045, 50], hue: 45 }),
      key(0.85, { sky: [0.36, 0.07, -50], horizon: [0.62, 0.11, 45], sun: [0.8, 0.14, 45], land: [0.33, 0.04, 30], hue: 40 }),
    ],
    camera: [P([-40, 96, -625], [0, 14, -800], 0.15), P([48, 88, -705], [0, 24, -820], 0.5), P([78, 82, -790], [0, 30, -822], 0.92)],
  },
  {
    id: 'night',
    title: 'Night lights',
    start: 0.75,
    end: 1,
    copy: {
      eyebrow: 'Night · Subscribe',
      heading: 'Get the next day in your inbox.',
      body: [
        'Skyline Almanac publishes one long edition each month: a single day, a single city, its weather and the people who live in it.',
      ],
    },
    fx: { ...base, bloom: 1.15, grain: 0.18, vignette: 0.55, sunElev: -0.32, sunAz: -0.7, clouds: 0.25, rise: 1, lights: 1, stars: 1, haze: 0.8 },
    palette: [
      key(0.25, { sky: [0.16, 0.065, -78], horizon: [0.27, 0.075, -75], sun: [0.8, 0.045, -100], land: [0.2, 0.03, -90], hue: 280 }),
      key(1, { sky: [0.13, 0.06, -80], horizon: [0.24, 0.07, -78], sun: [0.8, 0.04, -102], land: [0.18, 0.03, -92], hue: 280 }),
    ],
    camera: [P([32, 92, -880], [0, 12, -800], 0.15), P([-20, 140, -935], [0, 2, -790], 0.55), P([0, 200, -1005], [0, 0, -780], 1)],
  },
]

export const flow = createFlow<SkyFx>({
  chapters,
  blend: 0.07,
  textFade: 0.035,
  bounds: {
    l: { bg: [0.1, 0.65], fog: [0.2, 0.9], text: [0.95, 0.99], scrim: [0.15, 0.22], accent: [0.82, 0.9], primary: [0.75, 0.99], secondary: [0.15, 0.6] },
    c: { bg: 0.1, fog: 0.13, text: 0.02, scrim: 0.05, accent: 0.14, primary: 0.15, secondary: 0.09 },
  },
})

export const COUNTS = {
  buildings: { high: 1860, mid: 1300, low: 800 },
  streetLights: { high: 4494, mid: 3000, low: 1500 },
}
