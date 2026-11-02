import { select, type Selection } from 'd3-selection';
import { line, curveMonotoneX, curveBasis } from 'd3-shape';
import { scaleLinear, scaleThreshold } from 'd3-scale';
import { gsap, ScrollTrigger, EASE, reduced } from './motion';
// @ts-ignore — shared plain-JS module (also used at build time)
import * as G from './geo.js';
// @ts-ignore
import { DEPTH_FILLS } from './static-map.js';

type Pt = [number, number];
type State = 'intro' | 'places' | 'depth' | 'tide' | 'tide-detail' | 'temp' | 'shore' | 'end';

const css = (v: string) => `var(--${v})`;
const DIV = ['brand-700', 'brand-500', 'brand-300', 'neutral-200', 'accent-300', 'accent-500', 'accent-700'].map(css);

/**
 * Turns the pre-rendered base map into the scrollytelling panel. Each text step sets a state;
 * the SVG morphs between states (layers fade, view box zooms, coastline morphs into the tide curve,
 * annotations pop, the timeline scrubs the historic shoreline).
 */
export function initAtlas() {
  const svgEl = document.querySelector<SVGSVGElement>('#basemap');
  if (!svgEl) return;
  const D = reduced() ? 0 : 1; // durations collapse to 0 under reduced motion
  const svg = select(svgEl);
  const tooltip = document.querySelector<HTMLElement>('#tooltip')!;
  const legend = document.querySelector<HTMLElement>('#legend')!;
  const yearEl = document.querySelector<HTMLElement>('#year')!;
  const inset = document.querySelector<HTMLElement>('#inset')!;
  svgEl.setAttribute('aria-describedby', 'map-desc');

  // ---------- extra layers ----------
  const bg = svg.select('rect');
  const flat = svg.insert('rect', 'g.depth').attr('width', G.W).attr('height', G.H).attr('fill', css('brand-300'));
  const depth = svg.select<SVGGElement>('g.depth');
  const depthPaths = depth.selectAll<SVGPathElement, unknown>('path').nodes().reverse(); // shallow first
  const hexG = svg.insert('g', 'path.land').attr('class', 'hexes').style('opacity', 0);
  const labels = svg.select<SVGGElement>('g.labels');
  const shoreG = svg.append('g').attr('class', 'shore').style('opacity', 0);
  const annG = svg.append('g').attr('class', 'anns');
  const veil = svg.append('rect').attr('width', G.W).attr('height', G.H).attr('fill', css('bg')).style('opacity', 0);
  const chart = svg.append('g').attr('class', 'chart').style('opacity', 0);
  const morphPath = svg.append('path').attr('fill', 'none').attr('stroke', css('brand-600')).attr('stroke-width', 3).attr('stroke-linejoin', 'round').style('opacity', 0);
  const hit = svg.append('rect').attr('fill', 'transparent').style('pointer-events', 'none');
  void bg;

  // ---------- temperature hexes ----------
  const anomColor = scaleThreshold<number, string>().domain(G.ANOM_T).range(DIV);
  const hexes: { x: number; y: number; v: number }[] = G.anomalyHexes();
  hexG
    .selectAll('path')
    .data(hexes)
    .join('path')
    .attr('d', G.hexPath(22))
    .attr('transform', (d) => `translate(${d.x},${d.y})`)
    .attr('fill', (d) => anomColor(d.v))
    .attr('stroke', css('bg'))
    .attr('stroke-width', 2)
    .on('pointerenter pointermove', (e: PointerEvent, d) => tip(e, `Zone anomaly ${d.v > 0 ? '+' : ''}${d.v.toFixed(1)} °C (sample)`))
    .on('pointerleave', hideTip);

  // ---------- coast profile, shoreline change ----------
  const coast = G.coastProfile(200) as Pt[];
  const changes: { segment: string; values: { year: number; m: number }[] }[] = G.shoreChange();
  const segLen = coast.length / changes.length;
  const lineBasis = line<Pt>().curve(curveBasis);
  const nowLine = shoreG.append('path').attr('d', lineBasis(coast)).attr('fill', 'none').attr('stroke', css('brand-600')).attr('stroke-width', 3);
  const pastLine = shoreG.append('path').attr('fill', 'none').attr('stroke', css('accent-500')).attr('stroke-width', 3).attr('stroke-dasharray', '7 6');
  void nowLine;
  shoreG
    .selectAll('text')
    .data(changes)
    .join('text')
    .attr('class', 'pl')
    .attr('text-anchor', 'middle')
    .attr('x', (_d, i) => coast[Math.floor((i + 0.5) * segLen)][0])
    .attr('y', (_d, i) => coast[Math.floor((i + 0.5) * segLen)][1] - 16)
    .text((d) => d.segment);

  const offsetAt = (year: number) => {
    const yi = G.YEARS.indexOf(year);
    const seg = changes.map((s) => (s.values[s.values.length - 1].m - s.values[yi].m) / G.M_PER_PX);
    return coast.map(([x, y], k): Pt => {
      const f = k / segLen - 0.5;
      const i0 = Math.max(0, Math.min(seg.length - 1, Math.floor(f)));
      const i1 = Math.min(seg.length - 1, i0 + 1);
      const tt = Math.max(0, Math.min(1, f - i0));
      return [x, y + seg[i0] * (1 - tt) + seg[i1] * tt];
    });
  };

  // inset: bars of cumulative change per segment
  const maxAbs = Math.max(...changes.flatMap((s) => s.values.map((v) => Math.abs(v.m))));
  const IW = 800, IH = 150;
  inset.innerHTML = `<p class="inset__title">Cumulative shoreline change since 1950, metres (sample data). Up = land lost, down = land gained.</p>`;
  const insetSvg = select(inset).append('svg').attr('viewBox', `0 0 ${IW} ${IH}`).attr('width', '100%').attr('role', 'img').attr('aria-label', 'Bar chart of shoreline change per segment');
  const by = scaleLinear().domain([-maxAbs, maxAbs]).range([IH - 24, 8]);
  const bx = (i: number) => 40 + i * ((IW - 60) / changes.length);
  const bw = (IW - 60) / changes.length - 14;
  insetSvg.append('line').attr('x1', 30).attr('x2', IW - 10).attr('y1', by(0)).attr('y2', by(0)).attr('stroke', css('border-strong'));
  const bars = insetSvg
    .selectAll('rect.bar')
    .data(changes)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', (_d, i) => bx(i))
    .attr('width', bw)
    .attr('rx', 3)
    .attr('y', by(0))
    .attr('height', 0)
    .on('pointerenter pointermove', (e: PointerEvent, d) => {
      const m = d.values[G.YEARS.indexOf(currentYear)].m;
      tip(e, `Segment ${d.segment}, ${currentYear}: ${m >= 0 ? `${m} m lost` : `${-m} m gained`}`);
    })
    .on('pointerleave', hideTip);
  insetSvg.selectAll('text.seg').data(changes).join('text').attr('class', 'seg').attr('x', (_d, i) => bx(i) + bw / 2).attr('y', IH - 6).attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', css('text-muted')).attr('font-family', 'var(--font-sans)').text((d) => d.segment);
  const valueLabels = insetSvg.append('g').attr('font-size', 12).attr('font-family', 'var(--font-sans)').attr('fill', css('text'));

  let currentYear = 1950;
  const yearOut = document.querySelector<HTMLOutputElement>('#year-out')!;
  const range = document.querySelector<HTMLInputElement>('#year-range')!;
  function setYear(year: number) {
    currentYear = year;
    pastLine.attr('d', lineBasis(offsetAt(year)));
    yearEl.textContent = String(year);
    yearOut.textContent = String(year);
    range.value = String(year);
    const yi = G.YEARS.indexOf(year);
    bars
      .attr('y', (d) => (d.values[yi].m >= 0 ? by(d.values[yi].m) : by(0)))
      .attr('height', (d) => Math.max(1, Math.abs(by(d.values[yi].m) - by(0))))
      .attr('fill', (d) => (d.values[yi].m >= 0 ? css('accent-500') : css('brand-500')));
    // selective labels: only the largest loss and the largest gain
    const vals = changes.map((c, i) => ({ i, m: c.values[yi].m }));
    const lo = vals.reduce((a, b) => (b.m < a.m ? b : a)), hi = vals.reduce((a, b) => (b.m > a.m ? b : a));
    valueLabels
      .selectAll('text')
      .data([hi, lo].filter((v, k, arr) => v.m !== 0 && arr.findIndex((w) => w.i === v.i) === k))
      .join('text')
      .attr('x', (v) => bx(v.i) + bw / 2)
      .attr('y', (v) => (v.m >= 0 ? by(v.m) - 5 : by(v.m) + 14))
      .attr('text-anchor', 'middle')
      .text((v) => `${v.m > 0 ? '−' : '+'}${Math.abs(v.m)} m`);
  }
  range.addEventListener('input', () => setYear(Number(range.value)));
  setYear(1950);

  // ---------- tide chart (shares the SVG; the coastline morphs into the curve) ----------
  const tideData: { t: number; h: number }[] = G.tide();
  const x = scaleLinear().domain([0, 48]).range([90, 770]);
  const y = scaleLinear().domain([0, 4.5]).range([520, 110]);
  const tidePts: Pt[] = coast.map((_p, k) => {
    const t = (k / (coast.length - 1)) * 48;
    const i = Math.min(tideData.length - 2, Math.floor(t * 4));
    const f = t * 4 - i;
    return [x(t), y(tideData[i].h * (1 - f) + tideData[i + 1].h * f)];
  });
  const axis = chart.append('g').attr('class', 'axis');
  [0, 1, 2, 3, 4].forEach((v) => {
    axis.append('line').attr('class', 'gridline').attr('x1', 90).attr('x2', 770).attr('y1', y(v)).attr('y2', y(v));
    axis.append('text').attr('x', 80).attr('y', y(v) + 4).attr('text-anchor', 'end').text(`${v} m`);
  });
  [0, 6, 12, 18, 24, 30, 36, 42, 48].forEach((t) => axis.append('text').attr('x', x(t)).attr('y', 548).attr('text-anchor', 'middle').text(t % 24 === 0 ? (t === 48 ? 'Mon 00:00' : t === 24 ? 'Sun 00:00' : 'Sat 00:00') : `${String(t % 24).padStart(2, '0')}:00`));
  axis.append('text').attr('x', 90).attr('y', 86).attr('font-size', 14).attr('fill', css('text')).text('Tide height at Saltmere Quay, metres above chart datum (synthetic)');
  const extremes: { t: number; h: number; kind: string }[] = G.tideExtremes(tideData);
  const exG = chart.append('g');
  exG
    .selectAll('circle')
    .data(extremes)
    .join('circle')
    .attr('cx', (d) => x(d.t))
    .attr('cy', (d) => y(d.h))
    .attr('r', 6)
    .attr('fill', (d) => (d.kind === 'High water' ? css('accent-500') : css('brand-600')))
    .attr('stroke', css('bg'))
    .attr('stroke-width', 2)
    .style('opacity', 0);
  const firstHW = extremes.find((e) => e.kind === 'High water')!;
  const cross = chart.append('g').style('opacity', 0);
  const crossLine = cross.append('line').attr('y1', 110).attr('y2', 520).attr('stroke', css('text-muted')).attr('stroke-dasharray', '3 4');
  const crossDot = cross.append('circle').attr('r', 6).attr('fill', css('brand-600')).attr('stroke', css('bg')).attr('stroke-width', 2);
  hit.attr('x', 90).attr('y', 100).attr('width', 680).attr('height', 430);

  const lineFn = line<Pt>().curve(curveMonotoneX);
  const morph = { t: 0 };
  const drawMorph = () => morphPath.attr('d', lineFn(coast.map((p, k) => [p[0] + (tidePts[k][0] - p[0]) * morph.t, p[1] + (tidePts[k][1] - p[1]) * morph.t] as Pt)));
  drawMorph();

  hit
    .on('pointermove', (e: PointerEvent) => {
      const pt = svgEl.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const p = pt.matrixTransform(svgEl.getScreenCTM()!.inverse());
      const t = Math.max(0, Math.min(48, x.invert(p.x)));
      const d = tideData[Math.round(t * 4)];
      crossLine.attr('x1', x(d.t)).attr('x2', x(d.t));
      crossDot.attr('cx', x(d.t)).attr('cy', y(d.h));
      cross.style('opacity', 1);
      tip(e, `${G.clock(d.t)} · ${d.h.toFixed(2)} m`);
    })
    .on('pointerleave', () => {
      cross.style('opacity', 0);
      hideTip();
    });

  // ---------- annotations ----------
  type Ann = { x: number; y: number; dx: number; dy: number; text: string };
  const ANN: Record<string, Ann[]> = {
    places: [
      { x: 365, y: 278, dx: -150, dy: 70, text: 'Estuary mouth: the banks shift every winter' },
      { x: 338, y: 218, dx: -190, dy: -70, text: 'Saltmere Quay and its tide gauge (1898)' },
    ],
    'tide-detail': [{ x: x(firstHW.t), y: y(firstHW.h), dx: 40, dy: -40, text: `First high water ${G.clock(firstHW.t)}, ${firstHW.h.toFixed(1)} m` }],
    end: [],
  };
  const worstIdx = changes.reduce((bi, s, i, arr) => (s.values[s.values.length - 1].m > arr[bi].values[arr[bi].values.length - 1].m ? i : bi), 0);
  const wp = coast[Math.floor((worstIdx + 0.5) * segLen)];
  ANN.end.push({ x: wp[0], y: wp[1], dx: wp[0] > 400 ? -170 : 60, dy: 90, text: `Segment ${changes[worstIdx].segment}: fastest retreat on the reach` });

  function drawAnns(key: string) {
    gsap.killTweensOf(annG.selectAll('g').nodes());
    annG.selectAll('*').remove();
    (ANN[key] ?? []).forEach((a, i) => {
      const g: Selection<SVGGElement, unknown, null, undefined> = annG.append('g').attr('class', 'ann');
      g.append('circle').attr('class', 'ring').attr('cx', a.x).attr('cy', a.y).attr('r', 11).attr('stroke-width', 1.5);
      g.append('circle').attr('class', 'dot').attr('cx', a.x).attr('cy', a.y).attr('r', 4);
      g.append('line').attr('x1', a.x).attr('y1', a.y).attr('x2', a.x + a.dx).attr('y2', a.y + a.dy);
      const tx = g.append('text').attr('x', a.x + a.dx + (a.dx < 0 ? -8 : 8)).attr('y', a.y + a.dy + 4).attr('text-anchor', a.dx < 0 ? 'end' : 'start').text(a.text);
      const bb = (tx.node() as SVGTextElement).getBBox();
      g.insert('rect', 'text').attr('x', bb.x - 6).attr('y', bb.y - 4).attr('width', bb.width + 12).attr('height', bb.height + 8).attr('rx', 4);
      if (D) gsap.fromTo(g.node(), { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, svgOrigin: `${a.x} ${a.y}`, duration: 0.7, ease: EASE.pop, delay: 0.35 + i * 0.18 });
    });
  }

  // ---------- legends ----------
  const legends: Record<string, string> = {
    depth: `<strong>Water depth</strong><div class="legend__row">${DEPTH_FILLS.map((c: string) => `<span style="background:${c}"></span>`).join('')}</div><div class="legend__ticks"><span>0 m</span><span>29 m+</span></div>`,
    temp: `<strong>Surface temperature anomaly</strong><div class="legend__row">${DIV.map((c) => `<span style="background:${c}"></span>`).join('')}</div><div class="legend__ticks"><span>−1.5 °C</span><span>0</span><span>+1.5 °C</span></div>`,
    shore: `<strong>Shoreline</strong><div class="legend__ticks" style="gap:1rem;justify-content:flex-start"><span><svg width="26" height="8"><line x1="0" x2="26" y1="4" y2="4" stroke="var(--brand-600)" stroke-width="3"/></svg> 2025</span><span><svg width="26" height="8"><line x1="0" x2="26" y1="4" y2="4" stroke="var(--accent-500)" stroke-width="3" stroke-dasharray="7 6"/></svg> selected year</span></div>`,
  };
  let currentLegend = '';
  function showLegend(key: string) {
    if (key === currentLegend) return;
    currentLegend = key;
    if (!key) {
      gsap.to(legend, { autoAlpha: 0, duration: 0.3 * D });
      return;
    }
    legend.innerHTML = legends[key];
    gsap.fromTo(legend, { autoAlpha: 0, y: 12, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6 * D, ease: EASE.pop });
  }

  // ---------- view box ----------
  const vb = { x: 0, y: 0, w: G.W, h: G.H };
  const setVB = (to: typeof vb) =>
    gsap.to(vb, { ...to, duration: 1.2 * D, ease: EASE.inOut, overwrite: true, onUpdate: () => svgEl.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`) });
  const FULL = { x: 0, y: 0, w: G.W, h: G.H };
  const ESTUARY = { x: 160, y: 60, w: 400, h: 300 };

  // ---------- state machine ----------
  let state: State | '' = '';
  const fade = (sel: Element | Element[] | null, v: number, d = 0.7) => gsap.to(sel, { opacity: v, duration: d * D, ease: EASE.soft, overwrite: 'auto' });

  function go(next: State) {
    if (next === state) return;
    const prev = state;
    state = next;
    const isTide = next === 'tide' || next === 'tide-detail';
    setVB(next === 'places' ? ESTUARY : FULL);
    fade(flat.node(), next === 'intro' || next === 'places' || next === 'temp' ? 1 : 0, 0.8);
    if (next === 'depth' && prev !== 'tide') gsap.fromTo(depthPaths, { opacity: 0 }, { opacity: 1, duration: 0.6 * D, stagger: 0.12 * D, overwrite: 'auto' });
    else fade(depthPaths, 1, 0.4);
    fade(hexG.node(), next === 'temp' ? 1 : 0);
    hexG.style('pointer-events', next === 'temp' ? 'auto' : 'none');
    fade(labels.node(), next === 'shore' ? 0.35 : 1);
    fade(shoreG.node(), next === 'shore' || next === 'end' ? 1 : 0);
    fade(veil.node(), isTide ? 0.94 : 0);
    fade(chart.node(), isTide ? 1 : 0, 0.6);
    hit.style('pointer-events', isTide ? 'all' : 'none');
    // coastline ⇄ tide curve morph
    if (isTide) {
      gsap.set(morphPath.node(), { opacity: 1 });
      gsap.to(morph, { t: 1, duration: 1.4 * D, ease: EASE.inOut, onUpdate: drawMorph, overwrite: true });
    } else if (morph.t > 0) {
      gsap.to(morph, { t: 0, duration: 1 * D, ease: EASE.inOut, onUpdate: drawMorph, overwrite: true, onComplete: () => fade(morphPath.node(), 0, 0.4) });
    } else fade(morphPath.node(), 0, 0.3);
    gsap.to(exG.selectAll('circle').nodes(), { opacity: next === 'tide-detail' ? 1 : 0, duration: 0.4 * D, stagger: 0.05 * D, overwrite: 'auto' });
    drawAnns(next === 'places' ? 'places' : next === 'tide-detail' ? 'tide-detail' : next === 'end' ? 'end' : '');
    showLegend(next === 'depth' || next === 'shore' || next === 'end' ? (next === 'depth' ? 'depth' : 'shore') : next === 'temp' ? 'temp' : '');
    fade(yearEl, next === 'shore' ? 1 : 0, 0.4);
    inset.classList.toggle('is-on', next === 'shore' || next === 'end');
    fade(inset, next === 'shore' || next === 'end' ? 1 : 0, 0.5);
    if (next === 'end') setYear(1950);
    hideTip();
    ScrollTrigger.refresh();
  }

  // initial state (labels stagger in)
  go('intro');
  if (D) gsap.from(labels.selectAll('text').nodes(), { opacity: 0, y: 8, duration: 0.6, stagger: 0.07, delay: 0.2 });

  document.querySelectorAll<HTMLElement>('.step').forEach((step) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter: () => go(step.dataset.state as State),
      onEnterBack: () => go(step.dataset.state as State),
    });
  });

  // scrubbed timeline: scroll through the long chapter-5 step to move 1950 → 2025
  const long = document.querySelector<HTMLElement>('.step--long');
  if (long && !reduced()) {
    ScrollTrigger.create({
      trigger: long,
      start: 'top 40%',
      end: 'bottom 80%',
      scrub: true,
      onUpdate: (self) => {
        const yr = 1950 + Math.round((self.progress * 75) / 5) * 5;
        if (yr !== currentYear && state === 'shore') setYear(yr);
      },
    });
  }

  // ---------- tooltip ----------
  function tip(e: PointerEvent, text: string) {
    tooltip.hidden = false;
    tooltip.textContent = text;
    tooltip.style.left = `${e.clientX}px`;
    tooltip.style.top = `${e.clientY}px`;
  }
  function hideTip() {
    tooltip.hidden = true;
  }

  // a hidden description that stays in sync for screen readers
  const desc = document.createElement('p');
  desc.id = 'map-desc';
  desc.className = 'sr-only';
  desc.textContent = 'The map changes with each chapter. Every value it shows is also listed in the data tables at the end of the atlas.';
  svgEl.parentElement!.append(desc);
}
