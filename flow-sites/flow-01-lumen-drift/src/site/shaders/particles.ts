import { NOISE } from './noise'

// ONE particle system, one draw call. Six morph targets:
//   0 spark   (position attribute)      3 storm   (procedural curl vortex, here)
//   1 stream  (procedural, river spline) 4 bloom  (aBloom: phyllotaxis flower)
//   2 canyon  (aCanyon: noise walls)     5 horizon (aHorizon: luminous plain)
// Each particle evaluates the same smootherstep boundary ramps as sceneState(), shifted by a
// per-particle hash delay, so the swarm morphs as a wave, and curl noise swells mid-transition.

export const particleVertex = /* glsl */ `
uniform float uTime;
uniform float uProgress;
uniform float uDpr;
uniform float uSize;
uniform float uIntensity;
uniform float uTurb;
uniform float uSpin;
uniform float uRepel;
uniform float uSpeed;
uniform float uFogDensity;
uniform float uCountGain;
uniform float uB[5];
uniform float uW[5];
uniform vec3 uRiver[6];
uniform vec3 uStorm;
uniform vec3 uRayO;
uniform vec3 uRayD;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uAccent;

attribute vec3 aCanyon;
attribute vec3 aBloom;
attribute vec3 aHorizon;
attribute vec4 aSeed;

varying vec3 vColor;
varying float vAlpha;

${NOISE}

vec3 riverAt(float u) {
  float f = clamp(u, 0.0, 0.9999) * 5.0;
  int i = int(floor(f));
  float t = f - float(i);
  vec3 p0 = uRiver[max(i - 1, 0)];
  vec3 p1 = uRiver[i];
  vec3 p2 = uRiver[i + 1];
  vec3 p3 = uRiver[min(i + 2, 5)];
  return 0.5 * ((2.0 * p1) + (-p0 + p2) * t + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t * t + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t * t * t);
}

void main() {
  float pp = uProgress + (aSeed.w - 0.5) * 0.05;
  float s0 = sstep(uB[0] - uW[0], uB[0] + uW[0], pp);
  float s1 = sstep(uB[1] - uW[1], uB[1] + uW[1], pp);
  float s2 = sstep(uB[2] - uW[2], uB[2] + uW[2], pp);
  float s3 = sstep(uB[3] - uW[3], uB[3] + uW[3], pp);
  float s4 = sstep(uB[4] - uW[4], uB[4] + uW[4], pp);

  // 0 spark: a breathing point of light
  vec3 pos = position * (1.0 + 0.08 * sin(uTime * 1.3 + aSeed.x * 6.2831));
  float endFade = 1.0;

  // 1 stream: particles ride the river spline
  if (s0 > 0.0 && s1 < 1.0) {
    float u = fract(aSeed.x + uTime * 0.008 * (1.0 + uSpeed * 3.0));
    vec3 c = riverAt(u);
    vec3 tng = normalize(riverAt(u + 0.01) - c + vec3(0.0, 0.0, -1e-4));
    vec3 side = normalize(cross(tng, vec3(0.0, 1.0, 0.0)));
    float lat = (aSeed.y - 0.5) * 2.0;
    lat = lat * lat * lat * 2.6 + lat * 0.4;
    float vert = (aSeed.z - 0.5) * 0.5 + sin(u * 40.0 + uTime * 0.9 + lat) * 0.12;
    vec3 stream = c + side * lat + vec3(0.0, vert, 0.0);
    endFade = mix(1.0, smoothstep(0.0, 0.04, u) * smoothstep(1.0, 0.96, u), s0 * (1.0 - s1));
    pos = mix(pos, stream, s0);
  }
  // 2 canyon
  if (s1 > 0.0) pos = mix(pos, aCanyon, s1);
  // 3 storm: a vortex funnel, spun by uSpin
  if (s2 > 0.0 && s3 < 1.0) {
    // funnel shell with 5 twisted spiral arms (structure reads better than a filled volume)
    float h = mix(-6.0, 18.0, aSeed.y);
    float shell = 0.82 + 0.18 * aSeed.x;
    float r = mix(1.6, 12.0, pow(smoothstep(-6.0, 18.0, h), 1.3)) * shell;
    float arm = floor(aSeed.z * 5.0) / 5.0;
    float ang = arm * 6.2831 + (aSeed.z * 5.0 - floor(aSeed.z * 5.0)) * 0.55 + h * 0.32 + uTime * (0.1 + 1.1 / r) * (0.35 + uSpin);
    vec3 storm = vec3(uStorm.x + cos(ang) * r, uStorm.y + h - 6.0, uStorm.z + sin(ang) * r);
    pos = mix(pos, storm, s2);
  }
  // 4 bloom, 5 horizon
  if (s3 > 0.0) pos = mix(pos, aBloom, s3);
  if (s4 > 0.0) pos = mix(pos, aHorizon, s4);

  // curl-noise swell: always a little (uTurb), strongly while a morph is in flight
  float tr = 4.0 * (s0 * (1.0 - s0) + s1 * (1.0 - s1) + s2 * (1.0 - s2) + s3 * (1.0 - s3) + s4 * (1.0 - s4));
  float amp = uTurb * 0.9 + tr * 3.2;
  if (amp > 0.001) {
    vec3 q = pos * 0.11 + vec3(0.0, uTime * 0.05, aSeed.w);
    pos += curlFlow(q) * amp;
  }

  // cursor repulsion from the pointer ray
  vec3 v = pos - uRayO;
  float t = max(dot(v, uRayD), 0.0);
  vec3 d = pos - (uRayO + uRayD * t);
  float dist = length(d);
  float rad = 0.5 + t * 0.06;
  pos += (d / max(dist, 1e-3)) * (1.0 - smoothstep(0.0, rad, dist)) * uRepel * rad * 0.9;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = max(-mv.z, 0.05);
  float sizeRaw = uSize * (0.45 + aSeed.z * aSeed.z * aSeed.z * 1.8) * uDpr * 58.0 / depth;
  gl_PointSize = clamp(sizeRaw, 1.5, 40.0);

  vec3 col = mix(uPrimary, uSecondary, aSeed.x);
  col = mix(col, uAccent, step(0.93, aSeed.y));
  float core = (1.0 - s0) * (1.0 - smoothstep(0.0, 0.7, length(position)));
  col *= 1.0 + core * 0.8;
  float fog = exp(-uFogDensity * depth);
  vColor = col * uIntensity;
  // sub-pixel points keep their energy instead of flickering at 1px
  // thin the spark (everything converges on one point) so additive light never overflows half floats
  float sparkThin = mix(1.0, 0.05, (1.0 - s0) * (1.0 - smoothstep(0.0, 1.4, length(position))));
  vAlpha = fog * endFade * clamp(sizeRaw / 1.5, 0.2, 1.0) * uCountGain * sparkThin;
}
`

export const particleFragment = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.0, length(c));
  a *= a;
  gl_FragColor = vec4(vColor, a * vAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
