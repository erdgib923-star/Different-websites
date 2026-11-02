// Build-time renderers: the base map as an SVG string, and the sample-data tables as HTML.
// Both are injected into index.html by vite.config.ts, so content and map exist without JavaScript.
import { W, H, layers, places, tide, tideExtremes, clock, anomalyHexes, shoreChange, YEARS, DEPTH_LABELS } from './geo.js';

export const DEPTH_FILLS = ['var(--brand-300)', 'var(--brand-400)', 'var(--brand-500)', 'var(--brand-600)', 'var(--brand-700)', 'var(--brand-800)'];

export function mapSvg({ id = 'basemap', withLabels = true } = {}) {
  const { depth, land, hills } = layers();
  // depth[] is ordered deep → shallow (t ascending); background = deepest band
  const bands = depth.map((b, i) => `<path d="${b.d}" fill="${DEPTH_FILLS[DEPTH_FILLS.length - 2 - i]}"/>`).join('');
  const labels = withLabels
    ? places
        .map((p) => `<text x="${p.x}" y="${p.y}" class="pl pl--${p.kind}" text-anchor="middle">${p.name}</text>`)
        .join('')
    : '';
  return `<svg id="${id}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${id}-t" preserveAspectRatio="xMidYMid meet">
<title id="${id}-t">Map of the fictional Shoalreach coast: a northern shore cut by the Kessock Water estuary, with three islands offshore. Water is shaded by depth.</title>
<rect width="${W}" height="${H}" fill="${DEPTH_FILLS[5]}"/>
<g class="depth">${bands}</g>
<path class="land" d="${land}"/>
<g class="hills">${hills.map((d) => `<path d="${d}"/>`).join('')}</g>
<path class="coastline" d="${land}"/>
<g class="labels">${labels}</g>
</svg>`;
}

export function dataTables() {
  const tides = tideExtremes(tide());
  const hexes = anomalyHexes();
  const bins = [
    ['below −1.5 °C', (v) => v < -1.5],
    ['−1.5 to −0.3 °C', (v) => v >= -1.5 && v < -0.3],
    ['−0.3 to +0.3 °C', (v) => v >= -0.3 && v <= 0.3],
    ['+0.3 to +1.5 °C', (v) => v > 0.3 && v <= 1.5],
    ['above +1.5 °C', (v) => v > 1.5],
  ];
  const sc = shoreChange();
  const pick = [1950, 1975, 2000, 2025];
  const fmt = (m) => (m > 0 ? `${m} m lost` : m < 0 ? `${-m} m gained` : '0 m');
  return `
<details class="table">
  <summary>Depth bands used on the map</summary>
  <table><caption>Depth classes (sample)</caption><thead><tr><th scope="col">Band</th><th scope="col">Depth</th></tr></thead>
  <tbody>${DEPTH_LABELS.map((l, i) => `<tr><td>${i + 1}</td><td>${l}</td></tr>`).join('')}</tbody></table>
</details>
<details class="table">
  <summary>Tide: high and low water, 48 hours</summary>
  <table><caption>Predicted tide at Saltmere Quay (synthetic sample data)</caption><thead><tr><th scope="col">Time</th><th scope="col">Event</th><th scope="col">Height</th></tr></thead>
  <tbody>${tides.map((e) => `<tr><td>${clock(e.t)}</td><td>${e.kind}</td><td>${e.h.toFixed(2)} m</td></tr>`).join('')}</tbody></table>
</details>
<details class="table">
  <summary>Sea-surface temperature anomaly by zone</summary>
  <table><caption>Number of zones per anomaly class, ${hexes.length} zones (synthetic sample data)</caption><thead><tr><th scope="col">Anomaly vs baseline</th><th scope="col">Zones</th></tr></thead>
  <tbody>${bins.map(([l, f]) => `<tr><td>${l}</td><td>${hexes.filter((h) => f(h.v)).length}</td></tr>`).join('')}</tbody></table>
</details>
<details class="table">
  <summary>Shoreline change by segment, 1950–2025</summary>
  <table><caption>Cumulative change since 1950, by coast segment (synthetic sample data)</caption><thead><tr><th scope="col">Segment</th>${pick.map((y) => `<th scope="col">${y}</th>`).join('')}</tr></thead>
  <tbody>${sc.map((s) => `<tr><th scope="row">${s.segment}</th>${pick.map((y) => `<td>${fmt(s.values[YEARS.indexOf(y)].m)}</td>`).join('')}</tr>`).join('')}</tbody></table>
</details>`;
}

/** Procedural "field print": layered hills, sea and a low sun. Shared light: sun low on the left, shadows fall right. */
export function landscapeSvg(seed, label) {
  let a = seed >>> 0;
  const r = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
  const ridge = (base, amp, f) => {
    let d = `M0 ${base}`;
    for (let x = 0; x <= 600; x += 20) d += ` L${x} ${(base + Math.sin(x / f + seed) * amp + (r() - 0.5) * amp * 0.5).toFixed(1)}`;
    return d + ' L600 400 L0 400Z';
  };
  return `<svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<circle cx="${140 + r() * 60}" cy="${120 + r() * 30}" r="34" fill="var(--accent-300)"/>
<path d="${ridge(210, 18, 70)}" fill="var(--neutral-300)"/>
<path d="${ridge(240, 14, 45)}" fill="var(--neutral-500)"/>
<rect y="270" width="600" height="130" fill="var(--brand-600)"/>
${Array.from({ length: 7 }, (_, i) => `<path d="M${(r() * 600).toFixed(0)} ${285 + i * 16} h${(40 + r() * 120).toFixed(0)}" stroke="var(--brand-200)" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>`).join('')}
<path d="${ridge(300, 22, 60)}" fill="var(--neutral-800)"/>
<title>${label}</title>
</svg>`;
}
