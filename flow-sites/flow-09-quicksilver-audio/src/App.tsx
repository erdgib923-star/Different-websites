import { type FormEvent, useId, useState } from 'react'
import { FlowApp } from './engine/FlowApp'
import { flow } from './site/chapters'

const loadScene = () => import('./site/Experience')

/**
 * Static fallback: chrome silhouettes drawn with SVG gradients (dark-light-dark bands like a
 * studio reflection), tinted by each chapter's palette. Used in poster / Calm mode and without WebGL2.
 */
function PosterArt({ index }: { index: number }) {
  const id = useId().replace(/:/g, '')
  const chrome = `url(#c${id})`
  const shape = [
    <ellipse key="pool" cx="290" cy="215" rx="95" ry="18" fill={chrome} />,
    <g key="head" fill="none" stroke={chrome} strokeLinecap="round">
      <path d="M215 175 C 215 70, 365 70, 365 175" strokeWidth="14" />
      <rect x="192" y="160" width="46" height="78" rx="22" fill={chrome} stroke="none" />
      <rect x="342" y="160" width="46" height="78" rx="22" fill={chrome} stroke="none" />
    </g>,
    <g key="watch">
      <rect x="262" y="40" width="56" height="80" rx="14" fill={chrome} />
      <rect x="262" y="200" width="56" height="80" rx="14" fill={chrome} />
      <circle cx="290" cy="160" r="58" fill={chrome} />
      <circle cx="290" cy="160" r="44" style={{ fill: 'var(--pa)', opacity: 0.85 }} />
      <rect x="346" y="152" width="12" height="16" rx="4" fill={chrome} />
    </g>,
    <g key="sphere">
      <circle cx="290" cy="150" r="80" fill={`url(#r${id})`} />
      <ellipse cx="290" cy="238" rx="70" ry="8" style={{ fill: '#000', opacity: 0.35 }} />
    </g>,
  ][index]
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`c${id}`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" style={{ stopColor: '#f4f6fa' }} />
          <stop offset="0.28" style={{ stopColor: 'var(--pb)' }} />
          <stop offset="0.5" style={{ stopColor: '#2a2e36' }} />
          <stop offset="0.68" style={{ stopColor: 'var(--pc)' }} />
          <stop offset="1" style={{ stopColor: '#15171c' }} />
        </linearGradient>
        <radialGradient id={`r${id}`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" style={{ stopColor: '#ffffff' }} />
          <stop offset="0.22" style={{ stopColor: 'var(--pb)' }} />
          <stop offset="0.55" style={{ stopColor: '#2a2e36' }} />
          <stop offset="0.85" style={{ stopColor: 'var(--pc)' }} />
          <stop offset="1" style={{ stopColor: '#101216' }} />
        </radialGradient>
      </defs>
      {shape}
    </svg>
  )
}

function ListForm() {
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
        Invite me to a listening session
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
      brand={{ name: 'Hydrargyr Audio', tagline: 'listening objects' }}
      loadScene={loadScene}
      posterArt={(i) => <PosterArt index={i} />}
      extra={(i) => (i === flow.chapters.length - 1 ? <ListForm /> : null)}
      footer={<p>Product forms on this page are abstract renders of fictional objects, not photographs.</p>}
    />
  )
}
