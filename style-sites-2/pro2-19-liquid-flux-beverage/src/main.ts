import '@fontsource/unbounded/500.css';
import '@fontsource/unbounded/700.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/800.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, prefersReduced } from './lib/motion';
import { createLoop } from './lib/loop';
import { createBlobs, type Blobs } from './blobs';

const root = document.documentElement;

/** Resolve a CSS colour (token name) to linear-ish 0..1 sRGB for the shader. */
const rgb01 = (cssVar: string): number[] => {
  const g = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = getComputedStyle(root).getPropertyValue(cssVar).trim() || '#ccc';
  g.fillRect(0, 0, 1, 1);
  const d = g.getImageData(0, 0, 1, 1).data;
  return [d[0] / 255, d[1] / 255, d[2] / 255];
};

let blobs: Blobs | null = null;
const shaderColours = { a: rgb01('--f1a'), b: rgb01('--f1b') };

/**
 * Hero metaballs. The loop runs only while the hero is on screen and the tab is visible. The
 * cursor ball eases toward the pointer (fine pointers only). Reduced motion: one still frame,
 * no cursor ball. No WebGL: the SVG goo-filter blobs stay.
 */
function initHero() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-blobs]');
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!canvas || !hero) return;
  const b = createBlobs(canvas);
  if (!b.ok) return;
  blobs = b;
  root.classList.add('webgl');
  b.set({ bg: rgb01('--cream'), a: shaderColours.a, b: shaderColours.b });
  const reduced = prefersReduced();
  const target = { x: 0.72, y: 0.45, on: 0 };
  const cur = { x: 0.72, y: 0.45, on: 0 };
  if (!reduced && matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width; target.y = 1 - (e.clientY - r.top) / r.height; target.on = 1;
    });
    hero.addEventListener('pointerleave', () => { target.on = 0; });
  }
  const loop = createLoop(hero, (t, dt) => {
    const k = Math.min(1, dt * 5);
    cur.x += (target.x - cur.x) * k; cur.y += (target.y - cur.y) * k; cur.on += (target.on - cur.on) * k;
    const scroll = reduced ? 0 : Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight));
    b.set({ mouse: [cur.x, cur.y], mouseOn: cur.on, scroll, a: shaderColours.a, b: shaderColours.b });
    b.draw(reduced ? 6 : t);
  }, 6);
  window.addEventListener('resize', () => loop.redraw());
  (window as unknown as { __loops?: unknown }).__loops = { hero: () => loop.running };
}

/**
 * Flavour selector: a native radio group. The choice sets --fa/--fb on the root; they are
 * registered colour properties, so every gradient on the page (cans, blobs fallback, buttons)
 * transitions to the new pair. The shader's colours tween over the same 0.9 s.
 */
function initFlavours() {
  const radios = [...document.querySelectorAll<HTMLInputElement>('input[name="flavour"]')];
  const name = document.querySelector<HTMLElement>('[data-now-name]')!;
  const fruit = document.querySelector<HTMLElement>('[data-now-fruit]')!;
  const desc = document.querySelector<HTMLElement>('[data-now-desc]')!;
  const canName = document.querySelector<SVGTextElement>('.can--big .can__name');
  const apply = (r: HTMLInputElement) => {
    const n = r.dataset.flavour!;
    root.style.setProperty('--fa', `var(--f${n}a)`);
    root.style.setProperty('--fb', `var(--f${n}b)`);
    name.textContent = r.dataset.name!;
    fruit.textContent = r.dataset.fruit!;
    desc.textContent = r.dataset.desc!;
    if (canName) canName.textContent = r.dataset.name!;
    const from = { a: [...shaderColours.a], b: [...shaderColours.b] };
    const to = { a: rgb01(`--f${n}a`), b: rgb01(`--f${n}b`) };
    const mix = { p: 0 };
    gsap.to(mix, {
      p: 1, duration: prefersReduced() ? 0 : 0.9, ease: 'power2.inOut',
      onUpdate: () => {
        shaderColours.a = from.a.map((v, i) => v + (to.a[i] - v) * mix.p);
        shaderColours.b = from.b.map((v, i) => v + (to.b[i] - v) * mix.p);
      },
      onComplete: () => { if (prefersReduced() && blobs) { blobs.set({ a: to.a, b: to.b }); blobs.draw(6); } },
    });
  };
  radios.forEach((r) => r.addEventListener('change', () => r.checked && apply(r)));
}

/**
 * Pour: pinned on wide screens (scrubbed, unpinned on phones). The glass fills with the current
 * flavour and each step pops at its own point: 18%, 50%, 80%. Reduced motion: a full glass and
 * all steps shown.
 */
function initPour() {
  const sec = document.querySelector<HTMLElement>('[data-pour]');
  if (!sec) return;
  const liquid = sec.querySelector<SVGRectElement>('.liquid')!;
  const steps = [...sec.querySelectorAll<HTMLElement>('[data-at]')];
  gsap.matchMedia().add({ wide: '(min-width: 900px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { wide, motion } = ctx.conditions as { wide: boolean; motion: boolean };
    if (!motion) return;
    sec.classList.add('is-driven');
    const apply = (p: number) => {
      liquid.style.transform = `translateY(${((1 - p) * 245).toFixed(1)}px)`;
      steps.forEach((s) => s.classList.toggle('is-on', p >= parseFloat(s.dataset.at!)));
    };
    apply(0);
    gsap.timeline({
      scrollTrigger: {
        ...(wide ? { trigger: sec.querySelector('.pour__inner'), start: 'top top+=72', end: '+=180%', pin: true } : { trigger: sec.querySelector('.pour__glass'), start: 'top 85%', end: 'bottom 30%' }),
        scrub: 0.5,
        onUpdate: (st) => apply(st.progress),
      },
    });
    return () => { sec.classList.remove('is-driven'); liquid.style.transform = ''; };
  });
}

initHero();
initFlavours();
initPour();
bootMotion({ lenis: !prefersReduced() });
