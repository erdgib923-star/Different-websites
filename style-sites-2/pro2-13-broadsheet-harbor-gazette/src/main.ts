import '@fontsource/old-standard-tt/400.css';
import '@fontsource/old-standard-tt/400-italic.css';
import '@fontsource/old-standard-tt/700.css';
import '@fontsource/libre-franklin/400.css';
import '@fontsource/libre-franklin/600.css';
import '@fontsource/libre-franklin/800.css';
import '@fontsource/libre-franklin/900.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, prefersReduced } from './lib/motion';
import { initFigures } from './lib/figure';
import { halftone } from './halftone';

const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

function initHalftones() {
  const ink = css('--ink') || '#2b2924';
  document.querySelectorAll<HTMLElement>('[data-halftone]').forEach((el) => {
    const r = el.getBoundingClientRect();
    const w = 480, h = Math.round(480 * (r.height / Math.max(1, r.width)) || 270);
    el.innerHTML = halftone(el.dataset.halftone!, w, h, 6, ink);
  });
}

function initEdition() {
  const el = document.querySelector('[data-edition]');
  if (el) el.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/** Ticker: the list is cloned once (aria-hidden) for a seamless loop; pausable (WCAG 2.2.2). */
function initTicker() {
  const ticker = document.querySelector<HTMLElement>('[data-ticker]');
  const track = ticker?.querySelector<HTMLElement>('[data-track]');
  const btn = ticker?.querySelector<HTMLButtonElement>('[data-ticker-toggle]');
  if (!ticker || !track || !btn) return;
  if (!prefersReduced()) {
    [...track.children].forEach((li) => { const c = li.cloneNode(true) as HTMLElement; c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
  }
  btn.addEventListener('click', () => {
    const paused = ticker.classList.toggle('is-paused');
    btn.setAttribute('aria-pressed', String(paused));
    btn.textContent = paused ? 'Play ticker' : 'Pause ticker';
  });
}

/** Tide chart: a smooth curve through today's sample tide times, with a red "now" dot. */
function initTides() {
  const svg = document.querySelector<SVGSVGElement>('[data-tide]');
  if (!svg) return;
  const W = 480, H = 160, top = 14, bottom = 130, maxH = 4.5;
  const points: [number, number][] = [[0, 2.6], [4.2, 4.1], [10.4, 0.6], [16.6, 4.3], [22.85, 0.8], [24, 1.3]];
  const x = (hr: number) => 30 + (hr / 24) * (W - 40);
  const y = (m: number) => bottom - (m / maxH) * (bottom - top);
  // Cosine interpolation between turning points: tides are roughly sinusoidal between extremes.
  const height = (hr: number) => {
    const i = Math.max(0, points.findIndex((p, k) => k < points.length - 1 && hr >= p[0] && hr <= points[k + 1][0]));
    const [h0, m0] = points[i], [h1, m1] = points[i + 1];
    const f = (1 - Math.cos(((hr - h0) / (h1 - h0)) * Math.PI)) / 2;
    return m0 + (m1 - m0) * f;
  };
  let d = '';
  for (let hr = 0; hr <= 24; hr += 0.25) d += `${hr ? 'L' : 'M'}${x(hr).toFixed(1)} ${y(height(hr)).toFixed(1)}`;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag: string, attrs: Record<string, string>, text?: string) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (text) n.textContent = text; svg.appendChild(n); return n; };
  el('path', { d: `${d}L${x(24)} ${bottom}L${x(0)} ${bottom}Z`, class: 'tide-area' });
  [0, 1, 2, 3, 4].forEach((m) => { el('line', { x1: '30', x2: String(W - 10), y1: String(y(m)), y2: String(y(m)), class: 'tide-axis' }); el('text', { x: '4', y: String(y(m) + 4), class: 'tide-label' }, `${m}m`); });
  ['00', '06', '12', '18', '24'].forEach((t, i) => el('text', { x: String(x(i * 6) - 7), y: String(H - 10), class: 'tide-label' }, t));
  el('path', { d, class: 'tide-line' });
  const now = new Date(), hr = now.getHours() + now.getMinutes() / 60;
  el('circle', { cx: x(hr).toFixed(1), cy: y(height(hr)).toFixed(1), r: '6', class: 'tide-now' });
  el('text', { x: (x(hr) + 9).toFixed(1), y: (y(height(hr)) - 8).toFixed(1), class: 'tide-now-label' }, 'Now');
}

/**
 * Stop the presses (pinned on wide screens): the headline typesets letter by letter, the photo
 * plate resolves from coarse dots to fine in discrete screen steps, the press steps light up in
 * turn, and the red EXTRA stamp pops at the end. Static: finished headline, fine plate, stamp.
 */
function initExtra() {
  const sec = document.querySelector<HTMLElement>('.extra');
  const plate = sec?.querySelector<HTMLElement>('[data-plate]');
  const type = sec?.querySelector<HTMLElement>('[data-typeset]');
  if (!sec || !plate || !type) return;
  const ink = css('--ink') || '#2b2924';
  const pitches = [26, 18, 13, 10, 7];
  const plates = pitches.map((p) => halftone('lighthouse', 480, 300, p, ink));
  plate.innerHTML = plates[plates.length - 1];
  const text = type.textContent ?? '';
  type.replaceChildren(...[...text].map((ch) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch === ' ' ? ' ' : ch; return s; }));
  const chars = [...type.querySelectorAll<HTMLElement>('.ch')];
  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 900px)', motion: '(prefers-reduced-motion: no-preference)' }, (c) => {
    const { wide, motion } = c.conditions as { wide: boolean; motion: boolean };
    if (!motion) return;
    if (wide) sec.classList.add('is-pinned');
    const q = gsap.utils.selector(sec);
    const steps = q('.press-step');
    gsap.set(chars, { autoAlpha: 0, y: -18 });
    gsap.set(steps, { autoAlpha: 0.25 });
    gsap.set(q('[data-stamp]'), { autoAlpha: 0, scale: 2.4, rotation: -8 });
    let shown = -1;
    const setPlate = (i: number) => { if (i !== shown) { shown = i; plate.innerHTML = plates[i]; } };
    setPlate(0);
    const state = { p: 0 };
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: wide
        ? { trigger: q('[data-extra]')[0], start: 'top top+=70', end: '+=220%', pin: true, scrub: 0.5 }
        : { trigger: sec, start: 'top 70%', end: 'bottom 40%', scrub: 0.5 },
    });
    tl.to(steps[0], { autoAlpha: 1, duration: 0.2 }, 0)
      .to(steps[1], { autoAlpha: 1, duration: 0.2 }, 0.6)
      .to(chars, { autoAlpha: 1, y: 0, duration: 0.12, stagger: 1.2 / chars.length, ease: 'power3.out' }, 0.6)
      .to(steps[2], { autoAlpha: 1, duration: 0.2 }, 1.9)
      .to(state, { p: pitches.length - 1, duration: 1, onUpdate: () => setPlate(Math.round(state.p)) }, 1.9)
      .to(q('[data-stamp]'), { autoAlpha: 1, scale: 1, rotation: 6, duration: 0.25, ease: 'back.out(2)' }, 3)
      .to({}, { duration: 0.3 });
    return () => { sec.classList.remove('is-pinned'); setPlate(plates.length - 1); };
  });
}

initEdition();
initTicker();
initHalftones();
initTides();
initExtra();
initFigures();
bootMotion({ lenis: true });
