// Rootwork 3D world: sky, meadow, an L-system tree (instanced branch segments, 1 draw),
// instanced leaves (1 draw), the seed, and falling leaves + snow (1 draw).

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  InstancedMesh,
  Matrix4,
  type Mesh,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import type { Vec3 } from '../engine/curve'
import { rng } from '../engine/math'
import { getEngine } from '../engine/runtime'
import { type Tier, useFlow } from '../engine/store'
import { CameraRig } from '../engine/three/CameraRig'
import { Effects } from '../engine/three/Effects'
import { Stage } from '../engine/three/Stage'
import type { SceneState } from '../engine/timeline'
import { COUNTS, type RootFx } from './chapters'
import * as S from './shaders/forest'
import { buildTree } from './tree'

const setLin = (c: Color, v: Vec3) => c.setRGB(v[0], v[1], v[2])
const state = () => getEngine<RootFx>()?.state

function common() {
  return { uTime: { value: 0 }, uWind: { value: 0 }, uSky: { value: new Color() }, uHaze: { value: new Color() }, uSunAmt: { value: 1 }, uFogDensity: { value: 0.01 } }
}
function writeCommon(u: Record<string, { value: unknown }>, s: SceneState<RootFx>, t: number) {
  u.uTime.value = t
  u.uWind.value = s.fx.wind
  setLin(u.uSky.value as Color, s.colors.bg.lin)
  setLin(u.uHaze.value as Color, s.colors.fog.lin)
  u.uSunAmt.value = s.fx.sun
  u.uFogDensity.value = s.fx.fogDensity
}

function useDispose(...items: { dispose: () => void }[]) {
  useEffect(() => () => items.forEach((i) => i.dispose()), items) // eslint-disable-line react-hooks/exhaustive-deps
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
      uniforms: { uSky: { value: new Color() }, uHaze: { value: new Color() }, uSunAmt: { value: 1 } },
    })
    return { geometry, material }
  }, [])
  useDispose(geometry, material)
  useFrame(() => {
    const s = state()
    if (!s) return
    setLin(material.uniforms.uSky.value, s.colors.bg.lin)
    setLin(material.uniforms.uHaze.value, s.colors.fog.lin)
    material.uniforms.uSunAmt.value = s.fx.sun
  }, -1)
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={-10} />
}

function Ground() {
  const { geometry, material } = useMemo(() => {
    // subdivided so the vertex shader can roll the meadow away from the tree
    const geometry = new PlaneGeometry(140, 140, 140, 140)
    geometry.rotateX(-Math.PI / 2)
    const material = new ShaderMaterial({
      vertexShader: S.groundVertex,
      fragmentShader: S.groundFragment,
      uniforms: { ...common(), uGround: { value: new Color() }, uSnowCover: { value: 0 } },
    })
    return { geometry, material }
  }, [])
  useDispose(geometry, material)
  useFrame((st) => {
    const s = state()
    if (!s) return
    writeCommon(material.uniforms, s, st.clock.elapsedTime)
    setLin(material.uniforms.uGround.value, s.colors.secondary.lin)
    material.uniforms.uSnowCover.value = s.fx.snowCover
  }, -1)
  return <mesh geometry={geometry} material={material} />
}

function Tree({ cap }: { cap: Tier }) {
  const tier = useFlow((s) => s.tier)
  const seed = useRef<Mesh>(null)
  const { branches, leaves, leafCount, seedGeo } = useMemo(() => {
    const t = buildTree(COUNTS.iterations[cap], COUNTS.leavesPerTip[cap])
    // branches
    const cyl = new CylinderGeometry(0.62, 1, 1, 7, 1, false)
    cyl.translate(0, 0.5, 0)
    const grow = new Float32Array(t.segments.length * 2)
    const bmat = new ShaderMaterial({
      vertexShader: S.branchVertex,
      fragmentShader: S.branchFragment,
      uniforms: { ...common(), uGrowth: { value: 0 }, uSnowCover: { value: 0 } },
    })
    const branches = new InstancedMesh(cyl, bmat, t.segments.length)
    const m = new Matrix4()
    const q = new Quaternion()
    const up = new Vector3(0, 1, 0)
    const d = new Vector3()
    t.segments.forEach((sg, i) => {
      d.set(sg.end[0] - sg.start[0], sg.end[1] - sg.start[1], sg.end[2] - sg.start[2])
      const len = d.length()
      q.setFromUnitVectors(up, d.normalize())
      m.compose(new Vector3(...sg.start), q, new Vector3(sg.radius, len, sg.radius))
      branches.setMatrixAt(i, m)
      grow[i * 2] = sg.birth
      grow[i * 2 + 1] = sg.dur
    })
    cyl.setAttribute('aGrow', new InstancedBufferAttribute(grow, 2))
    branches.frustumCulled = false
    // leaves: instanced quads, positioned in the shader (so they can fall)
    const quad = new PlaneGeometry(1, 1)
    const lg = new InstancedBufferGeometry()
    lg.index = quad.index
    lg.setAttribute('position', quad.attributes.position)
    lg.setAttribute('uv', quad.attributes.uv)
    const n = t.leaves.length
    const a1 = new Float32Array(n * 4)
    const a2 = new Float32Array(n * 4)
    const sd = new Float32Array(n)
    t.leaves.forEach((l, i) => {
      a1.set([l.pos[0], l.pos[1], l.pos[2], l.size], i * 4)
      a2.set([l.dir[0], l.dir[1], l.dir[2], l.birth], i * 4)
      sd[i] = l.seed
    })
    lg.setAttribute('aLeaf', new InstancedBufferAttribute(a1, 4))
    lg.setAttribute('aLeaf2', new InstancedBufferAttribute(a2, 4))
    lg.setAttribute('aSeed', new InstancedBufferAttribute(sd, 1))
    lg.instanceCount = n
    const lmat = new ShaderMaterial({
      vertexShader: S.leafVertex,
      fragmentShader: S.leafFragment,
      side: DoubleSide,
      uniforms: {
        ...common(),
        uGrowth: { value: 0 },
        uFoliage: { value: 0 },
        uFall: { value: 0 },
        uSnowCover: { value: 0 },
        uLeaf: { value: new Color() },
        uLeafB: { value: new Color() },
      },
    })
    const seedGeo = new SphereGeometry(0.09, 16, 12)
    seedGeo.scale(1, 0.62, 0.8)
    return { branches, leaves: { geometry: lg, material: lmat, quad }, leafCount: n, seedGeo }
  }, [cap])
  useEffect(
    () => () => {
      branches.geometry.dispose()
      ;(branches.material as ShaderMaterial).dispose()
      branches.dispose()
      leaves.geometry.dispose()
      leaves.quad.dispose()
      leaves.material.dispose()
      seedGeo.dispose()
    },
    [branches, leaves, seedGeo],
  )
  useEffect(() => {
    const visible = cap === tier ? leafCount : Math.round(leafCount * (tier === 'low' ? 0.4 : 0.7))
    leaves.geometry.instanceCount = visible
    useFlow.getState().setStats({ particles: visible })
  }, [leaves, leafCount, cap, tier])
  useFrame((st) => {
    const s = state()
    if (!s) return
    const t = st.clock.elapsedTime
    const bu = (branches.material as ShaderMaterial).uniforms
    writeCommon(bu, s, t)
    bu.uGrowth.value = s.fx.growth
    bu.uSnowCover.value = s.fx.snowCover
    const lu = leaves.material.uniforms
    writeCommon(lu, s, t)
    lu.uGrowth.value = s.fx.growth
    lu.uFoliage.value = s.fx.foliage
    lu.uFall.value = s.fx.fall
    lu.uSnowCover.value = s.fx.snowCover
    setLin(lu.uLeaf.value, s.colors.primary.lin)
    setLin(lu.uLeafB.value, s.colors.accent.lin)
    if (seed.current) {
      const k = 1 - Math.min(1, s.fx.growth / 0.08)
      seed.current.visible = k > 0.01
      seed.current.scale.setScalar(0.4 + 0.6 * k)
    }
  }, -1)
  return (
    <>
      <primitive object={branches} />
      <mesh geometry={leaves.geometry} material={leaves.material} frustumCulled={false} />
      <mesh ref={seed} geometry={seedGeo} position={[0, 0.04, 0]}>
        <meshLambertMaterial color="#6b4a2e" />
      </mesh>
    </>
  )
}

function Weather({ cap }: { cap: Tier }) {
  const tier = useFlow((s) => s.tier)
  const { geometry, material } = useMemo(() => {
    const n = COUNTS.weather[cap]
    const r = rng(12)
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    const type = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos.set([r(), r(), r()], i * 3)
      seed[i] = r()
      type[i] = r() < 0.55 ? 1 : 0
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(pos, 3))
    geometry.setAttribute('aSeed', new BufferAttribute(seed, 1))
    geometry.setAttribute('aType', new BufferAttribute(type, 1))
    const material = new ShaderMaterial({
      vertexShader: S.weatherVertex,
      fragmentShader: S.weatherFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uDpr: { value: 1 },
        uFlying: { value: 0 },
        uSnow: { value: 0 },
        uWind: { value: 0 },
        uFogDensity: { value: 0.01 },
        uLeaf: { value: new Color() },
        uLeafB: { value: new Color() },
      },
    })
    return { geometry, material }
  }, [cap])
  useDispose(geometry, material)
  useEffect(() => geometry.setDrawRange(0, Math.min(COUNTS.weather[cap], COUNTS.weather[tier])), [geometry, cap, tier])
  useFrame((st) => {
    const s = state()
    if (!s) return
    const u = material.uniforms
    u.uTime.value = st.clock.elapsedTime
    u.uDpr.value = st.viewport.dpr
    u.uFlying.value = s.fx.flyingLeaves
    u.uSnow.value = s.fx.snow
    u.uWind.value = s.fx.wind
    u.uFogDensity.value = s.fx.fogDensity
    setLin(u.uLeaf.value, s.colors.primary.lin)
    setLin(u.uLeafB.value, s.colors.accent.lin)
  }, -1)
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />
}

export default function Experience() {
  const cap = useFlow((s) => s.tierCap)
  useEffect(() => {
    useFlow.getState().setLoad(0.85)
  }, [])
  return (
    <Stage camera={{ fov: 45, near: 0.05, far: 900 }}>
      <CameraRig parallax={0.3} rollGain={0.08} fovGain={2} />
      <hemisphereLight args={['#dfe8f0', '#4a3a2a', 0.9]} />
      <directionalLight position={[4, 8, 3]} intensity={1.2} />
      <Sky />
      <Ground />
      <Tree cap={cap} />
      <Weather cap={cap} />
      <Effects bloomThreshold={0.85} />
    </Stage>
  )
}
