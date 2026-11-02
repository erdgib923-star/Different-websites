/**
 * The fixed pixel landscape behind the page. A low-resolution canvas (180 px tall on landscape
 * screens, 200 px wide on portrait ones, so pixels stay square) is scaled up with
 * image-rendering: pixelated.
 *
 * - Scroll position drives a day → sunset → night cycle. The sky blends between palette colours
 *   with 4 × 4 Bayer dithering, so it never leaves the 16-colour palette.
 * - Sprites recolour by palette swap (day / dusk / night).
 * - Four layers parallax at different rates, in whole pixels.
 * - A gentle idle loop (clouds, farmer, chicken) runs at 8 fps only while visible; under reduced
 *   motion there is no idle loop and no parallax, but the time of day still follows the scroll.
 */
import { CHICKEN, CLOUD, FARMER, FENCE, HOUSE, MOON, SUN, TREE, CROP, bayer, draw, mulberry32, rgb } from './pixel';
import { prefersReduced } from './lib/motion';

let H = 180;
type Phase = { top: string; mid: string; bottom: string; hills: string; far: string; swap: string };
const PHASES: Phase[] = [
  { top: 'b', mid: 'i', bottom: 'i', hills: 'G', far: 'B', swap: 'day' },
  { top: 'B', mid: 'p', bottom: 'h', hills: 'G', far: 'u', swap: 'dusk' },
  { top: 'k', mid: 'u', bottom: 'u', hills: 'k', far: 'u', swap: 'night' },
];

export function initLandscape(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  const reduced = prefersReduced();
  const rnd = mulberry32(7);
  const stars = Array.from({ length: 70 }, () => [rnd(), rnd() * 0.55, rnd()]);
  const ridgeSeed = Array.from({ length: 64 }, () => rnd());
  let W = 320, t = 0, frame = 0, tick = 0, img: ImageData | null = null;

  const resize = () => {
    // Keep pixels square: derive both dimensions from the viewport aspect.
    const aspect = innerWidth / Math.max(1, innerHeight);
    if (aspect >= 1.1) { H = 180; W = Math.round(H * aspect); if (W > 480) { W = 480; H = Math.round(W / aspect); } }
    else { W = 200; H = Math.round(W / aspect); }
    canvas.width = W; canvas.height = H;
    ctx.imageSmoothingEnabled = false;
    img = ctx.createImageData(W, Math.round(H * 0.72));
    render();
  };

  const progress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  };

  function skyColour(ph: Phase, y: number, x: number) {
    const v = y / (H * 0.72);
    if (v < 0.5) return bayer(x, y) < v * 2 ? ph.mid : ph.top;
    return bayer(x, y) < (v - 0.5) * 2 ? ph.bottom : ph.mid;
  }

  function render() {
    if (!img) return;
    const p = t * 2; // 0..2 across three phases
    const a = PHASES[Math.min(2, Math.floor(p))], b = PHASES[Math.min(2, Math.floor(p) + 1)], f = p - Math.floor(p);
    const near = f < 0.5 ? a : b;
    // Sky: ordered dither inside a phase and between phases.
    const d = img.data;
    for (let y = 0; y < img.height; y++) for (let x = 0; x < W; x++) {
      const ch = bayer(x + 2, y + 1) < f ? skyColour(b, y, x) : skyColour(a, y, x);
      const [r, g, bl] = rgb(ch);
      const o = (y * W + x) * 4;
      d[o] = r; d[o + 1] = g; d[o + 2] = bl; d[o + 3] = 255;
    }
    ctx!.putImageData(img, 0, 0);
    const par = reduced ? 0 : t;
    // Stars fade in by dither density at night (static: no twinkle, nothing flashes).
    const starDensity = Math.max(0, (t - 0.55) / 0.3);
    stars.forEach(([sx, sy, k]) => { if (k < starDensity) { ctx!.fillStyle = `rgb(${rgb('c').join(',')})`; ctx!.fillRect(Math.floor(sx * W), Math.floor(sy * H), 1, 1); } });
    // Sun sets along an arc; moon rises after.
    const sunT = Math.min(1, t / 0.6);
    if (t < 0.62) draw(ctx!, 'sun', SUN, W * (0.18 + sunT * 0.6), H * (0.12 + Math.pow(sunT, 2) * 0.55), 'day');
    if (t > 0.55) draw(ctx!, 'moon', MOON, W * 0.78, H * (0.48 - Math.min(1, (t - 0.55) / 0.3) * 0.32), 'day');
    // Clouds drift (idle) and parallax.
    const cloudSwap = near.swap;
    [[0.1, 0.12], [0.45, 0.2], [0.75, 0.08]].forEach(([cx, cy], i) => {
      const x = ((cx * W + tick * (0.15 + i * 0.05)) % (W + 20)) - 16;
      draw(ctx!, 'cloud', CLOUD, x, cy * H - par * 8, cloudSwap);
    });
    // Far ridge (stepped pixel mountains).
    ctx!.fillStyle = `rgb(${rgb(near.far).join(',')})`;
    const farY = H * 0.5 - par * 6;
    for (let x = 0; x < W; x++) {
      const k = x / W * 63, i0 = Math.floor(k), fr = k - i0;
      const h = (ridgeSeed[i0] * (1 - fr) + ridgeSeed[Math.min(63, i0 + 1)] * fr) * 26 + Math.sin(x * 0.05) * 6;
      ctx!.fillRect(x, Math.round(farY - h), 1, H);
    }
    // Hills.
    ctx!.fillStyle = `rgb(${rgb(near.hills).join(',')})`;
    const hillY = H * 0.64 - par * 14;
    for (let x = 0; x < W; x++) ctx!.fillRect(x, Math.round(hillY - 10 - Math.sin(x * 0.03 + 1) * 8 - Math.sin(x * 0.011) * 6), 1, H);
    // Tree line.
    const treeY = H * 0.6 - par * 22;
    for (let x = -8; x < W; x += 22) draw(ctx!, 'tree', TREE, x + ((x * 7) % 9), treeY + ((x * 3) % 6), near.swap);
    // Foreground field.
    const fy = H * 0.78 - par * 34;
    ctx!.fillStyle = `rgb(${rgb(near.swap === 'night' ? 'G' : 'g').join(',')})`;
    ctx!.fillRect(0, Math.round(fy), W, H);
    ctx!.fillStyle = `rgb(${rgb(near.swap === 'night' ? 'S' : 's').join(',')})`;
    for (let r = 0; r < 3; r++) ctx!.fillRect(Math.round(W * 0.42), Math.round(fy + 10 + r * 9), Math.round(W * 0.5), 5);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) draw(ctx!, `crop${(r + c) % 4}`, CROP[(r + c) % 4], W * 0.43 + c * (W * 0.06), fy + 3 + r * 9, near.swap);
    draw(ctx!, 'house', HOUSE, W * 0.1, fy - 12, near.swap);
    for (let x = 0; x < W * 0.38; x += 9) draw(ctx!, 'fence', FENCE, x, fy + 4, near.swap);
    // Farmer strolls (idle loop), chicken pecks.
    const walk = reduced ? 0 : (tick * 0.4) % (W * 0.3);
    const dir = reduced ? 1 : Math.floor((tick * 0.4) / (W * 0.3)) % 2 === 0 ? 1 : -1;
    const fx = dir > 0 ? W * 0.4 + walk : W * 0.7 - walk;
    draw(ctx!, `farmer${frame}`, FARMER[frame], fx, fy + 14, near.swap, dir < 0);
    draw(ctx!, 'chicken', CHICKEN, W * 0.3 + (frame ? 1 : 0), fy + 20, near.swap);
  }

  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; t = progress(); render(); });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', resize);
  resize();
  t = progress();
  render();

  // Idle loop at 8 fps, paused when the tab is hidden. (The canvas is always on screen.)
  if (!reduced) {
    let last = 0;
    const loop = (now: number) => {
      if (!document.hidden && now - last > 125) { last = now; tick++; frame = (tick >> 1) & 1; render(); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  (window as unknown as { __loops?: unknown }).__loops = { landscape: reduced ? 'static' : 'idle-8fps' };
  return { getT: () => t };
}
