import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';
import '@fontsource/jost/700.css';
import '@fontsource/jost/800.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap } from './lib/motion';
import { initFigures } from './lib/figure';
import { NS, drawPiece, study } from './shapes';
import { initMaker } from './maker';

/** Exhibition studies: each generated from its seed, the same on every load. */
function initStudies() {
  document.querySelectorAll<HTMLElement>('[data-study]').forEach((host) => {
    const fig = host.closest<HTMLElement>('.fig')!;
    const [aw, ah] = (getComputedStyle(fig).getPropertyValue('--ar') || '1 / 1').split('/').map((v) => parseFloat(v));
    const w = 600, h = Math.round((600 * ah) / aw);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('aria-hidden', 'true');
    const bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('width', String(w)); bg.setAttribute('height', String(h)); bg.setAttribute('class', 'asm-bg');
    svg.appendChild(bg);
    study(Number(host.dataset.study), w, h).forEach((p) => {
      const g = drawPiece(p);
      g.classList.add('shape');
      svg.appendChild(g);
    });
    host.appendChild(svg);
  });
}

/**
 * Hero: the composition assembles. Each shape starts scattered, small and spun, then flies and
 * rotates into place as the pinned hero scrubs; the Circle / Square / Triangle tags pop as their
 * shape lands. Pinned on wide screens, scrubbed unpinned on phones; static without JS or motion.
 */
function initAssembly() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 960px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { wide, motion } = ctx.conditions as { wide: boolean; motion: boolean };
    if (!motion) return;
    const q = gsap.utils.selector(hero);
    const shapes = [...hero.querySelectorAll<SVGGElement>('[data-shape]')];
    const tags = q('[data-tag]');
    // Start scattered but visible inside the board, so the hero never opens on a blank frame.
    const scatter = [[-90, 120, -160], [110, -90, 200], [-60, 30, -240], [-40, 170, 90], [140, -170, 270], [-310, -240, -120], [-200, 260, 180]];
    shapes.forEach((s, i) => {
      const [x, y, r] = scatter[i % scatter.length];
      gsap.set(s, { x, y, rotation: r, scale: 0.55, svgOrigin: '300 300' });
    });
    gsap.set(tags, { autoAlpha: 0, scale: 0.4 });
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: wide
        ? { trigger: hero, start: 'top top+=70', end: '+=130%', pin: true, scrub: 0.6 }
        : { trigger: q('.hero__art')[0], start: 'top 85%', end: 'bottom 45%', scrub: 0.6 },
    });
    shapes.forEach((s, i) => {
      tl.to(s, { x: 0, y: 0, rotation: 0, scale: 1, duration: 1 }, i * 0.32);
    });
    tags.forEach((t: Element) => {
      const i = Number((t as HTMLElement).dataset.tag);
      tl.to(t, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2.6)' }, i * 0.32 + 0.85);
    });
    tl.to({}, { duration: 0.3 });
  });
}

initStudies();
initAssembly();
initMaker();
initFigures();
bootMotion({ lenis: true });
