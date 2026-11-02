import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap } from './lib/motion';
import { initFigures } from './lib/figure';
import { initLab } from './lab';

/**
 * Hero: the three ink passes start out of register and slide into place as you scroll. Each
 * pass label pops when its ink lands; the "In register" stamp pops last. Pinned on wide
 * screens, scrubbed unpinned on phones. Without JS or with reduced motion the poster rests with
 * a 2px house miss and the labels read as a static legend.
 */
function initRegistration() {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return;
  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 900px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { wide, motion } = ctx.conditions as { wide: boolean; motion: boolean };
    if (!motion) return;
    const q = gsap.utils.selector(hero);
    const start = {
      y: { x: 18, y: -24, rotation: -2.4 },
      p: { x: -38, y: 20, rotation: 2.8 },
      b: { x: 28, y: 34, rotation: -1.6 },
    } as const;
    (['y', 'p', 'b'] as const).forEach((k) => gsap.set(q(`[data-ink="${k}"]`), { ...start[k], svgOrigin: '300 400' }));
    gsap.set(q('.pass'), { autoAlpha: 0, x: -24 });
    gsap.set(q('[data-stamp]'), { autoAlpha: 0, scale: 1.8 });

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: wide
        ? { trigger: hero, start: 'top top+=64', end: '+=150%', pin: true, scrub: 0.6 }
        : { trigger: q('.hero__fig')[0], start: 'top 80%', end: 'bottom 35%', scrub: 0.6 },
    });
    (['y', 'p', 'b'] as const).forEach((k, i) => {
      tl.to(q(`[data-ink="${k}"]`), { x: 0, y: 0, rotation: 0, duration: 1 }, i)
        .to(q(`[data-pass="${k}"]`), { autoAlpha: 1, x: 0, duration: 0.35, ease: 'back.out(2)' }, i + 0.65);
    });
    tl.to(q('[data-stamp]'), { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.4)' }, 3.1).to({}, { duration: 0.4 });
  });
}

initRegistration();
initFigures();
initLab();
bootMotion({ lenis: true });
