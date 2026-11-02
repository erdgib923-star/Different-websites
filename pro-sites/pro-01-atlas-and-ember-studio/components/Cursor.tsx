'use client';
import { useEffect, useRef } from 'react';
import { gsap, prefersReduced } from '@/lib/motion';

/** Custom cursor (fine pointers only, off for reduced motion). Elements with data-cursor="Label" show a label. */
export default function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || prefersReduced()) return;
    const html = document.documentElement;
    const xr = gsap.quickTo(ring.current, 'x', { duration: 0.45, ease: 'power3' });
    const yr = gsap.quickTo(ring.current, 'y', { duration: 0.45, ease: 'power3' });
    const xd = gsap.quickTo(dot.current, 'x', { duration: 0.08, ease: 'none' });
    const yd = gsap.quickTo(dot.current, 'y', { duration: 0.08, ease: 'none' });
    let shown = false;

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (!shown) {
        shown = true;
        html.classList.add('has-cursor');
        gsap.set([ring.current, dot.current], { x: e.clientX, y: e.clientY });
      }
      xr(e.clientX); yr(e.clientY); xd(e.clientX); yd(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const t = (e.target as Element).closest<HTMLElement>('[data-cursor], a, button, input, [role="slider"]');
      const text = t?.dataset.cursor;
      if (label.current) label.current.textContent = text ?? '';
      gsap.to(ring.current, {
        scale: text ? 2.1 : t ? 1.45 : 1,
        backgroundColor: text ? 'var(--text)' : 'rgba(0,0,0,0)',
        borderColor: t ? 'var(--accent)' : 'var(--border-strong)',
        duration: 0.35,
        ease: 'power3.out',
      });
      gsap.to(label.current, { opacity: text ? 1 : 0, duration: 0.2 });
      gsap.to(dot.current, { scale: text ? 0 : 1, duration: 0.2 });
    };
    const leave = () => gsap.to([ring.current, dot.current], { opacity: 0, duration: 0.2 });
    const enter = () => gsap.to([ring.current, dot.current], { opacity: 1, duration: 0.2 });

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over);
    document.documentElement.addEventListener('pointerleave', leave);
    document.documentElement.addEventListener('pointerenter', enter);
    return () => {
      html.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.documentElement.removeEventListener('pointerenter', enter);
    };
  }, []);

  return (
    <div className="cursor" ref={root} aria-hidden="true">
      <div className="cursor__ring" ref={ring}>
        <span className="cursor__label" ref={label} />
      </div>
      <div className="cursor__dot" ref={dot} />
    </div>
  );
}
