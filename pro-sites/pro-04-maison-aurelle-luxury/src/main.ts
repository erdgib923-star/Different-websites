import '@fontsource-variable/bodoni-moda/opsz.css';
import '@fontsource-variable/bodoni-moda/opsz-italic.css';
import '@fontsource-variable/hanken-grotesk/index.css';
import './styles/main.css';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, initReveals, refreshOnLoad, reduced, pop, EASE } from './motion';
import { initMedia } from './media';

let lenis: Lenis | null = null;
if (!reduced()) {
  lenis = new Lenis({ duration: 1.3, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const el = document.querySelector<HTMLElement>(a.getAttribute('href')!);
      if (!el) return;
      e.preventDefault();
      lenis!.scrollTo(el, { offset: -40 });
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }),
  );
}

initReveals();
initMedia();

/* ---------- pinned horizontal lookbook (≥768px, motion allowed) ---------- */
const section = document.querySelector<HTMLElement>('#lookbook')!;
const track = section.querySelector<HTMLElement>('.lookbook__track')!;
const looks = Array.from(track.querySelectorAll<HTMLElement>('.look'));
const counter = document.querySelector('#look-now')!;
const bar = document.querySelector<HTMLElement>('#look-bar')!;
if (!reduced()) {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    const distance = () => track.scrollWidth - window.innerWidth + 80;
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          gsap.set(bar, { scaleX: self.progress });
          counter.textContent = String(Math.min(looks.length, 1 + Math.round(self.progress * (looks.length - 1)))).padStart(2, '0');
        },
      },
    });
    // each look: the fabric opens with a clip-path curtain as it slides in, the caption pops
    looks.forEach((look, i) => {
      const fig = look.querySelector('figure')!;
      const caps = look.querySelectorAll('.look__n, .look__name, .look__mat');
      const inView = look.offsetLeft < window.innerWidth;
      const st = inView ? { trigger: section, start: 'top 65%', once: true } : { trigger: look, containerAnimation: tween, start: 'left 88%', once: true };
      const tl = gsap.timeline({ scrollTrigger: st, delay: inView ? i * 0.12 : 0 });
      tl.fromTo(fig, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' })
        .fromTo(fig.querySelector('img'), { scale: 1.25 }, { scale: 1, duration: 1.6, ease: EASE.out }, 0)
        .add(pop(caps, { stagger: 0.08 }), 0.5);
    });
  });
  mm.add('(max-width: 767px)', () => {
    looks.forEach((look) => {
      const fig = look.querySelector('figure')!;
      gsap.fromTo(fig, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: look, start: 'top 85%', once: true } });
    });
  });
}

/* ---------- collection index: cursor-follow preview with a displacement ripple on change ---------- */
const preview = document.querySelector<HTMLElement>('#preview')!;
const pimg = preview.querySelector<HTMLImageElement>('.preview__img')!;
const disp = preview.querySelector('feDisplacementMap')!;
const rows = Array.from(document.querySelectorAll<HTMLAnchorElement>('.row'));
if (window.matchMedia('(hover: hover)').matches) {
  const D = reduced() ? 0 : 1;
  const xTo = gsap.quickTo(preview, 'x', { duration: 0.6 * D || 0.01, ease: 'power3' });
  const yTo = gsap.quickTo(preview, 'y', { duration: 0.6 * D || 0.01, ease: 'power3' });
  let current = '';
  const show = (fabric: string) => {
    if (fabric === current) return;
    current = fabric;
    pimg.src = `/fabrics/${fabric}.svg`;
    if (D) {
      gsap.fromTo(disp, { attr: { scale: 60 } }, { attr: { scale: 0 }, duration: 0.9, ease: EASE.out, overwrite: true });
      gsap.fromTo(pimg, { scale: 1.15 }, { scale: 1, duration: 0.9, ease: EASE.out, overwrite: true });
    }
    gsap.to(preview, { opacity: 1, scale: 1, duration: 0.4 * D, ease: EASE.out, overwrite: 'auto' });
  };
  const hide = () => {
    current = '';
    gsap.to(preview, { opacity: 0, scale: 0.92, duration: 0.3 * D, overwrite: 'auto' });
  };
  rows.forEach((row) => {
    row.addEventListener('pointerenter', () => show(row.dataset.fabric!));
    row.addEventListener('pointermove', (e) => {
      xTo(e.clientX + 24);
      yTo(e.clientY - preview.offsetHeight / 2);
    });
    // keyboard: anchor the preview beside the focused row
    row.addEventListener('focus', () => {
      const r = row.getBoundingClientRect();
      gsap.set(preview, { x: Math.min(window.innerWidth - preview.offsetWidth - 16, r.left + r.width * 0.55), y: Math.max(16, r.top + r.height / 2 - preview.offsetHeight / 2) });
      show(row.dataset.fabric!);
    });
    row.addEventListener('blur', hide);
  });
  document.querySelector('.index__list')!.addEventListener('pointerleave', hide);
  gsap.set(preview, { scale: 0.92 });
}

/* ---------- masthead hides on scroll down ---------- */
const head = document.querySelector<HTMLElement>('.masthead')!;
let lastY = window.scrollY;
window.addEventListener(
  'scroll',
  () => {
    const y = window.scrollY;
    if (y < 120 || y < lastY - 2) head.classList.remove('is-hidden');
    else if (y > lastY + 2) head.classList.add('is-hidden');
    lastY = y;
  },
  { passive: true },
);

refreshOnLoad();
document.documentElement.classList.add('motion-ready');
