import { gsap, prefersReduced } from './lib/motion';

const money = (n: number) => `$${n.toFixed(n % 1 ? 2 : 0)}`;
const money2 = (n: number) => `$${n.toFixed(2)}`;
const SVGNS = 'http://www.w3.org/2000/svg';

function readyAround(weeks: number) {
  if (weeks <= 0) return 'Ready now!';
  const d = new Date(Date.now() + weeks * 7 * 864e5);
  const part = d.getDate() <= 10 ? 'early' : d.getDate() <= 20 ? 'mid' : 'late';
  return `${part} ${d.toLocaleDateString('en-US', { month: 'long' })}`;
}

/** Coin-jar simulator: weeks to goal from allowance, share and optional grown-up match. */
export function initSim() {
  const form = document.querySelector<HTMLFormElement>('[data-sim]');
  if (!form) return;
  const fill = document.querySelector<SVGRectElement>('[data-jar-fill]')!;
  const coins = document.querySelector<SVGGElement>('[data-coins]')!;
  const label = document.querySelector<HTMLElement>('[data-jar-label]')!;
  const r = (k: string) => document.querySelector<HTMLElement>(`[data-r="${k}"]`)!;
  const announce = document.querySelector<HTMLElement>('[data-announce]')!;
  const dropBtn = document.querySelector<HTMLButtonElement>('[data-drop]')!;
  const resetBtn = document.querySelector<HTMLButtonElement>('[data-reset]')!;
  let saved = 0;
  let timer = 0;

  const state = () => {
    const goalInput = form.querySelector<HTMLInputElement>('input[name="goal"]:checked')!;
    const allowance = Number((form.elements.namedItem('allowance') as HTMLInputElement).value);
    const share = Number((form.elements.namedItem('share') as HTMLInputElement).value);
    const match = (form.elements.namedItem('match') as HTMLInputElement).checked;
    const own = (allowance * share) / 100;
    const weekly = own + (match ? own * 0.25 : 0);
    return { goal: Number(goalInput.value), name: goalInput.dataset.name!, allowance, share, match, own, weekly };
  };

  const render = (speak = true) => {
    const s = state();
    (document.querySelector('[data-out="allowance"]') as HTMLOutputElement).value = money(s.allowance);
    (document.querySelector('[data-out="share"]') as HTMLOutputElement).value = `${s.share}%`;
    const remaining = Math.max(0, s.goal - saved);
    const weeks = Math.ceil(remaining / s.weekly);
    r('weekly').textContent = money2(s.weekly);
    r('weeks').textContent = String(weeks);
    r('weeks').previousElementSibling!.textContent = `Weeks to the ${s.name}`;
    r('date').textContent = readyAround(weeks);
    const pct = Math.min(1, saved / s.goal);
    fill.style.transform = `scaleY(${0.02 + pct * 0.98})`;
    label.textContent = pct >= 1 ? `Full! ${money(s.goal)} ${s.name} jar ready` : `${money2(saved)} of ${money(s.goal)}`;
    dropBtn.disabled = pct >= 1;
    if (speak) {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        announce.textContent = pct >= 1
          ? `The ${s.name} jar is full. Ask a grown-up to approve.`
          : `${money2(s.weekly)} a week. ${weeks} week${weeks === 1 ? '' : 's'} to the ${s.name}, ready ${readyAround(weeks)}.`;
      }, 600);
    }
  };

  const addCoin = (index: number, total: number) => {
    const s = state();
    const pct = Math.min(1, saved / s.goal);
    const c = document.createElementNS(SVGNS, 'ellipse');
    c.setAttribute('class', 'c');
    const x = 60 + Math.random() * 80;
    const restY = 222 - pct * 150 + Math.random() * 10;
    c.setAttribute('cx', String(x));
    c.setAttribute('cy', String(restY));
    c.setAttribute('rx', '11');
    c.setAttribute('ry', '5');
    coins.appendChild(c);
    while (coins.childElementCount > 36) coins.firstElementChild?.remove();
    if (prefersReduced()) return;
    gsap.fromTo(c, { attr: { cy: -10 }, rotation: -30 + Math.random() * 60, svgOrigin: `${x} ${restY}` }, {
      attr: { cy: restY }, rotation: 0, duration: 0.7, delay: index * 0.09, ease: 'bounce.out',
      onStart: () => { if (index === total - 1) render(true); },
    });
  };

  form.addEventListener('input', () => render(true));
  form.addEventListener('submit', (e) => e.preventDefault());
  dropBtn.addEventListener('click', () => {
    const s = state();
    saved = Math.min(s.goal, saved + s.weekly);
    const n = Math.max(2, Math.min(6, Math.round(s.weekly)));
    for (let i = 0; i < n; i++) addCoin(i, n);
    render(true);
  });
  resetBtn.addEventListener('click', () => { saved = 0; coins.replaceChildren(); render(true); });
  render(false);
}
