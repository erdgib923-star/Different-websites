// Eager shell shared by every site: HTML hero + chapter sections (real DOM text), chapter rail,
// Calm mode toggle, preloader, poster mode and the ?debug panel. The 3D chunk is lazy-loaded.

import { Component, type ComponentType, type CSSProperties, type MouseEvent, type ReactNode, Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { css8 } from './color'
import { attachDom } from './dom'
import { detectCapabilities } from './quality'
import { createEngine, getEngine, prefersReduced } from './runtime'
import { type PosterReason, type Tier, useFlow } from './store'
import type { BaseFx, Flow } from './timeline'

export interface FlowAppProps<FX extends BaseFx> {
  flow: Flow<FX>
  brand: { name: string; tagline: string }
  loadScene: () => Promise<{ default: ComponentType }>
  posterArt?: (index: number) => ReactNode
  extra?: (index: number) => ReactNode
  footer?: ReactNode
}

const CALM_KEY = 'flow-calm'
const readCalm = () => {
  try {
    return localStorage.getItem(CALM_KEY)
  } catch {
    return null
  }
}
const writeCalm = (v: boolean) => {
  try {
    localStorage.setItem(CALM_KEY, v ? '1' : '0')
  } catch {
    /* storage unavailable: preference lasts for this page only */
  }
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('[flow] 3D scene failed, switching to poster mode:', error)
    useFlow.getState().setMode('poster', 'error')
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

const REASON_TEXT: Record<Exclude<PosterReason, null>, string> = {
  'no-webgl2': 'Your browser has no WebGL2, so you are seeing the poster version.',
  'reduced-motion': 'Your system asks for reduced motion, so the scroll animation is off. You can turn it on with Calm mode.',
  calm: 'Calm mode is on: chapters are shown as still posters.',
  'context-lost': 'The graphics context was lost, so the page switched to the poster version.',
  error: 'The 3D scene could not start, so you are seeing the poster version.',
}

export function FlowApp<FX extends BaseFx>({ flow, brand, loadScene, posterArt, extra, footer }: FlowAppProps<FX>) {
  const mode = useFlow((s) => s.mode)
  const reason = useFlow((s) => s.posterReason)
  const ready = useFlow((s) => s.ready)
  const loadProgress = useFlow((s) => s.loadProgress)
  const active = useFlow((s) => s.activeChapter)
  const debug = useFlow((s) => s.debug)
  const container = useRef<HTMLElement>(null)
  const panels = useRef<(HTMLElement | null)[]>([])
  const railFill = useRef<HTMLDivElement>(null)
  const [webgl2, setWebgl2] = useState(true)
  const chapters = flow.chapters

  const Scene = useMemo(
    () =>
      lazy(() =>
        loadScene().then((m) => {
          useFlow.getState().setLoad(0.6)
          return m
        }),
      ),
    [loadScene],
  )

  // Poster colours: each chapter's palette at its centre, computed once from the same sceneState.
  const posters = useMemo(() => {
    const s = flow.create()
    return chapters.map((c) => {
      flow.sample((c.start + c.end) / 2, s)
      return {
        '--pa': css8(s.colors.bg.srgb8),
        '--pb': css8(s.colors.primary.srgb8),
        '--pc': css8(s.colors.accent.srgb8),
        '--pd': css8(s.colors.fog.srgb8),
      } as CSSProperties
    })
  }, [flow, chapters])

  // ---- boot: capabilities, tier, mode ----------------------------------------------------------
  useLayoutEffect(() => {
    const caps = detectCapabilities()
    setWebgl2(caps.webgl2)
    const params = new URLSearchParams(location.search)
    const st = useFlow.getState()
    useFlow.setState({ tierCap: caps.tier, tier: caps.tier, debug: params.has('debug') })
    if (params.get('tier')) st.setOverride(caps.tier)
    const calm = readCalm()
    if (!caps.webgl2) st.setMode('poster', 'no-webgl2')
    else if (calm === '1') st.setMode('poster', 'calm')
    else if (calm !== '0' && prefersReduced()) st.setMode('poster', 'reduced-motion')
    else st.setMode('scene')
    st.setLoad(0.15)
    document.documentElement.dataset.renderer = caps.renderer
    document.documentElement.dataset.tierReason = caps.reason
    // Read-only probe for the automated smoke test (scripts/smoke.mjs).
    ;(window as unknown as { __flowProbe: () => object }).__flowProbe = () => {
      const f = useFlow.getState()
      return { progress: f.motion.progress, raw: f.motion.raw, mode: f.mode, ready: f.ready, tier: f.tier, fps: f.motion.fps, chapter: f.activeChapter }
    }
  }, [])

  // ---- engine + DOM choreography -------------------------------------------------------------
  useLayoutEffect(() => {
    if (!container.current) return
    const engine = createEngine(flow, container.current)
    const detach = attachDom(engine, { panels: panels.current, railFill: railFill.current })
    return () => {
      detach()
      engine.destroy()
    }
  }, [flow])

  // ---- mode changes: toggle Lenis, keep the reader on the same chapter ------------------------
  const prevMode = useRef(mode)
  useLayoutEffect(() => {
    const engine = getEngine<FX>()
    if (!engine) return
    const html = document.documentElement
    html.classList.toggle('is-poster', mode === 'poster')
    html.classList.toggle('is-scene', mode === 'scene')
    engine.setSmooth(mode === 'scene')
    if (prevMode.current !== mode && prevMode.current !== 'loading') {
      const chapter = useFlow.getState().activeChapter
      requestAnimationFrame(() => {
        engine.refresh()
        if (mode === 'scene') engine.scrollToProgress(chapters[chapter].start + (chapters[chapter].end - chapters[chapter].start) * 0.25, true)
        else document.getElementById(chapters[chapter].id)?.scrollIntoView({ block: 'start' })
      })
    } else {
      engine.refresh()
    }
    prevMode.current = mode
  }, [mode, chapters])

  useEffect(() => {
    const onResize = () => getEngine()?.refresh()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const calmOn = mode === 'poster'
  const calmLocked = reason === 'no-webgl2' || reason === 'context-lost' || reason === 'error'
  const toggleCalm = () => {
    const st = useFlow.getState()
    if (calmLocked) return
    if (mode === 'scene') {
      writeCalm(true)
      st.setMode('poster', 'calm')
    } else {
      writeCalm(false)
      st.setReady(false)
      st.setMode('scene')
    }
  }

  const goChapter = (i: number) => (e: MouseEvent) => {
    e.preventDefault()
    getEngine()?.scrollToChapter(i)
    const heading = document.getElementById(`h-${chapters[i].id}`)
    heading?.focus({ preventScroll: true })
  }

  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        Skip to content
      </a>
      <div
        className="preloader"
        data-done={ready || mode === 'poster' ? 'true' : 'false'}
        role="progressbar"
        aria-label="Loading the 3D scene"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(loadProgress * 100)}
        aria-hidden={ready || mode === 'poster'}
      >
        <span style={{ transform: `scaleX(${loadProgress})` }} />
      </div>
      <div className="backdrop" aria-hidden="true" />
      <div className={`stage${ready ? ' is-ready' : ''}`} aria-hidden="true">
        {mode === 'scene' && webgl2 && (
          <SceneBoundary>
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </SceneBoundary>
        )}
      </div>

      <header className="masthead">
        <a className="wordmark" href={`#${chapters[0].id}`} onClick={goChapter(0)}>
          {brand.name}
          <span className="wordmark__tag">{brand.tagline}</span>
        </a>
        <button
          type="button"
          className="calm-toggle"
          aria-pressed={calmOn}
          disabled={calmLocked}
          onClick={toggleCalm}
          title={calmLocked ? 'The animated scene is unavailable on this device' : 'Show still posters instead of the scroll animation'}
        >
          <span className="calm-toggle__dot" aria-hidden="true" />
          Calm mode {calmOn ? 'on' : 'off'}
        </button>
      </header>

      <nav className="rail" aria-label="Chapters">
        <div className="rail__track" aria-hidden="true">
          <div className="rail__fill" ref={railFill} />
        </div>
        <ol>
          {chapters.map((c, i) => (
            <li key={c.id}>
              <a href={`#${c.id}`} aria-current={active === i ? 'step' : undefined} onClick={goChapter(i)}>
                <span className="rail__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="rail__label">{c.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <main id="main" tabIndex={-1} className="flow" ref={container}>
        {chapters.map((c, i) => {
          const H = i === 0 ? 'h1' : 'h2'
          return (
            <section
              key={c.id}
              id={c.id}
              className="chapter"
              aria-labelledby={`h-${c.id}`}
              style={{ ...posters[i], '--span': String(c.end - c.start) } as CSSProperties}
            >
              <div className="chapter__poster" aria-hidden="true">
                {posterArt?.(i)}
              </div>
              <div className="panel" ref={(el) => void (panels.current[i] = el)}>
                <p className="eyebrow">{c.copy.eyebrow}</p>
                <H id={`h-${c.id}`} tabIndex={-1}>
                  {c.copy.heading}
                </H>
                {c.copy.body.map((t) => (
                  <p key={t.slice(0, 24)}>{t}</p>
                ))}
                {extra?.(i)}
              </div>
            </section>
          )
        })}
      </main>
      <footer className="site-footer">
        {footer}
        <p>{brand.name} is a fictional brand. All copy, people and data on this page are invented for a design demo.</p>
      </footer>
      <p className="mode-note" role="status" aria-live="polite">
        {mode === 'poster' && reason ? REASON_TEXT[reason] : ''}
      </p>
      {debug && <DebugPanel chapters={chapters.map((c) => c.title)} />}
    </>
  )
}

function DebugPanel({ chapters }: { chapters: string[] }) {
  const [, force] = useState(0)
  const tier = useFlow((s) => s.tier)
  const override = useFlow((s) => s.tierOverride)
  const stats = useFlow((s) => s.stats)
  const mode = useFlow((s) => s.mode)
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 250)
    return () => clearInterval(id)
  }, [])
  const m = useFlow.getState().motion
  const engine = getEngine()
  const dom = engine?.state.dominant ?? 0
  return (
    <aside className="debug" aria-label="Debug panel">
      <label>
        progress {m.progress.toFixed(3)}
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={m.progress}
          onChange={(e) => getEngine()?.scrollToProgress(Number(e.target.value), true)}
        />
      </label>
      <div>chapter: {chapters[dom]}</div>
      <div>fps: {m.fps.toFixed(0)} · speed {m.speed.toFixed(2)}</div>
      <div>
        mode: {mode} · tier: {tier} ({document.documentElement.dataset.tierReason})
      </div>
      <label>
        tier override{' '}
        <select value={override ?? 'auto'} onChange={(e) => useFlow.getState().setOverride(e.target.value === 'auto' ? null : (e.target.value as Tier))}>
          <option value="auto">auto</option>
          <option value="high">high</option>
          <option value="mid">mid</option>
          <option value="low">low</option>
        </select>
      </label>
      <div>
        calls {stats.calls} · tris {stats.triangles} · points {stats.points}
      </div>
      <div>
        particles {stats.particles} · dpr {stats.dpr.toFixed(2)}
      </div>
      <div className="debug__renderer">{document.documentElement.dataset.renderer}</div>
    </aside>
  )
}
