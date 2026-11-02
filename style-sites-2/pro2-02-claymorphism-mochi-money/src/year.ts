import { gsap } from './lib/motion';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const GOAL = 120;
/** Sample story: $2 a week, plus $20 birthday money from week 18 (May). */
const savedAt = (week: number) => Math.min(GOAL, 2 * week + (week >= 18 ? 20 : 0));

/**
 * Pinned, scrubbed "year in the jar". The jar fills with scroll, the month ticks over, and
 * milestone badges pop when the saved amount crosses $10, $60 and $120. Without JS or under
 * reduced motion the section shows the finished jar with all three badges.
 */
export function initYear() {
  const sec = document.querySelector<HTMLElement>('.year');
  const pin = sec?.querySelector<HTMLElement>('[data-year]');
  if (!sec || !pin) return;
  const month = sec.querySelector<HTMLElement>('[data-month]')!;
  const amount = sec.querySelector<HTMLElement>('[data-amount]')!;
  const fill = sec.querySelector<HTMLElement>('[data-big-fill]')!;
  const badges = [...sec.querySelectorAll<HTMLElement>('.year-badge')];
  const thresholds = [10, 60, 120];

  // Static final state (no JS fallback is the same thing in CSS: --fill defaults to 1).
  month.textContent = 'December';
  amount.textContent = `$${GOAL}`;

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    sec.classList.add('is-pinned');
    gsap.set(badges, { autoAlpha: 0, scale: 0.3, y: 20 });
    const shown = badges.map(() => false);
    const update = (p: number) => {
      const week = Math.round(p * 52);
      const amt = savedAt(week);
      month.textContent = MONTHS[Math.min(11, Math.floor((week / 52) * 12))];
      amount.textContent = `$${amt}`;
      fill.style.setProperty('--fill', String(0.04 + (amt / GOAL) * 0.96));
      thresholds.forEach((t, i) => {
        const on = amt >= t;
        if (on === shown[i]) return;
        shown[i] = on;
        gsap.to(badges[i], on
          ? { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.45)' }
          : { autoAlpha: 0, scale: 0.3, y: 20, duration: 0.25, ease: 'power2.in' });
      });
    };
    update(0);
    gsap.timeline({
      scrollTrigger: {
        trigger: pin, start: 'top top+=90', end: '+=220%', pin: true, scrub: 0.5,
        onUpdate: (self) => update(self.progress),
      },
    });
    return () => {
      sec.classList.remove('is-pinned');
      fill.style.removeProperty('--fill');
      month.textContent = 'December';
      amount.textContent = `$${GOAL}`;
    };
  });
}
