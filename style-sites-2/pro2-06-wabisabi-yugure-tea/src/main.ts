import '@fontsource/shippori-mincho/400.css';
import '@fontsource/shippori-mincho/500.css';
import '@fontsource/zen-kaku-gothic-new/latin-400.css';
import '@fontsource/zen-kaku-gothic-new/latin-500.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, prefersReduced } from './lib/motion';
import { initFigures } from './lib/figure';

/**
 * Ink-wash reveal mask. An SVG blot (a circle bent by fractal noise, with a soft bleed) is
 * rasterised ONCE to a PNG and used as a CSS mask. Revealing then only animates mask-size, which
 * is cheap; animating a live SVG filter every frame is not.
 */
async function makeWashMask() {
  if (prefersReduced()) return;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 200 200">
    <filter id="f" x="-50%" y="-50%" width="200%" height="200%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="5" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="46" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation="2.5"/>
    </filter>
    <circle cx="100" cy="100" r="46" fill="#000" filter="url(#f)"/>
  </svg>`;
  try {
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    c.getContext('2d')!.drawImage(img, 0, 0);
    document.documentElement.style.setProperty('--wash-mask', `url(${c.toDataURL('image/png')})`);
    document.documentElement.classList.add('has-wash');
  } catch {
    /* No mask: the figures fall back to a plain fade. */
  }
}

/** Seasonal menu tabs. The current season (by month) is selected and marked with a vermilion dot. */
function initTabs() {
  const list = document.querySelector<HTMLElement>('[data-tabs]');
  if (!list) return;
  const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')!)!);
  const m = new Date().getMonth();
  const now = m >= 2 && m <= 4 ? 0 : m >= 5 && m <= 7 ? 1 : m >= 8 && m <= 10 ? 2 : 3;
  tabs[now].classList.add('is-now');
  tabs[now].setAttribute('aria-description', 'current season');
  const select = (i: number, focus = false) => {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
      panels[k].classList.toggle('is-entering', on);
    });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const keys: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      select((keys[e.key] + tabs.length) % tabs.length, true);
    });
  });
  list.hidden = false;
  list.parentElement!.classList.add('tabs-on');
  panels.forEach((p) => p.setAttribute('tabindex', '0'));
  select(now);
  panels[now].classList.remove('is-entering');
}

/** The pour: pinned, slow scrub. Tea rises in the bowl, steam draws, the temperature note appears. */
function initPour() {
  const sec = document.querySelector<HTMLElement>('.pour');
  if (!sec) return;
  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 880px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { wide, motion } = ctx.conditions as { wide: boolean; motion: boolean };
    if (!motion) return;
    const q = gsap.utils.selector(sec);
    const steps = q('.step');
    gsap.set(q('[data-tea]'), { scaleY: 0.02 });
    gsap.set(q('.steam path'), { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(q('[data-temp]'), { autoAlpha: 0, y: 10 });
    if (wide) {
      sec.classList.add('is-pinned');
      gsap.set(steps.slice(1), { autoAlpha: 0 });
    }
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: wide
        ? { trigger: q('[data-pour]')[0], start: 'top top+=60', end: '+=240%', pin: true, scrub: 1 }
        : { trigger: q('.pour__art')[0], start: 'top 80%', end: 'bottom 20%', scrub: 1 },
    });
    const fade = (i: number, at: number) => {
      if (!wide) return;
      tl.to(steps[i - 1], { autoAlpha: 0, duration: 0.35 }, at).to(steps[i], { autoAlpha: 1, duration: 0.45 }, at + 0.25);
    };
    fade(1, 0.9);
    fade(2, 1.9);
    tl.to(q('[data-temp]'), { autoAlpha: 1, y: 0, duration: 0.4 }, 2.1)
      .to(q('[data-tea]'), { scaleY: 1, duration: 1.2, ease: 'power1.inOut' }, 2.2);
    fade(3, 2.9);
    tl.to(q('.steam path'), { strokeDashoffset: 0, duration: 0.8, stagger: 0.2 }, 3.1).to({}, { duration: 0.4 });
    return () => sec.classList.remove('is-pinned');
  });
}

initTabs();
initPour();
initFigures();
await makeWashMask();
bootMotion({ lenis: true });
