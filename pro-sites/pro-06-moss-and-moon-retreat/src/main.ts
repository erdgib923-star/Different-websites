import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/instrument-sans/index.css';
import './styles/main.css';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, initReveals, refreshOnLoad, reduced } from './motion';
import { initMedia } from './media';
import { initBooking } from './booking';
// @ts-ignore: plain JS module shared with vite.config.ts
import { blobPath } from './botanica.js';

const html = document.documentElement;
const RM = reduced();

/* ---------- day / night (light-dark() tokens follow color-scheme) ---------- */
const themeBtn = document.querySelector<HTMLButtonElement>('#theme')!;
const isNight = () => {
  const t = html.getAttribute('data-theme');
  return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
};
const syncBtn = () => themeBtn.setAttribute('aria-pressed', String(isNight()));
syncBtn();
themeBtn.addEventListener('click', () => {
  const next = isNight() ? 'light' : 'dark';
  const apply = () => {
    html.setAttribute('data-theme', next);
    syncBtn();
    try {
      localStorage.setItem('mossmere-theme', next);
    } catch {
      /* storage blocked: theme still applies for this visit */
    }
  };
  const vt = (document as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition;
  if (vt && !RM) {
    const r = themeBtn.getBoundingClientRect();
    html.style.setProperty('--vt-x', `${r.left + r.width / 2}px`);
    html.style.setProperty('--vt-y', `${r.top + r.height / 2}px`);
    vt.call(document, apply);
  } else apply();
});
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncBtn);

/* ---------- smooth scroll ---------- */
if (!RM) {
  const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const el = document.querySelector<HTMLElement>(a.getAttribute('href')!);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -90 });
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }),
  );
}

initReveals();
initMedia();
initBooking();

if (!RM) {
  /* ---------- morphing blobs (only while the hero is on screen) ---------- */
  const blobs = Array.from(document.querySelectorAll<SVGPathElement>('.blob'));
  let blobsOn = true;
  new IntersectionObserver((e) => (blobsOn = e[0].isIntersecting)).observe(document.querySelector('.hero')!);
  let last = 0;
  gsap.ticker.add((time) => {
    if (!blobsOn || document.hidden || time - last < 1 / 30) return; // ~30 fps is plenty for a slow morph
    last = time;
    blobs.forEach((b) =>
      b.setAttribute('d', blobPath(Number(b.dataset.seed), time, { cx: Number(b.dataset.cx), cy: Number(b.dataset.cy), r: Number(b.dataset.r) })),
    );
  });

  /* ---------- leaves sway with scroll velocity and settle with a spring ---------- */
  const sprigs = gsap.utils.toArray<SVGElement>('.sway');
  sprigs.forEach((s, i) => gsap.set(s, { rotation: 0, transformOrigin: '50% 99%', '--dir': i % 2 ? -1 : 1 }));
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const v = gsap.utils.clamp(-12, 12, self.getVelocity() / 140);
      sprigs.forEach((s, i) => {
        const dir = i % 2 ? -1 : 1;
        gsap.to(s, { rotation: v * dir, skewX: v * 0.25 * dir, duration: 0.5, ease: 'power2.out', overwrite: true });
        gsap.to(s, { rotation: 0, skewX: 0, duration: 1.6, delay: 0.5, ease: 'elastic.out(1, 0.35)' });
      });
    },
  });

  /* ---------- itinerary: the line draws with scroll (scrubbed) ---------- */
  gsap.to('.timeline__fill', {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.timeline-wrap', start: 'top 70%', end: 'bottom 60%', scrub: true },
  });
}

/* ---------- header hides on scroll down ---------- */
const header = document.querySelector<HTMLElement>('.header')!;
let lastY = window.scrollY;
window.addEventListener(
  'scroll',
  () => {
    const y = window.scrollY;
    if (y < 120 || y < lastY - 2) header.classList.remove('is-hidden');
    else if (y > lastY + 2) header.classList.add('is-hidden');
    lastY = y;
  },
  { passive: true },
);

refreshOnLoad();
html.classList.add('motion-ready');
