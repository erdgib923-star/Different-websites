import { gsap, EASE, reduced } from './motion';

/** Monthly / yearly pricing switch: numbers count to the new value, the "Save" badge pops. */
export function initPricing() {
  const sw = document.querySelector<HTMLButtonElement>('#billing');
  if (!sw) return;
  const nums = Array.from(document.querySelectorAll<HTMLElement>('.price__n'));
  const save = document.querySelector<HTMLElement>('#save');
  const note = document.querySelector<HTMLElement>('#billing-note');
  const set = (yearly: boolean) => {
    sw.setAttribute('aria-checked', String(yearly));
    nums.forEach((el) => {
      const to = Number(yearly ? el.dataset.y : el.dataset.m);
      if (reduced()) {
        el.textContent = String(to);
        return;
      }
      const o = { v: Number(el.textContent) };
      gsap.to(o, { v: to, duration: 0.6, ease: EASE.soft, onUpdate: () => (el.textContent = String(Math.round(o.v))) });
    });
    if (save && yearly && !reduced()) gsap.fromTo(save, { scale: 0.6, rotate: -8 }, { scale: 1, rotate: 0, duration: 0.6, ease: EASE.pop });
    if (note) note.textContent = `Prices in USD, ${yearly ? 'per month, billed yearly' : 'billed monthly'}. Sample pricing for a fictional product.`;
  };
  sw.addEventListener('click', () => set(sw.getAttribute('aria-checked') !== 'true'));
  document.querySelector('#bill-m')?.addEventListener('click', () => set(false));
  document.querySelector('#bill-y')?.addEventListener('click', () => set(true));
}
