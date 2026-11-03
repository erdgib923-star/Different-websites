// Druse 3D world: sky beyond the mouth, the cave wall (1 draw), instanced prisms (1 draw),
// instanced octahedra (1 draw), floating dust (1 draw) and three hero crystals in the geode.
// Hero crystals use drei's MeshTransmissionMaterial on high/mid tiers (one merged mesh = one
// extra transmission pass) and a standard emissive material on the low tier.

import { MeshTransmissionMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  type Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  type Material,
  OctahedronGeometry,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Vec3 } from '../engine/curve'
import { rng } from '../engine/math'
import { getEngine } from '../engine/runtime'
import { type Tier, useFlow } from '../engine/store'
import { CameraRig } from '../engine/three/CameraRig'
import { Effects } from '../engine/three/Effects'
import { Stage } from '../engine/three/Stage'
import { buildCrystals, buildWall } from './cave'
import { CAVE, COUNTS, type DruseFx } from './chapters'
import * as S from './shaders/cave'

const setLin = (c: Color, v: Vec3) => c.setRGB(v[0], v[1], v[2])
const state = () => getEngine<DruseFx>()?.state

function useDispose(...items: { dispose: () => void }[]) {
  useEffect(() => () => items.forEach((i) => i.dispose()), items) // eslint-disable-line react-hooks/exhaustive-deps
}

/** Hexagonal prism with a pyramid tip, base at y = 0, tip at y = 1. */
function prismGeometry() {
  const body = new CylinderGeometry(1, 1, 0.78, 6, 1, true)
  body.translate(0, 0.39, 0)
  const tip = new ConeGeometry(1, 0.22, 6, 1, true)
  tip.translate(0, 0.89, 0)
  const g = mergeGeometries([body, tip])!
  body.dispose()
  tip.dispose()
  return g
}
function octaGeometry() {
  const g = new OctahedronGeometry(1, 0)
  g.translate(0, 1, 0)
  g.scale(1, 0.5, 1)
  return g
}

const up = new Vector3(0, 1, 0)
function placeInstances(mesh: InstancedMesh, list: ReturnType<typeof buildCrystals>, widthMul: number, lenMul: number) {
  const m = new Matrix4()
  const q = new Quaternion()
  const d = new Vector3()
  const data = new Float32Array(list.length * 2)
  list.forEach((c, i) => {
    d.set(c.dir[0], c.dir[1], c.dir[2])
    q.setFromUnitVectors(up, d)
    m.compose(new Vector3(c.p[0], c.p[1], c.p[2]), q, new Vector3(c.width * widthMul, c.len * lenMul, c.width * widthMul))
    mesh.setMatrixAt(i, m)
    data[i * 2] = c.seed
    data[i * 2 + 1] = c.t * 7.0 + c.seed
  })
  mesh.geometry.setAttribute('aC', new InstancedBufferAttribute(data, 2))
  mesh.frustumCulled = false
}

function crystalMaterial() {
  return new ShaderMaterial({
    vertexShader: S.crystalVertex,
    fragmentShader: S.crystalFragment,
    side: DoubleSide,
    uniforms: { uCrystal: { value: new Color() }, uLight: { value: new Color() }, uFog: { value: new Color() }, uGlow: { value: 1 }, uFogDensity: { value: 0.02 }, uTime: { value: 0 } },
  })
}

function Sky() {
  const { geometry, material } = useMemo(() => {
    const geometry = new SphereGeometry(1, 32, 16)
    const material = new ShaderMaterial({
      vertexShader: S.skyVertex,
      fragmentShader: S.skyFragment,
      side: BackSide,
      depthWrite: false,
      depthTest: false,
      uniforms: { uFog: { value: new Color() }, uLight: { value: new Color() }, uDaylight: { value: 1 } },
    })
    return { geometry, material }
  }, [])
  useDispose(geometry, material)
  useFrame(() => {
    const s = state()
    if (!s) return
    setLin(material.uniforms.uFog.value, s.colors.fog.lin)
    setLin(material.uniforms.uLight.value, s.colors.primary.lin)
    material.uniforms.uDaylight.value = s.fx.daylight
  }, -1)
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={-10} />
}

function Wall({ cap }: { cap: Tier }) {
  const { geometry, material } = useMemo(() => {
    const rings = cap === 'low' ? 260 : cap === 'mid' ? 360 : 460
    const segs = cap === 'low' ? 48 : 72
    const w = buildWall(rings, segs)
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(w.pos, 3))
    geometry.setAttribute('uv', new BufferAttribute(w.uv, 2))
    geometry.setIndex(w.index)
    const material = new ShaderMaterial({
      vertexShader: S.rockVertex,
      fragmentShader: S.rockFragment,
      side: DoubleSide,
      uniforms: {
        uRock: { value: new Color() },
        uFog: { value: new Color() },
        uLight: { value: new Color() },
        uCrystal: { value: new Color() },
        uWallLight: { value: 1 },
        uDaylight: { value: 1 },
        uSparkle: { value: 1 },
        uFogDensity: { value: 0.02 },
        uTime: { value: 0 },
      },
    })
    return { geometry, material }
  }, [cap])
  useDispose(geometry, material)
  useFrame((st) => {
    const s = state()
    if (!s) return
    const u = material.uniforms
    setLin(u.uRock.value, s.colors.bg.lin)
    setLin(u.uFog.value, s.colors.fog.lin)
    setLin(u.uLight.value, s.colors.primary.lin)
    setLin(u.uCrystal.value, s.colors.secondary.lin)
    u.uWallLight.value = s.fx.wallLight
    u.uDaylight.value = s.fx.daylight
    u.uSparkle.value = s.fx.sparkle
    u.uFogDensity.value = s.fx.fogDensity
    u.uTime.value = st.clock.elapsedTime
  }, -1)
  return <mesh geometry={geometry} material={material} frustumCulled={false} />
}

function Crystals({ cap }: { cap: Tier }) {
  const tier = useFlow((s) => s.tier)
  const { prisms, octas, material } = useMemo(() => {
    const material = crystalMaterial()
    const pl = buildCrystals(COUNTS.prisms[cap], 31)
    const ol = buildCrystals(COUNTS.octa[cap], 57)
    const prisms = new InstancedMesh(prismGeometry(), material, pl.length)
    placeInstances(prisms, pl, 1, 1)
    const octas = new InstancedMesh(octaGeometry(), material, ol.length)
    placeInstances(octas, ol, 1.6, 0.55)
    return { prisms, octas, material }
  }, [cap])
  useEffect(
    () => () => {
      prisms.geometry.dispose()
      octas.geometry.dispose()
      material.dispose()
      prisms.dispose()
      octas.dispose()
    },
    [prisms, octas, material],
  )
  useEffect(() => {
    prisms.count = Math.min(COUNTS.prisms[cap], COUNTS.prisms[tier])
    octas.count = Math.min(COUNTS.octa[cap], COUNTS.octa[tier])
  }, [prisms, octas, cap, tier])
  useFrame((st) => {
    const s = state()
    if (!s) return
    const u = material.uniforms
    setLin(u.uCrystal.value, s.colors.secondary.lin)
    setLin(u.uLight.value, s.colors.primary.lin)
    setLin(u.uFog.value, s.colors.fog.lin)
    u.uGlow.value = s.fx.glow
    u.uFogDensity.value = s.fx.fogDensity
    u.uTime.value = st.clock.elapsedTime
  }, -1)
  return (
    <>
      <primitive object={prisms} />
      <primitive object={octas} />
    </>
  )
}

function Dust({ cap }: { cap: Tier }) {
  const tier = useFlow((s) => s.tier)
  const { geometry, material } = useMemo(() => {
    const n = COUNTS.dust[cap]
    const r = rng(9)
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
      vertexShader: S.dustVertex,
      fragmentShader: S.dustFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uBox: { value: 26 }, uDpr: { value: 1 }, uDust: { value: 1 }, uFogDensity: { value: 0.02 }, uLight: { value: new Color() } },
    })
    return { geometry, material }
  }, [cap])
  useDispose(geometry, material)
  useEffect(() => {
    const v = Math.min(COUNTS.dust[cap], COUNTS.dust[tier])
    geometry.setDrawRange(0, v)
    useFlow.getState().setStats({ particles: v })
  }, [geometry, cap, tier])
  useFrame((st) => {
    const s = state()
    if (!s) return
    const u = material.uniforms
    u.uTime.value = st.clock.elapsedTime
    u.uDpr.value = st.viewport.dpr
    u.uDust.value = s.fx.dust
    u.uFogDensity.value = s.fx.fogDensity
    setLin(u.uLight.value, s.colors.primary.lin)
  }, -1)
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />
}

/** Three hero crystals merged into one mesh, standing in the centre of the geode. */
function Heroes() {
  const tier = useFlow((s) => s.tier)
  const group = useRef<Group>(null)
  const mat = useRef<Material & { color: Color; emissive?: Color }>(null)
  const light = useRef<{ color: Color; intensity: number }>(null)
  const geometry = useMemo(() => {
    const parts = [
      { off: [0, -2.5, 0], tilt: [0.05, 0, 0.08], w: 1.9, l: 9.5 },
      { off: [2.4, -2.8, 1.2], tilt: [0.25, 0, -0.45], w: 1.3, l: 6.5 },
      { off: [-2.2, -2.9, -0.8], tilt: [-0.2, 0, 0.5], w: 1.1, l: 5.6 },
    ].map((p) => {
      const g = prismGeometry()
      g.scale(p.w, p.l, p.w)
      g.rotateX(p.tilt[0])
      g.rotateZ(p.tilt[2])
      g.translate(p.off[0], p.off[1], p.off[2])
      return g
    })
    const g = mergeGeometries(parts)!
    parts.forEach((p) => p.dispose())
    g.computeVertexNormals()
    return g
  }, [])
  useDispose(geometry)
  const tmp = useMemo(() => new Color(), [])
  useFrame(() => {
    const s = state()
    if (!s || !group.current) return
    const h = s.fx.hero
    group.current.visible = h > 0.01
    group.current.scale.setScalar(0.2 + 0.8 * h)
    if (mat.current) {
      setLin(tmp, s.colors.secondary.lin)
      mat.current.color.copy(tmp)
      if (mat.current.emissive) {
        setLin(mat.current.emissive, s.colors.primary.lin)
        mat.current.emissive.multiplyScalar(0.35)
      }
    }
    if (light.current) {
      setLin(light.current.color, s.colors.primary.lin)
      light.current.intensity = 160 * h
    }
  }, -1)
  const G = CAVE.geode
  return (
    <group ref={group} position={[G[0], G[1], G[2]]}>
      <pointLight ref={light as never} position={[0, 4, 0]} distance={60} decay={1.6} />
      <mesh geometry={geometry}>
        {tier === 'low' ? (
          <meshStandardMaterial ref={mat as never} roughness={0.25} metalness={0.1} emissiveIntensity={1} transparent opacity={0.92} />
        ) : (
          <MeshTransmissionMaterial
            ref={mat as never}
            samples={tier === 'high' ? 6 : 3}
            resolution={tier === 'high' ? 512 : 256}
            thickness={2.5}
            roughness={0.08}
            ior={1.8}
            clearcoat={1}
            emissiveIntensity={1}
            chromaticAberration={0.5}
            anisotropy={0.2}
            distortion={0.15}
            distortionScale={0.4}
            temporalDistortion={0}
            backside={false}
            transmission={1}
          />
        )}
      </mesh>
    </group>
  )
}

export default function Experience() {
  const cap = useFlow((s) => s.tierCap)
  useEffect(() => {
    useFlow.getState().setLoad(0.85)
  }, [])
  return (
    <Stage camera={{ fov: 56, near: 0.05, far: 2000 }}>
      <CameraRig parallax={0.35} rollGain={0.12} fovGain={2.5} />
      <ambientLight intensity={0.35} />
      <Sky />
      <Wall cap={cap} />
      <Crystals cap={cap} />
      <Heroes />
      <Dust cap={cap} />
      <Effects bloomThreshold={0.45} />
    </Stage>
  )
}
