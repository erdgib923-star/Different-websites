// Stable-fluids solver passes (semi-Lagrangian advection, vorticity confinement, Jacobi pressure
// projection), written for WebGL2 half-float render targets. Every pass is a fullscreen quad.
// Velocity is stored in grid cells per second; uTexel converts to UV.

export const passVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const advectFragment = /* glsl */ `
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;
varying vec2 vUv;
void main() {
  vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexel;
  gl_FragColor = texture2D(uSource, coord) / (1.0 + uDissipation * uDt);
}
`

/** Up to 12 gaussian splats in one pass: xy = point (uv), z = radius, w unused; value per splat. */
export const splatFragment = /* glsl */ `
uniform sampler2D uTarget;
uniform float uAspect;
uniform int uCount;
uniform vec4 uPoints[12];
uniform vec3 uValues[12];
varying vec2 vUv;
void main() {
  vec3 acc = texture2D(uTarget, vUv).xyz;
  for (int i = 0; i < 12; i++) {
    if (i >= uCount) break;
    vec2 p = vUv - uPoints[i].xy;
    p.x *= uAspect;
    acc += exp(-dot(p, p) / uPoints[i].z) * uValues[i];
  }
  gl_FragColor = vec4(acc, 1.0);
}
`

export const curlFragment = /* glsl */ `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}
`

/** Vorticity confinement + the "settle" attraction toward the headline mask + damping. */
export const forceFragment = /* glsl */ `
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform sampler2D uMask;
uniform vec2 uTexel;
uniform float uCurlStrength;
uniform float uDt;
uniform float uSettle;
uniform vec2 uMaskTexel;
varying vec2 vUv;
void main() {
  float L = texture2D(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture2D(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture2D(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 1e-4;
  force *= uCurlStrength * C;
  force.y *= -1.0;
  vec2 vel = texture2D(uVelocity, vUv).xy + force * uDt;
  // settle: flow up the gradient of the blurred letter mask, and calm down
  float mL = texture2D(uMask, vUv - vec2(uMaskTexel.x, 0.0)).g;
  float mR = texture2D(uMask, vUv + vec2(uMaskTexel.x, 0.0)).g;
  float mT = texture2D(uMask, vUv + vec2(0.0, uMaskTexel.y)).g;
  float mB = texture2D(uMask, vUv - vec2(0.0, uMaskTexel.y)).g;
  vec2 grad = vec2(mR - mL, mT - mB);
  vel += grad * uSettle * 900.0 * (1.0 / (uTexel.x * 410.0)) * uDt;
  vel *= 1.0 - clamp(uSettle * 2.5 * uDt, 0.0, 0.5);
  vel = clamp(vel, vec2(-1200.0), vec2(1200.0));
  gl_FragColor = vec4(vel, 0.0, 1.0);
}
`

export const divergenceFragment = /* glsl */ `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  vec2 C = texture2D(uVelocity, vUv).xy;
  float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  float B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  // reflective walls: the paper edge
  if (vUv.x - uTexel.x < 0.0) L = -C.x;
  if (vUv.x + uTexel.x > 1.0) R = -C.x;
  if (vUv.y + uTexel.y > 1.0) T = -C.y;
  if (vUv.y - uTexel.y < 0.0) B = -C.y;
  gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}
`

export const pressureFragment = /* glsl */ `
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float div = texture2D(uDivergence, vUv).x;
  gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
}
`

export const gradientFragment = /* glsl */ `
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  vec2 vel = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
  gl_FragColor = vec4(vel, 0.0, 1.0);
}
`

export const scaleFragment = /* glsl */ `
uniform sampler2D uSource;
uniform float uScale;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D(uSource, vUv) * uScale;
}
`

/** Dye settle: ink is drawn into the crisp letter mask and evaporates elsewhere. */
export const settleDyeFragment = /* glsl */ `
uniform sampler2D uDye;
uniform sampler2D uMask;
uniform float uSettle;
uniform float uDt;
varying vec2 vUv;
void main() {
  vec4 d = texture2D(uDye, vUv);
  float m = texture2D(uMask, vUv).r;
  float k = clamp(uSettle * uDt * 1.6, 0.0, 1.0);
  d.r = mix(d.r, mix(d.r * (1.0 - 0.9 * k), max(d.r, 1.25), m), k * (0.4 + 0.6 * m));
  d.g *= 1.0 - k * 0.6;
  gl_FragColor = d;
}
`

/** The paper sheet in the 3D scene: fibres + ink layers. */
export const paperVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`
export const paperFragment = /* glsl */ `
uniform sampler2D uDye;
uniform vec2 uDyeTexel;
uniform vec3 uPaper;
uniform vec3 uShade;
uniform vec3 uInk;
uniform vec3 uInk2;
uniform vec3 uVermilion;
varying vec2 vUv;
varying vec3 vWorld;
float h12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vn(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h12(i), h12(i + vec2(1, 0)), f.x), mix(h12(i + vec2(0, 1)), h12(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  vec4 d = texture2D(uDye, vUv);
  // fibres: stretched value noise, plus a soft vignette toward the sheet edge
  float fib = vn(vUv * vec2(900.0, 160.0)) * 0.5 + vn(vUv * vec2(260.0, 900.0)) * 0.5;
  float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x) * smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
  vec3 paper = mix(uShade, uPaper, 0.55 + 0.45 * edge) * (0.97 + 0.05 * fib);
  float ink = 1.0 - exp(-max(d.r, 0.0) * 2.4);
  float ver = 1.0 - exp(-max(d.g, 0.0) * 2.0);
  // wet edges: pigment collects where density changes
  float dx = texture2D(uDye, vUv + vec2(uDyeTexel.x, 0.0)).r - texture2D(uDye, vUv - vec2(uDyeTexel.x, 0.0)).r;
  float dy = texture2D(uDye, vUv + vec2(0.0, uDyeTexel.y)).r - texture2D(uDye, vUv - vec2(0.0, uDyeTexel.y)).r;
  float rim = clamp(length(vec2(dx, dy)) * 6.0, 0.0, 1.0);
  vec3 inkCol = mix(uInk2, uInk, smoothstep(0.2, 0.9, ink));
  vec3 col = mix(paper, inkCol, clamp(ink + rim * 0.25, 0.0, 1.0));
  col = mix(col, uVermilion, ver * 0.92);
  col *= 0.96 + 0.04 * fib;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const deskVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 wp = vec4(cameraPosition + position * 500.0, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
  gl_Position.z = gl_Position.w * 0.99999;
}
`
export const deskFragment = /* glsl */ `
uniform vec3 uShade;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  gl_FragColor = vec4(uShade * (0.82 + 0.1 * d.y), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
