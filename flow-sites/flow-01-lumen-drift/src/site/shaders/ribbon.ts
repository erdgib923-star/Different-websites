// A light ribbon laid along the camera path, just ahead of and below the viewer. Only the segment
// behind its glowing head (uHead = camera arc position + lead) is visible, with a fading tail.

export const ribbonVertex = /* glsl */ `
uniform float uHead;
uniform float uTime;
attribute vec3 aSide;
attribute float aU;
attribute float aSign;
varying float vK;
varying float vEdge;
varying float vU;
varying float vFog;
uniform float uFogDensity;
void main() {
  float tail = 0.07;
  float k = smoothstep(uHead - tail, uHead, aU) * (1.0 - smoothstep(uHead, uHead + 0.005, aU));
  float width = 0.015 + 0.075 * k;
  vec3 p = position + aSide * (aSign * width + sin(aU * 260.0 + uTime * 1.2) * 0.12 * k);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vK = k;
  vEdge = aSign;
  vU = aU;
  vFog = exp(-uFogDensity * max(-mv.z, 0.0));
}
`

export const ribbonFragment = /* glsl */ `
uniform float uTime;
uniform float uRibbon;
uniform vec3 uPrimary;
uniform vec3 uAccent;
varying float vK;
varying float vEdge;
varying float vU;
varying float vFog;
void main() {
  float edge = 1.0 - smoothstep(0.15, 1.0, abs(vEdge));
  // travelling bands: < 1 Hz brightness change at any pixel
  float bands = 0.75 + 0.25 * sin(vU * 900.0 - uTime * 5.0);
  vec3 col = mix(uPrimary, uAccent, vK) * (0.8 + 2.2 * vK * vK) * bands;
  gl_FragColor = vec4(col, edge * vK * uRibbon * vFog);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
