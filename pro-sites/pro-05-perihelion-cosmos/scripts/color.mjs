// Minimal, dependency-free OKLCH toolkit.
// OKLab matrices: Björn Ottosson (2020). WCAG 2.x relative luminance + contrast ratio.

const toRad = (d) => (d * Math.PI) / 180;

export function oklchToOklab(L, C, H) {
  return [L, C * Math.cos(toRad(H)), C * Math.sin(toRad(H))];
}

export function oklabToLinearSrgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// linear sRGB -> linear Display-P3
export function linearSrgbToLinearP3([r, g, b]) {
  return [
    0.8224621 * r + 0.177538 * g,
    0.0331941 * r + 0.9668058 * g,
    0.0170827 * r + 0.0723974 * g + 0.9105199 * b,
  ];
}

const encode = (x) => {
  const s = Math.sign(x), v = Math.abs(x);
  return s * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
};

export const linearOf = (L, C, H) => oklabToLinearSrgb(...oklchToOklab(L, C, H));

const inUnit = (rgb, eps = 1e-4) => rgb.every((v) => v >= -eps && v <= 1 + eps);

export function inSrgb(L, C, H) {
  return inUnit(linearOf(L, C, H).map(encode));
}
export function inP3(L, C, H) {
  return inUnit(linearSrgbToLinearP3(linearOf(L, C, H)).map(encode));
}

// Gamut-map by reducing chroma only (holds L and H), binary search.
export function clampChroma(L, C, H, test = inSrgb) {
  if (test(L, C, H)) return C;
  let lo = 0, hi = C;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (test(L, mid, H)) lo = mid; else hi = mid;
  }
  return lo;
}

export function toSrgb(L, C, H) {
  return linearOf(L, C, H).map(encode).map((v) => Math.min(1, Math.max(0, v)));
}

export function toHex(L, C, H) {
  return '#' + toSrgb(L, C, H).map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}

export function toP3String(L, C, H) {
  const p = linearSrgbToLinearP3(linearOf(L, C, H)).map(encode).map((v) => Math.min(1, Math.max(0, v)));
  return `color(display-p3 ${p.map((v) => v.toFixed(4)).join(' ')})`;
}

export function luminance(L, C, H) {
  const lin = linearOf(L, C, H).map((v) => Math.min(1, Math.max(0, v)));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

// relative luminance of a gamma-encoded sRGB triple (0..1)
export function luminanceRgb(rgb) {
  const lin = rgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

// alpha-composite `top` (alpha a) over `bottom` the way browsers do (in gamma sRGB)
export function compositeRgb(top, a, bottom) {
  return top.map((v, i) => v * a + bottom[i] * (1 - a));
}

export function contrastRgb(a, b) {
  const la = luminanceRgb(a), lb = luminanceRgb(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function contrast(a, b) {
  const la = luminance(...a), lb = luminance(...b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const r4 = (n) => +n.toFixed(4);
export const fmt = (L, C, H) => `oklch(${r4(L * 100).toFixed(2)}% ${r4(C).toFixed(4)} ${r4(H).toFixed(2)})`;

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/**
 * 11-step ramp with evenly spaced OKLCH lightness.
 * chroma follows a soft arch peaking mid-ramp, then is gamut-clamped to sRGB.
 */
export function ramp({ hue, chroma, lMax = 0.97, lMin = 0.16, hueShift = 0, flat = false }) {
  return STEPS.map((step, i) => {
    const t = i / (STEPS.length - 1);
    const L = lMax - t * (lMax - lMin);
    const H = (hue + hueShift * (t - 0.5) + 360) % 360;
    const arch = flat ? 1 : 0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 1.1));
    const C = clampChroma(L, chroma * arch, H);
    return { step, L, C, H };
  });
}

// Parse "oklch(62.5% 0.12 40)" or "oklch(0.625 0.12 40)"
export function parseOklch(str) {
  const m = str.match(/oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/);
  if (!m) return null;
  const L = m[2] ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  return [L, parseFloat(m[3]), parseFloat(m[4])];
}
