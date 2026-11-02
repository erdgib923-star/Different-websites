// Builds the per-particle morph targets once (deterministic, seeded). Every particle gets a slot
// from a shuffled permutation, so a drawRange prefix (used when the quality tier drops) is still
// an even sample of every shape.

import { rng } from '../engine/math'
import { WORLD } from './chapters'

function makeNoise(seed: number) {
  const r = rng(seed)
  const perm = new Uint8Array(512)
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
  const val = (i: number, j: number) => perm[(perm[i & 255] + j) & 511] / 255
  const fade = (t: number) => t * t * (3 - 2 * t)
  const n2 = (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const fx = fade(x - xi)
    const fy = fade(y - yi)
    const a = val(xi, yi)
    const b = val(xi + 1, yi)
    const c = val(xi, yi + 1)
    const d = val(xi + 1, yi + 1)
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
  }
  return (x: number, y: number, oct = 4) => {
    let s = 0
    let amp = 0.5
    let f = 1
    for (let o = 0; o < oct; o++) {
      s += amp * n2(x * f, y * f)
      f *= 2.03
      amp *= 0.5
    }
    return s
  }
}

export interface Targets {
  count: number
  spark: Float32Array
  canyon: Float32Array
  bloom: Float32Array
  horizon: Float32Array
  seed: Float32Array
}

export function buildTargets(count: number): Targets {
  const r = rng(20251102)
  const fbm = makeNoise(7)
  const spark = new Float32Array(count * 3)
  const canyon = new Float32Array(count * 3)
  const bloom = new Float32Array(count * 3)
  const horizon = new Float32Array(count * 3)
  const seed = new Float32Array(count * 4)
  const slots = new Uint32Array(count)
  for (let i = 0; i < count; i++) slots[i] = i
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    const t = slots[i]
    slots[i] = slots[j]
    slots[j] = t
  }
  const { canyon: cy, flower: F, horizon: hz } = WORLD
  const GOLDEN = Math.PI * (3 - Math.sqrt(5))
  const petals = 13

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const s = [r(), r(), r(), r()]
    seed.set(s, i * 4)

    // spark: dense core plus a soft halo
    {
      const u = r() * 2 - 1
      const th = r() * Math.PI * 2
      const halo = r() < 0.75
      const rad = halo ? 0.3 + Math.pow(r(), 1.7) * 1.7 : 0.04 + Math.pow(r(), 1.5) * 0.3
      const k = Math.sqrt(1 - u * u)
      spark[i3] = Math.cos(th) * k * rad
      spark[i3 + 1] = u * rad
      spark[i3 + 2] = Math.sin(th) * k * rad
    }

    // canyon: two noise walls leaning outwards, plus a rippled floor
    {
      const z = cy.zStart + (cy.zEnd - cy.zStart) * r()
      if (r() < 0.16) {
        const x = (r() * 2 - 1) * 6
        canyon[i3] = x
        canyon[i3 + 1] = cy.floor + fbm(x * 0.4, z * 0.15) * 0.8
        canyon[i3 + 2] = z
      } else {
        const side = r() < 0.5 ? -1 : 1
        const y = cy.floor + Math.pow(r(), 0.8) * 17
        const wall = 4.6 + (y - cy.floor) * 0.32 + fbm(z * 0.09 + side * 40, y * 0.18) * 6.5 - 1.5
        canyon[i3] = side * wall + (r() - 0.5) * 0.25
        canyon[i3 + 1] = y
        canyon[i3 + 2] = z
      }
    }

    // bloom: phyllotaxis disc (cupped) + 13 rim petals
    {
      const slot = slots[i]
      if (slot % 10 < 7) {
        const n = Math.floor(slot * 0.7)
        const radius = 8.5 * Math.sqrt(n / (count * 0.7))
        const a = n * GOLDEN
        bloom[i3] = F[0] + Math.cos(a) * radius
        bloom[i3 + 1] = F[1] + 0.035 * radius * radius - 1 + (r() - 0.5) * 0.08
        bloom[i3 + 2] = F[2] + Math.sin(a) * radius
      } else {
        const petal = slot % petals
        const t = r()
        const along = 8 + t * 6.5
        const widthAt = Math.sin(Math.PI * Math.min(1, t * 1.1)) * 0.22
        const a = (petal / petals) * Math.PI * 2 + (r() - 0.5) * widthAt
        bloom[i3] = F[0] + Math.cos(a) * along
        bloom[i3 + 1] = F[1] + 1.2 + t * t * 4.5 + (r() - 0.5) * 0.15
        bloom[i3 + 2] = F[2] + Math.sin(a) * along
      }
    }

    // horizon: a vast luminous plain, denser near the viewer, plus a bright far line
    {
      if (r() < 0.12) {
        horizon[i3] = (r() * 2 - 1) * 420
        horizon[i3 + 1] = Math.pow(r(), 3) * 3
        horizon[i3 + 2] = hz.zFar - r() * 25
      } else {
        const sx = r() * 2 - 1
        const x = Math.sign(sx) * Math.pow(Math.abs(sx), 1.6) * 180
        const z = hz.zNear + (hz.zFar - hz.zNear) * Math.pow(r(), 1.35)
        horizon[i3] = x
        horizon[i3 + 1] = fbm(x * 0.05, z * 0.05) * 0.6 - 0.3
        horizon[i3 + 2] = z
      }
    }
  }
  return { count, spark, canyon, bloom, horizon, seed }
}
