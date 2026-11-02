import '@fontsource-variable/syne/index.css';
import '@fontsource-variable/red-hat-mono/index.css';
import './styles/main.css';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, initReveals, refreshOnLoad, reduced, pop, EASE } from './motion';
import { initMedia } from './media';
import { planets } from './system';
import type { Scene } from './scene';

const html = document.documentElement;
const canvas = document.querySelector<HTMLCanvasElement>('#space')!;
const RM = reduced();

/* ---------- loader ---------- */
const loaderN = document.querySelector('#loader-n')!;
const loaderBar = document.querySelector<HTMLElement>('#loader-bar')!;
const loaderLabel = document.querySelector('#loader-label')!;
const progress = (p: number, label: string) => {
  loaderN.textContent = String(Math.round(p * 100));
  loaderBar.style.transform = `scaleX(${p})`;
  loaderLabel.textContent = label;
};
const done = () => {
  progress(1, 'Ready');
  setTimeout(() => {
    html.classList.add('loaded');
    ScrollTrigger.refresh();
  }, RM ? 0 : 350);
};

/* ---------- smooth scroll ---------- */
let lenis: Lenis | null = null;
if (!RM) {
  lenis = new Lenis({ duration: 1.2, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const goTo = (el: HTMLElement) => {
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6 });
  else el.scrollIntoView();
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
};
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const el = document.querySelector<HTMLElement>(a.getAttribute('href')!);
    if (!el) return;
    e.preventDefault();
    goTo(el);
  }),
);

initReveals();
initMedia();

/* ---------- HUD: chapter-driven, works in every mode ---------- */
const hud = document.querySelector<HTMLElement>('#hud')!;
const ORBIT_R = [14, 22, 31, 44, 56];
const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.worlds a'));
const chapters = Array.from(document.querySelectorAll<HTMLElement>('.chapter'));
let activeHud = -1;
function setHud(i: number) {
  navLinks.forEach((a, k) => a.setAttribute('aria-current', String(k === i)));
  hud.classList.toggle('is-on', i >= 0);
  if (i < 0 || i === activeHud) return;
  activeHud = i;
  const p = planets[i];
  (document.querySelector('#hud-kicker') as HTMLElement).textContent = `World ${p.roman}`;
  (document.querySelector('#hud-name') as HTMLElement).textContent = p.name;
  (document.querySelector('#hud-au') as HTMLElement).textContent = p.au;
  (document.querySelector('#hud-period') as HTMLElement).textContent = p.period;
  (document.querySelector('#hud-temp') as HTMLElement).textContent = p.temp;
  (document.querySelector('#hud-g') as HTMLElement).textContent = p.gravity;
  const dot = document.querySelector('#hud-dot')!;
  dot.setAttribute('cx', String(60 + Math.cos(p.angle) * ORBIT_R[i]));
  dot.setAttribute('cy', String(60 + Math.sin(p.angle) * ORBIT_R[i]));
  if (!RM) pop(hud.querySelectorAll('.hud__name, .hud__grid > div'), { stagger: 0.06, blur: false });
}
chapters.forEach((ch, i) =>
  ScrollTrigger.create({ trigger: ch, start: 'top 55%', end: 'bottom 45%', onToggle: (self) => (self.isActive ? setHud(i) : activeHud === i && setHud(-1)) }),
);

/* ---------- camera progress: chapter centres map to each planet's waypoint ---------- */
const flight = document.querySelector<HTMLElement>('#flight')!;
let stops: [number, number][] = [];
const measure = () => {
  const vh = window.innerHeight;
  stops = [[0, 0]];
  chapters.forEach((ch, i) => stops.push([ch.offsetTop + ch.offsetHeight / 2 - vh / 2, (i + 1) / 6]));
  stops.push([flight.offsetTop + flight.offsetHeight - vh, 1]);
};
const tFromScroll = () => {
  const y = window.scrollY;
  for (let k = 1; k < stops.length; k++) {
    const [y0, t0] = stops[k - 1], [y1, t1] = stops[k];
    if (y <= y1) return t0 + (t1 - t0) * Math.max(0, Math.min(1, (y - y0) / Math.max(1, y1 - y0)));
  }
  return 1;
};

/* ---------- 3D scene (lazy-loaded) or low-power fallback ---------- */
let scene: Scene | null = null;
let visible = true;
const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
// ?quality=high forces the 3D view (skips the weak-device check and the frame-time watchdog)
const forceHigh = new URLSearchParams(location.search).get('quality') === 'high';
const weakDevice = !forceHigh && (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2 || !!nav.connection?.saveData;
const powerBtn = document.querySelector<HTMLButtonElement>('#power')!;
const toast = document.querySelector<HTMLElement>('#toast')!;
const isLow = () => html.classList.contains('low-power');
const say = (msg: string) => {
  toast.textContent = msg;
  toast.classList.add('is-on');
  setTimeout(() => toast.classList.remove('is-on'), 4200);
};

function setLowPower(on: boolean, remember = true) {
  html.classList.toggle('low-power', on);
  powerBtn.setAttribute('aria-pressed', String(on));
  if (remember) {
    try {
      localStorage.setItem('halcyra-low-power', on ? '1' : '0');
    } catch {
      /* storage blocked: still works for this visit */
    }
  }
  if (on) scene?.stop();
  else if (scene) syncLoop();
  else boot3D();
  ScrollTrigger.refresh();
}
powerBtn.addEventListener('click', () => setLowPower(!isLow()));

function syncLoop() {
  if (!scene) return;
  if (RM || isLow() || !visible || document.hidden) scene.stop();
  else scene.start();
}

async function boot3D() {
  progress(0.15, 'Loading the renderer');
  try {
    const probe = document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl');
    if (!probe) throw new Error('WebGL unavailable');
    const { createScene } = await import('./scene');
    progress(0.3, 'Plotting the system');
    html.classList.add('mode-3d'); // the canvas must be displayed before the renderer measures it
    scene = await createScene(canvas, progress);
    scene.setSize();
    measure();
    scene.setProgress(RM ? 0 : tFromScroll());
    scene.renderOnce(); // reduced motion: this single frame is all we draw
    syncLoop();
    if (!RM) {
      gsap.ticker.add(() => scene && scene.setProgress(tFromScroll()));
      // watchdog: fall back to the static view if frames are consistently slow
      setTimeout(() => {
        const ms = scene?.avgFrameMs() ?? 0;
        if (ms > 45 && !isLow() && !forceHigh) {
          setLowPower(true, false);
          say('Switched to the low-power view to keep scrolling smooth.');
        }
      }, 4000);
    }
  } catch (e) {
    console.warn('3D view unavailable, using the static view.', e);
    html.classList.remove('mode-3d');
    html.classList.add('no-webgl');
  }
  done();
}

if (isLow() && !forceHigh) {
  powerBtn.setAttribute('aria-pressed', 'true');
  done();
} else if (weakDevice) {
  setLowPower(true, false);
  done();
  say('Low-power view selected for this device. You can switch it off above.');
} else {
  boot3D();
}

// pause rendering when the space backdrop is out of view or the tab is hidden
new IntersectionObserver((entries) => {
  visible = entries.some((e) => e.isIntersecting);
  syncLoop();
}).observe(flight);
document.addEventListener('visibilitychange', syncLoop);
window.addEventListener('resize', () => {
  scene?.setSize();
  measure();
  if (RM) scene?.renderOnce();
});

/* ---------- hover labels: raycast the planets ---------- */
const tip = document.querySelector<HTMLElement>('#tip')!;
let hoverIdx = -1, queued = false, px = 0, py = 0;
window.addEventListener(
  'pointermove',
  (e) => {
    if (!scene || isLow() || e.pointerType !== 'mouse') return;
    px = e.clientX;
    py = e.clientY;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const target = document.elementFromPoint(px, py);
      const overUi = !!target?.closest('.card, .topbar, .hud, .sheet, .footer, a, button');
      hoverIdx = overUi ? -1 : scene!.pick(px, py);
      if (hoverIdx >= 0) {
        const p = planets[hoverIdx];
        tip.textContent = `World ${p.roman} · ${p.name}: click to visit`;
        tip.style.left = `${px}px`;
        tip.style.top = `${py}px`;
        if (tip.hidden && !RM) gsap.fromTo(tip, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: EASE.pop });
        tip.hidden = false;
        document.body.style.cursor = 'pointer';
      } else {
        tip.hidden = true;
        document.body.style.cursor = '';
      }
    });
  },
  { passive: true },
);
window.addEventListener('click', (e) => {
  if (hoverIdx >= 0 && !(e.target as Element).closest('a, button')) goTo(chapters[hoverIdx]);
});

window.addEventListener('load', measure);
refreshOnLoad();
html.classList.add('motion-ready');
