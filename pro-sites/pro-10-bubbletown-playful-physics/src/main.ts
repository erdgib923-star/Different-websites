import '@fontsource-variable/fredoka';
import '@fontsource-variable/nunito';
import './styles/main.css';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, initReveals, refreshOnLoad, reduced, pop } from './motion';
import { initMedia } from './media';
import { initToybox } from './physics';
import { initBuilder } from './builder';
import { initGame } from './game';

const RM = reduced();
const root = document.documentElement;

/* ---------- smooth scroll: Lenis on the GSAP ticker (skipped for reduced motion) ---------- */
let lenis: Lenis | null = null;
if (!RM) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const el = document.querySelector<HTMLElement>(a.getAttribute('href')!);
    if (!el) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(el, { offset: -70 }) : el.scrollIntoView();
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }),
);

initReveals();
initMedia();
initToybox(document.querySelector<HTMLElement>('.toybox')!, RM);
initBuilder(RM);
initGame(RM);

/* ---------- stickers: spring pop-ins (elastic overshoot), staggered ---------- */
if (!RM) {
  const arts = gsap.utils.toArray<HTMLElement>('.sticker__art');
  gsap.set('[data-sticker]', { autoAlpha: 1 });
  gsap.fromTo(
    arts,
    { scale: 0, rotation: () => gsap.utils.random(-50, 50) },
    {
      scale: 1,
      rotation: 0,
      duration: 1.1,
      ease: 'elastic.out(1, 0.5)',
      stagger: { each: 0.07, from: 'random' },
      clearProps: 'transform',
      scrollTrigger: { trigger: '.sheet', start: 'top 80%', once: true },
    },
  );
}

/* ---------- flip cards (inert on the hidden face) ---------- */
document.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
  const btn = card.querySelector<HTMLButtonElement>('.card__flip')!;
  const front = card.querySelector<HTMLElement>('.card__front')!;
  const back = card.querySelector<HTMLElement>('.card__back')!;
  back.inert = true;
  btn.addEventListener('click', () => {
    const flipped = card.classList.toggle('is-flipped');
    btn.setAttribute('aria-pressed', String(flipped));
    front.inert = flipped;
    back.inert = !flipped;
  });
});
if (!RM) ScrollTrigger.batch('.card', { start: 'top 88%', once: true, onEnter: (b) => pop(b, { stagger: 0.08 }) });

/* ---------- pinned + scrubbed: "how a bubble is made" ---------- */
const steps = gsap.utils.toArray<HTMLElement>('.steps__item');
const setStep = (i: number) => steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
if (!RM) {
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#made',
      start: 'top top',
      end: '+=240%',
      pin: true,
      scrub: 0.6,
      onUpdate: (st) => setStep(Math.min(3, Math.floor(st.progress * 4))),
    },
  });
  tl.fromTo('.maker__line', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1 })
    .fromTo('.maker__fill', { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 1, ease: 'back.out(2)' })
    .fromTo('.maker__shine', { opacity: 0 }, { opacity: 0.7, duration: 0.3 }, '<0.5')
    .fromTo('.maker__face', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: 'back.out(3)' })
    .to('.maker', { scaleY: 0.72, scaleX: 1.22, duration: 0.45, ease: 'power2.in' })
    .to('.maker', { scaleY: 1, scaleX: 1, duration: 0.55, ease: 'elastic.out(1, 0.35)' });
} else {
  setStep(3);
}

refreshOnLoad();
root.classList.add('motion-ready');
