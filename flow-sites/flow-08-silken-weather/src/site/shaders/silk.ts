// Silken Weather shaders. Ribbons are flat strips displaced entirely in the vertex shader: they
// follow the camera's own arc-length path (a float texture), orbit it, twist (more when you
// scroll fast), wave and flutter. Normals come from finite differences of the same function.
// Shading: soft studio key/fill/rim + Kajiya-Kay style anisotropic sheen along the ribbon.

export const ribbonVertex = /* glsl */ `
uniform sampler2D uPath;
uniform float uStart;
uniform float uSpan;
uniform float uTime;
uniform float uSpread;
uniform float uWidth;
uniform float uTwist;
uniform float uWave;
uniform float uFlutter;
uniform float uVel;
attribute vec2 aRib; // ribbon index (0..1), phase seed
varying vec3 vWorld;
varying vec3 vN;
varying vec3 vT;
varying float vS;
varying float vV;
varying vec2 vRib;

vec3 pathAt(float u) {
  float f = clamp(u, 0.0, 1.0) * 511.0;
  float i = floor(f);
  vec3 a = texelFetch(uPath, ivec2(int(i), 0), 0).xyz;
  vec3 b = texelFetch(uPath, ivec2(int(min(i + 1.0, 511.0)), 0), 0).xyz;
  return mix(a, b, f - i);
}

vec3 ribbon(float s, float v) {
  float u = uStart + s * uSpan;
  vec3 c = pathAt(u);
  vec3 T = normalize(pathAt(u + 0.003) - c + vec3(0.0, 0.0, -1e-4));
  vec3 S = normalize(cross(T, vec3(0.0, 1.0, 0.0)));
  vec3 N = cross(S, T);
  float ph = aRib.y;
  float a = ph * 6.2831 + s * 1.6 + uTime * 0.12;
  float r = uSpread * (0.55 + 0.6 * fract(ph * 3.7)) * smoothstep(0.0, 0.2, s);
  vec3 off = (S * cos(a) + N * sin(a) * 0.65) * r - N * 0.3;
  float tw = uTwist * s * 6.2831 + ph * 3.0 + uVel * 2.2 + uTime * 0.15;
  vec3 across = S * cos(tw) + N * sin(tw);
  vec3 lift = -S * sin(tw) + N * cos(tw);
  float w = uWidth * (0.35 + 0.25 * fract(ph * 5.1));
  float wave = sin(s * 18.0 - uTime * 1.2 + ph * 10.0) * uWave * 0.35;
  float flutter = sin(s * 40.0 + v * 8.0 - uTime * 2.0 + ph * 7.0) * uFlutter * 0.16 * abs(v);
  return c + off + across * v * w + lift * (wave + flutter);
}

void main() {
  float s = uv.x;
  float v = uv.y - 0.5;
  vec3 p = ribbon(s, v);
  vec3 ps = ribbon(s + 0.002, v);
  vec3 pv = ribbon(s, v + 0.02);
  vT = normalize(ps - p);
  vN = normalize(cross(ps - p, pv - p));
  vWorld = p;
  vS = s;
  vV = v;
  vRib = aRib;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
`

export const ribbonFragment = /* glsl */ `
uniform vec3 uSilk;
uniform vec3 uSilk2;
uniform vec3 uFog;
uniform float uSheen;
uniform float uVeil;
uniform float uFogDensity;
varying vec3 vWorld;
varying vec3 vN;
varying vec3 vT;
varying float vS;
varying float vV;
varying vec2 vRib;
float kk(vec3 T, vec3 L, vec3 V, float e) {
  vec3 H = normalize(L + V);
  float th = dot(T, H);
  return pow(sqrt(max(1.0 - th * th, 0.0)), e);
}
void main() {
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 N = normalize(vN);
  if (dot(N, V) < 0.0) N = -N;
  vec3 T = normalize(vT);
  vec3 K = normalize(vec3(0.5, 0.85, 0.45));
  vec3 F = normalize(vec3(-0.7, 0.3, 0.5));
  vec3 R = normalize(vec3(0.0, 0.35, -1.0));
  vec3 base = mix(uSilk, uSilk2, vRib.x);
  float dk = max((dot(N, K) + 0.35) / 1.35, 0.0);
  float df = max((dot(N, F) + 0.5) / 1.5, 0.0);
  vec3 col = base * (0.14 + 0.78 * dk * vec3(1.0, 0.97, 0.92) + 0.3 * df * vec3(0.9, 0.94, 1.0));
  // anisotropic sheen: a sharp white lobe and a broad tinted lobe shifted toward the normal
  float s1 = kk(T, K, V, 60.0) * smoothstep(-0.1, 0.3, dot(N, K));
  float s2 = kk(normalize(T + N * 0.35), K, V, 14.0) * 0.45;
  col += (vec3(1.0) * s1 * 1.4 + mix(vec3(1.0), base, 0.6) * s2) * uSheen;
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col += mix(base, vec3(1.0), 0.5) * fres * max(dot(-V, R) * 0.5 + 0.5, 0.0) * 0.35;
  float d = distance(vWorld, cameraPosition);
  col = mix(uFog, col, exp(-uFogDensity * d));
  float ends = smoothstep(0.0, 0.05, vS) * smoothstep(1.0, 0.82, vS);
  float alpha = mix(1.0, 0.3 + 0.45 * fres + 0.2 * s1, uVeil) * ends;
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const studioVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 wp = vec4(cameraPosition + position * 600.0, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
  gl_Position.z = gl_Position.w * 0.99999;
}
`
/** Seamless studio backdrop: soft key-light glow ahead, darker toward the floor and ceiling. */
export const studioFragment = /* glsl */ `
uniform vec3 uBack;
uniform vec3 uFog;
uniform vec3 uSilk;
uniform vec3 uAhead;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float y = d.y;
  vec3 col = mix(uFog, uBack, smoothstep(-0.2, 0.7, abs(y - 0.05)));
  float glow = pow(max(dot(d, normalize(uAhead + vec3(0.0, 0.25, 0.0))), 0.0), 6.0);
  col += mix(uSilk, vec3(1.0), 0.3) * glow * 0.18;
  col *= 0.86 + 0.14 * smoothstep(-0.6, 0.2, y);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
