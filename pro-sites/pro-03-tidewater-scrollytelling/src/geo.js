// Shoalreach: deterministic, code-generated geography and SYNTHETIC SAMPLE DATA.
// Nothing here describes a real place. Used both in the browser and at build time
// (vite.config.ts pre-renders a static map + data tables so the page works without JS).
import { contours } from 'd3-contour';
import { geoPath, geoIdentity } from 'd3-geo';

export const W = 800, H = 600, GW = 160, GH = 120;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// value noise on a fixed lattice
const R = rng(1953);
const LAT = Array.from({ length: 64 * 64 }, () => R());
const lat = (i, j) => LAT[((j & 63) << 6) | (i & 63)];
function noise(x, y) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = lat(i, j), b = lat(i + 1, j), c = lat(i, j + 1), d = lat(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) {
  let s = 0, amp = 0.5;
  for (let o = 0; o < 5; o++) { s += amp * noise(x, y); x *= 2.03; y *= 2.03; amp *= 0.5; }
  return s - 0.5;
}

export const shoreBase = (x) => 250 + 55 * Math.sin(x / 140 + 0.6) + 22 * Math.sin(x / 47 + 1.3);
const riverX = (y) => 395 + 26 * Math.sin(y / 55) + 10 * Math.sin(y / 17);
export const islands = [
  { name: 'Brine Holm', x: 575, y: 478, r: 46, h: 1.5 },
  { name: 'Little Holm', x: 238, y: 508, r: 26, h: 1.0 },
  { name: 'Gull Skerry', x: 705, y: 430, r: 16, h: 0.8 },
];

/** elevation (> 0 land, < 0 sea, roughly −3…+3) */
export function height(x, y) {
  let h = (shoreBase(x) - y) / 70 + 0.75 * fbm(x / 110, y / 110);
  for (const isl of islands) {
    const d2 = ((x - isl.x) ** 2 + (y - isl.y) ** 2) / (isl.r * isl.r);
    h += isl.h * Math.exp(-d2 * 1.4) * 5.2;
  }
  // Kessock Water estuary: a channel that widens toward the sea
  const coastY = shoreBase(riverX(y));
  if (y < coastY + 30) {
    const width = 8 + Math.max(0, (y - (coastY - 160)) * 0.12);
    const dx = x - riverX(y);
    h -= 2.2 * Math.exp(-(dx * dx) / (2 * width * width)) * Math.min(1, Math.max(0, (y + 20) / 80));
  }
  // deepen offshore
  const off = Math.max(0, y - shoreBase(x) - 40);
  const wx = x + 60 * fbm(x / 160 + 3, y / 160), wy = y + 60 * fbm(x / 160, y / 160 + 7);
  h -= off / 210 + Math.min(1, off / 120) * (1.7 * fbm(wx / 90 + 9, wy / 90) + 0.3);
  return h;
}

export function grid() {
  const values = new Float64Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) values[j * GW + i] = height((i + 0.5) * (W / GW), (j + 0.5) * (H / GH));
  return values;
}

const projection = geoIdentity().scale(W / GW);
export const path = geoPath(projection);

/** Depth thresholds (elevation, metres-ish) → 6 bands, shallow → deep. */
export const DEPTH_T = [-0.5, -1.1, -1.7, -2.3, -2.9];
export const DEPTH_LABELS = ['0–5 m', '5–11 m', '11–17 m', '17–23 m', '23–29 m', '> 29 m'];

export function layers() {
  const values = grid();
  const c = contours().size([GW, GH]);
  // painter's order: deepest first is the background rect; each contour(t) = area with value >= t
  const depth = [...DEPTH_T].reverse().map((t) => ({ t, d: path(c.contour(values, t)) }));
  const land = path(c.contour(values, 0));
  const hills = [0.7, 1.4, 2.1].map((t) => path(c.contour(values, t)));
  return { depth, land, hills };
}

/** Coast profile: N points scanned from sea toward land (used for the morph and the shoreline chapter). */
export function coastProfile(N = 200) {
  const pts = [];
  for (let k = 0; k < N; k++) {
    const x = 20 + (k * (W - 40)) / (N - 1);
    let y = Math.min(H - 2, shoreBase(x) + 75);
    while (y > 0 && height(x, y) < 0) y -= 1;
    pts.push([x, y]);
  }
  // light smoothing
  return pts.map((p, i) => {
    let sum = 0, n = 0;
    for (let k = -4; k <= 4; k++) { const q = pts[Math.min(N - 1, Math.max(0, i + k))]; sum += q[1]; n++; }
    return [p[0], sum / n];
  });
}

export const places = [
  { name: 'Saltmere', x: 210, y: 150, kind: 'town' },
  { name: 'Cairnhead', x: 640, y: 120, kind: 'town' },
  { name: 'Gannet Point', x: 104, y: 262, kind: 'point' },
  { name: 'Kessock Water', x: 455, y: 110, kind: 'river' },
  { name: 'Ravel Sands', x: 706, y: 170, kind: 'point' },
  { name: 'The Shoal', x: 400, y: 545, kind: 'sea' },
  ...islands.map((i) => ({ name: i.name, x: i.x, y: i.y + i.r * 1.15 + 6, kind: 'island' })),
];

// ---------------- SAMPLE DATA ----------------

/** Tide height (m above chart datum) over 48 h at 15-minute steps. Synthetic harmonic sum. */
export function tide() {
  const out = [];
  for (let k = 0; k <= 48 * 4; k++) {
    const t = k / 4;
    const h = 2.2 + 1.55 * Math.cos((2 * Math.PI * (t - 4.1)) / 12.42) + 0.42 * Math.cos((2 * Math.PI * (t - 3.0)) / 12) + 0.14 * Math.cos((2 * Math.PI * (t - 7)) / 23.93);
    out.push({ t, h: +h.toFixed(2) });
  }
  return out;
}
export function tideExtremes(series = tide()) {
  const ex = [];
  for (let i = 1; i < series.length - 1; i++) {
    const [a, b, c] = [series[i - 1].h, series[i].h, series[i + 1].h];
    if (b > a && b >= c) ex.push({ ...series[i], kind: 'High water' });
    if (b < a && b <= c) ex.push({ ...series[i], kind: 'Low water' });
  }
  return ex;
}
export const clock = (t) => {
  const day = t < 24 ? 'Sat' : 'Sun';
  const hh = Math.floor(t % 24), mm = Math.round((t % 1) * 60);
  return `${day} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

/** Sea-surface temperature anomaly (°C vs a fictional 1991–2020 baseline) on a hex grid over water. */
export function anomalyHexes(r = 22) {
  const rr = rng(77);
  const out = [];
  const dx = r * Math.sqrt(3), dy = r * 1.5;
  for (let row = 0, y = r; y < H + r; row++, y += dy) {
    for (let x = (row % 2 ? dx / 2 : 0); x < W + dx; x += dx) {
      if (height(x, y) > -0.25) continue;
      const v = -0.9 + 2.6 * (x / W) + 0.9 * Math.sin(y / 90) - 0.25 * Math.max(0, -height(x, y) - 1.5) + (rr() - 0.5) * 0.7;
      out.push({ x, y, v: +v.toFixed(1) });
    }
  }
  return out;
}
export const hexPath = (r = 22) => {
  const p = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    p.push(`${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${p.join('L')}Z`;
};
export const ANOM_T = [-1.5, -0.9, -0.3, 0.3, 0.9, 1.5];

/** Cumulative shoreline change (m, + = land lost) for 8 coast segments, 1950–2025 every 5 years. */
export const SEGMENTS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const YEARS = Array.from({ length: 16 }, (_, i) => 1950 + i * 5);
const RATES = [0.9, 1.7, -0.5, 2.3, 0.6, -0.9, 1.3, 0.4];
export function shoreChange() {
  const rr = rng(2025);
  return SEGMENTS.map((s, i) => ({
    segment: s,
    values: YEARS.map((y) => {
      const n = y - 1950;
      return { year: y, m: Math.round(RATES[i] * n * (1 + 0.006 * n) + (n ? (rr() - 0.5) * 6 : 0)) };
    }),
  }));
}
export const M_PER_PX = 4; // map scale used to draw historic shorelines
