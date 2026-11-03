// DOM choreography + colour bridge, run from the engine ticker (no React renders per frame).
//  - writes palette CSS custom properties (only when an 8-bit channel actually changes)
//  - opens/closes each chapter panel by its progress window (opacity, translate, clip-path)
//  - adds slight parallax and fills the chapter rail

import type { Vec3 } from './curve'
import { triple8 } from './color'
import type { Engine } from './runtime'
import { ROLES, type BaseFx } from './timeline'
import { useFlow } from './store'

export interface DomTargets {
  panels: (HTMLElement | null)[]
  railFill: HTMLElement | null
  /** px of vertical parallax travel across a chapter */
  parallax?: number
}

export function attachDom<FX extends BaseFx>(engine: Engine<FX>, targets: DomTargets) {
  const root = document.documentElement.style
  const last = new Map<string, number>()
  const lastPanel = new Float32Array(targets.panels.length).fill(-1)
  const lastLocal = new Float32Array(targets.panels.length).fill(-1)
  let lastFill = -1
  const parallax = targets.parallax ?? 36

  const writeColor = (name: string, c: Vec3) => {
    const key = (c[0] << 16) | (c[1] << 8) | c[2]
    if (last.get(name) === key) return
    last.set(name, key)
    root.setProperty(name, triple8(c))
  }

  const hook = () => {
    const s = engine.state
    for (const role of ROLES) writeColor(`--c-${role}`, s.colors[role].srgb8)
    const scene = useFlow.getState().mode === 'scene'
    for (let i = 0; i < targets.panels.length; i++) {
      const el = targets.panels[i]
      if (!el) continue
      if (!scene) {
        if (lastPanel[i] !== -2) {
          el.style.opacity = ''
          el.style.transform = ''
          el.style.clipPath = ''
          el.style.pointerEvents = ''
          lastPanel[i] = -2
        }
        continue
      }
      const a = s.text[i]
      const local = s.local[i]
      if (Math.abs(a - lastPanel[i]) < 0.002 && Math.abs(local - lastLocal[i]) < 0.002) continue
      lastPanel[i] = a
      lastLocal[i] = local
      const enter = 1 - a
      el.style.opacity = a.toFixed(3)
      // stays focusable: tabbing into a closed panel scrolls it into view and opens it
      el.style.pointerEvents = a < 0.05 ? 'none' : ''
      el.style.transform = `translate3d(0, ${((0.5 - local) * parallax + enter * 28).toFixed(1)}px, 0)`
      const inset = (enter * 14).toFixed(2)
      el.style.clipPath = `inset(${inset}% 0 ${inset}% 0 round 18px)`
    }
    if (targets.railFill) {
      const p = Math.round(s.progress * 1000) / 1000
      if (p !== lastFill) {
        lastFill = p
        targets.railFill.style.transform = `scaleY(${p})`
      }
    }
    useFlow.getState().setActiveChapter(s.dominant)
  }
  return engine.addHook(hook, 10)
}
