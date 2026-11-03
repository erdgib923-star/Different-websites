import gsap from 'gsap'
import { type FormEvent, useEffect, useState, useSyncExternalStore } from 'react'
import { FlowApp } from './engine/FlowApp'
import { getEngine } from './engine/runtime'
import { sound } from './site/audio'
import { type SoundFx, flow } from './site/chapters'

const loadScene = () => import('./site/Experience')

/**
 * Sound controls. Audio never starts by itself: the AudioContext is created on the first press
 * of "Play sound". Mute and volume are always visible. The site works fully without audio.
 */
function AudioControls() {
  const snap = useSyncExternalStore(
    (cb) => sound.subscribe(cb),
    () => `${sound.playing}|${sound.muted}|${sound.volume}`,
  )
  const [playing, muted, volume] = snap.split('|')
  const isPlaying = playing === 'true'
  const isMuted = muted === 'true'
  const [error, setError] = useState('')

  // feed the chapter mix to the music while it plays (10 times a second is plenty)
  useEffect(() => {
    let acc = 0
    const tick = (_t: number, dtMs: number) => {
      acc += dtMs
      if (acc < 100 || !sound.playing) return
      acc = 0
      const fx = getEngine<SoundFx>()?.state.fx
      if (fx) sound.setMix({ drone: fx.droneLevel, bass: fx.bassLevel, mid: fx.midLevel, treble: fx.trebleLevel })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  const toggle = async () => {
    try {
      if (sound.playing) await sound.stop()
      else {
        const fx = getEngine<SoundFx>()?.state.fx
        if (fx) sound.setMix({ drone: fx.droneLevel, bass: fx.bassLevel, mid: fx.midLevel, treble: fx.trebleLevel })
        await sound.start()
      }
      setError('')
    } catch {
      setError('Sound could not start in this browser.')
    }
  }

  return (
    <aside className="audio" aria-label="Sound controls">
      <button type="button" className="audio__play" aria-pressed={isPlaying} onClick={toggle}>
        <span className="audio__icon" aria-hidden="true">
          {isPlaying ? '❚❚' : '▶'}
        </span>
        {isPlaying ? 'Stop sound' : 'Play sound'}
      </button>
      <button type="button" className="audio__mute" aria-pressed={isMuted} onClick={() => sound.setMuted(!isMuted)}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
      <label className="audio__vol">
        <span>Volume</span>
        <input type="range" min={0} max={1} step={0.01} value={Number(volume)} onChange={(e) => sound.setVolume(Number(e.target.value))} />
      </label>
      <span className="sr-only" role="status" aria-live="polite">
        {error || (isPlaying ? (isMuted ? 'Sound playing, muted' : 'Sound playing') : 'Sound off')}
      </span>
    </aside>
  )
}

function PosterArt({ index }: { index: number }) {
  const freq = [0.5, 1.2, 3, 8][index]
  const amp = [4, 40, 26, 10][index]
  const lines = Array.from({ length: 9 }, (_, i) => {
    const y0 = 120 + i * 18
    const pts = Array.from({ length: 81 }, (_, k) => {
      const x = 180 + k * 3
      const env = Math.sin((k / 80) * Math.PI)
      const y = y0 - Math.abs(Math.sin(k * 0.08 * freq + i * 0.7)) * amp * env * (0.6 + (i % 3) * 0.2)
      return `${k ? 'L' : 'M'}${x} ${y.toFixed(1)}`
    }).join(' ')
    return <path key={i} d={pts} style={{ fill: 'none', stroke: 'var(--pc)', strokeWidth: 1.4, opacity: 0.35 + i * 0.06 }} />
  })
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      {lines}
    </svg>
  )
}

function ListenForm() {
  const [sent, setSent] = useState(false)
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
  }
  return (
    <form className="contact" onSubmit={onSubmit} aria-describedby="form-note">
      <div className="field">
        <label htmlFor="f-name">Name</label>
        <input id="f-name" name="name" autoComplete="name" required />
      </div>
      <div className="field">
        <label htmlFor="f-email">Email</label>
        <input id="f-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </div>
      <button type="submit" className="cta">
        Reserve a Thursday seat
      </button>
      <p id="form-note" className="form-note" role="status">
        {sent ? 'Thanks. This is a demo form, so nothing was sent anywhere.' : 'Demo form: nothing is sent. Placeholder address: listen@example.com.'}
      </p>
    </form>
  )
}

export default function App() {
  return (
    <FlowApp
      flow={flow}
      brand={{ name: 'Resonance Hall', tagline: 'sound art venue' }}
      loadScene={loadScene}
      posterArt={(i) => <PosterArt index={i} />}
      extra={(i) => (i === flow.chapters.length - 1 ? <ListenForm /> : null)}
      overlay={<AudioControls />}
      footer={<p>The music on this page is generated live by your browser with Web Audio oscillators and filters. No recordings are used.</p>}
    />
  )
}
