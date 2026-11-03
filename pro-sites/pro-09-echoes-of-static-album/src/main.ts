import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/azeret-mono/index.css';
import './styles/main.css';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, initReveals, refreshOnLoad, reduced, EASE } from './motion';
import { initMedia } from './media';
import { Engine, TRACKS } from './audio';
import { initViz, drawCover } from './viz';

const RM = reduced();
const root = document.documentElement;
const HUES = [20, 80, 140, 200, 260, 320];

let lenis: Lenis | null = null;
if (!RM) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const goTo = (el: HTMLElement) => (lenis ? lenis.scrollTo(el, { offset: 0 }) : el.scrollIntoView());
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const el = document.querySelector<HTMLElement>(a.getAttribute('href')!);
    if (!el) return;
    e.preventDefault();
    goTo(el);
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }),
);

initReveals();
initMedia();

/* ---------- page hue follows scroll (shortest path between track hues) ---------- */
const chapters = Array.from(document.querySelectorAll<HTMLElement>('.track'));
let stops: [number, number][] = [];
const spectrumST = ScrollTrigger.create({ trigger: '#spectrum', start: 'top top', end: '+=180%', pin: !RM });
const measure = () => {
  const vh = window.innerHeight;
  stops = [[0, HUES[0]], [spectrumST.start, HUES[0]], [spectrumST.end, HUES[5]]];
  chapters.forEach((c, i) => {
    const top = c.getBoundingClientRect().top + window.scrollY;
    stops.push([top + c.offsetHeight / 2 - vh / 2, HUES[i]]);
  });
};
ScrollTrigger.addEventListener('refresh', measure);
const lerpHue = (a: number, b: number, t: number) => {
  let d = ((b - a + 540) % 360) - 180; // shortest way round the circle
  return (a + d * t + 360) % 360;
};
let hue = HUES[0];
const hueAt = (y: number) => {
  if (!stops.length) return HUES[0];
  if (y <= stops[0][0]) return stops[0][1];
  for (let k = 1; k < stops.length; k++) {
    const [y0, h0] = stops[k - 1], [y1, h1] = stops[k];
    if (y <= y1) return lerpHue(h0, h1, y1 > y0 ? (y - y0) / (y1 - y0) : 1);
  }
  return stops[stops.length - 1][1];
};
const updateHue = () => {
  const h = hueAt(window.scrollY);
  if (Math.abs(h - hue) > 0.05) {
    hue = h;
    root.style.setProperty('--h', h.toFixed(1));
    viz.redraw();
  }
};

/* ---------- the pinned "six colours" sequence (scrubbed) ---------- */
if (!RM) {
  // clip from the bottom up: the number label (bottom-aligned) stays fully legible and undistorted
  gsap.fromTo('.swatches li', { clipPath: 'inset(62% 0% 0% 0% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', ease: 'none', stagger: 0.5, scrollTrigger: { trigger: '#spectrum', start: 'top top', end: '+=180%', scrub: 0.5 } });
}

/* ---------- parallax pair per chapter: cover art drifts up while the text card drifts down ---------- */
if (!RM) {
  chapters.forEach((c) => {
    const st = { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true };
    gsap.fromTo(c.querySelector('.track__art'), { y: 60 }, { y: -60, ease: 'none', scrollTrigger: st });
    gsap.fromTo(c.querySelector('.track__text'), { y: -24 }, { y: 24, ease: 'none', scrollTrigger: { ...st } });
  });
}

/* ---------- audio ---------- */
const engine = new Engine();
const viz = initViz(document.querySelector<HTMLCanvasElement>('#viz')!, () => (engine.playing ? engine.analyser : null), () => hue, RM);
const pp = document.querySelector<HTMLButtonElement>('#pp')!;
const big = document.querySelector<HTMLButtonElement>('#play-big')!;
const muteBtn = document.querySelector<HTMLButtonElement>('#mute')!;
const follow = document.querySelector<HTMLInputElement>('#follow')!;
const trackBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-play]'));
const render = () => {
  const t = engine.track;
  document.querySelector('#now-n')!.textContent = String(t + 1).padStart(2, '0');
  document.querySelector('#now-title')!.textContent = TRACKS[t].title;
  document.querySelector('#now-state')!.textContent = engine.playing ? (engine.muted ? '· playing (muted)' : '· playing') : '· stopped';
  pp.textContent = engine.playing ? '❚❚' : '▶';
  pp.setAttribute('aria-label', engine.playing ? 'Pause' : 'Play');
  big.querySelector('.play-big__label')!.textContent = engine.playing ? 'Pause' : 'Press play';
  big.querySelector('.play-big__icon')!.textContent = engine.playing ? '❚❚' : '▶';
  muteBtn.setAttribute('aria-pressed', String(engine.muted));
  trackBtns.forEach((b) => b.setAttribute('aria-pressed', String(engine.playing && Number(b.dataset.play) === t)));
};
engine.onChange = render;
const fail = (e: unknown) => {
  document.querySelector('#now-state')!.textContent = '· audio unavailable in this browser';
  console.warn(e);
};
const toggle = () => (engine.playing ? engine.pause() : engine.play().catch(fail));
pp.addEventListener('click', toggle);
big.addEventListener('click', toggle);
muteBtn.addEventListener('click', () => engine.setMuted(!engine.muted));
document.querySelector<HTMLInputElement>('#vol')!.addEventListener('input', (e) => engine.setVolume(Number((e.target as HTMLInputElement).value) / 100));
const jump = (d: number) => {
  const i = (engine.track + d + TRACKS.length) % TRACKS.length;
  engine.switchTo(i);
  if (follow.checked) goTo(chapters[i]);
};
document.querySelector('#prev')!.addEventListener('click', () => jump(-1));
document.querySelector('#next')!.addEventListener('click', () => jump(1));
trackBtns.forEach((b) =>
  b.addEventListener('click', () => {
    const i = Number(b.dataset.play);
    if (engine.playing && engine.track === i) engine.pause();
    else if (engine.playing) engine.switchTo(i);
    else engine.play(i).catch(fail);
  }),
);
// the chapter in view becomes the current track; while playing (and following), audio crossfades to it
chapters.forEach((c, i) =>
  ScrollTrigger.create({
    trigger: c,
    start: 'top 50%',
    end: 'bottom 50%',
    onToggle: (self) => {
      if (!self.isActive || !follow.checked) return;
      engine.switchTo(i);
      if (!RM) gsap.fromTo(c.querySelector('.track__n'), { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: EASE.pop });
    },
  }),
);
render();

/* ---------- cover art ---------- */
document.querySelectorAll<HTMLElement>('.cover').forEach((el) => {
  const h = Number(el.closest('figure')!.style.getPropertyValue('--h'));
  document.fonts.ready.then(() => drawCover(el, h, Number(el.dataset.seed)));
});

gsap.ticker.add(updateHue);
window.addEventListener('scroll', () => RM && updateHue(), { passive: true });
window.addEventListener('load', measure);
refreshOnLoad();
measure();
updateHue();
root.classList.add('motion-ready');
