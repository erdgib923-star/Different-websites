import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/600.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/400-italic.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, prefersReduced, supportsSDA } from './lib/motion';
import { initFigures } from './lib/figure';

const root = document.documentElement;

/**
 * Day → evening. With CSS scroll-driven animation support (and motion allowed) the CSS
 * animation drives --p. Otherwise, including reduced motion (this is a colour change, not
 * movement), --p follows the scroll from here.
 */
function initDayShift() {
  if (supportsSDA() && !prefersReduced()) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    root.style.setProperty('--p', String(max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0));
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update);
  update();
}

/** Candle-glow cursor: transform-only, fine pointers only, off under reduced motion. */
function initGlow() {
  if (prefersReduced() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const glow = document.querySelector<HTMLElement>('.glow');
  if (!glow) return;
  root.classList.add('has-glow');
  let x = innerWidth / 2, y = innerHeight / 2, raf = 0;
  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; glow.style.setProperty('--gx', `${x}px`); glow.style.setProperty('--gy', `${y}px`); });
  }, { passive: true });
  document.addEventListener('pointerleave', () => { glow.style.setProperty('--gx', '-999px'); });
}

/** Demo bag: counts items and announces additions. Nothing is stored. */
function initBag() {
  const count = document.querySelector<HTMLElement>('[data-bag-count]');
  const link = document.querySelector<HTMLElement>('[data-bag-link]');
  const status = document.querySelector<HTMLElement>('[data-bag-status]');
  if (!count || !link || !status) return;
  let n = 0;
  document.querySelectorAll<HTMLButtonElement>('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      n++;
      count.textContent = String(n);
      link.setAttribute('aria-label', `Bag, ${n} item${n === 1 ? '' : 's'}`);
      status.textContent = `${btn.dataset.add} added to your bag. ${n} item${n === 1 ? '' : 's'} in total.`;
      btn.textContent = 'Added ✓';
      btn.classList.add('is-added');
      link.classList.remove('is-bumped');
      void link.offsetWidth;
      link.classList.add('is-bumped');
      setTimeout(() => { btn.textContent = 'Add to bag'; btn.classList.remove('is-added'); }, 1800);
    });
  });
}

/**
 * A day at home: pinned (≥ 900px). --t runs morning → night in the CSS room, the clock ticks,
 * captions crossfade and product pins pop at set times. Phones scrub the room unpinned.
 * Static (no JS / reduced motion): the evening room with every pin visible.
 */
function initDay() {
  const sec = document.querySelector<HTMLElement>('.day');
  const room = sec?.querySelector<HTMLElement>('[data-room]');
  if (!sec || !room) return;
  const clock = room.querySelector<HTMLElement>('[data-clock]')!;
  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 900px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { wide, motion } = ctx.conditions as { wide: boolean; motion: boolean };
    if (!motion) return;
    const q = gsap.utils.selector(sec);
    const steps = q('.step');
    const pins = q('[data-pin]');
    gsap.set(room, { '--t': 0 });
    gsap.set(pins, { autoAlpha: 0, scale: 0.6, y: 10 });
    if (wide) { sec.classList.add('is-pinned'); gsap.set(steps.slice(1), { autoAlpha: 0, y: 20 }); }
    const state = { t: 0 };
    const setClock = () => {
      const mins = 7.5 * 60 + state.t * (21 - 7.5) * 60;
      clock.textContent = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(Math.round(mins % 60 / 15) * 15 % 60).padStart(2, '0')}`;
    };
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: wide
        ? { trigger: q('[data-day]')[0], start: 'top top+=80', end: '+=280%', pin: true, scrub: 0.8 }
        : { trigger: room, start: 'top 80%', end: 'bottom 20%', scrub: 0.8 },
    });
    tl.to(state, { t: 1, duration: 4, onUpdate: () => { room.style.setProperty('--t', String(state.t)); setClock(); } }, 0);
    pins.forEach((pin: Element, i: number) => {
      tl.to(pin, { autoAlpha: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(2)' }, i * 1.05 + 0.15);
      if (i < 3) tl.to(pin, { autoAlpha: 0, duration: 0.2 }, i * 1.05 + 0.9);
      if (wide && i > 0) tl.to(steps[i - 1], { autoAlpha: 0, y: -20, duration: 0.25 }, i * 1.05 - 0.15).to(steps[i], { autoAlpha: 1, y: 0, duration: 0.3 }, i * 1.05);
    });
    setClock();
    return () => { sec.classList.remove('is-pinned'); room.style.removeProperty('--t'); clock.textContent = '21:00'; };
  });
}

initDayShift();
initGlow();
initBag();
initDay();
initFigures();
bootMotion({ lenis: true });
