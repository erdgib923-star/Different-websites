/**
 * Collect-the-seeds: a 30-second mini-game on a 160 × 96 pixel canvas.
 * Seeds fall from the orchard; move the farmer to catch them. Missed seeds sprout where they land.
 * Controls: ← → or A / D (when the game area has focus), the on-screen arrow buttons (press and
 * hold), or tap the left/right half of the canvas. The loop runs only while playing, on screen
 * and with the tab visible; the HUD is real text with a polite live region for milestones.
 */
import { CROP, FARMER, SEED, TREE, draw, rgb } from './pixel';
import { prefersReduced } from './lib/motion';

const W = 160, H = 96, GROUND = 84, ROUND = 30;

export function initGame() {
  const root = document.querySelector<HTMLElement>('[data-game]');
  const canvas = root?.querySelector<HTMLCanvasElement>('canvas');
  const ctx = canvas?.getContext('2d');
  if (!root || !canvas || !ctx) return;
  canvas.width = W; canvas.height = H;
  ctx.imageSmoothingEnabled = false;
  const scoreEl = root.querySelector<HTMLElement>('[data-score]')!;
  const timeEl = root.querySelector<HTMLElement>('[data-time]')!;
  const live = root.querySelector<HTMLElement>('[data-live]')!;
  const startBtn = root.querySelector<HTMLButtonElement>('[data-start]')!;
  const best = { v: 0 };
  try { best.v = Number(localStorage.getItem('ph-best') ?? 0); } catch { /* storage off */ }
  root.querySelector<HTMLElement>('[data-best]')!.textContent = String(best.v);

  const speed = prefersReduced() ? 0.7 : 1; // gentler under reduced motion; still user-driven
  let state: 'ready' | 'playing' | 'paused' | 'over' = 'ready';
  let x = W / 2 - 6, dir = 0, score = 0, left = ROUND, spawn = 0, last = 0, raf = 0, step = 0, visible = true;
  let seeds: { x: number; y: number; v: number }[] = [];
  let sprouts: { x: number; age: number }[] = [];

  function paint() {
    // sky + orchard
    const [r1, g1, b1] = rgb('i');
    ctx!.fillStyle = `rgb(${r1},${g1},${b1})`;
    ctx!.fillRect(0, 0, W, H);
    for (let tx = -6; tx < W; tx += 26) draw(ctx!, 'tree', TREE, tx, -2, 'day');
    ctx!.fillStyle = `rgb(${rgb('g').join(',')})`;
    ctx!.fillRect(0, GROUND, W, H - GROUND);
    ctx!.fillStyle = `rgb(${rgb('G').join(',')})`;
    ctx!.fillRect(0, GROUND, W, 2);
    sprouts.forEach((s) => draw(ctx!, `crop${Math.min(3, 1 + (s.age >> 6))}`, CROP[Math.min(3, 1 + (s.age >> 6))], s.x - 4, GROUND - 8, 'day'));
    seeds.forEach((s) => draw(ctx!, 'seed', SEED, s.x, s.y, 'day'));
    const f = state === 'playing' && dir !== 0 ? (step >> 3) & 1 : 0;
    draw(ctx!, `farmer${f}`, FARMER[f], x, GROUND - 15, 'day', dir < 0);
    if (state !== 'playing') {
      ctx!.fillStyle = `rgba(${rgb('k').join(',')},0.45)`;
      ctx!.fillRect(0, 0, W, H);
    }
  }

  function hud() {
    scoreEl.textContent = String(score);
    timeEl.textContent = String(Math.ceil(left));
  }

  function loop(now: number) {
    raf = 0;
    if (state !== 'playing' || !visible || document.hidden) { last = 0; return; }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    step++;
    x = Math.max(0, Math.min(W - 12, x + dir * 70 * dt));
    left -= dt;
    spawn -= dt;
    if (spawn <= 0) { seeds.push({ x: 6 + Math.random() * (W - 16), y: 16, v: (26 + Math.random() * 22 + (ROUND - left)) * speed }); spawn = 0.55 + Math.random() * 0.5; }
    seeds = seeds.filter((s) => {
      s.y += s.v * dt;
      if (s.y + 4 >= GROUND - 14 && s.y <= GROUND && s.x + 4 > x + 1 && s.x < x + 11) {
        score++;
        if (score % 5 === 0) live.textContent = `${score} seeds!`;
        return false;
      }
      if (s.y >= GROUND - 4) { sprouts.push({ x: s.x, age: 0 }); return false; }
      return true;
    });
    sprouts.forEach((s) => s.age++);
    if (sprouts.length > 24) sprouts.shift();
    if (left <= 0) { left = 0; end(); }
    hud();
    paint();
    if (state === 'playing') raf = requestAnimationFrame(loop);
  }
  const run = () => { if (!raf && state === 'playing') raf = requestAnimationFrame(loop); };

  function start() {
    score = 0; left = ROUND; seeds = []; sprouts = []; spawn = 0.3; x = W / 2 - 6;
    state = 'playing';
    startBtn.textContent = 'Pause';
    live.textContent = 'Go! Catch the falling seeds.';
    root!.querySelector<HTMLElement>('[data-stage]')!.focus();
    hud(); run();
  }
  function end() {
    state = 'over';
    startBtn.textContent = 'Play again';
    if (score > best.v) { best.v = score; try { localStorage.setItem('ph-best', String(score)); } catch { /* storage off */ } }
    root!.querySelector<HTMLElement>('[data-best]')!.textContent = String(best.v);
    live.textContent = `Time! You caught ${score} seed${score === 1 ? '' : 's'}. Best: ${best.v}.`;
    paint();
  }
  startBtn.addEventListener('click', () => {
    if (state === 'playing') { state = 'paused'; startBtn.textContent = 'Resume'; live.textContent = 'Paused.'; paint(); }
    else if (state === 'paused') { state = 'playing'; startBtn.textContent = 'Pause'; live.textContent = 'Resumed.'; run(); }
    else start();
  });

  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const keys = new Set<string>();
  const setDir = () => { dir = (keys.has('r') ? 1 : 0) - (keys.has('l') ? 1 : 0); };
  stage.addEventListener('keydown', (e) => {
    const k = e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ? 'l' : e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ? 'r' : '';
    if (k) { e.preventDefault(); keys.add(k); setDir(); }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); startBtn.click(); }
  });
  stage.addEventListener('keyup', (e) => {
    const k = e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ? 'l' : e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ? 'r' : '';
    if (k) { keys.delete(k); setDir(); }
  });
  stage.addEventListener('blur', () => { keys.clear(); setDir(); });
  const hold = (btn: HTMLElement, k: string) => {
    const on = (e: Event) => { e.preventDefault(); keys.add(k); setDir(); };
    const off = () => { keys.delete(k); setDir(); };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointerleave', off);
    btn.addEventListener('pointercancel', off);
  };
  hold(root.querySelector('[data-left]')!, 'l');
  hold(root.querySelector('[data-right]')!, 'r');
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const k = e.clientX - r.left < r.width / 2 ? 'l' : 'r';
    keys.add(k); setDir();
    const up = () => { keys.delete(k); setDir(); removeEventListener('pointerup', up); };
    addEventListener('pointerup', up);
  });

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible && state === 'playing') { state = 'paused'; startBtn.textContent = 'Resume'; live.textContent = 'Paused while off screen.'; paint(); }
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });
  hud();
  paint();
}
