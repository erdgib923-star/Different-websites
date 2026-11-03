// Builds the hand-made SVG sea chart of the (fictional) Lanternfall Isles and writes it into
// index.html between <!-- map:start --> and <!-- map:end -->. No tiles, no external data:
// every coastline is a seeded noisy circle smoothed with Catmull-Rom curves.
//   node scripts/build-map.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const W = 1600, H = 1000;
const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const f = (n) => Math.round(n * 10) / 10;

/** Catmull-Rom through points -> cubic Bezier path. */
function smooth(pts, closed) {
  const n = pts.length;
  const at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}

/** A coastline: a circle whose radius wanders by a few low-frequency harmonics. */
function coast(cx, cy, r, seed, scale = 1, stretch = [1, 1]) {
  const R = rng(seed);
  const harm = [2, 3, 5, 7].map((k) => ({ k, a: (0.22 / k) * (0.6 + R()), p: R() * Math.PI * 2 }));
  const pts = [];
  const N = 40;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    let m = 1;
    for (const h of harm) m += h.a * Math.sin(h.k * t + h.p);
    pts.push([cx + Math.cos(t) * r * m * scale * stretch[0], cy + Math.sin(t) * r * m * scale * stretch[1]]);
  }
  return smooth(pts, true);
}

const ISLANDS = [
  { name: 'Saltmarrow', x: 200, y: 790, r: 100, seed: 11, st: [1.25, 0.8], lx: 150, ly: 930 },
  { name: 'Quill Island', x: 520, y: 500, r: 68, seed: 23, st: [0.8, 1.2], lx: 520, ly: 390 },
  { name: 'Brannock Reef', x: 770, y: 800, r: 40, seed: 37, st: [1.5, 0.6], lx: 770, ly: 880, reef: true },
  { name: 'Hollow Skerry', x: 990, y: 400, r: 56, seed: 41, st: [1, 1], lx: 1000, ly: 300 },
  { name: 'Ember Cay', x: 1240, y: 680, r: 82, seed: 53, st: [1.15, 0.9], lx: 1250, ly: 815 },
  { name: 'Farlight', x: 1410, y: 240, r: 70, seed: 67, st: [0.9, 1.1], lx: 1470, ly: 370 },
];
// The route: waypoints (anchorages, w: index) with bends between them.
const ROUTE = [
  { x: 310, y: 705, w: 0 }, { x: 400, y: 680 }, { x: 468, y: 588, w: 1 }, { x: 600, y: 650 },
  { x: 715, y: 742, w: 2 }, { x: 820, y: 640 }, { x: 935, y: 470, w: 3 }, { x: 1050, y: 560 },
  { x: 1150, y: 618, w: 4 }, { x: 1300, y: 520 }, { x: 1345, y: 318, w: 5 },
];

const out = [];
out.push(`<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="chart-title chart-desc" data-chart>`);
out.push(`<title id="chart-title">Chart of the Lanternfall Isles</title>`);
out.push(`<desc id="chart-desc">Six islands from Saltmarrow in the south-west to Farlight in the north-east. A coral route links six numbered anchorages: Saltmarrow, Quill Island, Brannock Reef, Hollow Skerry, Ember Cay and Farlight.</desc>`);
out.push(`<defs>
  <pattern id="waves" width="90" height="56" patternUnits="userSpaceOnUse"><path class="wave" d="M8 18q7-6 14 0t14 0M52 46q7-6 14 0t14 0" /></pattern>
  <pattern id="reef" width="10" height="10" patternUnits="userSpaceOnUse"><circle class="reef-dot" cx="5" cy="5" r="1.3" /></pattern>
</defs>`);
out.push(`<rect class="sea" x="-1600" y="-1000" width="${W * 3}" height="${H * 3}" />`);
out.push(`<rect class="sea-tex" x="-1600" y="-1000" width="${W * 3}" height="${H * 3}" fill="url(#waves)" />`);
// Graticule
const grat = [];
for (let x = 0; x <= W; x += 200) grat.push(`M${x} -1000V${H + 1000}`);
for (let y = 0; y <= H; y += 200) grat.push(`M-1600 ${y}H${W + 1600}`);
out.push(`<path class="graticule" d="${grat.join('')}" />`);
// Islands
out.push('<g class="islands">');
for (const is of ISLANDS) {
  out.push(`<g class="island${is.reef ? ' island--reef' : ''}">`);
  out.push(`<path class="shoal shoal--2" d="${coast(is.x, is.y, is.r, is.seed, 1.55, is.st)}" />`);
  out.push(`<path class="shoal" d="${coast(is.x, is.y, is.r, is.seed, 1.25, is.st)}" />`);
  if (is.reef) out.push(`<path class="reef" d="${coast(is.x, is.y, is.r, is.seed, 1.12, is.st)}" />`);
  out.push(`<path class="land" d="${coast(is.x, is.y, is.r, is.seed, 1, is.st)}" />`);
  if (!is.reef) out.push(`<path class="hill" d="${coast(is.x + is.r * 0.1, is.y - is.r * 0.08, is.r, is.seed + 5, 0.5, is.st)}" />`);
  out.push(`<text class="label" x="${is.lx}" y="${is.ly}" text-anchor="middle">${is.name}</text>`);
  out.push('</g>');
}
out.push('</g>');
// Lighthouse on Farlight
out.push(`<g class="lighthouse" transform="translate(1428 222)"><path d="M-6 18L-3-14H3L6 18Z" /><circle cx="0" cy="-18" r="5" /></g>`);
// Sea names
out.push(`<text class="seaname" x="640" y="300" text-anchor="middle">The Glass Sound</text>`);
out.push(`<text class="seaname" x="1060" y="905" text-anchor="middle">Lantern Reach</text>`);
// Route: planned (dashed, full) + sailed (solid, revealed by JS)
const rd = smooth(ROUTE.map((p) => [p.x, p.y]), false);
out.push(`<path class="route-plan" d="${rd}" />`);
out.push(`<path class="route" d="${rd}" data-route />`);
// Waypoint markers
ROUTE.filter((p) => p.w !== undefined).forEach((p) => {
  out.push(`<g class="wp" data-wp="${p.w}" transform="translate(${p.x} ${p.y})"><g class="wp__in"><circle r="16" /><text y="6" text-anchor="middle">${p.w + 1}</text></g></g>`);
});
// Boat
out.push(`<g class="boat" data-boat transform="translate(1345 318)"><g data-boat-rot><path class="boat__hull" d="M-9 6H9L6 11H-6Z" /><path class="boat__sail" d="M0 4V-16L10 4Z" /></g></g>`);
// Compass rose
out.push(`<g class="rose" transform="translate(1440 830)">
  <circle r="82" class="rose__ring" /><circle r="64" class="rose__ring rose__ring--in" />
  <path class="rose__star" d="M0-78L10-10L78 0L10 10L0 78L-10 10L-78 0L-10-10Z" />
  <path class="rose__star rose__star--minor" d="M38-38L6 0L38 38L0 6L-38 38L-6 0L-38-38L0-6Z" />
  <text class="rose__n" y="-90" text-anchor="middle">N</text>
  <g class="rose__needle" data-needle><path d="M0-56L7 0H-7Z" class="needle-n" /><path d="M0 56L7 0H-7Z" class="needle-s" /></g>
  <circle r="5" class="rose__pin" />
</g>`);
// Scale bar and cartouche
out.push(`<g class="scale" transform="translate(70 70)"><path d="M0 0H240M0-8V8M120-6V6M240-8V8" /><rect x="0" y="-3" width="120" height="6" /><text x="0" y="30">0</text><text x="120" y="30" text-anchor="middle">10</text><text x="240" y="30" text-anchor="end">20 nautical miles</text></g>`);
out.push('</svg>');

const svg = out.join('\n');
const html = readFileSync('index.html', 'utf8');
const a = '<!-- map:start -->', b = '<!-- map:end -->';
const i = html.indexOf(a), j = html.indexOf(b);
if (i < 0 || j < 0) throw new Error('map markers not found in index.html');
let next = html.slice(0, i + a.length) + '\n' + svg + '\n' + html.slice(j);
// Hero compass rose ticks: 72 marks, longer every 30 degrees.
const ticks = [];
for (let k = 0; k < 72; k++) {
  const t = (k / 72) * Math.PI * 2, r0 = k % 6 === 0 ? 150 : 162;
  ticks.push(`M${f(Math.sin(t) * r0)} ${f(-Math.cos(t) * r0)}L${f(Math.sin(t) * 170)} ${f(-Math.cos(t) * 170)}`);
}
next = next.replace(/<g class="br-ticks">[\s\S]*?<\/g>/, `<g class="br-ticks"><path d="${ticks.join('')}" /></g>`);
writeFileSync('index.html', next);
console.log(`map written (${svg.length} bytes)`);
