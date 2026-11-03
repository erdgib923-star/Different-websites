import '@fontsource/syncopate/400.css';
import '@fontsource/syncopate/700.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/800.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, prefersReduced, ScrollTrigger } from './lib/motion';
import { initFigures } from './lib/figure';
import { drawBrushed, drawCarbon } from './art';

const root = document.documentElement;

/** Resolve a CSS colour token to rgb() (three.js does not parse oklch). */
const cssRgb = (v: string) => {
  const g = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = getComputedStyle(root).getPropertyValue(v).trim() || '#c62828';
  g.fillRect(0, 0, 1, 1);
  const [r, gg, b] = g.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${gg}, ${b})`;
};

/** Hero: pause the CSS light sweep while the car is offscreen. */
function initCar() {
  const car = document.querySelector<HTMLElement>('[data-car]');
  if (!car) return;
  new IntersectionObserver(([e]) => car.classList.toggle('is-off', !e.isIntersecting)).observe(car);
}

/** Material swatches, drawn once (and again if the slot changes size a lot). */
function initArt() {
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-art]').forEach((c) => {
    const draw = () => (c.dataset.art === 'carbon' ? drawCarbon(c) : drawBrushed(c));
    draw();
    let w = c.clientWidth;
    new ResizeObserver(() => { if (Math.abs(c.clientWidth - w) > 80) { w = c.clientWidth; draw(); } }).observe(c);
  });
}

/**
 * The wheel: pinned on wide screens (scrubbed, unpinned on phones). Scroll turns the wheel
 * three full revolutions and swings the camera from face-on to three-quarters. Each callout
 * pops in at its own scroll position (`data-at`). Reduced motion: one static three-quarter view
 * with every callout shown.
 */
function initWheel() {
  const sec = document.querySelector<HTMLElement>('[data-wheel-sec]');
  const canvas = sec?.querySelector<HTMLCanvasElement>('[data-wheel]');
  if (!sec || !canvas) return;
  // Three.js is the heaviest dependency; load it only as the section approaches.
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    import('./wheel').then(({ createWheel }) => startWheel(sec, canvas, createWheel(canvas, cssRgb('--signal'))));
  }, { rootMargin: '800px 0px' });
  io.observe(sec);
}

function startWheel(sec: HTMLElement, canvas: HTMLCanvasElement, wheel: import('./wheel').Wheel | null) {
  if (!wheel) return; // the SVG wheel stays
  root.classList.add('webgl');
  new ResizeObserver(() => wheel.resize()).observe(canvas);
  const callouts = [...sec.querySelectorAll<HTMLElement>('[data-at]')];
  const STATIC = { roll: 0.4, yaw: 0.62 };
  wheel.set(STATIC);

  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 900px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { wide, motion } = ctx.conditions as { wide: boolean; motion: boolean };
    if (!motion) return;
    sec.classList.add('is-driven');
    const apply = (p: number) => {
      const e = gsap.parseEase('power2.inOut')(p);
      wheel.set({ roll: p * Math.PI * 6, yaw: e * 0.72 });
      callouts.forEach((c) => c.classList.toggle('is-on', p >= parseFloat(c.dataset.at ?? '0')));
    };
    apply(0);
    gsap.timeline({
      scrollTrigger: {
        ...(wide
          ? { trigger: sec.querySelector('.wheel__inner'), start: 'top top+=72', end: '+=220%', pin: true }
          : { trigger: sec.querySelector('.wheel__stage'), start: 'top 85%', end: 'bottom 15%' }),
        scrub: 0.5,
        refreshPriority: 1, // created late (lazy import) but sits above the reel's pin
        onUpdate: (st) => apply(st.progress),
      },
    });
    return () => { sec.classList.remove('is-driven'); wheel.set(STATIC); };
  });
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

/** Spec reel: horizontal scrub while pinned (wide + motion); otherwise a native scroll-snap strip. */
function initReel() {
  const sec = document.querySelector<HTMLElement>('[data-reel]');
  const track = sec?.querySelector<HTMLElement>('[data-reel-track]');
  const bar = sec?.querySelector<HTMLElement>('[data-reel-progress]');
  if (!sec || !track || !bar) return;
  const viewport = track.parentElement!;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    sec.classList.add('is-pinned');
    const dist = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: sec, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.5, invalidateOnRefresh: true,
        onUpdate: (st) => { bar.style.transform = `scaleX(${st.progress})`; },
      },
    });
    return () => { sec.classList.remove('is-pinned'); gsap.set(track, { clearProps: 'transform' }); };
  });
  // Unpinned: progress follows the strip's own scroll position.
  viewport.addEventListener('scroll', () => {
    if (sec.classList.contains('is-pinned')) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    bar.style.transform = `scaleX(${max > 0 ? viewport.scrollLeft / max : 1})`;
  }, { passive: true });
}

/** Viewing form: client-side validation only. Nothing is sent anywhere. */
function initForm() {
  const form = document.querySelector<HTMLFormElement>('[data-form]');
  if (!form) return;
  const email = form.querySelector<HTMLInputElement>('#f-email')!;
  const name = form.querySelector<HTMLInputElement>('#f-name')!;
  const err = form.querySelector<HTMLElement>('#f-email-err')!;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    email.setAttribute('aria-invalid', String(!okEmail));
    err.hidden = okEmail;
    name.setAttribute('aria-invalid', String(!name.value.trim()));
    if (!okEmail || !name.value.trim()) {
      status.textContent = 'Please add your name and a valid email.';
      (!name.value.trim() ? name : email).focus();
      return;
    }
    status.textContent = `Thank you, ${name.value.trim()}. This is a demo, so nothing was sent.`;
    form.reset();
  });
}

initCar();
initArt();
initWheel();
initReel();
initForm();
initFigures();
bootMotion({ lenis: !prefersReduced() });
