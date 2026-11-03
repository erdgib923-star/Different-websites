/**
 * Metaball field in a fragment shader. Seven drifting balls plus one that follows the cursor
 * (it eases toward it, never jumps). Scroll lifts the field and loosens the balls, like bubbles
 * rising. Colour is a two-stop gradient (flavour A -> flavour B) on the
 * cream page colour, so the hero type always sits on light colour. Flat fill, crisp edge.
 */
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uMouseOn; uniform float uScroll;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uBg;
float ball(vec2 p, vec2 c, float r){ vec2 d = p - c; return r * r / max(dot(d, d), 1e-4); }
void main(){
  float aspect = uRes.x / uRes.y;
  vec2 p = gl_FragCoord.xy / uRes; p.x *= aspect;
  float t = uTime * 0.18;
  float lift = uScroll * 0.9;
  float f = 0.0;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    // Most of the mass sits right of centre, away from the headline.
    vec2 c = vec2(aspect * (0.5 + 0.075 * fi + 0.07 * sin(t * (1.0 + fi * 0.13) + fi * 2.1)),
                  0.5 + 0.28 * sin(t * (0.7 + fi * 0.11) + fi * 1.7) + lift * (0.25 + 0.1 * fi));
    c.y = mod(c.y + 0.3, 1.6) - 0.3;
    f += ball(p, c, 0.1 + 0.04 * sin(fi * 3.3));
  }
  vec2 m = uMouse; m.x *= aspect;
  f += ball(p, m, 0.11) * uMouseOn;
  float edge = smoothstep(0.97, 1.03, f); // a crisp liquid edge
  vec3 grad = mix(uA, uB, clamp(p.y * 0.9 + (p.x / aspect) * 0.35 - 0.1, 0.0, 1.0));
  vec3 col = mix(uBg, grad, edge);
  gl_FragColor = vec4(col, 1.0);
}`;

export interface Blobs { draw: (t: number) => void; set: (s: Partial<BlobState>) => void; ok: boolean }
export interface BlobState { mouse: [number, number]; mouseOn: number; scroll: number; a: number[]; b: number[]; bg: number[] }

export function createBlobs(canvas: HTMLCanvasElement): Blobs {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
  const noop = { draw: () => undefined, set: () => undefined, ok: false };
  if (!gl) return noop;
  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return noop;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = Object.fromEntries(['uRes', 'uTime', 'uMouse', 'uMouseOn', 'uScroll', 'uA', 'uB', 'uBg'].map((n) => [n, gl.getUniformLocation(prog, n)]));
  const s: BlobState = { mouse: [0.7, 0.5], mouseOn: 0, scroll: 0, a: [0.7, 0.9, 0.3], b: [1, 0.6, 0.3], bg: [1, 1, 0.95] };
  const draw = (t: number) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.uRes, w, h);
    gl.uniform1f(U.uTime, t);
    gl.uniform2f(U.uMouse, s.mouse[0], s.mouse[1]);
    gl.uniform1f(U.uMouseOn, s.mouseOn);
    gl.uniform1f(U.uScroll, s.scroll);
    gl.uniform3fv(U.uA, s.a);
    gl.uniform3fv(U.uB, s.b);
    gl.uniform3fv(U.uBg, s.bg);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  return { draw, set: (p) => Object.assign(s, p), ok: true };
}
