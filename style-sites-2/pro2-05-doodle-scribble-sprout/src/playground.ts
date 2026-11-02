/**
 * Drawing playground: pointer drawing on a canvas with marker colours, sizes, undo, clear,
 * a keyboard-friendly "surprise squiggle", and PNG export on graph paper.
 * Strokes are stored in normalised (0–1) coordinates so they survive resizes.
 */
import palette from '../palette.config.mjs';
import { gamutMap, oklchToSrgb } from '../scripts/color.mjs';
import { fitCanvas } from './lib/loop';
import { prefersReduced } from './lib/motion';

type Pt = [number, number, number]; // x, y (0–1), width multiplier
interface Stroke { color: string; size: number; pts: Pt[] }

const css = (token: string, alpha = 1) => {
  const [L, C, H] = palette.colors[token];
  const [r, g, b] = oklchToSrgb(L, gamutMap(L, C, H), H).map((v) => Math.round(v * 255));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function initPlayground() {
  const root = document.querySelector<HTMLElement>('[data-pg]');
  const canvas = root?.querySelector<HTMLCanvasElement>('[data-pg-canvas]');
  const ctx = canvas?.getContext('2d');
  if (!root || !canvas || !ctx) return;
  const hint = root.querySelector<HTMLElement>('[data-pg-hint]')!;
  const status = root.querySelector<HTMLElement>('[data-pg-status]')!;
  const strokes: Stroke[] = [];
  let color = 'marker-blue';
  let size = 10;
  let current: Stroke | null = null;
  let dpr = 1;
  let animating: Stroke | null = null; // squiggle being drawn progressively
  let limit = 0;

  const say = (msg: string) => { status.textContent = msg; };
  const dims = () => ({ w: canvas.width / dpr, h: canvas.height / dpr });

  function drawStroke(s: Stroke, upto = s.pts.length) {
    const { w, h } = dims();
    const pts = s.pts.slice(0, upto);
    if (!pts.length) return;
    const pencil = s.color === 'graphite';
    ctx!.save();
    ctx!.globalCompositeOperation = pencil ? 'source-over' : 'multiply';
    ctx!.strokeStyle = css(s.color, pencil ? 0.85 : 0.92);
    ctx!.fillStyle = ctx!.strokeStyle;
    ctx!.lineCap = 'round';
    ctx!.lineJoin = 'round';
    const scale = Math.min(w, h) / 600;
    if (pts.length === 1) {
      ctx!.beginPath();
      ctx!.arc(pts[0][0] * w, pts[0][1] * h, (s.size * scale * pts[0][2]) / 2, 0, Math.PI * 2);
      ctx!.fill();
    } else {
      // Quadratic curves through midpoints give a smooth, marker-like line.
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1, p] = pts[i];
        const mx0 = i > 1 ? (pts[i - 2][0] + x0) / 2 : x0, my0 = i > 1 ? (pts[i - 2][1] + y0) / 2 : y0;
        const mx1 = (x0 + x1) / 2, my1 = (y0 + y1) / 2;
        ctx!.lineWidth = Math.max(1, s.size * scale * p);
        ctx!.beginPath();
        ctx!.moveTo(mx0 * w, my0 * h);
        ctx!.quadraticCurveTo(x0 * w, y0 * h, mx1 * w, my1 * h);
        ctx!.stroke();
      }
    }
    ctx!.restore();
  }

  function redraw() {
    dpr = fitCanvas(canvas!);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
    strokes.forEach((s) => drawStroke(s, s === animating ? limit : s.pts.length));
    hint.classList.toggle('is-gone', strokes.length > 0);
  }

  const point = (e: PointerEvent): Pt => {
    const r = canvas.getBoundingClientRect();
    const pressure = e.pointerType === 'pen' ? 0.55 + e.pressure * 0.9 : 1;
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, pressure];
  };

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    current = { color, size, pts: [point(e)] };
    strokes.push(current);
    hint.classList.add('is-gone');
    drawStroke(current);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!current) return;
    const events = e.getCoalescedEvents?.() ?? [e];
    for (const ev of events) current.pts.push(point(ev));
    redraw();
  });
  const end = () => {
    if (!current) return;
    current = null;
    say(`Line drawn. ${strokes.length} line${strokes.length === 1 ? '' : 's'} on the page.`);
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  // Radio groups: click to choose, arrow keys to move (roving tabindex).
  root.querySelectorAll<HTMLElement>('[role="radiogroup"]').forEach((group) => {
    const radios = [...group.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    const select = (btn: HTMLButtonElement, focus = false) => {
      radios.forEach((r) => { r.setAttribute('aria-checked', String(r === btn)); r.tabIndex = r === btn ? 0 : -1; });
      if (btn.dataset.color) { color = btn.dataset.color; say(`${btn.getAttribute('aria-label')} selected.`); }
      if (btn.dataset.size) { size = Number(btn.dataset.size); say(`${btn.getAttribute('aria-label')} size selected.`); }
      if (focus) btn.focus();
    };
    radios.forEach((r) => {
      r.tabIndex = r.getAttribute('aria-checked') === 'true' ? 0 : -1;
      r.addEventListener('click', () => select(r));
      r.addEventListener('keydown', (e) => {
        const i = radios.indexOf(r);
        const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        select(radios[(i + step + radios.length) % radios.length], true);
      });
    });
  });

  function squiggle() {
    const s: Stroke = { color, size, pts: [] };
    const cx = 0.25 + Math.random() * 0.5, cy = 0.3 + Math.random() * 0.4;
    const loops = 3 + Math.floor(Math.random() * 3);
    const spread = 0.18 + Math.random() * 0.12;
    for (let t = 0; t <= 1; t += 0.006) {
      const a = t * loops * Math.PI * 2;
      const r = 0.05 + 0.04 * Math.sin(a * 0.5);
      s.pts.push([cx + (t - 0.5) * spread * 2 + Math.cos(a) * r, cy + Math.sin(a) * r * 1.4 + Math.sin(t * 6) * 0.03, 1]);
    }
    strokes.push(s);
    hint.classList.add('is-gone');
    say('A surprise squiggle was drawn.');
    if (prefersReduced()) { redraw(); return; }
    animating = s;
    limit = 1;
    const step = () => {
      limit = Math.min(s.pts.length, limit + 6);
      redraw();
      if (limit < s.pts.length) requestAnimationFrame(step);
      else { animating = null; redraw(); }
    };
    requestAnimationFrame(step);
  }

  function save() {
    const out = document.createElement('canvas');
    out.width = canvas!.width; out.height = canvas!.height;
    const o = out.getContext('2d')!;
    o.fillStyle = css('paper');
    o.fillRect(0, 0, out.width, out.height);
    o.strokeStyle = css('grid-strong');
    o.lineWidth = 1;
    const g = 24 * dpr;
    for (let x = 0; x < out.width; x += g) { o.beginPath(); o.moveTo(x + 0.5, 0); o.lineTo(x + 0.5, out.height); o.stroke(); }
    for (let y = 0; y < out.height; y += g) { o.beginPath(); o.moveTo(0, y + 0.5); o.lineTo(out.width, y + 0.5); o.stroke(); }
    o.drawImage(canvas!, 0, 0);
    out.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'scribble-and-sprout-drawing.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      say('Your drawing was saved as a PNG.');
    });
  }

  root.querySelector('[data-act="squiggle"]')!.addEventListener('click', squiggle);
  root.querySelector('[data-act="undo"]')!.addEventListener('click', () => {
    if (!strokes.length) { say('Nothing to undo.'); return; }
    strokes.pop(); redraw(); say(`Undone. ${strokes.length} line${strokes.length === 1 ? '' : 's'} left.`);
  });
  root.querySelector('[data-act="clear"]')!.addEventListener('click', () => { strokes.length = 0; redraw(); say('The page is blank again.'); });
  root.querySelector('[data-act="save"]')!.addEventListener('click', save);

  new ResizeObserver(() => redraw()).observe(canvas);
  redraw();
}
