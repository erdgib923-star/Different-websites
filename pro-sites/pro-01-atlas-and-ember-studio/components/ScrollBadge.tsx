'use client';
import { useEffect, useRef } from 'react';
import { gsap, prefersReduced, EASE } from '@/lib/motion';
import { stage } from '@/lib/stage';

/** Circular text badge: pops in once the visitor has scrolled ~12% of the viewport, then rotates with scroll (never on its own). */
export default function ScrollBadge({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReduced()) return;
    let ctx: gsap.Context | undefined;
    const off = stage.whenReady(() => {
      ctx = gsap.context(() => {
        gsap.set(ref.current, { autoAlpha: 0, scale: 0.6, rotate: -30 });
        gsap.to(ref.current, {
          autoAlpha: 1, scale: 1, rotate: 0, duration: 0.9, ease: EASE.pop,
          scrollTrigger: { start: () => window.innerHeight * 0.12, toggleActions: 'play none none reverse' },
        });
        gsap.to(ref.current!.querySelector('svg'), {
          rotate: 360, ease: 'none',
          scrollTrigger: { start: 0, end: 'max', scrub: 0.6 },
        });
      });
    });
    return () => { off(); ctx?.revert(); };
  }, []);
  const id = 'badge-path';
  return (
    <div ref={ref} className="pointer-events-none relative size-28 md:size-36" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
        <defs>
          <path id={id} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <circle cx="50" cy="50" r="49" fill="var(--accent)" />
        <text fontSize="9.6" letterSpacing="2.6" fill="var(--accent-contrast)" style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
          <textPath href={`#${id}`}>{text}</textPath>
        </text>
      </svg>
      <span className="absolute inset-0 grid place-items-center text-3xl text-accent-contrast">✺</span>
    </div>
  );
}
