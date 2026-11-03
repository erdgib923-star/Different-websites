/**
 * The voyage chart: maps scroll progress (0..1) to the boat's position along the route, the
 * sailed (solid) part of the route, the camera (the SVG viewBox), the compass heading and which
 * anchorage is active. The boat dwells briefly at each anchorage; between them it eases.
 */
export interface Voyage {
  set: (p: number) => void;
  reset: () => void;
  stops: number[]; // progress value at which each anchorage is reached
}

const MAP = { w: 1600, h: 1000 };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function createVoyage(svg: SVGSVGElement, onStop: (i: number, nm: number, day: number) => void): Voyage {
  const route = svg.querySelector<SVGPathElement>('[data-route]')!;
  const boat = svg.querySelector<SVGGElement>('[data-boat]')!;
  const boatRot = svg.querySelector<SVGGElement>('[data-boat-rot]')!;
  const needle = svg.querySelector<SVGGElement>('[data-needle]')!;
  const wps = [...svg.querySelectorAll<SVGGElement>('[data-wp]')];
  const L = route.getTotalLength();

  // Route fraction of each anchorage: nearest sampled point to the marker.
  const samples: { l: number; x: number; y: number }[] = [];
  for (let l = 0; l <= L; l += 3) { const p = route.getPointAtLength(l); samples.push({ l, x: p.x, y: p.y }); }
  const frac = wps.map((g) => {
    const m = g.transform.baseVal.consolidate()!.matrix;
    let best = samples[0];
    for (const s of samples) if ((s.x - m.e) ** 2 + (s.y - m.f) ** 2 < (best.x - m.e) ** 2 + (best.y - m.f) ** 2) best = s;
    return best.l / L;
  });
  frac[0] = 0; frac[frac.length - 1] = 1;

  // Progress layout: 6% overview, then for each anchorage a dwell, legs between, 8% overview out.
  const n = frac.length, intro = 0.06, outro = 0.08, dwell = 0.035;
  const legSpan = (1 - intro - outro - dwell * n) / (n - 1);
  const stops = frac.map((_, i) => intro + i * (dwell + legSpan));
  const NM = [0, 26, 51, 82, 110, 148];
  const DAY = [1, 2, 4, 5, 7, 10];

  route.style.strokeDasharray = `${L}`;
  let last = -1;

  const routeAt = (p: number) => {
    // Returns route fraction t and how far through the current leg we are (for zoom).
    for (let i = 0; i < n; i++) {
      const arrive = stops[i], leave = arrive + dwell;
      if (p < arrive) {
        if (i === 0) return { t: 0, leg: 0 };
        const prevLeave = stops[i - 1] + dwell;
        const k = ease(clamp((p - prevLeave) / (arrive - prevLeave), 0, 1));
        return { t: lerp(frac[i - 1], frac[i], k), leg: k };
      }
      if (p <= leave) return { t: frac[i], leg: 0 };
    }
    return { t: 1, leg: 0 };
  };

  const set = (p: number) => {
    const { t, leg } = routeAt(p);
    const l = t * L;
    route.style.strokeDashoffset = `${L - l}`;
    const pt = route.getPointAtLength(l);
    const a = route.getPointAtLength(Math.max(0, l - 4)), b = route.getPointAtLength(Math.min(L, l + 4));
    const heading = (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI;
    boat.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
    boatRot.setAttribute('transform', `rotate(${(heading - 90).toFixed(1)})`);
    needle.setAttribute('transform', `rotate(${heading.toFixed(1)})`);

    // Camera: overview at both ends, otherwise follow the boat, easing out a little mid-leg.
    const o = p < intro ? 1 - ease(p / intro) : p > 1 - outro ? ease((p - (1 - outro)) / outro) : 0;
    const rect = svg.getBoundingClientRect();
    const aspect = rect.width / Math.max(1, rect.height);
    const near = aspect < 1 ? 560 : 760;
    const fullW = Math.max(MAP.w, MAP.h * aspect) * 1.02;
    const z = lerp(near + 300 * Math.sin(Math.PI * leg), fullW, o);
    const cx = lerp(pt.x, MAP.w / 2, o), cy = lerp(pt.y, MAP.h / 2, o);
    const vw = z, vh = z / aspect;
    const x = vw >= MAP.w ? cx - vw / 2 : clamp(cx - vw / 2, 0, MAP.w - vw);
    const y = vh >= MAP.h ? cy - vh / 2 : clamp(cy - vh / 2, 0, MAP.h - vh);
    svg.setAttribute('viewBox', `${x.toFixed(1)} ${y.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`);

    // Anchorages reached so far.
    let cur = 0;
    stops.forEach((s, i) => { const on = p >= s; wps[i].classList.toggle('is-on', on); if (on) cur = i; });
    if (cur !== last) { last = cur; onStop(cur, NM[cur], DAY[cur]); }
  };

  const reset = () => {
    route.style.strokeDasharray = '';
    route.style.strokeDashoffset = '';
    svg.setAttribute('viewBox', `0 0 ${MAP.w} ${MAP.h}`);
    wps.forEach((w) => w.classList.add('is-on'));
    const end = route.getPointAtLength(L);
    boat.setAttribute('transform', `translate(${end.x} ${end.y})`);
    last = -1;
  };

  return { set, reset, stops };
}
