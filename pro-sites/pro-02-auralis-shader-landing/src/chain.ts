import { gsap, ScrollTrigger, EASE, reduced } from './motion';
import { makeTrack, master, drawWave } from './wave';

/**
 * Pinned, scrubbed signal chain: scroll progress drives how much of the mastering chain
 * is applied; stage rows highlight and stat callouts pop at fixed progress points.
 */
export function initChain() {
  const section = document.querySelector<HTMLElement>('#chain');
  const canvas = document.querySelector<HTMLCanvasElement>('#chain-canvas');
  if (!section || !canvas) return;
  const stages = Array.from(section.querySelectorAll<HTMLElement>('[data-stage]'));
  const callouts = Array.from(section.querySelectorAll<HTMLElement>('[data-callout]'));
  const css = getComputedStyle(document.documentElement);
  const muted = css.getPropertyValue('--neutral-400').trim() || '#8a8b96';
  const grid = css.getPropertyValue('--brand-800').trim() || '#2b2467';
  const src = makeTrack(11);
  let amount = reduced() ? 1 : 0;
  let queued = false;

  const draw = () => {
    queued = false;
    const out = master(src, { target: -10, warmth: 55, amount });
    drawWave(canvas, { before: src, after: out, ceilingLine: amount > 0.85, muted, grid });
  };
  const schedule = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(draw);
    }
  };
  new ResizeObserver(schedule).observe(canvas);

  const setStage = (i: number) => stages.forEach((s, j) => s.classList.toggle('is-active', j === i));

  if (reduced()) {
    setStage(stages.length - 1);
    draw();
    return;
  }

  setStage(0);
  const shown = new Set<number>();
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=260%',
    pin: true,
    scrub: true,
    onUpdate(self) {
      amount = self.progress;
      setStage(Math.min(stages.length - 1, Math.floor(self.progress * stages.length)));
      callouts.forEach((c, i) => {
        const on = self.progress >= (i + 1) / (callouts.length + 1);
        if (on && !shown.has(i)) {
          shown.add(i);
          gsap.fromTo(c, { autoAlpha: 0, y: 16, scale: 0.88 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: EASE.pop, overwrite: true });
        } else if (!on && shown.has(i)) {
          shown.delete(i);
          gsap.to(c, { autoAlpha: 0, y: 10, duration: 0.3, overwrite: true });
        }
      });
      schedule();
    },
  });
  draw();
}
