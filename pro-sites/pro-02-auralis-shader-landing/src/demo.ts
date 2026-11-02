import { makeTrack, master, metrics, drawWave } from './wave';

/** Interactive A/B waveform demo (lazy-loaded when the section approaches the viewport). */
export function initDemo() {
  const canvas = document.querySelector<HTMLCanvasElement>('#demo-canvas');
  if (!canvas) return;
  const target = document.querySelector<HTMLInputElement>('#target')!;
  const warmth = document.querySelector<HTMLInputElement>('#warmth')!;
  const oT = document.querySelector('#o-target')!, oW = document.querySelector('#o-warmth')!;
  const rL = document.querySelector('#r-loud')!, rP = document.querySelector('#r-peak')!, rC = document.querySelector('#r-crest')!;
  const css = getComputedStyle(document.documentElement);
  const muted = css.getPropertyValue('--neutral-400').trim() || '#8a8b96';
  const grid = css.getPropertyValue('--brand-800').trim() || '#2b2467';
  const src = makeTrack(7);
  let mode = 'b';
  let queued = false;

  const fmt = (n: number) => (n < 0 ? '−' : '') + Math.abs(n).toFixed(1);
  const render = () => {
    queued = false;
    const t = +target.value, w = +warmth.value;
    const out = master(src, { target: t, warmth: w, amount: 1 });
    const shown = mode === 'a' ? src : out;
    const m = metrics(shown);
    oT.textContent = `${fmt(t)} LUFS`;
    oW.textContent = `${w}%`;
    rL.textContent = `${fmt(m.loud)} LUFS*`;
    rP.textContent = `${fmt(m.peakDb)} dB`;
    rC.textContent = `${m.crest.toFixed(1)} dB`;
    drawWave(canvas, { before: src, after: out, showBefore: mode === 'a' ? true : mode === 'b' ? false : undefined, ceilingLine: mode !== 'a', muted, grid });
  };
  const schedule = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(render);
    }
  };
  target.addEventListener('input', schedule);
  warmth.addEventListener('input', schedule);
  document.querySelectorAll<HTMLInputElement>('input[name="ab"]').forEach((r) =>
    r.addEventListener('change', () => {
      mode = r.value;
      schedule();
    }),
  );
  new ResizeObserver(schedule).observe(canvas);
  render();
}
