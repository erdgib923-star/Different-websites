import '@fontsource/bebas-neue/400.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/600.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, prefersReduced, supportsSDA, ScrollTrigger } from './lib/motion';
import { initFigures } from './lib/figure';
import { createLoop } from './lib/loop';
import { createCorridor, type State } from './corridor';

const root = document.documentElement;

/**
 * Title sequence. One WebGL canvas, redrawn only when the scroll state changes or the grain
 * ticks (12 times a second, low amplitude). The loop stops offscreen and in hidden tabs; under
 * reduced motion one static frame is drawn and nothing ticks.
 */
function initSequence() {
  const seq = document.querySelector<HTMLElement>('[data-sequence]');
  const canvas = seq?.querySelector<HTMLCanvasElement>('[data-corridor]');
  if (!seq || !canvas) return;
  const screen = seq.querySelector<HTMLElement>('[data-screen]')!;
  const corridor = createCorridor(canvas);
  if (corridor.ok) root.classList.add('webgl');

  // The static frame (reduced motion, or before the scrub takes over): open letterbox, door ajar.
  const S: Pick<State, 'cam' | 'door' | 'lamp'> & { shut: number } = { cam: 6, door: 0.75, lamp: 0.9, shut: 0 };
  let dirty = true;
  let tick = -1;
  const loop = createLoop(screen, (t) => {
    const k = Math.floor(t * 12);
    if (!dirty && k === tick) return;
    tick = k;
    dirty = false;
    corridor.draw({ time: k / 12, cam: S.cam, door: S.door, lamp: S.lamp, grain: 0.035 });
  });
  const set = (patch: Partial<typeof S>) => {
    Object.assign(S, patch);
    screen.style.setProperty('--shut', S.shut.toFixed(4));
    dirty = true;
    if (!loop.running) loop.redraw();
  };
  window.addEventListener('resize', () => set({}));

  const cards = [...seq.querySelectorAll<HTMLElement>('[data-card]')];
  const date = seq.querySelector<HTMLElement>('[data-card-date]')!;
  const badge = seq.querySelector<HTMLElement>('[data-badge]')!;
  const hint = seq.querySelector<HTMLElement>('[data-hint]')!;

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    seq.classList.add('is-driven');
    const p = { cam: 0, door: 0, lamp: 1, shut: 0.82 };
    set(p);
    // Opacity only (never visibility): the h1 lives in the last card and must stay in the a11y tree.
    gsap.set(cards, { opacity: 0, y: 0 });
    gsap.set(cards[0], { opacity: 1 });
    gsap.set(date, { opacity: 0 });
    const fadeIn = { opacity: 1, y: 0, duration: 0.05, ease: 'power2.out' };
    const fadeOut = { opacity: 0, y: -12, duration: 0.05, ease: 'power2.in' };
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: () => set(p),
      scrollTrigger: {
        trigger: seq,
        start: 'top top',
        end: '+=320%',
        pin: seq.querySelector('.stage'),
        scrub: 0.6,
        onUpdate: (st) => {
          // The premiere badge pops at a fixed point: once the door is fully open.
          badge.classList.toggle('is-in', st.progress >= 0.88);
          hint.classList.toggle('is-gone', st.progress > 0.03);
        },
      },
    });
    tl.to(p, { shut: 0, duration: 0.16, ease: 'power2.inOut' }, 0)
      .to(p, { cam: 13, duration: 1 }, 0)
      .to(cards[0], fadeOut, 0.14)
      .fromTo(cards[1], { opacity: 0, y: 12 }, fadeIn, 0.2)
      .to(cards[1], fadeOut, 0.33)
      .fromTo(cards[2], { opacity: 0, y: 12 }, fadeIn, 0.39)
      .to(cards[2], fadeOut, 0.52)
      .fromTo(cards[3], { opacity: 0, y: 16, scale: 1.04 }, { ...fadeIn, scale: 1, duration: 0.12 }, 0.58)
      .to(p, { door: 1, duration: 0.3, ease: 'power2.inOut' }, 0.6)
      .to(p, { lamp: 0.55, duration: 0.3 }, 0.6)
      .to(date, { opacity: 1, duration: 0.06 }, 0.78);
    return () => {
      seq.classList.remove('is-driven');
      badge.classList.remove('is-in');
      gsap.set([...cards, date], { clearProps: 'all' });
      set({ cam: 6, door: 0.75, lamp: 0.9, shut: 0 });
    };
  });
}

/** Stills: each slot is one frame rendered from the same shader, copied into a 2D canvas. */
function initStills() {
  const figs = [...document.querySelectorAll<HTMLElement>('[data-still]')];
  if (!figs.length) return;
  const off = Object.assign(document.createElement('canvas'), { width: 1200, height: 502 });
  const corridor = createCorridor(off);
  if (!corridor.ok) return; // the CSS corridor gradient behind each canvas stays visible
  figs.forEach((fig, i) => {
    const c = fig.querySelector('canvas');
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const st = JSON.parse(fig.dataset.still ?? '{}') as Partial<State>;
    corridor.draw({ time: i * 3.7, grain: 0.03, ...st });
    c.width = off.width;
    c.height = off.height;
    ctx.drawImage(off, 0, 0);
    fig.classList.add('is-rendered');
  });
  corridor.dispose();
}

/**
 * Credits roll: a sticky window over a tall section. The list moves up exactly 1px per pixel
 * scrolled. CSS scroll-driven (a named view timeline) where supported, a GSAP scrub otherwise.
 * Reduced motion / no JS: the credits are a normal list.
 */
function initCredits() {
  const sec = document.querySelector<HTMLElement>('[data-credits]');
  const list = sec?.querySelector<HTMLElement>('[data-roll]');
  if (!sec || !list || prefersReduced()) return;
  const measure = () => {
    const win = sec.querySelector<HTMLElement>('.credits__window')!.clientHeight || innerHeight;
    const from = win * 0.6;
    const to = -(list.offsetHeight - win * 0.62);
    sec.style.setProperty('--roll-from', `${from.toFixed(0)}px`);
    sec.style.setProperty('--roll-to', `${to.toFixed(0)}px`);
    sec.style.setProperty('--roll-dist', `${(from - to).toFixed(0)}px`);
    return { from, to };
  };
  sec.classList.add('is-rolling');
  let m = measure();
  if (supportsSDA()) {
    new ResizeObserver(() => { m = measure(); }).observe(list);
    return;
  }
  gsap.fromTo(list, { y: () => m.from }, {
    y: () => m.to,
    ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true, onRefreshInit: () => { m = measure(); } },
  });
  new ResizeObserver(() => ScrollTrigger.refresh()).observe(list);
}

initSequence();
initStills();
initCredits();
initFigures();
bootMotion({ lenis: true });
