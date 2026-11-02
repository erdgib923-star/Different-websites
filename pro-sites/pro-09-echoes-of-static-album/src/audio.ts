/**
 * Live-generated music for a fictional band. Everything is synthesised with Web Audio oscillators
 * and a noise buffer: no samples, no recordings, no third-party music. Chord progressions are
 * generic and each track's patterns are original to this demo.
 * Scheduling uses the "look-ahead" pattern: a timer queues notes slightly ahead on the audio clock.
 */
export type Track = {
  title: string;
  bpm: number;
  root: number; // MIDI note of the key
  mode: number[]; // scale intervals
  prog: number[]; // scale degrees (0-based) per bar
  kick: string; // 16-step patterns: x = hit, . = rest
  snare: string;
  hat: string;
  arp: number[]; // chord-tone indices per 16th, -1 = rest
  bass: string;
  pad: OscillatorType;
  lead: OscillatorType;
  cutoff: number;
};

const AEOLIAN = [0, 2, 3, 5, 7, 8, 10];
const IONIAN = [0, 2, 4, 5, 7, 9, 11];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const LYDIAN = [0, 2, 4, 6, 7, 9, 11];

export const TRACKS: Track[] = [
  { title: 'Carrier Wave', bpm: 92, root: 50, mode: AEOLIAN, prog: [0, 5, 2, 6], kick: 'x.....x...x.....', snare: '....x.......x...', hat: '..x...x...x...x.', arp: [0, -1, 2, 1, -1, 2, 0, -1, 1, -1, 2, -1, 0, 1, -1, 2], bass: 'x.....x.x.......', pad: 'sawtooth', lead: 'square', cutoff: 1100 },
  { title: 'Dial Tone Bloom', bpm: 104, root: 53, mode: LYDIAN, prog: [0, 4, 5, 3], kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', arp: [0, 1, 2, 1, 0, 1, 2, 3, 0, 1, 2, 1, 0, 2, 1, 3], bass: 'x...x...x...x.x.', pad: 'triangle', lead: 'triangle', cutoff: 1800 },
  { title: 'Night Bus Static', bpm: 84, root: 45, mode: AEOLIAN, prog: [0, 3, 0, 4], kick: 'x.........x.....', snare: '........x.......', hat: 'xxx.xxx.xxx.xx.x', arp: [0, -1, -1, 2, -1, -1, 1, -1, 0, -1, -1, 2, -1, 1, -1, -1], bass: 'x.........x..x..', pad: 'sawtooth', lead: 'sawtooth', cutoff: 700 },
  { title: 'Glass Antenna', bpm: 120, root: 52, mode: DORIAN, prog: [0, 3, 0, 6], kick: 'x...x...x...x...', snare: '....x..x....x...', hat: '.x.x.x.x.x.x.x.x', arp: [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 2, 3, 2], bass: 'x.x...x.x.x...x.', pad: 'sine', lead: 'sine', cutoff: 2600 },
  { title: 'Undertow FM', bpm: 76, root: 48, mode: AEOLIAN, prog: [0, 6, 5, 6], kick: 'x.......x.......', snare: '................', hat: '................', arp: [0, -1, -1, -1, 2, -1, -1, -1, 1, -1, -1, -1, 2, -1, 3, -1], bass: 'x.......x.......', pad: 'sawtooth', lead: 'triangle', cutoff: 600 },
  { title: 'Last Broadcast', bpm: 98, root: 55, mode: IONIAN, prog: [3, 0, 4, 5], kick: 'x.....x...x...x.', snare: '....x.......x..x', hat: '..x...x...x...xx', arp: [2, 1, 0, 1, 2, -1, 3, -1, 2, 1, 0, 1, 2, 3, 4, -1], bass: 'x.....x...x.x...', pad: 'triangle', lead: 'square', cutoff: 1500 },
];

const freq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class Engine {
  ctx: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  private master!: GainNode;
  private bus!: GainNode;
  private delaySend!: GainNode;
  private noise!: AudioBuffer;
  private timer = 0;
  private step = 0;
  private next = 0;
  track = 0;
  playing = false;
  muted = false;
  volume = 0.7;
  onChange: () => void = () => {};

  /** Must be called from a user gesture (click): browsers block audio until then. */
  async ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) throw new Error('Web Audio is not supported in this browser.');
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.86; // smooth → the visualizer never flickers
    this.bus = ctx.createGain();
    this.bus.gain.value = 0.9;
    // a simple feedback delay for space on pads and arps
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.32;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const wet = ctx.createBiquadFilter();
    wet.type = 'lowpass';
    wet.frequency.value = 2400;
    this.delaySend = ctx.createGain();
    this.delaySend.gain.value = 0.28;
    this.delaySend.connect(delay).connect(wet).connect(fb).connect(delay);
    wet.connect(this.bus);
    this.bus.connect(comp).connect(this.master).connect(this.analyser).connect(ctx.destination);
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  async play(track = this.track) {
    await this.ensure();
    const ctx = this.ctx!;
    await ctx.resume();
    this.track = track;
    if (!this.playing) {
      this.playing = true;
      this.step = 0;
      this.next = ctx.currentTime + 0.08;
      this.tick();
    }
    this.fadeTo(this.muted ? 0 : this.volume, 0.6);
    this.onChange();
  }

  pause() {
    if (!this.ctx || !this.playing) return;
    this.fadeTo(0, 0.3);
    window.clearTimeout(this.timer);
    this.playing = false;
    this.onChange();
  }

  /** crossfade to another track while playing */
  switchTo(i: number) {
    if (i === this.track) return;
    if (!this.playing || !this.ctx) {
      this.track = i;
      this.onChange();
      return;
    }
    this.fadeTo(0, 0.35);
    window.setTimeout(() => {
      this.track = i;
      this.step = 0;
      this.next = this.ctx!.currentTime + 0.05;
      this.fadeTo(this.muted ? 0 : this.volume, 0.6);
      this.onChange();
    }, 380);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.playing) this.fadeTo(m ? 0 : this.volume, 0.15);
    this.onChange();
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.playing && !this.muted) this.fadeTo(v, 0.1);
  }

  private fadeTo(v: number, secs: number) {
    if (!this.ctx) return;
    const g = this.master.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(v, t + secs);
  }

  private tick = () => {
    const ctx = this.ctx!;
    while (this.next < ctx.currentTime + 0.12) {
      this.playStep(this.step, this.next);
      this.next += 60 / TRACKS[this.track].bpm / 4;
      this.step = (this.step + 1) % 64;
    }
    this.timer = window.setTimeout(this.tick, 25);
  };

  private playStep(step: number, t: number) {
    const tr = TRACKS[this.track];
    const s = step % 16, bar = Math.floor(step / 16) % tr.prog.length;
    const deg = tr.prog[bar];
    const note = (d: number, oct = 0) => tr.root + tr.mode[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);
    const chord = [note(deg), note(deg + 2), note(deg + 4), note(deg + 7), note(deg + 9)];
    if (tr.kick[s] === 'x') this.kick(t);
    if (tr.snare[s] === 'x') this.snare(t);
    if (tr.hat[s] === 'x') this.hat(t, s % 8 === 6);
    if (tr.bass[s] === 'x') this.bass(t, freq(note(deg, -1)), tr);
    const a = tr.arp[s];
    if (a >= 0) this.pluck(t, freq(chord[a] + 12), tr);
    if (s === 0) this.pad(t, chord.slice(0, 3).map(freq), (60 / tr.bpm) * 4, tr);
  }

  private env(g: GainNode, t: number, peak: number, a: number, d: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  private kick(t: number) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.14);
    this.env(g, t, 0.9, 0.004, 0.42);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 0.5);
  }

  private noiseHit(t: number, type: BiquadFilterType, f: number, peak: number, dur: number) {
    const ctx = this.ctx!, src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = this.noise;
    fl.type = type;
    fl.frequency.value = f;
    this.env(g, t, peak, 0.002, dur);
    src.connect(fl).connect(g).connect(this.bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  private snare(t: number) {
    this.noiseHit(t, 'bandpass', 1900, 0.32, 0.18);
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = 185;
    this.env(g, t, 0.16, 0.002, 0.1);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 0.15);
  }

  private hat(t: number, open: boolean) {
    this.noiseHit(t, 'highpass', 7500, open ? 0.08 : 0.05, open ? 0.22 : 0.05);
  }

  private bass(t: number, f: number, tr: Track) {
    const ctx = this.ctx!, o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    fl.type = 'lowpass';
    fl.frequency.value = 420;
    this.env(g, t, 0.42, 0.01, (60 / tr.bpm) * 0.9);
    o.connect(fl).connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 1.2);
  }

  private pluck(t: number, f: number, tr: Track) {
    const ctx = this.ctx!, o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = tr.lead;
    o.frequency.value = f;
    fl.type = 'lowpass';
    fl.frequency.setValueAtTime(tr.cutoff * 2.2, t);
    fl.frequency.exponentialRampToValueAtTime(tr.cutoff * 0.5, t + 0.25);
    this.env(g, t, tr.lead === 'square' || tr.lead === 'sawtooth' ? 0.06 : 0.11, 0.005, 0.3);
    o.connect(fl).connect(g);
    g.connect(this.bus);
    g.connect(this.delaySend);
    o.start(t);
    o.stop(t + 0.4);
  }

  private pad(t: number, freqs: number[], dur: number, tr: Track) {
    const ctx = this.ctx!, fl = ctx.createBiquadFilter(), g = ctx.createGain();
    fl.type = 'lowpass';
    fl.frequency.value = tr.cutoff * 0.8;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(tr.pad === 'sawtooth' ? 0.045 : 0.08, t + dur * 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.05);
    fl.connect(g);
    g.connect(this.bus);
    g.connect(this.delaySend);
    freqs.forEach((f) =>
      [-7, 7].forEach((cents) => {
        const o = ctx.createOscillator();
        o.type = tr.pad;
        o.frequency.value = f;
        o.detune.value = cents;
        o.connect(fl);
        o.start(t);
        o.stop(t + dur * 1.1);
      }),
    );
  }
}
