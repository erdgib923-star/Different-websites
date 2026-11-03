/**
 * The Type One's forged wheel, built from primitives in Three.js:
 * - rim barrel and tyre: LatheGeometry profiles turned around the axle;
 * - ten spokes (five twin pairs): extruded 2D shapes;
 * - centre-lock nut, brake disc and a fixed signal-red caliper.
 * Lit by a generated RoomEnvironment (no image files). Renders on demand only: `set()` marks
 * the frame dirty and one render happens on the next animation frame.
 */
import {
  ACESFilmicToneMapping, CylinderGeometry, DirectionalLight, ExtrudeGeometry, Group, LatheGeometry, Mesh,
  MeshStandardMaterial, PerspectiveCamera, PMREMGenerator, Scene, Shape, SRGBColorSpace, Vector2, WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface WheelState { roll: number; yaw: number }
export interface Wheel { set: (s: Partial<WheelState>) => void; resize: () => void }

const lathe = (pts: [number, number][], segs = 120) => new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), segs);

function spokeShape(): Shape {
  // Radial along +x from the hub (0.15) to the rim (0.72), tapering, with a slight sweep.
  const s = new Shape();
  s.moveTo(0.15, -0.045);
  s.bezierCurveTo(0.35, -0.04, 0.55, -0.032, 0.72, -0.03);
  s.lineTo(0.72, 0.026);
  s.bezierCurveTo(0.55, 0.03, 0.35, 0.036, 0.15, 0.045);
  s.closePath();
  return s;
}

function caliperShape(): Shape {
  const s = new Shape();
  const r0 = 0.5, r1 = 0.69, a0 = 0.35, a1 = 1.15;
  s.absarc(0, 0, r1, a0, a1, false);
  s.absarc(0, 0, r0, a1, a0, true);
  s.closePath();
  return s;
}

export function createWheel(canvas: HTMLCanvasElement, red: string): Wheel | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const key = new DirectionalLight(0xffffff, 1.4);
  key.position.set(-3, 4, 5);
  scene.add(key);

  const alloy = new MeshStandardMaterial({ color: 0xc9ced6, metalness: 1, roughness: 0.3 });
  const alloyDark = new MeshStandardMaterial({ color: 0x5b6069, metalness: 1, roughness: 0.42 });
  const rubber = new MeshStandardMaterial({ color: 0x141518, metalness: 0, roughness: 0.88 });
  const disc = new MeshStandardMaterial({ color: 0x3a3d43, metalness: 0.8, roughness: 0.55 });
  const signal = new MeshStandardMaterial({ color: red, metalness: 0.2, roughness: 0.38 });

  // The axle is the lathe's Y axis; tilt the whole assembly so the wheel faces +Z.
  const assembly = new Group();
  assembly.rotation.x = Math.PI / 2;
  scene.add(assembly);
  const rolling = new Group();
  assembly.add(rolling);

  rolling.add(new Mesh(lathe([[0.7, -0.21], [0.75, -0.21], [0.785, -0.18], [0.785, -0.14], [0.725, -0.12], [0.705, 0.1], [0.725, 0.135], [0.795, 0.16], [0.805, 0.19], [0.77, 0.215], [0.705, 0.205]]), alloy));
  rolling.add(new Mesh(lathe([[0.79, -0.22], [0.87, -0.245], [0.95, -0.235], [0.99, -0.185], [1.0, -0.1], [1.0, 0.1], [0.99, 0.185], [0.95, 0.235], [0.87, 0.245], [0.79, 0.22]]), rubber));

  const spokeGeo = new ExtrudeGeometry(spokeShape(), { depth: 0.07, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 3, curveSegments: 16 });
  spokeGeo.rotateX(-Math.PI / 2); // shape plane -> wheel face; extrusion -> axial thickness
  for (let i = 0; i < 5; i++) {
    for (const off of [-0.11, 0.11]) {
      const m = new Mesh(spokeGeo, alloy);
      m.rotation.y = (i / 5) * Math.PI * 2 + off;
      m.position.y = 0.07;
      rolling.add(m);
    }
  }
  const hub = new Mesh(new CylinderGeometry(0.17, 0.2, 0.14, 48), alloyDark);
  hub.position.y = 0.1;
  const nut = new Mesh(new CylinderGeometry(0.085, 0.085, 0.07, 6), signal);
  nut.position.y = 0.2;
  const rotor = new Mesh(new CylinderGeometry(0.64, 0.64, 0.035, 72), disc);
  rotor.position.y = -0.08;
  rolling.add(hub, nut, rotor);

  // The caliper does not turn with the wheel.
  const calGeo = new ExtrudeGeometry(caliperShape(), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 });
  calGeo.rotateX(-Math.PI / 2);
  const caliper = new Mesh(calGeo, signal);
  caliper.position.y = -0.03;
  assembly.add(caliper);

  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  const state: WheelState = { roll: 0, yaw: 0 };
  let raf = 0;
  const render = () => {
    raf = 0;
    const d = 4.3;
    camera.position.set(Math.sin(state.yaw) * d, 0.35, Math.cos(state.yaw) * d);
    camera.lookAt(0, 0, 0);
    rolling.rotation.y = -state.roll;
    renderer.render(scene, camera);
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(render); };
  const resize = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    queue();
  };
  resize();
  return { set: (s) => { Object.assign(state, s); queue(); }, resize };
}
