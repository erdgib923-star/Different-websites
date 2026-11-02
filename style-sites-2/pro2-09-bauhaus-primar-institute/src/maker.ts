/**
 * Composition studio: add primitive shapes, drag them (pointer), move/rotate/resize them with the
 * keyboard, reorder, delete, shuffle, and export the board as a standalone SVG file.
 */
import { NS, drawPiece, shapeElement, study, type Colour, type Kind, type Piece } from './shapes';
import palette from '../palette.config.mjs';
import { gamutMap, oklchToSrgb } from '../scripts/color.mjs';

const hex = (token: string) => {
  const [L, C, H] = palette.colors[token];
  return '#' + oklchToSrgb(L, gamutMap(L, C, H), H).map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
};
const NAMES: Record<Kind, string> = { circle: 'circle', square: 'square', triangle: 'triangle', bar: 'bar', half: 'half-circle' };

export function initMaker() {
  const root = document.querySelector<HTMLElement>('[data-maker]');
  const board = root?.querySelector<SVGSVGElement>('[data-board]');
  const layer = root?.querySelector<SVGGElement>('[data-layer]');
  if (!root || !board || !layer) return;
  const status = root.querySelector<HTMLElement>('[data-maker-status]')!;
  const say = (m: string) => { status.textContent = m; };
  let colour: Colour = 'red';
  let selected: { el: SVGGElement; p: Piece } | null = null;
  const pieces = new Map<SVGGElement, Piece>();

  const label = (p: Piece) => `${p.colour} ${NAMES[p.kind]}`;
  const place = (el: SVGGElement, p: Piece) => {
    el.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rot})`);
  };

  function select(el: SVGGElement | null, focus = false) {
    layer!.querySelectorAll('.piece').forEach((n) => { n.classList.remove('is-selected'); n.setAttribute('aria-pressed', 'false'); });
    selected = el ? { el, p: pieces.get(el)! } : null;
    if (el) { el.classList.add('is-selected'); el.setAttribute('aria-pressed', 'true'); if (focus) el.focus(); }
  }

  function add(p: Piece, announce = true) {
    const g = drawPiece(p);
    g.classList.add('piece');
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-pressed', 'false');
    g.setAttribute('aria-label', `${label(p)}. Arrows move, R rotates, plus and minus resize, Delete removes.`);
    // dashed selection outline sized to the shape
    const sel = shapeElement(p.kind, p.size + 16);
    sel.setAttribute('class', 'sel');
    g.appendChild(sel);
    pieces.set(g, p);
    layer!.appendChild(g);
    if (announce) { select(g, true); say(`Added a ${label(p)}.`); }
    return g;
  }

  const toBoard = (e: PointerEvent) => {
    const m = board!.getScreenCTM()!.inverse();
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
    return { x: pt.x, y: pt.y };
  };
  let drag: { el: SVGGElement; dx: number; dy: number } | null = null;
  board.addEventListener('pointerdown', (e) => {
    const el = (e.target as Element).closest<SVGGElement>('.piece');
    if (!el) { select(null); return; }
    const p = pieces.get(el)!;
    const at = toBoard(e);
    drag = { el, dx: at.x - p.x, dy: at.y - p.y };
    board.setPointerCapture(e.pointerId);
    select(el, true);
    e.preventDefault();
  });
  board.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = pieces.get(drag.el)!;
    const at = toBoard(e);
    p.x = Math.max(0, Math.min(600, at.x - drag.dx));
    p.y = Math.max(0, Math.min(600, at.y - drag.dy));
    place(drag.el, p);
  });
  const endDrag = () => { if (drag) { say(`Moved the ${label(pieces.get(drag.el)!)}.`); drag = null; } };
  board.addEventListener('pointerup', endDrag);
  board.addEventListener('pointercancel', endDrag);

  const act = (name: string) => {
    if (name === 'shuffle') {
      layer!.replaceChildren(); pieces.clear(); select(null);
      study(Math.floor(Math.random() * 1e6)).forEach((p) => add(p, false));
      say(`Shuffled: ${pieces.size} shapes on the board.`);
      return;
    }
    if (name === 'clear') { layer!.replaceChildren(); pieces.clear(); select(null); say('Board cleared.'); return; }
    if (name === 'export') { exportSvg(); return; }
    if (!selected) { say('Select a shape first.'); return; }
    const { el, p } = selected;
    if (name === 'rotate') { p.rot = (p.rot + 45) % 360; place(el, p); say(`Rotated to ${p.rot} degrees.`); }
    if (name === 'grow' || name === 'shrink') {
      const k = name === 'grow' ? 1.15 : 1 / 1.15;
      const next: Piece = { ...p, size: Math.max(20, Math.min(520, p.size * k)) };
      const g = add(next, false);
      layer!.insertBefore(g, el);
      pieces.delete(el); el.remove();
      select(g, true);
      say(`${name === 'grow' ? 'Bigger' : 'Smaller'}: ${Math.round(next.size)} units.`);
    }
    if (name === 'front') { layer!.appendChild(el); el.focus(); say('Brought to front.'); }
    if (name === 'delete') { pieces.delete(el); el.remove(); select(null); say(`Deleted the ${label(p)}.`); }
  };

  board.addEventListener('keydown', (e) => {
    const el = (e.target as Element).closest<SVGGElement>('.piece');
    if (!el) return;
    if (selected?.el !== el) select(el);
    const p = pieces.get(el)!;
    const step = e.shiftKey ? 40 : 10;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (e.key in moves) {
      e.preventDefault();
      p.x = Math.max(0, Math.min(600, p.x + moves[e.key][0]));
      p.y = Math.max(0, Math.min(600, p.y + moves[e.key][1]));
      place(el, p);
    } else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); act('rotate'); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); act('grow'); }
    else if (e.key === '-') { e.preventDefault(); act('shrink'); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); act('delete'); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(el); }
  });
  board.addEventListener('focusin', (e) => { const el = (e.target as Element).closest<SVGGElement>('.piece'); if (el) select(el); });

  function exportSvg() {
    const fills: Record<Colour, string> = { red: hex('red'), blue: hex('blue'), yellow: hex('yellow'), black: hex('black') };
    const out = document.createElementNS(NS, 'svg');
    out.setAttribute('xmlns', NS);
    out.setAttribute('viewBox', '0 0 600 600');
    out.setAttribute('width', '600');
    out.setAttribute('height', '600');
    const bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('width', '600'); bg.setAttribute('height', '600'); bg.setAttribute('fill', hex('paper'));
    out.appendChild(bg);
    layer!.querySelectorAll<SVGGElement>('.piece').forEach((el) => {
      const p = pieces.get(el)!;
      const g = drawPiece(p);
      const shape = g.firstElementChild!;
      shape.removeAttribute('class');
      shape.setAttribute('fill', fills[p.colour]);
      out.appendChild(g);
    });
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(out)}`], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'primar-composition.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    say(`Exported ${pieces.size} shapes as primar-composition.svg.`);
  }

  root.querySelectorAll<HTMLButtonElement>('[data-add]').forEach((b) => b.addEventListener('click', () => {
    const kind = b.dataset.add as Kind;
    add({ kind, colour, x: 200 + Math.random() * 200, y: 200 + Math.random() * 200, size: kind === 'bar' ? 140 : 150, rot: 0 });
  }));
  root.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((b) => b.addEventListener('click', () => act(b.dataset.act!)));
  const radios = [...root.querySelectorAll<HTMLButtonElement>('[data-col]')];
  const pick = (r: HTMLButtonElement, focus = false) => {
    radios.forEach((x) => { x.setAttribute('aria-checked', String(x === r)); x.tabIndex = x === r ? 0 : -1; });
    colour = r.dataset.col as Colour;
    if (focus) r.focus();
    say(`${r.getAttribute('aria-label')} selected.`);
  };
  radios.forEach((r, i) => {
    r.tabIndex = i === 0 ? 0 : -1;
    r.addEventListener('click', () => pick(r));
    r.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      pick(radios[(i + d + radios.length) % radios.length], true);
    });
  });

  // Start with a small composition so the board is never empty.
  study(2026).forEach((p) => add(p, false));
}
