/**
 * "The Long Hallway": a WebGL fragment shader that draws a one-point-perspective corridor.
 * Side walls carry door frames, the floor has boards, fog swallows the distance, and a door of
 * light waits at the end. The image is graded split-complementary: teal shadows, amber highlights
 * (the hues come from the palette tokens). A low-amplitude film grain is added per frame; it is
 * fine noise, not a flash. Camera depth, door opening and grain are uniforms driven by scroll.
 */
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uCam; uniform float uDoor; uniform float uGrain; uniform float uLamp; uniform float uOff; uniform float uWarm;
uniform vec3 uTeal; uniform vec3 uAmber;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 uv0 = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 uv = uv0 + vec2(uOff, 0.0);
  vec2 a = abs(uv) + 1e-4;
  float hw = 0.46, hh = 0.30;
  float zs = hw / a.x, zf = hh / a.y;
  bool side = zs < zf;
  float z = min(zs, zf);
  float zz = z + uCam;
  float fog = exp(-z * 0.16);
  float lum;
  if (side) {
    float seg = fract(zz * 0.35);
    float frame = smoothstep(0.03, 0.0, abs(abs(seg - 0.5) - 0.17));
    float door = step(abs(seg - 0.5), 0.17);
    float doorV = step(a.y * z, 0.22);
    lum = 0.30 + frame * 0.18 * doorV - door * doorV * 0.06;
    // wall lamps between doors
    float lamp = exp(-pow(abs(seg) * 9.0, 2.0)) * smoothstep(0.12, 0.0, abs(a.y * z - 0.16));
    lum += lamp * 0.9 * uLamp;
  } else {
    float boards = smoothstep(0.94, 1.0, fract(zz * 1.4));
    float stripe = smoothstep(0.02, 0.0, abs(a.x * z - 0.12));
    lum = (uv.y < 0.0 ? 0.22 + boards * 0.06 + stripe * 0.05 : 0.12);
  }
  lum *= fog;
  // door of light at the far end
  float dw = mix(0.004, 0.05, uDoor), dh = 0.085;
  float endRect = smoothstep(0.012, 0.0, max(a.x - dw, abs(uv.y + 0.02) - dh));
  lum += endRect * 1.1 + exp(-length(uv * vec2(1.0, 1.6)) * (7.0 - uDoor * 3.0)) * (0.25 + uDoor * 0.35);
  vec3 col = mix(uTeal * 0.55, uAmber * (0.8 + 0.3 * uWarm), smoothstep(0.18, 0.95 - 0.25 * uWarm, lum));
  col *= 0.15 + lum;
  col *= 1.0 - 0.55 * dot(uv0 * vec2(0.8, 1.1), uv0 * vec2(0.8, 1.1));
  col += (hash(floor(gl_FragCoord.xy) + floor(uTime * 12.0)) - 0.5) * uGrain;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`;

export interface Corridor { draw: (s: Partial<State>) => void; canvas: HTMLCanvasElement; ok: boolean; dispose: () => void }
export interface State { time: number; cam: number; door: number; grain: number; lamp: number; off: number; warm: number }

const rgb01 = (cssVar: string): [number, number, number] => {
  const c = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true })!;
  c.fillStyle = '#000';
  c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim() || '#888';
  c.fillRect(0, 0, 1, 1);
  const d = c.getImageData(0, 0, 1, 1).data;
  return [d[0] / 255, d[1] / 255, d[2] / 255];
};

export function createCorridor(canvas: HTMLCanvasElement): Corridor {
  const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true, alpha: false });
  if (!gl) return { draw: () => undefined, canvas, ok: false, dispose: () => undefined };
  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return { draw: () => undefined, canvas, ok: false, dispose: () => undefined };
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const U = { res: u('uRes'), time: u('uTime'), cam: u('uCam'), door: u('uDoor'), grain: u('uGrain'), lamp: u('uLamp'), off: u('uOff'), warm: u('uWarm'), teal: u('uTeal'), amber: u('uAmber') };
  gl.uniform3fv(U.teal, rgb01('--teal'));
  gl.uniform3fv(U.amber, rgb01('--amber'));
  const state: State = { time: 0, cam: 0, door: 0, grain: 0.035, lamp: 1, off: 0, warm: 0.5 };
  const draw = (s: Partial<State>) => {
    Object.assign(state, s);
    // On-page canvases follow their CSS box (DPR capped at 2); detached ones keep their set size.
    if (canvas.isConnected) {
      const dpr = Math.min(2, devicePixelRatio || 1);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    }
    const w = canvas.width, h = canvas.height;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.res, w, h);
    gl.uniform1f(U.time, state.time);
    gl.uniform1f(U.cam, state.cam);
    gl.uniform1f(U.door, state.door);
    gl.uniform1f(U.grain, state.grain);
    gl.uniform1f(U.lamp, state.lamp);
    gl.uniform1f(U.off, state.off);
    gl.uniform1f(U.warm, state.warm);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const dispose = () => gl.getExtension('WEBGL_lose_context')?.loseContext();
  return { draw, canvas, ok: true, dispose };
}
