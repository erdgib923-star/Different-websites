'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, prefersReduced } from '@/lib/motion';

const services = ['Brand identity', 'Art direction', 'Motion systems', 'Spatial & exhibition', 'Digital products', 'Packaging', 'Type direction', 'Launch films'];

/** Infinite services marquee. Scroll velocity speeds it up / reverses it; pauses offscreen; has a pause button (WCAG 2.2.2). */
export default function Marquee() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (prefersReduced()) return;
    const ctx = gsap.context(() => {
      const t = gsap.to(track.current, { xPercent: -50, repeat: -1, ease: 'none', duration: 30 });
      tween.current = t;
      let dir = 1;
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => (self.isActive && !pausedRef.current ? t.play() : t.pause()),
        onUpdate(self) {
          if (pausedRef.current) return;
          dir = self.direction;
          const boost = Math.min(Math.abs(self.getVelocity()) / 350, 5);
          gsap.to(t, { timeScale: dir * (1 + boost), duration: 0.2, overwrite: true });
          gsap.to(t, { timeScale: dir, duration: 1.2, delay: 0.25, ease: 'power2.out' });
        },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const toggle = () => {
    const next = !paused;
    pausedRef.current = next;
    setPaused(next);
    if (next) tween.current?.pause();
    else tween.current?.play();
  };

  const group = (hidden: boolean) => (
    <ul className="marquee__group" aria-hidden={hidden || undefined}>
      {services.map((s) => (
        <li key={s} className="display flex items-center gap-10 text-[clamp(2.5rem,7vw,6.5rem)]">
          {s}
          <svg width="0.5em" height="0.5em" viewBox="0 0 10 10" aria-hidden="true" className="text-accent">
            <path d="M5 0 L6.2 3.8 L10 5 L6.2 6.2 L5 10 L3.8 6.2 L0 5 L3.8 3.8 Z" fill="currentColor" />
          </svg>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="relative py-6" aria-label="Services">
      <div ref={root} className="marquee py-6">
        <div ref={track} className="marquee__track">
          {group(false)}
          {group(true)}
        </div>
      </div>
      <div className="wrap mt-3 flex justify-end">
        <button type="button" onClick={toggle} className="label inline-flex min-h-11 items-center gap-2 text-muted hover:text-text motion-reduce:hidden" aria-pressed={paused}>
          {paused ? '▶ Play marquee' : '❚❚ Pause marquee'}
        </button>
      </div>
    </section>
  );
}
