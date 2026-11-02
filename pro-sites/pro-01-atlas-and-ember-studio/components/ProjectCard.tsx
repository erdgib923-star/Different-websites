'use client';
import { useRef } from 'react';
import { gsap, prefersReduced } from '@/lib/motion';
import type { Project } from '@/lib/projects';
import Media from './Media';
import ProjectArt from './ProjectArt';
import TLink from './TLink';

/** Project card: hover / focus ramps an SVG displacement map on the art (the "heat haze"). */
export default function ProjectCard({ p, index, total }: { p: Project; index: number; total: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const haze = (on: boolean) => {
    if (prefersReduced()) return;
    const map = ref.current?.querySelector('[data-distort]');
    const art = ref.current?.querySelector('.media__art, .media__img');
    if (map) gsap.to(map, { attr: { scale: on ? 42 : 0 }, duration: on ? 0.9 : 0.6, ease: on ? 'power2.out' : 'power3.inOut', overwrite: true });
    if (art) gsap.to(art, { scale: on ? 1.06 : 1, duration: 0.9, ease: 'expo.out', overwrite: true });
  };
  return (
    <TLink
      ref={ref}
      href={`/work/${p.slug}/`}
      className="card group"
      data-cursor="View"
      onPointerEnter={() => haze(true)}
      onPointerLeave={() => haze(false)}
      onFocus={() => haze(true)}
      onBlur={() => haze(false)}
    >
      <Media slot={`work-${p.slug}`} ratio="4 / 5" alt={`${p.title} cover artwork`} dominant="var(--neutral-900)">
        <ProjectArt variant={p.art} seed={p.seed} id={`card-${p.slug}`} />
      </Media>
      <div className="card-meta mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="display text-3xl md:text-4xl">{p.title}</h3>
          <p className="mt-2 text-muted">{p.discipline}</p>
        </div>
        <p className="label shrink-0 pt-2 text-muted">
          {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')} · {p.year}
        </p>
      </div>
    </TLink>
  );
}
