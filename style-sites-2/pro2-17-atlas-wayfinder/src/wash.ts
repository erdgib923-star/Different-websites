/**
 * Watercolour-style washes for the log figures, drawn once on canvas: a graded sky, soft
 * pigment blooms, a horizon of low islands and a sea of short horizontal strokes. Seeded, so the
 * same image draws every time. Colours come from the palette tokens.
 */
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function drawWash(c: HTMLCanvasElement, mood: 'dusk' | 'morning') {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const r = c.getBoundingClientRect();
  c.width = Math.max(1, Math.round((r.width || 400) * dpr));
  c.height = Math.max(1, Math.round((r.height || 300) * dpr));
  const g = c.getContext('2d');
  if (!g) return;
  const { width: w, height: h } = c;
  const R = rng(mood === 'dusk' ? 5 : 9);
  const paper = token('--parchment'), sea = token('--sea-2'), deep = token('--sea-deep'), coral = token('--coral'), land = token('--land-2'), ink = token('--ink-soft');
  const horizon = h * (mood === 'dusk' ? 0.56 : 0.48);

  g.fillStyle = paper;
  g.fillRect(0, 0, w, h);
  // Sky: paper to coral (dusk) or paper to pale sea (morning)
  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, mood === 'dusk' ? deep : sea);
  sky.addColorStop(1, mood === 'dusk' ? coral : paper);
  g.globalAlpha = 0.55;
  g.fillStyle = sky;
  g.fillRect(0, 0, w, horizon);
  // Pigment blooms
  for (let i = 0; i < 14; i++) {
    const x = R() * w, y = R() * horizon, rad = (0.12 + R() * 0.25) * w;
    const bl = g.createRadialGradient(x, y, 0, x, y, rad);
    bl.addColorStop(0, R() > 0.5 ? coral : paper);
    bl.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.12;
    g.fillStyle = bl;
    g.fillRect(0, 0, w, horizon);
  }
  // Low islands on the horizon
  g.globalAlpha = 0.8;
  g.fillStyle = land;
  for (let k = 0; k < 3; k++) {
    const x0 = R() * w * 0.8, x1 = x0 + (0.15 + R() * 0.3) * w, peak = horizon - (0.04 + R() * 0.08) * h;
    g.beginPath();
    g.moveTo(x0, horizon);
    g.quadraticCurveTo((x0 + x1) / 2, peak - 0.06 * h, x1, horizon);
    g.fill();
  }
  // Sea
  g.globalAlpha = 0.7;
  g.fillStyle = mood === 'dusk' ? deep : sea;
  g.fillRect(0, horizon, w, h - horizon);
  g.globalAlpha = 1;
  g.lineCap = 'round';
  for (let i = 0; i < 220; i++) {
    const y = horizon + R() ** 1.6 * (h - horizon);
    const x = R() * w, len = (0.02 + R() * 0.08) * w * (0.4 + (y - horizon) / (h - horizon));
    g.strokeStyle = R() > 0.75 ? coral : R() > 0.4 ? paper : ink;
    g.globalAlpha = 0.18 + R() * 0.25;
    g.lineWidth = Math.max(1, dpr * (0.6 + R() * 1.6));
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + len, y + (R() - 0.5) * 2);
    g.stroke();
  }
  // Sun or moon
  g.globalAlpha = 0.9;
  g.fillStyle = mood === 'dusk' ? coral : paper;
  g.beginPath();
  g.arc(w * (mood === 'dusk' ? 0.7 : 0.25), horizon - h * 0.12, h * 0.06, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
}
