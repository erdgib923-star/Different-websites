// Centripetal Catmull-Rom spline with an arc-length table. Pure TS (no three.js) so it can run in
// the main chunk and in Node. Equivalent to THREE.CatmullRomCurve3('centripetal') + getPointAt().

export type Vec3 = [number, number, number]

export class ArcCurve {
  readonly points: Vec3[]
  /** cumulative arc length at each table sample, normalised 0..1 */
  private table: Float64Array
  private samples: number
  readonly length: number

  constructor(points: Vec3[], samples = 2048) {
    if (points.length < 2) throw new Error('ArcCurve needs at least 2 points')
    this.points = points
    this.samples = samples
    const table = new Float64Array(samples + 1)
    const a: Vec3 = [0, 0, 0]
    const b: Vec3 = [0, 0, 0]
    this.pointRaw(0, a)
    let total = 0
    for (let i = 1; i <= samples; i++) {
      this.pointRaw(i / samples, b)
      total += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
      table[i] = total
      a[0] = b[0]
      a[1] = b[1]
      a[2] = b[2]
    }
    for (let i = 1; i <= samples; i++) table[i] /= total
    this.table = table
    this.length = total
  }

  /** Parameter t (0..1, uniform per segment) -> point. Passes through points[i] at t = i/(n-1). */
  pointRaw(t: number, out: Vec3): Vec3 {
    const pts = this.points
    const l = pts.length
    const p = (l - 1) * Math.min(Math.max(t, 0), 1)
    let i = Math.floor(p)
    let w = p - i
    if (i >= l - 1) {
      i = l - 2
      w = 1
    }
    const p1 = pts[i]
    const p2 = pts[i + 1]
    // Reflect the end tangents so the curve does not kink at the ends.
    const p0 = i > 0 ? pts[i - 1] : reflect(p2, p1, tmpA)
    const p3 = i + 2 < l ? pts[i + 2] : reflect(p1, p2, tmpB)
    let dt0 = Math.pow(dist2(p0, p1), 0.25)
    let dt1 = Math.pow(dist2(p1, p2), 0.25)
    let dt2 = Math.pow(dist2(p2, p3), 0.25)
    if (dt1 < 1e-4) dt1 = 1
    if (dt0 < 1e-4) dt0 = dt1
    if (dt2 < 1e-4) dt2 = dt1
    for (let k = 0; k < 3; k++) {
      let t1 = (p1[k] - p0[k]) / dt0 - (p2[k] - p0[k]) / (dt0 + dt1) + (p2[k] - p1[k]) / dt1
      let t2 = (p2[k] - p1[k]) / dt1 - (p3[k] - p1[k]) / (dt1 + dt2) + (p3[k] - p2[k]) / dt2
      t1 *= dt1
      t2 *= dt1
      // cubic hermite
      const c0 = p1[k]
      const c1 = t1
      const c2 = -3 * p1[k] + 3 * p2[k] - 2 * t1 - t2
      const c3 = 2 * p1[k] - 2 * p2[k] + t1 + t2
      out[k] = c0 + c1 * w + c2 * w * w + c3 * w * w * w
    }
    return out
  }

  /** Normalised arc length u (0..1) -> raw parameter t. */
  uToT(u: number) {
    const tb = this.table
    const n = this.samples
    if (u <= 0) return 0
    if (u >= 1) return 1
    let lo = 0
    let hi = n
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (tb[mid] <= u) lo = mid
      else hi = mid
    }
    const seg = tb[hi] - tb[lo]
    const f = seg > 0 ? (u - tb[lo]) / seg : 0
    return (lo + f) / n
  }

  /** Raw parameter t -> normalised arc length u. */
  tToU(t: number) {
    const x = Math.min(Math.max(t, 0), 1) * this.samples
    const i = Math.min(Math.floor(x), this.samples - 1)
    const f = x - i
    return this.table[i] + (this.table[i + 1] - this.table[i]) * f
  }

  /** Arc-length parameterised point. */
  pointAt(u: number, out: Vec3): Vec3 {
    return this.pointRaw(this.uToT(u), out)
  }
}

const tmpA: Vec3 = [0, 0, 0]
const tmpB: Vec3 = [0, 0, 0]
function reflect(a: Vec3, about: Vec3, out: Vec3): Vec3 {
  out[0] = 2 * about[0] - a[0]
  out[1] = 2 * about[1] - a[1]
  out[2] = 2 * about[2] - a[2]
  return out
}
function dist2(a: Vec3, b: Vec3) {
  const x = a[0] - b[0]
  const y = a[1] - b[1]
  const z = a[2] - b[2]
  return x * x + y * y + z * z
}
