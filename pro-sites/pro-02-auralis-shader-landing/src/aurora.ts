/**
 * Fullscreen "aurora" fluid-noise shader (raw WebGL2, no library).
 *  - iq-style domain-warped fbm; colour stops are mixed in OKLCH inside the shader
 *  - OKLCH lightness clamped to 0.62 so white hero text keeps ≥ 3:1 over any pixel
 *  - cursor adds a swirl + energy, scroll drifts the field and rotates toward magenta
 *  - rendered at half resolution, devicePixelRatio capped at 2
 *  - pauses when the tab is hidden; throttles to ~30fps once the hero is far away
 *  - prefers-reduced-motion: renders one static frame
 *  - no WebGL2: leaves the CSS mesh-gradient fallback in place (html.no-webgl)
 */
const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;
uniform float uEnergy;
uniform vec3 uStops[4]; // OKLCH (L, C, h in radians): night, teal, violet, magenta

float hash(vec2 p) { p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}
vec3 oklchToSrgb(vec3 c) {
  float a = c.y * cos(c.z), b = c.y * sin(c.z);
  float l_ = c.x + 0.3963377774 * a + 0.2158037573 * b;
  float m_ = c.x - 0.1055613458 * a - 0.0638541728 * b;
  float s_ = c.x - 0.0894841775 * a - 1.2914855480 * b;
  float l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  vec3 lin = vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
   -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
   -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
  lin = clamp(lin, 0.0, 1.0);
  return mix(12.92 * lin, 1.055 * pow(lin, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, lin));
}
vec3 mixLch(vec3 a, vec3 b, float t) {
  float dh = b.z - a.z;
  dh -= 6.2831853 * floor((dh + 3.14159265) / 6.2831853); // shortest hue path
  return vec3(mix(a.x, b.x, t), mix(a.y, b.y, t), a.z + dh * t);
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 m = (uMouse - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.045;
  vec2 d = uv - m;
  float swirl = exp(-dot(d, d) * 5.0) * (0.35 + uEnergy);
  uv += vec2(-d.y, d.x) * swirl * 0.3;
  vec2 p = uv * 1.5 + vec2(0.0, uScroll * 0.9);
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.4 * q + vec2(1.7, 9.2) + 1.3 * t), fbm(p + 3.4 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 3.0 * r);
  // curtains: brighter toward the upper half, warped by the field
  float curtain = smoothstep(0.32, 0.92, f) * (0.55 + 0.45 * smoothstep(-0.6, 0.5, uv.y + q.x * 0.4));
  float k = clamp(r.x * 1.25 - 0.15 + uScroll * 0.18, 0.0, 1.0);
  vec3 tone = k < 0.5 ? mixLch(uStops[1], uStops[2], k * 2.0) : mixLch(uStops[2], uStops[3], k * 2.0 - 1.0);
  vec3 col = mixLch(uStops[0], tone, clamp(curtain + swirl * 0.25, 0.0, 1.0));
  col.x = min(col.x, 0.62); // contrast guard for text on top
  vec3 rgb = oklchToSrgb(col);
  vec2 vu = gl_FragCoord.xy / uRes;
  rgb *= 0.72 + 0.28 * pow(16.0 * vu.x * vu.y * (1.0 - vu.x) * (1.0 - vu.y), 0.25);
  rgb += (hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) * (2.0 / 255.0); // dither against banding
  outColor = vec4(rgb, 1.0);
}`;

// OKLCH anchors (h in degrees) — same values as the palette tokens
const STOPS: [number, number, number][] = [
  [0.18, 0.07, 280], // night
  [0.8, 0.13, 195], // teal
  [0.62, 0.2, 295], // violet
  [0.68, 0.22, 340], // magenta
];

export function initAurora(canvas: HTMLCanvasElement) {
  const html = document.documentElement;
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) {
    html.classList.add('no-webgl');
    return;
  }
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader error');
    return s;
  };
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link error');
  } catch (e) {
    console.warn('Aurora shader unavailable, using CSS fallback.', e);
    html.classList.add('no-webgl');
    return;
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u('uRes'), uTime = u('uTime'), uMouse = u('uMouse'), uScroll = u('uScroll'), uEnergy = u('uEnergy');
  gl.uniform3fv(u('uStops'), new Float32Array(STOPS.flatMap(([L, C, h]) => [L, C, (h * Math.PI) / 180])));

  const SCALE = 0.5;
  let w = 0, h = 0;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.round(canvas.clientWidth * dpr * SCALE));
    h = Math.max(1, Math.round(canvas.clientHeight * dpr * SCALE));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  const mouse = { x: w * 0.65, y: h * 0.6, tx: w * 0.65, ty: h * 0.6 };
  let energy = 0, scroll = 0, targetScroll = 0;
  window.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * w, ny = (1 - (e.clientY - r.top) / r.height) * h;
    energy = Math.min(1, energy + Math.hypot(nx - mouse.tx, ny - mouse.ty) / (w * 0.6));
    mouse.tx = nx;
    mouse.ty = ny;
  }, { passive: true });
  window.addEventListener('scroll', () => (targetScroll = window.scrollY / window.innerHeight), { passive: true });

  const draw = (time: number) => {
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    scroll += (targetScroll - scroll) * 0.08;
    energy *= 0.96;
    gl.uniform1f(uTime, time / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uScroll, scroll);
    gl.uniform1f(uEnergy, energy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const showCanvas = () => html.classList.add('webgl-ready');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    draw(12000); // a single, fixed frame
    showCanvas();
    return;
  }

  let raf = 0, last = 0, running = false;
  const loop = (t: number) => {
    raf = requestAnimationFrame(loop);
    const far = window.scrollY > window.innerHeight * 1.5;
    if (far && t - last < 33) return; // ~30fps when the hero is long gone
    last = t;
    draw(t);
  };
  const start = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); html.classList.add('no-webgl'); });
  draw(0);
  showCanvas();
  start();
}
