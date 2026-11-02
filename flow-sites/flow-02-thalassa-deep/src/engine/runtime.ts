// The single scroll source of truth and the single clock.
//
// Lenis smooths native scrolling (wheel/touch) over the tall #flow container but never hijacks it:
// keyboard, scrollbar, anchors and find-in-page keep working. The GSAP ticker drives Lenis, a
// critically damped spring on top of the scroll progress, sceneState(), the DOM choreography and
// (via a frame hook) the R3F render loop, so everything sees the same progress in the same frame.

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { clamp, damp, springStep, type SpringState } from './math'
import { useFlow } from './store'
import type { BaseFx, Flow, SceneState } from './timeline'

gsap.registerPlugin(ScrollTrigger)

type Hook = (time: number, dt: number) => void

export interface Engine<FX extends BaseFx> {
  flow: Flow<FX>
  /** sceneState of the current frame (mutated in place every tick) */
  state: SceneState<FX>
  addHook(fn: Hook, order?: number): () => void
  scrollToProgress(p: number, immediate?: boolean): void
  scrollToChapter(i: number): void
  setSmooth(on: boolean): void
  /** re-measure after layout changes (poster <-> scene) */
  refresh(): void
  destroy(): void
}

const SPRING_OMEGA = 10 // rad/s: settles in ~0.5 s, no overshoot
const SPEED_REF = 0.45 // progress/s that counts as "fast" (speed = 1)

let current: Engine<BaseFx> | null = null
export function getEngine<FX extends BaseFx>() {
  return current as unknown as Engine<FX> | null
}

export function createEngine<FX extends BaseFx>(flow: Flow<FX>, container: HTMLElement): Engine<FX> {
  const state = flow.create()
  flow.sample(0, state)
  const hooks: { fn: Hook; order: number }[] = []
  const spring: SpringState = { x: 0, v: 0 }
  const motion = useFlow.getState().motion
  let lenis: Lenis | null = null
  let lastTime = -1
  let pointerStamp = -10

  const trigger = ScrollTrigger.create({ trigger: container, start: 'top top', end: 'bottom bottom' })

  const scrollPos = () => (lenis ? lenis.scroll : window.scrollY)
  const rawProgress = () => {
    const span = trigger.end - trigger.start
    return span > 0 ? clamp((scrollPos() - trigger.start) / span) : 0
  }

  const onPointer = (e: PointerEvent) => {
    motion.pointerTX = (e.clientX / window.innerWidth) * 2 - 1
    motion.pointerTY = -((e.clientY / window.innerHeight) * 2 - 1)
    pointerStamp = motion.time
  }
  window.addEventListener('pointermove', onPointer, { passive: true })

  // First frame: start at rest at the current scroll position (e.g. reload mid-page).
  spring.x = rawProgress()
  motion.progress = spring.x

  const tick = (time: number) => {
    if (document.visibilityState === 'hidden') {
      lastTime = time
      return
    }
    const dt = lastTime < 0 ? 1 / 60 : Math.min(Math.max(time - lastTime, 1e-4), 0.1)
    lastTime = time
    lenis?.raf(time * 1000)

    motion.time = time
    motion.dt = dt
    motion.fps = damp(motion.fps, 1 / dt, 3, dt)
    motion.raw = rawProgress()
    springStep(spring, motion.raw, SPRING_OMEGA, dt)
    // the spring is critically damped, but clamp anyway so sceneState never sees <0 or >1
    motion.progress = clamp(spring.x)
    motion.velocity = spring.v
    motion.speed = damp(motion.speed, clamp(Math.abs(spring.v) / SPEED_REF), 5, dt)
    motion.pointerX = damp(motion.pointerX, motion.pointerTX, 3.5, dt)
    motion.pointerY = damp(motion.pointerY, motion.pointerTY, 3.5, dt)
    motion.pointerActive = damp(motion.pointerActive, motion.time - pointerStamp < 1.2 ? 1 : 0, 2.5, dt)

    flow.sample(motion.progress, state)
    for (let i = 0; i < hooks.length; i++) hooks[i].fn(time, dt)
  }
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  const engine: Engine<FX> = {
    flow,
    state,
    addHook(fn, order = 0) {
      const h = { fn, order }
      hooks.push(h)
      hooks.sort((a, b) => a.order - b.order)
      return () => {
        const i = hooks.indexOf(h)
        if (i >= 0) hooks.splice(i, 1)
      }
    },
    scrollToProgress(p, immediate = false) {
      const y = trigger.start + clamp(p) * (trigger.end - trigger.start)
      if (lenis) lenis.scrollTo(y, { immediate, duration: 1.6, easing: easeInOutCubic })
      else window.scrollTo({ top: y, behavior: immediate || prefersReduced() ? 'auto' : 'smooth' })
      if (immediate) {
        spring.x = clamp(p)
        spring.v = 0
      }
    },
    scrollToChapter(i) {
      const ch = flow.chapters[i]
      if (!ch) return
      const el = document.getElementById(ch.id)
      if (lenis) {
        // land a little inside the chapter so its text window is fully open
        engine.scrollToProgress(ch.start + Math.min(0.3, (ch.end - ch.start) * 0.3) * (i === 0 ? 0 : 1))
      } else if (el) {
        el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' })
      }
    },
    setSmooth(on) {
      if (on && !lenis) {
        // anchors: false - rail links call scrollToChapter() themselves; plain anchors still jump natively
        lenis = new Lenis({ autoRaf: false, lerp: 0.14, anchors: false, smoothWheel: true, syncTouch: false })
        lenis.on('scroll', ScrollTrigger.update)
      } else if (!on && lenis) {
        lenis.destroy()
        lenis = null
      }
    },
    refresh() {
      ScrollTrigger.refresh()
      lenis?.resize()
    },
    destroy() {
      gsap.ticker.remove(tick)
      window.removeEventListener('pointermove', onPointer)
      trigger.kill()
      lenis?.destroy()
      lenis = null
      hooks.length = 0
      if (current === (engine as unknown as Engine<BaseFx>)) current = null
    },
  }
  current = engine as unknown as Engine<BaseFx>
  return engine
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
