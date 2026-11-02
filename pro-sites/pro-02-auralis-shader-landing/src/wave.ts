/**
 * Synthetic audio for the demos. Nothing here is real audio or a real mastering algorithm:
 * a seeded generator builds a plausible "track" (kick, bass, hats, a quiet intro and a loud
 * chorus) and a simplified chain (EQ tilt → compressor → soft saturation → limiter) shapes it.
 * All numbers derived from it are labelled as simulated on the page.
 */
export const N = 2400; // samples in the visual signal (≈ 9.6 s at a 250 Hz "display rate")

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeTrack(seed = 7): Float32Array {
  const r = rng(seed);
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / 250;
    const section = t < 2.4 ? 0.35 : t < 4.8 ? 0.6 : 1; // intro → verse → chorus
    const beat = (t * 2.1) % 1; // ~126 bpm
    const kick = Math.exp(-beat * 18) * Math.sin(t * 2 * Math.PI * 9) * 0.9;
    const bass = Math.sin(t * 2 * Math.PI * 1.7 + Math.sin(t * 0.7)) * 0.28;
    const hat = (r() * 2 - 1) * Math.exp(-((t * 4.2) % 1) * 30) * 0.35;
    const pad = Math.sin(t * 2 * Math.PI * 3.3) * Math.sin(t * 0.9) * 0.18;
    out[i] = (kick + bass + hat + pad) * section * (0.42 + r() * 0.05);
  }
  return out;
}

export type Settings = { target: number; warmth: number; amount: number };

/** Simplified mastering chain. `amount` (0..1) blends from untouched to fully processed. */
export function master(src: Float32Array, { target, warmth, amount }: Settings): Float32Array {
  const out = new Float32Array(src.length);
  const makeup = Math.pow(10, ((target + 18) * amount) / 20); // louder target → more gain
  const thresh = 0.32, ratio = 1 + 3 * amount, ceiling = Math.pow(10, -1 / 20); // −1 dBTP
  let env = 0, low = 0;
  for (let i = 0; i < src.length; i++) {
    let x = src[i];
    low += (x - low) * 0.18; // one-pole "tilt" EQ
    x = x + (low - x) * (warmth / 100) * 0.35 * amount;
    env = Math.max(Math.abs(x), env * 0.985);
    const over = env > thresh ? thresh + (env - thresh) / ratio : env;
    const gr = env > 1e-6 ? over / env : 1;
    x *= gr * makeup;
    x = Math.tanh(x * (1 + (warmth / 100) * 0.6 * amount)); // saturation
    x = Math.max(-ceiling, Math.min(ceiling, x)); // brickwall limiter
    out[i] = src[i] * (1 - amount) + x * amount;
  }
  return out;
}

export function metrics(sig: Float32Array) {
  let peak = 0, sum = 0;
  for (const v of sig) {
    peak = Math.max(peak, Math.abs(v));
    sum += v * v;
  }
  const rms = Math.sqrt(sum / sig.length);
  const peakDb = 20 * Math.log10(peak || 1e-9);
  const loud = 20 * Math.log10(rms || 1e-9) - 0.7; // a rough, simulated loudness figure
  return { peakDb, loud, crest: peakDb - 20 * Math.log10(rms || 1e-9) };
}

/** OKLCH → hex for canvas gradients (canvas interpolates in sRGB, so stops are pre-sampled in OKLCH). */
export function oklchHex(L: number, C: number, H: number) {
  const h = (H * Math.PI) / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return '#' + lin.map((v) => {
    const c = Math.min(1, Math.max(0, v));
    const g = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(g * 255).toString(16).padStart(2, '0');
  }).join('');
}

/** teal → violet → magenta sampled in OKLCH (shortest hue path) */
export function auroraStops(n = 9) {
  const a = [0.8, 0.12, 195], b = [0.68, 0.18, 295], c = [0.72, 0.19, 340];
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const [p, q, k] = t < 0.5 ? [a, b, t * 2] : [b, c, t * 2 - 1];
    return oklchHex(p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k);
  });
}

type DrawOpts = { before?: Float32Array; after: Float32Array; showBefore?: boolean; ceilingLine?: boolean; muted: string; grid: string };

/** Mirrored min/max waveform, crisp at any DPR (capped at 2). */
export function drawWave(canvas: HTMLCanvasElement, o: DrawOpts) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const mid = H / 2, amp = H * 0.46;

  ctx.strokeStyle = o.grid;
  ctx.lineWidth = 1;
  [-1, -0.5, 0, 0.5, 1].forEach((v) => {
    ctx.beginPath();
    ctx.moveTo(0, mid - v * amp + 0.5);
    ctx.lineTo(W, mid - v * amp + 0.5);
    ctx.stroke();
  });

  const bars = (sig: Float32Array, fill: string | CanvasGradient, alpha: number) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    const step = 3, cols = Math.floor(W / step), per = sig.length / cols;
    for (let c = 0; c < cols; c++) {
      let mx = 0;
      for (let i = Math.floor(c * per); i < Math.floor((c + 1) * per); i++) mx = Math.max(mx, Math.abs(sig[i]));
      const hgt = Math.max(1, mx * amp);
      ctx.fillRect(c * step, mid - hgt, step - 1, hgt * 2);
    }
    ctx.globalAlpha = 1;
  };
  if (o.before && o.showBefore !== false) bars(o.before, o.muted, o.showBefore === undefined ? 0.35 : 1);
  if (o.showBefore !== true) {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    auroraStops().forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
    bars(o.after, g, 1);
  }
  if (o.ceilingLine) {
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = o.muted;
    const y = mid - Math.pow(10, -1 / 20) * amp;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
