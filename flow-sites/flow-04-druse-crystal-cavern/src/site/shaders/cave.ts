import { NOISE } from './noise'

// Druse shaders. Lighting in the cave = a soft "headlamp" from the camera + chapter light +
// daylight leaking in at the mouth. Crystals use a cheap fake refraction with dispersion:
// refract the view ray through the flat facet at three IORs and look up a procedural light field.

export const skyVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 wp = vec4(cameraPosition + position * 900.0, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
  gl_Position.z = gl_Position.w * 0.99999;
}
`
export const skyFragment = /* glsl */ `
uniform vec3 uFog;
uniform vec3 uLight;
uniform float uDaylight;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  vec3 day = mix(vec3(0.78, 0.74, 0.86), vec3(0.36, 0.38, 0.6), smoothstep(-0.1, 0.7, d.y));
  vec3 col = mix(uFog, day, uDaylight);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const rockVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`
export const rockFragment = /* glsl */ `
uniform vec3 uRock;
uniform vec3 uFog;
uniform vec3 uLight;
uniform vec3 uCrystal;
uniform float uWallLight;
uniform float uDaylight;
uniform float uSparkle;
uniform float uFogDensity;
uniform float uTime;
varying vec3 vWorld;
${NOISE}
void main() {
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 toCam = cameraPosition - vWorld;
  float d = length(toCam);
  vec3 v = toCam / d;
  if (dot(n, v) < 0.0) n = -n;
  float tex = fbm(vWorld * 0.35);
  vec3 alb = (uRock * 4.0 + vec3(0.07)) * (0.45 + 0.8 * tex);
  // mineral veins tinted by the crystal colour
  float vein = smoothstep(0.62, 0.7, fbm(vWorld * 0.12 + 3.0));
  alb = mix(alb, uCrystal * 0.55, vein * 0.5);
  float lamp = max(dot(n, v), 0.0) * 1.7 / (1.0 + d * 0.03);
  float day = uDaylight * exp(min(vWorld.z - 14.0, 0.0) * 0.05);
  vec3 col = alb * (lamp * 0.9 * (0.35 + 0.65 * uWallLight) + uLight * 0.22 * uWallLight + vec3(0.9, 0.86, 1.0) * day * 0.9);
  // glitter: tiny facets that catch the lamp
  vec3 cell = floor(vWorld * 7.0);
  float h = hash13(cell);
  float glint = step(0.993, h) * smoothstep(0.35, 0.0, length(fract(vWorld * 7.0) - 0.5)) * pow(max(dot(n, v), 0.0), 4.0);
  col += mix(uLight, vec3(1.0), 0.5) * glint * uSparkle * 2.5 / (1.0 + d * 0.06);
  col = mix(uFog, col, exp(-uFogDensity * d));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const crystalVertex = /* glsl */ `
attribute vec2 aC; // seed, glow phase
varying vec3 vWorld;
varying float vAxis;
varying float vSeed;
varying float vPhase;
void main() {
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vAxis = clamp(position.y, 0.0, 1.0);
  vSeed = aC.x;
  vPhase = aC.y;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`
export const crystalFragment = /* glsl */ `
uniform vec3 uCrystal;
uniform vec3 uLight;
uniform vec3 uFog;
uniform float uGlow;
uniform float uFogDensity;
uniform float uTime;
varying vec3 vWorld;
varying float vAxis;
varying float vSeed;
varying float vPhase;
// procedural light field seen through the crystal: soft bands + a bright core
float field(vec3 d, float s) {
  float b = sin(dot(d, vec3(3.1, 5.7, 2.3)) * 5.0 + s * 20.0) * 0.5 + 0.5;
  float c = pow(max(d.y * 0.5 + 0.5, 0.0), 3.0);
  return b * b * 0.7 + c * 0.6;
}
void main() {
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 toCam = cameraPosition - vWorld;
  float d = length(toCam);
  vec3 v = toCam / d;
  if (dot(n, v) < 0.0) n = -n;
  vec3 rd = -v;
  float ndv = max(dot(n, v), 0.0);
  float fres = pow(1.0 - ndv, 3.0);
  // dispersion: three IORs, one channel each
  vec3 rr = refract(rd, n, 1.0 / 1.44);
  vec3 rg = refract(rd, n, 1.0 / 1.47);
  vec3 rb = refract(rd, n, 1.0 / 1.51);
  vec3 disp = vec3(field(rr, vSeed), field(rg, vSeed), field(rb, vSeed));
  vec3 body = uCrystal * (0.3 + 0.25 * vSeed);
  vec3 col = body * 0.45 + uCrystal * disp * 1.25;
  // emissive inner glow: strongest at the base, slow breathing (< 0.15 Hz)
  float pulse = 0.75 + 0.25 * sin(uTime * 0.8 + vPhase * 6.2831);
  float glow = uGlow * pow(1.0 - vAxis, 1.6) * pulse;
  col += mix(uCrystal, uLight, 0.5) * glow * 2.4;
  // light caught at the silhouette edges
  col += mix(uCrystal, uLight, 0.6) * fres * uGlow * 1.2;
  // reflections + lamp highlight on the facets
  col += uLight * fres * 0.7;
  col += mix(uLight, vec3(1.0), 0.6) * pow(ndv, 24.0) * 0.9 / (1.0 + d * 0.05);
  col = mix(uFog, col, exp(-uFogDensity * d));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const dustVertex = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uBox;
uniform float uDpr;
uniform float uDust;
uniform float uFogDensity;
varying float vAlpha;
void main() {
  vec3 drift = vec3(sin(uTime * 0.07 + aSeed * 40.0), sin(uTime * 0.05 + aSeed * 23.0) * 0.6 - uTime * 0.02, cos(uTime * 0.06 + aSeed * 31.0));
  vec3 local = fract(position + (drift - cameraPosition) / uBox) - 0.5;
  vec3 world = cameraPosition + local * uBox;
  vec4 mv = viewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = max(-mv.z, 0.1);
  float size = (0.5 + aSeed * 1.4) * uDpr * 10.0 / depth;
  gl_PointSize = clamp(size, 1.0, 9.0);
  float edge = 1.0 - smoothstep(0.32, 0.5, max(max(abs(local.x), abs(local.y)), abs(local.z)));
  float twinkle = 0.6 + 0.4 * sin(uTime * 0.9 + aSeed * 60.0);
  vAlpha = edge * uDust * twinkle * exp(-uFogDensity * depth) * clamp(size, 0.3, 1.0);
}
`
export const dustFragment = /* glsl */ `
uniform vec3 uLight;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d) * vAlpha;
  gl_FragColor = vec4(uLight * 1.6 * a, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
