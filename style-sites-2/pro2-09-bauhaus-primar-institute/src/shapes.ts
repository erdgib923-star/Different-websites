/** Shared shape vocabulary for the generated studies and the composition studio. */
export type Kind = 'circle' | 'square' | 'triangle' | 'bar' | 'half';
export type Colour = 'red' | 'blue' | 'yellow' | 'black';
export const NS = 'http://www.w3.org/2000/svg';

/** Geometry for each kind, centred on (0,0) with base size s. */
export function shapeElement(kind: Kind, s: number): SVGElement {
  let el: SVGElement;
  if (kind === 'circle') {
    el = document.createElementNS(NS, 'circle');
    el.setAttribute('r', String(s / 2));
  } else if (kind === 'square') {
    el = document.createElementNS(NS, 'rect');
    el.setAttribute('x', String(-s / 2)); el.setAttribute('y', String(-s / 2));
    el.setAttribute('width', String(s)); el.setAttribute('height', String(s));
  } else if (kind === 'triangle') {
    el = document.createElementNS(NS, 'path');
    el.setAttribute('d', `M0 ${-s / 2}L${s / 2} ${s / 2}L${-s / 2} ${s / 2}Z`);
  } else if (kind === 'bar') {
    el = document.createElementNS(NS, 'rect');
    el.setAttribute('x', String(-s)); el.setAttribute('y', String(-s / 12));
    el.setAttribute('width', String(s * 2)); el.setAttribute('height', String(s / 6));
  } else {
    el = document.createElementNS(NS, 'path');
    el.setAttribute('d', `M${-s / 2} ${s / 4}a${s / 2} ${s / 2} 0 01${s} 0z`);
  }
  return el;
}

export function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Piece { kind: Kind; colour: Colour; x: number; y: number; size: number; rot: number }

/** A "study": up to seven shapes snapped to a 6 × 6 grid, one dominant shape, primaries + black. */
export function study(seed: number, w = 600, h = 600): Piece[] {
  const r = mulberry32(seed);
  const kinds: Kind[] = ['circle', 'square', 'triangle', 'bar', 'half'];
  const colours: Colour[] = ['red', 'blue', 'yellow', 'black'];
  const cell = Math.min(w, h) / 6;
  const pieces: Piece[] = [];
  const n = 4 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const big = i === 0;
    pieces.push({
      kind: kinds[Math.floor(r() * kinds.length)],
      colour: big ? (['red', 'blue', 'yellow'] as Colour[])[Math.floor(r() * 3)] : colours[Math.floor(r() * colours.length)],
      x: (1 + Math.floor(r() * 5)) * cell,
      y: (1 + Math.floor(r() * 5)) * cell * (h / w),
      size: big ? cell * (3 + r() * 1.5) : cell * (0.6 + r() * 1.6),
      rot: [0, 0, 45, 90, -30, 15][Math.floor(r() * 6)],
    });
  }
  return pieces;
}

export function drawPiece(p: Piece): SVGGElement {
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${p.rot})`);
  const el = shapeElement(p.kind, p.size);
  el.setAttribute('class', `s-${p.colour}`);
  g.appendChild(el);
  return g;
}
