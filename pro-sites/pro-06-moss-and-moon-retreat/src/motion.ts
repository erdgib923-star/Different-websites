import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Motion tokens: every animation on the site reads from these. */
export const DUR = { xs: 0.4, sm: 0.6, md: 0.8, lg: 1.2 } as const;
export const EASE = { out: 'expo.out', soft: 'power3.out', inOut: 'power3.inOut', pop: 'back.out(2.6)' } as const;
export const STAGGER = 0.075;

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type PopOptions = { stagger?: number; delay?: number; scrollTrigger?: ScrollTrigger.Vars; blur?: boolean };
/** "pop": scale 0.9 → ~1.02 → 1 (back.out(2.6) overshoot), y 24 → 0, opacity 0 → 1, blur 8px → 0. */
export function pop(targets: gsap.TweenTarget, opts: PopOptions = {}) {
  const { stagger = STAGGER, delay = 0, scrollTrigger, blur = true } = opts;
  const tl = gsap.timeline({ scrollTrigger, delay });
  tl.fromTo(
    targets,
    { autoAlpha: 0, y: 24, filter: blur ? 'blur(8px)' : 'none' },
    { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: DUR.md, ease: EASE.out, stagger, clearProps: 'filter' },
    0,
  ).fromTo(targets, { scale: 0.9 }, { scale: 1, duration: DUR.md, ease: EASE.pop, stagger }, 0);
  return tl;
}

const CLIP_FROM: Record<string, string> = {
  up: 'inset(100% 0% 0% 0%)',
  down: 'inset(0% 0% 100% 0%)',
  left: 'inset(0% 100% 0% 0%)',
  right: 'inset(0% 0% 0% 100%)',
  center: 'inset(50% 50% 50% 50%)',
};

/**
 * Declarative reveals inside `root`:
 *  data-split="intro|scroll"  masked line / word rise
 *  data-clip="up|down|left|right|center"  clip-path media reveal
 *  data-pop                   batched pop-ins
 *  data-fade                  rise + fade
 *  data-speed="0.3"           parallax
 */
export function initReveals(root: ParentNode = document) {
  if (reduced()) return;
  const q = <T extends HTMLElement = HTMLElement>(s: string) => Array.from(root.querySelectorAll<T>(s));

  q('[data-split]').forEach((el) => {
    const intro = el.dataset.split === 'intro';
    // headings get an aria-label from SplitText; other elements (e.g. <p>) must not, so their
    // split words stay readable as plain text
    const heading = /^H[1-6]$/.test(el.tagName);
    SplitText.create(el, {
      type: 'lines,words',
      mask: 'lines',
      autoSplit: true,
      aria: heading ? 'auto' : 'none',
      onSplit(self) {
        gsap.set(el, { visibility: 'visible' });
        return gsap.from(self.words, {
          yPercent: 115,
          duration: DUR.lg,
          ease: EASE.out,
          stagger: 0.05,
          delay: intro ? 0.2 : 0,
          scrollTrigger: intro ? undefined : { trigger: el, start: 'top 88%', once: true },
        });
      },
    });
  });

  q('[data-clip]').forEach((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    tl.fromTo(el, { clipPath: CLIP_FROM[el.dataset.clip!] ?? CLIP_FROM.up }, { clipPath: 'inset(0% 0% 0% 0%)', duration: DUR.lg, ease: 'expo.inOut' });
    const art = el.querySelector('.media__art, .media__img');
    if (art) tl.fromTo(art, { scale: 1.2 }, { scale: 1, duration: DUR.lg * 1.4, ease: EASE.out }, 0);
  });

  ScrollTrigger.batch(q('[data-pop]'), { start: 'top 90%', once: true, onEnter: (b) => pop(b) });

  q('[data-fade]').forEach((el) =>
    gsap.fromTo(el, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: DUR.md, ease: EASE.soft, scrollTrigger: { trigger: el, start: 'top 92%', once: true } }),
  );

  q('[data-speed]').forEach((el) => {
    const s = parseFloat(el.dataset.speed!);
    gsap.fromTo(el, { yPercent: -s * 50 }, { yPercent: s * 50, ease: 'none', scrollTrigger: { trigger: el.closest('section') ?? el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/** ScrollTrigger.refresh after web fonts and images have loaded (layout can shift). */
export function refreshOnLoad() {
  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh);
  if (document.readyState === 'complete') refresh();
  else window.addEventListener('load', refresh, { once: true });
}

export { gsap, ScrollTrigger, SplitText };
