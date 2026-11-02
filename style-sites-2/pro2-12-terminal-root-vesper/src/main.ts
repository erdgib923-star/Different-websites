import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import './styles/figure.css';
import './styles/site.css';

import { bootMotion, gsap, ScrollTrigger } from './lib/motion';
import { initTerminal } from './terminal';

const html = document.documentElement;
const store = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage off */ } };

const themeBtn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!;
const viewBtn = document.querySelector<HTMLButtonElement>('[data-view-toggle]')!;
function setTheme(t: 'green' | 'amber') {
  if (t === 'amber') html.dataset.theme = 'amber'; else delete html.dataset.theme;
  themeBtn.setAttribute('aria-pressed', String(t === 'amber'));
  themeBtn.textContent = t === 'amber' ? '[ green ]' : '[ amber ]';
  store('vesper-theme', t);
}
function setView(v: 'terminal' | 'plain', focus = false) {
  if (v === 'plain') html.dataset.view = 'plain'; else delete html.dataset.view;
  viewBtn.setAttribute('aria-pressed', String(v === 'plain'));
  viewBtn.textContent = v === 'plain' ? '[ terminal view ]' : '[ plain view ]';
  store('vesper-view', v);
  ScrollTrigger.refresh();
  if (focus) {
    const target = document.getElementById(v === 'plain' ? 'readme-title' : 'cmd')!;
    if (v === 'plain') target.setAttribute('tabindex', '-1');
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
  }
}
setTheme(html.dataset.theme === 'amber' ? 'amber' : 'green');
setView(html.dataset.view === 'plain' ? 'plain' : 'terminal');
themeBtn.addEventListener('click', () => setTheme(html.dataset.theme === 'amber' ? 'green' : 'amber'));
viewBtn.addEventListener('click', () => setView(html.dataset.view === 'plain' ? 'terminal' : 'plain', true));

/**
 * git log --graph: pinned on wide screens. The graph line fills top to bottom and each commit's
 * node lights as the fill passes it; the "open" and "v1.0" tags pop at those points.
 */
function initGitLog() {
  const sec = document.querySelector<HTMLElement>('.gitlog');
  if (!sec) return;
  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 860px)', motion: '(prefers-reduced-motion: no-preference)' }, (c) => {
    const { wide, motion } = c.conditions as { wide: boolean; motion: boolean };
    if (!motion) return;
    sec.classList.add('is-pinned');
    const commits = [...sec.querySelectorAll<HTMLElement>('[data-commit]')];
    const tags = [...sec.querySelectorAll<HTMLElement>('[data-tag]')];
    const fill = sec.querySelector<HTMLElement>('[data-graph-fill]')!;
    gsap.set(fill, { scaleY: 0 });
    gsap.set(tags, { autoAlpha: 0, scale: 0.4 });
    gsap.set(commits, { autoAlpha: 0.35 });
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: wide
        ? { trigger: sec.querySelector('[data-graph]'), start: 'top top+=120', end: '+=160%', pin: sec, pinSpacing: true, scrub: 0.5 }
        : { trigger: sec.querySelector('[data-graph]'), start: 'top 80%', end: 'bottom 40%', scrub: 0.5 },
    });
    tl.to(fill, { scaleY: 1, duration: commits.length }, 0);
    commits.forEach((el, i) => {
      tl.to(el, { autoAlpha: 1, duration: 0.2, onStart: () => el.classList.add('is-lit'), onReverseComplete: () => el.classList.remove('is-lit') }, i);
      const tag = el.querySelector('[data-tag]');
      if (tag) tl.to(tag, { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'back.out(3)' }, i + 0.15);
    });
    return () => { sec.classList.remove('is-pinned'); commits.forEach((el) => el.classList.remove('is-lit')); };
  });
}

initTerminal({ setTheme, plain: () => setView('plain', true) });
initGitLog();
bootMotion({ lenis: true });
