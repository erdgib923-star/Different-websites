// Resonance Hall shaders. The terrain heights are baked on the CPU (the precomputed heightmap);
// while sound plays, a 256 x 64 spectrogram texture (newest row nearest the camera) adds smoothed
// displacement. Low frequencies sit in the central channel, highs toward the edges.

export const terrainVertex = /* glsl */ `
uniform sampler2D uSpec;
uniform float uAudio;
uniform float uCamZ;
uniform float uHalfW;
varying vec3 vWorld;
varying float vH;
varying float vAmp;
void main() {
  vec3 p = position;
  float bin = pow(clamp(abs(p.x) / uHalfW, 0.0, 1.0), 0.7);
  float d = uCamZ - p.z;
  float row = clamp(d / 170.0, 0.0, 1.0);
  float s = texture2D(uSpec, vec2(0.01 + bin * 0.7, row)).r;
  float amp = s * uAudio * (1.0 - row) * smoothstep(0.0, 8.0, d) * (1.5 + 3.5 * (1.0 - bin));
  p.y += amp;
  vAmp = amp;
  vH = p.y;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const terrainFragment = /* glsl */ `
uniform vec3 uSurface;
uniform vec3 uGlow;
uniform vec3 uAccent;
uniform vec3 uFog;
uniform float uLineGlow;
uniform float uContour;
uniform float uGrid;
uniform float uFogDensity;
varying vec3 vWorld;
varying float vH;
varying float vAmp;
float lines(float k) {
  float w = fwidth(k);
  float d = min(fract(k), 1.0 - fract(k));
  return 1.0 - smoothstep(0.0, w * 1.3, d);
}
void main() {
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  if (n.y < 0.0) n = -n;
  float diff = clamp(dot(n, normalize(vec3(0.3, 0.9, 0.25))), 0.0, 1.0);
  vec3 col = uSurface * (0.3 + 0.7 * diff);
  float contour = lines(vH * 0.6 * uContour);
  float grid = max(lines(vWorld.x / 6.0), lines(vWorld.z / 6.0));
  float lift = smoothstep(0.0, 14.0, vH);
  col += uGlow * contour * uLineGlow * (0.9 + 0.9 * lift);
  col += uGlow * grid * uGrid * 0.35;
  col += uAccent * clamp(vAmp * 0.06, 0.0, 0.3);
  float d = distance(vWorld, cameraPosition);
  col = mix(uFog, col, exp(-uFogDensity * d));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

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
uniform vec3 uBg;
uniform vec3 uFog;
uniform vec3 uGlow;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  vec3 col = mix(uFog, uBg * 0.7, smoothstep(-0.05, 0.5, d.y));
  col += uGlow * exp(-abs(d.y - 0.01) * 22.0) * 0.12;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const moteVertex = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uDpr;
uniform float uShimmer;
uniform float uFogDensity;
varying float vAlpha;
void main() {
  vec3 p = position;
  p.y = mod(p.y + uTime * (0.25 + aSeed * 0.4), 18.0) + 1.0;
  p.x += sin(uTime * 0.3 + aSeed * 30.0) * 0.8;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = max(-mv.z, 0.5);
  gl_PointSize = clamp(uDpr * 60.0 / depth, 1.5, 10.0);
  // slow twinkle, well below 1 Hz
  float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed) + aSeed * 50.0);
  vAlpha = uShimmer * tw * smoothstep(1.0, 3.0, p.y) * smoothstep(19.0, 15.0, p.y) * exp(-uFogDensity * depth);
}
`
export const moteFragment = /* glsl */ `
uniform vec3 uGlow;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = (smoothstep(0.5, 0.0, d) * 0.5 + smoothstep(0.12, 0.0, d)) * vAlpha;
  gl_FragColor = vec4(uGlow * 1.8 * a, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
