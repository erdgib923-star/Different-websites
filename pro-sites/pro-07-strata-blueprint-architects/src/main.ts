import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/martian-mono/index.css';
import './styles/main.css';
import Lenis from 'lenis';
import { Flip } from 'gsap/Flip';
import { gsap, ScrollTrigger, initReveals, refreshOnLoad, reduced, pop, EASE } from './motion';
import { initMedia } from './media';

gsap.registerPlugin(Flip);
const RM = reduced();

if (!RM) {
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const el = document.querySelector<HTMLElement>(a.getAttribute('href')!);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -60 });
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }),
  );
}

initReveals();
initMedia();

const draw = (targets: gsap.TweenTarget, vars: gsap.TweenVars = {}) => gsap.to(targets, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.02, ...vars });
const popDims = (root: Element, delay = 0) => pop(root.querySelectorAll('.dim'), { stagger: 0.12, delay, blur: false });

if (!RM) {
  /* ---------- hero: the elevation draws itself, then its dimensions pop in ---------- */
  const hero = document.querySelector('.hero__drawing')!;
  gsap.timeline({ delay: 0.3 }).add(draw(hero.querySelectorAll('.draw'), { duration: 1.4, stagger: 0.015 })).add(popDims(hero), '-=0.2');

  /* ---------- other drawings (project index, before/after) draw on when they arrive ---------- */
  document.querySelectorAll('.project .drawing, .ba .drawing').forEach((d) => {
    gsap.to(d.querySelectorAll('.draw'), { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.01, scrollTrigger: { trigger: d, start: 'top 88%', once: true } });
  });

  /* ---------- blueprint: pinned, scrubbed plan drawing in four passes ---------- */
  const plan = document.querySelector('.blueprint__plan svg')!;
  const steps = Array.from(document.querySelectorAll<HTMLElement>('[data-plan-step]'));
  const pass = [
    plan.querySelectorAll('.wall'),
    plan.querySelectorAll('.arc, .win, g[transform] .draw'),
    Array.from(plan.querySelectorAll('.draw.thin, circle.draw')).filter((el) => !el.closest('g[transform]')),
    plan.querySelectorAll('.room, .dim'),
  ];
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.blueprint',
      start: 'top top',
      end: '+=180%',
      pin: true,
      scrub: 0.6,
      onUpdate: (self) => steps.forEach((s, i) => s.classList.toggle('is-active', i === Math.min(3, Math.floor(self.progress * 4)))),
    },
  });
  tl.to(pass[0], { strokeDashoffset: 0, stagger: 0.08, duration: 1, ease: 'none' })
    .to(pass[1], { strokeDashoffset: 0, stagger: 0.04, duration: 1, ease: 'none' })
    .to(pass[2], { strokeDashoffset: 0, stagger: 0.03, duration: 1, ease: 'none' })
    // dimension callouts pop in at the end of the scrub
    .fromTo(pass[3], { opacity: 0, scale: 0.85, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, stagger: 0.08, duration: 0.6, ease: EASE.pop });

  /* ---------- process: pinned walkthrough, captions synced to the frames ---------- */
  const frames = gsap.utils.toArray<HTMLElement>('.walk__frame');
  const caps = gsap.utils.toArray<HTMLElement>('.walk__step');
  const bar = document.querySelector('.walk__progress span');
  gsap.set(frames.slice(1), { clipPath: 'inset(0% 0% 0% 100%)' });
  let active = 0;
  const wt = gsap.timeline({
    scrollTrigger: {
      trigger: '.walk',
      start: 'top top',
      end: '+=240%',
      pin: true,
      scrub: 0.5,
      snap: { snapTo: 1 / 3, duration: { min: 0.2, max: 0.6 }, ease: 'power2.inOut' },
      onUpdate(self) {
        gsap.set(bar, { scaleX: self.progress });
        const i = Math.round(self.progress * 3);
        if (i !== active) {
          active = i;
          caps.forEach((c, k) => c.classList.toggle('is-active', k === i));
          pop(caps[i].querySelectorAll('h3, p'), { stagger: 0.06, blur: false });
        }
      },
    },
  });
  for (let i = 1; i < frames.length; i++) {
    wt.to(frames[i], { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power2.inOut' }, i - 1).fromTo(frames[i].querySelector('svg'), { scale: 1.06 }, { scale: 1, duration: 1, ease: 'power2.out' }, i - 1);
  }
}

/* ---------- before / after slider (native range input = keyboard + screen reader friendly) ---------- */
const ba = document.querySelector<HTMLElement>('.ba')!;
const range = document.querySelector<HTMLInputElement>('#ba-range')!;
const setPos = (v: number) => {
  ba.style.setProperty('--pos', `${v}%`);
  range.setAttribute('aria-valuetext', `${Math.round(v)}% before, ${Math.round(100 - v)}% after`);
};
range.addEventListener('input', () => setPos(Number(range.value)));
setPos(50);
if (!RM) {
  // a one-time sweep shows that the image can be dragged
  const o = { v: 50 };
  gsap.timeline({ scrollTrigger: { trigger: ba, start: 'top 70%', once: true }, onUpdate: () => setPos(o.v), onComplete: () => (range.value = '50') })
    .to(o, { v: 22, duration: 0.8, ease: EASE.inOut })
    .to(o, { v: 78, duration: 1, ease: EASE.inOut })
    .to(o, { v: 50, duration: 0.7, ease: EASE.inOut });
}

/* ---------- filterable index with Flip ---------- */
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.filter'));
const cards = Array.from(document.querySelectorAll<HTMLElement>('.project'));
const count = document.querySelector('#work-count')!;
buttons.forEach((btn) =>
  btn.addEventListener('click', () => {
    const f = btn.dataset.filter!;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    const state = Flip.getState(cards);
    cards.forEach((c) => (c.hidden = f !== 'all' && c.dataset.type !== f));
    const n = cards.filter((c) => !c.hidden).length;
    count.textContent = f === 'all' ? `Showing all ${n} projects` : `Showing ${n} ${f} project${n === 1 ? '' : 's'}`;
    if (RM) return;
    Flip.from(state, {
      duration: 0.6,
      ease: EASE.inOut,
      absolute: true,
      stagger: 0.03,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5, ease: EASE.pop }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.3 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }),
);

/* ---------- header hides on scroll down ---------- */
const header = document.querySelector<HTMLElement>('.header')!;
let lastY = window.scrollY;
window.addEventListener(
  'scroll',
  () => {
    const y = window.scrollY;
    if (y < 100 || y < lastY - 2) header.classList.remove('is-hidden');
    else if (y > lastY + 2) header.classList.add('is-hidden');
    lastY = y;
  },
  { passive: true },
);

refreshOnLoad();
document.documentElement.classList.add('motion-ready');
