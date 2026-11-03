/**
 * Hero toy box: letter bubbles in a Matter.js world, drawn with our own canvas renderer.
 * - Matter.js is lazy-loaded (dynamic import) so it never blocks first paint; the static SVG shows meanwhile.
 * - Fixed 60 Hz physics step with an accumulator (frame-rate independent), DPR capped at 2.
 * - Pauses when the box is offscreen or the tab is hidden.
 * - Reduced motion: stays on the static SVG; "Turn physics on" opts in.
 */
import gsap from 'gsap';
import { WORD, pastelRgb, PLUM, PLUM_TEXT, PAPER } from './art';

type M = typeof import('matter-js');
type Body = import('matter-js').Body;

export function initToybox(fig: HTMLElement, reduced: boolean) {
  const stage = fig.querySelector<HTMLElement>('.toybox__stage')!;
  const canvas = fig.querySelector<HTMLCanvasElement>('.toybox__canvas')!;
  const shakeBtn = fig.querySelector<HTMLButtonElement>('#shake')!;
  const tidyBtn = fig.querySelector<HTMLButtonElement>('#tidy')!;
  const onBtn = fig.querySelector<HTMLButtonElement>('#physics-on')!;

  const start = async () => {
    let Matter: M;
    try {
      Matter = (await import('matter-js')).default as unknown as M;
    } catch (e) {
      console.warn('physics unavailable', e);
      return; // the static SVG stays
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    run(Matter, ctx);
  };

  function run(Matter: M, ctx: CanvasRenderingContext2D) {
    const { Engine, Bodies, Composite, Body, Query, Constraint, Sleeping } = Matter;
    const engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = 1.1;
    let W = 0, H = 0, R = 40, dpr = 1;
    let letters: Body[] = [];
    let blanks: Body[] = [];
    let walls: Body[] = [];
    let tidying = false;

    const font = () => `600 ${Math.round(R * 1.08)}px "Fredoka Variable", "Arial Rounded MT Bold", sans-serif`;

    const tidyTargets = () => {
      const perRow = W >= R * 2.15 * 10 + 40 ? 10 : 6;
      const rows = perRow === 10 ? [WORD] : [WORD.slice(0, 6), WORD.slice(6)];
      const out: { x: number; y: number }[] = [];
      rows.forEach((row, ri) => {
        const gap = R * 2.08;
        const x0 = W / 2 - ((row.length - 1) * gap) / 2;
        const y = H - R - 2 - (rows.length - 1 - ri) * (R * 2 + 2);
        [...row].forEach((_, i) => out.push({ x: x0 + i * gap, y }));
      });
      return out;
    };

    const build = () => {
      Composite.clear(engine.world, false);
      W = stage.clientWidth;
      H = stage.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.max(20, Math.min(46, W / 14));
      const t = 200;
      walls = [
        Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),
        Bodies.rectangle(-t / 2, 0, t, H * 6, { isStatic: true }),
        Bodies.rectangle(W + t / 2, 0, t, H * 6, { isStatic: true }),
        Bodies.rectangle(W / 2, -H * 2.5, W * 3, t, { isStatic: true }),
      ];
      const opts = { restitution: 0.55, friction: 0.04, frictionAir: 0.012, density: 0.0018 };
      const targets = tidyTargets();
      letters = [...WORD].map((ch, i) => {
        const b = Bodies.circle(targets[i].x + (Math.random() - 0.5) * R, -R * 2 - i * R * 0.9, R, opts);
        (b as Body & { label: string }).label = ch;
        b.plugin = { color: i % 6 };
        return b;
      });
      blanks = Array.from({ length: 5 }, (_, i) => {
        const b = Bodies.circle(W * (0.15 + 0.17 * i), -R * 6 - i * R, R * (0.55 + (i % 3) * 0.12), opts);
        b.plugin = { color: (i + 2) % 6, blank: true };
        return b;
      });
      Composite.add(engine.world, [...walls, ...letters, ...blanks]);
    };

    /* ---------- drawing ---------- */
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const b of [...blanks, ...letters]) {
        const r = (b as Body & { circleRadius: number }).circleRadius;
        ctx.save();
        ctx.translate(b.position.x, b.position.y);
        ctx.rotate(b.angle);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = pastelRgb(b.plugin.color);
        ctx.fill();
        ctx.lineWidth = Math.max(3, r * 0.1);
        ctx.strokeStyle = PLUM;
        ctx.stroke();
        ctx.beginPath(); // shine
        ctx.ellipse(-r * 0.36, -r * 0.4, r * 0.2, r * 0.12, -0.5, 0, Math.PI * 2);
        ctx.fillStyle = PAPER;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (!b.plugin.blank) {
          ctx.fillStyle = PLUM_TEXT;
          ctx.font = font();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.label, 0, r * 0.06);
        }
        ctx.restore();
      }
    };

    /* ---------- loop (fixed step), paused offscreen / hidden ---------- */
    let raf = 0, last = 0, acc = 0, visible = true, running = false;
    const STEP = 1000 / 60;
    const loop = (t: number) => {
      const dt = Math.min(100, t - (last || t));
      last = t;
      if (!tidying) {
        acc += dt;
        while (acc >= STEP) {
          Engine.update(engine, STEP);
          acc -= STEP;
        }
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    const play = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible ? play() : pause();
    }).observe(stage);
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));

    /* ---------- dragging (pointer events + a spring constraint) ---------- */
    let grab: import('matter-js').Constraint | null = null;
    const pt = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    canvas.addEventListener('pointerdown', (e) => {
      const p = pt(e);
      const hit = Query.point([...letters, ...blanks], p)[0];
      if (!hit) return;
      Sleeping.set(hit, false);
      const local = { x: p.x - hit.position.x, y: p.y - hit.position.y };
      const c = Math.cos(-hit.angle), s = Math.sin(-hit.angle);
      grab = Constraint.create({ pointA: p, bodyB: hit, pointB: { x: local.x * c - local.y * s, y: local.x * s + local.y * c }, stiffness: 0.12, damping: 0.08, length: 0 });
      Composite.add(engine.world, grab);
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (grab) grab.pointA = pt(e);
    });
    const release = () => {
      if (grab) Composite.remove(engine.world, grab);
      grab = null;
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);

    /* ---------- buttons ---------- */
    shakeBtn.addEventListener('click', () => {
      for (const b of [...letters, ...blanks]) {
        Sleeping.set(b, false);
        Body.setVelocity(b, { x: (Math.random() - 0.5) * 14, y: -8 - Math.random() * 10 });
        Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.4);
      }
    });
    tidyBtn.addEventListener('click', () => {
      release();
      const targets = tidyTargets();
      const from = letters.map((b) => ({ x: b.position.x, y: b.position.y, a: b.angle }));
      // blank bubbles go to the corners so they don't sit on top of the word
      blanks.forEach((b, i) => {
        Body.setPosition(b, { x: i % 2 ? W - R * 1.2 - i * 6 : R * 1.2 + i * 6, y: -R * (2 + i) });
        Body.setVelocity(b, { x: 0, y: 0 });
      });
      tidying = true;
      const o = { p: 0 };
      gsap.to(o, {
        p: 1,
        duration: 0.9,
        ease: 'power3.inOut',
        onUpdate: () => {
          letters.forEach((b, i) => {
            Body.setPosition(b, { x: from[i].x + (targets[i].x - from[i].x) * o.p, y: from[i].y + (targets[i].y - from[i].y) * o.p });
            Body.setAngle(b, from[i].a * (1 - o.p));
            Body.setVelocity(b, { x: 0, y: 0 });
            Body.setAngularVelocity(b, 0);
          });
        },
        onComplete: () => {
          tidying = false;
          acc = 0;
        },
      });
    });

    /* ---------- resize: rebuild when the box width really changes ---------- */
    let lastW = 0;
    new ResizeObserver(() => {
      const w = stage.clientWidth;
      if (Math.abs(w - lastW) < 30 && stage.clientHeight === H) return;
      lastW = w;
      release();
      build();
    }).observe(stage);

    lastW = stage.clientWidth;
    build();
    fig.classList.add('is-live');
    shakeBtn.hidden = tidyBtn.hidden = false;
    onBtn.hidden = true;
    document.fonts?.ready.then(draw);
    play();
  }

  if (reduced) {
    onBtn.hidden = false;
    onBtn.addEventListener('click', start, { once: true });
  } else {
    start();
  }
}
