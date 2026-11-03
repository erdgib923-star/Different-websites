// Precomputed sound landscape (pure TS). Each region has the "texture" of its frequency band:
// a still plain, broad low hills, sharp ridged mids, fine high ripples, cross-faded along z.

import { rng } from '../engine/math'
import { REGIONS } from './chapters'

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
const n1 = makeNoise(21)
const n2 = makeNoise(5)
const fbm = (x: number, y: number, oct = 4) => {
  let s = 0
  let a = 0.5
  let f = 1
  for (let o = 0; o < oct; o++) {
    s += a * n1(x * f, y * f)
    f *= 2.03
    a *= 0.5
  }
  return s
}
const ridged = (x: number, y: number) => {
  let s = 0
  let a = 0.6
  let f = 1
  for (let o = 0; o < 4; o++) {
    const v = 1 - Math.abs(n2(x * f, y * f) * 2 - 1)
    s += a * v * v
    f *= 2.1
    a *= 0.5
  }
  return s
}
const sm = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Region weights at z (sum to 1). */
export function regionWeights(z: number) {
  const silence = sm(REGIONS.silenceEnd - 30, REGIONS.silenceEnd + 20, z)
  const toMid = 1 - sm(REGIONS.bassEnd - 30, REGIONS.bassEnd + 30, z)
  const toTreble = 1 - sm(REGIONS.midEnd - 30, REGIONS.midEnd + 30, z)
  const rest = 1 - silence
  return { silence, bass: rest * (1 - toMid), mid: rest * toMid * (1 - toTreble), treble: rest * toMid * toTreble }
}

export function heightAt(x: number, z: number) {
  const w = regionWeights(z)
  const hs = (fbm(x * 0.02, z * 0.02) - 0.5) * 0.8
  const hb = Math.pow(fbm(x * 0.011 + 3, z * 0.011, 3), 1.4) * 22
  const hm = Math.pow(ridged(x * 0.034, z * 0.034), 1.5) * 9
  const ht = (fbm(x * 0.13, z * 0.13) - 0.5) * 2.6 + Math.sin(x * 0.55 + z * 0.37) * 0.35 + 1.2
  let h = w.silence * hs + w.bass * hb + w.mid * hm + w.treble * ht
  const ax = Math.abs(x)
  h *= 0.4 + 0.6 * sm(3, 30, ax) // a calmer channel where the camera flies
  h += sm(55, 88, ax) * 8 // the landscape rises toward the edges
  return h
}
