// Lumen Drift 3D world: sky dome, one particle system (single draw call), ribbon trail, camera
// rig and post FX. Lazy-loaded; everything reads the engine's per-frame sceneState.

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Raycaster,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three'
import type { Vec3 } from '../engine/curve'
import { getEngine } from '../engine/runtime'
import { useFlow } from '../engine/store'
import { CameraRig } from '../engine/three/CameraRig'
import { Effects } from '../engine/three/Effects'
import { Stage } from '../engine/three/Stage'
import { type LumenFx, PARTICLES, WORLD, flow } from './chapters'
import { bgFragment, bgVertex } from './shaders/background'
import { particleFragment, particleVertex } from './shaders/particles'
import { ribbonFragment, ribbonVertex } from './shaders/ribbon'
import { buildTargets } from './targets'

const setLin = (c: Color, v: Vec3) => c.setRGB(v[0], v[1], v[2])

function Sky() {
  const { geometry, material } = useMemo(() => {
    const geometry = new SphereGeometry(1, 48, 24)
    const material = new ShaderMaterial({
      vertexShader: bgVertex,
      fragmentShader: bgFragment,
      side: BackSide,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uNebula: { value: 0 },
        uHorizon: { value: 0 },
        uBg: { value: new Color() },
        uFog: { value: new Color() },
        uPrimary: { value: new Color() },
        uAccent: { value: new Color() },
      },
    })
    return { geometry, material }
  }, [])
  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material])
  useFrame((state) => {
    const s = getEngine<LumenFx>()?.state
    if (!s) return
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uProgress.value = s.progress
    u.uNebula.value = s.fx.nebula
    u.uHorizon.value = s.fx.horizon
    setLin(u.uBg.value, s.colors.bg.lin)
    setLin(u.uFog.value, s.colors.fog.lin)
    setLin(u.uPrimary.value, s.colors.primary.lin)
    setLin(u.uAccent.value, s.colors.accent.lin)
  }, -1)
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={-10} />
}

function Particles() {
  const tierCap = useFlow((s) => s.tierCap)
  const tier = useFlow((s) => s.tier)
  const camera = useThree((s) => s.camera)
  const { geometry, material, count } = useMemo(() => {
    const count = PARTICLES[tierCap]
    const t = buildTargets(count)
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(t.spark, 3))
    geometry.setAttribute('aCanyon', new BufferAttribute(t.canyon, 3))
    geometry.setAttribute('aBloom', new BufferAttribute(t.bloom, 3))
    geometry.setAttribute('aHorizon', new BufferAttribute(t.horizon, 3))
    geometry.setAttribute('aSeed', new BufferAttribute(t.seed, 4))
    const material = new ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uDpr: { value: 1 },
        uSize: { value: 1 },
        uIntensity: { value: 1 },
        uTurb: { value: 0 },
        uSpin: { value: 0 },
        uRepel: { value: 0 },
        uSpeed: { value: 0 },
        uFogDensity: { value: 0.01 },
        uCountGain: { value: 1 },
        uB: { value: flow.boundaries.slice() },
        uW: { value: flow.blendWidths.slice() },
        uRiver: { value: WORLD.river.map((p) => new Vector3(...p)) },
        uStorm: { value: new Vector3(...WORLD.storm) },
        uRayO: { value: new Vector3() },
        uRayD: { value: new Vector3(0, 0, -1) },
        uPrimary: { value: new Color() },
        uSecondary: { value: new Color() },
        uAccent: { value: new Color() },
      },
    })
    return { geometry, material, count }
  }, [tierCap])
  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material])
  useEffect(() => {
    const visible = Math.min(count, PARTICLES[tier])
    geometry.setDrawRange(0, visible)
    // additive brightness grows with count: keep tiers looking alike (denser, not brighter)
    material.uniforms.uCountGain.value = Math.min(1.5, Math.max(0.7, Math.sqrt(60000 / visible)))
    useFlow.getState().setStats({ particles: visible })
  }, [geometry, material, count, tier])
  useEffect(() => {
    useFlow.getState().setLoad(0.85)
  }, [])

  const ray = useMemo(() => ({ caster: new Raycaster(), ndc: new Vector2() }), [])
  useFrame((state) => {
    const s = getEngine<LumenFx>()?.state
    if (!s) return
    const m = useFlow.getState().motion
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uProgress.value = s.progress
    u.uDpr.value = state.viewport.dpr
    u.uSize.value = s.fx.size
    u.uIntensity.value = s.fx.intensity
    u.uTurb.value = s.fx.turbulence + m.speed * 0.35
    u.uSpin.value = s.fx.spin + m.speed * s.fx.spin * 1.5
    u.uSpeed.value = m.speed
    u.uFogDensity.value = s.fx.fogDensity
    u.uRepel.value = s.fx.repel * m.pointerActive
    ray.ndc.set(m.pointerTX, m.pointerTY)
    ray.caster.setFromCamera(ray.ndc, camera)
    u.uRayO.value.copy(ray.caster.ray.origin)
    u.uRayD.value.copy(ray.caster.ray.direction)
    setLin(u.uPrimary.value, s.colors.primary.lin)
    setLin(u.uSecondary.value, s.colors.secondary.lin)
    setLin(u.uAccent.value, s.colors.accent.lin)
  }, -1)
  return <points geometry={geometry} material={material} frustumCulled={false} />
}

function Ribbon() {
  const { geometry, material } = useMemo(() => {
    const N = 1400
    const pos = new Float32Array(N * 2 * 3)
    const side = new Float32Array(N * 2 * 3)
    const us = new Float32Array(N * 2)
    const sign = new Float32Array(N * 2)
    const a: Vec3 = [0, 0, 0]
    const b: Vec3 = [0, 0, 0]
    const curve = flow.camCurve
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1)
      curve.pointAt(u, a)
      curve.pointAt(Math.min(u + 0.002, 1), b)
      let tx = b[0] - a[0]
      let tz = b[2] - a[2]
      const tl = Math.hypot(tx, tz) || 1
      tx /= tl
      tz /= tl
      // side vector = tangent x up (horizontal ribbon), lateral sway
      const sx = -tz
      const sz = tx
      const sway = Math.sin(u * 22) * 0.7
      for (let k = 0; k < 2; k++) {
        const j = i * 2 + k
        pos[j * 3] = a[0] + sx * sway
        pos[j * 3 + 1] = a[1] - 1.6
        pos[j * 3 + 2] = a[2] + sz * sway
        side[j * 3] = sx
        side[j * 3 + 1] = 0
        side[j * 3 + 2] = sz
        us[j] = u
        sign[j] = k === 0 ? -1 : 1
      }
    }
    const index: number[] = []
    for (let i = 0; i < N - 1; i++) {
      const o = i * 2
      index.push(o, o + 1, o + 2, o + 1, o + 3, o + 2)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(pos, 3))
    geometry.setAttribute('aSide', new BufferAttribute(side, 3))
    geometry.setAttribute('aU', new BufferAttribute(us, 1))
    geometry.setAttribute('aSign', new BufferAttribute(sign, 1))
    geometry.setIndex(index)
    const material = new ShaderMaterial({
      vertexShader: ribbonVertex,
      fragmentShader: ribbonFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      uniforms: {
        uHead: { value: 0 },
        uTime: { value: 0 },
        uRibbon: { value: 0 },
        uFogDensity: { value: 0.01 },
        uPrimary: { value: new Color() },
        uAccent: { value: new Color() },
      },
    })
    return { geometry, material }
  }, [])
  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material])
  useFrame((state) => {
    const s = getEngine<LumenFx>()?.state
    if (!s) return
    const u = material.uniforms
    u.uHead.value = s.camU + 0.075
    u.uTime.value = state.clock.elapsedTime
    u.uRibbon.value = s.fx.ribbon
    u.uFogDensity.value = s.fx.fogDensity
    setLin(u.uPrimary.value, s.colors.primary.lin)
    setLin(u.uAccent.value, s.colors.accent.lin)
  }, -1)
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />
}

export default function Experience() {
  return (
    <Stage camera={{ fov: 50, near: 0.1, far: 3000 }}>
      <CameraRig />
      <Sky />
      <Particles />
      <Ribbon />
      <Effects />
    </Stage>
  )
}
