/**
 * Audio-reactive visualizer (canvas 2D). Safety rules: the analyser is heavily smoothed, nothing
 * fills the screen, line alpha stays ≤ 0.6 and the background never changes brightness, so there
 * is no flashing at any tempo. Idle (no audio): a slow breathing ring. Reduced motion: one static frame.
 */
export function oklchHex(L: number, C: number, H: number, a = 1) {
  const h = (H * Math.PI) / 180, A = C * Math.cos(h), B = C * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  const [r, g, b] = lin.map((v) => {
    const c = Math.min(1, Math.max(0, v));
    return Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255);
  });
  return `rgba(${r},${g},${b},${a})`;
}

export function initViz(canvas: HTMLCanvasElement, getAnalyser: () => AnalyserNode | null, getHue: () => number, reduced: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { redraw: () => {} };
  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', () => {
    resize();
    if (reduced) frame(0);
  });
  const freq = new Uint8Array(512);
  const wave = new Uint8Array(1024);
  let level = 0; // smoothed overall level (slow attack → no strobing)

  const frame = (t: number) => {
    const an = getAnalyser();
    const hue = getHue();
    let live = false;
    if (an) {
      an.getByteFrequencyData(freq);
      an.getByteTimeDomainData(wave);
      live = freq.some((v) => v > 0);
    }
    let sum = 0;
    for (let i = 0; i < 96; i++) sum += freq[i];
    level += ((live ? sum / (96 * 255) : 0) - level) * 0.06;
    ctx.clearRect(0, 0, W, H);
    const cx = W * (W > 900 ? 0.68 : 0.5), cy = H * 0.5;
    const R = Math.min(W, H) * (W > 900 ? 0.28 : 0.34);
    const breathe = reduced ? 0 : Math.sin(t / 1000 * (Math.PI / 3)) * 0.03; // 6 s period
    // radial bars
    const bars = 96;
    ctx.lineCap = 'round';
    for (let i = 0; i < bars; i++) {
      const v = live ? freq[Math.floor((i / bars) * 160)] / 255 : 0.12 + 0.05 * Math.sin(i * 0.5 + t / 900);
      const a = (i / bars) * Math.PI * 2 - Math.PI / 2;
      const r0 = R * (1 + breathe), r1 = r0 + 6 + v * R * 0.55;
      ctx.strokeStyle = oklchHex(0.8, 0.13, hue + (i / bars) * 30, 0.25 + v * 0.35);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.stroke();
    }
    // waveform ring
    ctx.strokeStyle = oklchHex(0.86, 0.08, hue, 0.55);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2 - Math.PI / 2;
      const s = live ? (wave[Math.floor((i / 256) * 1023)] - 128) / 128 : Math.sin(i * 0.25 + t / 700) * 0.04;
      const r = R * (0.82 + breathe) + s * R * 0.25;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
    // inner disc: a soft glow whose size (not brightness) follows the smoothed level
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (0.55 + level * 0.25));
    g.addColorStop(0, oklchHex(0.5, 0.1, hue, 0.35));
    g.addColorStop(1, oklchHex(0.3, 0.06, hue, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.8, 0, Math.PI * 2);
    ctx.fill();
  };

  let raf = 0, running = false;
  const loop = (t: number) => {
    frame(t);
    raf = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || reduced) return;
    running = true;
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  frame(0);
  start();
  return { redraw: () => reduced && frame(0) };
}

/** Static generative cover art: rings and static dots in the track hue (drawn once). */
export function drawCover(el: HTMLElement, hue: number, seed: number) {
  const c = document.createElement('canvas');
  const size = 640;
  c.width = c.height = size;
  const g = c.getContext('2d');
  if (!g) return;
  let a = seed >>> 0;
  const r = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
  const cx = size * (0.4 + r() * 0.2), cy = size * (0.4 + r() * 0.2);
  for (let i = 0; i < 14; i++) {
    g.strokeStyle = oklchHex(0.86, 0.08, hue + i * 3, 0.15 + (i % 3) * 0.12);
    g.lineWidth = 1 + (i % 4);
    g.beginPath();
    g.arc(cx, cy, 30 + i * 24, r() * 6, r() * 6 + 1.5 + r() * 3);
    g.stroke();
  }
  // static: fine noise dots, lit from the top-left (denser and brighter there)
  for (let i = 0; i < 2600; i++) {
    const x = r() * size, y = r() * size;
    const lit = 1 - (x + y) / (2 * size);
    g.fillStyle = oklchHex(0.92, 0.03, hue, 0.08 + lit * 0.25 * r());
    g.fillRect(x, y, 1.5, 1.5);
  }
  g.fillStyle = oklchHex(0.95, 0.05, hue, 0.9);
  g.font = '700 46px "Big Shoulders Display Variable", Impact, sans-serif';
  g.fillText('EOS', 36, size - 40);
  el.append(c);
}
