/**
 * Poster lab: a p5.js (instance mode) risograph simulator.
 *
 * Each selected ink is drawn as a greyscale "master" (the shapes), then screened into halftone
 * dots on its own rotated grid (15°, 45°, 75°, like real screen angles), given random ink
 * drop-outs, and stacked with MULTIPLY at a seeded misregistration offset. Same seed and
 * settings always give the same poster. p5 is loaded only when the lab nears the viewport.
 */
import palette from '../palette.config.mjs';
import { gamutMap, oklchToSrgb } from '../scripts/color.mjs';

type Ink = 'y' | 'p' | 'b';
const INK_TOKEN: Record<Ink, string> = { y: 'ink-yellow', p: 'ink-pink', b: 'ink-blue' };
const INK_NAME: Record<Ink, string> = { y: 'Sunflower', p: 'Flamingo', b: 'Federal' };
const ANGLE: Record<Ink, number> = { y: 15, p: 45, b: 75 };
const W = 600, H = 800;

const rgb = (token: string) => {
  const [L, C, h] = palette.colors[token];
  return oklchToSrgb(L, gamutMap(L, C, h), h).map((v) => Math.round(v * 255)) as [number, number, number];
};

interface State { inks: Ink[]; shape: string; miss: number; dot: number; title: string; seed: number }

export function initLab() {
  const host = document.querySelector<HTMLElement>('[data-lab-canvas]');
  const form = document.querySelector<HTMLFormElement>('[data-lab-form]');
  const fallback = document.querySelector<HTMLElement>('[data-lab-fallback]');
  if (!host || !form || !fallback) return;
  if (!document.createElement('canvas').getContext('2d')) { fallback.classList.add('is-shown'); return; }

  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    try {
      const [{ default: P5 }] = await Promise.all([import('p5'), document.fonts?.load('700 80px "Space Grotesk"'), document.fonts?.load('400 16px "Space Mono"')]);
      start(P5, host, form);
    } catch (err) {
      console.error('Poster lab failed to start', err);
      fallback.classList.add('is-shown');
    }
  }, { rootMargin: '600px' });
  io.observe(host);
}

function start(P5: any, host: HTMLElement, form: HTMLFormElement) {
  P5.disableFriendlyErrors = true;
  const status = document.querySelector<HTMLElement>('[data-lab-status]')!;
  const seedLabel = document.querySelector<HTMLElement>('[data-seed]')!;
  const stock = rgb('stock');
  let seed = 4021;

  const read = (): State => {
    const fd = new FormData(form);
    return {
      inks: (fd.getAll('ink') as Ink[]),
      shape: String(fd.get('shape')),
      miss: Number(fd.get('miss')),
      dot: Number(fd.get('dot')),
      title: String(fd.get('title') ?? '').toUpperCase().slice(0, 18),
      seed,
    };
  };

  // Two reusable offscreen buffers (created once): the greyscale master and the screened ink.
  let master: any, layer: any;
  const sketch = (p: any) => {
    p.setup = () => {
      p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
      // The master is read back with getImageData for every ink, so its 2D context should be
      // created with willReadFrequently. p5 1.x has no option for that; shim getContext only
      // for this one createGraphics call.
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, attrs?: object) {
        return orig.call(this, type as '2d', type === '2d' ? { ...attrs, willReadFrequently: true } : attrs);
      } as typeof orig;
      try { master = p.createGraphics(W, H); } finally { HTMLCanvasElement.prototype.getContext = orig; }
      master.pixelDensity(1);
      layer = p.createGraphics(W, H);
      layer.pixelDensity(1);
      const c = p.createCanvas(W, H);
      c.parent(host);
      c.elt.setAttribute('aria-hidden', 'true');
      p.noLoop();
    };
    p.draw = () => render(p, read(), stock);
  };
  const inst = new P5(sketch);

  let t = 0;
  const redraw = () => { clearTimeout(t); t = window.setTimeout(() => inst.redraw(), 90); };
  form.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.name === 'ink' && !form.querySelectorAll('input[name="ink"]:checked').length) {
      target.checked = true;
      status.textContent = 'Keep at least one ink on the press.';
      return;
    }
    (form.querySelector('[data-o="miss"]') as HTMLOutputElement).value = `${(form.elements.namedItem('miss') as HTMLInputElement).value} px`;
    (form.querySelector('[data-o="dot"]') as HTMLOutputElement).value = `${(form.elements.namedItem('dot') as HTMLInputElement).value} px`;
    redraw();
  });
  form.addEventListener('submit', (e) => e.preventDefault());
  document.querySelector('[data-lab-seed]')!.addEventListener('click', () => {
    seed = 1000 + Math.floor(Math.random() * 9000);
    seedLabel.textContent = `#${seed}`;
    redraw();
  });
  document.querySelector('[data-lab-save]')!.addEventListener('click', () => {
    inst.saveCanvas(`inkpress-poster-${seed}`, 'png');
    status.textContent = `Saved inkpress-poster-${seed}.png`;
  });

  function render(pp: any, s: State, paper: [number, number, number]) {
    pp.randomSeed(s.seed);
    pp.noiseSeed(s.seed);
    pp.blendMode(pp.BLEND);
    pp.background(...paper);
    // paper fibres and speckle
    pp.noStroke();
    for (let i = 0; i < 2200; i++) {
      pp.fill(paper[0] - 28, paper[1] - 26, paper[2] - 20, pp.random(20, 70));
      pp.circle(pp.random(W), pp.random(H), pp.random(0.6, 1.8));
    }
    const order: Ink[] = (['y', 'p', 'b'] as Ink[]).filter((k) => s.inks.includes(k));
    const typeInk = order.includes('b') ? 'b' : order.at(-1)!;
    order.forEach((ink, k) => {
      master.push();
      master.blendMode(master.BLEND);
      master.background(255);
      drawMaster(pp, master, s.shape, k, order.length);
      master.pop();
      layer.clear();
      layer.noStroke();
      const col = rgb(INK_TOKEN[ink]);
      layer.fill(...col);
      screen(master, layer, s.dot, ANGLE[ink]);
      // Knockout band behind the title in every ink, as a riso designer would separate it.
      layer.erase();
      layer.rect(0, H - 214, W, 186);
      layer.noErase();
      if (ink === typeInk) drawType(layer, s, col);
      // uneven ink: tiny random drop-outs
      layer.erase();
      for (let i = 0; i < 260; i++) layer.circle(pp.random(W), pp.random(H), pp.random(1, 3.5));
      layer.noErase();
      const ang = pp.random(Math.PI * 2);
      const ox = Math.cos(ang) * s.miss * (k === 0 ? 0.3 : 1);
      const oy = Math.sin(ang) * s.miss * (k === 0 ? 0.3 : 1);
      const rot = (pp.random(-1, 1) * s.miss * 0.0012);
      pp.push();
      pp.blendMode(pp.MULTIPLY);
      pp.translate(W / 2 + ox, H / 2 + oy);
      pp.rotate(rot);
      pp.image(layer, -W / 2, -H / 2);
      pp.pop();
    });
    pp.blendMode(pp.BLEND);
    const names = order.map((k) => INK_NAME[k]);
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
    const desc = `Poster #${s.seed}: ${s.shape} pattern in ${list}, titled “${s.title || 'untitled'}”, with ${s.miss} px misregistration.`;
    host.setAttribute('aria-label', desc);
    status.textContent = desc;
  }

  /** Greyscale masters: black = full ink, grey = halftone tint. */
  function drawMaster(pp: any, g: any, shape: string, k: number, n: number) {
    g.noStroke();
    const tone = (t: number) => 255 * (1 - t);
    if (shape === 'orbits') {
      const cx = pp.random(W * 0.2, W * 0.8), cy = pp.random(H * 0.15, H * 0.6);
      g.noFill();
      for (let r = pp.random(30, 60); r < 520; r += pp.random(28, 64)) {
        g.stroke(tone(pp.random(0.25, 1)));
        g.strokeWeight(pp.random(10, 34));
        g.circle(cx, cy, r * 2);
      }
    } else if (shape === 'stripes') {
      g.push();
      g.translate(W / 2, H / 2);
      g.rotate(((k * 60 + pp.random(-15, 15)) * Math.PI) / 180);
      for (let x = -700; x < 700; x += pp.random(36, 90)) {
        g.fill(tone(pp.random(0.3, 1)));
        g.rect(x, -700, pp.random(14, 46), 1400);
      }
      g.pop();
    } else if (shape === 'blobs') {
      const count = 2 + Math.floor(pp.random(2));
      for (let b = 0; b < count; b++) {
        const cx = pp.random(W), cy = pp.random(H * 0.75), R = pp.random(120, 230);
        // concentric shrinking blobs build a soft tonal gradient for the halftone
        for (let ring = 1; ring >= 0.15; ring -= 0.12) {
          g.fill(tone(Math.min(1, 1.15 - ring)));
          g.beginShape();
          for (let a = 0; a < Math.PI * 2; a += 0.12) {
            const rr = R * ring * (0.75 + 0.5 * pp.noise(Math.cos(a) + b * 3, Math.sin(a) + k * 5));
            g.vertex(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
          }
          g.endShape(pp.CLOSE);
        }
      }
    } else {
      const cols = 4 + k, rows = 5 + k;
      const cw = W / cols, ch = (H * 0.78) / rows;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        if (pp.random() < 0.45 + 0.1 * n) continue;
        g.fill(tone(pp.random(0.3, 1)));
        if (pp.random() < 0.5) g.rect(i * cw + 6, j * ch + 6, cw - 12, ch - 12);
        else g.circle(i * cw + cw / 2, j * ch + ch / 2, Math.min(cw, ch) - 10);
      }
    }
  }

  /** Screen a master into dots on a rotated grid. Dot area is proportional to darkness. */
  function screen(master: any, layer: any, pitch: number, angleDeg: number) {
    master.loadPixels();
    const px = master.pixels as Uint8ClampedArray;
    const a = (angleDeg * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const span = Math.hypot(W, H);
    for (let v = -span / 2; v < span / 2; v += pitch) {
      for (let u = -span / 2; u < span / 2; u += pitch) {
        const x = W / 2 + u * ca - v * sa;
        const y = H / 2 + u * sa + v * ca;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const d = 1 - px[4 * ((y | 0) * W + (x | 0))] / 255;
        if (d < 0.04) continue;
        layer.circle(x, y, pitch * 1.18 * Math.sqrt(d));
      }
    }
  }

  function drawType(layer: any, s: State, col: [number, number, number]) {
    layer.fill(...col);
    layer.textFont('Space Grotesk');
    layer.textStyle(layer.BOLD);
    layer.textAlign(layer.LEFT, layer.BASELINE);
    let size = 120;
    layer.textSize(size);
    while (size > 40 && layer.textWidth(s.title) > W - 70) layer.textSize((size -= 4));
    layer.text(s.title, 34, H - 120);
    layer.textFont('Space Mono');
    layer.textStyle(layer.NORMAL);
    layer.textSize(15);
    layer.text(`INKPRESS COLLECTIVE · RISO · SEED #${s.seed}`, 36, H - 70);
    layer.rect(34, H - 52, W - 68, 4);
  }
}
