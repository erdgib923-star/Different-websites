import { NOISE } from './noise'

// Rootwork shaders. One shared wind function moves branches and attached leaves identically.
// Light: one sun direction + hemisphere ambient from the sky palette; fog fades to the haze colour.

const COMMON = /* glsl */ `
uniform float uTime;
uniform float uWind;
uniform vec3 uSky;
uniform vec3 uHaze;
uniform float uSunAmt;
uniform float uFogDensity;
const vec3 SUN = normalize(vec3(0.45, 0.8, 0.35));
vec3 windOffset(vec3 w) {
  float h = max(w.y, 0.0);
  float a = h * h * 0.0035 * uWind;
  return vec3(sin(uTime * 1.1 + w.y * 0.4 + w.x * 0.2) * a, 0.0, cos(uTime * 0.9 + w.y * 0.35) * a * 0.6);
}
vec3 shade(vec3 alb, vec3 n, float wrap) {
  float diff = max((dot(n, SUN) + wrap) / (1.0 + wrap), 0.0);
  vec3 amb = mix(uHaze, uSky, n.y * 0.5 + 0.5) * 0.42;
  return alb * (vec3(1.0, 0.96, 0.88) * diff * uSunAmt + amb);
}
vec3 fogged(vec3 col, vec3 wp) {
  float d = distance(wp, cameraPosition);
  return mix(uHaze, col, exp(-uFogDensity * d));
}
`

export const skyVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 wp = vec4(cameraPosition + position * 400.0, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
  gl_Position.z = gl_Position.w * 0.99999;
}
`
export const skyFragment = /* glsl */ `
uniform vec3 uSky;
uniform vec3 uHaze;
uniform float uSunAmt;
varying vec3 vDir;
const vec3 SUN = normalize(vec3(0.45, 0.8, 0.35));
void main() {
  vec3 d = normalize(vDir);
  vec3 col = mix(uHaze, uSky, smoothstep(-0.05, 0.6, d.y));
  float s = max(dot(d, SUN), 0.0);
  col += vec3(1.0, 0.93, 0.8) * (pow(s, 12.0) * 0.25 + pow(s, 400.0) * 1.5) * uSunAmt;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const groundVertex = /* glsl */ `
varying vec3 vWorld;
${NOISE}
void main() {
  vec3 p = position;
  float r = length(p.xz);
  p.y += (vnoise(vec3(p.xz * 0.12, 1.0)) - 0.5) * 1.4 * smoothstep(3.0, 16.0, r);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`
export const groundFragment = /* glsl */ `
uniform vec3 uGround;
uniform float uSnowCover;
varying vec3 vWorld;
${NOISE}
${COMMON}
void main() {
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  if (n.y < 0.0) n = -n;
  float tex = fbm(vWorld * 0.9);
  float r = length(vWorld.xz);
  vec3 grass = uGround * (0.7 + 0.55 * tex);
  vec3 soil = vec3(0.09, 0.055, 0.032) * (0.8 + 0.4 * tex);
  vec3 alb = mix(soil, grass, smoothstep(0.5, 1.7, r + (tex - 0.5)));
  float drift = smoothstep(0.32, 0.6, fbm(vWorld * 0.35) + uSnowCover * 0.4);
  alb = mix(alb, vec3(0.92, 0.94, 0.97), uSnowCover * drift);
  vec3 col = shade(alb, n, 0.2);
  gl_FragColor = vec4(fogged(col, vWorld), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const branchVertex = /* glsl */ `
attribute vec2 aGrow; // birth, duration
uniform float uGrowth;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vLocalY;
${COMMON}
void main() {
  float k = clamp((uGrowth - aGrow.x) / max(aGrow.y, 1e-3), 0.0, 1.0);
  vec3 p = position;
  p.y *= k;
  float thick = mix(0.32, 1.0, smoothstep(0.0, 1.0, uGrowth)) * smoothstep(0.0, 0.25, k);
  p.xz *= thick;
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  wp.xyz += windOffset(wp.xyz);
  vWorld = wp.xyz;
  // non-uniform instance scale (radius, length, radius): transform normals by the inverse
  // transpose, i.e. R * S^-1 * n = mat3(M) * (n / S^2), or sides would tilt toward +y
  vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * (normal / (sc * sc)));
  vLocalY = position.y;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`
export const branchFragment = /* glsl */ `
uniform float uSnowCover;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vLocalY;
${NOISE}
${COMMON}
void main() {
  vec3 n = normalize(vNormal);
  float bark = fbm(vec3(vWorld.x * 6.0, vWorld.y * 1.5, vWorld.z * 6.0));
  // linear albedo of dark bark (sRGB ~#4a3b30)
  vec3 alb = vec3(0.07, 0.048, 0.034) * (0.65 + 0.6 * bark);
  alb = mix(alb, vec3(0.92, 0.94, 0.97), uSnowCover * 0.9 * smoothstep(0.55, 0.9, n.y));
  vec3 col = shade(alb, n, 0.3);
  gl_FragColor = vec4(fogged(col, vWorld), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const leafVertex = /* glsl */ `
attribute vec4 aLeaf;  // position.xyz, size
attribute vec4 aLeaf2; // facing dir.xyz, birth
attribute float aSeed;
uniform float uGrowth;
uniform float uFoliage;
uniform float uFall;
uniform float uSnowCover;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vSeed;
varying float vFallen;
${COMMON}
void main() {
  vUv = uv;
  vSeed = aSeed;
  vec3 dir = normalize(aLeaf2.xyz);
  vec3 right = normalize(cross(dir, vec3(0.0, 1.0, 0.001)));
  vec3 fwd = normalize(cross(right, dir));
  float grow = smoothstep(aLeaf2.w, aLeaf2.w + 0.08, uGrowth) * uFoliage;
  float size = aLeaf.w * grow;
  vec2 l = position.xy;
  vec3 hanging = aLeaf.xyz + (right * l.x + fwd * (l.y + 0.5)) * size;
  hanging += windOffset(hanging);
  // falling: each leaf has its own moment, drifts on a spiral, lands flat on the ground
  float f = smoothstep(aSeed * 0.8, aSeed * 0.8 + 0.2, uFall);
  vec3 land = vec3(aLeaf.x * 1.2 + (aSeed - 0.5) * 3.0, 0.03 + aSeed * 0.03, aLeaf.z * 1.2 + (fract(aSeed * 7.31) - 0.5) * 3.0);
  float decay = 1.0 - uSnowCover * 0.9 * f;
  vec3 ground = land + vec3(l.x, 0.0, l.y + 0.5) * aLeaf.w * decay;
  float arc = sin(f * 3.14159);
  vec3 swirl = vec3(sin(f * 9.0 + aSeed * 30.0), 0.4, cos(f * 7.0 + aSeed * 20.0)) * arc * 1.4;
  vec3 wp = mix(hanging, ground, f) + swirl;
  vWorld = wp;
  vFallen = f;
  vNormal = normalize(mix(dir, vec3(0.0, 1.0, 0.0), f));
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}
`
export const leafFragment = /* glsl */ `
uniform vec3 uLeaf;
uniform vec3 uLeafB;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vSeed;
varying float vFallen;
${COMMON}
void main() {
  float x = (vUv.x - 0.5) * 2.0;
  float w = pow(sin(3.14159 * vUv.y), 0.8) * 0.95;
  if (abs(x) > w) discard;
  vec3 alb = mix(uLeaf, uLeafB, smoothstep(0.55, 1.0, vSeed) * 0.6) * (0.72 + 0.4 * fract(vSeed * 17.3));
  alb *= 1.0 - 0.25 * smoothstep(0.08, 0.0, abs(x));
  alb *= 1.0 - 0.3 * vFallen;
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 col = shade(alb, n, 0.7);
  col += alb * 0.25 * max(dot(-n, SUN), 0.0) * uSunAmt;
  gl_FragColor = vec4(fogged(col, vWorld), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const weatherVertex = /* glsl */ `
attribute float aSeed;
attribute float aType; // 0 leaf, 1 snow
uniform float uTime;
uniform float uDpr;
uniform float uFlying;
uniform float uSnow;
uniform float uWind;
uniform float uFogDensity;
varying float vAlpha;
varying float vType;
varying float vSeed;
void main() {
  float speed = aType > 0.5 ? 0.55 : 0.95;
  float y = mod(position.y * 14.0 - uTime * speed * (0.7 + aSeed * 0.6), 14.0);
  vec3 wp = vec3((position.x - 0.5) * 26.0, y, (position.z - 0.5) * 26.0);
  float sway = aType > 0.5 ? 0.35 : 1.1;
  wp.x += sin(uTime * 1.3 + aSeed * 40.0) * sway + uWind * (14.0 - y) * 0.15;
  wp.z += cos(uTime * 1.1 + aSeed * 23.0) * sway * 0.7;
  vec4 mv = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = max(-mv.z, 0.5);
  float base = aType > 0.5 ? 4.0 : 9.0;
  gl_PointSize = clamp(base * uDpr * 6.0 / depth, 1.5, 22.0);
  float amt = aType > 0.5 ? uSnow : uFlying;
  float fade = smoothstep(0.0, 1.5, y) * smoothstep(14.0, 12.0, y);
  vAlpha = amt * fade * exp(-uFogDensity * depth);
  vType = aType;
  vSeed = aSeed;
}
`
export const weatherFragment = /* glsl */ `
uniform vec3 uLeaf;
uniform vec3 uLeafB;
varying float vAlpha;
varying float vType;
varying float vSeed;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a;
  vec3 col;
  if (vType > 0.5) {
    a = smoothstep(0.5, 0.15, length(c));
    col = vec3(0.96, 0.97, 1.0);
  } else {
    float ang = vSeed * 6.2831;
    vec2 r = vec2(cos(ang) * c.x - sin(ang) * c.y, sin(ang) * c.x + cos(ang) * c.y);
    a = 1.0 - smoothstep(0.85, 1.0, length(r * vec2(2.2, 3.6)));
    col = mix(uLeaf, uLeafB, fract(vSeed * 3.7));
  }
  if (a * vAlpha < 0.02) discard;
  gl_FragColor = vec4(col, a * vAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
