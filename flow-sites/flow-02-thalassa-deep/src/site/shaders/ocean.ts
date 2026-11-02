import { NOISE } from './noise'

// All Thalassa shaders. Fog is depth-tinted: every surface mixes toward uFog with exp(-density*d).
// No backticks or template placeholders inside GLSL apart from the shared NOISE include.

const CAUSTICS = /* glsl */ `
vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
// Animated Worley noise, F2 - F1: thin bright ridges between moving cells.
float causticLayer(vec2 p, float t) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float f1 = 8.0;
  float f2 = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = hash22(i + g);
      o = 0.5 + 0.45 * sin(t + 6.2831 * o);
      float d = length(g + o - f);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
    }
  }
  return f2 - f1;
}
float caustics(vec2 p, float t) {
  float a = 1.0 - smoothstep(0.0, 0.1, causticLayer(p, t));
  float b = 1.0 - smoothstep(0.0, 0.08, causticLayer(p * 1.7 + 3.1, t * 1.3));
  return a * a * a * 0.85 + b * b * b * 0.5;
}
`

// Water colour seen in a direction: the dome uses it, and every fogged surface fades toward it,
// so distant geometry dissolves into the water instead of leaving a silhouette.
const WATER = /* glsl */ `
vec3 waterColor(vec3 dir, vec3 water, vec3 fog, vec3 light, float surface) {
  vec3 col = mix(water * 0.55, fog, smoothstep(-0.7, 0.15, dir.y));
  return mix(col, fog * 1.25 + light * 0.18 * surface, smoothstep(0.05, 0.95, dir.y));
}
`

// ---- water dome (background) ------------------------------------------------------------------
export const domeVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 wp = vec4(cameraPosition + position * 1400.0, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
  gl_Position.z = gl_Position.w * 0.99999;
}
`
export const domeFragment = /* glsl */ `
uniform vec3 uWater;
uniform vec3 uFog;
uniform vec3 uLight;
uniform float uSurface;
uniform float uTime;
varying vec3 vDir;
${NOISE}
${WATER}
void main() {
  vec3 dir = normalize(vDir);
  float up = dir.y;
  vec3 col = waterColor(dir, uWater, uFog, uLight, uSurface);
  // Snell's window: the bright disc of sky seen from below, rippling
  float ripple = vnoise(vec3(dir.xz * 9.0, uTime * 0.35));
  float window = smoothstep(0.62, 0.92, up + (ripple - 0.5) * 0.05);
  col += uLight * window * uSurface * (1.1 + 0.4 * ripple);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

// ---- surface seen from below ------------------------------------------------------------------
export const surfaceVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`
export const surfaceFragment = /* glsl */ `
uniform vec3 uLight;
uniform vec3 uFog;
uniform float uSurface;
uniform float uTime;
uniform float uFogDensity;
varying vec3 vWorld;
${NOISE}
${CAUSTICS}
void main() {
  // domain-warped noise ridges: soft, organic bands of light on the underside of the waves
  vec2 q = vWorld.xz * 0.045;
  vec2 warp = vec2(vnoise(vec3(q * 1.3, uTime * 0.15)), vnoise(vec3(q * 1.3 + 7.1, uTime * 0.15)));
  float r1 = 1.0 - abs(vnoise(vec3(q + warp * 1.6, uTime * 0.22)) * 2.0 - 1.0);
  float r2 = 1.0 - abs(vnoise(vec3(q * 2.3 - warp, uTime * 0.3 + 4.0)) * 2.0 - 1.0);
  float c = pow(r1, 8.0) * 0.9 + pow(r2, 10.0) * 0.6;
  float n = vnoise(vec3(vWorld.xz * 0.05, uTime * 0.2));
  vec3 col = uLight * (0.32 + 0.25 * n + 0.75 * c) * uSurface;
  float d = distance(vWorld, cameraPosition);
  col = mix(uFog * 1.25, col, exp(-uFogDensity * 0.6 * d));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

// ---- reef wall and abyssal floor --------------------------------------------------------------
export const reefVertex = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`
export const reefFragment = /* glsl */ `
uniform vec3 uRock;
uniform vec3 uFog;
uniform vec3 uLight;
uniform vec3 uAccent;
uniform float uCaustics;
uniform float uAmbient;
uniform float uBio;
uniform float uTime;
uniform float uFogDensity;
uniform vec3 uWater;
uniform float uSurface;
varying vec3 vWorld;
varying vec3 vNormal;
${NOISE}
${CAUSTICS}
${WATER}
void main() {
  vec3 n = normalize(vNormal);
  float tex = fbm(vWorld * 0.09);
  vec3 rock = uRock * (0.45 + 0.75 * tex);
  float daylight = exp(vWorld.y * 0.011);
  float ndl = clamp(dot(n, normalize(vec3(0.35, 1.0, 0.2))), 0.0, 1.0);
  vec3 col = rock * (0.16 + 0.84 * ndl * daylight * uAmbient + 0.18 * uBio);
  // caustics projected from above (stronger on up-facing surfaces, fade with depth)
  vec2 cp = vec2(vWorld.z + vWorld.y * 0.35, vWorld.x + vWorld.y * 0.2) * 0.3;
  float c = caustics(cp, uTime * 0.7);
  col += uLight * c * uCaustics * daylight * (0.35 + 0.65 * ndl) * 1.4;
  // bioluminescent speckles in the deep: slow pulses (< 0.2 Hz)
  vec3 cell = floor(vWorld * 0.55);
  float h = hash13(cell);
  float spot = step(0.982, h) * smoothstep(0.42, 0.0, length(fract(vWorld * 0.55) - 0.5));
  float pulse = 0.55 + 0.45 * sin(uTime * 0.9 + h * 40.0);
  float deep = 1.0 - exp(vWorld.y * 0.008);
  col += mix(uLight, uAccent, fract(h * 13.7)) * spot * pulse * uBio * deep * 3.0;
  vec3 toP = vWorld - cameraPosition;
  float d = length(toP);
  col = mix(waterColor(toP / d, uWater, uFog, uLight, uSurface), col, exp(-uFogDensity * d));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

// ---- god rays: instanced cylindrical billboards hanging from the surface ----------------------
export const raysVertex = /* glsl */ `
attribute vec4 aRay; // x, z, width, phase
uniform float uLength;
varying vec2 vUv;
varying float vPhase;
varying float vY;
void main() {
  vUv = uv;
  vPhase = aRay.w;
  float y = -uv.y * uLength;
  vec3 base = vec3(aRay.x + y * -0.28, y, aRay.y + y * 0.12);
  vec3 toCam = cameraPosition - base;
  vec3 right = normalize(vec3(toCam.z, 0.0, -toCam.x) + vec3(1e-4, 0.0, 0.0));
  vec3 p = base + right * (uv.x - 0.5) * aRay.z * (1.0 + uv.y * 0.9);
  vY = p.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
`
export const raysFragment = /* glsl */ `
uniform vec3 uLight;
uniform float uRays;
uniform float uTime;
varying vec2 vUv;
varying float vPhase;
varying float vY;
${NOISE}
void main() {
  float edge = 1.0 - abs(vUv.x * 2.0 - 1.0);
  edge = edge * edge;
  float along = (1.0 - vUv.y) * smoothstep(0.0, 0.08, vUv.y);
  float flicker = 0.55 + 0.45 * vnoise(vec3(vUv.x * 3.0, vUv.y * 2.0 - uTime * 0.12, vPhase));
  float a = edge * along * flicker * uRays * 0.22;
  gl_FragColor = vec4(uLight * a, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

// ---- marine snow: a box of flakes that wraps around the camera ---------------------------------
export const snowVertex = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uBox;
uniform float uDpr;
uniform float uSnow;
uniform float uFogDensity;
uniform float uSpeed;
varying float vAlpha;
varying float vSeed;
void main() {
  vec3 drift = vec3(sin(uTime * 0.12 + aSeed * 30.0) * 0.6, -uTime * 0.35, cos(uTime * 0.1 + aSeed * 17.0) * 0.6);
  vec3 local = fract(position + (drift - cameraPosition) / uBox) - 0.5;
  vec3 world = cameraPosition + local * uBox;
  vec4 mv = viewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = max(-mv.z, 0.1);
  float size = (0.6 + aSeed * 1.6) * uDpr * 14.0 / depth;
  gl_PointSize = clamp(size, 1.0, 12.0);
  float edge = 1.0 - smoothstep(0.32, 0.5, max(max(abs(local.x), abs(local.y)), abs(local.z)));
  vAlpha = edge * exp(-uFogDensity * 1.4 * depth) * uSnow * clamp(size, 0.25, 1.0) * (0.7 + uSpeed * 0.6);
  vSeed = aSeed;
}
`
export const snowFragment = /* glsl */ `
uniform vec3 uFog;
uniform vec3 uLight;
varying float vAlpha;
varying float vSeed;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.1, d) * vAlpha;
  vec3 col = mix(uFog * 2.2, uLight, 0.35 + 0.3 * vSeed);
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

// ---- jellyfish: instanced bell + tentacles, fresnel glow --------------------------------------
export const jellyVertex = /* glsl */ `
attribute float aPart;   // 0 bell, 1 tentacle
attribute float aV;      // 0 at the bell rim -> 1 at the tentacle tip
attribute vec4 aJelly;   // phase, magenta mix, brightness, scale
uniform float uTime;
varying vec3 vNormalV;
varying vec3 vViewDir;
varying float vPart;
varying float vV;
varying vec4 vJelly;
varying float vDist;
void main() {
  vec3 p = position;
  float ph = aJelly.x;
  float pulse = sin(uTime * 1.4 + ph);
  if (aPart < 0.5) {
    float rim = 1.0 - clamp(p.y, 0.0, 1.0);
    p.xz *= 1.0 + 0.14 * pulse * rim;
    p.y *= 1.0 - 0.08 * pulse;
  } else {
    p.x += sin(uTime * 1.1 + aV * 4.5 + ph) * 0.35 * aV;
    p.z += cos(uTime * 0.9 + aV * 3.7 + ph * 1.3) * 0.3 * aV;
  }
  vec4 world = modelMatrix * instanceMatrix * vec4(p, 1.0);
  world.y += sin(uTime * 0.3 + ph) * 0.8;
  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;
  vNormalV = normalize(normalMatrix * mat3(instanceMatrix) * normal);
  vViewDir = normalize(-mv.xyz);
  vPart = aPart;
  vV = aV;
  vJelly = aJelly;
  vDist = -mv.z;
}
`
export const jellyFragment = /* glsl */ `
uniform vec3 uLight;
uniform vec3 uAccent;
uniform vec3 uFog;
uniform float uBio;
uniform float uFogDensity;
varying vec3 vNormalV;
varying vec3 vViewDir;
varying float vPart;
varying float vV;
varying vec4 vJelly;
varying float vDist;
void main() {
  vec3 glow = mix(uLight, uAccent, vJelly.y);
  float fres = pow(1.0 - abs(dot(normalize(vNormalV), vViewDir)), 2.2);
  float body = vPart < 0.5 ? (0.12 + fres * 1.3) : (1.0 - vV) * 0.9;
  float fog = exp(-uFogDensity * 0.8 * vDist);
  float a = body * vJelly.z * uBio * fog * 1.4;
  gl_FragColor = vec4(glow * a * 2.2, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

// ---- lures: deep glowing points ---------------------------------------------------------------
export const lureVertex = /* glsl */ `
attribute vec2 aLure; // phase, magenta mix
uniform float uTime;
uniform float uDpr;
uniform float uBio;
uniform float uFogDensity;
varying float vAlpha;
varying float vMix;
void main() {
  vec3 p = position + vec3(sin(uTime * 0.2 + aLure.x) * 0.6, sin(uTime * 0.27 + aLure.x * 2.0) * 0.4, 0.0);
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = max(-mv.z, 0.1);
  gl_PointSize = clamp(uDpr * 240.0 / depth, 3.0, 40.0);
  float pulse = 0.6 + 0.4 * sin(uTime * 0.8 + aLure.x * 9.0);
  vAlpha = uBio * pulse * exp(-uFogDensity * 0.45 * depth);
  vMix = aLure.y;
}
`
export const lureFragment = /* glsl */ `
uniform vec3 uLight;
uniform vec3 uAccent;
varying float vAlpha;
varying float vMix;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.12, 0.0, d);
  float halo = smoothstep(0.5, 0.0, d);
  float a = (core * 1.6 + halo * halo * 0.5) * vAlpha;
  gl_FragColor = vec4(mix(uLight, uAccent, vMix) * 2.0 * a, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
