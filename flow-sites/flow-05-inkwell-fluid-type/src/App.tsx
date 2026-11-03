import { type FormEvent, useState } from 'react'
import { FlowApp } from './engine/FlowApp'
import { HEADLINE, flow } from './site/chapters'

const loadScene = () => import('./site/Experience')

/** Static ink motifs for poster mode. */
function PosterArt({ index }: { index: number }) {
  const ink = { fill: 'var(--pb)' } as const
  if (index === 0)
    return (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <circle cx="300" cy="150" r="26" style={{ ...ink, opacity: 0.85 }} />
        <circle cx="300" cy="150" r="40" style={{ ...ink, opacity: 0.12 }} />
      </svg>
    )
  if (index === 1)
    return (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2
          return <ellipse key={i} cx={300 + Math.cos(a) * 40} cy={150 + Math.sin(a) * 40} rx={34} ry={16} transform={`rotate(${(a * 180) / Math.PI} ${300 + Math.cos(a) * 40} ${150 + Math.sin(a) * 40})`} style={{ ...ink, opacity: 0.16 }} />
        })}
        <circle cx="300" cy="150" r="30" style={{ ...ink, opacity: 0.7 }} />
      </svg>
    )
  if (index === 2)
    return (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        {[90, 150, 210].map((y, i) => (
          <path
            key={y}
            d={`M150 ${y} C 220 ${y - 40}, 280 ${y + 40}, 400 ${y - 10}`}
            style={{ fill: 'none', stroke: i === 1 ? 'var(--pc)' : 'var(--pb)', strokeWidth: 16, strokeLinecap: 'round', opacity: 0.55 }}
          />
        ))}
      </svg>
    )
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <text x="300" y="175" textAnchor="middle" style={{ ...ink, opacity: 0.85, fontFamily: 'Fraunces, Georgia, serif', fontSize: 64 }}>
        {HEADLINE}
      </text>
    </svg>
  )
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
        <label htmlFor="f-msg">What would you like to make?</label>
        <textarea id="f-msg" name="message" rows={3} required />
      </div>
      <button type="submit" className="cta">
        Write to the studio
      </button>
      <p id="form-note" className="form-note" role="status">
        {sent ? 'Thanks. This is a demo form, so nothing was sent anywhere.' : 'Demo form: nothing is sent. Placeholder address: studio@example.com.'}
      </p>
    </form>
  )
}

export default function App() {
  return (
    <FlowApp
      flow={flow}
      brand={{ name: 'Inkfold', tagline: 'type & ink studio' }}
      loadScene={loadScene}
      posterArt={(i) => <PosterArt index={i} />}
      extra={(i) => (i === flow.chapters.length - 1 ? <ContactForm /> : null)}
      footer={<p>Inkfold draws typefaces and mixes inks in small batches.</p>}
    />
  )
}
