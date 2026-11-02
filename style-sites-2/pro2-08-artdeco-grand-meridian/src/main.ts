import '@fontsource/poiret-one/400.css';
import '@fontsource/jost/300.css';
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, prefersReduced, supportsSDA } from './lib/motion';
import { initFigures } from './lib/figure';

/** Sunburst fan + frame draw-ins: JS fallbacks when CSS scroll timelines are unavailable. */
function initScrollFallbacks() {
  if (prefersReduced() || supportsSDA()) return;
  gsap.fromTo('.sunburst', { scale: 0.7, rotation: 0 }, {
    scale: 1.45, rotation: 6, ease: 'none',
    scrollTrigger: { trigger: document.documentElement, start: 0, end: () => innerHeight * 1.1, scrub: true },
  });
  document.querySelectorAll<SVGSVGElement>('.draw-view').forEach((svg) => {
    gsap.fromTo(svg.querySelectorAll('path'), { strokeDasharray: 1, strokeDashoffset: 1 }, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: { trigger: svg, start: 'top 95%', end: 'top 45%', scrub: true },
    });
  });
}

/**
 * Going up (≥ 900px, motion allowed): pinned. The doors part (the scene opens with a clip-path
 * from the centre while the door panels slide away), then the dial needle swings from I to XII
 * and each floor crossfades in with its note. The floor badge updates at each stop. On phones,
 * without JS or with reduced motion, the four floors are simply listed with captions.
 */
function initLift() {
  const sec = document.querySelector<HTMLElement>('.floors');
  if (!sec) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    sec.classList.add('is-pinned');
    const q = gsap.utils.selector(sec);
    const floors = q('[data-floor]');
    const notes = q('.note');
    const badge = q('[data-floor-badge]')[0] as HTMLElement;
    const NUMERALS = ['I', 'IV', 'VII', 'XII'];
    const ANGLES = [-80, -35, 0, 80];
    gsap.set(floors.slice(1), { autoAlpha: 0 });
    gsap.set(notes.slice(1), { autoAlpha: 0, y: 16 });
    gsap.set(q('[data-scene]'), { clipPath: 'inset(0% 50% 0% 50%)' });
    gsap.set(q('[data-needle]'), { rotation: ANGLES[0], svgOrigin: '100 100' });
    let shown = 0;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: q('[data-lift]')[0], start: 'top top+=90', end: '+=300%', pin: true, scrub: 0.7,
        onUpdate: (self) => {
          const i = Math.min(3, Math.max(0, Math.floor((self.progress * 4.3) - 0.3)));
          if (i !== shown) {
            shown = i;
            badge.textContent = NUMERALS[i];
            gsap.fromTo(badge, { scale: 1.35 }, { scale: 1, duration: 0.5, ease: 'back.out(2.5)' });
          }
        },
      },
    });
    // Doors open: clip-path reveal from the centre, panels slide out.
    tl.to(q('[data-scene]'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'power2.inOut' }, 0)
      .to(q('.door--l'), { xPercent: -100, duration: 0.8, ease: 'power2.inOut' }, 0)
      .to(q('.door--r'), { xPercent: 100, duration: 0.8, ease: 'power2.inOut' }, 0);
    for (let i = 1; i < 4; i++) {
      const at = i * 1.1;
      tl.to(q('[data-needle]'), { rotation: ANGLES[i], duration: 0.9, ease: 'power1.inOut' }, at - 0.2)
        .to(floors[i - 1], { autoAlpha: 0, duration: 0.4 }, at)
        .to(floors[i], { autoAlpha: 1, duration: 0.4 }, at)
        .to(notes[i - 1], { autoAlpha: 0, y: -16, duration: 0.3 }, at)
        .to(notes[i], { autoAlpha: 1, y: 0, duration: 0.35 }, at + 0.15);
    }
    tl.to({}, { duration: 0.4 });
    return () => sec.classList.remove('is-pinned');
  });
}

/** Reservation form: validates the dates and prices the stay. Nothing is sent. */
function initReserve() {
  const form = document.querySelector<HTMLFormElement>('[data-reserve]');
  if (!form) return;
  const summary = form.querySelector<HTMLElement>('[data-summary]')!;
  const error = form.querySelector<HTMLElement>('[data-error]')!;
  const inEl = form.elements.namedItem('in') as HTMLInputElement;
  const outEl = form.elements.namedItem('out') as HTMLInputElement;
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  inEl.min = iso(today);
  outEl.min = iso(new Date(today.getTime() + 864e5));
  const nights = () => {
    if (!inEl.value || !outEl.value) return 0;
    return Math.round((Date.parse(outEl.value) - Date.parse(inEl.value)) / 864e5);
  };
  const update = () => {
    const n = nights();
    const rate = Number((form.elements.namedItem('room') as HTMLSelectElement).value);
    if (inEl.value) outEl.min = iso(new Date(Date.parse(inEl.value) + 864e5));
    summary.textContent = n > 0 ? `${n} night${n === 1 ? '' : 's'} · $${(n * rate).toLocaleString('en-US')} total` : 'Choose your dates to see the total.';
    error.textContent = '';
  };
  form.addEventListener('input', update);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!inEl.value || !outEl.value) { error.textContent = 'Please choose both an arrival and a departure date.'; (inEl.value ? outEl : inEl).focus(); return; }
    if (nights() <= 0) { error.textContent = 'Departure must be at least one night after arrival.'; outEl.focus(); return; }
    error.textContent = '';
    summary.textContent = `Request noted for ${nights()} night${nights() === 1 ? '' : 's'}. This is a demo, so no reservation was made.`;
  });
}

initLift();
initReserve();
initScrollFallbacks();
initFigures();
bootMotion({ lenis: true });
