// Resonance Hall 3D world: sky, the sound landscape (1 draw), shimmer motes (1 draw).
// The landscape is shaped by a precomputed heightmap; live audio adds displacement only while
// sound plays, through a smoothed spectrogram texture.

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  LinearFilter,
  PlaneGeometry,
  RedFormat,
  ShaderMaterial,
  SphereGeometry,
  UnsignedByteType,
} from 'three'
import type { Vec3 } from '../engine/curve'
import { damp, rng } from '../engine/math'
import { getEngine } from '../engine/runtime'
import { type Tier, useFlow } from '../engine/store'
import { CameraRig } from '../engine/three/CameraRig'
import { Effects } from '../engine/three/Effects'
import { Stage } from '../engine/three/Stage'
import { sound } from './audio'
import { COUNTS, REGIONS, type SoundFx } from './chapters'
import * as S from './shaders/terrain'
import { heightAt } from './world'

const setLin = (c: Color, v: Vec3) => c.setRGB(v[0], v[1], v[2])
const state = () => getEngine<SoundFx>()?.state
const ROWS = 64
const BINS = 256

function Sky() {
  const { geometry, material } = useMemo(() => {
    const geometry = new SphereGeometry(1, 32, 16)
    const material = new ShaderMaterial({
      vertexShader: S.skyVertex,
      fragmentShader: S.skyFragment,
      side: BackSide,
      depthWrite: false,
      depthTest: false,
      uniforms: { uBg: { value: new Color() }, uFog: { value: new Color() }, uGlow: { value: new Color() } },
    })
    return { geometry, material }
  }, [])
  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material])
  useFrame(() => {
    const s = state()
    if (!s) return
    setLin(material.uniforms.uBg.value, s.colors.bg.lin)
    setLin(material.uniforms.uFog.value, s.colors.fog.lin)
    setLin(material.uniforms.uGlow.value, s.colors.primary.lin)
  }, -1)
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={-10} />
}

function Landscape({ cap }: { cap: Tier }) {
  const { geometry, material, spec } = useMemo(() => {
    const [cols, rows] = COUNTS.grid[cap]
    const geometry = new PlaneGeometry(REGIONS.width, REGIONS.length, cols, rows)
    geometry.rotateX(-Math.PI / 2)
    geometry.translate(0, 0, REGIONS.zStart - REGIONS.length / 2)
    const p = geometry.attributes.position as BufferAttribute
    for (let i = 0; i < p.count; i++) p.setY(i, heightAt(p.getX(i), p.getZ(i)))
    p.needsUpdate = true
    const spec = new DataTexture(new Uint8Array(BINS * ROWS), BINS, ROWS, RedFormat, UnsignedByteType)
    spec.minFilter = LinearFilter
    spec.magFilter = LinearFilter
    spec.needsUpdate = true
    const material = new ShaderMaterial({
      vertexShader: S.terrainVertex,
      fragmentShader: S.terrainFragment,
      uniforms: {
        uSpec: { value: spec },
        uAudio: { value: 0 },
        uCamZ: { value: 0 },
        uHalfW: { value: 60 },
        uSurface: { value: new Color() },
        uGlow: { value: new Color() },
        uAccent: { value: new Color() },
        uFog: { value: new Color() },
        uLineGlow: { value: 1 },
        uContour: { value: 1 },
        uGrid: { value: 0.3 },
        uFogDensity: { value: 0.01 },
      },
    })
    return { geometry, material, spec }
  }, [cap])
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
      spec.dispose()
    },
    [geometry, material, spec],
  )
  const audio = useMemo(() => ({ level: 0, energy: 0 }), [])
  useFrame((st, dt) => {
    const s = state()
    if (!s) return
    const u = material.uniforms
    // spectrogram: shift rows away from the camera, newest row at 0; fade out when silent
    const data = spec.image.data as Uint8Array
    if (sound.readSpectrum()) {
      data.copyWithin(BINS, 0, BINS * (ROWS - 1))
      data.set(sound.bins, 0)
      audio.energy = 1
      spec.needsUpdate = true
    } else if (audio.energy > 0.001) {
      for (let i = 0; i < data.length; i++) data[i] = (data[i] * 0.94) | 0
      audio.energy *= 0.94
      spec.needsUpdate = true
    }
    audio.level = damp(audio.level, sound.playing && !sound.muted ? s.fx.audioGain : 0, 2.2, Math.min(dt, 0.1))
    u.uAudio.value = audio.level
    u.uCamZ.value = st.camera.position.z
    setLin(u.uSurface.value, s.colors.secondary.lin)
    setLin(u.uGlow.value, s.colors.primary.lin)
    setLin(u.uAccent.value, s.colors.accent.lin)
    setLin(u.uFog.value, s.colors.fog.lin)
    u.uLineGlow.value = s.fx.lineGlow
    u.uContour.value = s.fx.contour
    u.uGrid.value = s.fx.grid
    u.uFogDensity.value = s.fx.fogDensity
  }, -1)
  return <mesh geometry={geometry} material={material} frustumCulled={false} />
}

function Motes({ cap }: { cap: Tier }) {
  const tier = useFlow((s) => s.tier)
  const { geometry, material } = useMemo(() => {
    const n = COUNTS.motes[cap]
    const r = rng(3)
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const z = REGIONS.bassEnd - 20 - Math.pow(r(), 0.7) * (REGIONS.length - (REGIONS.zStart - REGIONS.bassEnd) - 10)
      pos.set([(r() - 0.5) * 90, r() * 18, z], i * 3)
      seed[i] = r()
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(pos, 3))
    geometry.setAttribute('aSeed', new BufferAttribute(seed, 1))
    const material = new ShaderMaterial({
      vertexShader: S.moteVertex,
      fragmentShader: S.moteFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uDpr: { value: 1 }, uShimmer: { value: 0 }, uFogDensity: { value: 0.01 }, uGlow: { value: new Color() } },
    })
    return { geometry, material }
  }, [cap])
  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material])
  useEffect(() => {
    const v = Math.min(COUNTS.motes[cap], COUNTS.motes[tier])
    geometry.setDrawRange(0, v)
    useFlow.getState().setStats({ particles: v })
  }, [geometry, cap, tier])
  useFrame((st) => {
    const s = state()
    if (!s) return
    const u = material.uniforms
    u.uTime.value = st.clock.elapsedTime
    u.uDpr.value = st.viewport.dpr
    u.uShimmer.value = s.fx.shimmer
    u.uFogDensity.value = s.fx.fogDensity
    setLin(u.uGlow.value, s.colors.primary.lin)
  }, -1)
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={4} />
}

export default function Experience() {
  const cap = useFlow((s) => s.tierCap)
  useEffect(() => {
    useFlow.getState().setLoad(0.85)
  }, [])
  return (
    <Stage camera={{ fov: 52, near: 0.1, far: 2000 }}>
      <CameraRig parallax={0.6} rollGain={0.12} fovGain={2.5} />
      <Sky />
      <Landscape cap={cap} />
      <Motes cap={cap} />
      <Effects bloomThreshold={0.3} />
    </Stage>
  )
}
