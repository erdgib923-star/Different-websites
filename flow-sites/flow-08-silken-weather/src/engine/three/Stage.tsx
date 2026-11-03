// The fixed WebGL canvas. Rendering is driven by the engine's GSAP ticker through R3F's advance()
// (frameloop="never"), so scroll, DOM and 3D share one clock and one sceneState per frame.

import { Canvas, advance, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import { type ReactNode, useEffect, useRef } from 'react'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { getEngine } from '../runtime'
import { TIER_SPECS } from '../quality'
import { useFlow } from '../store'

function Driver() {
  const gl = useThree((s) => s.gl)
  const setDpr = useThree((s) => s.setDpr)
  const tier = useFlow((s) => s.tier)
  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, TIER_SPECS[tier].dpr))
  }, [tier, setDpr])
  useEffect(() => {
    const engine = getEngine()
    if (!engine) return
    let frames = 0
    const off = engine.addHook((time) => {
      advance(time)
      if (++frames === 2) {
        useFlow.getState().setLoad(1)
        useFlow.getState().setReady(true)
      }
    }, 20)
    const canvas = gl.domElement
    const lost = (e: Event) => {
      e.preventDefault()
      useFlow.getState().setMode('poster', 'context-lost')
    }
    canvas.addEventListener('webglcontextlost', lost)
    return () => {
      off()
      canvas.removeEventListener('webglcontextlost', lost)
    }
  }, [gl])
  return null
}

/** Lower the resolution briefly while the user scrolls very fast (motion hides it). */
function SpeedRegress() {
  const regress = useThree((s) => s.performance.regress)
  useFrame(() => {
    if (useFlow.getState().motion.speed > 0.65) regress()
  })
  return null
}

function StatsProbe() {
  const gl = useThree((s) => s.gl)
  const acc = useRef(0)
  useFrame((state, dt) => {
    acc.current += dt
    if (acc.current < 0.5) return
    acc.current = 0
    const info = gl.info.render
    useFlow.getState().setStats({ calls: info.calls, triangles: info.triangles, points: info.points, dpr: state.viewport.dpr })
  })
  return null
}

export function Stage({ children, camera }: { children: ReactNode; camera?: { fov?: number; near?: number; far?: number } }) {
  const debug = useFlow((s) => s.debug)
  const stepTier = useFlow((s) => s.stepTier)
  const tier = useFlow.getState().tier
  return (
    <Canvas
      frameloop="never"
      dpr={Math.min(window.devicePixelRatio || 1, TIER_SPECS[tier].dpr)}
      performance={{ min: 0.55, max: 1, debounce: 350 }}
      camera={{ fov: camera?.fov ?? 50, near: camera?.near ?? 0.1, far: camera?.far ?? 2000, position: [0, 0, 10] }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.outputColorSpace = SRGBColorSpace
      }}
      aria-hidden="true"
      tabIndex={-1}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Driver />
      <SpeedRegress />
      <AdaptiveDpr pixelated={false} />
      <PerformanceMonitor
        flipflops={3}
        bounds={(refresh) => (refresh > 90 ? [50, 85] : [42, 57])}
        onDecline={() => stepTier(-1)}
        onIncline={() => stepTier(1)}
        onFallback={() => useFlow.getState().setTier('low')}
      />
      {debug && <StatsProbe />}
      {children}
    </Canvas>
  )
}
