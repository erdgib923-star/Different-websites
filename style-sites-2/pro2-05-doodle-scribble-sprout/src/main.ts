import '@fontsource/caveat/700.css';
import '@fontsource/patrick-hand/400.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, prefersReduced, supportsSDA } from './lib/motion';
import { initFigures } from './lib/figure';
import { initPlayground } from './playground';

/**
 * "How a class goes": the drawing builds stage by stage as you scroll (stroke-dashoffset on
 * pathLength="1" strokes). Pinned on wide screens with one step caption at a time; on phones the
 * same drawing scrubs unpinned beside the full list. Stickers pop at fixed timeline points.
 */
function initJourney() {
  const sec = document.querySelector<HTMLElement>('.journey');
  if (!sec) return;
  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 880px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { wide, motion } = ctx.conditions as { wide: boolean; motion: boolean };
    if (!motion) return;
    const q = gsap.utils.selector(sec);
    const stages = [1, 2, 3, 4].map((n) => q(`.s${n} path`));
    const steps = q('.step');
    const stickers = q('[data-sticker]');
    gsap.set(stages.flat(), { strokeDasharray: 1, strokeDashoffset: 1, fillOpacity: 0 });
    gsap.set(stickers, { autoAlpha: 0, scale: 0.3, rotation: -20 });
    if (wide) {
      sec.classList.add('is-pinned');
      gsap.set(steps.slice(1), { autoAlpha: 0, y: 24 });
    }
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: wide
        ? { trigger: q('[data-journey]')[0], start: 'top top+=90', end: '+=260%', pin: true, scrub: 0.6 }
        : { trigger: q('.journey__art')[0], start: 'top 80%', end: 'bottom 20%', scrub: 0.6 },
    });
    stages.forEach((paths, i) => {
      tl.to(paths, { strokeDashoffset: 0, duration: 0.8, stagger: 0.15 }, i)
        .to(paths, { fillOpacity: 1, duration: 0.3 }, i + 0.6);
      if (wide && i > 0) {
        tl.to(steps[i - 1], { autoAlpha: 0, y: -24, duration: 0.3 }, i - 0.05)
          .to(steps[i], { autoAlpha: 1, y: 0, duration: 0.3 }, i + 0.15);
      }
    });
    tl.to(stickers[0], { autoAlpha: 1, scale: 1, rotation: 8, duration: 0.25, ease: 'back.out(2.5)' }, 2.9)
      .to(stickers[1], { autoAlpha: 1, scale: 1, rotation: -7, duration: 0.25, ease: 'back.out(2.5)' }, 3.6)
      .to({}, { duration: 0.4 });
    return () => sec.classList.remove('is-pinned');
  });
}

/** JS fallback for `.draw-view` strokes when CSS scroll-driven animations are unavailable. */
function initDrawFallback() {
  if (prefersReduced() || supportsSDA()) return;
  document.querySelectorAll<SVGSVGElement>('.draw-view').forEach((svg) => {
    gsap.fromTo(svg.querySelectorAll('path'), { strokeDasharray: 1, strokeDashoffset: 1 }, {
      strokeDashoffset: 0, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: svg, start: 'top 92%', end: 'top 55%', scrub: true },
    });
  });
}

function initSignup() {
  const form = document.querySelector<HTMLFormElement>('[data-signup]');
  const msg = document.querySelector<HTMLElement>('[data-signup-msg]');
  if (!form || !msg) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const klass = new FormData(form).get('klass');
    msg.textContent = `Spot saved (pretend!) for ${klass}. In a real studio, a welcome note would go to your inbox.`;
  });
}

initJourney();
initDrawFallback();
initPlayground();
initSignup();
initFigures();
bootMotion({ lenis: true });
