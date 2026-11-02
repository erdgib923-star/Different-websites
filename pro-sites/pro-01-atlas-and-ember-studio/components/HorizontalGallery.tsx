'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, pop, prefersReduced, EASE } from '@/lib/motion';
import { stage } from '@/lib/stage';
import { projects } from '@/lib/projects';
import ProjectCard from './ProjectCard';

/** Pinned, scrubbed horizontal gallery (≥768px). Phones and reduced motion get a vertical list. */
export default function HorizontalGallery() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const callout = useRef<HTMLParagraphElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (prefersReduced()) return;
    let ctx: gsap.Context | undefined;
    const off = stage.whenReady(() => {
      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        const cards = gsap.utils.toArray<HTMLElement>('.card', track.current);
        mm.add('(min-width: 768px)', () => {
          const distance = () => track.current!.scrollWidth - track.current!.parentElement!.clientWidth;
          let last = -1;
          const tween = gsap.to(track.current, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
              trigger: section.current,
              start: 'top top',
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.8,
              invalidateOnRefresh: true,
              onUpdate(self) {
                gsap.set(bar.current, { scaleX: self.progress });
                const i = Math.min(cards.length - 1, Math.round(self.progress * (cards.length - 1)));
                if (i !== last) {
                  last = i;
                  setActive(i);
                  // callout re-pops whenever the focused project changes
                  gsap.fromTo(callout.current, { autoAlpha: 0, y: 14, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: EASE.pop, overwrite: true });
                }
              },
            },
          });
          // cards already on screen when the pin starts pop with the section; the rest pop as they slide in
          let inView = 0;
          cards.forEach((card) => {
            const visible = card.offsetLeft < window.innerWidth;
            const st = visible ? { trigger: section.current, start: 'top 70%', once: true } : { trigger: card, containerAnimation: tween, start: 'left 92%', once: true };
            pop(card, { scrollTrigger: st, delay: visible ? inView++ * 0.08 : 0 });
          });
        });
        mm.add('(max-width: 767px)', () => {
          ScrollTrigger.batch(cards, { start: 'top 90%', once: true, onEnter: (b) => pop(b) });
        });
      }, section);
    });
    return () => {
      off();
      ctx?.revert();
    };
  }, []);

  const p = projects[active];
  return (
    <section ref={section} id="work" className="gallery overflow-hidden py-20 md:flex md:h-svh md:flex-col md:justify-center md:py-0" aria-labelledby="work-title">
      <div className="wrap mb-10 flex w-full flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <p className="label text-accent">Selected work · 2024–2026</p>
          <h2 id="work-title" className="display mt-4 text-[clamp(2.5rem,6vw,5.5rem)]" data-split="scroll">
            Five fires we started
          </h2>
        </div>
        <p ref={callout} className="label hidden rounded-full border border-border-strong px-4 py-2 text-muted md:block" aria-hidden="true">
          Now viewing <span className="text-accent">{String(active + 1).padStart(2, '0')}</span> — {p.discipline}
        </p>
      </div>
      <div className="wrap w-full">
        <div ref={track} className="gallery__track">
          {projects.map((proj, i) => (
            <ProjectCard key={proj.slug} p={proj} index={i} total={projects.length} />
          ))}
        </div>
      </div>
      <div className="wrap mt-10 hidden w-full md:block" aria-hidden="true">
        <div className="h-px w-full bg-border">
          <div ref={bar} className="h-px origin-left scale-x-0 bg-accent" />
        </div>
      </div>
    </section>
  );
}
