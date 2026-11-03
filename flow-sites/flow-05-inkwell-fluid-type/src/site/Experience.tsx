// Inkfold 3D world: a sheet of paper on a desk, with a GPU fluid simulation as its texture.
// Emitters are driven by sceneState fx (+ scroll speed); the pointer pushes ink across the sheet;
// in the last chapter the headline mask attracts the ink so it settles into lettering.

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { BackSide, CanvasTexture, Color, LinearFilter, PlaneGeometry, ShaderMaterial, SphereGeometry, Vector3 } from 'three'
import type { Vec3 } from '../engine/curve'
import { getEngine } from '../engine/runtime'
import { useFlow } from '../engine/store'
import { CameraRig } from '../engine/three/CameraRig'
import { Effects } from '../engine/three/Effects'
import { Stage } from '../engine/three/Stage'
import { HEADLINE, type InkFx, SHEET, SIM } from './chapters'
import { FluidSim, makeHeadlineCanvas } from './fluid'
import * as F from './shaders/fluid'

const setLin = (c: Color, v: Vec3) => c.setRGB(v[0], v[1], v[2])
const state = () => getEngine<InkFx>()?.state
const FONT = '"Fraunces", Georgia, serif'

function Desk() {
  const { geometry, material } = useMemo(() => {
    const geometry = new SphereGeometry(1, 24, 12)
    const material = new ShaderMaterial({ vertexShader: F.deskVertex, fragmentShader: F.deskFragment, side: BackSide, depthWrite: false, depthTest: false, uniforms: { uShade: { value: new Color() } } })
    return { geometry, material }
  }, [])
  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material])
  useFrame(() => {
    const s = state()
    if (s) setLin(material.uniforms.uShade.value, s.colors.fog.lin)
  }, -1)
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={-10} />
}

function Sheet() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const tierCap = useFlow((s) => s.tierCap)
  const tier = useFlow((s) => s.tier)

  const { sim, mask, material, geometry } = useMemo(() => {
    const canvas = makeHeadlineCanvas(HEADLINE, FONT)
    const mask = new CanvasTexture(canvas)
    mask.minFilter = LinearFilter
    mask.magFilter = LinearFilter
    mask.generateMipmaps = false
    const cfg = SIM[tierCap]
    const sim = new FluidSim(cfg.sim, cfg.dye, SHEET.w / SHEET.h, mask)
    const geometry = new PlaneGeometry(SHEET.w, SHEET.h, 1, 1)
    const material = new ShaderMaterial({
      vertexShader: F.paperVertex,
      fragmentShader: F.paperFragment,
      uniforms: {
        uDye: { value: sim.dyeTexture },
        uDyeTexel: { value: sim.dyeTexelSize },
        uPaper: { value: new Color() },
        uShade: { value: new Color() },
        uInk: { value: new Color() },
        uInk2: { value: new Color() },
        uVermilion: { value: new Color() },
      },
    })
    return { sim, mask, material, geometry }
  }, [tierCap])

  // redraw the mask once the display font has loaded (falls back to Georgia if it never does)
  useEffect(() => {
    let alive = true
    document.fonts
      ?.load(`400 200px "Fraunces"`)
      .then(() => {
        if (!alive) return
        const canvas = makeHeadlineCanvas(HEADLINE, FONT)
        mask.image = canvas
        mask.needsUpdate = true
      })
      .catch(() => undefined)
    useFlow.getState().setLoad(0.85)
    return () => {
      alive = false
    }
  }, [mask])
  useEffect(
    () => () => {
      sim.dispose()
      mask.dispose()
      material.dispose()
      geometry.dispose()
    },
    [sim, mask, material, geometry],
  )
  useEffect(() => {
    useFlow.getState().setStats({ particles: sim.simW * sim.simH })
  }, [sim])

  const scratch = useMemo(() => ({ dir: new Vector3(), hit: new Vector3(), lastU: -1, lastV: -1 }), [])
  useFrame((st, dtRaw) => {
    const s = state()
    if (!s) return
    const fx = s.fx
    const m = useFlow.getState().motion
    const t = st.clock.elapsedTime
    const dt = Math.min(Math.max(dtRaw, 1 / 240), 1 / 30)
    const aspect = SHEET.w / SHEET.h
    const scroll = m.speed * (1 - fx.settle)
    // emitter speeds are authored for the high-tier grid (410 cells wide); scale them so ink
    // crosses the sheet at the same uv speed on every tier
    const vs = sim.simW / 410

    // ---- emitters (all scaled by fx from the chapter table) ----------------------------------
    if (fx.drop > 0.01) {
      sim.addSplat({ x: 0.5, y: 0.52, dx: 0, dy: 0, ink: fx.drop * dt * 1.1, ver: 0, radius: 0.0011 })
    }
    if (fx.bloomInk > 0.01 || fx.drop > 0.01) {
      for (let k = 0; k < 4; k++) {
        const a = t * 0.4 + (k * Math.PI) / 2
        const cx = Math.cos(a)
        const cy = Math.sin(a)
        const f = (fx.bloomInk * (120 + scroll * 700) + fx.drop * 18) * vs
        sim.addSplat({ x: 0.5 + (cx * 0.06) / aspect, y: 0.52 + cy * 0.06, dx: cx * f, dy: cy * f, ink: fx.bloomInk * dt * 0.45, ver: k === 1 ? fx.vermilion * dt * 0.8 : 0, radius: 0.0008 })
      }
    }
    // where the camera looks on the sheet (uv): currents start just left of it, so every
    // viewport (wide desktop or a narrow portrait phone) sees the ink arrive
    camera.getWorldDirection(scratch.dir)
    const kc = -camera.position.z / (scratch.dir.z || -1)
    const viewU = Math.min(0.8, Math.max(0.2, (camera.position.x + scratch.dir.x * kc) / SHEET.w + 0.5))
    if (fx.currents > 0.01) {
      for (let k = 0; k < 3; k++) {
        const y = 0.28 + k * 0.22 + 0.07 * Math.sin(t * 0.5 + k * 2.1)
        sim.addSplat({
          x: viewU - 0.13 + k * 0.03,
          y,
          dx: fx.currents * (240 + scroll * 900) * vs,
          dy: Math.sin(t * 0.7 + k) * 90 * fx.currents * vs,
          ink: k === 1 ? 0 : fx.currents * dt * 0.5,
          ver: k === 1 ? fx.vermilion * dt * 0.7 : 0,
          radius: 0.0012,
        })
      }
    }
    if (scroll > 0.02) {
      const a = t * 0.9
      sim.addSplat({
        x: 0.5 + 0.3 * Math.sin(t * 0.37),
        y: 0.5 + 0.25 * Math.sin(t * 0.53),
        dx: Math.cos(a) * scroll * 900 * vs,
        dy: Math.sin(a) * scroll * 900 * vs,
        ink: scroll * dt * 0.6,
        ver: 0,
        radius: 0.0009,
      })
    }
    // ---- pointer: ray against the sheet plane (z = 0) ------------------------------------------
    if (m.pointerActive > 0.05) {
      scratch.dir.set(m.pointerTX, m.pointerTY, 0.5).unproject(camera).sub(camera.position).normalize()
      const k = -camera.position.z / scratch.dir.z
      if (k > 0) {
        scratch.hit.copy(camera.position).addScaledVector(scratch.dir, k)
        const u = scratch.hit.x / SHEET.w + 0.5
        const v = scratch.hit.y / SHEET.h + 0.5
        if (u > 0 && u < 1 && v > 0 && v < 1 && scratch.lastU >= 0) {
          const du = u - scratch.lastU
          const dv = v - scratch.lastV
          if (Math.abs(du) + Math.abs(dv) > 1e-4) {
            sim.addSplat({ x: u, y: v, dx: (du / dt) * sim.simW * 0.6, dy: (dv / dt) * sim.simH * 0.6, ink: fx.pointerInk * 0.04, ver: 0, radius: 0.0006 })
          }
        }
        scratch.lastU = u
        scratch.lastV = v
      }
    }

    sim.step(gl, {
      dt,
      curl: fx.curl,
      velocityDissipation: 0.2 + fx.calm,
      dyeDissipation: 0.16 + fx.settle * 0.6,
      settle: fx.settle,
      iterations: SIM[tier].iterations,
    })

    const u = material.uniforms
    u.uDye.value = sim.dyeTexture
    setLin(u.uPaper.value, s.colors.bg.lin)
    setLin(u.uShade.value, s.colors.fog.lin)
    setLin(u.uInk.value, s.colors.primary.lin)
    setLin(u.uInk2.value, s.colors.secondary.lin)
    setLin(u.uVermilion.value, s.colors.accent.lin)
  }, -1)

  return <mesh geometry={geometry} material={material} />
}

export default function Experience() {
  return (
    <Stage camera={{ fov: 42, near: 0.1, far: 1000 }}>
      <CameraRig parallax={0.25} rollGain={0.06} fovGain={1.5} />
      <Desk />
      <Sheet />
      <Effects bloomThreshold={0.95} />
    </Stage>
  )
}
