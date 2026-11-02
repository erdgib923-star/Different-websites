import * as THREE from 'three';
import { planets, palette, oklchLinear } from './system';

/**
 * Procedural Halcyra system. Everything is generated: no textures except a tiny canvas glow.
 * Shared lighting rule: the star is the only light; night sides fall to a space-blue ambient
 * (never pure black); atmospheres rim-light toward the star.
 */
const NOISE = /* glsl */ `
float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = p * 2.02 + 3.1; a *= 0.5; } return v; }
`;

const PLANET_VERT = /* glsl */ `
varying vec3 vObjN; varying vec3 vWN; varying vec3 vWPos;
void main() {
  vObjN = normalize(position);
  vWN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const PLANET_FRAG = /* glsl */ `
uniform vec3 uDark, uMid, uLight, uAtmo, uSpace;
uniform float uKind, uTime, uSeed;
varying vec3 vObjN; varying vec3 vWN; varying vec3 vWPos;
${NOISE}
vec3 ramp3(float t) { return t < 0.5 ? mix(uDark, uMid, t * 2.0) : mix(uMid, uLight, t * 2.0 - 1.0); }
void main() {
  vec3 p = vObjN * 2.0 + uSeed;
  vec3 albedo; vec3 emissive = vec3(0.0);
  if (uKind < 0.5) {            // lava
    float n = fbm(p * 1.6);
    float seams = 1.0 - smoothstep(0.0, 0.03, abs(fbm(p * 3.2 + n) - 0.5));
    albedo = mix(uDark * 0.6, uMid * 0.55, n);
    emissive = mix(uMid, uLight, 0.4) * seams * 1.3;
  } else if (uKind < 1.5) {     // desert
    float n = fbm(p * 1.4 + fbm(p * 2.0));
    float dunes = sin(vObjN.y * 40.0 + n * 9.0) * 0.06;
    albedo = ramp3(clamp(n * 1.25 - 0.1 + dunes, 0.0, 1.0));
  } else if (uKind < 2.5) {     // ocean
    float n = fbm(p * 1.3);
    float land = smoothstep(0.56, 0.6, n);
    vec3 sea = mix(uDark, uMid, smoothstep(0.3, 0.56, n));
    albedo = mix(sea, uLight * 0.9, land);
    float clouds = smoothstep(0.55, 0.75, fbm(p * 2.4 + vec3(uTime * 0.01, 0.0, 0.0)));
    albedo = mix(albedo, vec3(0.92), clouds * 0.75);
  } else if (uKind < 3.5) {     // gas giant
    float warp = fbm(p * 1.5 + vec3(0.0, 0.0, uTime * 0.004));
    float b = 0.5 + 0.5 * sin(vObjN.y * 16.0 + warp * 4.0);
    albedo = ramp3(b);
    float storm = smoothstep(0.16, 0.0, length(vec2(vObjN.x - 0.55, vObjN.y + 0.25) * vec2(1.0, 2.2)));
    albedo = mix(albedo, uLight, storm * 0.8);
  } else {                      // ice
    float n = fbm(p * 2.2);
    float cracks = 1.0 - smoothstep(0.0, 0.04, abs(fbm(p * 4.0) - 0.5));
    albedo = mix(uLight, uMid, n * 0.6);
    albedo = mix(albedo, uDark, cracks * 0.6);
  }
  vec3 L = normalize(-vWPos);                    // star sits at the origin
  vec3 V = normalize(cameraPosition - vWPos);
  float ndl = dot(normalize(vWN), L);
  float diff = smoothstep(-0.12, 1.0, ndl);
  vec3 col = albedo * (uSpace * 0.35 + diff * 1.15) + emissive * (1.0 - diff * 0.6);
  float rim = pow(1.0 - max(dot(normalize(vWN), V), 0.0), 3.0);
  col += uAtmo * rim * (0.15 + 0.85 * smoothstep(-0.2, 0.6, ndl)) * 0.9;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const STAR_FRAG = /* glsl */ `
uniform float uTime; uniform vec3 uHot, uCool;
varying vec3 vObjN; varying vec3 vWN; varying vec3 vWPos;
${NOISE}
void main() {
  float g = fbm(vObjN * 6.0 + vec3(0.0, uTime * 0.03, uTime * 0.02));
  vec3 V = normalize(cameraPosition - vWPos);
  float limb = pow(max(dot(normalize(vWN), V), 0.0), 0.45);
  vec3 col = mix(uCool, uHot, g) * (0.55 + 0.75 * limb);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const STARS_VERT = /* glsl */ `
attribute float aSize; attribute float aPhase; attribute vec3 aColor;
uniform float uTime; uniform float uPixel;
varying vec3 vColor; varying float vTw;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPixel * (300.0 / -mv.z);
  vColor = aColor;
  vTw = 0.75 + 0.25 * sin(uTime * 0.6 + aPhase);   // slow (~0.1 Hz) shimmer, never a flash
  gl_Position = projectionMatrix * mv;
}`;
const STARS_FRAG = /* glsl */ `
varying vec3 vColor; varying float vTw;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor * vTw, a);
  #include <colorspace_fragment>
}`;

const RING_FRAG = /* glsl */ `
uniform vec3 uCol; uniform float uInner, uOuter;
varying vec3 vPos; varying vec3 vWPos;
${NOISE}
void main() {
  float r = (length(vPos.xy) - uInner) / (uOuter - uInner);
  float bands = 0.55 + 0.45 * sin(r * 70.0 + vnoise(vec3(r * 30.0)) * 4.0);
  float edge = smoothstep(0.0, 0.08, r) * smoothstep(1.0, 0.85, r);
  float gap = 1.0 - smoothstep(0.02, 0.0, abs(r - 0.62)) * 0.85;
  float a = bands * edge * gap * 0.75;
  gl_FragColor = vec4(uCol * (0.5 + 0.5 * bands), a);
  #include <colorspace_fragment>
}`;

export type Scene = {
  setProgress: (t: number) => void;
  renderOnce: () => void;
  start: () => void;
  stop: () => void;
  pick: (x: number, y: number) => number;
  setSize: () => void;
  avgFrameMs: () => number;
  dispose: () => void;
};

export async function createScene(canvas: HTMLCanvasElement, onProgress: (p: number, label: string) => void): Promise<Scene> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const space = oklchLinear(0.12, 0.03, 262);
  renderer.setClearColor(new THREE.Color().setRGB(space[0], space[1], space[2], THREE.LinearSRGBColorSpace), 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 2000);
  const timer = new THREE.Timer();
  const v3 = (a: number[]) => new THREE.Vector3(a[0], a[1], a[2]);
  onProgress(0.4, 'Seeding the star field');

  // ---- star field ----
  const N = 4200;
  const pos = new Float32Array(N * 3), size = new Float32Array(N), phase = new Float32Array(N), col = new Float32Array(N * 3);
  const tints = [oklchLinear(0.97, 0.01, 262), oklchLinear(0.9, 0.06, 80), oklchLinear(0.86, 0.05, 234)];
  for (let i = 0; i < N; i++) {
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 380 + Math.random() * 420;
    const s = Math.sqrt(1 - u * u);
    pos.set([r * s * Math.cos(th), r * u * 0.7, r * s * Math.sin(th)], i * 3);
    size[i] = Math.random() < 0.03 ? 3.2 : 0.8 + Math.random() * 1.4;
    phase[i] = Math.random() * 6.28;
    col.set(tints[i % 3], i * 3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  sg.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  sg.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  const starsMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixel: { value: renderer.getPixelRatio() } },
    vertexShader: STARS_VERT,
    fragmentShader: STARS_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(sg, starsMat));

  // ---- the star ----
  onProgress(0.55, 'Lighting Halcyra');
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uHot: { value: v3(oklchLinear(0.95, 0.09, 85)) }, uCool: { value: v3(oklchLinear(0.72, 0.16, 55)) } },
    vertexShader: PLANET_VERT,
    fragmentShader: STAR_FRAG,
  });
  const star = new THREE.Mesh(new THREE.SphereGeometry(3, 64, 64), starMat);
  scene.add(star);
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const g2 = glowCanvas.getContext('2d')!;
  const grad = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,214,140,0.9)');
  grad.addColorStop(0.25, 'rgba(255,170,80,0.35)');
  grad.addColorStop(1, 'rgba(255,140,60,0)');
  g2.fillStyle = grad;
  g2.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.scale.setScalar(26);
  scene.add(glow);

  // ---- planets ----
  onProgress(0.7, 'Building five worlds');
  const kinds = { lava: 0, desert: 1, ocean: 2, gas: 3, ice: 4 } as const;
  const meshes: THREE.Mesh[] = [];
  const mats: THREE.ShaderMaterial[] = [];
  planets.forEach((p, i) => {
    const pal = palette(p.hue);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uDark: { value: v3(pal.dark) }, uMid: { value: v3(pal.mid) }, uLight: { value: v3(pal.light) }, uAtmo: { value: v3(pal.atmo) },
        uSpace: { value: v3(oklchLinear(0.3, 0.06, 262)) }, uKind: { value: kinds[p.kind] }, uTime: { value: 0 }, uSeed: { value: i * 7.31 },
      },
      vertexShader: PLANET_VERT,
      fragmentShader: PLANET_FRAG,
    });
    mats.push(mat);
    const m = new THREE.Mesh(new THREE.SphereGeometry(p.radius, 96, 96), mat);
    m.position.set(Math.cos(p.angle) * p.orbit, 0, Math.sin(p.angle) * p.orbit);
    m.rotation.z = 0.25 + i * 0.07;
    m.userData.index = i;
    scene.add(m);
    meshes.push(m);
    // orbit line
    const pts = Array.from({ length: 180 }, (_, k) => new THREE.Vector3(Math.cos((k / 180) * Math.PI * 2) * p.orbit, 0, Math.sin((k / 180) * Math.PI * 2) * p.orbit));
    const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: new THREE.Color().setRGB(...oklchLinear(0.5, 0.08, 262), THREE.LinearSRGBColorSpace), transparent: true, opacity: 0.35 }));
    scene.add(orbit);
    if (p.kind === 'gas') {
      const inner = p.radius * 1.35, outer = p.radius * 2.25;
      const ringMat = new THREE.ShaderMaterial({
        uniforms: { uCol: { value: v3(palette(p.hue).light) }, uInner: { value: inner }, uOuter: { value: outer } },
        vertexShader: `varying vec3 vPos; varying vec3 vWPos; void main(){ vPos = position; vec4 w = modelMatrix * vec4(position,1.0); vWPos = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: RING_FRAG,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 160, 1), ringMat);
      ring.position.copy(m.position);
      ring.rotation.x = -Math.PI / 2 + 0.38;
      ring.rotation.y = 0.12;
      scene.add(ring);
    }
  });

  // ---- flight path: overview → past each world → looking back at the star ----
  const way = [new THREE.Vector3(0, 34, 78)];
  const look = [new THREE.Vector3(0, 0, 0)];
  meshes.forEach((m, i) => {
    const p = planets[i];
    const out = m.position.clone().normalize();
    const side = new THREE.Vector3(-out.z, 0, out.x);
    // approach from the sunward side so the lit hemisphere (a gibbous phase) faces the camera
    way.push(m.position.clone().add(out.multiplyScalar(-p.radius * 2.0)).add(side.multiplyScalar(p.radius * 3.0)).add(new THREE.Vector3(0, p.radius * 1.2, 0)));
    look.push(m.position.clone());
  });
  const last = meshes[meshes.length - 1].position.clone();
  way.push(last.clone().multiplyScalar(1.35).add(new THREE.Vector3(0, 10, 0)));
  look.push(new THREE.Vector3(0, 0, 0));
  const path = new THREE.CatmullRomCurve3(way, false, 'centripetal');
  const lookPath = new THREE.CatmullRomCurve3(look, false, 'centripetal');
  let t = 0, tSmooth = 0;
  const target = new THREE.Vector3();
  const place = (tt: number) => {
    camera.position.copy(path.getPoint(tt));
    camera.lookAt(lookPath.getPoint(tt, target));
  };
  place(0);

  const setSize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 700 ? 62 : 48;
    // phones: shift the frame so the target planet sits in the upper part, above the text cards
    if (w < 700) camera.setViewOffset(w, h, 0, h * 0.2, w, h);
    else camera.setViewOffset(w, h, -w * 0.12, 0, w, h); // desktop: planet sits right of the left-hand cards
    camera.updateProjectionMatrix();
  };
  setSize();

  onProgress(0.85, 'Compiling shaders');
  renderer.compile(scene, camera);

  const frame = () => {
    timer.update();
    const el = timer.getElapsed();
    const dt = Math.min(0.5, timer.getDelta());
    tSmooth += (t - tSmooth) * (1 - Math.exp(-dt * 5)); // frame-rate independent easing
    place(tSmooth);
    starMat.uniforms.uTime.value = el;
    starsMat.uniforms.uTime.value = el;
    mats.forEach((m) => (m.uniforms.uTime.value = el));
    meshes.forEach((m, i) => (m.rotation.y = el * (0.05 - i * 0.006)));
    renderer.render(scene, camera);
  };

  let raf = 0, running = false;
  const times: number[] = [];
  let lastT = 0;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (lastT) {
      times.push(now - lastT);
      if (times.length > 90) times.shift();
    }
    lastT = now;
    frame();
  };

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  onProgress(1, 'Ready');

  return {
    setProgress: (v) => (t = Math.min(1, Math.max(0, v))),
    renderOnce: () => {
      tSmooth = t;
      frame();
    },
    start: () => {
      if (running) return;
      running = true;
      lastT = 0;
      raf = requestAnimationFrame(loop);
    },
    stop: () => {
      running = false;
      cancelAnimationFrame(raf);
    },
    pick: (x, y) => {
      ndc.set((x / canvas.clientWidth) * 2 - 1, -(y / canvas.clientHeight) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(meshes, false)[0];
      return hit ? (hit.object.userData.index as number) : -1;
    },
    setSize,
    avgFrameMs: () => (times.length < 60 ? 0 : times.reduce((a, b) => a + b, 0) / times.length),
    dispose: () => {
      running = false;
      cancelAnimationFrame(raf);
      renderer.dispose();
    },
  };
}
