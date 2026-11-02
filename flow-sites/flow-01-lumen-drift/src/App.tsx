import { type FormEvent, useState } from 'react'
import { FlowApp } from './engine/FlowApp'
import { flow } from './site/chapters'

const loadScene = () => import('./site/Experience')

/** Static SVG motifs for poster mode (one per chapter), coloured by the chapter's palette vars. */
function PosterArt({ index }: { index: number }) {
  const stroke = { stroke: 'var(--pc)', fill: 'none', strokeWidth: 1.2, opacity: 0.55 } as const
  switch (index) {
    case 0:
      return (
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
          <circle cx="300" cy="120" r="70" style={{ fill: 'var(--pb)', opacity: 0.18 }} />
          <circle cx="300" cy="120" r="10" style={{ fill: 'var(--pc)' }} />
        </svg>
      )
    case 1:
      return (
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M-10 ${150 + i * 9} C 100 ${110 + i * 12}, 220 ${210 - i * 6}, 410 ${140 + i * 10}`} style={stroke} />
          ))}
        </svg>
      )
    case 2:
      return (
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 6 }, (_, i) => (
            <path key={i} d={`M0 ${60 + i * 34} L60 ${40 + i * 36} L130 ${80 + i * 30} L200 ${50 + i * 34} L270 ${90 + i * 30} L340 ${55 + i * 33} L400 ${85 + i * 30}`} style={stroke} />
          ))}
        </svg>
      )
    case 3:
      return (
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
          <path
            d={Array.from({ length: 220 }, (_, i) => {
              const a = i * 0.16
              const r = 4 + i * 0.62
              return `${i ? 'L' : 'M'}${(290 + Math.cos(a) * r).toFixed(1)} ${(150 + Math.sin(a) * r * 0.7).toFixed(1)}`
            }).join(' ')}
            style={stroke}
          />
        </svg>
      )
    case 4:
      return (
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 260 }, (_, i) => {
            const a = i * 2.39996
            const r = 6 * Math.sqrt(i)
            return <circle key={i} cx={290 + Math.cos(a) * r} cy={150 + Math.sin(a) * r} r={1.6} style={{ fill: 'var(--pc)', opacity: 0.55 }} />
          })}
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
          <rect x="0" y="176" width="400" height="3" style={{ fill: 'var(--pc)', opacity: 0.8 }} />
          <rect x="0" y="150" width="400" height="56" style={{ fill: 'var(--pb)', opacity: 0.12 }} />
        </svg>
      )
  }
}

function ContactForm() {
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
      <div className="field field--wide">
        <label htmlFor="f-msg">The room, the audience, the date</label>
        <textarea id="f-msg" name="message" rows={3} required />
      </div>
      <button type="submit" className="cta">
        Send a spark
      </button>
      <p id="form-note" className="form-note" role="status">
        {sent ? 'Thanks. This is a demo form, so nothing was sent anywhere.' : 'Demo form: nothing is sent. Placeholder address: hello@example.com.'}
      </p>
    </form>
  )
}

export default function App() {
  return (
    <FlowApp
      flow={flow}
      brand={{ name: 'Lumen Drift', tagline: 'creative technology' }}
      loadScene={loadScene}
      posterArt={(i) => <PosterArt index={i} />}
      extra={(i) => (i === flow.chapters.length - 1 ? <ContactForm /> : null)}
      footer={<p>© Lumen Drift studio. Shaders, sensors and software for light.</p>}
    />
  )
}
