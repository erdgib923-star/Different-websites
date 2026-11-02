import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/400-italic.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, prefersReduced, supportsSDA } from './lib/motion';
import { initFigures } from './lib/figure';
import { HERO_LAYERS, cardLayers, mountScene } from './paper';
import { initSeasons } from './seasons';

const W = 1600;

/** Hero valley: eight layers sized to the hero's aspect ratio, rebuilt if that changes a lot. */
function initValley() {
  const host = document.querySelector<HTMLElement>('[data-valley]');
  if (!host) return null;
  let lastH = 0;
  const build = () => {
    const { width, height } = host.getBoundingClientRect();
    const H = Math.round(Math.min(2600, Math.max(620, (W * height) / Math.max(1, width))));
    if (Math.abs(H - lastH) < 80) return false;
    lastH = H;
    mountScene(host, HERO_LAYERS, H);
    return true;
  };
  build();
  return { host, build };
}

/** Pinned "walk into the forest": nearer layers grow and drop away faster than far ones. */
function initDive(host: HTMLElement) {
  const hero = document.querySelector<HTMLElement>('.hero')!;
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const layers = [...host.querySelectorAll<SVGSVGElement>('.layer')];
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: '+=120%', pin: true, scrub: 0.6, invalidateOnRefresh: true },
    });
    layers.forEach((l) => {
      const d = parseFloat(l.style.getPropertyValue('--depth')) || 0;
      tl.to(l, { scale: 1 + d * d * 1.3, yPercent: d * d * 38, duration: 1 }, 0);
    });
    tl.to('.hero__copy', { yPercent: -30, autoAlpha: 0, duration: 0.45 }, 0)
      .to('.hero__caption', { autoAlpha: 1, duration: 0.25 }, 0.5);
  });
  return mm;
}

/** JS fallback for the papercut fold-in when CSS scroll-driven animations are unavailable. */
function initFoldFallback() {
  if (prefersReduced() || supportsSDA()) return;
  document.querySelectorAll<HTMLElement>('.fold').forEach((fold) => {
    const layers = [...fold.querySelectorAll<SVGSVGElement>('.layer:not(.layer--sky)')];
    gsap.fromTo(layers, { rotationX: -82, yPercent: 16, autoAlpha: 0, transformOrigin: '50% 100%' }, {
      rotationX: 0, yPercent: 0, autoAlpha: 1, ease: 'none', stagger: 0.18,
      scrollTrigger: { trigger: fold, start: 'top 95%', end: 'top 30%', scrub: true },
    });
  });
}

function initBooking() {
  const form = document.querySelector<HTMLFormElement>('[data-book]');
  const msg = document.querySelector<HTMLElement>('[data-book-msg]');
  if (!form || !msg) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const name = String(data.get('name')).trim().split(' ')[0];
    msg.textContent = `Thank you, ${name}. This is a demo, so nothing was sent. A real request for ${data.get('size')} on ${data.get('walk')} would be confirmed by email within a day.`;
  });
}

const valley = initValley();
document.querySelectorAll<HTMLElement>('[data-scene]').forEach((el) => mountScene(el, cardLayers(Number(el.dataset.scene)), 1200));
initFigures();
initSeasons();
initBooking();
initFoldFallback();
if (valley) {
  let mm = initDive(valley.host);
  let t = 0;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = window.setTimeout(() => {
      if (valley.build()) { mm.revert(); mm = initDive(valley.host); }
    }, 250);
  });
}
bootMotion({ lenis: true });
