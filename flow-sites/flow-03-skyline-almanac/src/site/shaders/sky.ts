import { NOISE } from './noise'

// Skyline Almanac shaders. One shared lighting model driven by a time-of-day sun direction:
//   sun colour = primary role, zenith = bg role, horizon = fog role, city lights = accent role.
// Aerial perspective: everything fades toward the sky colour in its view direction, with
// in-scattered sun light near the sun.

const SKY = /* glsl */ `
uniform vec3 uSky;
uniform vec3 uHorizon;
uniform vec3 uSun;
uniform vec3 uSunDir;
float sunUp() { return smoothstep(-0.12, 0.06, uSunDir.y); }
vec3 skyColor(vec3 dir) {
  float h = max(dir.y, 0.0);
  vec3 col = mix(uHorizon, uSky, pow(smoothstep(0.0, 0.65, h), 0.7));
  col = mix(col, uHorizon * 0.72, smoothstep(0.0, -0.35, dir.y));
  float sd = max(dot(dir, uSunDir), 0.0);
  col += uSun * (pow(sd, 6.0) * 0.32 + pow(sd, 48.0) * 0.5) * sunUp();
  return col;
}
vec3 aerial(vec3 col, vec3 worldPos, float density) {
  vec3 v = worldPos - cameraPosition;
  float d = length(v);
  float f = 1.0 - exp(-density * d);
  return mix(col, skyColor(v / d), f);
}
`

export const skyVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 wp = vec4(cameraPosition + position * 2500.0, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
  gl_Position.z = gl_Position.w * 0.99999;
}
`
export const skyFragment = /* glsl */ `
uniform float uStars;
uniform float uTime;
varying vec3 vDir;
${NOISE}
${SKY}
void main() {
  vec3 dir = normalize(vDir);
  vec3 col = skyColor(dir);
  float sd = dot(dir, uSunDir);
  col += uSun * smoothstep(0.99935, 0.9997, sd) * 7.0 * sunUp();
  // stars (static, no twinkle) and a moon at night
  vec3 cell = floor(dir * 320.0);
  float st = step(0.9965, hash13(cell)) * smoothstep(0.45, 0.0, length(fract(dir * 320.0) - 0.5));
  col += vec3(st) * uStars * 0.9 * smoothstep(0.0, 0.25, dir.y);
  vec3 moonDir = normalize(vec3(0.35, 0.42, -0.84));
  float md = dot(dir, moonDir);
  col += vec3(0.92, 0.94, 1.0) * smoothstep(0.99955, 0.99975, md) * 2.6 * uStars;
  col += vec3(0.5, 0.55, 0.75) * pow(max(md, 0.0), 300.0) * 0.4 * uStars;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const terrainVertex = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`
export const terrainFragment = /* glsl */ `
uniform vec3 uLand;
uniform vec3 uAccent;
uniform float uLights;
uniform float uFogDensity;
uniform float uHaze;
uniform vec2 uCity;
uniform float uCityR;
varying vec3 vWorld;
varying vec3 vNormal;
${NOISE}
${SKY}
void main() {
  vec3 n = normalize(vNormal);
  float slope = 1.0 - n.y;
  float tex = fbm(vWorld * 0.05);
  vec3 grass = uLand * (0.62 + 0.55 * tex) * mix(0.8, 1.15, smoothstep(0.0, 45.0, vWorld.y));
  vec3 rock = mix(vec3(0.34, 0.32, 0.31), uLand, 0.25) * (0.7 + 0.6 * tex);
  vec3 snow = vec3(0.9, 0.92, 0.96);
  vec3 alb = mix(grass, rock, smoothstep(0.22, 0.45, slope));
  float snowLine = 92.0 + (tex - 0.5) * 30.0;
  alb = mix(alb, snow, smoothstep(snowLine, snowLine + 18.0, vWorld.y) * (1.0 - smoothstep(0.5, 0.75, slope)));
  float city = 1.0 - smoothstep(uCityR * 0.8, uCityR * 1.25, distance(vWorld.xz, uCity));
  alb = mix(alb, vec3(0.2, 0.2, 0.21), city * 0.55);
  float diff = max(dot(n, uSunDir), 0.0) * sunUp();
  vec3 amb = mix(uHorizon, uSky, n.y * 0.5 + 0.5) * 0.38;
  vec3 col = alb * (uSun * diff * 1.15 + amb);
  // warm light pollution on the ground at night
  col += uAccent * city * uLights * 0.06;
  col = aerial(col, vWorld, uFogDensity * uHaze);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const cloudVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`
export const cloudFragment = /* glsl */ `
uniform float uCover;
uniform float uTime;
uniform float uLayer;
uniform float uHeight;
uniform float uLights;
uniform vec3 uAccent;
uniform float uFogDensity;
varying vec3 vWorld;
${NOISE}
${SKY}
void main() {
  vec2 p = vWorld.xz * 0.0032 + vec2(uTime * 0.004, uTime * 0.0016) + uLayer * 7.3;
  float n = fbm(vec3(p, uLayer * 3.1));
  // crisp-edged cumulus: narrow coverage ramp leaves real gaps between clouds
  float lo = 0.58 - uCover * 0.2;
  float density = smoothstep(lo, lo + 0.07, n);
  float core = smoothstep(lo + 0.05, lo + 0.22, n);
  float n2 = fbm(vec3(p + uSunDir.xz * 0.03, uLayer * 3.1));
  float shade = clamp((n - n2) * 7.0 + 0.5, 0.0, 1.0);
  float light = mix(0.22, 1.0, sunUp());
  vec3 shadow = mix(uHorizon, uSky, 0.45) * 0.62;
  vec3 col = mix(shadow, uSun * 1.25 + uSky * 0.12, shade * (0.55 + 0.45 * (1.0 - core))) * light;
  col += uAccent * uLights * 0.12 * (1.0 - shade);
  float camFade = smoothstep(4.0, 22.0, abs(cameraPosition.y - uHeight));
  float d = distance(vWorld, cameraPosition);
  float a = density * (0.6 + 0.35 * core) * camFade * exp(-d * 0.0006);
  col = aerial(col, vWorld, uFogDensity * 0.6);
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const buildingVertex = /* glsl */ `
attribute vec4 aB; // delay, height, seed, unused
uniform float uRise;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vSeed;
varying float vK;
void main() {
  vec3 p = position;
  float k = smoothstep(aB.x, aB.x + 0.28, uRise);
  p.y *= aB.y * max(k, 0.001);
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vSeed = aB.z;
  vK = k;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`
export const buildingFragment = /* glsl */ `
uniform vec3 uLand;
uniform vec3 uAccent;
uniform float uLights;
uniform float uFogDensity;
uniform float uHaze;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vSeed;
varying float vK;
${NOISE}
${SKY}
void main() {
  vec3 n = normalize(vNormal);
  float roof = step(0.5, n.y);
  vec3 alb = mix(vec3(0.5, 0.51, 0.55), vec3(0.62, 0.57, 0.5), vSeed) * (0.75 + 0.35 * fract(vSeed * 7.3));
  alb = mix(alb, alb * 0.55, roof);
  float u = dot(vWorld.xz, vec2(-n.z, n.x));
  vec2 g = vec2(u / 1.7, vWorld.y / 2.6);
  vec2 cell = floor(g);
  vec2 f = fract(g);
  float win = step(0.2, f.x) * step(f.x, 0.8) * step(0.28, f.y) * step(f.y, 0.78) * (1.0 - roof) * step(2.0, vWorld.y);
  float lit = step(hash13(vec3(cell, vSeed * 91.0)), uLights * 0.72);
  float diff = max(dot(n, uSunDir), 0.0) * sunUp();
  vec3 amb = mix(uHorizon, uSky, n.y * 0.5 + 0.5) * 0.4;
  vec3 col = alb * (uSun * diff * 1.1 + amb);
  vec3 glass = skyColor(reflect(normalize(vWorld - cameraPosition), n)) * 0.75;
  col = mix(col, glass, win * 0.32 * (0.6 + 0.4 * fract(vSeed * 5.7)) * (1.0 - uLights * 0.8));
  col += uAccent * win * lit * uLights * (1.6 + 1.2 * fract(vSeed * 13.1));
  col = aerial(col, vWorld, uFogDensity * uHaze);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const streetVertex = /* glsl */ `
attribute float aSeed;
uniform float uDpr;
uniform float uLights;
uniform float uFogDensity;
varying float vAlpha;
void main() {
  vec4 mv = viewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = max(-mv.z, 1.0);
  gl_PointSize = clamp(uDpr * 220.0 / depth, 1.5, 14.0);
  vAlpha = uLights * smoothstep(aSeed * 0.5, aSeed * 0.5 + 0.3, uLights) * exp(-uFogDensity * 0.6 * depth);
}
`
export const streetFragment = /* glsl */ `
uniform vec3 uAccent;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = (smoothstep(0.5, 0.0, d) * 0.6 + smoothstep(0.15, 0.0, d)) * vAlpha;
  gl_FragColor = vec4(uAccent * 2.2 * a, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
