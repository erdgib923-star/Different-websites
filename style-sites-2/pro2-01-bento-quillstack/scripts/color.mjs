// Minimal OKLCH colour math: OKLCH -> OKLab -> linear sRGB -> sRGB, gamut mapping,
// hex conversion and WCAG 2.x relative luminance / contrast ratio.
// No dependencies, so the palette and contrast scripts run with plain `node`.

const toRad = (d) => (d * Math.PI) / 180;

export function oklchToLinearRgb(L, C, H) {
  const a = C * Math.cos(toRad(H));
  const b = C * Math.sin(toRad(H));
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

const gammaEncode = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);

export function inGamut(L, C, H, eps = 0.0005) {
  return oklchToLinearRgb(L, C, H).every((v) => v >= -eps && v <= 1 + eps);
}

/** Reduce chroma (binary search) until the colour fits in sRGB. Keeps L and H. */
export function gamutMap(L, C, H) {
  if (inGamut(L, C, H)) return C;
  let lo = 0, hi = C;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(L, mid, H)) lo = mid; else hi = mid;
  }
  return lo;
}

export function oklchToSrgb(L, C, H) {
  return oklchToLinearRgb(L, C, H).map((v) => Math.min(1, Math.max(0, gammaEncode(Math.min(1, Math.max(0, v))))));
}

export function srgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}

export function hexToSrgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

const linearize = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

export function luminance([r, g, b]) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function contrast(rgbA, rgbB) {
  const a = luminance(rgbA), b = luminance(rgbB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Composite an rgba colour over an opaque background (sRGB space, like browsers do). */
export function over([r, g, b], alpha, [br, bg, bb]) {
  return [r * alpha + br * (1 - alpha), g * alpha + bg * (1 - alpha), b * alpha + bb * (1 - alpha)];
}

/** Parse `oklch(L C H [/ A])` (L as number or %), or a hex colour. Returns {rgb, alpha}. */
export function parseColor(str) {
  const s = str.trim();
  if (s.startsWith('#')) return { rgb: hexToSrgb(s), alpha: 1 };
  const m = s.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/i);
  if (!m) throw new Error(`Cannot parse colour: ${str}`);
  const L = m[2] ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  const alpha = m[5] === undefined ? 1 : m[6] ? parseFloat(m[5]) / 100 : parseFloat(m[5]);
  return { rgb: oklchToSrgb(L, parseFloat(m[3]), parseFloat(m[4])), alpha };
}

export const fmt = (n, d = 3) => Number(n.toFixed(d)).toString();
