/**
 * Motion system. Tokens live here (for GSAP) and in styles/motion.css (for CSS).
 *
 * Three layers:
 *  1. Pop-ins `[data-pop]`: discrete, time-based entrances triggered once by
 *     IntersectionObserver. A pop is a small physical overshoot, which reads better on a clock
 *     than scrubbed against the scrollbar.
 *  2. Scrubbed effects `[data-scrub]`: parallax, clip wipes, progress. These use CSS
 *     scroll-driven animations (animation-timeline) when supported, with a GSAP
 *     ScrollTrigger fallback.
 *  3. Pinned sequences: site-specific GSAP ScrollTrigger timelines.
 *
 * Progressive enhancement: hidden start states only exist under `html.js`. Under
 * prefers-reduced-motion every element shows its final state and no scrubbing, pinning or
 * parallax is set up.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const MOTION = {
  duration: { quick: 0.4, base: 0.7, slow: 1.0, cinematic: 1.2 },
  ease: { expo: 'expo.out', power3: 'power3.out', inOut: 'power3.inOut' },
  stagger: 0.075,
  pop: { y: 24, scaleFrom: 0.9, overshoot: 1.02, blur: 8 },
} as const;

const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
export const prefersReduced = (): boolean => rm.matches;

/** `?nosda` in the URL forces the JS fallback path so it can be tested in Chromium. */
export const supportsSDA = (): boolean =>
  typeof CSS !== 'undefined' &&
  CSS.supports('animation-timeline: view()') &&
  !new URLSearchParams(location.search).has('nosda');

export { gsap, ScrollTrigger };

/** Index children of every [data-pop-group] so CSS can stagger them via --i. */
function indexGroups(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-pop-group]').forEach((g) => {
    g.querySelectorAll<HTMLElement>('[data-pop]').forEach((el, i) => {
      if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', String(i));
    });
  });
}

const reveal = (el: Element) => {
  el.classList.add('is-in');
  // Drop the fill-mode animation once done so hover/tilt transforms are not overridden.
  el.addEventListener('animationend', function done(e) {
    if (e.target !== el) return;
    el.classList.add('pop-done');
    el.removeEventListener('animationend', done as EventListener);
  } as EventListener);
};

/** Discrete pop-ins and split-text reveals, triggered once. */
export function initPopIns(root: ParentNode = document) {
  indexGroups(root);
  const targets = root.querySelectorAll<HTMLElement>('[data-pop], [data-split]');
  if (prefersReduced() || !('IntersectionObserver' in window)) {
    targets.forEach(reveal);
    return;
  }
  const pending = new Set<Element>(targets);
  const done = (el: Element) => { reveal(el); io.unobserve(el); pending.delete(el); };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        // Reveal on entry, or if the element is already above the viewport (anchor jumps).
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) done(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  targets.forEach((el) => io.observe(el));
  // IntersectionObserver only reports threshold changes. If the main thread is busy while an
  // element passes from below the viewport to above it, no callback fires; sweep those up.
  let raf = 0;
  const sweep = () => {
    raf = 0;
    for (const el of pending) if (el.getBoundingClientRect().bottom < 0) done(el);
    if (!pending.size) removeEventListener('scroll', onScroll);
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(sweep); };
  addEventListener('scroll', onScroll, { passive: true });
}

/**
 * Split an element's text into words (and optionally characters) for staggered reveals.
 * A visually hidden copy keeps the text intact for assistive tech.
 */
export function splitText(el: HTMLElement, mode: 'words' | 'chars' = 'words') {
  if (el.dataset.splitDone) return;
  const sr = document.createElement('span');
  sr.className = 'visually-hidden';
  sr.textContent = el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const vis = document.createElement('span');
  vis.setAttribute('aria-hidden', 'true');
  vis.className = 'split';
  let i = 0;
  const word = (text: string) => {
    const w = document.createElement('span');
    w.className = 'split-w';
    const pieces = mode === 'chars' ? [...text] : [text];
    for (const piece of pieces) {
      const c = document.createElement('span');
      c.className = 'split-i';
      c.style.setProperty('--i', String(i++));
      c.textContent = piece;
      w.appendChild(c);
    }
    return w;
  };
  // Walk child nodes so inline elements (<em>, <strong>, <br>) survive the split.
  const build = (from: Node, into: Node) => {
    from.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        (child.textContent ?? '').split(/(\s+)/).forEach((part, idx) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { into.appendChild(document.createTextNode(' ')); return; }
          const w = word(part);
          // Punctuation glued to a preceding inline element ("<em>stack</em>,") must not wrap apart.
          const prev = into.lastChild;
          if (idx === 0 && prev instanceof HTMLElement && !prev.classList.contains('split-w')) {
            const keep = document.createElement('span');
            keep.style.whiteSpace = 'nowrap';
            into.replaceChild(keep, prev);
            keep.append(prev, w);
          } else into.appendChild(w);
        });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const clone = (child as Element).cloneNode(false);
        build(child, clone);
        into.appendChild(clone);
      }
    });
  };
  build(el, vis);
  el.replaceChildren(sr, vis);
  el.dataset.splitDone = '1';
}

export function initSplits(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) =>
    splitText(el, el.dataset.split === 'chars' ? 'chars' : 'words'),
  );
}

/**
 * Scrubbed effects. With CSS scroll-driven animation support, styles/motion.css does the work
 * and this only sets custom properties. Otherwise GSAP ScrollTrigger replicates it.
 *   data-scrub="parallax" data-speed="-0.3"   (negative = moves up faster than scroll)
 *   data-scrub="clip"                          (clip-path wipe up as it enters)
 *   data-scrub="progress"                      (scaleX 0 -> 1 across the whole page)
 */
export function initScrubs(root: ParentNode = document) {
  const els = root.querySelectorAll<HTMLElement>('[data-scrub]');
  els.forEach((el) => el.style.setProperty('--speed', el.dataset.speed ?? '0.2'));
  if (prefersReduced() || supportsSDA()) return;
  els.forEach((el) => {
    const kind = el.dataset.scrub;
    const speed = parseFloat(el.dataset.speed ?? '0.2');
    if (kind === 'parallax') {
      gsap.fromTo(el, { y: speed * -160 }, {
        y: speed * 160, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    } else if (kind === 'clip') {
      gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, {
        clipPath: 'inset(0 0 0% 0)', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 45%', scrub: true },
      });
    } else if (kind === 'progress') {
      gsap.fromTo(el, { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: document.documentElement, start: 0, end: 'max', scrub: true },
      });
    }
  });
}

/** Count numbers up when they enter the viewport. `data-count-to="1280" data-decimals="0"`. */
export function initCounters(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-count-to]').forEach((el) => {
    const to = parseFloat(el.dataset.countTo ?? '0');
    const dec = parseInt(el.dataset.decimals ?? '0', 10);
    const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (prefersReduced()) { el.textContent = fmt(to); return; }
    const obj = { v: 0 };
    el.textContent = fmt(0);
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(obj, { v: to, duration: MOTION.duration.cinematic, ease: MOTION.ease.expo, onUpdate: () => { el.textContent = fmt(obj.v); } }),
    });
  });
}

/** Lenis smooth scroll driven by the GSAP ticker. Skipped under reduced motion. */
export async function initLenis() {
  if (prefersReduced()) return null;
  const [{ default: Lenis }] = await Promise.all([import('lenis'), import('lenis/dist/lenis.css')]);
  const lenis = new Lenis({ autoRaf: false, lerp: 0.11 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  // In-page anchors go through Lenis so they stay smooth and offset-correct.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!;
      const target = id.length > 1 ? document.querySelector<HTMLElement>(id) : null;
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -16 });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }),
  );
  return lenis;
}

/** Call once from main.ts after site-specific setup. */
export function bootMotion(opts: { lenis?: boolean } = {}) {
  const html = document.documentElement;
  html.classList.add('js');
  if (supportsSDA()) html.classList.add('sda');
  initSplits();
  initPopIns();
  initScrubs();
  initCounters();
  html.classList.add('motion-ready');
  if (opts.lenis) void initLenis();
  // Fonts change line lengths, so pinned sequences need a refresh once they are in.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
