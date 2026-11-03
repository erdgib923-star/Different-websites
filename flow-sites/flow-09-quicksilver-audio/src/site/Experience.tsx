// Hydrargyr Audio: the ray march renders into a half-float target at a tier-dependent scale,
// then a fullscreen quad blits it into the main frame (so post FX and tone mapping still apply).
// The ray camera is the engine camera (after CameraRig: path + parallax + roll).

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import {
  Camera,
  Color,
  HalfFloatType,
  LinearFilter,
  Matrix3,
  Mesh,
  type PerspectiveCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector4,
  WebGLRenderTarget,
} from 'three'
import type { Vec3 } from '../engine/curve'
import { getEngine } from '../engine/runtime'
import { useFlow } from '../engine/store'
import { CameraRig } from '../engine/three/CameraRig'
import { Effects } from '../engine/three/Effects'
import { Stage } from '../engine/three/Stage'
import { MARCH, type MetalFx } from './chapters'
import * as S from './shaders/metal'

const setLin = (c: Color, v: Vec3) => c.setRGB(v[0], v[1], v[2])

function Metal() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const tier = useFlow((s) => s.tier)
  const res = useMemo(() => {
    const target = new WebGLRenderTarget(4, 4, { type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false })
    const march = new ShaderMaterial({
      vertexShader: S.passVertex,
      fragmentShader: S.marchFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uCamPos: { value: camera.position.clone() },
        uCamRot: { value: new Matrix3() },
        uTanFov: { value: 0.35 },
        uAspect: { value: 1 },
        uTime: { value: 0 },
        uW: { value: new Vector4(1, 0, 0, 0) },
        uRipple: { value: 1 },
        uWarmth: { value: 0.3 },
        uStudio: { value: 1 },
        uCool: { value: new Color() },
        uWarm: { value: new Color() },
        uBg: { value: new Color() },
        uFog: { value: new Color() },
        uSteps: { value: 96 },
        uAO: { value: 1 },
      },
    })
    const scene = new Scene()
    const quad = new Mesh(new PlaneGeometry(2, 2), march)
    quad.frustumCulled = false
    scene.add(quad)
    const blit = new ShaderMaterial({ vertexShader: S.passVertex, fragmentShader: S.blitFragment, depthTest: false, depthWrite: false, uniforms: { uTex: { value: target.texture } } })
    const blitGeo = new PlaneGeometry(2, 2)
    return { target, march, scene, quad, blit, blitGeo, cam: new Camera(), size: new Vector2() }
  }, [camera])
  useEffect(
    () => () => {
      res.target.dispose()
      res.march.dispose()
      res.quad.geometry.dispose()
      res.blit.dispose()
      res.blitGeo.dispose()
    },
    [res],
  )
  useEffect(() => {
    useFlow.getState().setLoad(0.85)
  }, [])

  useFrame((st) => {
    const s = getEngine<MetalFx>()?.state
    if (!s) return
    const spec = MARCH[tier]
    gl.getDrawingBufferSize(res.size)
    const w = Math.max(2, Math.round(res.size.x * spec.scale))
    const h = Math.max(2, Math.round(res.size.y * spec.scale))
    if (res.target.width !== w || res.target.height !== h) {
      res.target.setSize(w, h)
      useFlow.getState().setStats({ particles: w * h })
    }
    const u = res.march.uniforms
    camera.updateMatrixWorld()
    u.uCamPos.value.copy(camera.position)
    u.uCamRot.value.setFromMatrix4(camera.matrixWorld)
    u.uTanFov.value = Math.tan(((camera.fov * Math.PI) / 180) * 0.5)
    u.uAspect.value = res.size.x / res.size.y
    u.uTime.value = st.clock.elapsedTime
    u.uW.value.set(s.fx.wPool, s.fx.wHead, s.fx.wWatch, s.fx.wSphere)
    u.uRipple.value = s.fx.ripple
    u.uWarmth.value = s.fx.warmth
    u.uStudio.value = s.fx.studio
    setLin(u.uCool.value, s.colors.primary.lin)
    setLin(u.uWarm.value, s.colors.secondary.lin)
    setLin(u.uBg.value, s.colors.bg.lin)
    setLin(u.uFog.value, s.colors.fog.lin)
    u.uSteps.value = spec.steps
    u.uAO.value = spec.ao
    const prev = gl.getRenderTarget()
    gl.setRenderTarget(res.target)
    gl.render(res.scene, res.cam)
    gl.setRenderTarget(prev)
  }, -1)

  return <mesh geometry={res.blitGeo} material={res.blit} frustumCulled={false} />
}

export default function Experience() {
  return (
    <Stage camera={{ fov: 38, near: 0.1, far: 100 }}>
      <CameraRig parallax={0.18} rollGain={0.08} fovGain={1.5} />
      <Metal />
      <Effects bloomThreshold={0.8} />
    </Stage>
  )
}
