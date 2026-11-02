'use client';
import { useEffect, useRef } from 'react';
import { gsap, prefersReduced, EASE } from '@/lib/motion';
import { stage } from '@/lib/stage';

/** First-load preloader: a 000→100 counter that only completes once web fonts are ready. */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReduced() || getComputedStyle(el).display === 'none') {
      stage.release();
      return;
    }
    const n = { v: 0 };
    const render = () => {
      if (count.current) count.current.textContent = String(Math.round(n.v)).padStart(3, '0');
      if (bar.current) bar.current.style.transform = `scaleX(${n.v / 100})`;
    };
    let done = false;
    const tl = gsap.timeline({ onUpdate: render });
    tl.to(n, { v: 72, duration: 1.1, ease: 'power2.out', onUpdate: render });
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const timeout = new Promise((r) => setTimeout(r, 2500)); // never block on slow fonts
    Promise.race([Promise.all([fonts, new Promise((r) => tl.eventCallback('onComplete', r))]), timeout]).then(() => {
      if (done) return;
      done = true;
      gsap
        .timeline()
        .to(n, { v: 100, duration: 0.5, ease: 'power2.inOut', onUpdate: render })
        .add(() => stage.release(), '+=0.05')
        .to(count.current, { yPercent: -110, duration: 0.6, ease: EASE.inOut }, '<')
        .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut' }, '<0.1')
        .set(el, { display: 'none' });
    });
    return () => {
      done = true;
      tl.kill();
      stage.release();
    };
  }, []);

  return (
    <div className="preloader" ref={root} aria-hidden="true">
      <div style={{ overflow: 'hidden' }}>
        <span className="preloader__count" ref={count}>
          000
        </span>
      </div>
      <p className="label text-muted" style={{ position: 'absolute', top: 'var(--gutter)', left: 'var(--gutter)' }}>
        Atlas &amp; Ember — warming up
      </p>
      <div className="preloader__bar" ref={bar} />
    </div>
  );
}
