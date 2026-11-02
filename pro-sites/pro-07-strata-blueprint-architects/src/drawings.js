// Plinthwell technical drawings, generated in code (used by vite.config.ts to pre-render SVG).
// Conventions: every stroke that should "draw on" has class="draw" and pathLength="1";
// dimension callouts are grouped in <g class="dim"> so they can pop in. Lighting rule: light from
// the top-left, so shadows are hatched on the right-hand / underside faces.

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Math.round(n * 10) / 10;
const line = (d, cls = 'draw') => `<path class="${cls}" pathLength="1" d="${d}"/>`;
const rect = (x, y, w, h, cls = 'draw') => line(`M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`, cls);

/** horizontal dimension string with ticks and a label (mm) */
function dimH(x1, x2, y, label) {
  return `<g class="dim"><path class="dim-line" d="M${f(x1)} ${y}H${f(x2)}M${f(x1)} ${y - 6}V${y + 6}M${f(x2)} ${y - 6}V${y + 6}M${f(x1 - 4)} ${y + 4}l8 -8M${f(x2 - 4)} ${y + 4}l8 -8"/><text x="${f((x1 + x2) / 2)}" y="${y - 8}" text-anchor="middle">${label}</text></g>`;
}
function dimV(y1, y2, x, label) {
  return `<g class="dim"><path class="dim-line" d="M${x} ${f(y1)}V${f(y2)}M${x - 6} ${f(y1)}H${x + 6}M${x - 6} ${f(y2)}H${x + 6}M${x - 4} ${f(y1 + 4)}l8 -8M${x - 4} ${f(y2 + 4)}l8 -8"/><text x="${x + 10}" y="${f((y1 + y2) / 2 + 4)}">${label}</text></g>`;
}

const mm = (n) => String(Math.round(n / 100) * 100).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const HATCH = `<pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V8" class="hatch-line"/></pattern>`;

/**
 * Front elevation. state: 'clean' | 'weathered' | 'restored'.
 * Returns full <svg> markup (viewBox 800 × 500).
 */
export function elevation(seed, { state = 'clean', dims = true, roof } = {}) {
  const R = rng(seed);
  const floors = 3 + Math.floor(R() * 2);
  const fh = 300 / floors;
  const x0 = 140, x1 = 600, ground = 440, top = ground - floors * fh;
  const roofType = roof ?? ['flat', 'saw', 'pitch'][Math.floor(R() * 3)];
  let s = `<defs>${HATCH}</defs>`;
  s += line(`M40 ${ground}H760`, 'draw ground');
  // annex to the right, set back: shadow hatched under the main block's edge
  const ax0 = x1, ax1 = x1 + 110, atop = ground - fh * 1.4;
  s += `<rect x="${ax0}" y="${f(atop)}" width="16" height="${f(ground - atop)}" fill="url(#hatch)" class="shade"/>`;
  s += rect(ax0, atop, ax1 - ax0, ground - atop);
  // cast shadow on the ground to the right
  s += `<path d="M${ax1} ${ground}l42 -0 l-30 -26 h-12Z" fill="url(#hatch)" class="shade"/>`;
  s += rect(x0, top, x1 - x0, ground - top);
  s += rect(x0 - 6, ground - 18, x1 - x0 + 12, 18); // plinth
  for (let i = 1; i < floors; i++) s += line(`M${x0} ${f(ground - i * fh)}H${x1}`, 'draw thin');
  // roof
  if (roofType === 'flat') s += rect(x0 - 4, top - 14, x1 - x0 + 8, 14);
  else if (roofType === 'saw') {
    let d = `M${x0} ${f(top)}`;
    const n = 4, w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) d += ` L${f(x0 + i * w)} ${f(top - 46)} L${f(x0 + (i + 1) * w)} ${f(top)}`;
    s += line(d);
  } else s += line(`M${x0 - 12} ${f(top)}L${f((x0 + x1) / 2)} ${f(top - 90)}L${x1 + 12} ${f(top)}`);
  // windows
  const cols = 5 + Math.floor(R() * 2);
  const ww = (x1 - x0) / cols;
  for (let fl = 0; fl < floors; fl++) {
    for (let c = 0; c < cols; c++) {
      const wx = x0 + c * ww + ww * 0.22, wy = ground - (fl + 1) * fh + fh * 0.22, w = ww * 0.56, h = fh * 0.56;
      if (fl === 0 && c === Math.floor(cols / 2)) {
        s += rect(x0 + c * ww + ww * 0.15, ground - fh * 0.8, ww * 0.7, fh * 0.8 - 18, state === 'restored' ? 'draw accent' : 'draw');
        continue;
      }
      s += rect(wx, wy, w, h, state === 'restored' ? 'draw accent' : 'draw thin');
      s += line(`M${f(wx + w / 2)} ${f(wy)}V${f(wy + h)}`, 'draw thin');
      // under-sill shadow (light from above-left)
      s += `<rect x="${f(wx)}" y="${f(wy + h)}" width="${f(w)}" height="4" fill="url(#hatch)" class="shade"/>`;
      if (state === 'weathered' && R() < 0.45) s += line(`M${f(wx)} ${f(wy)}L${f(wx + w)} ${f(wy + h)}M${f(wx + w)} ${f(wy)}L${f(wx)} ${f(wy + h)}`, 'draw thin');
    }
  }
  if (state === 'weathered') {
    for (let k = 0; k < 4; k++) {
      let x = x0 + 30 + R() * (x1 - x0 - 60), y = top + R() * 60, d = `M${f(x)} ${f(y)}`;
      for (let j = 0; j < 6; j++) {
        x += (R() - 0.5) * 18;
        y += 12 + R() * 14;
        d += ` L${f(x)} ${f(y)}`;
      }
      s += line(d, 'draw crack');
    }
    s += `<rect x="${x0}" y="${f(top)}" width="${x1 - x0}" height="${f(ground - top)}" class="grime"/>`;
  }
  if (dims) {
    s += dimH(x0, x1, top - (roofType === 'pitch' ? 104 : roofType === 'saw' ? 62 : 34), mm((x1 - x0) * 40));
    s += dimV(top, ground, 70, mm((ground - top) * 40));
  }
  return `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${s}</svg>`;
}

/** Ground-floor plan, 800 × 560, for the blueprint section. */
export function floorPlan() {
  const W = (x1, y1, x2, y2) => line(`M${x1} ${y1}L${x2} ${y2}`, 'draw wall');
  let s = '';
  // outer walls with openings (front door at 360–410 on the south wall)
  s += W(80, 60, 720, 60) + W(720, 60, 720, 500) + W(720, 500, 410, 500) + W(360, 500, 80, 500) + W(80, 500, 80, 60);
  // interior walls
  s += W(80, 260, 300, 260) + W(300, 60, 300, 210) + W(300, 300, 300, 500) + W(470, 60, 470, 330) + W(470, 380, 470, 500) + W(470, 330, 720, 330);
  // doors (leaf + swing arc)
  const door = (x, y, r, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})">${line(`M0 0L${r} 0`, 'draw thin')}${line(`M${r} 0A${r} ${r} 0 0 1 0 ${r}`, 'draw arc')}</g>`;
  s += door(360, 500, 50, -90) + door(300, 210, 50, 90) + door(470, 330, 50, 0) + door(300, 260, 40, 180);
  // windows: double lines on the outer walls
  const win = (x1, y1, x2, y2, dx, dy) => line(`M${x1} ${y1}L${x2} ${y2}M${x1 + dx} ${y1 + dy}L${x2 + dx} ${y2 + dy}`, 'draw win');
  s += win(130, 56, 250, 56, 0, 8) + win(520, 56, 680, 56, 0, 8) + win(716, 120, 716, 280, 8, 0) + win(76, 330, 76, 450, 8, 0) + win(540, 496, 680, 496, 0, 8);
  // stair
  for (let i = 0; i < 9; i++) s += line(`M${490 + i * 24} 350V490`, 'draw thin');
  s += line('M490 420H706', 'draw thin') + line('M690 410L706 420L690 430', 'draw thin');
  // furniture hints
  s += `<circle class="draw thin" pathLength="1" cx="190" cy="150" r="46"/>` + rect(140, 330, 120, 120, 'draw thin') + rect(330, 90, 110, 60, 'draw thin');
  // labels
  const lab = (x, y, t, a) => `<g class="room"><text x="${x}" y="${y}" text-anchor="middle">${t}</text><text x="${x}" y="${y + 16}" text-anchor="middle" class="area">${a}</text></g>`;
  s += lab(190, 225, 'STUDIO', '41 m²') + lab(385, 190, 'KITCHEN', '27 m²') + lab(595, 200, 'GALLERY', '52 m²') + lab(190, 470, 'WORKSHOP', '43 m²') + lab(385, 430, 'ENTRY', '18 m²') + lab(595, 455, 'STAIR', '22 m²');
  // dimension chains
  s += dimH(80, 300, 30, '8 800') + dimH(300, 470, 30, '6 800') + dimH(470, 720, 30, '10 000');
  s += dimV(60, 260, 40, '8 000') + dimV(260, 500, 40, '9 600');
  // north arrow
  s += `<g class="dim"><circle cx="760" cy="520" r="16" class="dim-line" fill="none"/><path d="M760 506L766 526L760 521L754 526Z" class="north"/><text x="760" y="550" text-anchor="middle">N</text></g>`;
  return `<svg viewBox="0 0 800 560" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="plan-t"><title id="plan-t">Ground-floor plan of the fictional Kiln Street Studios: studio, kitchen, gallery, workshop, entry and stair, with dimension strings in millimetres.</title>${s}</svg>`;
}

/* -------- isometric walkthrough frames -------- */
const C = Math.cos(Math.PI / 6), S = Math.sin(Math.PI / 6);
const iso = (x, y, z, k = 1) => [400 + (x - y) * C * k, 215 + (x + y) * S * k - z * k];
const P = (pts) => pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L');
function box(x, y, z, w, d, h, cls = '') {
  const t = [iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)];
  const left = [iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x, y + d, z + h)];
  const right = [iso(x + w, y, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x + w, y, z + h)];
  // light from the top-left: top lightest, left face mid, right face in shade (hatched)
  return `<path class="face-top ${cls}" d="M${P(t)}Z"/><path class="face-left ${cls}" d="M${P(left)}Z"/><path class="face-right ${cls}" d="M${P(right)}Z"/><path class="face-right-hatch" d="M${P(right)}Z" fill="url(#hatch)"/>`;
}
function ground() {
  const g = [iso(-40, -40, 0), iso(300, -40, 0), iso(300, 300, 0), iso(-40, 300, 0)];
  let s = `<path class="site" d="M${P(g)}Z"/>`;
  for (let i = 0; i <= 340; i += 34) s += `<path class="grid" d="M${P([iso(-40 + i, -40, 0), iso(-40 + i, 300, 0)])}M${P([iso(-40, -40 + i, 0), iso(300, -40 + i, 0)])}"/>`;
  return s;
}
const tree = (x, y) => {
  const [a, b] = iso(x, y, 0), [c, d] = iso(x, y, 34);
  return `<path class="trunk" d="M${f(a)} ${f(b)}L${f(c)} ${f(d)}"/><circle class="tree" cx="${f(c)}" cy="${f(d - 12)}" r="18"/>`;
};
export function axo(stage) {
  let s = `<defs>${HATCH}</defs>` + ground();
  const trees = [[-20, 250], [20, 280], [270, -10], [280, 40], [250, 280]];
  if (stage === 'site') {
    s += trees.map(([x, y]) => tree(x, y)).join('');
    s += `<path class="path-line" d="M${P([iso(120, 300, 0), iso(120, 180, 0), iso(60, 120, 0)])}"/>`;
    s += `<path class="plot" d="M${P([iso(20, 20, 0), iso(240, 20, 0), iso(240, 200, 0), iso(20, 200, 0)])}Z"/>`;
  } else if (stage === 'massing') {
    s += trees.map(([x, y]) => tree(x, y)).join('');
    s += box(20, 20, 0, 150, 180, 120) + box(170, 60, 0, 70, 140, 60);
  } else if (stage === 'structure') {
    for (let lv = 0; lv <= 3; lv++) s += `<path class="slab" d="M${P([iso(20, 20, lv * 40), iso(170, 20, lv * 40), iso(170, 200, lv * 40), iso(20, 200, lv * 40)])}Z"/>`;
    for (const x of [20, 70, 120, 170]) for (const y of [20, 80, 140, 200]) s += `<path class="col" d="M${P([iso(x, y, 0), iso(x, y, 120)])}"/>`;
    s += `<path class="brace" d="M${P([iso(170, 20, 0), iso(170, 80, 40), iso(170, 140, 0)])}"/>`;
    s += box(170, 60, 0, 70, 140, 60, 'ghost');
  } else {
    s += trees.map(([x, y]) => tree(x, y)).join('');
    s += box(20, 20, 0, 150, 180, 120) + box(170, 60, 0, 70, 140, 60);
    // window bands on the left (lit) face, door in accent
    for (let lv = 0; lv < 3; lv++) for (let i = 0; i < 5; i++) {
      const x = 32 + i * 28, z = 10 + lv * 40;
      s += `<path class="win" d="M${P([iso(x, 200, z), iso(x + 16, 200, z), iso(x + 16, 200, z + 22), iso(x, 200, z + 22)])}Z"/>`;
    }
    s += `<path class="door" d="M${P([iso(186, 200, 0), iso(212, 200, 0), iso(212, 200, 36), iso(186, 200, 36)])}Z"/>`;
  }
  return `<svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${s}</svg>`;
}
