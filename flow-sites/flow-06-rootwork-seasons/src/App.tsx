import { type FormEvent, useState } from 'react'
import { FlowApp } from './engine/FlowApp'
import { flow } from './site/chapters'

const loadScene = () => import('./site/Experience')

/** Simple recursive SVG tree for poster mode; depth grows with the chapter. */
function branches(x: number, y: number, a: number, len: number, d: number, out: string[]) {
  if (d === 0) return
  const x2 = x + Math.sin(a) * len
  const y2 = y - Math.cos(a) * len
  out.push(`M${x.toFixed(1)} ${y.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`)
  branches(x2, y2, a - 0.45, len * 0.72, d - 1, out)
  branches(x2, y2, a + 0.4, len * 0.7, d - 1, out)
}
function PosterArt({ index }: { index: number }) {
  const depth = [1, 4, 7, 7][index]
  const paths: string[] = []
  branches(300, 280, 0, index === 0 ? 8 : 48, depth, paths)
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <rect x="0" y="278" width="400" height="22" style={{ fill: 'var(--pb)', opacity: 0.25 }} />
      {index === 0 && <ellipse cx="300" cy="278" rx="7" ry="4" style={{ fill: 'var(--pc)' }} />}
      <path d={paths.join(' ')} style={{ stroke: 'var(--pa)', strokeWidth: 3, fill: 'none', strokeLinecap: 'round', opacity: 0.9 }} />
      {index >= 2 &&
        Array.from({ length: 40 }, (_, i) => (
          <circle key={i} cx={240 + ((i * 53) % 120)} cy={index === 3 ? 230 + ((i * 29) % 50) : 90 + ((i * 37) % 110)} r={4} style={{ fill: 'var(--pc)', opacity: 0.7 }} />
        ))}
    </svg>
  )
}

function ReportsForm() {
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
        Send me the planting reports
      </button>
      <p id="form-note" className="form-note" role="status">
        {sent ? 'Thanks. This is a demo form, so nothing was sent anywhere.' : 'Demo form: nothing is sent and no donation is taken. Placeholder address: grow@example.com.'}
      </p>
    </form>
  )
}

export default function App() {
  return (
    <FlowApp
      flow={flow}
      brand={{ name: 'Rootwork', tagline: 'regenerative forestry' }}
      loadScene={loadScene}
      posterArt={(i) => <PosterArt index={i} />}
      extra={(i) => (i === flow.chapters.length - 1 ? <ReportsForm /> : null)}
      footer={<p>Rootwork is a nonprofit that restores mixed native woodland with landowners.</p>}
    />
  )
}
