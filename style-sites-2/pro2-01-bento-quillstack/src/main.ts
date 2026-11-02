import '@fontsource/bricolage-grotesque/400.css';
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/bricolage-grotesque/800.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion } from './lib/motion';
import { initFigures } from './lib/figure';
import { initTiles } from './tiles';
import { initFlow } from './flow';

function initNav() {
  const btn = document.querySelector<HTMLButtonElement>('.nav-toggle');
  const list = document.getElementById('nav-list');
  if (!btn || !list) return;
  const set = (open: boolean) => {
    btn.setAttribute('aria-expanded', String(open));
    list.classList.toggle('is-open', open);
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  list.addEventListener('click', (e) => { if ((e.target as Element).closest('a')) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && list.classList.contains('is-open')) { set(false); btn.focus(); } });
}

initNav();
initTiles();
initFigures();
initFlow();
bootMotion({ lenis: true });
