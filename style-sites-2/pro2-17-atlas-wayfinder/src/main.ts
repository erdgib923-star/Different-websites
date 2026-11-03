import '@fontsource/cormorant/500.css';
import '@fontsource/cormorant/600.css';
import '@fontsource/cormorant/500-italic.css';
import '@fontsource/lora/400.css';
import '@fontsource/lora/400-italic.css';
import '@fontsource/lora/600.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, prefersReduced, supportsSDA } from './lib/motion';
import { initFigures } from './lib/figure';
import { createVoyage } from './voyage';
import { drawWash } from './wash';

/**
 * The voyage: pinned at every width (the chart sits at the top of its section, so the pin never
 * starts below the fold). Scroll draws the route, the camera follows the boat, each anchorage's
 * marker pops when the boat arrives and its card replaces the last one. Reduced motion / no JS:
 * the whole chart with the full route, and all six cards as a list.
 */
function initVoyage() {
  const sec = document.querySelector<HTMLElement>('[data-voyage]');
  const svg = sec?.querySelector<SVGSVGElement>('[data-chart]');
  if (!sec || !svg) return;
  const legs = [...sec.querySelectorAll<HTMLElement>('[data-leg]')];
  const dayEl = sec.querySelector<HTMLElement>('[data-day]')!;
  const nmEl = sec.querySelector<HTMLElement>('[data-nm]')!;
  const voyage = createVoyage(svg, (i, nm, day) => {
    legs.forEach((l, k) => l.classList.toggle('is-active', k === i));
    dayEl.textContent = `Day ${day}`;
    nmEl.textContent = String(nm);
  });

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    sec.classList.add('is-driven');
    voyage.set(0);
    const st = gsap.timeline({
      scrollTrigger: {
        trigger: sec.querySelector('.voyage__stage'),
        start: 'top top+=64',
        end: '+=650%',
        pin: true,
        scrub: 0.6,
        onUpdate: (s) => voyage.set(s.progress),
        onRefresh: (s) => voyage.set(s.progress),
      },
    });
    return () => { st.scrollTrigger?.kill(); sec.classList.remove('is-driven'); legs.forEach((l) => l.classList.remove('is-active')); voyage.reset(); };
  });
  if (prefersReduced()) voyage.reset();
}

/** Hero compass rose turns a quarter as the hero scrolls away (CSS scroll timeline, GSAP fallback). */
function initRose() {
  const rose = document.querySelector<SVGElement>('[data-spin]');
  if (!rose || prefersReduced() || supportsSDA()) return;
  gsap.to(rose, { rotate: 90, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}

function initWashes() {
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-wash]').forEach((c) => {
    const draw = () => drawWash(c, c.dataset.wash === 'dusk' ? 'dusk' : 'morning');
    draw();
    let w = c.clientWidth;
    new ResizeObserver(() => { if (Math.abs(c.clientWidth - w) > 80) { w = c.clientWidth; draw(); } }).observe(c);
  });
}

initVoyage();
initRose();
initWashes();
initFigures();
bootMotion({ lenis: true });
