/**
 * "Catch the stars": a 30-second canvas mini-game.
 * Controls: mouse / finger (the cup follows the pointer) or ←/→ (also A/D) while the canvas is focused.
 * Safety: nothing flashes; background stars twinkle on a slow 3–5 s cycle; a catch shows a soft
 * expanding ring (skipped under reduced motion). The loop stops when idle, offscreen or the tab is hidden.
 */
import { oklchRgb, PAPER } from './art';

const BUTTER = oklchRgb(0.86, 0.068, 85);
const CORAL = '#cf5640'; // --accent-ui (sRGB)
const CUP = oklchRgb(0.86, 0.068, 215);
const CUP_LINE = PAPER;
const ROUND = 30;

type Star = { x: number; y: number; vy: number; r: number; rot: number; spin: number; bonus: boolean };
type Ring = { x: number; y: number; t: number };

export function initGame(reduced: boolean) {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  const $ = (id: string) => document.getElementById(id)!;
  const scoreEl = $('score'), timeEl = $('time'), bestEl = $('best'), msg = $('game-msg');
  const startBtn = $('start') as HTMLButtonElement;

  let best = 0;
  try {
    best = Number(localStorage.getItem('bubbletown-best') || 0) || 0;
  } catch {
    /* storage blocked: best score just isn't remembered */
  }
  bestEl.textContent = String(best);

  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cup.x = Math.min(Math.max(cup.x || W / 2, cupW() / 2), W - cupW() / 2);
    target = cup.x;
    if (!running) draw(performance.now());
  };
  const cupW = () => Math.max(70, Math.min(120, W * 0.15));
  const cup = { x: 0 };
  let target = 0;

  // background twinkles (fixed positions, slow)
  const sky = Array.from({ length: 46 }, (_, i) => ({ x: ((i * 97) % 100) / 100, y: ((i * 61) % 100) / 100, r: 0.6 + (i % 3) * 0.5, p: 3 + (i % 5) * 0.5, o: i }));

  let stars: Star[] = [];
  let rings: Ring[] = [];
  let state: 'idle' | 'running' | 'over' = 'idle';
  let running = false, paused = false, visible = true;
  let score = 0, timeLeft = ROUND, spawnIn = 0, last = 0, raf = 0;
  const keys = { left: false, right: false };

  const starPath = (r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 ? r * 0.48 : r;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
  };

  const draw = (t: number) => {
    ctx.clearRect(0, 0, W, H);
    for (const s of sky) {
      const tw = reduced ? 0.6 : 0.45 + 0.35 * Math.sin((t / 1000) * ((Math.PI * 2) / s.p) + s.o);
      ctx.globalAlpha = tw;
      ctx.fillStyle = PAPER;
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H * 0.8, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const s of stars) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      starPath(s.r);
      ctx.fillStyle = s.bonus ? CORAL : BUTTER;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = PAPER;
      ctx.stroke();
      ctx.restore();
    }
    for (const r of rings) {
      ctx.globalAlpha = Math.max(0, 1 - r.t / 0.4) * 0.8;
      ctx.strokeStyle = BUTTER;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 12 + r.t * 90, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // the cup: a half bubble
    const w = cupW(), y = H - 16;
    ctx.beginPath();
    ctx.moveTo(cup.x - w / 2, y - w * 0.42);
    ctx.quadraticCurveTo(cup.x - w / 2, y, cup.x, y);
    ctx.quadraticCurveTo(cup.x + w / 2, y, cup.x + w / 2, y - w * 0.42);
    ctx.closePath();
    ctx.fillStyle = CUP;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = CUP_LINE;
    ctx.stroke();
  };

  const hud = () => {
    scoreEl.textContent = String(score);
    timeEl.textContent = String(Math.ceil(timeLeft));
  };

  const step = (t: number) => {
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    if (state === 'running' && !paused) {
      timeLeft -= dt;
      // cup movement: keys push the target; the cup eases toward it (frame-rate independent)
      const speed = W * 0.9;
      if (keys.left) target -= speed * dt;
      if (keys.right) target += speed * dt;
      const half = cupW() / 2;
      target = Math.min(Math.max(target, half), W - half);
      cup.x += (target - cup.x) * (1 - Math.exp(-dt * 18));
      // spawn, faster as the round goes on
      spawnIn -= dt;
      if (spawnIn <= 0) {
        const prog = 1 - timeLeft / ROUND;
        spawnIn = 0.62 - prog * 0.3;
        const bonus = Math.random() < 0.15;
        stars.push({ x: 20 + Math.random() * (W - 40), y: -20, vy: H * (0.32 + prog * 0.28 + Math.random() * 0.1), r: bonus ? 13 : 16, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 1.5, bonus });
      }
      const cupTop = H - 16 - cupW() * 0.42;
      stars = stars.filter((s) => {
        s.y += s.vy * dt;
        s.rot += s.spin * dt;
        if (s.y > cupTop && s.y < H - 10 && Math.abs(s.x - cup.x) < cupW() / 2) {
          score += s.bonus ? 3 : 1;
          if (!reduced) rings.push({ x: s.x, y: cupTop, t: 0 });
          return false;
        }
        return s.y < H + 30;
      });
      if (timeLeft <= 0) end();
      hud();
    }
    rings = rings.filter((r) => (r.t += dt) < 0.4);
    draw(t);
    if (running) raf = requestAnimationFrame(step);
  };

  const loopOn = () => {
    if (running || !visible || document.hidden) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(step);
  };
  const loopOff = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  const begin = () => {
    score = 0;
    timeLeft = ROUND;
    spawnIn = 0.3;
    stars = [];
    rings = [];
    state = 'running';
    paused = false;
    msg.textContent = '';
    startBtn.textContent = 'Restart';
    hud();
    canvas.focus({ preventScroll: true });
    loopOn();
  };
  const end = () => {
    state = 'over';
    timeLeft = 0;
    stars = [];
    const isBest = score > best;
    if (isBest) {
      best = score;
      bestEl.textContent = String(best);
      try {
        localStorage.setItem('bubbletown-best', String(best));
      } catch {
        /* ignore */
      }
    }
    msg.textContent = `Time! You caught ${score} star${score === 1 ? '' : 's'}.${isBest ? ' New best!' : ''} Press Start to play again.`;
    startBtn.textContent = 'Start';
    setTimeout(() => state !== 'running' && loopOff(), 500);
  };

  startBtn.addEventListener('click', begin);

  // pointer: the cup follows the pointer (mouse hover or finger drag)
  const follow = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    target = e.clientX - r.left;
  };
  canvas.addEventListener('pointermove', follow);
  canvas.addEventListener('pointerdown', (e) => {
    follow(e);
    if (state !== 'running') return;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = true;
    else if (k === 'arrowright' || k === 'd') keys.right = true;
    else if ((k === 'enter' || k === ' ') && state !== 'running') begin();
    else return;
    e.preventDefault();
  });
  canvas.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = false;
    if (k === 'arrowright' || k === 'd') keys.right = false;
  });
  canvas.addEventListener('blur', () => (keys.left = keys.right = false));

  // pause offscreen / hidden (the timer does not run while paused)
  const setPaused = (p: boolean) => {
    if (state !== 'running') return;
    paused = p;
    msg.textContent = p ? 'Paused' : '';
    p ? loopOff() : loopOn();
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) setPaused(true);
    else if (state === 'running') setPaused(false);
  }, { threshold: 0.35 }).observe(canvas);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setPaused(true);
    else if (visible && state === 'running') setPaused(false);
  });

  new ResizeObserver(resize).observe(canvas);
  resize();
  msg.textContent = 'Press Start to play';
}
