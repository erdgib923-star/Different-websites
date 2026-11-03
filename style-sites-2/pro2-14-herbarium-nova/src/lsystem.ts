/**
 * L-system plants. A grammar is rewritten n times, then a turtle walks the string:
 *   F  forward (draws)    +/-  turn by the angle    [ ]  push / pop the turtle
 * The whole plant becomes ONE SVG path in turtle order. Because dashes run continuously along a
 * path (moveTo gaps add no length), revealing stroke-dashoffset from 1 → 0 draws the plant stroke
 * by stroke, exactly in the order it grew. Every leaf, flower and label target records its
 * position along that length as a fraction f (0..1), so it can appear the moment the pen gets there.
 */
export interface Spec {
  name: string;
  axiom: string;
  rules: Record<string, string>;
  angle: number;
  iterations: number;
  jitter: number;
  seed: number;
  flowerEvery: number; // a flower at every nth branch tip (0 = none)
}
export interface Mark { x: number; y: number; a: number; f: number }
export interface Plant { d: string; leaves: Mark[]; flowers: Mark[]; labels: { leaf: Mark; node: Mark; root: Mark }; w: number; h: number }

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function expand(spec: Spec): string {
  let s = spec.axiom;
  for (let i = 0; i < spec.iterations; i++) {
    let out = '';
    for (const ch of s) out += spec.rules[ch] ?? ch;
    s = out;
    if (s.length > 120_000) break;
  }
  return s;
}

export function grow(spec: Spec, W = 400, H = 520, margin = 34): Plant {
  const r = rng(spec.seed);
  const str = expand(spec);
  type Seg = [number, number, number, number, number]; // x1 y1 x2 y2 cumulative-length-at-end
  const segs: Seg[] = [];
  const tips: { x: number; y: number; a: number; at: number }[] = [];
  const nodes: { x: number; y: number; at: number }[] = [];
  let x = 0, y = 0, a = -90, len = 0;
  const stack: [number, number, number][] = [];
  const toRad = Math.PI / 180;
  for (const ch of str) {
    if (ch === 'F') {
      const nx = x + Math.cos(a * toRad), ny = y + Math.sin(a * toRad);
      len += 1;
      segs.push([x, y, nx, ny, len]);
      x = nx; y = ny;
    } else if (ch === '+') a += spec.angle + (r() - 0.5) * spec.jitter;
    else if (ch === '-') a -= spec.angle + (r() - 0.5) * spec.jitter;
    else if (ch === '[') { stack.push([x, y, a]); nodes.push({ x, y, at: len }); }
    else if (ch === ']') { tips.push({ x, y, a, at: len }); [x, y, a] = stack.pop()!; }
  }
  tips.push({ x, y, a, at: len });
  // Fit into the plate.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x1, y1, x2, y2] of segs) { minX = Math.min(minX, x1, x2); maxX = Math.max(maxX, x1, x2); minY = Math.min(minY, y1, y2); maxY = Math.max(maxY, y1, y2); }
  const s = Math.min((W - margin * 2) / (maxX - minX || 1), (H - margin * 2) / (maxY - minY || 1));
  const ox = (W - (maxX - minX) * s) / 2 - minX * s, oy = (H - (maxY - minY) * s) / 2 - minY * s;
  const X = (v: number) => +(v * s + ox).toFixed(1), Y = (v: number) => +(v * s + oy).toFixed(1);
  let d = '', px = NaN, py = NaN;
  for (const [x1, y1, x2, y2] of segs) {
    const a1 = X(x1), b1 = Y(y1), a2 = X(x2), b2 = Y(y2);
    if (a1 !== px || b1 !== py) d += `M${a1} ${b1}`;
    d += `L${a2} ${b2}`;
    px = a2; py = b2;
  }
  const total = len || 1;
  // Keep the plate legible: at most ~160 leaves, sampled evenly along the drawing order.
  const step = Math.max(1, Math.ceil(tips.length / 160));
  const leaves = tips.filter((_, i) => i % step === 0).map((t) => ({ x: X(t.x), y: Y(t.y), a: t.a, f: t.at / total }));
  const flowers = spec.flowerEvery ? leaves.filter((_, i) => i % spec.flowerEvery === spec.flowerEvery - 1) : [];
  const top = leaves.reduce((m, l) => (l.y < m.y ? l : m), leaves[0]);
  const midNode = nodes.reduce((m, n) => (Math.abs(n.at / total - 0.35) < Math.abs(m.at / total - 0.35) ? n : m), nodes[0] ?? { x: 0, y: 0, at: 0 });
  return {
    d, leaves, flowers, w: W, h: H,
    labels: {
      leaf: top,
      node: { x: X(midNode.x), y: Y(midNode.y), a: 0, f: midNode.at / total },
      root: { x: X(0), y: Y(0), a: 0, f: 0.002 },
    },
  };
}

export const SPECIES: Record<string, Spec> = {
  filix: { name: 'Nova filix', axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, angle: 25, iterations: 5, jitter: 6, seed: 11, flowerEvery: 0 },
  cordata: { name: 'Lumen cordata', axiom: 'F', rules: { F: 'FF-[-F+F+F]+[+F-F-F]' }, angle: 22.5, iterations: 4, jitter: 5, seed: 23, flowerEvery: 9 },
  arborea: { name: 'Sepia arborea', axiom: 'X', rules: { X: 'F[+X]F[-X]+X', F: 'FF' }, angle: 20, iterations: 6, jitter: 7, seed: 37, flowerEvery: 7 },
  spiralis: { name: 'Verdigris spiralis', axiom: 'X', rules: { X: 'F[+X][-X]FX', F: 'FF' }, angle: 25.7, iterations: 6, jitter: 4, seed: 41, flowerEvery: 11 },
  ventosa: { name: 'Ventosa minor', axiom: 'F', rules: { F: 'F[+F]F[-F]F' }, angle: 25.7, iterations: 4, jitter: 8, seed: 53, flowerEvery: 6 },
  candela: { name: 'Candela repens', axiom: 'X', rules: { X: 'F-[[X]+X]+F[+FX]-X', F: 'FF' }, angle: 22.5, iterations: 5, jitter: 6, seed: 67, flowerEvery: 13 },
};
