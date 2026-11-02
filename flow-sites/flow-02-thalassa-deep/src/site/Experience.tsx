// Thalassa Deep 3D world: water dome, surface, reef wall + abyssal floor (caustics, bio speckles),
// god rays (1 instanced draw), marine snow (1 draw), jellyfish (1 instanced draw), lures (1 draw).

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three'
import type { Vec3 } from '../engine/curve'
import { rng } from '../engine/math'
import { getEngine } from '../engine/runtime'
import { type Tier, useFlow } from '../engine/store'
import { CameraRig } from '../engine/three/CameraRig'
import { Effects } from '../engine/three/Effects'
import { Stage } from '../engine/three/Stage'
import { COUNTS, type DeepFx, WORLD } from './chapters'
import * as S from './shaders/ocean'

const setLin = (c: Color, v: Vec3) => c.setRGB(v[0], v[1], v[2])
const state = () => getEngine<DeepFx>()?.state

/** CPU fbm used to sculpt the wall and the floor once. */
function makeFbm(seed: number) {
  const r = rng(seed)
  const g = Array.from({ length: 256 }, () => r())
  const h = (x: number, y: number) => g[(((x * 73856093) ^ (y * 19349663)) >>> 0) & 255]
  const n = (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const fx = x - xi
    const fy = y - yi
    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)
    const a = h(xi, yi)
    const b = h(xi + 1, yi)
    const c = h(xi, yi + 1)
    const d = h(xi + 1, yi + 1)
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
  }
  return (x: number, y: number) => {
    let s = 0
    let a = 0.5
    let f = 1
    for (let o = 0; o < 5; o++) {
      s += a * n(x * f, y * f)
      f *= 2.02
      a *= 0.5
    }
    return s
  }
}

function useDispose(...items: { dispose: () => void }[]) {
  useEffect(() => () => items.forEach((i) => i.dispose()), items) // eslint-disable-line react-hooks/exhaustive-deps
}

function Dome() {
  const { geometry, material } = useMemo(() => {
    const geometry = new SphereGeometry(1, 48, 24)
    const material = new ShaderMaterial({
      vertexShader: S.domeVertex,
      fragmentShader: S.domeFragment,
      side: BackSide,
      depthWrite: false,
      depthTest: false,
      uniforms: { uWater: { value: new Color() }, uFog: { value: new Color() }, uLight: { value: new Color() }, uSurface: { value: 1 }, uTime: { value: 0 } },
    })
    return { geometry, material }
  }, [])
  useDispose(geometry, material)
  useFrame((st) => {
    const s = state()
    if (!s) return
    const u = material.uniforms
    setLin(u.uWater.value, s.colors.bg.lin)
    setLin(u.uFog.value, s.colors.fog.lin)
    setLin(u.uLight.value, s.colors.primary.lin)
    u.uSurface.value = s.fx.surface
    u.uTime.value = st.clock.elapsedTime
  }, -1)
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={-10} />
}

function Surface() {
  const { geometry, material } = useMemo(() => {
    const geometry = new PlaneGeometry(900, 900, 1, 1)
    geometry.rotateX(Math.PI / 2) // faces down
    const material = new ShaderMaterial({
      vertexShader: S.surfaceVertex,
      fragmentShader: S.surfaceFragment,
      side: DoubleSide,
      uniforms: { uLight: { value: new Color() }, uFog: { value: new Color() }, uSurface: { value: 1 }, uTime: { value: 0 }, uFogDensity: { value: 0.01 } },
    })
    return { geometry, material }
  }, [])
  useDispose(geometry, material)
  useFrame((st) => {
    const s = state()
    if (!s) return
    const u = material.uniforms
    setLin(u.uLight.value, s.colors.primary.lin)
    setLin(u.uFog.value, s.colors.fog.lin)
    u.uSurface.value = s.fx.surface
    u.uTime.value = st.clock.elapsedTime
    u.uFogDensity.value = s.fx.fogDensity
  }, -1)
  return <mesh geometry={geometry} material={material} position={[0, WORLD.surfaceY, -150]} frustumCulled={false} />
}

function Reef() {
  const { wall, floor, material } = useMemo(() => {
    const fbm = makeFbm(11)
    // wall: a vertical sheet facing +x, sculpted with ridges and overhangs
    const wall = new PlaneGeometry(460, 450, 150, 150)
    wall.rotateY(Math.PI / 2)
    const wp = wall.attributes.position as BufferAttribute
    for (let i = 0; i < wp.count; i++) {
      const z = wp.getZ(i) - 150
      const y = wp.getY(i) - 205
      const ridge = Math.abs(fbm(z * 0.012, y * 0.012) - 0.5) * 2
      const x = WORLD.wallX + fbm(z * 0.03 + 7, y * 0.03) * 18 + ridge * 8
      wp.setXYZ(i, x, y, z)
    }
    wall.computeVertexNormals()
    // floor: dunes and boulders on the abyssal plain
    const floor = new PlaneGeometry(520, 420, 170, 140)
    floor.rotateX(-Math.PI / 2)
    const fp = floor.attributes.position as BufferAttribute
    for (let i = 0; i < fp.count; i++) {
      const x = fp.getX(i)
      const z = fp.getZ(i) - 160
      const dunes = Math.sin(x * 0.05 + fbm(x * 0.01, z * 0.01) * 6) * 1.6
      fp.setXYZ(i, x, WORLD.floorY + dunes + fbm(x * 0.04, z * 0.04) * 9, z)
    }
    floor.computeVertexNormals()
    const material = new ShaderMaterial({
      vertexShader: S.reefVertex,
      fragmentShader: S.reefFragment,
      side: DoubleSide,
      uniforms: {
        uRock: { value: new Color() },
        uFog: { value: new Color() },
        uLight: { value: new Color() },
        uAccent: { value: new Color() },
        uCaustics: { value: 1 },
        uAmbient: { value: 1 },
        uBio: { value: 0 },
        uTime: { value: 0 },
        uFogDensity: { value: 0.01 },
        uWater: { value: new Color() },
        uSurface: { value: 1 },
      },
    })
    return { wall, floor, material }
  }, [])
  useDispose(wall, floor, material)
  useFrame((st) => {
    const s = state()
    if (!s) return
    const u = material.uniforms
    setLin(u.uRock.value, s.colors.secondary.lin)
    setLin(u.uFog.value, s.colors.fog.lin)
    setLin(u.uLight.value, s.colors.primary.lin)
    setLin(u.uAccent.value, s.colors.accent.lin)
    u.uCaustics.value = s.fx.caustics
    u.uAmbient.value = s.fx.ambient
    u.uBio.value = s.fx.bio
    u.uTime.value = st.clock.elapsedTime
    u.uFogDensity.value = s.fx.fogDensity
    setLin(u.uWater.value, s.colors.bg.lin)
    u.uSurface.value = s.fx.surface
  }, -1)
  return (
    <>
      <mesh geometry={wall} material={material} />
      <mesh geometry={floor} material={material} />
    </>
  )
}

function Rays() {
  const { geometry, material } = useMemo(() => {
    const base = new PlaneGeometry(1, 1, 1, 8)
    base.translate(0.5, -0.5, 0) // uv.x 0..1 across, uv.y 0 (top) .. 1 (bottom)
    const geometry = new InstancedBufferGeometry()
    geometry.index = base.index
    geometry.setAttribute('position', base.attributes.position)
    // flip v so 0 is the top (surface)
    const uv = base.attributes.uv as BufferAttribute
    const uvs = new Float32Array(uv.count * 2)
    for (let i = 0; i < uv.count; i++) {
      uvs[i * 2] = uv.getX(i)
      uvs[i * 2 + 1] = 1 - uv.getY(i)
    }
    geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
    const r = rng(5)
    const n = 11
    const rays = new Float32Array(n * 4)
    for (let i = 0; i < n; i++) {
      rays.set([(r() - 0.5) * 70 + 4, 10 - r() * 70, 5 + r() * 12, r() * 10], i * 4)
    }
    geometry.setAttribute('aRay', new InstancedBufferAttribute(rays, 4))
    geometry.instanceCount = n
    base.dispose()
    const material = new ShaderMaterial({
      vertexShader: S.raysVertex,
      fragmentShader: S.raysFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      uniforms: { uLight: { value: new Color() }, uRays: { value: 1 }, uTime: { value: 0 }, uLength: { value: 150 } },
    })
    return { geometry, material }
  }, [])
  useDispose(geometry, material)
  useFrame((st) => {
    const s = state()
    if (!s) return
    setLin(material.uniforms.uLight.value, s.colors.primary.lin)
    material.uniforms.uRays.value = s.fx.rays
    material.uniforms.uTime.value = st.clock.elapsedTime
  }, -1)
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={3} />
}

function Snow({ cap }: { cap: Tier }) {
  const tier = useFlow((s) => s.tier)
  const { geometry, material } = useMemo(() => {
    const n = COUNTS.snow[cap]
    const r = rng(23)
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos.set([r(), r(), r()], i * 3)
      seed[i] = r()
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(pos, 3))
    geometry.setAttribute('aSeed', new BufferAttribute(seed, 1))
    const material = new ShaderMaterial({
      vertexShader: S.snowVertex,
      fragmentShader: S.snowFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBox: { value: 60 },
        uDpr: { value: 1 },
        uSnow: { value: 1 },
        uFogDensity: { value: 0.01 },
        uSpeed: { value: 0 },
        uFog: { value: new Color() },
        uLight: { value: new Color() },
      },
    })
    return { geometry, material }
  }, [cap])
  useDispose(geometry, material)
  useEffect(() => geometry.setDrawRange(0, Math.min(COUNTS.snow[cap], COUNTS.snow[tier])), [geometry, cap, tier])
  useFrame((st) => {
    const s = state()
    if (!s) return
    const u = material.uniforms
    u.uTime.value = st.clock.elapsedTime
    u.uDpr.value = st.viewport.dpr
    u.uSnow.value = s.fx.snow
    u.uFogDensity.value = s.fx.fogDensity
    u.uSpeed.value = useFlow.getState().motion.speed
    setLin(u.uFog.value, s.colors.fog.lin)
    setLin(u.uLight.value, s.colors.primary.lin)
  }, -1)
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={4} />
}

function jellyGeometry() {
  // bell: lathe of a dome profile
  const prof: Vector2[] = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    const a = t * Math.PI * 0.5
    prof.push(new Vector2(Math.sin(a) * 1.0 * (1 - 0.15 * t * t), Math.cos(a) * 0.85))
  }
  const bell = new LatheGeometry(prof, 28)
  const parts: number[] = []
  const vs: number[] = []
  for (let i = 0; i < bell.attributes.position.count; i++) {
    parts.push(0)
    vs.push(0)
  }
  const positions = Array.from(bell.attributes.position.array as Float32Array)
  const normals = Array.from(bell.attributes.normal.array as Float32Array)
  const index = Array.from(bell.index!.array)
  // tentacles: 8 thin vertical strips hanging from the rim
  const T = 8
  const SEG = 14
  for (let k = 0; k < T; k++) {
    const a = (k / T) * Math.PI * 2
    const rx = Math.cos(a) * 0.75
    const rz = Math.sin(a) * 0.75
    const base = positions.length / 3
    for (let j = 0; j <= SEG; j++) {
      const v = j / SEG
      const y = -v * 4.2
      for (const side of [-1, 1]) {
        positions.push(rx + side * 0.05 * (1 - v), y, rz)
        normals.push(Math.cos(a), 0, Math.sin(a))
        parts.push(1)
        vs.push(v)
      }
    }
    for (let j = 0; j < SEG; j++) {
      const o = base + j * 2
      index.push(o, o + 1, o + 2, o + 1, o + 3, o + 2)
    }
  }
  bell.dispose()
  const g = new InstancedBufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  g.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  g.setAttribute('aPart', new Float32BufferAttribute(parts, 1))
  g.setAttribute('aV', new Float32BufferAttribute(vs, 1))
  g.setIndex(index)
  return g
}

function Jellies({ cap }: { cap: Tier }) {
  const tier = useFlow((s) => s.tier)
  const mesh = useMemo(() => {
    const n = COUNTS.jellies[cap]
    const geometry = jellyGeometry()
    const r = rng(41)
    const data = new Float32Array(n * 4)
    const mesh = new InstancedMesh(
      geometry,
      new ShaderMaterial({
        vertexShader: S.jellyVertex,
        fragmentShader: S.jellyFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        uniforms: { uTime: { value: 0 }, uLight: { value: new Color() }, uAccent: { value: new Color() }, uFog: { value: new Color() }, uBio: { value: 0 }, uFogDensity: { value: 0.01 } },
      }),
      n,
    )
    const m = new Matrix4()
    const q = new Quaternion()
    const axis = new Vector3()
    for (let i = 0; i < n; i++) {
      const y = -70 - r() * 330
      const z = 0.34 * y + 8 - (8 + r() * 36)
      const x = (r() - 0.5) * 46
      const deep = Math.min(1, Math.max(0, (-y - 70) / 330))
      const scale = 0.8 + r() * 1.8
      axis.set(r() - 0.5, 0, r() - 0.5).normalize()
      q.setFromAxisAngle(axis, (r() - 0.5) * 0.6)
      m.compose(new Vector3(x, y, z), q, new Vector3(scale, scale, scale))
      mesh.setMatrixAt(i, m)
      // phase, magenta mix (more likely deep), brightness, scale
      data.set([r() * 6.28, r() < 0.25 + deep * 0.45 ? 1 : 0, 0.35 + deep * 0.9, scale], i * 4)
    }
    geometry.setAttribute('aJelly', new InstancedBufferAttribute(data, 4))
    mesh.frustumCulled = false
    mesh.renderOrder = 5
    return mesh
  }, [cap])
  useEffect(
    () => () => {
      mesh.geometry.dispose()
      ;(mesh.material as ShaderMaterial).dispose()
      mesh.dispose()
    },
    [mesh],
  )
  useEffect(() => {
    mesh.count = Math.min(COUNTS.jellies[cap], COUNTS.jellies[tier])
  }, [mesh, cap, tier])
  useFrame((st) => {
    const s = state()
    if (!s) return
    const u = (mesh.material as ShaderMaterial).uniforms
    u.uTime.value = st.clock.elapsedTime
    setLin(u.uLight.value, s.colors.primary.lin)
    setLin(u.uAccent.value, s.colors.accent.lin)
    setLin(u.uFog.value, s.colors.fog.lin)
    u.uBio.value = s.fx.bio
    u.uFogDensity.value = s.fx.fogDensity
  }, -1)
  return <primitive object={mesh} />
}

function Lures({ cap }: { cap: Tier }) {
  const tier = useFlow((s) => s.tier)
  const { geometry, material } = useMemo(() => {
    const n = COUNTS.lures[cap]
    const r = rng(77)
    const pos = new Float32Array(n * 3)
    const lure = new Float32Array(n * 2)
    for (let i = 0; i < n; i++) {
      const onFloor = r() < 0.55
      const y = onFloor ? WORLD.floorY + 13 + r() * 22 : -190 - r() * 200
      const z = onFloor ? -60 - r() * 220 : 0.34 * y + 8 - (r() * 60 - 10)
      const x = (r() - 0.5) * (onFloor ? 160 : 80)
      pos.set([x, y, z], i * 3)
      lure.set([r() * 6.28, r() < 0.4 ? 1 : 0], i * 2)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(pos, 3))
    geometry.setAttribute('aLure', new BufferAttribute(lure, 2))
    const material = new ShaderMaterial({
      vertexShader: S.lureVertex,
      fragmentShader: S.lureFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uDpr: { value: 1 }, uBio: { value: 0 }, uFogDensity: { value: 0.01 }, uLight: { value: new Color() }, uAccent: { value: new Color() } },
    })
    return { geometry, material }
  }, [cap])
  useDispose(geometry, material)
  useEffect(() => geometry.setDrawRange(0, Math.min(COUNTS.lures[cap], COUNTS.lures[tier])), [geometry, cap, tier])
  useFrame((st) => {
    const s = state()
    if (!s) return
    const u = material.uniforms
    u.uTime.value = st.clock.elapsedTime
    u.uDpr.value = st.viewport.dpr
    u.uBio.value = s.fx.bio
    u.uFogDensity.value = s.fx.fogDensity
    setLin(u.uLight.value, s.colors.primary.lin)
    setLin(u.uAccent.value, s.colors.accent.lin)
  }, -1)
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={6} />
}

export default function Experience() {
  const cap = useFlow((s) => s.tierCap)
  useEffect(() => {
    useFlow.getState().setLoad(0.85)
    const st = useFlow.getState()
    st.setStats({ particles: COUNTS.snow[st.tier] + COUNTS.lures[st.tier] })
  }, [])
  return (
    <Stage camera={{ fov: 55, near: 0.1, far: 3000 }}>
      <CameraRig parallax={0.5} rollGain={0.1} fovGain={2.5} />
      <Dome />
      <Surface />
      <Reef />
      <Rays />
      <Snow cap={cap} />
      <Jellies cap={cap} />
      <Lures cap={cap} />
      <Effects bloomThreshold={0.25} />
    </Stage>
  )
}
