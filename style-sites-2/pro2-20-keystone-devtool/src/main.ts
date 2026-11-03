import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import '@fontsource/instrument-sans/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, prefersReduced } from './lib/motion';
import { initPalette, type Command } from './palette';

const root = document.documentElement;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
document.querySelectorAll('[data-kbd]').forEach((k) => (k.textContent = isMac ? '⌘ K' : 'Ctrl K'));

/* ---------- Theme: dark (default) / light / system, remembered per viewer ---------- */
type ThemeChoice = 'dark' | 'light' | 'system';
const sysLight = matchMedia('(prefers-color-scheme: light)');
const store = {
  get: (): ThemeChoice | null => { try { return localStorage.getItem('springline-theme') as ThemeChoice | null; } catch { return null; } },
  set: (v: ThemeChoice) => { try { localStorage.setItem('springline-theme', v); } catch { /* private mode: not remembered */ } },
};
let choice: ThemeChoice = store.get() ?? 'dark';
const toggle = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
function applyTheme(c: ThemeChoice, announce = false) {
  choice = c;
  const resolved = c === 'system' ? (sysLight.matches ? 'light' : 'dark') : c;
  root.dataset.theme = resolved;
  toggle?.setAttribute('aria-label', resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  store.set(c);
  if (announce) status(`Theme: ${c === 'system' ? `system (${resolved})` : c}`);
}
sysLight.addEventListener('change', () => { if (choice === 'system') applyTheme('system'); });
toggle?.addEventListener('click', () => applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light', true));
applyTheme(choice);

/* A polite live region for confirmations (copy, theme). */
const live = Object.assign(document.createElement('p'), { className: 'sr-only' });
live.setAttribute('role', 'status');
document.body.append(live);
function status(msg: string) { live.textContent = ''; requestAnimationFrame(() => (live.textContent = msg)); }

/* ---------- Copy install command ---------- */
async function copyInstall(btn?: HTMLButtonElement | null) {
  const text = 'npx springline plan';
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = false; }
  status(ok ? 'Copied: npx springline plan' : 'Copy failed. Select the command and copy it manually.');
  if (btn) { btn.textContent = ok ? 'Copied' : 'Copy failed'; setTimeout(() => (btn.textContent = 'Copy'), 1600); }
}
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((b) => b.addEventListener('click', () => copyInstall(b)));

/* ---------- Command palette ---------- */
const go = (sel: string) => () => {
  const el = document.querySelector<HTMLElement>(sel);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
  const h = el.querySelector<HTMLElement>('h1, h2') ?? el;
  h.setAttribute('tabindex', '-1');
  h.focus({ preventScroll: true });
};
const commands: Command[] = [
  { id: 'go-top', group: 'Go to', label: 'Home', keywords: 'hero top start', run: go('#top') },
  { id: 'go-diff', group: 'Go to', label: 'How it works', keywords: 'diff plan code', run: go('#diff') },
  { id: 'go-log', group: 'Go to', label: 'Changelog', keywords: 'releases versions news', run: go('#changelog') },
  { id: 'go-price', group: 'Go to', label: 'Pricing', keywords: 'plans cost seats', run: go('#pricing') },
  { id: 'th-dark', group: 'Theme', label: 'Dark theme', keywords: 'theme mode night', hint: 'default', run: () => applyTheme('dark', true) },
  { id: 'th-light', group: 'Theme', label: 'Light theme', keywords: 'theme mode day', run: () => applyTheme('light', true) },
  { id: 'th-sys', group: 'Theme', label: 'Match system theme', keywords: 'theme mode auto os', run: () => applyTheme('system', true) },
  { id: 'copy', group: 'Actions', label: 'Copy install command', keywords: 'npx install cli', hint: 'npx springline plan', run: () => copyInstall(document.querySelector('[data-copy]')) },
];
initPalette(commands);

/* ---------- Diff: pinned on wide screens; lines apply one by one; the plan summary pops ---------- */
function initDiff() {
  const sec = document.querySelector<HTMLElement>('[data-diff]');
  if (!sec) return;
  const lines = [...sec.querySelectorAll<HTMLElement>('[data-ln]')];
  const chips = [...sec.querySelectorAll<HTMLElement>('[data-at]')];
  const steps = [...sec.querySelectorAll<HTMLElement>('[data-step]')];
  gsap.matchMedia().add({ wide: '(min-width: 960px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { wide, motion } = ctx.conditions as { wide: boolean; motion: boolean };
    if (!motion) return;
    sec.classList.add('is-driven');
    // Context lines are present from the start; changed lines land in order across 10%–80%.
    const changed = lines.filter((l) => !l.classList.contains('ctx'));
    const apply = (p: number) => {
      changed.forEach((l, i) => l.classList.toggle('is-on', p >= 0.1 + (i / changed.length) * 0.7));
      chips.forEach((c) => c.classList.toggle('is-on', p >= parseFloat(c.dataset.at!)));
      steps.forEach((s) => s.classList.toggle('is-on', p >= parseFloat(s.dataset.step!)));
    };
    apply(0);
    gsap.timeline({
      scrollTrigger: {
        ...(wide ? { trigger: sec.querySelector('.diff__inner'), start: 'top top+=80', end: '+=170%', pin: true } : { trigger: sec.querySelector('[data-code]'), start: 'top 80%', end: 'bottom 30%' }),
        scrub: 0.4,
        onUpdate: (st) => apply(st.progress),
      },
    });
    return () => { sec.classList.remove('is-driven'); };
  });
}

/* ---------- Changelog line draws with scroll (CSS scroll timeline; GSAP fallback in the kit) ---------- */
function initTimeline() {
  const tl = document.querySelector<HTMLElement>('[data-timeline]');
  if (!tl || prefersReduced() || CSS.supports('animation-timeline: view()')) return;
  gsap.fromTo(tl, { '--line': 0 }, { '--line': 1, ease: 'none', scrollTrigger: { trigger: tl, start: 'top 75%', end: 'bottom 60%', scrub: true } });
}

/* ---------- Pricing: monthly / yearly ---------- */
function initPricing() {
  const prices = [...document.querySelectorAll<HTMLElement>('[data-price]')];
  document.querySelectorAll<HTMLInputElement>('input[name="billing"]').forEach((r) =>
    r.addEventListener('change', () => {
      const yearly = r.value === 'yearly' && r.checked;
      prices.forEach((p) => {
        p.textContent = `$${yearly ? p.dataset.y : p.dataset.m}`;
        p.classList.remove('is-swap'); void p.offsetWidth; p.classList.add('is-swap');
      });
    }),
  );
}

initDiff();
initTimeline();
initPricing();
bootMotion({ lenis: !prefersReduced() });
