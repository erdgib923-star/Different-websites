// Mossmere botanicals, drawn in code. Shared by the browser (animation) and vite.config.ts
// (which injects the first frame as static SVG so everything is visible without JavaScript).
// Lighting rule for every plant: light from the top-left, so the upper-left half of each leaf
// is the paler tone and cast shadows fall down-right in a tinted moss shade.

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => n.toFixed(1);

/** Organic blob: N control points on a wobbling circle, joined with a closed Catmull-Rom → Bézier spline. */
export function blobPath(seed, t = 0, { cx = 300, cy = 300, r = 220, wobble = 0.16, n = 9 } = {}) {
  const R = rng(seed);
  const ph = Array.from({ length: n }, () => [R() * 6.28, R() * 6.28, 0.6 + R() * 0.8]);
  const pts = ph.map(([a, b, s], i) => {
    const ang = (i / n) * Math.PI * 2;
    const k = 1 + wobble * (Math.sin(t * 0.55 * s + a) * 0.65 + Math.sin(t * 0.9 * s + b) * 0.35);
    return [cx + Math.cos(ang) * r * k, cy + Math.sin(ang) * r * k];
  });
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

/** One leaf as two paths (pale upper-left half, deeper lower-right half) plus a midrib. */
function leaf(x, y, angle, len, width) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const P = (u, v) => [x + c * u - s * v, y + s * u + c * v];
  const tip = P(len, 0), a = P(len * 0.45, -width), b = P(len * 0.45, width);
  const base = [x, y];
  const halfA = `M${f(base[0])} ${f(base[1])} Q${f(a[0])} ${f(a[1])} ${f(tip[0])} ${f(tip[1])} Z`;
  const halfB = `M${f(base[0])} ${f(base[1])} Q${f(b[0])} ${f(b[1])} ${f(tip[0])} ${f(tip[1])} Z`;
  // half A's outward normal is (sin, -cos); it catches the top-left light (-1, -1) when cos > sin
  const upperIsA = c > s;
  return `<path class="lf-light" d="${upperIsA ? halfA : halfB}"/><path class="lf-shade" d="${upperIsA ? halfB : halfA}"/><path class="lf-rib" d="M${f(base[0])} ${f(base[1])} L${f(tip[0])} ${f(tip[1])}"/>`;
}

/**
 * A sprig: a curved stem with alternating leaves. variant: 'fern' (many small pinnae),
 * 'willow' (long narrow leaves), 'round' (pilea-like discs). Returns inner SVG markup for a
 * 200 × 400 viewBox whose base is at (100, 395), the rotation origin for the scroll sway.
 */
export function sprigSvg(seed, variant = 'willow') {
  const R = rng(seed);
  const bend = (R() - 0.5) * 70;
  const stem = (t) => [100 + bend * Math.sin(t * Math.PI * 0.5) * t, 395 - t * 360];
  let out = `<path class="stem" d="M100 395 Q${f(100 + bend * 0.8)} 215 ${f(stem(1)[0])} ${f(stem(1)[1])}"/>`;
  const count = variant === 'fern' ? 22 : variant === 'round' ? 9 : 12;
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const [x, y] = stem(t);
    const side = i % 2 ? 1 : -1;
    const up = -Math.PI / 2;
    if (variant === 'round') {
      const rr = 14 + (1 - t) * 14 + R() * 4;
      const cx = x + side * (rr + 6), cy = y - 4;
      out += `<path class="stem" d="M${f(x)} ${f(y)} L${f(cx - side * rr * 0.7)} ${f(cy)}"/><circle class="lf-shade" cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}"/><path class="lf-light" d="M${f(cx - rr)} ${f(cy)} A${f(rr)} ${f(rr)} 0 0 1 ${f(cx + rr)} ${f(cy)} Z"/>`;
    } else {
      const len = variant === 'fern' ? 34 + (1 - Math.abs(t - 0.45) * 1.6) * 30 : 70 + R() * 30 - t * 30;
      const width = variant === 'fern' ? 6 : 12 + R() * 4;
      const ang = up + side * (variant === 'fern' ? 1.25 : 0.75 + R() * 0.25);
      out += leaf(x, y, ang, len, width);
      if (variant === 'fern') out += leaf(x, y, up - side * 1.25, len * 0.9, width);
    }
  }
  return out;
}

/** Procedural "window onto the garden" artwork for cabin slots: arch, sky, hills and sprigs. */
export function cabinArt(seed, variant) {
  const R = rng(seed);
  const hill = (base, amp) => {
    let d = `M0 ${base}`;
    for (let x = 0; x <= 400; x += 25) d += ` L${x} ${f(base + Math.sin(x / 60 + seed) * amp + (R() - 0.5) * amp)}`;
    return d + ' L400 500 L0 500Z';
  };
  return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<rect width="400" height="500" class="art-sky"/>
<circle cx="${f(110 + R() * 60)}" cy="${f(120 + R() * 40)}" r="34" class="art-orb"/>
<path d="${hill(300, 24)}" class="art-hill-far"/>
<path d="${hill(350, 18)}" class="art-hill"/>
<g transform="translate(${f(20 + R() * 40)} 160) scale(0.85)" class="sprig">${sprigSvg(seed + 1, variant)}</g>
<g transform="translate(${f(230 + R() * 40)} 210) scale(0.7)" class="sprig">${sprigSvg(seed + 2, variant === 'fern' ? 'round' : 'fern')}</g>
<path d="M0 0 H400 V500 H0Z M60 500 V200 A140 140 0 0 1 340 200 V500Z" class="art-frame" fill-rule="evenodd"/>
</svg>`;
}
