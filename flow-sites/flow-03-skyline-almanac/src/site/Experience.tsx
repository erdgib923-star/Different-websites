// Skyline Almanac 3D world: sky dome (time of day), fbm terrain, instanced buildings that rise,
// street lights, three cloud layers. One sun direction drives every shader.

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  type Mesh,
  PlaneGeometry,
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
import type { SceneState } from '../engine/timeline'
import { COUNTS, type SkyFx, WORLD } from './chapters'
import * as S from './shaders/sky'
import { buildCity, heightAt } from './world'

const setLin = (c: Color, v: Vec3) => c.setRGB(v[0], v[1], v[2])
const state = () => getEngine<SkyFx>()?.state
const sunDir = new Vector3()

/** Uniforms every shader shares (sky colours + sun). Each material gets its own copies. */
function skyUniforms() {
  return { uSky: { value: new Color() }, uHorizon: { value: new Color() }, uSun: { value: new Color() }, uSunDir: { value: new Vector3(0, 1, 0) } }
}
function writeSky(u: Record<string, { value: unknown }>, s: SceneState<SkyFx>) {
  setLin(u.uSky.value as Color, s.colors.bg.lin)
  setLin(u.uHorizon.value as Color, s.colors.fog.lin)
  setLin(u.uSun.value as Color, s.colors.primary.lin)
  const e = s.fx.sunElev
  const a = s.fx.sunAz
  sunDir.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e))
  ;(u.uSunDir.value as Vector3).copy(sunDir)
}

function useDispose(...items: { dispose: () => void }[]) {
  useEffect(() => () => items.forEach((i) => i.dispose()), items) // eslint-disable-line react-hooks/exhaustive-deps
}

function Sky() {
  const { geometry, material } = useMemo(() => {
    const geometry = new SphereGeometry(1, 64, 32)
    const material = new ShaderMaterial({
      vertexShader: S.skyVertex,
      fragmentShader: S.skyFragment,
      side: BackSide,
      depthWrite: false,
      depthTest: false,
      uniforms: { ...skyUniforms(), uStars: { value: 0 }, uTime: { value: 0 } },
    })
    return { geometry, material }
  }, [])
  useDispose(geometry, material)
  useFrame((st) => {
    const s = state()
    if (!s) return
    writeSky(material.uniforms, s)
    material.uniforms.uStars.value = s.fx.stars
    material.uniforms.uTime.value = st.clock.elapsedTime
  }, -1)
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={-10} />
}

function Terrain({ cap }: { cap: Tier }) {
  const { geometry, material } = useMemo(() => {
    const seg = cap === 'low' ? 180 : cap === 'mid' ? 240 : 300
    const { size, centerZ } = WORLD.terrain
    const geometry = new PlaneGeometry(size, size, seg, seg)
    geometry.rotateX(-Math.PI / 2)
    const p = geometry.attributes.position as BufferAttribute
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const z = p.getZ(i) + centerZ
      p.setXYZ(i, x, heightAt(x, z), z)
    }
    geometry.computeVertexNormals()
    const material = new ShaderMaterial({
      vertexShader: S.terrainVertex,
      fragmentShader: S.terrainFragment,
      uniforms: {
        ...skyUniforms(),
        uLand: { value: new Color() },
        uAccent: { value: new Color() },
        uLights: { value: 0 },
        uFogDensity: { value: 0.002 },
        uHaze: { value: 1 },
        uCity: { value: new Vector2(...WORLD.city) },
        uCityR: { value: WORLD.cityRadius },
      },
    })
    return { geometry, material }
  }, [cap])
  useDispose(geometry, material)
  useFrame(() => {
    const s = state()
    if (!s) return
    const u = material.uniforms
    writeSky(u, s)
    setLin(u.uLand.value, s.colors.secondary.lin)
    setLin(u.uAccent.value, s.colors.accent.lin)
    u.uLights.value = s.fx.lights
    u.uFogDensity.value = s.fx.fogDensity
    u.uHaze.value = s.fx.haze
  }, -1)
  return <mesh geometry={geometry} material={material} />
}

function City({ cap }: { cap: Tier }) {
  const tier = useFlow((s) => s.tier)
  const { mesh, lights } = useMemo(() => {
    const { buildings, lights: lp } = buildCity(COUNTS.buildings[cap])
    const box = new BoxGeometry(1, 1, 1)
    box.translate(0, 0.5, 0)
    const data = new Float32Array(buildings.length * 4)
    const mesh = new InstancedMesh(
      box,
      new ShaderMaterial({
        vertexShader: S.buildingVertex,
        fragmentShader: S.buildingFragment,
        uniforms: {
          ...skyUniforms(),
          uRise: { value: 0 },
          uLand: { value: new Color() },
          uAccent: { value: new Color() },
          uLights: { value: 0 },
          uFogDensity: { value: 0.002 },
          uHaze: { value: 1 },
        },
      }),
      buildings.length,
    )
    const m = new Matrix4()
    buildings.forEach((b, i) => {
      m.makeScale(b.w, 1, b.d).setPosition(b.x, 1.6, b.z)
      mesh.setMatrixAt(i, m)
      data.set([b.delay, b.h, b.seed, 0], i * 4)
    })
    box.setAttribute('aB', new InstancedBufferAttribute(data, 4))
    mesh.frustumCulled = false
    // street lights: shuffled so a drawRange prefix is spread over the whole city
    const r = rng(4)
    const n = Math.min(COUNTS.streetLights[cap], lp.length / 4)
    const order = Array.from({ length: lp.length / 4 }, (_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let k = 0; k < n; k++) {
      const o = order[k] * 4
      pos.set([lp[o], lp[o + 1], lp[o + 2]], k * 3)
      seed[k] = lp[o + 3]
    }
    const lg = new BufferGeometry()
    lg.setAttribute('position', new BufferAttribute(pos, 3))
    lg.setAttribute('aSeed', new BufferAttribute(seed, 1))
    const lm = new ShaderMaterial({
      vertexShader: S.streetVertex,
      fragmentShader: S.streetFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uDpr: { value: 1 }, uLights: { value: 0 }, uFogDensity: { value: 0.002 }, uAccent: { value: new Color() } },
    })
    return { mesh, lights: { geometry: lg, material: lm } }
  }, [cap])
  useEffect(
    () => () => {
      mesh.geometry.dispose()
      ;(mesh.material as ShaderMaterial).dispose()
      mesh.dispose()
      lights.geometry.dispose()
      lights.material.dispose()
    },
    [mesh, lights],
  )
  useEffect(() => {
    mesh.count = Math.min(COUNTS.buildings[cap], COUNTS.buildings[tier])
    lights.geometry.setDrawRange(0, Math.min(COUNTS.streetLights[cap], COUNTS.streetLights[tier]))
    useFlow.getState().setStats({ particles: Math.min(COUNTS.streetLights[cap], COUNTS.streetLights[tier]) })
  }, [mesh, lights, cap, tier])
  useFrame((st) => {
    const s = state()
    if (!s) return
    const u = (mesh.material as ShaderMaterial).uniforms
    writeSky(u, s)
    u.uRise.value = s.fx.rise
    setLin(u.uLand.value, s.colors.secondary.lin)
    setLin(u.uAccent.value, s.colors.accent.lin)
    u.uLights.value = s.fx.lights
    u.uFogDensity.value = s.fx.fogDensity
    u.uHaze.value = s.fx.haze
    const l = lights.material.uniforms
    l.uDpr.value = st.viewport.dpr
    l.uLights.value = s.fx.lights
    l.uFogDensity.value = s.fx.fogDensity
    setLin(l.uAccent.value, s.colors.accent.lin)
  }, -1)
  return (
    <>
      <primitive object={mesh} />
      <points geometry={lights.geometry} material={lights.material} frustumCulled={false} renderOrder={3} />
    </>
  )
}

function Clouds() {
  const layers = useMemo(
    () =>
      WORLD.cloudLayers.map((h, i) => {
        const geometry = new PlaneGeometry(2600, 2600, 1, 1)
        geometry.rotateX(-Math.PI / 2)
        const material = new ShaderMaterial({
          vertexShader: S.cloudVertex,
          fragmentShader: S.cloudFragment,
          transparent: true,
          depthWrite: false,
          side: DoubleSide,
          uniforms: {
            ...skyUniforms(),
            uCover: { value: 0.5 },
            uTime: { value: 0 },
            uLayer: { value: i + 1 },
            uHeight: { value: h },
            uLights: { value: 0 },
            uAccent: { value: new Color() },
            uFogDensity: { value: 0.002 },
          },
        })
        return { geometry, material, h }
      }),
    [],
  )
  useEffect(
    () => () =>
      layers.forEach((l) => {
        l.geometry.dispose()
        l.material.dispose()
      }),
    [layers],
  )
  const meshes = useRef<(Mesh | null)[]>([])
  useFrame((st) => {
    const s = state()
    if (!s) return
    // transparent parallel layers: draw the farther layer first (above or below the camera)
    const camY = st.camera.position.y
    layers.forEach((l, i) => {
      const m = meshes.current[i]
      if (m) m.renderOrder = 20 - Math.abs(camY - l.h) * 0.01
    })
    for (const l of layers) {
      const u = l.material.uniforms
      writeSky(u, s)
      u.uCover.value = s.fx.clouds
      u.uTime.value = st.clock.elapsedTime
      u.uLights.value = s.fx.lights
      u.uFogDensity.value = s.fx.fogDensity
      setLin(u.uAccent.value, s.colors.accent.lin)
    }
  }, -1)
  return (
    <>
      {layers.map((l, i) => (
        <mesh
          key={i}
          ref={(m) => void (meshes.current[i] = m)}
          geometry={l.geometry}
          material={l.material}
          position={[0, l.h, WORLD.terrain.centerZ]}
          renderOrder={10 + i}
          frustumCulled={false}
        />
      ))}
    </>
  )
}

export default function Experience() {
  const cap = useFlow((s) => s.tierCap)
  useEffect(() => {
    useFlow.getState().setLoad(0.85)
  }, [])
  return (
    <Stage camera={{ fov: 52, near: 0.5, far: 6000 }}>
      <CameraRig parallax={1.2} rollGain={0.15} fovGain={2.5} />
      <Sky />
      <Terrain cap={cap} />
      <City cap={cap} />
      <Clouds />
      <Effects bloomThreshold={0.6} />
    </Stage>
  )
}
