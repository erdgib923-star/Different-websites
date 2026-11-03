import { type FormEvent, useState } from 'react'
import { FlowApp } from './engine/FlowApp'
import { flow } from './site/chapters'

const loadScene = () => import('./site/Experience')

/** Static silk-ribbon curves for poster mode. */
function PosterArt({ index }: { index: number }) {
  const amp = [10, 40, 60, 30][index]
  const twist = [0.3, 1.4, 0.8, 0.5][index]
  const ribbons = Array.from({ length: 5 }, (_, i) => {
    const top = Array.from({ length: 61 }, (_, k) => {
      const x = 150 + k * 4.2
      const y = 150 + Math.sin(k * 0.11 + i * 0.9) * amp + (i - 2) * 22
      return `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    const bottom = Array.from({ length: 61 }, (_, j) => {
      const k = 60 - j
      const x = 150 + k * 4.2
      const w = 6 + Math.abs(Math.sin(k * 0.08 * twist + i)) * (index === 3 ? 22 : 12)
      const y = 150 + Math.sin(k * 0.11 + i * 0.9) * amp + (i - 2) * 22 + w
      return `L${x.toFixed(1)} ${y.toFixed(1)}`
    })
    return <path key={i} d={`${top.join(' ')} ${bottom.join(' ')} Z`} style={{ fill: i % 2 ? 'var(--pb)' : 'var(--pc)', opacity: index === 3 ? 0.35 : 0.55 }} />
  })
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      {ribbons}
    </svg>
  )
}

function WaitlistForm() {
  const [sent, setSent] = useState(false)
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
  }
  return (
    <form className="contact" onSubmit={onSubmit} aria-describedby="form-note">
      <div className="field">
        <label htmlFor="f-name">Name</label>
        <input id="f-name" name="name" autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="f-email">Email</label>
        <input id="f-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </div>
      <button type="submit" className="cta">
        Join the list
      </button>
      <p id="form-note" className="form-note" role="status">
        {sent ? 'Thanks. This is a demo form, so nothing was sent anywhere.' : 'Demo form: nothing is sent. Placeholder address: atelier@example.com.'}
      </p>
    </form>
  )
}

export default function App() {
  return (
    <FlowApp
      flow={flow}
      brand={{ name: 'Silken Weather', tagline: 'garments in silk & wool' }}
      loadScene={loadScene}
      posterArt={(i) => <PosterArt index={i} />}
      extra={(i) => (i === flow.chapters.length - 1 ? <WaitlistForm /> : null)}
      footer={<p>Silken Weather makes small runs of garments, finished by hand.</p>}
    />
  )
}
