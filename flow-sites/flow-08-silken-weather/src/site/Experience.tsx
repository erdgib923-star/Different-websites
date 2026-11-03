// Silken Weather 3D world: a soft studio backdrop and several silk ribbons merged into ONE
// geometry (one draw call), all displaced on the GPU along the camera path.

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { BackSide, BufferAttribute, Color, DataTexture, DoubleSide, FloatType, NearestFilter, PlaneGeometry, RGBAFormat, ShaderMaterial, SphereGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Vec3 } from '../engine/curve'
import { damp, rng } from '../engine/math'
import { getEngine } from '../engine/runtime'
import { type Tier, useFlow } from '../engine/store'
import { CameraRig } from '../engine/three/CameraRig'
import { Effects } from '../engine/three/Effects'
import { Stage } from '../engine/three/Stage'
import { COUNTS, type SilkFx, flow } from './chapters'
import * as S from './shaders/silk'

const setLin = (c: Color, v: Vec3) => c.setRGB(v[0], v[1], v[2])
const state = () => getEngine<SilkFx>()?.state
const SAMPLES = 512

function Studio() {
  const camera = useThree((s) => s.camera)
  const { geometry, material } = useMemo(() => {
    const geometry = new SphereGeometry(1, 48, 24)
    const material = new ShaderMaterial({
      vertexShader: S.studioVertex,
      fragmentShader: S.studioFragment,
      side: BackSide,
      depthWrite: false,
      depthTest: false,
      uniforms: { uBack: { value: new Color() }, uFog: { value: new Color() }, uSilk: { value: new Color() }, uAhead: { value: new Vector3(0, 0, -1) } },
    })
    return { geometry, material }
  }, [])
  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material])
  useFrame(() => {
    const s = state()
    if (!s) return
    const u = material.uniforms
    setLin(u.uBack.value, s.colors.bg.lin)
    setLin(u.uFog.value, s.colors.fog.lin)
    setLin(u.uSilk.value, s.colors.primary.lin)
    camera.getWorldDirection(u.uAhead.value)
  }, -1)
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={-10} />
}

function Ribbons({ cap }: { cap: Tier }) {
  const tier = useFlow((s) => s.tier)
  const { geometry, material, perRibbonIndex } = useMemo(() => {
    // the camera path, sampled by arc length, as a 512 x 1 float texture
    const data = new Float32Array(SAMPLES * 4)
    const p: Vec3 = [0, 0, 0]
    for (let i = 0; i < SAMPLES; i++) {
      flow.camCurve.pointAt(i / (SAMPLES - 1), p)
      data.set([p[0], p[1], p[2], 1], i * 4)
    }
    const path = new DataTexture(data, SAMPLES, 1, RGBAFormat, FloatType)
    path.minFilter = NearestFilter
    path.magFilter = NearestFilter
    path.needsUpdate = true
    const [segL, segW] = COUNTS.segments[cap]
    const n = COUNTS.ribbons[cap]
    const r = rng(19)
    const parts = Array.from({ length: n }, (_, i) => {
      const g = new PlaneGeometry(1, 1, segL, segW)
      const count = g.attributes.position.count
      const rib = new Float32Array(count * 2)
      const phase = r()
      for (let k = 0; k < count; k++) rib.set([n > 1 ? i / (n - 1) : 0, phase], k * 2)
      g.setAttribute('aRib', new BufferAttribute(rib, 2))
      return g
    })
    const perRibbonIndex = parts[0].index!.count
    const geometry = mergeGeometries(parts)!
    parts.forEach((g) => g.dispose())
    const material = new ShaderMaterial({
      vertexShader: S.ribbonVertex,
      fragmentShader: S.ribbonFragment,
      side: DoubleSide,
      transparent: true,
      uniforms: {
        uPath: { value: path },
        uStart: { value: 0 },
        uSpan: { value: 0.14 },
        uTime: { value: 0 },
        uSpread: { value: 1 },
        uWidth: { value: 1 },
        uTwist: { value: 1 },
        uWave: { value: 0 },
        uFlutter: { value: 0 },
        uVel: { value: 0 },
        uSilk: { value: new Color() },
        uSilk2: { value: new Color() },
        uFog: { value: new Color() },
        uSheen: { value: 1 },
        uVeil: { value: 0 },
        uFogDensity: { value: 0.02 },
      },
    })
    return { geometry, material, perRibbonIndex }
  }, [cap])
  useEffect(
    () => () => {
      geometry.dispose()
      ;(material.uniforms.uPath.value as DataTexture).dispose()
      material.dispose()
    },
    [geometry, material],
  )
  // fewer ribbons on a downgraded tier: draw a prefix of the merged index buffer
  useEffect(() => {
    const ribbons = Math.min(COUNTS.ribbons[cap], COUNTS.ribbons[tier])
    geometry.setDrawRange(0, perRibbonIndex * ribbons)
    useFlow.getState().setStats({ particles: ribbons })
  }, [geometry, perRibbonIndex, cap, tier])
  const vel = useMemo(() => ({ v: 0 }), [])
  useFrame((st, dt) => {
    const s = state()
    if (!s) return
    const m = useFlow.getState().motion
    const u = material.uniforms
    vel.v = damp(vel.v, Math.max(-1, Math.min(1, m.velocity * 2.5)), 3, Math.min(dt, 0.1))
    u.uStart.value = s.camU + 0.004
    u.uTime.value = st.clock.elapsedTime
    u.uSpread.value = s.fx.spread
    u.uWidth.value = s.fx.width
    u.uTwist.value = s.fx.twist
    u.uWave.value = s.fx.wave
    u.uFlutter.value = s.fx.flutter
    u.uVel.value = vel.v
    u.uSheen.value = s.fx.sheen
    u.uVeil.value = s.fx.veil
    u.uFogDensity.value = s.fx.fogDensity
    setLin(u.uSilk.value, s.colors.primary.lin)
    setLin(u.uSilk2.value, s.colors.secondary.lin)
    setLin(u.uFog.value, s.colors.fog.lin)
  }, -1)
  return <mesh geometry={geometry} material={material} frustumCulled={false} />
}

export default function Experience() {
  const cap = useFlow((s) => s.tierCap)
  useEffect(() => {
    useFlow.getState().setLoad(0.85)
  }, [])
  return (
    <Stage camera={{ fov: 48, near: 0.05, far: 1200 }}>
      <CameraRig parallax={0.25} rollGain={0.1} fovGain={2} />
      <Studio />
      <Ribbons cap={cap} />
      <Effects bloomThreshold={0.85} />
    </Stage>
  )
}
