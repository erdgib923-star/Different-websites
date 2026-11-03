// Small, allocation-free math helpers shared by the engine. No three.js import here on purpose:
// sceneState() runs in the eager main chunk (poster mode, CSS colours) and in Node test scripts.

export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const invLerp = (a: number, b: number, x: number) => (b === a ? 0 : clamp((x - a) / (b - a)))

/** Ken Perlin's smootherstep: C2-continuous 0..1 ramp between edge0 and edge1. */
export function smootherstep(edge0: number, edge1: number, x: number) {
  const t = invLerp(edge0, edge1, x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** A bump that rises over [a,b] and falls over [c,d] using smootherstep on both sides. */
export function windowed(x: number, a: number, b: number, c: number, d: number) {
  return smootherstep(a, b, x) * (1 - smootherstep(c, d, x))
}

/** Frame-rate independent exponential damping (same contract as THREE.MathUtils.damp). */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt))

/**
 * Critically damped spring step (exact closed form, stable for any dt).
 * Mutates and returns `s` so callers can keep one object alive forever.
 */
export interface SpringState {
  x: number
  v: number
}
export function springStep(s: SpringState, target: number, omega: number, dt: number): SpringState {
  const x0 = s.x - target
  const e = Math.exp(-omega * dt)
  const j = (s.v + omega * x0) * dt
  s.x = target + (x0 + j) * e
  s.v = (s.v - omega * j) * e
  return s
}

/** Deterministic hash in [0,1) for an integer index (used for per-particle delays). */
export function hash1(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123
  return s - Math.floor(s)
}

/** Mulberry32 seeded PRNG: deterministic geometry across reloads. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Monotone cubic Hermite interpolation (Fritsch–Carlson). C1 continuous and, unlike Catmull-Rom,
 * never overshoots between keys, so bounded quantities (lightness, chroma, 0..1 weights) stay bounded.
 */
export class MonotoneTrack {
  private xs: Float64Array
  private ys: Float64Array
  private ms: Float64Array

  constructor(xs: ArrayLike<number>, ys: ArrayLike<number>) {
    const n = xs.length
    if (n === 0 || n !== ys.length) throw new Error('MonotoneTrack: need matching non-empty keys')
    this.xs = Float64Array.from(xs)
    this.ys = Float64Array.from(ys)
    for (let i = 1; i < n; i++) {
      if (!(this.xs[i] > this.xs[i - 1])) throw new Error(`MonotoneTrack: keys must increase (at ${i}: ${this.xs[i - 1]} -> ${this.xs[i]})`)
    }
    const d = new Float64Array(Math.max(n - 1, 1))
    for (let i = 0; i < n - 1; i++) d[i] = (this.ys[i + 1] - this.ys[i]) / (this.xs[i + 1] - this.xs[i])
    const m = new Float64Array(n)
    if (n > 1) {
      m[0] = d[0]
      m[n - 1] = d[n - 2]
      for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2
      for (let i = 0; i < n - 1; i++) {
        if (d[i] === 0) {
          m[i] = 0
          m[i + 1] = 0
          continue
        }
        const a = m[i] / d[i]
        const b = m[i + 1] / d[i]
        const s = a * a + b * b
        if (s > 9) {
          const t = 3 / Math.sqrt(s)
          m[i] = t * a * d[i]
          m[i + 1] = t * b * d[i]
        }
      }
    }
    this.ms = m
  }

  at(x: number) {
    const { xs, ys, ms } = this
    const n = xs.length
    if (n === 1 || x <= xs[0]) return ys[0]
    if (x >= xs[n - 1]) return ys[n - 1]
    let lo = 0
    let hi = n - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (xs[mid] <= x) lo = mid
      else hi = mid
    }
    const h = xs[hi] - xs[lo]
    const t = (x - xs[lo]) / h
    const t2 = t * t
    const t3 = t2 * t
    return (
      (2 * t3 - 3 * t2 + 1) * ys[lo] + (t3 - 2 * t2 + t) * h * ms[lo] + (-2 * t3 + 3 * t2) * ys[hi] + (t3 - t2) * h * ms[hi]
    )
  }
}
