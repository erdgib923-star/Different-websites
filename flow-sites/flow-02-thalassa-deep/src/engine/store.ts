// One zustand store. Per-frame values live in the long-lived mutable `motion` object and are read
// with useFlow.getState() inside frame callbacks, so React never re-renders per frame. Only
// discrete changes (tier, mode, chapter, readiness) go through set() and trigger React renders.

import { create } from 'zustand'

export type Tier = 'high' | 'mid' | 'low'
export type Mode = 'loading' | 'scene' | 'poster'
export type PosterReason = 'no-webgl2' | 'reduced-motion' | 'calm' | 'context-lost' | 'error' | null

export const TIERS: Tier[] = ['low', 'mid', 'high']
export const tierIndex = (t: Tier) => TIERS.indexOf(t)

export interface Motion {
  /** raw scroll progress (0..1) straight from the scroll position */
  raw: number
  /** spring-smoothed progress: THE input of sceneState() */
  progress: number
  /** progress units per second (signed) */
  velocity: number
  /** |velocity| normalised and low-passed, 0..1, capped */
  speed: number
  /** seconds since start (GSAP ticker time) */
  time: number
  dt: number
  /** pointer in -1..1 (target and damped) */
  pointerTX: number
  pointerTY: number
  pointerX: number
  pointerY: number
  /** 1 while the pointer moved recently, eases to 0 */
  pointerActive: number
  fps: number
}

export interface Stats {
  calls: number
  triangles: number
  points: number
  particles: number
  dpr: number
}

interface FlowStore {
  motion: Motion
  mode: Mode
  posterReason: PosterReason
  /** tier chosen from hardware hints; adaptive changes never go above it unless overridden */
  tierCap: Tier
  tier: Tier
  tierOverride: Tier | null
  ready: boolean
  loadProgress: number
  activeChapter: number
  debug: boolean
  stats: Stats
  setMode: (mode: Mode, reason?: PosterReason) => void
  setTier: (tier: Tier) => void
  stepTier: (dir: -1 | 1) => void
  setOverride: (tier: Tier | null) => void
  setLoad: (p: number) => void
  setReady: (r: boolean) => void
  setActiveChapter: (i: number) => void
  setStats: (s: Partial<Stats>) => void
}

export const useFlow = create<FlowStore>((set, get) => ({
  motion: {
    raw: 0,
    progress: 0,
    velocity: 0,
    speed: 0,
    time: 0,
    dt: 1 / 60,
    pointerTX: 0,
    pointerTY: 0,
    pointerX: 0,
    pointerY: 0,
    pointerActive: 0,
    fps: 60,
  },
  mode: 'loading',
  posterReason: null,
  tierCap: 'high',
  tier: 'high',
  tierOverride: null,
  ready: false,
  loadProgress: 0,
  activeChapter: 0,
  debug: false,
  stats: { calls: 0, triangles: 0, points: 0, particles: 0, dpr: 1 },
  setMode: (mode, reason = null) => set({ mode, posterReason: mode === 'poster' ? reason : null }),
  setTier: (tier) => get().tier !== tier && set({ tier }),
  stepTier: (dir) => {
    const { tier, tierCap, tierOverride } = get()
    if (tierOverride) return
    const next = Math.min(Math.max(tierIndex(tier) + dir, 0), tierIndex(tierCap))
    if (next !== tierIndex(tier)) set({ tier: TIERS[next] })
  },
  setOverride: (tierOverride) => set(tierOverride ? { tierOverride, tier: tierOverride } : { tierOverride: null, tier: get().tierCap }),
  setLoad: (p) => p > get().loadProgress && set({ loadProgress: Math.min(p, 1) }),
  setReady: (ready) => set({ ready }),
  setActiveChapter: (i) => get().activeChapter !== i && set({ activeChapter: i }),
  setStats: (s) => set({ stats: { ...get().stats, ...s } }),
}))
