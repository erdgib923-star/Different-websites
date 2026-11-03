// Generative music for Resonance Hall, made live with Web Audio (no samples, no recordings).
// An original, algorithmic piece in A: a drone, a pulsing sub bass, a slowly filtered pad and
// sparse pentatonic chimes over high filtered noise. Each voice's level follows the chapter mix.
// The AudioContext is created only after the visitor presses "Play sound".

export interface Mix {
  drone: number
  bass: number
  mid: number
  treble: number
}

const PENTA = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77]

class SoundEngine {
  ctx: AudioContext | null = null
  private master: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private voices: Record<keyof Mix, GainNode> | null = null
  private chimeBus: GainNode | null = null
  private timer: number | null = null
  private nextChime = 0
  private mix: Mix = { drone: 0.5, bass: 0, mid: 0, treble: 0 }
  playing = false
  volume = 0.6
  muted = false
  readonly bins = new Uint8Array(256)
  private listeners = new Set<() => void>()

  subscribe(fn: () => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  private emit() {
    this.listeners.forEach((f) => f())
  }

  async start() {
    if (!this.ctx) this.build()
    await this.ctx!.resume()
    this.playing = true
    this.applyVolume()
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), 120)
    this.emit()
  }

  async stop() {
    if (!this.ctx) return
    this.playing = false
    this.master!.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15)
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
    window.setTimeout(() => {
      if (!this.playing) void this.ctx?.suspend()
    }, 600)
    this.emit()
  }

  setVolume(v: number) {
    this.volume = v
    this.applyVolume()
    this.emit()
  }
  setMuted(m: boolean) {
    this.muted = m
    this.applyVolume()
    this.emit()
  }
  private applyVolume() {
    if (!this.ctx || !this.master) return
    const target = this.playing && !this.muted ? this.volume * this.volume : 0
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12)
  }

  setMix(m: Mix) {
    this.mix = m
    if (!this.ctx || !this.voices) return
    const t = this.ctx.currentTime
    this.voices.drone.gain.setTargetAtTime(m.drone * 0.22, t, 0.6)
    this.voices.bass.gain.setTargetAtTime(m.bass * 0.3, t, 0.6)
    this.voices.mid.gain.setTargetAtTime(m.mid * 0.06, t, 0.6)
    this.voices.treble.gain.setTargetAtTime(m.treble * 0.025, t, 0.6)
    this.chimeBus!.gain.setTargetAtTime(m.treble * 0.5 + m.mid * 0.15, t, 0.6)
  }

  /** Copy the analyser's (smoothed) spectrum into `bins`; returns false when silent. */
  readSpectrum() {
    if (!this.analyser || !this.playing) return false
    this.analyser.getByteFrequencyData(this.bins)
    return true
  }

  private build() {
    const ctx = new AudioContext()
    this.ctx = ctx
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 3
    const master = ctx.createGain()
    master.gain.value = 0
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.86
    comp.connect(master)
    master.connect(analyser)
    analyser.connect(ctx.destination)
    this.master = master
    this.analyser = analyser

    const bus = (g = 0) => {
      const n = ctx.createGain()
      n.gain.value = g
      n.connect(comp)
      return n
    }
    const drone = bus()
    const bass = bus()
    const mid = bus()
    const treble = bus()
    this.voices = { drone, bass, mid, treble }

    // drone: A1 + E2, softly detuned, through a low-pass
    const dlp = ctx.createBiquadFilter()
    dlp.type = 'lowpass'
    dlp.frequency.value = 380
    dlp.connect(drone)
    for (const [f, type, det] of [
      [55, 'sine', 0],
      [82.41, 'triangle', 4],
      [110, 'sine', -5],
    ] as const) {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = f
      o.detune.value = det
      o.connect(dlp)
      o.start()
    }
    // sub bass: E1 with a slow breathing amplitude (0.12 Hz)
    const sub = ctx.createOscillator()
    sub.frequency.value = 41.2
    const subGain = ctx.createGain()
    subGain.gain.value = 0.7
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.12
    const lfoAmt = ctx.createGain()
    lfoAmt.gain.value = 0.3
    lfo.connect(lfoAmt)
    lfoAmt.connect(subGain.gain)
    sub.connect(subGain)
    subGain.connect(bass)
    sub.start()
    lfo.start()
    // pad: A2, E3, C#4 saws through a slowly sweeping band-pass
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 700
    bp.Q.value = 0.9
    const sweep = ctx.createOscillator()
    sweep.frequency.value = 0.05
    const sweepAmt = ctx.createGain()
    sweepAmt.gain.value = 380
    sweep.connect(sweepAmt)
    sweepAmt.connect(bp.frequency)
    sweep.start()
    bp.connect(mid)
    for (const f of [110, 164.81, 277.18, 329.63]) {
      for (const det of [-7, 7]) {
        const o = ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = f
        o.detune.value = det
        o.connect(bp)
        o.start()
      }
    }
    // treble air: filtered noise
    const len = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    let seed = 12345
    for (let i = 0; i < len; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      data[i] = (seed / 4294967296) * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    noise.loop = true
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 6500
    noise.connect(hp)
    hp.connect(treble)
    noise.start()
    // chimes: through a feedback delay for space
    const chimeBus = ctx.createGain()
    chimeBus.gain.value = 0
    const delay = ctx.createDelay(1)
    delay.delayTime.value = 0.33
    const fb = ctx.createGain()
    fb.gain.value = 0.38
    chimeBus.connect(comp)
    chimeBus.connect(delay)
    delay.connect(fb)
    fb.connect(delay)
    delay.connect(comp)
    this.chimeBus = chimeBus
    this.nextChime = ctx.currentTime + 0.5
    this.setMix(this.mix)
  }

  /** Look-ahead scheduler for the chimes (runs every 120 ms while playing). */
  private schedule() {
    const ctx = this.ctx
    if (!ctx || !this.chimeBus) return
    const density = this.mix.treble * 0.8 + this.mix.mid * 0.25
    while (this.nextChime < ctx.currentTime + 0.3) {
      if (density > 0.05) {
        const t = this.nextChime
        const f = PENTA[Math.floor(Math.random() * PENTA.length)] * (Math.random() < 0.3 ? 0.5 : 1)
        for (const [mult, amp] of [
          [1, 0.22],
          [2.76, 0.05],
        ]) {
          const o = ctx.createOscillator()
          o.type = 'sine'
          o.frequency.value = f * mult
          const g = ctx.createGain()
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(amp, t + 0.006)
          g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
          o.connect(g)
          g.connect(this.chimeBus)
          o.start(t)
          o.stop(t + 2.3)
        }
      }
      this.nextChime += 0.45 + Math.random() * (1.4 - density)
    }
  }
}

export const sound = new SoundEngine()
// read-only handle for the automated audio check (scripts/check-audio.mjs)
;(globalThis as unknown as { __sound: SoundEngine }).__sound = sound
