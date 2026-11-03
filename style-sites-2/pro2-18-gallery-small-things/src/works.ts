/**
 * Eight small generative works. Each is a pure function of (canvas, hue colour, seed): the same
 * seed always draws the same picture, at any size, so the wall thumbnail and the detail view are
 * the same work. Every work uses only paper, charcoal and its one exhibit hue.
 */
export type Draw = (g: CanvasRenderingContext2D, w: number, h: number, ink: Ink, R: () => number) => void;
export interface Ink { paper: string; char: string; hue: string }

export const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

/** Smooth 2D value noise, seeded. */
function noise2(R: () => number) {
  const P = 64, grid = Array.from({ length: P * P }, () => R());
  const at = (x: number, y: number) => grid[((y % P) + P) % P * P + (((x % P) + P) % P)];
  const s = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = s(x - xi), yf = s(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}

const flow: Draw = (g, w, h, ink, R) => {
  const n = noise2(R), u = Math.min(w, h);
  g.lineCap = 'round';
  for (let i = 0; i < 520; i++) {
    let x = R() * w, y = R() * h;
    g.strokeStyle = R() < 0.18 ? ink.hue : ink.char;
    g.globalAlpha = 0.25 + R() * 0.5;
    g.lineWidth = u * (0.0015 + R() * 0.003);
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 40; k++) {
      const a = n(x / (u * 0.18), y / (u * 0.18)) * Math.PI * 4;
      x += Math.cos(a) * u * 0.008; y += Math.sin(a) * u * 0.008;
      g.lineTo(x, y);
    }
    g.stroke();
  }
};

const packing: Draw = (g, w, h, ink, R) => {
  const u = Math.min(w, h), circles: [number, number, number][] = [];
  for (let tries = 0; tries < 6000 && circles.length < 260; tries++) {
    const x = R() * w, y = R() * h;
    let r = Math.min(x, y, w - x, h - y, u * 0.16);
    for (const [cx, cy, cr] of circles) r = Math.min(r, Math.hypot(x - cx, y - cy) - cr - u * 0.006);
    if (r > u * 0.008) circles.push([x, y, r]);
  }
  circles.forEach(([x, y, r], i) => {
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
    if (i % 7 === 0) { g.fillStyle = ink.hue; g.fill(); }
    else { g.strokeStyle = ink.char; g.lineWidth = u * 0.003; g.stroke(); }
  });
};

const truchet: Draw = (g, w, h, ink, R) => {
  const cells = 9, s = Math.min(w, h) / cells;
  const ox = (w - s * cells) / 2, oy = (h - s * cells) / 2;
  g.lineWidth = s * 0.16; g.lineCap = 'butt';
  for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) {
    const x = ox + i * s, y = oy + j * s, flip = R() < 0.5;
    g.strokeStyle = (i * 3 + j * 5) % 11 === 0 ? ink.hue : ink.char;
    g.beginPath();
    if (flip) { g.arc(x, y, s / 2, 0, Math.PI / 2); g.moveTo(x + s, y + s / 2); g.arc(x + s, y + s, s / 2, -Math.PI / 2, Math.PI, true); }
    else { g.arc(x + s, y, s / 2, Math.PI / 2, Math.PI); g.moveTo(x + s / 2, y + s); g.arc(x, y + s, s / 2, 0, -Math.PI / 2, true); }
    g.stroke();
  }
};

const subdivide: Draw = (g, w, h, ink, R) => {
  const u = Math.min(w, h), lw = u * 0.012;
  const split = (x: number, y: number, ww: number, hh: number, d: number) => {
    if (d > 5 || (d > 1 && R() < 0.25) || ww < u * 0.08 || hh < u * 0.08) {
      if (R() < 0.12) { g.fillStyle = ink.hue; g.fillRect(x, y, ww, hh); }
      else if (R() < 0.06) { g.fillStyle = ink.char; g.fillRect(x, y, ww, hh); }
      g.strokeStyle = ink.char; g.lineWidth = lw; g.strokeRect(x, y, ww, hh);
      return;
    }
    const t = 0.3 + R() * 0.4;
    if (ww > hh) { split(x, y, ww * t, hh, d + 1); split(x + ww * t, y, ww * (1 - t), hh, d + 1); }
    else { split(x, y, ww, hh * t, d + 1); split(x, y + hh * t, ww, hh * (1 - t), d + 1); }
  };
  split(lw, lw, w - lw * 2, h - lw * 2, 0);
};

const moire: Draw = (g, w, h, ink, R) => {
  const u = Math.min(w, h);
  const ring = (cx: number, cy: number, col: string) => {
    // Ring spacing is kept wide enough that the interference reads as broad bands rather than a
    // fine, high-contrast shimmer (dense ring patterns can be uncomfortable to look at).
    g.strokeStyle = col; g.lineWidth = u * 0.006;
    for (let r = u * 0.02; r < u * 0.9; r += u * 0.026) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); }
  };
  g.globalAlpha = 0.75;
  ring(w * (0.42 + R() * 0.04), h * 0.5, ink.char);
  g.globalAlpha = 0.8;
  ring(w * (0.56 + R() * 0.04), h * (0.46 + R() * 0.08), ink.hue);
};

const contour: Draw = (g, w, h, ink, R) => {
  const n = noise2(R), u = Math.min(w, h), cx = w / 2, cy = h / 2;
  for (let k = 1; k <= 30; k++) {
    const r0 = (k / 30) * u * 0.62;
    g.beginPath();
    for (let a = 0; a <= 200; a++) {
      const t = (a / 200) * Math.PI * 2;
      const r = r0 * (1 + (n(Math.cos(t) * 1.6 + 8, Math.sin(t) * 1.6 + k * 0.08) - 0.5) * 0.7);
      const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r;
      a ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath();
    g.strokeStyle = k % 6 === 0 ? ink.hue : ink.char;
    g.lineWidth = u * (k % 6 === 0 ? 0.006 : 0.0025);
    g.stroke();
  }
};

const walkers: Draw = (g, w, h, ink, R) => {
  const u = Math.min(w, h), step = u * 0.03;
  g.lineJoin = 'round'; g.lineCap = 'round';
  for (let k = 0; k < 7; k++) {
    let x = w / 2, y = h / 2;
    g.strokeStyle = k === 0 ? ink.hue : ink.char;
    g.lineWidth = u * (k === 0 ? 0.012 : 0.004);
    g.beginPath(); g.moveTo(x, y);
    for (let i = 0; i < 260; i++) {
      const d = Math.floor(R() * 4);
      x += d === 0 ? step : d === 1 ? -step : 0; y += d === 2 ? step : d === 3 ? -step : 0;
      x = Math.min(w - step, Math.max(step, x)); y = Math.min(h - step, Math.max(step, y));
      g.lineTo(x, y);
    }
    g.stroke();
  }
};

const stipple: Draw = (g, w, h, ink, R) => {
  const u = Math.min(w, h), cx = w * 0.5, cy = h * 0.5, rad = u * 0.38;
  // A sphere lit from the upper left, shaded only by dot density.
  for (let i = 0; i < 9000; i++) {
    const x = R() * w, y = R() * h, dx = (x - cx) / rad, dy = (y - cy) / rad, d2 = dx * dx + dy * dy;
    let dark: number;
    if (d2 < 1) {
      const z = Math.sqrt(1 - d2);
      dark = 1 - Math.max(0, -dx * 0.5 - dy * 0.6 + z * 0.62);
    } else dark = y > cy + rad * 0.7 && Math.abs(x - cx - rad * 0.3) < rad * 1.1 * (1 - (y - cy - rad * 0.7) / (rad * 0.8)) ? 0.35 : 0.04;
    if (R() < dark * 0.8) {
      g.fillStyle = d2 < 1 && R() < 0.25 ? ink.hue : ink.char;
      g.beginPath(); g.arc(x, y, u * 0.0028, 0, Math.PI * 2); g.fill();
    }
  }
};

export const WORKS: Record<string, Draw> = { flow, packing, truchet, subdivide, moire, contour, walkers, stipple };

/** Draw a work into a canvas at its current CSS size (DPR capped at 2), or at `px` if given. */
export function paint(c: HTMLCanvasElement, work: string, hueVar: string, seed: number, px?: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const r = c.getBoundingClientRect();
  const w = px ?? Math.max(1, Math.round((r.width || 300) * dpr));
  const h = px ? Math.round(px * ((r.height || 1) / (r.width || 1))) : Math.max(1, Math.round((r.height || 300) * dpr));
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (!g) return;
  const css = getComputedStyle(document.documentElement);
  const ink: Ink = { paper: css.getPropertyValue('--wall').trim(), char: css.getPropertyValue('--charcoal').trim(), hue: css.getPropertyValue(hueVar).trim() };
  g.fillStyle = ink.paper;
  g.fillRect(0, 0, w, h);
  g.save();
  WORKS[work]?.(g, w, h, ink, rng(seed));
  g.restore();
}
