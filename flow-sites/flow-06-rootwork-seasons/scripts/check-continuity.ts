// Samples sceneState every 0.0005 of progress and fails if anything jumps.
// Thresholds are per 0.0005 step:
//   camera position / look-at : at most SPEED_FACTOR x the average step along the whole path
//   view direction            : at most ANGLE_MAX degrees
//   morph weights / ramps / fx: at most 0.02 (a full 0->1 change must take >= 0.025 progress)
//   palette (every role)      : at most 0.006 OKLab distance
//   fog density               : at most 3% of its range
// Run: npm run check:continuity

import { deltaOK } from '../src/engine/color'
import { ROLES } from '../src/engine/timeline'
import { flow } from '../src/site/chapters'

const STEP = 0.0005
const SPEED_FACTOR = 4
const WEIGHT_MAX = 0.02
const PALETTE_MAX = 0.006
const ANGLE_MAX = 1.0 // degrees of view-direction change per step (a 90 deg turn needs >= 0.045 progress)

function viewAngle(p0: number[], l0: number[], p1: number[], l1: number[]) {
  const a = [l0[0] - p0[0], l0[1] - p0[1], l0[2] - p0[2]]
  const b = [l1[0] - p1[0], l1[1] - p1[1], l1[2] - p1[2]]
  const d = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (Math.hypot(a[0], a[1], a[2]) * Math.hypot(b[0], b[1], b[2]))
  return (Math.acos(Math.min(1, Math.max(-1, d))) * 180) / Math.PI
}

type Offender = { what: string; at: number; delta: number; limit: number }

const a = flow.create()
const b = flow.create()
const n = Math.round(1 / STEP)
const dist = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])

// pass 1: path lengths -> average step
let camLen = 0
let lookLen = 0
flow.sample(0, a)
for (let i = 1; i <= n; i++) {
  flow.sample(i * STEP, b)
  camLen += dist(a.camPos, b.camPos)
  lookLen += dist(a.camLook, b.camLook)
  flow.sample(i * STEP, a)
}
const camLimit = (camLen / n) * SPEED_FACTOR
const lookLimit = (lookLen / n) * SPEED_FACTOR

const fxKeys = Object.keys(a.fx) as (keyof typeof a.fx)[]
const fxRange: Record<string, [number, number]> = {}
for (const k of fxKeys) fxRange[k as string] = [Infinity, -Infinity]
for (let i = 0; i <= n; i++) {
  flow.sample(i * STEP, a)
  for (const k of fxKeys) {
    const v = a.fx[k] as number
    const r = fxRange[k as string]
    r[0] = Math.min(r[0], v)
    r[1] = Math.max(r[1], v)
  }
}

const worst = new Map<string, Offender>()
const failures: Offender[] = []
const record = (what: string, at: number, delta: number, limit: number) => {
  const o = { what, at, delta, limit }
  const prev = worst.get(what)
  if (!prev || delta > prev.delta) worst.set(what, o)
  if (delta > limit) failures.push(o)
}

flow.sample(0, a)
for (let i = 1; i <= n; i++) {
  const p = i * STEP
  flow.sample(p, b)
  record('camera.position', p, dist(a.camPos, b.camPos), camLimit)
  record('camera.lookAt', p, dist(a.camLook, b.camLook), lookLimit)
  record('camera.viewAngle(deg)', p, viewAngle(a.camPos, a.camLook, b.camPos, b.camLook), ANGLE_MAX)
  for (let k = 0; k < a.weights.length; k++) record(`weight[${flow.chapters[k].id}]`, p, Math.abs(a.weights[k] - b.weights[k]), WEIGHT_MAX)
  for (let k = 0; k < a.ramps.length; k++) record(`morph ramp[${k}]`, p, Math.abs(a.ramps[k] - b.ramps[k]), WEIGHT_MAX)
  for (const k of fxKeys) {
    const r = fxRange[k as string]
    const range = r[1] - r[0]
    if (range < 1e-4 * Math.max(1, Math.abs(r[1]))) continue // constant across the whole page (float noise only)
    // normalised by the key's range so fov (degrees) and grain (0..1) share one rule
    record(`fx.${String(k)}`, p, Math.abs((a.fx[k] as number) - (b.fx[k] as number)) / range, k === 'fogDensity' ? 0.03 : WEIGHT_MAX * 1.5)
  }
  for (const role of ROLES) record(`palette.${role}`, p, deltaOK(a.colors[role].lch, b.colors[role].lch), PALETTE_MAX)
  for (let k = 0; k < a.text.length; k++) record(`text[${flow.chapters[k].id}]`, p, Math.abs(a.text[k] - b.text[k]), 0.05)
  flow.sample(p, a)
}

const rows = [...worst.values()].sort((x, y) => y.delta / y.limit - x.delta / x.limit)
console.log(`continuity: ${n} steps of ${STEP}; camera path ${camLen.toFixed(1)} u (limit ${camLimit.toFixed(4)}/step), look path ${lookLen.toFixed(1)} u`)
console.log('worst offenders (delta / limit):')
for (const r of rows.slice(0, 12)) {
  console.log(`  ${r.what.padEnd(22)} at p=${r.at.toFixed(4)}  delta=${r.delta.toFixed(5)}  limit=${r.limit.toFixed(5)}  (${((r.delta / r.limit) * 100).toFixed(0)}%)`)
}
if (failures.length) {
  console.error(`FAIL: ${failures.length} jumps above threshold`)
  for (const f of failures.slice(0, 20)) console.error(`  ${f.what} at p=${f.at.toFixed(4)} delta=${f.delta.toFixed(5)} > ${f.limit.toFixed(5)}`)
  process.exit(1)
}
console.log('PASS: no discontinuities above threshold')
