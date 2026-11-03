// Hydrargyr Audio: fullscreen ray-marched liquid metal (WebGL2 GLSL via three.js ShaderMaterial).
// Four procedural SDF forms built from primitives with smooth-min joins:
//   pool (flattened ellipsoid + droplets), headphone-like (capped-torus band, yokes, round cups),
//   watch-like (round case, bezel, curved straps, crown), sphere.
// The morph is the convex blend of the four distances by the sceneState weights (uW), plus a
// liquid wobble that peaks mid-morph. Reflections come from a procedural studio environment.

export const passVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const marchFragment = /* glsl */ `
uniform vec3 uCamPos;
uniform mat3 uCamRot;
uniform float uTanFov;
uniform float uAspect;
uniform float uTime;
uniform vec4 uW;
uniform float uRipple;
uniform float uWarmth;
uniform float uStudio;
uniform vec3 uCool;
uniform vec3 uWarm;
uniform vec3 uBg;
uniform vec3 uFog;
uniform int uSteps;
uniform float uAO;
varying vec2 vUv;

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}
float sdEllipsoid(vec3 p, vec3 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / k1;
}
float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}
float sdRoundCyl(vec3 p, float ra, float rb, float h) {
  vec2 d = vec2(length(p.xz) - 2.0 * ra + rb, abs(p.y) - h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rb;
}
float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}
float sdCappedTorus(vec3 p, vec2 sc, float ra, float rb) {
  p.x = abs(p.x);
  float k = (sc.y * p.x > sc.x * p.y) ? dot(p.xy, sc) : length(p.xy);
  return sqrt(dot(p, p) + ra * ra - 2.0 * ra * k) - rb;
}
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float pool(vec3 p) {
  vec3 q = p - vec3(0.0, -0.95, 0.0);
  float r = length(q.xz);
  float d = sdEllipsoid(q, vec3(1.7, 0.16, 1.7)) + sin(r * 9.0 - uTime * 2.2) * 0.012 * uRipple * smoothstep(1.7, 0.4, r);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float y = -0.8 + fract(uTime * 0.12 + fi * 0.33) * 0.9;
    vec3 c = vec3(sin(fi * 2.1) * 0.5, y, cos(fi * 2.1) * 0.5);
    d = smin(d, length(p - c) - 0.09 * (1.0 - fract(uTime * 0.12 + fi * 0.33)), 0.35);
  }
  return d;
}
float headphones(vec3 p) {
  vec3 q = p - vec3(0.0, 0.05, 0.0);
  float a = 1.12;
  float band = sdCappedTorus(q, vec2(sin(a), cos(a)), 1.0, 0.075);
  vec3 s = vec3(abs(p.x), p.y, p.z);
  float yoke = sdCapsule(s, vec3(0.9, 0.48, 0.0), vec3(0.99, -0.08, 0.0), 0.05);
  vec3 c = s - vec3(1.0, -0.36, 0.0);
  float cup = sdRoundCyl(c.yxz, 0.42, 0.1, 0.15);
  float cushion = sdTorus((c + vec3(0.17, 0.0, 0.0)).yxz, vec2(0.36, 0.09));
  float d = smin(band, yoke, 0.1);
  d = smin(d, cup, 0.12);
  d = smin(d, cushion, 0.06);
  return d;
}
float watch(vec3 p) {
  vec3 z = vec3(p.x, p.z, p.y); // z becomes the axial direction
  float body = sdRoundCyl(z, 0.38, 0.07, 0.12);
  float bezel = sdTorus(z - vec3(0.0, 0.11, 0.0), vec2(0.64, 0.05));
  vec3 sp = p;
  float ay = abs(sp.y);
  sp.z += pow(max(ay - 0.45, 0.0), 2.0) * 0.6;
  float strap = sdRoundBox(vec3(sp.x, ay - 1.0, sp.z + 0.02), vec3(0.3, 0.55, 0.035), 0.04);
  float crown = sdRoundCyl(vec3(p.y, p.x - 0.8, p.z), 0.06, 0.02, 0.07);
  float d = smin(body, bezel, 0.05);
  d = smin(d, strap, 0.14);
  d = smin(d, crown, 0.05);
  return d;
}
float sphere(vec3 p) {
  float w = sin(p.x * 6.0 + uTime) * sin(p.y * 5.0 + uTime * 1.3) * sin(p.z * 6.0 - uTime * 0.7);
  return length(p) - 1.0 + w * 0.02 * uRipple;
}

float map(vec3 p) {
  float d = 0.0;
  if (uW.x > 0.001) d += uW.x * pool(p);
  if (uW.y > 0.001) d += uW.y * headphones(p);
  if (uW.z > 0.001) d += uW.z * watch(p);
  if (uW.w > 0.001) d += uW.w * sphere(p);
  // liquid wobble while one form pours into the next (peaks at mid-morph)
  float tr = 4.0 * (uW.x * uW.y + uW.y * uW.z + uW.z * uW.w);
  d += tr * 0.07 * sin(p.x * 5.0 + uTime) * sin(p.y * 4.0 - uTime * 1.2) * sin(p.z * 5.0 + uTime * 0.7);
  return d;
}

vec3 normalAt(vec3 p) {
  const vec2 k = vec2(1.0, -1.0);
  float e = 0.0015;
  return normalize(k.xyy * map(p + k.xyy * e) + k.yyx * map(p + k.yyx * e) + k.yxy * map(p + k.yxy * e) + k.xxx * map(p + k.xxx * e));
}

// procedural studio: dark gradient, a large cool softbox upper left, a warm strip to the right,
// a soft rim band behind, and a darker floor
vec3 env(vec3 d) {
  vec3 col = mix(uBg * 0.5, uFog * 1.15, smoothstep(-0.35, 0.65, d.y));
  float cool = smoothstep(0.72, 0.94, dot(d, normalize(vec3(-0.6, 0.75, 0.35))));
  float warm = smoothstep(0.84, 0.97, dot(d, normalize(vec3(0.88, 0.22, 0.3))));
  float rim = exp(-abs(d.y - 0.12) * 28.0) * smoothstep(0.2, -0.6, d.z);
  col += uCool * cool * 5.0 * (1.0 - 0.55 * uWarmth);
  col += uWarm * warm * 4.2 * (0.35 + uWarmth);
  col += mix(uCool, uWarm, 0.5) * rim * 0.7;
  // a dim front softbox behind the camera, so faces turned toward the viewer are not black
  float front = smoothstep(0.55, 0.95, dot(d, normalize(vec3(0.2, 0.3, 1.0))));
  col += mix(uCool, uWarm, 0.45) * front * 0.9;
  col *= mix(1.0, 0.35, smoothstep(-0.05, -0.4, d.y));
  return col * uStudio;
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  vec3 rd = normalize(uCamRot * vec3(uv.x * uTanFov * uAspect, uv.y * uTanFov, -1.0));
  vec3 ro = uCamPos;
  float t = 0.0;
  float d = 1.0;
  bool hit = false;
  for (int i = 0; i < 128; i++) {
    if (i >= uSteps) break;
    vec3 p = ro + rd * t;
    d = map(p);
    if (d < 0.0012 * t) {
      hit = true;
      break;
    }
    t += d * 0.85;
    if (t > 20.0) break;
  }
  vec3 col;
  if (hit) {
    vec3 p = ro + rd * t;
    vec3 n = normalAt(p);
    vec3 r = reflect(rd, n);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
    float ao = 1.0;
    if (uAO > 0.5) {
      ao = 0.0;
      for (int k = 1; k <= 4; k++) {
        float h = 0.04 * float(k);
        ao += (h - map(p + n * h)) * pow(0.6, float(k));
      }
      ao = clamp(1.0 - ao * 3.5, 0.25, 1.0);
    }
    vec3 tint = mix(vec3(0.93, 0.94, 0.96), (uCool + uWarm) * 0.5, 0.18);
    col = env(r) * tint * mix(0.62, 1.0, fres) * ao + env(n) * 0.03;
  } else {
    col = env(rd) * 0.32;
    if (rd.y < 0.0) {
      float tf = (-1.12 - ro.y) / rd.y;
      vec3 fp = ro + rd * tf;
      float sh = clamp(map(fp + vec3(0.0, 0.3, 0.0)) * 1.4, 0.0, 1.0);
      vec3 floorCol = uBg * 0.8 * (0.35 + 0.65 * sh) + env(reflect(rd, vec3(0.0, 1.0, 0.0))) * 0.06 * sh;
      col = mix(floorCol, col, smoothstep(6.0, 22.0, tf));
    }
  }
  gl_FragColor = vec4(col, 1.0);
}
`

/** Fullscreen blit of the (possibly lower resolution) march target into the main frame. */
export const blitFragment = /* glsl */ `
uniform sampler2D uTex;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D(uTex, vUv);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
