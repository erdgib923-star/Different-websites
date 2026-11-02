import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/public-sans/index.css';
import './styles/main.css';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, initReveals, refreshOnLoad, reduced } from './motion';
import { initMedia } from './media';

if (!reduced()) {
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

initReveals();
initMedia();

// D3 + the atlas are lazy-loaded: the pre-rendered static map is already on screen
const scrolly = document.querySelector('.scrolly');
if (scrolly) {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        import('./atlas').then((m) => {
          m.initAtlas();
          ScrollTrigger.refresh();
        });
      }
    },
    { rootMargin: '100% 0px' },
  );
  io.observe(scrolly);
}

refreshOnLoad();
document.documentElement.classList.add('motion-ready');
