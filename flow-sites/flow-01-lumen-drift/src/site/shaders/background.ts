import { NOISE } from './noise'

// Sky dome that travels with the camera: palette gradient (bg at zenith, fog at the horizon),
// an fbm nebula drifting with progress, sparse static stars, and the luminous horizon band.

export const bgVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 wp = vec4(cameraPosition + position * 1400.0, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
  gl_Position.z = gl_Position.w * 0.99999;
}
`

export const bgFragment = /* glsl */ `
uniform float uTime;
uniform float uProgress;
uniform float uNebula;
uniform float uHorizon;
uniform vec3 uBg;
uniform vec3 uFog;
uniform vec3 uPrimary;
uniform vec3 uAccent;
varying vec3 vDir;
${NOISE}
void main() {
  vec3 dir = normalize(vDir);
  float y = dir.y;
  vec3 col = mix(uFog, uBg, smoothstep(-0.04, 0.55, y));
  col = mix(col, uBg * 0.55, smoothstep(-0.04, -0.6, y));
  float n = fbm(dir * 2.4 + vec3(uTime * 0.008, 0.0, uProgress * 2.5));
  float neb = smoothstep(0.42, 0.85, n);
  col += mix(uPrimary, uAccent, n) * neb * uNebula * 0.16;
  vec3 cell = floor(dir * 220.0);
  float star = step(0.9978, hash13(cell)) * smoothstep(0.45, 0.0, length(fract(dir * 220.0) - 0.5));
  col += vec3(star) * 0.55 * smoothstep(-0.02, 0.2, y) * (1.0 - 0.6 * uHorizon);
  float band = exp(-abs(y - 0.012) * 30.0);
  float wide = exp(-abs(y) * 5.0);
  col += mix(uPrimary, uAccent, 0.55) * (band * 1.5 + wide * 0.22) * uHorizon;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
