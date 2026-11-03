/**
 * Procedural material swatches for the figure slots, drawn once into 2D canvases:
 * - brushed aluminium: thousands of faint horizontal streaks plus a soft anisotropic highlight;
 * - carbon fibre: a 2x2 twill weave of shaded tows.
 * Seeded, so every visit draws the same surface.
 */
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function size(c: HTMLCanvasElement) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const r = c.getBoundingClientRect();
  c.width = Math.max(1, Math.round((r.width || 400) * dpr));
  c.height = Math.max(1, Math.round((r.height || 400) * dpr));
  return c.getContext('2d');
}

export function drawBrushed(c: HTMLCanvasElement) {
  const g = size(c);
  if (!g) return;
  const { width: w, height: h } = c;
  const r = rng(7);
  const base = g.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, '#8d929a');
  base.addColorStop(0.5, '#c4c8cf');
  base.addColorStop(1, '#7c8189');
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < h * 3; i++) {
    const y = r() * h;
    const len = w * (0.2 + r() * 0.8);
    const x = r() * w - len * 0.3;
    const l = r();
    g.strokeStyle = l > 0.5 ? `rgba(255,255,255,${0.04 + r() * 0.08})` : `rgba(20,24,30,${0.04 + r() * 0.08})`;
    g.lineWidth = r() * 1.2 + 0.3;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + len, y + (r() - 0.5) * 0.6);
    g.stroke();
  }
  // Anisotropic highlight: a soft vertical band, as brushed metal reflects across the grain.
  const hl = g.createLinearGradient(0, 0, w, 0);
  hl.addColorStop(0.3, 'rgba(255,255,255,0)');
  hl.addColorStop(0.46, 'rgba(255,255,255,0.28)');
  hl.addColorStop(0.62, 'rgba(255,255,255,0)');
  g.fillStyle = hl;
  g.fillRect(0, 0, w, h);
}

export function drawCarbon(c: HTMLCanvasElement) {
  const g = size(c);
  if (!g) return;
  const { width: w, height: h } = c;
  const t = Math.max(10, Math.round(w / 26)); // tow width
  g.fillStyle = '#0f1013';
  g.fillRect(0, 0, w, h);
  for (let y = 0, row = 0; y < h + t; y += t, row++) {
    for (let x = 0, col = 0; x < w + t; x += t, col++) {
      // 2x2 twill: the over/under pattern shifts one tow per row.
      const horizontal = ((col + row) >> 1) % 2 === 0;
      const grad = horizontal ? g.createLinearGradient(x, y, x, y + t) : g.createLinearGradient(x, y, x + t, y);
      grad.addColorStop(0, '#1b1d22');
      grad.addColorStop(0.45, horizontal ? '#4a4e57' : '#33363d');
      grad.addColorStop(1, '#16171b');
      g.fillStyle = grad;
      g.fillRect(x + 0.5, y + 0.5, t - 1, t - 1);
    }
  }
  // Clear-coat sheen
  const s = g.createRadialGradient(w * 0.3, h * 0.25, 0, w * 0.3, h * 0.25, w * 0.8);
  s.addColorStop(0, 'rgba(255,255,255,0.16)');
  s.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = s;
  g.fillRect(0, 0, w, h);
}
