import { type FormEvent, useState } from 'react'
import { FlowApp } from './engine/FlowApp'
import { flow } from './site/chapters'

const loadScene = () => import('./site/Experience')

/** Static crystal motifs for poster mode. */
function PosterArt({ index }: { index: number }) {
  const prism = (x: number, y: number, w: number, h: number, a: number, k: number) => (
    <g key={k} transform={`rotate(${a} ${x} ${y})`}>
      <path d={`M${x - w} ${y} L${x - w} ${y - h} L${x} ${y - h - w * 1.3} L${x + w} ${y - h} L${x + w} ${y} Z`} style={{ fill: 'var(--pb)', opacity: 0.35 }} />
      <path d={`M${x} ${y} L${x} ${y - h - w * 1.3}`} style={{ stroke: 'var(--pc)', strokeWidth: 1, opacity: 0.6 }} />
    </g>
  )
  const clusters = [
    [
      [300, 250, 14, 70, -12],
      [330, 260, 10, 50, 18],
    ],
    [
      [260, 270, 10, 60, -25],
      [300, 280, 12, 90, 5],
      [345, 275, 9, 55, 28],
    ],
    [
      [240, 290, 16, 110, -18],
      [300, 295, 20, 150, 2],
      [360, 290, 14, 100, 22],
      [200, 295, 10, 60, -35],
    ],
    [
      [300, 260, 24, 130, 0],
      [250, 270, 14, 80, -30],
      [350, 268, 16, 90, 30],
    ],
  ][index] as number[][]
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      {index === 3 && <circle cx="300" cy="190" r="110" style={{ fill: 'var(--pc)', opacity: 0.12 }} />}
      {clusters.map(([x, y, w, h, a], k) => prism(x, y, w, h, a, k))}
    </svg>
  )
}

function VisitForm() {
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
        <label htmlFor="f-msg">Anything you want identified? (optional)</label>
        <textarea id="f-msg" name="message" rows={2} />
      </div>
      <button type="submit" className="cta">
        Save me a place
      </button>
      <p id="form-note" className="form-note" role="status">
        {sent ? 'Thanks. This is a demo form, so nothing was sent anywhere.' : 'Demo form: nothing is sent. Placeholder address: show@example.com.'}
      </p>
    </form>
  )
}

export default function App() {
  return (
    <FlowApp
      flow={flow}
      brand={{ name: 'Druse', tagline: 'mineral & gemstone collective' }}
      loadScene={loadScene}
      posterArt={(i) => <PosterArt index={i} />}
      extra={(i) => (i === flow.chapters.length - 1 ? <VisitForm /> : null)}
      footer={<p>Druse is a members&apos; collective. Specimens shown at our open shows are catalogued with their origin.</p>}
    />
  )
}
