import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/im-fell-english/400.css';
import '@fontsource/im-fell-english/400-italic.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, prefersReduced, supportsSDA } from './lib/motion';
import { initFigures } from './lib/figure';
import { SPECIES } from './lsystem';
import { renderPlate, setProgress } from './plate';

/** Render every plate; returns the SVGs keyed by their figure art element. */
function initPlates() {
  const out: { art: HTMLElement; svg: SVGSVGElement }[] = [];
  document.querySelectorAll<HTMLElement>('[data-species]').forEach((art) => {
    const svg = renderPlate(art, SPECIES[art.dataset.species!], { labels: art.hasAttribute('data-labels') });
    out.push({ art, svg });
  });
  return out;
}

/**
 * Plate I: pinned; the scrub draws the fern stroke by stroke in growth order, leaves sprout as the
 * pen passes them, and labels 1–3 (and their legend lines) appear when the pen reaches each part.
 */
function initPinnedPlate(svg: SVGSVGElement) {
  const sec = document.querySelector<HTMLElement>('[data-plate-pin]');
  if (!sec) return;
  const fig = svg.closest<HTMLElement>('.fig__art')!;
  const legend = [...sec.querySelectorAll<HTMLElement>('[data-legend]')];
  const labels = [...svg.querySelectorAll<SVGGElement>('[data-label]')];
  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 900px)', motion: '(prefers-reduced-motion: no-preference)' }, (c) => {
    const { wide, motion } = c.conditions as { wide: boolean; motion: boolean };
    if (!motion) return;
    fig.classList.add('is-driven');
    sec.classList.add('is-pinned');
    const apply = (p: number) => {
      setProgress(svg, p);
      labels.forEach((l, i) => legend[i]?.classList.toggle('is-on', l.classList.contains('is-on')));
    };
    apply(0);
    gsap.timeline({
      scrollTrigger: {
        ...(wide ? { trigger: sec.querySelector('.plate__inner'), start: 'top top+=70', end: '+=200%', pin: true } : { trigger: fig, start: 'top 80%', end: 'bottom 25%' }),
        scrub: 0.4,
        onUpdate: (self) => apply(self.progress),
      },
    });
    return () => { fig.classList.remove('is-driven'); sec.classList.remove('is-pinned'); setProgress(svg, 1); legend.forEach((l) => l.classList.add('is-on')); };
  });
}

/** Plates II–IV fall back to a GSAP scrub when CSS scroll timelines are unavailable. */
function initPlateFallback(plates: { art: HTMLElement; svg: SVGSVGElement }[]) {
  if (prefersReduced() || supportsSDA()) return;
  plates.filter((p) => !p.art.closest('[data-plate-pin]')).forEach(({ art, svg }) => {
    art.classList.add('is-driven');
    setProgress(svg, 0);
    gsap.timeline({ scrollTrigger: { trigger: art, start: 'top 90%', end: 'bottom 40%', scrub: 0.4, onUpdate: (s) => setProgress(svg, s.progress) } });
  });
}

/** Specimen drawers: buttons with aria-expanded; one open at a time. */
function initDrawers() {
  const cabinet = document.querySelector<HTMLElement>('[data-cabinet]');
  if (!cabinet) return;
  const drawers = [...cabinet.querySelectorAll<HTMLElement>('[data-drawer]')];
  const buttons: HTMLButtonElement[] = [];
  drawers.forEach((d, i) => {
    const spec = SPECIES[d.dataset.drawer!];
    const id = `drawer-${i}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'drawer__front';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id);
    btn.innerHTML = `<span class="drawer__label">No. ${d.dataset.no}<small>${spec.name}</small></span><span class="drawer__handle" aria-hidden="true"></span>`;
    const body = document.createElement('div');
    body.className = 'drawer__body';
    body.id = id;
    body.hidden = true;
    const thumb = document.createElement('div');
    thumb.className = 'drawer__thumb';
    thumb.setAttribute('role', 'img');
    thumb.setAttribute('aria-label', `Small drawing of ${spec.name}`);
    const info = document.createElement('dl');
    info.innerHTML = `<dt>Species</dt><dd><em>${spec.name}</em></dd><dt>Collected</dt><dd>${d.dataset.when}</dd><dt>Habitat</dt><dd>${d.dataset.where}</dd>${d.dataset.plate ? `<dd><a href="${d.dataset.plate}">See the plate</a></dd>` : '<dd>No plate yet</dd>'}`;
    body.append(thumb, info);
    d.append(btn, body);
    buttons.push(btn);
    let drawn = false;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      buttons.forEach((b) => { if (b !== btn) { b.setAttribute('aria-expanded', 'false'); document.getElementById(b.getAttribute('aria-controls')!)!.hidden = true; } });
      btn.setAttribute('aria-expanded', String(open));
      body.hidden = !open;
      if (open) {
        if (!drawn) { renderPlate(thumb, spec, { thumb: true }); drawn = true; }
        body.classList.remove('is-opening'); void body.offsetWidth; body.classList.add('is-opening');
      }
    });
  });
}

const plates = initPlates();
const pinned = plates.find((p) => p.art.closest('[data-plate-pin]'));
if (pinned) initPinnedPlate(pinned.svg);
initPlateFallback(plates);
initDrawers();
initFigures();
bootMotion({ lenis: true });
