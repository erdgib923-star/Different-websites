/**
 * Newspaper halftones, generated. A greyscale scene is painted on a hidden canvas (simple shapes
 * and gradients), then sampled on a 45° grid; each sample becomes an ink dot whose area follows
 * the darkness. The result is an SVG, so it stays sharp at any size and prints like a real plate.
 */
type Scene = (c: CanvasRenderingContext2D, w: number, h: number) => void;

const grey = (v: number) => `rgb(${v},${v},${v})`;

export const SCENES: Record<string, Scene> = {
  lighthouse(c, w, h) {
    const sky = c.createLinearGradient(0, 0, 0, h * 0.62);
    sky.addColorStop(0, grey(150)); sky.addColorStop(1, grey(235));
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    // beam
    c.fillStyle = grey(250);
    c.beginPath(); c.moveTo(w * 0.62, h * 0.22); c.lineTo(w * 1.05, h * 0.05); c.lineTo(w * 1.05, h * 0.36); c.closePath(); c.fill();
    // sea
    const sea = c.createLinearGradient(0, h * 0.62, 0, h);
    sea.addColorStop(0, grey(110)); sea.addColorStop(1, grey(40));
    c.fillStyle = sea; c.fillRect(0, h * 0.62, w, h);
    c.strokeStyle = grey(170); c.lineWidth = 2;
    for (let y = h * 0.67; y < h; y += 14) { c.beginPath(); for (let x = 0; x <= w; x += 8) c.lineTo(x, y + Math.sin(x * 0.05 + y) * 2); c.stroke(); }
    // rocks + tower
    c.fillStyle = grey(30);
    c.beginPath(); c.moveTo(w * 0.42, h * 0.66); c.quadraticCurveTo(w * 0.6, h * 0.5, w * 0.82, h * 0.66); c.fill();
    c.fillStyle = grey(225);
    c.beginPath(); c.moveTo(w * 0.57, h * 0.6); c.lineTo(w * 0.6, h * 0.24); c.lineTo(w * 0.64, h * 0.24); c.lineTo(w * 0.67, h * 0.6); c.fill();
    c.fillStyle = grey(55);
    for (let k = 0; k < 3; k++) c.fillRect(w * 0.585 + k * 0.004 * w, h * (0.32 + k * 0.1), w * (0.07 - k * 0.008), h * 0.04);
    c.fillStyle = grey(20); c.fillRect(w * 0.585, h * 0.18, w * 0.07, h * 0.06);
    c.fillStyle = grey(255); c.fillRect(w * 0.6, h * 0.2, w * 0.04, h * 0.035);
  },
  ferry(c, w, h) {
    const fog = c.createLinearGradient(0, 0, 0, h);
    fog.addColorStop(0, grey(225)); fog.addColorStop(0.6, grey(205)); fog.addColorStop(1, grey(150));
    c.fillStyle = fog; c.fillRect(0, 0, w, h);
    c.fillStyle = grey(150);
    c.beginPath(); c.moveTo(w * 0.15, h * 0.66); c.lineTo(w * 0.85, h * 0.66); c.lineTo(w * 0.78, h * 0.76); c.lineTo(w * 0.22, h * 0.76); c.fill();
    c.fillRect(w * 0.3, h * 0.54, w * 0.38, h * 0.12);
    c.fillRect(w * 0.4, h * 0.44, w * 0.14, h * 0.1);
    c.fillStyle = grey(120); c.fillRect(w * 0.47, h * 0.34, w * 0.03, h * 0.1);
    c.fillStyle = grey(230); for (let k = 0; k < 7; k++) c.fillRect(w * (0.33 + k * 0.05), h * 0.58, w * 0.025, h * 0.03);
    c.fillStyle = grey(110); c.fillRect(0, h * 0.78, w, h);
  },
  boats(c, w, h) {
    c.fillStyle = grey(215); c.fillRect(0, 0, w, h);
    c.fillStyle = grey(160); c.fillRect(0, h * 0.58, w, h);
    for (let k = 0; k < 4; k++) {
      const x = w * (0.08 + k * 0.23), y = h * (0.6 + (k % 2) * 0.08), s = w * 0.17;
      c.fillStyle = grey(35);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + s, y); c.lineTo(x + s * 0.85, y + s * 0.22); c.lineTo(x + s * 0.12, y + s * 0.22); c.fill();
      c.fillRect(x + s * 0.3, y - s * 0.22, s * 0.3, s * 0.22);
      c.fillStyle = grey(60); c.fillRect(x + s * 0.65, y - s * 0.75, 2, s * 0.75);
      c.strokeStyle = grey(80); c.beginPath(); c.moveTo(x + s * 0.66, y - s * 0.7); c.lineTo(x + s * 0.98, y - s * 0.05); c.stroke();
    }
    c.fillStyle = grey(240); for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(w * (0.12 + k * 0.16), h * (0.2 + (k % 3) * 0.06), 3, 0, Math.PI * 2); c.fill(); }
  },
};

export function halftone(scene: string, w: number, h: number, pitch: number, ink = '#2b2924', paper = 'transparent'): string {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  SCENES[scene](ctx, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const a = Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a), span = Math.hypot(w, h);
  let dots = '';
  for (let v = -span; v < span; v += pitch) for (let u = -span; u < span; u += pitch) {
    const x = w / 2 + u * ca - v * sa, y = h / 2 + u * sa + v * ca;
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const dark = 1 - px[4 * ((y | 0) * w + (x | 0))] / 255;
    if (dark < 0.05) continue;
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(pitch * 0.62 * Math.sqrt(dark)).toFixed(2)}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="${w}" height="${h}" fill="${paper}"/><g fill="${ink}">${dots}</g></svg>`;
}
