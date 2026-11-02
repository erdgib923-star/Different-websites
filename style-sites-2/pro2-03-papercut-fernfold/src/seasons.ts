import { ScrollTrigger } from './lib/motion';
import palette from '../palette.config.mjs';
import { gamutMap } from '../scripts/color.mjs';

/**
 * Four seasons, interpolated in OKLCH as the page scrolls. The season colours are defined once,
 * in palette.config.mjs (which also generates --spring-sky, --summer-far, … in tokens.css).
 * This module imports the same numbers, gamut-maps them exactly like the token generator,
 * interpolates L, C and H (shortest way round the hue circle) between the two nearest seasons,
 * and writes the result to --s-sky, --s-far, … on :root. Each season "holds" near its own
 * section (smoothstep), then blends into the next.
 */
const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
const KEYS = ['sky', 'far', 'mid', 'back', 'water', 'front', 'leaf', 'sun'] as const;
type LCH = [number, number, number];

function lookup(name: string): LCH {
  const [L, C, H] = palette.colors[name];
  return [L, gamutMap(L, C, H), H];
}
const smoothstep = (t: number) => t * t * (3 - 2 * t);
function mix(a: LCH, b: LCH, t: number): string {
  let dh = b[2] - a[2];
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  // Near-grey colours have unstable hue; let chroma carry the change there.
  const h = (a[2] + dh * t + 360) % 360;
  return `oklch(${(a[0] + (b[0] - a[0]) * t).toFixed(4)} ${(a[1] + (b[1] - a[1]) * t).toFixed(4)} ${h.toFixed(2)})`;
}

export function initSeasons() {
  const root = document.documentElement;
  // Browsers without OKLCH keep the static spring palette (hex fallbacks in tokens.css).
  if (!CSS.supports('color', 'oklch(0.5 0.1 150)')) return;
  const table = SEASONS.map((s) => KEYS.map((k) => lookup(`${s}-${k}`)));
  const sections = SEASONS.map((s) => document.getElementById(s));
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-season-nav] a')];
  let centers: number[] = [];
  const measure = () => {
    centers = sections.map((el) => (el ? el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2 : 0));
  };
  let current = -1;
  const apply = () => {
    const y = scrollY + innerHeight / 2;
    let t = 0;
    if (y >= centers[3]) t = 3;
    else if (y > centers[0]) {
      const i = centers.findIndex((c, k) => k < 3 && y >= c && y < centers[k + 1]);
      t = i + smoothstep((y - centers[i]) / (centers[i + 1] - centers[i]));
    }
    const a = Math.floor(t), b = Math.min(3, a + 1), f = t - a;
    KEYS.forEach((k, ki) => root.style.setProperty(`--s-${k}`, mix(table[a][ki], table[b][ki], f)));
    const nearest = Math.round(t);
    if (nearest !== current) {
      current = nearest;
      links.forEach((l, i) => (i === nearest ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
      root.dataset.season = SEASONS[nearest];
    }
  };
  measure();
  apply();
  let raf = 0;
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; apply(); }); }, { passive: true });
  ScrollTrigger.addEventListener('refresh', () => { measure(); apply(); });
  addEventListener('resize', () => { measure(); apply(); });
}
