import gsap from 'gsap'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { FlowApp } from './engine/FlowApp'
import { MonotoneTrack } from './engine/math'
import { getEngine } from './engine/runtime'
import { flow } from './site/chapters'

const loadScene = () => import('./site/Experience')

/** Progress -> local clock time (minutes), illustrative only. */
const CLOCK = new MonotoneTrack([0, 0.25, 0.5, 0.75, 1], [5 * 60 + 40, 12 * 60 + 30, 19 * 60 + 10, 21 * 60 + 40, 23 * 60 + 50])

/** Decorative time-of-day clock, updated from the ticker (no React renders per frame). */
function DayClock() {
  const value = useRef<HTMLSpanElement>(null)
  const hand = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let last = -1
    const tick = () => {
      const s = getEngine()?.state
      if (!s || !value.current || !hand.current) return
      const m = Math.round(CLOCK.at(s.progress) / 5) * 5
      if (m === last) return
      last = m
      value.current.textContent = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
      hand.current.style.transform = `rotate(${(m / 720) * 360}deg)`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
  return (
    <div className="gauge" aria-hidden="true">
      <span className="clock">
        <span className="clock__hand" ref={hand} />
      </span>
      <span className="gauge__label">local time</span>
      <span className="gauge__value" ref={value}>
        05:40
      </span>
    </div>
  )
}

function PosterArt({ index }: { index: number }) {
  const ridge = (y: number, amp: number, k: number) =>
    `M0 300 L0 ${y} ` + Array.from({ length: 21 }, (_, i) => `L${i * 20} ${y - Math.abs(Math.sin(i * k) * amp) - (i % 3) * 6}`).join(' ') + ' L400 300 Z'
  if (index === 0)
    return (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <circle cx="300" cy="190" r="26" style={{ fill: 'var(--pb)', opacity: 0.6 }} />
        <path d={ridge(230, 60, 1.3)} style={{ fill: 'var(--pd)', opacity: 0.55 }} />
        <path d={ridge(260, 40, 0.9)} style={{ fill: 'var(--pa)', opacity: 0.8 }} />
      </svg>
    )
  if (index === 1)
    return (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        {[90, 130, 170].map((y, i) => (
          <ellipse key={i} cx={120 + i * 110} cy={y} rx={110} ry={18} style={{ fill: 'var(--pb)', opacity: 0.25 }} />
        ))}
        <path d={ridge(270, 25, 0.6)} style={{ fill: 'var(--pa)', opacity: 0.7 }} />
      </svg>
    )
  const towers = Array.from({ length: 24 }, (_, i) => {
    const h = 30 + Math.abs(Math.sin(i * 1.7)) * 110 * Math.exp(-(((i - 12) / 7) ** 2))
    return <rect key={i} x={20 + i * 15} y={280 - h} width={12} height={h} style={{ fill: 'var(--pa)', opacity: 0.85 }} />
  })
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      {towers}
      {index === 3 &&
        Array.from({ length: 70 }, (_, i) => (
          <rect key={`w${i}`} x={22 + ((i * 37) % 350)} y={170 + ((i * 53) % 100)} width={2.5} height={3} style={{ fill: 'var(--pc)' }} />
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
        Subscribe to the Almanac
      </button>
      <p id="form-note" className="form-note" role="status">
        {sent ? 'Thanks. This is a demo form, so nothing was sent anywhere.' : 'Demo form: nothing is sent. Placeholder address: desk@example.com.'}
      </p>
    </form>
  )
}

export default function App() {
  return (
    <FlowApp
      flow={flow}
      brand={{ name: 'Skyline Almanac', tagline: 'city & weather' }}
      loadScene={loadScene}
      posterArt={(i) => <PosterArt index={i} />}
      extra={(i) => (i === flow.chapters.length - 1 ? <SubscribeForm /> : null)}
      overlay={<DayClock />}
      footer={<p>Skyline Almanac is a monthly edition about one city and one day of its weather.</p>}
    />
  )
}
