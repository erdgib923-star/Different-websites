import '@fontsource-variable/unbounded/index.css';
import '@fontsource-variable/figtree/index.css';
import './styles/main.css';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, initReveals, refreshOnLoad, reduced, pop } from './motion';
import { initAurora } from './aurora';
import { initChain } from './chain';
import { initPricing } from './pricing';
import { initMedia } from './media';

const html = document.documentElement;

// 1. background shader (or CSS fallback)
initAurora(document.querySelector<HTMLCanvasElement>('#aurora')!);

// 2. smooth scroll: Lenis on the GSAP ticker, one loop
let lenis: Lenis | null = null;
if (!reduced()) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!;
      const el = id.length > 1 ? document.querySelector<HTMLElement>(id) : null;
      if (!el) return;
      e.preventDefault();
      lenis!.scrollTo(el, { offset: -20 });
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }),
  );
}

// 3. reveals, pinned chain, pricing, photo slots
initReveals();
initChain();
initPricing();
initMedia();

// hero HUD callouts pop in after the headline, then parallax via data-speed
if (!reduced()) pop('[data-hud]', { delay: 1.1, stagger: 0.18 });

// 4. interactive demo: lazy-loaded when its section gets close
const demo = document.querySelector('#demo');
if (demo) {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        import('./demo').then((m) => m.initDemo());
      }
    },
    { rootMargin: '600px 0px' },
  );
  io.observe(demo);
}

// 5. nav hides on scroll down, shows on scroll up
const nav = document.querySelector<HTMLElement>('.nav');
let lastY = window.scrollY;
window.addEventListener(
  'scroll',
  () => {
    const y = window.scrollY;
    if (y < 120 || y < lastY - 2) nav?.classList.remove('is-hidden');
    else if (y > lastY + 2) nav?.classList.add('is-hidden');
    lastY = y;
  },
  { passive: true },
);

refreshOnLoad();
html.classList.add('motion-ready');
