// OKLCH colour pipeline. Palettes are authored in OKLCH (perceptual), interpolated per channel,
// bounded in lightness/chroma, gamut-mapped by chroma reduction and converted to:
//   - linear sRGB floats for shader uniforms (three.js Color stores linear values), and
//   - 8-bit sRGB for CSS custom properties and WCAG contrast checks (same numbers the browser paints).

import type { Vec3 } from './curve'

/** [lightness 0..1, chroma 0..~0.37, hue degrees (may be unwrapped, e.g. -30 == 330)] */
export type LCH = [number, number, number]

export function oklchToLinear(l: number, c: number, hDeg: number, out: Vec3): Vec3 {
  const h = (hDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b
  const L = l_ * l_ * l_
  const M = m_ * m_ * m_
  const S = s_ * s_ * s_
  out[0] = 4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S
  out[1] = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S
  out[2] = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S
  return out
}

const inGamut = (v: Vec3) => v[0] >= -1e-6 && v[0] <= 1 + 1e-6 && v[1] >= -1e-6 && v[1] <= 1 + 1e-6 && v[2] >= -1e-6 && v[2] <= 1 + 1e-6

/** OKLCH -> linear sRGB inside the sRGB gamut, reducing chroma (keeping L and h) when needed. */
export function oklchToLinearMapped(l: number, c: number, h: number, out: Vec3): Vec3 {
  oklchToLinear(l, c, h, out)
  if (!inGamut(out)) {
    let lo = 0
    let hi = c
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2
      oklchToLinear(l, mid, h, out)
      if (inGamut(out)) lo = mid
      else hi = mid
    }
    oklchToLinear(l, lo, h, out)
  }
  out[0] = Math.min(Math.max(out[0], 0), 1)
  out[1] = Math.min(Math.max(out[1], 0), 1)
  out[2] = Math.min(Math.max(out[2], 0), 1)
  return out
}

export const linearToSrgb = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055)
export const srgbToLinear = (x: number) => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4))

/** WCAG 2.x relative luminance of an 8-bit sRGB triple. */
export function luminance8(r: number, g: number, b: number) {
  return 0.2126 * srgbToLinear(r / 255) + 0.7152 * srgbToLinear(g / 255) + 0.0722 * srgbToLinear(b / 255)
}
export function contrastRatio(y1: number, y2: number) {
  const a = Math.max(y1, y2)
  const b = Math.min(y1, y2)
  return (a + 0.05) / (b + 0.05)
}

/** Alpha-composite an 8-bit colour over another (sRGB space, as CSS does). */
export function over8(fg: Vec3, alpha: number, bg: Vec3, out: Vec3): Vec3 {
  out[0] = Math.round(fg[0] * alpha + bg[0] * (1 - alpha))
  out[1] = Math.round(fg[1] * alpha + bg[1] * (1 - alpha))
  out[2] = Math.round(fg[2] * alpha + bg[2] * (1 - alpha))
  return out
}

export interface ColorOut {
  lch: LCH
  /** linear sRGB 0..1 (for shader uniforms) */
  lin: Vec3
  /** 8-bit sRGB (for CSS + contrast) */
  srgb8: Vec3
}

export function makeColorOut(): ColorOut {
  return { lch: [0, 0, 0], lin: [0, 0, 0], srgb8: [0, 0, 0] }
}

export function writeColor(out: ColorOut, l: number, c: number, h: number) {
  out.lch[0] = l
  out.lch[1] = c
  out.lch[2] = h
  oklchToLinearMapped(l, c, h, out.lin)
  out.srgb8[0] = Math.round(linearToSrgb(out.lin[0]) * 255)
  out.srgb8[1] = Math.round(linearToSrgb(out.lin[1]) * 255)
  out.srgb8[2] = Math.round(linearToSrgb(out.lin[2]) * 255)
}

export const css8 = (c: Vec3) => `rgb(${c[0]} ${c[1]} ${c[2]})`
export const triple8 = (c: Vec3) => `${c[0]} ${c[1]} ${c[2]}`

/** OKLab distance between two OKLCH colours (used by the continuity check). */
export function deltaOK(a: LCH, b: LCH) {
  const ha = (a[2] * Math.PI) / 180
  const hb = (b[2] * Math.PI) / 180
  const da = a[1] * Math.cos(ha) - b[1] * Math.cos(hb)
  const db = a[1] * Math.sin(ha) - b[1] * Math.sin(hb)
  return Math.hypot(a[0] - b[0], da, db)
}
