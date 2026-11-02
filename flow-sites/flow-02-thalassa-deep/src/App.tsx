import gsap from 'gsap'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { FlowApp } from './engine/FlowApp'
import { getEngine } from './engine/runtime'
import { DEPTH_M, flow } from './site/chapters'

const loadScene = () => import('./site/Experience')

/** Decorative depth gauge, updated from the engine ticker (no React renders per frame). */
function DepthGauge() {
  const value = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let last = -1
    const tick = () => {
      const s = getEngine()?.state
      if (!s || !value.current || !bar.current) return
      const m = Math.round(DEPTH_M.at(s.progress) / 10) * 10
      if (m === last) return
      last = m
      value.current.textContent = `${m.toLocaleString('en-GB')} m`
      bar.current.style.transform = `scaleY(${s.progress.toFixed(3)})`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
  return (
    <div className="gauge" aria-hidden="true">
      <span className="gauge__track">
        <span className="gauge__fill" ref={bar} />
      </span>
      <span className="gauge__label">depth</span>
      <span className="gauge__value" ref={value}>
        0 m
      </span>
    </div>
  )
}

function PosterArt({ index }: { index: number }) {
  const line = { stroke: 'var(--pc)', fill: 'none', strokeWidth: 1.2, opacity: 0.5 } as const
  if (index === 0)
    return (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={`M${140 + i * 30} 0 L${100 + i * 42} 300`} style={{ stroke: 'var(--pb)', strokeWidth: 14, opacity: 0.09 }} />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <path key={`w${i}`} d={`M0 ${20 + i * 9} Q 100 ${10 + i * 9} 200 ${20 + i * 9} T 400 ${20 + i * 9}`} style={line} />
        ))}
      </svg>
    )
  if (index === 1 || index === 2)
    return (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        {[
          [280, 110, 26],
          [320, 190, 16],
          [230, 220, 12],
        ].map(([x, y, r], i) => (
          <g key={i} style={{ opacity: index === 1 ? 0.45 : 0.75 }}>
            <path d={`M${x - r} ${y} A ${r} ${r * 0.85} 0 0 1 ${x + r} ${y} Z`} style={{ fill: 'var(--pc)', opacity: 0.3 }} />
            {Array.from({ length: 5 }, (_, k) => (
              <path key={k} d={`M${x - r * 0.7 + k * r * 0.35} ${y} q 4 ${r} -2 ${r * 2.4}`} style={line} />
            ))}
          </g>
        ))}
      </svg>
    )
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <path d="M0 260 Q 80 248 160 258 T 400 252 L400 300 L0 300 Z" style={{ fill: 'var(--pb)', opacity: 0.12 }} />
      {Array.from({ length: 40 }, (_, i) => (
        <circle key={i} cx={(i * 97) % 400} cy={150 + ((i * 53) % 110)} r={1.6 + (i % 3)} style={{ fill: i % 3 ? 'var(--pb)' : 'var(--pc)', opacity: 0.7 }} />
      ))}
    </svg>
  )
}

function SubscribeForm() {
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
        Send me the next descent
      </button>
      <p id="form-note" className="form-note" role="status">
        {sent ? 'Thanks. This is a demo form, so nothing was sent anywhere.' : 'Demo form: nothing is sent. Placeholder address: dive@example.com.'}
      </p>
    </form>
  )
}

export default function App() {
  return (
    <FlowApp
      flow={flow}
      brand={{ name: 'Thalassa Deep', tagline: 'a journal of descents' }}
      loadScene={loadScene}
      posterArt={(i) => <PosterArt index={i} />}
      extra={(i) => (i === flow.chapters.length - 1 ? <SubscribeForm /> : null)}
      overlay={<DepthGauge />}
      footer={<p>Thalassa Deep is published four times a year. Depth zones follow common oceanographic conventions.</p>}
    />
  )
}
