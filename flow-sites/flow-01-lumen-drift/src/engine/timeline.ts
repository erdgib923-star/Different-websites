// Builds a pure, continuous sceneState(progress) from ONE chapter data table.
//
//   - fx (effect strengths, morph targets...) : chapter values blended with smootherstep at each
//     boundary, so neighbouring chapters cross-fade instead of switching.
//   - palette                                  : OKLCH keyframes (authored per chapter, local 0..1)
//     flattened to global tracks and interpolated with monotone cubics (C1, no overshoot), then
//     bounded in lightness/chroma.
//   - camera                                   : position and look-at keys become two centripetal
//     Catmull-Rom curves, arc-length parameterised; progress -> arc length is a monotone cubic so
//     the camera never stops dead or snaps at a key.
//   - text windows                             : per-chapter opacity windows + local progress.
//
// Nothing here allocates per call: sceneState(p, out) writes into a pre-built output object.

import { ArcCurve, type Vec3 } from './curve'
import { MonotoneTrack, clamp, smootherstep } from './math'
import { type ColorOut, type LCH, makeColorOut, writeColor } from './color'

export const ROLES = ['bg', 'fog', 'primary', 'secondary', 'accent', 'text', 'scrim'] as const
export type Role = (typeof ROLES)[number]

export type PaletteKey = { at: number } & Record<Role, LCH>

export interface CameraKey {
  /** local position inside the chapter, 0..1 */
  at: number
  pos: Vec3
  look: Vec3
}

/** Effect strengths every site uses. Sites extend this with their own numeric fields. */
export interface BaseFx {
  fov: number
  bloom: number
  grain: number
  vignette: number
  chroma: number
  fogDensity: number
  exposure: number
}

export interface ChapterCopy {
  eyebrow: string
  heading: string
  body: string[]
}

export interface ChapterDef<FX extends BaseFx> {
  id: string
  title: string
  start: number
  end: number
  copy: ChapterCopy
  fx: FX
  palette: PaletteKey[]
  camera: CameraKey[]
}

export interface PaletteBounds {
  /** min/max OKLCH lightness for every role, keeps colours out of crushed/clipped ranges */
  l: Partial<Record<Role, [number, number]>>
  /** max chroma for every role */
  c: Partial<Record<Role, number>>
}

export interface FlowConfig<FX extends BaseFx> {
  chapters: ChapterDef<FX>[]
  /** half-width of the smootherstep cross-fade at each chapter boundary (progress units) */
  blend: number
  /** text fade-in/out length inside each chapter (progress units) */
  textFade: number
  bounds: PaletteBounds
}

export interface SceneState<FX extends BaseFx> {
  progress: number
  camPos: Vec3
  camLook: Vec3
  /** normalised arc length of the camera along its curve */
  camU: number
  /** per-chapter blend weights (sum 1) */
  weights: Float32Array
  /** boundary ramps s_k (0 before boundary k, 1 after) */
  ramps: Float32Array
  dominant: number
  fx: FX
  colors: Record<Role, ColorOut>
  /** per-chapter text opacity */
  text: Float32Array
  /** per-chapter local progress 0..1 (clamped) */
  local: Float32Array
}

export interface Flow<FX extends BaseFx> {
  config: FlowConfig<FX>
  chapters: ChapterDef<FX>[]
  boundaries: number[]
  blendWidths: number[]
  camCurve: ArcCurve
  lookCurve: ArcCurve
  create(): SceneState<FX>
  sample(p: number, out: SceneState<FX>): SceneState<FX>
}

export function createFlow<FX extends BaseFx>(config: FlowConfig<FX>): Flow<FX> {
  const chapters = config.chapters
  const n = chapters.length
  // ---- validate table ----------------------------------------------------------------------
  if (Math.abs(chapters[0].start) > 1e-9 || Math.abs(chapters[n - 1].end - 1) > 1e-9) {
    throw new Error('Chapters must cover 0..1')
  }
  for (let i = 1; i < n; i++) {
    if (Math.abs(chapters[i].start - chapters[i - 1].end) > 1e-9) throw new Error(`Gap between chapters ${i - 1} and ${i}`)
  }
  const boundaries = chapters.slice(0, -1).map((c) => c.end)
  // Blend half-width can never exceed 45% of either neighbouring chapter (keeps ramps ordered).
  const blendWidths = boundaries.map((_, k) => {
    const left = chapters[k].end - chapters[k].start
    const right = chapters[k + 1].end - chapters[k + 1].start
    return Math.min(config.blend, left * 0.45, right * 0.45)
  })
  const fxKeys = Object.keys(chapters[0].fx) as (keyof FX)[]

  // ---- palette tracks ----------------------------------------------------------------------
  const pKeys: PaletteKey[] = []
  for (const ch of chapters) {
    for (const k of ch.palette) pKeys.push({ ...k, at: ch.start + k.at * (ch.end - ch.start) })
  }
  // de-duplicate identical positions (end of one chapter == start of next): keep the later key
  const palKeys = pKeys.filter((k, i) => i === pKeys.length - 1 || pKeys[i + 1].at - k.at > 1e-9)
  const xs = palKeys.map((k) => k.at)
  const tracks = ROLES.map((role) => [0, 1, 2].map((ch) => new MonotoneTrack(xs, palKeys.map((k) => k[role][ch]))))

  // ---- camera curves -----------------------------------------------------------------------
  const cKeys: { p: number; pos: Vec3; look: Vec3 }[] = []
  for (const ch of chapters) {
    for (const k of ch.camera) cKeys.push({ p: ch.start + k.at * (ch.end - ch.start), pos: k.pos, look: k.look })
  }
  for (let i = 1; i < cKeys.length; i++) {
    if (!(cKeys[i].p > cKeys[i - 1].p)) throw new Error(`Camera keys must strictly increase (key ${i} at ${cKeys[i].p})`)
  }
  const camCurve = new ArcCurve(cKeys.map((k) => k.pos))
  const lookCurve = new ArcCurve(cKeys.map((k) => k.look))
  const last = cKeys.length - 1
  const camMap = new MonotoneTrack(cKeys.map((k) => k.p), cKeys.map((_, i) => camCurve.tToU(i / last)))
  const lookMap = new MonotoneTrack(cKeys.map((k) => k.p), cKeys.map((_, i) => lookCurve.tToU(i / last)))

  const create = (): SceneState<FX> => {
    const colors = {} as Record<Role, ColorOut>
    for (const r of ROLES) colors[r] = makeColorOut()
    return {
      progress: 0,
      camPos: [0, 0, 0],
      camLook: [0, 0, 0],
      camU: 0,
      weights: new Float32Array(n),
      ramps: new Float32Array(Math.max(n - 1, 1)),
      dominant: 0,
      fx: { ...chapters[0].fx },
      colors,
      text: new Float32Array(n),
      local: new Float32Array(n),
    }
  }

  const sample = (pIn: number, out: SceneState<FX>) => {
    const p = clamp(pIn)
    out.progress = p
    // chapter weights from boundary ramps
    for (let k = 0; k < n - 1; k++) out.ramps[k] = smootherstep(boundaries[k] - blendWidths[k], boundaries[k] + blendWidths[k], p)
    let best = 0
    for (let i = 0; i < n; i++) {
      const prev = i === 0 ? 1 : out.ramps[i - 1]
      const next = i === n - 1 ? 0 : out.ramps[i]
      const w = prev - next
      out.weights[i] = w
      if (w > out.weights[best]) best = i
    }
    out.dominant = best
    // fx blend
    for (const key of fxKeys) {
      let v = 0
      for (let i = 0; i < n; i++) {
        const w = out.weights[i]
        if (w > 0) v += w * (chapters[i].fx[key] as number)
      }
      ;(out.fx[key] as number) = v
    }
    // palette
    for (let r = 0; r < ROLES.length; r++) {
      const role = ROLES[r]
      const t = tracks[r]
      const lb = config.bounds.l[role]
      const cb = config.bounds.c[role]
      let l = t[0].at(p)
      let c = t[1].at(p)
      const h = t[2].at(p)
      if (lb) l = clamp(l, lb[0], lb[1])
      c = clamp(c, 0, cb ?? 0.37)
      writeColor(out.colors[role], l, c, h)
    }
    // camera
    out.camU = camMap.at(p)
    camCurve.pointAt(out.camU, out.camPos)
    lookCurve.pointAt(lookMap.at(p), out.camLook)
    // text windows
    for (let i = 0; i < n; i++) {
      const ch = chapters[i]
      const len = ch.end - ch.start
      const f = Math.min(config.textFade, len * 0.3)
      const fin = i === 0 ? 1 : smootherstep(ch.start, ch.start + f, p)
      const fout = i === n - 1 ? 1 : 1 - smootherstep(ch.end - f, ch.end, p)
      out.text[i] = fin * fout
      out.local[i] = clamp((p - ch.start) / len)
    }
    return out
  }

  return { config, chapters, boundaries, blendWidths, camCurve, lookCurve, create, sample }
}
