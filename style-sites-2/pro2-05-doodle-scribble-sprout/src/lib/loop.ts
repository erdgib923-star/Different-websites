import { prefersReduced } from './motion';

/**
 * A requestAnimationFrame loop that only runs while `el` is on screen and the tab is visible.
 * Under prefers-reduced-motion it draws one static frame (t = staticTime) and never loops.
 * `draw(t, dt)` receives seconds.
 */
export function createLoop(el: Element, draw: (t: number, dt: number) => void, staticTime = 2) {
  let raf = 0;
  let visible = false;
  let last = 0;
  let t = staticTime;
  const reduced = prefersReduced();

  const frame = (now: number) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    t += dt;
    draw(t, dt);
    raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (reduced || raf || !visible || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) start(); else stop();
  }, { rootMargin: '100px' });
  io.observe(el);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  draw(t, 0); // first frame immediately, and the only one under reduced motion
  return {
    /** Redraw once, for input-driven changes while paused or reduced. */
    redraw: () => { if (!raf) draw(t, 0); },
    get running() { return raf !== 0; },
    stop,
  };
}

/** Size a canvas to its CSS box with devicePixelRatio capped at 2. Returns the ratio used. */
export function fitCanvas(canvas: HTMLCanvasElement, maxDpr = 2): number {
  const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
  const { width, height } = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(width * dpr));
  const h = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return dpr;
}
