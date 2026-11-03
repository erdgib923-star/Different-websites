import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/400-italic.css';
import '@fontsource/newsreader/600.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, prefersReduced } from './lib/motion';
import { paint } from './works';

const exhibits = [...document.querySelectorAll<HTMLElement>('[data-ex]')];

/** Paint a canvas once, and again only if its width changes noticeably. */
function keepPainted(c: HTMLCanvasElement, work: string, hue: string, seed: number) {
  paint(c, work, hue, seed);
  let w = c.clientWidth;
  new ResizeObserver(() => { if (Math.abs(c.clientWidth - w) > 60) { w = c.clientWidth; paint(c, work, hue, seed); } }).observe(c);
}

function initWorks() {
  exhibits.forEach((ex) => keepPainted(ex.querySelector('canvas')!, ex.dataset.work!, ex.dataset.hue!, +ex.dataset.seed!));
  const hero = document.querySelector<HTMLCanvasElement>('[data-hero-work]');
  if (hero) keepPainted(hero, 'flow', '--ex-6', 5);
  document.querySelectorAll<HTMLCanvasElement>('[data-mini]').forEach((c) => keepPainted(c, c.dataset.mini!, c.dataset.hue!, +c.dataset.seed!));
}

/**
 * The corridor: on wide screens with motion it pins and the wall slides past (horizontal scrub).
 * The wall takes on a faint tint of whichever exhibit is in front of you, and the counter
 * follows. A cursor spotlight lights the wall where you point (fine pointers only).
 * Phones and reduced motion: a native horizontal strip with scroll-snap.
 */
function initCorridor() {
  const sec = document.querySelector<HTMLElement>('[data-corridor]');
  const track = sec?.querySelector<HTMLElement>('[data-track]');
  if (!sec || !track) return;
  const pin = sec.querySelector<HTMLElement>('.corridor__pin')!;
  const viewport = track.parentElement!;
  const cur = sec.querySelector<HTMLElement>('[data-cur]')!;
  let active = -1;
  const setActive = (i: number) => {
    if (i === active) return;
    active = i;
    cur.textContent = String(i + 1);
    sec.style.setProperty('--tint', `var(--ex-${i + 1})`);
    exhibits.forEach((e, k) => e.classList.toggle('is-front', k === i));
  };
  // Which exhibit's centre is nearest the viewport centre.
  const nearest = () => {
    const mid = innerWidth / 2;
    let best = 0, d = Infinity;
    exhibits.forEach((e, i) => { const r = e.getBoundingClientRect(); const dd = Math.abs(r.left + r.width / 2 - mid); if (dd < d) { d = dd; best = i; } });
    return best;
  };
  setActive(0);
  viewport.addEventListener('scroll', () => setActive(nearest()), { passive: true });

  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    sec.classList.add('is-pinned');
    const dist = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin, start: 'top top+=64', end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true,
        onUpdate: () => setActive(nearest()),
      },
    });
    return () => { sec.classList.remove('is-pinned'); gsap.set(track, { clearProps: 'transform' }); };
  });

  mm.add('(pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const move = (e: PointerEvent) => {
      const r = pin.getBoundingClientRect();
      pin.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`);
      pin.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`);
      pin.classList.add('has-spot');
    };
    const leave = () => pin.classList.remove('has-spot');
    pin.addEventListener('pointermove', move);
    pin.addEventListener('pointerleave', leave);
    return () => { pin.removeEventListener('pointermove', move); pin.removeEventListener('pointerleave', leave); leave(); };
  });
}

/** Detail view: a modal <dialog> with the work drawn large from the same seed. */
function initDetail() {
  const dlg = document.querySelector<HTMLDialogElement>('[data-detail]');
  if (!dlg) return;
  const canvas = dlg.querySelector<HTMLCanvasElement>('[data-detail-canvas]')!;
  const q = (s: string) => dlg.querySelector<HTMLElement>(s)!;
  let idx = 0;
  const show = (i: number) => {
    idx = (i + exhibits.length) % exhibits.length;
    const ex = exhibits[idx];
    const txt = (s: string) => ex.querySelector(s)?.textContent ?? '';
    dlg.style.setProperty('--ex', `var(${ex.dataset.hue})`);
    dlg.style.setProperty('--ar', getComputedStyle(ex).getPropertyValue('--ar'));
    dlg.style.setProperty('--arn', getComputedStyle(ex).getPropertyValue('--arn'));
    q('[data-d-no]').textContent = `No. ${idx + 1}`;
    q('[data-d-title]').textContent = txt('.label__title');
    q('[data-d-artist]').textContent = txt('.label__artist');
    q('[data-d-meta]').textContent = txt('.label__meta');
    q('[data-d-rule]').textContent = txt('.label__rule');
    requestAnimationFrame(() => paint(canvas, ex.dataset.work!, ex.dataset.hue!, +ex.dataset.seed!));
    dlg.classList.remove('is-swapping'); void dlg.offsetWidth; dlg.classList.add('is-swapping');
  };
  document.querySelectorAll<HTMLButtonElement>('[data-open]').forEach((b) =>
    b.addEventListener('click', () => { if (!dlg.open) dlg.showModal(); show(+b.dataset.open!); }),
  );
  q('[data-prev]').addEventListener('click', () => show(idx - 1));
  q('[data-next]').addEventListener('click', () => show(idx + 1));
  q('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
  });
}

initWorks();
initCorridor();
initDetail();
bootMotion({ lenis: !prefersReduced() });
