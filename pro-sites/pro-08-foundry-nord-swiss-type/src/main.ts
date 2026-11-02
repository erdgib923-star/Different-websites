import '@fontsource-variable/roboto-flex/full.css';
import '@fontsource-variable/anybody/wdth.css';
import '@fontsource-variable/recursive/full.css';
import './styles/main.css';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, initReveals, refreshOnLoad, reduced, EASE } from './motion';
import { initMedia } from './media';
import { initTester } from './tester';
import { initGlyphs } from './glyphs';

const RM = reduced();
const html = document.documentElement;

if (!RM) {
  const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const el = document.querySelector<HTMLElement>(a.getAttribute('href')!);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -70 });
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }),
  );
}

initReveals();
initMedia();
initTester();
initGlyphs();

/* ---------- grid overlay toggle ---------- */
const gridBtn = document.querySelector<HTMLButtonElement>('#grid-toggle')!;
gridBtn.addEventListener('click', () => {
  const on = !html.classList.contains('show-grid');
  html.classList.toggle('show-grid', on);
  gridBtn.setAttribute('aria-pressed', String(on));
});

/* ---------- hero: wght / wdth / opsz scrub with scroll; the word is fitted at its widest state ---------- */
const word = document.querySelector<HTMLElement>('#hero-word')!;
const out = { wght: document.querySelector('#ax-wght')!, wdth: document.querySelector('#ax-wdth')!, opsz: document.querySelector('#ax-opsz')! };
const axes = { wght: 100, wdth: 25, opsz: 144 };
const apply = () => {
  word.style.fontVariationSettings = `'wght' ${axes.wght.toFixed(0)}, 'wdth' ${axes.wdth.toFixed(0)}, 'opsz' ${axes.opsz.toFixed(0)}`;
  out.wght.textContent = axes.wght.toFixed(0);
  out.wdth.textContent = axes.wdth.toFixed(0);
  out.opsz.textContent = axes.opsz.toFixed(0);
};
const fit = () => {
  const saved = word.style.fontVariationSettings;
  word.style.fontVariationSettings = `'wght' 1000, 'wdth' 151, 'opsz' 144`;
  word.style.fontSize = '100px';
  const w = word.scrollWidth;
  word.style.fontSize = `${Math.floor((word.parentElement!.clientWidth / w) * 100 * 0.98)}px`;
  word.style.fontVariationSettings = saved;
};
document.fonts.ready.then(() => {
  fit();
  if (RM) {
    Object.assign(axes, { wght: 800, wdth: 120, opsz: 144 });
    apply();
    return;
  }
  apply();
  gsap.to(axes, {
    wght: 1000,
    wdth: 151,
    opsz: 96,
    ease: 'none',
    onUpdate: apply,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: 0.5, invalidateOnRefresh: true },
  });
  ScrollTrigger.refresh();
});
window.addEventListener('resize', () => document.fonts.ready.then(fit));

if (!RM) {
  /* ---------- family specimens sweep their weight axis as they pass ---------- */
  document.querySelectorAll<HTMLElement>('[data-sweep]').forEach((el) => {
    const isBreit = el.classList.contains('family__spec--breit');
    const isMono = el.classList.contains('family__spec--mono');
    const v = { w: isMono ? 300 : 100 };
    gsap.to(v, {
      w: isMono ? 1000 : isBreit ? 900 : 1000,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 25%', scrub: true },
      onUpdate() {
        el.style.fontVariationSettings = isMono ? `'wght' ${v.w}, 'CASL' 1, 'MONO' 1` : isBreit ? `'wght' ${v.w}, 'wdth' 150` : `'wght' ${v.w}, 'wdth' 100, 'opsz' 144`;
      },
    });
  });

  /* ---------- kinetic rows: drift (velocity-boosted) + a weight wave through the words ---------- */
  const rows = gsap.utils.toArray<HTMLElement>('.kinetic__row');
  const tweens: gsap.core.Animation[] = [];
  rows.forEach((row) => {
    const dir = Number(row.dataset.dir);
    const track = row.querySelector('.kinetic__track')!;
    const drift = gsap.fromTo(track, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 26, ease: 'none', repeat: -1 });
    const wave = gsap.fromTo(track.querySelectorAll('span'), { '--w': 200 }, { '--w': 950, duration: 1.6, ease: 'sine.inOut', stagger: { each: 0.25, repeat: -1, yoyo: true } });
    tweens.push(drift, wave);
  });
  let paused = false;
  const pauseBtn = document.querySelector<HTMLButtonElement>('#kinetic-pause')!;
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.textContent = paused ? 'Play motion' : 'Pause motion';
    tweens.forEach((t) => (paused ? t.pause() : t.play()));
  });
  ScrollTrigger.create({
    trigger: '.kinetic',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => tweens.forEach((t) => (self.isActive && !paused ? t.play() : t.pause())),
    onUpdate(self) {
      if (paused) return;
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 400, 4);
      tweens.forEach((t, i) => i % 2 === 0 && gsap.to(t, { timeScale: boost, duration: 0.2, overwrite: true, onComplete: () => void gsap.to(t, { timeScale: 1, duration: 1 }) }));
    },
  });
}

/* ---------- licences: one family vs all three ---------- */
const segs = Array.from(document.querySelectorAll<HTMLButtonElement>('.seg'));
const prices = Array.from(document.querySelectorAll<HTMLElement>('.price'));
const note = document.querySelector('#lic-note')!;
segs.forEach((s) =>
  s.addEventListener('click', () => {
    const scope = s.dataset.scope as 'family' | 'all';
    segs.forEach((b) => b.setAttribute('aria-pressed', String(b === s)));
    prices.forEach((p) => {
      const raw = scope === 'all' ? p.dataset.all! : p.dataset.family!;
      const n = Number(raw);
      if (Number.isNaN(n) || RM) {
        p.textContent = Number.isNaN(n) ? raw : `€${n.toLocaleString('en-US')}`;
        return;
      }
      const o = { v: Number(p.textContent!.replace(/[^\d]/g, '')) || 0 };
      gsap.to(o, { v: n, duration: 0.6, ease: EASE.soft, onUpdate: () => (p.textContent = `€${Math.round(o.v).toLocaleString('en-US')}`) });
      gsap.fromTo(p, { y: -6 }, { y: 0, duration: 0.5, ease: EASE.pop });
    });
    note.textContent = `Prices ${scope === 'all' ? 'for all three families together' : 'per family'}, excluding VAT. Sample prices for a fictional foundry.`;
  }),
);

refreshOnLoad();
html.classList.add('motion-ready');
