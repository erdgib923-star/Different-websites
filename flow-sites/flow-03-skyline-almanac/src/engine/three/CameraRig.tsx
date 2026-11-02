// Camera follows sceneState's arc-length curves. On top: damped pointer parallax, and a slight
// velocity-driven roll and FOV breathing. Both are capped and damped, so nothing ever snaps.

import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { type PerspectiveCamera, Vector3 } from 'three'
import { damp } from '../math'
import { getEngine } from '../runtime'
import { useFlow } from '../store'

const MAX_ROLL = 0.05 // rad (~2.9 deg)
const look = new Vector3()
const right = new Vector3()
const up = new Vector3()
const fwd = new Vector3()
const WORLD_UP = new Vector3(0, 1, 0)

export function CameraRig({ parallax = 0.35, rollGain = 0.12, fovGain = 3 }: { parallax?: number; rollGain?: number; fovGain?: number }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const roll = useRef(0)
  const lastFov = useRef(0)
  useFrame((_, dtRaw) => {
    const engine = getEngine()
    if (!engine) return
    const dt = Math.min(dtRaw, 0.1)
    const s = engine.state
    const m = useFlow.getState().motion
    look.set(s.camLook[0], s.camLook[1], s.camLook[2])
    camera.position.set(s.camPos[0], s.camPos[1], s.camPos[2])
    // parallax in camera space
    fwd.subVectors(look, camera.position).normalize()
    right.crossVectors(fwd, WORLD_UP).normalize()
    up.crossVectors(right, fwd)
    camera.position.addScaledVector(right, m.pointerX * parallax).addScaledVector(up, m.pointerY * parallax * 0.6)
    camera.lookAt(look)
    const targetRoll = Math.max(-MAX_ROLL, Math.min(MAX_ROLL, -m.velocity * rollGain))
    roll.current = damp(roll.current, targetRoll, 3, dt)
    camera.rotateZ(roll.current)
    const fov = s.fx.fov + m.speed * fovGain
    if (Math.abs(fov - lastFov.current) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
      lastFov.current = fov
    }
  }, -2)
  return null
}
