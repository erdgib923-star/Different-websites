// Post-processing: subtle bloom, vignette, grain and chromatic aberration scaled by (capped,
// low-passed) scroll speed. Strengths come from sceneState fx, so they flow with the chapters.
// Nothing here can flash: every value is a damped continuous function, CA offset is tiny.
// Low tier: no composer at all (renderer tone-maps directly). Mid tier: no CA, no grain.

import { useFrame } from '@react-three/fiber'
import { Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, type BloomEffect, type ChromaticAberrationEffect, type NoiseEffect, ToneMappingMode, type VignetteEffect } from 'postprocessing'
import { useMemo, useRef } from 'react'
import { Vector2 } from 'three'
import { TIER_SPECS } from '../quality'
import { getEngine } from '../runtime'
import { useFlow } from '../store'

const MAX_CA = 0.0022

export function Effects({ bloomThreshold = 0.22 }: { bloomThreshold?: number }) {
  const tier = useFlow((s) => s.tier)
  const spec = TIER_SPECS[tier]
  const bloom = useRef<BloomEffect>(null)
  const ca = useRef<ChromaticAberrationEffect>(null)
  const noise = useRef<NoiseEffect>(null)
  const vig = useRef<VignetteEffect>(null)
  const caOffset = useMemo(() => new Vector2(0, 0), [])

  useFrame(() => {
    const engine = getEngine()
    if (!engine) return
    const fx = engine.state.fx
    const m = useFlow.getState().motion
    if (bloom.current) bloom.current.intensity = fx.bloom
    if (vig.current) vig.current.darkness = fx.vignette
    if (noise.current) noise.current.blendMode.opacity.value = fx.grain
    if (ca.current) {
      const amt = Math.min(MAX_CA, fx.chroma * 0.0006 + m.speed * 0.0016 * fx.chroma)
      ca.current.offset.set(amt, amt * 0.6)
    }
  }, -1)

  if (spec.postfx === 'off') return null
  const full = spec.postfx === 'full'
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={bloomThreshold} luminanceSmoothing={0.3} intensity={0.8} radius={0.75} />
      {full ? <ChromaticAberration ref={ca} offset={caOffset} radialModulation={false} modulationOffset={0} /> : <></>}
      {/* tone-map BEFORE vignette and grain: grain on HDR values turns into coloured speckles */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette ref={vig} offset={0.3} darkness={0.5} eskil={false} />
      {full ? <Noise ref={noise} premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.3} /> : <></>}
    </EffectComposer>
  )
}
