import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/600.css';
import '@fontsource/pixelify-sans/700.css';
import '@fontsource/press-start-2p/400.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap } from './lib/motion';
import { initFigures } from './lib/figure';
import { CHICKEN, COIN, CROP, FARMER, FENCE, HOUSE, MOON, TREE, draw, rasterise, rgb, type Sprite } from './pixel';
import { initLandscape } from './landscape';
import { initGame } from './game';

const fill = (ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = `rgb(${rgb(ch).join(',')})`;
  ctx.fillRect(x, y, w, h);
};

/** Feature icons: one sprite centred on a 16 × 16 (or larger) pixel canvas. */
function initIcons() {
  const map: Record<string, Sprite> = { crop: CROP[3], chicken: CHICKEN, farmer: FARMER[0], house: HOUSE };
  document.querySelectorAll<HTMLCanvasElement>('[data-icon]').forEach((c) => {
    const s = map[c.dataset.icon!];
    const size = Math.max(16, s[0].length + 4, s.length + 4);
    c.width = size; c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    fill(ctx, 'i', 0, 0, size, size);
    fill(ctx, 'g', 0, size - 3, size, 3);
    draw(ctx, c.dataset.icon!, s, Math.floor((size - s[0].length) / 2), size - 3 - s.length, 'day');
  });
}

/** "Screenshots": small static scenes rendered in the dusk and night palettes. */
function initShots() {
  document.querySelectorAll<HTMLCanvasElement>('[data-shot]').forEach((c) => {
    const swap = c.dataset.shot!;
    c.width = 192; c.height = 108;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const night = swap === 'night';
    fill(ctx, night ? 'k' : 'B', 0, 0, 192, 40);
    fill(ctx, night ? 'u' : 'p', 0, 40, 192, 30);
    if (night) { for (let i = 0; i < 30; i++) fill(ctx, 'c', (i * 37) % 192, (i * 13) % 50, 1, 1); draw(ctx, 'moon', MOON, 150, 10, 'day'); }
    else fill(ctx, 'y', 140, 52, 14, 8);
    fill(ctx, night ? 'k' : 'G', 0, 62, 192, 46);
    fill(ctx, night ? 'G' : 'g', 0, 74, 192, 34);
    for (let x = -4; x < 192; x += 20) draw(ctx, 'tree', TREE, x, 52, swap);
    draw(ctx, 'house', HOUSE, 18, 66, swap);
    for (let x = 60; x < 192; x += 9) draw(ctx, 'fence', FENCE, x, 72, swap);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 9; k++) draw(ctx, `crop${(k + r) % 4}`, CROP[(k + r) % 4], 66 + k * 13, 84 + r * 10, swap);
    draw(ctx, 'farmer0', FARMER[0], 46, 88, swap);
  });
}

/** The walking farmer in the hero: a 2-frame sprite sheet generated from code, animated with steps(). */
function initWalker() {
  const el = document.querySelector<HTMLElement>('[data-walker]');
  if (!el) return;
  const sheet = Object.assign(document.createElement('canvas'), { width: 24, height: 15 });
  const ctx = sheet.getContext('2d')!;
  ctx.drawImage(rasterise('farmer0', FARMER[0]), 0, 0);
  ctx.drawImage(rasterise('farmer1', FARMER[1]), 12, 0);
  el.style.backgroundImage = `url(${sheet.toDataURL()})`;
}

/**
 * One season, one field (pinned on wide screens): crops jump through four growth stages (whole
 * stages, no tweening: it is pixel art), the day counter ticks, a coin badge and a level-up
 * badge pop at fixed points, and captions swap. Static (no JS / reduced motion): harvest day.
 */
function initSeason() {
  const sec = document.querySelector<HTMLElement>('.season');
  const canvas = sec?.querySelector<HTMLCanvasElement>('[data-field]');
  const ctx = canvas?.getContext('2d');
  if (!sec || !canvas || !ctx) return;
  canvas.width = 128; canvas.height = 64;
  ctx.imageSmoothingEnabled = false;
  const day = sec.querySelector<HTMLElement>('[data-day]')!;
  const paint = (stage: number) => {
    fill(ctx, 'g', 0, 0, 128, 64);
    for (let r = 0; r < 3; r++) fill(ctx, 's', 6, 12 + r * 17, 116, 6);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 10; k++) draw(ctx, `crop${stage}`, CROP[stage], 8 + k * 11, 6 + r * 17, 'day');
    draw(ctx, 'chicken', CHICKEN, 108 - stage * 22, 54, 'day', stage % 2 === 1);
    if (stage === 3) for (let k = 0; k < 4; k++) draw(ctx, 'coin', COIN, 20 + k * 26, 2, 'day');
  };
  paint(3);
  day.textContent = 'Day 10';
  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 860px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx2) => {
    const { wide, motion } = ctx2.conditions as { wide: boolean; motion: boolean };
    if (!motion) return;
    const q = gsap.utils.selector(sec);
    const steps = q('.step');
    const coins = q('[data-coin]');
    gsap.set(coins, { autoAlpha: 0, scale: 0.4 });
    if (wide) { sec.classList.add('is-pinned'); gsap.set(steps.slice(1), { autoAlpha: 0 }); }
    let shown = -1;
    const DAYS = ['Day 1', 'Day 4', 'Day 7', 'Day 10'];
    const setStage = (s: number) => {
      if (s === shown) return;
      shown = s;
      paint(s);
      day.textContent = DAYS[s];
      if (wide) steps.forEach((el: Element, i: number) => gsap.set(el, { autoAlpha: i === s ? 1 : 0 }));
    };
    setStage(0);
    gsap.timeline({
      scrollTrigger: {
        ...(wide ? { trigger: sec.querySelector('[data-season]'), start: 'top top+=70', end: '+=220%', pin: true } : { trigger: canvas, start: 'top 80%', end: 'bottom 25%' }),
        scrub: true,
        onUpdate: (self) => {
          const s = Math.min(3, Math.floor(self.progress * 4));
          setStage(s);
          coins.forEach((c: Element, i: number) => {
            const on = s >= (i === 0 ? 2 : 3);
            gsap.to(c, on ? { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'steps(4)' } : { autoAlpha: 0, scale: 0.4, duration: 0.15, ease: 'steps(2)' });
          });
        },
      },
    });
    return () => { sec.classList.remove('is-pinned'); paint(3); day.textContent = 'Day 10'; };
  });
}

const world = document.querySelector<HTMLCanvasElement>('[data-world]');
if (world) initLandscape(world);
initIcons();
initShots();
initWalker();
initSeason();
initGame();
initFigures();
bootMotion();
