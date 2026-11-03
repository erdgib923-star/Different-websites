// Deterministic cave + crystal layout (pure TS, testable in Node).
// The cave is a tube around a centripetal Catmull-Rom centreline, with a radius profile and
// noise displacement. Crystals grow in clusters on the wall and point toward the axis.

import { ArcCurve, type Vec3 } from '../engine/curve'
import { MonotoneTrack, rng } from '../engine/math'
import { CAVE } from './chapters'

export const centre = new ArcCurve(CAVE.points, 4096)
const n = CAVE.points.length
export const radiusAtT = new MonotoneTrack(
  CAVE.points.map((_, i) => i / (n - 1)),
  CAVE.radius,
)

function makeNoise(seed: number) {
  const r = rng(seed)
  const g = Array.from({ length: 1024 }, () => r())
  const h = (x: number, y: number, z: number) => g[(Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) & 1023]
  const s = (t: number) => t * t * (3 - 2 * t)
  const n3 = (x: number, y: number, z: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const zi = Math.floor(z)
    const fx = s(x - xi)
    const fy = s(y - yi)
    const fz = s(z - zi)
    const l = (a: number, b: number, t: number) => a + (b - a) * t
    return l(
      l(l(h(xi, yi, zi), h(xi + 1, yi, zi), fx), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), fx), fy),
      l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), fx), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), fx), fy),
      fz,
    )
  }
  return (x: number, y: number, z: number) => n3(x, y, z) * 0.6 + n3(x * 2.1, y * 2.1, z * 2.1) * 0.3 + n3(x * 4.3, y * 4.3, z * 4.3) * 0.1
}
const noise = makeNoise(17)

const tmpA: Vec3 = [0, 0, 0]
const tmpB: Vec3 = [0, 0, 0]
/** Frame at raw parameter t: centre point, side and up vectors (unit). */
export function frameAt(t: number) {
  centre.pointRaw(t, tmpA)
  centre.pointRaw(Math.min(t + 0.0015, 1), tmpB)
  let tx = tmpB[0] - tmpA[0]
  let ty = tmpB[1] - tmpA[1]
  let tz = tmpB[2] - tmpA[2]
  if (t >= 0.9985) {
    centre.pointRaw(t - 0.0015, tmpB)
    tx = tmpA[0] - tmpB[0]
    ty = tmpA[1] - tmpB[1]
    tz = tmpA[2] - tmpB[2]
  }
  const tl = Math.hypot(tx, ty, tz) || 1
  tx /= tl
  ty /= tl
  tz /= tl
  // side = T x up
  let sx = -tz
  let sy = 0
  let sz = tx
  const sl = Math.hypot(sx, sy, sz) || 1
  sx /= sl
  sy /= sl
  sz /= sl
  // up = side x T
  const ux = sy * tz - sz * ty
  const uy = sz * tx - sx * tz
  const uz = sx * ty - sy * tx
  return { c: [tmpA[0], tmpA[1], tmpA[2]] as Vec3, side: [sx, sy, sz] as Vec3, up: [ux, uy, uz] as Vec3 }
}

/** Wall radius at raw parameter t and angle a (radians), including noise and a flatter floor. */
export function wallRadius(t: number, a: number) {
  const r = radiusAtT.at(t)
  const nz = noise(Math.cos(a) * 1.6 + 10, Math.sin(a) * 1.6 + 10, t * 55)
  const floor = Math.sin(a) < -0.55 ? 0.88 : 1
  return r * (0.82 + nz * 0.42) * floor
}

export function buildWall(rings: number, segs: number) {
  const pos = new Float32Array((rings + 1) * (segs + 1) * 3)
  const uv = new Float32Array((rings + 1) * (segs + 1) * 2)
  let k = 0
  for (let i = 0; i <= rings; i++) {
    const t = i / rings
    const f = frameAt(t)
    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * Math.PI * 2
      const r = wallRadius(t, a)
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      pos[k * 3] = f.c[0] + (f.side[0] * ca + f.up[0] * sa) * r
      pos[k * 3 + 1] = f.c[1] + (f.side[1] * ca + f.up[1] * sa) * r
      pos[k * 3 + 2] = f.c[2] + (f.side[2] * ca + f.up[2] * sa) * r
      uv[k * 2] = j / segs
      uv[k * 2 + 1] = t
      k++
    }
  }
  const index: number[] = []
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j
      const b = a + segs + 1
      index.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  return { pos, uv, index }
}

export interface Crystal {
  p: Vec3
  dir: Vec3
  len: number
  width: number
  t: number
  seed: number
}

/** Crystal clusters on the wall. More (and larger) where the cave is wide. Shuffled order. */
export function buildCrystals(count: number, seed: number): Crystal[] {
  const r = rng(seed)
  const out: Crystal[] = []
  while (out.length < count) {
    // bias cluster positions toward wide sections (chamber + geode)
    let t = r()
    if (r() < 0.45) t = 0.55 + r() * 0.45
    const a = r() * Math.PI * 2
    const rad = radiusAtT.at(t)
    const size = 0.35 + rad / 16
    const cl = 5 + Math.floor(r() * 10)
    for (let k = 0; k < cl && out.length < count; k++) {
      const tt = Math.min(Math.max(t + (r() - 0.5) * (0.012 * size), 0.02), 0.995)
      const aa = a + (r() - 0.5) * 0.35
      const f = frameAt(tt)
      const wr = wallRadius(tt, aa) * 0.97
      const ca = Math.cos(aa)
      const sa = Math.sin(aa)
      const out3: Vec3 = [f.side[0] * ca + f.up[0] * sa, f.side[1] * ca + f.up[1] * sa, f.side[2] * ca + f.up[2] * sa]
      const p: Vec3 = [f.c[0] + out3[0] * wr, f.c[1] + out3[1] * wr, f.c[2] + out3[2] * wr]
      // point inward with a random tilt
      const dir: Vec3 = [-out3[0] + (r() - 0.5) * 0.9, -out3[1] + (r() - 0.5) * 0.9, -out3[2] + (r() - 0.5) * 0.9]
      const dl = Math.hypot(dir[0], dir[1], dir[2])
      out.push({
        p,
        dir: [dir[0] / dl, dir[1] / dl, dir[2] / dl],
        len: size * (0.8 + r() * 2.6),
        width: size * (0.18 + r() * 0.22),
        t: tt,
        seed: r(),
      })
    }
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Distance from a point to the centreline and the cave radius there (for the inside check). */
export function insideRatio(p: Vec3) {
  let best = Infinity
  let bestT = 0
  const q: Vec3 = [0, 0, 0]
  for (let i = 0; i <= 600; i++) {
    const t = i / 600
    centre.pointRaw(t, q)
    const d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
    if (d < best) {
      best = d
      bestT = t
    }
  }
  return best / (radiusAtT.at(bestT) * 0.82)
}
