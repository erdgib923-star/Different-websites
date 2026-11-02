'use client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger, SplitText);

/** Motion tokens — every animation on the site reads from these. */
export const DUR = { xs: 0.4, sm: 0.6, md: 0.8, lg: 1.2 } as const;
export const EASE = { out: 'expo.out', soft: 'power3.out', inOut: 'power3.inOut', pop: 'back.out(2.6)' } as const;
export const STAGGER = 0.075; // 75ms

export const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The "pop" preset: scale 0.9 → ~1.02 → 1 (back.out(2.6) overshoots ≈ 20% of the 0.1 travel),
 * translateY 24px → 0, opacity 0 → 1, blur 8px → 0.
 */
type PopOptions = { stagger?: number; delay?: number; scrollTrigger?: ScrollTrigger.Vars; blur?: boolean };
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

export { gsap, ScrollTrigger, SplitText };
