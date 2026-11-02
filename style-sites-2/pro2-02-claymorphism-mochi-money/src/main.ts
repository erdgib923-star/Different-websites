import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/nunito/500.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, prefersReduced } from './lib/motion';
import { initFigures } from './lib/figure';
import { initSim } from './sim';
import { initYear } from './year';

/** Squish spring: on release, elements bulge sideways and wobble back like soft clay. */
function initSquish() {
  if (prefersReduced()) return;
  document.querySelectorAll<HTMLElement>('[data-squish]').forEach((el) => {
    el.addEventListener('pointerup', () => {
      gsap.fromTo(el, { scaleX: 1.12, scaleY: 0.86 }, { scaleX: 1, scaleY: 1, duration: 0.8, ease: 'elastic.out(1.1, 0.32)', clearProps: 'transform', overwrite: true });
    });
  });
}

initSim();
initYear();
initSquish();
initFigures();
bootMotion();
