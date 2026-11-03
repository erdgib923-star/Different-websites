/** "Build a bubble": live SVG preview + a spoken (aria-live) summary. Nothing is submitted. */
import gsap from 'gsap';
import { toySvg, PASTELS, type Face, type Shape } from './art';

const SHAPE_TEXT: Record<Shape, string> = { round: 'round bubble', bear: 'bubble bear', bunny: 'bubble bunny', cloud: 'bubble cloud', tall: 'tall bubble', star: 'bubble star' };
const FACE_TEXT: Record<Face, string> = { smile: 'a smile', sleepy: 'sleepy eyes', wow: 'a surprised face' };

export function initBuilder(reduced: boolean) {
  const form = document.querySelector<HTMLFormElement>('#builder');
  const art = document.querySelector<HTMLElement>('#preview-art');
  const cap = document.querySelector<HTMLElement>('#preview-cap');
  if (!form || !art || !cap) return;
  form.addEventListener('submit', (e) => e.preventDefault());

  let lastLook = '';
  let capTimer = 0;
  const update = (e?: Event) => {
    const d = new FormData(form);
    const color = String(d.get('color')) as (typeof PASTELS)[number]['key'];
    const shape = String(d.get('shape')) as Shape;
    const face = String(d.get('face')) as Face;
    const name = String(d.get('name') ?? '').trim() || 'Your bubble';
    const colorName = PASTELS.find((p) => p.key === color)?.name.toLowerCase() ?? color;
    const look = `${color}|${shape}|${face}`;
    if (look !== lastLook) {
      lastLook = look;
      art.innerHTML = toySvg(shape, `var(--p-${color})`, face); // built only from fixed option values
      if (!reduced && e) {
        gsap.fromTo(art.firstElementChild, { scale: 0.82, rotation: -6 }, { scale: 1, rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)', transformOrigin: '50% 90%' });
      }
    }
    // typing the name updates the caption after a short pause, so screen readers aren't flooded
    const text = `${name}: a ${colorName} ${SHAPE_TEXT[shape]} with ${FACE_TEXT[face]}.`;
    clearTimeout(capTimer);
    const isTyping = e?.target instanceof HTMLInputElement && e.target.type === 'text';
    if (isTyping) capTimer = window.setTimeout(() => (cap.textContent = text), 450);
    else cap.textContent = text;
  };
  form.addEventListener('input', update);
  update();
}
