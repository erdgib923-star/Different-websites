// L-system tree (pure TS, deterministic). String rewriting first, then a 3D turtle.
//
//   axiom  : F F A
//   rule   : A -> F [ & A ] / [ & A ] / [ & A ] ^ A
//   symbols: F forward (a branch segment), A bud, [ ] push/pop, & pitch down, ^ pitch up,
//            / roll by the golden angle (137.5 deg). Angles get seeded jitter; an upward tropism
//            bends every segment slightly toward the light.
//
// Every segment gets a birth time from its path distance to the root, so a single `growth`
// value in 0..1 grows the tree continuously: children start exactly when their parent is done.

import { rng } from '../engine/math'

export interface Segment {
  start: [number, number, number]
  end: [number, number, number]
  radius: number
  depth: number
  birth: number
  dur: number
}
export interface Leaf {
  pos: [number, number, number]
  /** unit normal-ish direction the leaf faces */
  dir: [number, number, number]
  size: number
  birth: number
  seed: number
}

export function expand(axiom: string, rules: Record<string, string>, iterations: number) {
  let s = axiom
  for (let i = 0; i < iterations; i++) {
    let out = ''
    for (const ch of s) out += rules[ch] ?? ch
    s = out
  }
  return s
}

type V = [number, number, number]
const add = (a: V, b: V, k = 1): V => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]
const norm = (a: V): V => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
/** rotate v around unit axis k by angle a (Rodrigues) */
function rot(v: V, k: V, a: number): V {
  const c = Math.cos(a)
  const s = Math.sin(a)
  const d = k[0] * v[0] + k[1] * v[1] + k[2] * v[2]
  const x = cross(k, v)
  return [v[0] * c + x[0] * s + k[0] * d * (1 - c), v[1] * c + x[1] * s + k[1] * d * (1 - c), v[2] * c + x[2] * s + k[2] * d * (1 - c)]
}

export function buildTree(iterations: number, leavesPerTip: number, seed = 7) {
  const str = expand('FFA', { A: 'F[&A]/[&A]/[&A]^A' }, iterations)
  const r = rng(seed)
  const segments: (Segment & { d0: number; d1: number })[] = []
  const tips: { pos: V; H: V; U: V; dist: number; depth: number }[] = []
  interface T {
    pos: V
    H: V
    L: V
    U: V
    depth: number
    dist: number
  }
  let t: T = { pos: [0, 0, 0], H: [0, 1, 0], L: [-1, 0, 0], U: [0, 0, 1], depth: 0, dist: 0 }
  const stack: T[] = []
  const LEN0 = 1.1
  const R0 = 0.16
  for (const ch of str) {
    switch (ch) {
      case 'F': {
        const len = LEN0 * Math.pow(0.74, t.depth) * (0.85 + r() * 0.3)
        // tropism toward +y, stronger for thin branches
        t.H = norm(add(t.H, [0, 1, 0], 0.08 + 0.04 * t.depth))
        const end = add(t.pos, t.H, len)
        segments.push({ start: t.pos, end, radius: R0 * Math.pow(0.6, t.depth), depth: t.depth, birth: 0, dur: 0, d0: t.dist, d1: t.dist + len })
        t = { ...t, pos: end, dist: t.dist + len }
        break
      }
      case 'A':
        tips.push({ pos: t.pos, H: t.H, U: t.U, dist: t.dist, depth: t.depth })
        break
      case '[':
        stack.push({ ...t, pos: [...t.pos] as V })
        t = { ...t, depth: t.depth + 1 }
        break
      case ']':
        t = stack.pop()!
        break
      case '&': {
        const a = ((30 + (r() - 0.5) * 18) * Math.PI) / 180
        t = { ...t, H: rot(t.H, t.L, a), U: rot(t.U, t.L, a) }
        break
      }
      case '^': {
        const a = ((-10 + (r() - 0.5) * 10) * Math.PI) / 180
        t = { ...t, H: rot(t.H, t.L, a), U: rot(t.U, t.L, a) }
        break
      }
      case '/': {
        const a = ((137.5 + (r() - 0.5) * 20) * Math.PI) / 180
        t = { ...t, L: rot(t.L, t.H, a), U: rot(t.U, t.H, a) }
        break
      }
    }
  }
  const maxD = Math.max(...segments.map((s) => s.d1), ...tips.map((p) => p.dist))
  const SPAN = 0.86
  for (const s of segments) {
    s.birth = (s.d0 / maxD) * SPAN
    s.dur = ((s.d1 - s.d0) / maxD) * SPAN
  }
  const leaves: Leaf[] = []
  for (const tip of tips) {
    for (let k = 0; k < leavesPerTip; k++) {
      const spread = 0.35 * Math.pow(0.85, tip.depth - 3)
      const pos: V = [tip.pos[0] + (r() - 0.5) * spread, tip.pos[1] + (r() - 0.5) * spread * 0.7, tip.pos[2] + (r() - 0.5) * spread]
      const dir = norm([(r() - 0.5) * 2, 0.6 + r(), (r() - 0.5) * 2])
      leaves.push({ pos, dir, size: 0.18 + r() * 0.12, birth: Math.min((tip.dist / maxD) * SPAN + 0.04 + r() * 0.06, 0.995), seed: r() })
    }
  }
  // shuffle leaves so a lower tier (drawing a prefix) keeps an even crown
  for (let i = leaves.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[leaves[i], leaves[j]] = [leaves[j], leaves[i]]
  }
  const height = Math.max(...segments.map((s) => s.end[1]))
  return { segments, leaves, height, symbols: str.length }
}
