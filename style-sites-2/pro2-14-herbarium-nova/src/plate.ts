/**
 * Renders an L-system plant as a natural-history plate (SVG): the plant path, leaves, flowers and
 * three numbered labels with leader lines. Every leaf, flower and label carries --f (its position
 * along the drawing), so CSS (scroll timelines) or JS can reveal it as the pen arrives.
 */
import { grow, type Spec } from './lsystem';

const NS = 'http://www.w3.org/2000/svg';
const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
};

const LEAF = 'M0 0C3 -3.2 9 -3.6 13 0C9 3.6 3 3.2 0 0Z';

export function renderPlate(host: HTMLElement, spec: Spec, opts: { labels?: boolean; thumb?: boolean } = {}) {
  const W = 400, H = 520;
  const plant = grow(spec, W, H, opts.thumb ? 16 : 40);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true', class: 'plate-svg' });
  if (!opts.thumb) svg.append(el('rect', { x: 10, y: 10, width: W - 20, height: H - 20, class: 'plate-frame' }));
  svg.append(el('path', { d: plant.d, pathLength: 1, class: 'stem' }));
  const leaves = el('g', { class: 'leaves' });
  const leafScale = opts.thumb ? 0.9 : 1;
  for (const l of plant.leaves) {
    const g = el('path', { d: LEAF, class: 'leaf', transform: `translate(${l.x} ${l.y}) rotate(${(l.a + 360).toFixed(0)}) scale(${leafScale})` });
    g.style.setProperty('--f', l.f.toFixed(3));
    leaves.append(g);
  }
  svg.append(leaves);
  const flowers = el('g', { class: 'flowers' });
  for (const f of plant.flowers) {
    const c = el('circle', { cx: f.x, cy: f.y, r: opts.thumb ? 4 : 4.5, class: 'flower' });
    c.style.setProperty('--f', f.f.toFixed(3));
    flowers.append(c);
  }
  svg.append(flowers);
  if (opts.labels) {
    const spots: [keyof typeof plant.labels, number, number][] = [['leaf', 52, 70], ['node', 46, H * 0.5], ['root', W - 50, H - 46]];
    spots.forEach(([key, lx, ly], i) => {
      const t = plant.labels[key];
      const g = el('g', { class: 'label', 'data-label': i });
      g.style.setProperty('--f', Math.min(0.97, t.f + 0.02).toFixed(3));
      g.append(
        el('line', { x1: lx, y1: ly, x2: t.x, y2: t.y, class: 'leader' }),
        el('circle', { cx: t.x, cy: t.y, r: 2.6, class: 'leader-dot' }),
        el('circle', { cx: lx, cy: ly, r: 13, class: 'label-disc' }),
      );
      const num = el('text', { x: lx, y: ly + 5, class: 'label-num', 'text-anchor': 'middle' });
      num.textContent = String(i + 1);
      g.append(num);
      svg.append(g);
    });
  }
  host.replaceChildren(svg);
  return svg;
}

/** Reveal a plate to progress p (0..1): stem dashoffset, leaves/flowers/labels by their --f. */
export function setProgress(svg: SVGSVGElement, p: number) {
  const stem = svg.querySelector<SVGPathElement>('.stem');
  if (stem) { stem.style.strokeDasharray = '1'; stem.style.strokeDashoffset = String(1 - p); }
  svg.querySelectorAll<SVGElement>('.leaf, .flower, .label').forEach((n) => {
    n.classList.toggle('is-on', p >= parseFloat(n.style.getPropertyValue('--f')));
  });
}
