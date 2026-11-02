// Deterministic CPU generation: terrain heightfield and the city layout. Pure TS (testable).

import { rng } from '../engine/math'
import { WORLD } from './chapters'

function makeNoise(seed: number) {
  const r = rng(seed)
  const g = Array.from({ length: 512 }, () => r())
  const h = (x: number, y: number) => g[(Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) & 511]
  return (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const fx = x - xi
    const fy = y - yi
    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)
    const a = h(xi, yi)
    const b = h(xi + 1, yi)
    const c = h(xi, yi + 1)
    const d = h(xi + 1, yi + 1)
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
  }
}
const n1 = makeNoise(3)
const n2 = makeNoise(9)
const fbm = (x: number, y: number) => {
  let s = 0
  let a = 0.5
  let f = 1
  for (let o = 0; o < 5; o++) {
    s += a * n1(x * f, y * f)
    f *= 2.03
    a *= 0.5
  }
  return s
}
const ridged = (x: number, y: number) => {
  let s = 0
  let a = 0.55
  let f = 1
  for (let o = 0; o < 5; o++) {
    const v = 1 - Math.abs(n2(x * f, y * f) * 2 - 1)
    s += a * v * v
    f *= 2.1
    a *= 0.48
  }
  return s
}
const sm = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Terrain height at world (x, z). */
export function heightAt(x: number, z: number) {
  const mountainMask = sm(-470, -230, z)
  const side = sm(260, 560, Math.abs(x))
  const m = Math.max(mountainMask, side * 0.85)
  const hills = fbm(x * 0.006, z * 0.006)
  const peaks = Math.pow(ridged(x * 0.0042, z * 0.0042), 1.6) * 200 + hills * 30
  let h = hills * 48 * (1 - m) + peaks * m
  // a pass through the range so the dawn flyover clears the ridges
  h *= 1 - 0.55 * Math.exp(-((x / 95) ** 2)) * mountainMask
  // river
  const rx = Math.sin(z * 0.008) * 50
  h -= 16 * Math.exp(-(((x - rx) / 28) ** 2)) * (1 - m)
  const [cx, cz] = WORLD.city
  const dc = Math.hypot(x - cx, z - cz)
  const c = 1 - sm(WORLD.cityRadius * 0.9, WORLD.cityRadius * 1.5, dc)
  return h * (1 - c) + 2 * c
}

export interface Building {
  x: number
  z: number
  w: number
  d: number
  h: number
  delay: number
  seed: number
}

/** Blocks on a 15-unit grid with 5-unit streets; 1–4 buildings per block. Sorted by priority. */
export function buildCity(max: number): { buildings: Building[]; lights: number[] } {
  const r = rng(808)
  const [cx, cz] = WORLD.city
  const R = WORLD.cityRadius
  const B = 15
  const out: Building[] = []
  const lights: number[] = []
  const n = Math.ceil(R / B)
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const bx = cx + i * B
      const bz = cz + j * B
      const dist = Math.hypot(bx - cx, bz - cz)
      if (dist > R) continue
      const per = 1 + Math.floor(r() * 4)
      const inner = B - 5
      for (let k = 0; k < per; k++) {
        const w = 3 + r() * (inner / (per > 2 ? 2 : 1) - 3)
        const d = 3 + r() * (inner / (per > 1 ? 2 : 1) - 3)
        const x = bx + (r() - 0.5) * (inner - w)
        const z = bz + (r() - 0.5) * (inner - d)
        const core = Math.exp(-((dist / 85) ** 2))
        const h = 6 + 82 * core * Math.pow(r(), 1.6) + r() * 12 + 14 * core
        out.push({ x, z, w, d, h, delay: (dist / R) * 0.6 + r() * 0.12, seed: r() })
      }
      // street lights along the two streets bordering this block
      for (let s = -B / 2; s < B / 2; s += 5) {
        const sx = bx + B / 2
        const sz = bz + s
        if (Math.hypot(sx - cx, sz - cz) < R * 1.05) lights.push(sx + (r() - 0.5), 2.4, sz, r())
        const tx = bx + s
        const tz = bz + B / 2
        if (Math.hypot(tx - cx, tz - cz) < R * 1.05) lights.push(tx, 2.4, tz + (r() - 0.5), r())
      }
    }
  }
  // most important (central, tall) first, so a lower tier keeps the skyline when it draws fewer
  const score = (b: Building) => b.h * (1 - b.delay)
  out.sort((a, b) => score(b) - score(a))
  return { buildings: out.slice(0, max), lights }
}
