// Quality tiers. Initial tier comes from hardware hints; afterwards drei's PerformanceMonitor
// steps it down/up from measured FPS (see engine/Adaptive.tsx). `?tier=low|mid|high` overrides.

import type { Tier } from './store'

export interface TierSpec {
  dpr: number
  postfx: 'full' | 'lite' | 'off'
}

export const TIER_SPECS: Record<Tier, TierSpec> = {
  high: { dpr: 2, postfx: 'full' },
  mid: { dpr: 1.5, postfx: 'lite' },
  low: { dpr: 1, postfx: 'off' },
}

export interface Capabilities {
  webgl2: boolean
  renderer: string
  tier: Tier
  reason: string
}

export function detectCapabilities(): Capabilities {
  let webgl2 = false
  let renderer = 'unknown'
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false })
    if (gl) {
      webgl2 = true
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      renderer = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    webgl2 = false
  }
  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = nav.hardwareConcurrency || 4
  const memory = nav.deviceMemory ?? 8
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820)
  const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer)
  const weakGpu = /intel\(r\) (hd|uhd) graphics [2-5]\d{2}\b|mali-[gt][0-7]\d\b|adreno \(tm\) [2-5]\d{2}\b/i.test(renderer)

  let tier: Tier = 'high'
  let reason = 'desktop-class hints'
  if (software) {
    tier = 'low'
    reason = 'software renderer'
  } else if (mobile && (memory <= 4 || cores <= 4)) {
    tier = 'low'
    reason = 'low-memory mobile'
  } else if (mobile || weakGpu || cores <= 4 || memory <= 4) {
    tier = 'mid'
    reason = mobile ? 'mobile' : 'modest hardware'
  }
  const forced = new URLSearchParams(location.search).get('tier')
  if (forced === 'low' || forced === 'mid' || forced === 'high') {
    tier = forced
    reason = 'url override'
  }
  return { webgl2, renderer, tier, reason }
}
