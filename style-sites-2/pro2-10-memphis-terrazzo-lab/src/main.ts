import '@fontsource/rubik/700.css';
import '@fontsource/rubik/800.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap } from './lib/motion';
import { initFigures } from './lib/figure';
import { PALETTES, TILE, dataUri, generate, toSvg, type Params, type PaletteName } from './terrazzo';

const parse = (spec: string): Params => {
  const [seed, palette, density, size, squiggles, confetti] = spec.split(',');
  return { seed: +seed, palette: palette as PaletteName, density: +density, size: +size, squiggles: +squiggles, confetti: +confetti };
};

/** Generator: live preview (tiled), seam overlay, shuffle, and SVG export of one tile. */
function initGenerator() {
  const form = document.querySelector<HTMLFormElement>('[data-gen]');
  const preview = document.querySelector<HTMLElement>('[data-preview]');
  if (!form || !preview) return null;
  const status = form.querySelector<HTMLElement>('[data-gen-status]')!;
  const val = (n: string) => (form.elements.namedItem(n) as HTMLInputElement).value;
  let svg = '';
  const read = (): Params => ({
    seed: Math.max(1, Math.min(999999, Math.round(Number(val('seed')) || 1))),
    density: Number(val('density')), size: Number(val('size')), squiggles: Number(val('squiggles')), confetti: Number(val('confetti')),
    palette: (new FormData(form).get('palette') as PaletteName) ?? 'house',
  });
  let t = 0;
  const render = (announce = true) => {
    const p = read();
    (form.querySelector('[data-o="density"]') as HTMLOutputElement).value = String(p.density);
    (form.querySelector('[data-o="size"]') as HTMLOutputElement).value = `${p.size.toFixed(1)}×`;
    (form.querySelector('[data-o="squiggles"]') as HTMLOutputElement).value = String(p.squiggles);
    (form.querySelector('[data-o="confetti"]') as HTMLOutputElement).value = String(p.confetti);
    (form.querySelector('[data-o="zoom"]') as HTMLOutputElement).value = `${val('zoom')} px`;
    svg = toSvg(generate(p));
    preview.style.backgroundImage = dataUri(svg);
    preview.style.setProperty('--tile', `${val('zoom')}px`);
    preview.classList.toggle('show-seams', (form.elements.namedItem('seams') as HTMLInputElement).checked);
    const desc = `Seed ${p.seed}, ${PALETTES[p.palette].label} palette: ${p.density} chips, ${p.squiggles} squiggles, ${p.confetti} confetti.`;
    preview.setAttribute('aria-label', `Pattern preview. ${desc}`);
    if (announce) { clearTimeout(t); t = window.setTimeout(() => (status.textContent = desc), 400); }
  };
  form.addEventListener('input', () => render());
  form.addEventListener('submit', (e) => e.preventDefault());
  form.querySelector('[data-shuffle]')!.addEventListener('click', () => {
    (form.elements.namedItem('seed') as HTMLInputElement).value = String(1 + Math.floor(Math.random() * 99999));
    render();
  });
  form.querySelector('[data-export]')!.addEventListener('click', () => {
    const p = read();
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svg}`], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `terrazzo-${p.palette}-${p.seed}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    status.textContent = `Exported ${a.download} (${TILE} × ${TILE}, seamless).`;
  });
  render(false);
  return {
    load(spec: string) {
      const p = parse(spec);
      (form.elements.namedItem('seed') as HTMLInputElement).value = String(p.seed);
      (form.elements.namedItem('density') as HTMLInputElement).value = String(p.density);
      (form.elements.namedItem('size') as HTMLInputElement).value = String(p.size);
      (form.elements.namedItem('squiggles') as HTMLInputElement).value = String(p.squiggles);
      (form.elements.namedItem('confetti') as HTMLInputElement).value = String(p.confetti);
      form.querySelector<HTMLInputElement>(`input[name="palette"][value="${p.palette}"]`)!.checked = true;
      render();
      document.getElementById('generator')!.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      (form.elements.namedItem('seed') as HTMLInputElement).focus({ preventScroll: true });
    },
  };
}

function initLibrary(gen: ReturnType<typeof initGenerator>) {
  document.querySelectorAll<HTMLElement>('[data-pattern]').forEach((el) => {
    el.style.backgroundImage = dataUri(toSvg(generate(parse(el.dataset.pattern!))));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-load]').forEach((b) => b.addEventListener('click', () => gen?.load(b.dataset.load!)));
}

/**
 * How it works: the pinned build. Chips pop in, squiggles draw, confetti scatters, then the view
 * zooms out to a 3 × 3 repeat to prove the seam. Callouts pop at fixed points.
 */
function initProcess() {
  const sec = document.querySelector<HTMLElement>('.process');
  const svg = sec?.querySelector<SVGSVGElement>('[data-build]');
  if (!sec || !svg) return;
  const layers = generate({ seed: 2047, palette: 'house', density: 40, size: 1.1, squiggles: 7, confetti: 46 });
  svg.querySelector('[data-b-bg]')!.setAttribute('fill', layers.bg);
  svg.querySelector('[data-b-chips]')!.innerHTML = layers.chips;
  svg.querySelector('[data-b-squiggles]')!.innerHTML = layers.squiggles;
  svg.querySelector('[data-b-confetti]')!.innerHTML = layers.confetti;
  const world = svg.querySelector<SVGGElement>('[data-world]')!;
  for (const dx of [-TILE, 0, TILE]) for (const dy of [-TILE, 0, TILE]) {
    if (!dx && !dy) continue;
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#build-core');
    use.setAttribute('x', String(dx)); use.setAttribute('y', String(dy));
    use.setAttribute('class', 'copy');
    world.appendChild(use);
  }
  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 900px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { wide, motion } = ctx.conditions as { wide: boolean; motion: boolean };
    if (!motion) return;
    const q = gsap.utils.selector(sec);
    const chips = [...svg.querySelectorAll('[data-b-chips] path')];
    const squigs = [...svg.querySelectorAll<SVGPathElement>('[data-b-squiggles] path')];
    const conf = [...svg.querySelectorAll('[data-b-confetti] > *')];
    const steps = q('.step');
    gsap.set(chips, { scale: 0, transformOrigin: '50% 50%' });
    squigs.forEach((p) => { const len = p.getTotalLength(); gsap.set(p, { strokeDasharray: `${len} ${len}`, strokeDashoffset: len }); });
    gsap.set(conf, { autoAlpha: 0 });
    gsap.set(svg.querySelectorAll('.copy'), { autoAlpha: 0 });
    gsap.set(q('[data-callout]'), { autoAlpha: 0, scale: 0.3, rotation: -30 });
    if (wide) { sec.classList.add('is-pinned'); gsap.set(steps.slice(1), { autoAlpha: 0, y: 20 }); }
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: wide
        ? { trigger: q('[data-process]')[0], start: 'top top+=80', end: '+=280%', pin: true, scrub: 0.6 }
        : { trigger: svg, start: 'top 80%', end: 'bottom 20%', scrub: 0.6 },
    });
    tl.to(chips, { scale: 1, duration: 0.5, stagger: { each: 0.02, from: 'random' }, ease: 'back.out(2.5)' }, 0)
      .to(q('[data-callout="0"]'), { autoAlpha: 1, scale: 1, rotation: -5, duration: 0.2, ease: 'back.out(2.5)' }, 0.5);
    const swap = (i: number, at: number) => { if (wide) tl.to(steps[i - 1], { autoAlpha: 0, y: -20, duration: 0.2 }, at).to(steps[i], { autoAlpha: 1, y: 0, duration: 0.25 }, at + 0.1); };
    swap(1, 1.1);
    tl.to(squigs, { strokeDashoffset: 0, duration: 0.6, stagger: 0.06 }, 1.2);
    swap(2, 2.1);
    tl.to(conf, { autoAlpha: 1, duration: 0.3, stagger: { each: 0.008, from: 'random' } }, 2.2);
    swap(3, 3.1);
    tl.to(world, { scale: 1 / 3, svgOrigin: '200 200', duration: 0.7, ease: 'power2.inOut' }, 3.2)
      .to(svg.querySelectorAll('.copy'), { autoAlpha: 1, duration: 0.3 }, 3.3)
      .to(q('[data-callout="1"]'), { autoAlpha: 1, scale: 1, rotation: 4, duration: 0.2, ease: 'back.out(2.5)' }, 3.85)
      .to({}, { duration: 0.35 });
    return () => sec.classList.remove('is-pinned');
  });
}

const gen = initGenerator();
initLibrary(gen);
initProcess();
initFigures();
bootMotion({ lenis: true });
