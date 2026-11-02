import { prefersReduced } from './lib/motion';

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

/** Run a DOM update inside a View Transition when supported, plainly otherwise. */
function withTransition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (!doc.startViewTransition || prefersReduced()) { update(); return null; }
  document.documentElement.classList.add('vt');
  const t = doc.startViewTransition(update);
  t.finished.finally(() => document.documentElement.classList.remove('vt'));
  return t;
}

/* ---------- 1. Typing demo ---------- */
const LINES = [
  'The ferry was late again, so I wrote the opening on the back of a receipt.',
  'By the second coffee, the receipt had become a scene.',
  'Quillstack keeps the scraps in order until they turn into something.',
];
function initTyping() {
  const el = $('[data-typing]');
  const count = $('[data-wordcount]');
  const toggle = $<HTMLButtonElement>('[data-typing-toggle]');
  if (!el || !count || !toggle) return;
  const full = LINES.join(' ');
  const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
  if (prefersReduced()) {
    el.textContent = full;
    count.textContent = String(words(full));
    toggle.hidden = true;
    return;
  }
  let i = 0, paused = false, visible = false, timer = 0;
  const tick = () => {
    timer = 0;
    if (paused || !visible || document.hidden) return;
    if (i <= full.length) {
      el.textContent = full.slice(0, i);
      count.textContent = String(words(el.textContent));
      const ch = full[i - 1];
      i++;
      timer = window.setTimeout(tick, ch === '.' ? 520 : ch === ',' ? 220 : 28 + Math.random() * 46);
    } else {
      timer = window.setTimeout(() => { i = 0; tick(); }, 2600);
    }
  };
  const schedule = () => { if (!timer) tick(); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) schedule(); }).observe(el);
  document.addEventListener('visibilitychange', schedule);
  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'Resume typing' : 'Pause typing';
    if (!paused) schedule();
  });
  i = 0;
}

/* ---------- 2. Kanban ---------- */
function initKanban() {
  const board = $('[data-kanban]');
  const status = $('[data-kanban-status]');
  if (!board || !status) return;
  const cols = $$('.kanban__col', board);
  board.addEventListener('click', (e) => {
    const card = (e.target as Element).closest<HTMLButtonElement>('.kcard');
    if (!card) return;
    const li = card.parentElement!;
    const from = Number(li.closest<HTMLElement>('.kanban__col')!.dataset.col);
    const to = (from + 1) % cols.length;
    $$<HTMLElement>('.kcard', board).forEach((c) => (c.style.viewTransitionName = `kcard-${c.dataset.card}`));
    const t = withTransition(() => {
      $('ul', cols[to])!.appendChild(li);
      card.classList.toggle('kcard--done', to === 2);
    });
    const label = $('.kanban__label', cols[to])!.textContent;
    status.textContent = `${card.textContent} moved to ${label}.`;
    card.focus();
    const clear = () => $$<HTMLElement>('.kcard', board).forEach((c) => (c.style.viewTransitionName = ''));
    if (t) t.finished.finally(clear); else clear();
  });
}

/* ---------- 3. Calendar ---------- */
function initCalendar() {
  const grid = $('[data-cal]');
  const streak = $('[data-streak]');
  const month = $('[data-cal-month]');
  if (!grid || !streak || !month) return;
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  month.textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const today = now.getDate();
  // Sample streak: a believable pattern of written days up to today.
  const written = new Set<number>();
  for (let d = 1; d <= today; d++) if ((d * 7) % 5 !== 2 || d === today) written.add(d);
  const frag = document.createDocumentFragment();
  ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d) => {
    const s = document.createElement('span'); s.className = 'cal__dow'; s.textContent = d; s.setAttribute('aria-hidden', 'true'); frag.appendChild(s);
  });
  for (let i = 0; i < first; i++) frag.appendChild(document.createElement('span'));
  for (let d = 1; d <= days; d++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = String(d);
    const label = new Date(y, m, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    b.setAttribute('aria-label', label);
    b.setAttribute('aria-pressed', String(written.has(d)));
    if (d === today) b.classList.add('is-today');
    if (d > today) b.disabled = true;
    frag.appendChild(b);
  }
  grid.replaceChildren(frag);
  const unit = streak.nextSibling;
  const update = () => {
    const n = $$('button[aria-pressed="true"]', grid).length;
    streak.textContent = String(n);
    if (unit) unit.textContent = ` day${n === 1 ? '' : 's'} written this month`;
  };
  update();
  grid.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button');
    if (!b || b.disabled) return;
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
    update();
  });
}

/* ---------- 4. Theme ---------- */
function initTheme() {
  const btn = $<HTMLButtonElement>('[data-theme-toggle]');
  if (!btn) return;
  const html = document.documentElement;
  const sync = () => btn.setAttribute('aria-checked', String(html.dataset.theme === 'dark'));
  sync();
  btn.addEventListener('click', () => {
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    withTransition(() => { html.dataset.theme = next; sync(); });
    try { localStorage.setItem('qs-theme', next); } catch { /* storage unavailable */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#111725' : '#f6f8fc');
  });
}

/* ---------- 5. Tags ---------- */
function initTags() {
  const wrap = $('[data-tags]');
  const count = $('[data-tag-count]');
  const label = $('[data-tag-label]');
  if (!wrap || !count || !label) return;
  wrap.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('.tag');
    if (!b) return;
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
    const on = $$<HTMLButtonElement>('.tag[aria-pressed="true"]', wrap);
    if (!on.length) { count.textContent = '58'; label.textContent = 'notes in total'; return; }
    // Sample overlap model: each extra tag narrows the set.
    const n = Math.max(1, Math.round(Math.min(...on.map((t) => Number(t.dataset.n))) * 0.8 ** (on.length - 1)));
    count.textContent = String(n);
    label.textContent = `note${n === 1 ? '' : 's'} tagged ${on.map((t) => t.textContent).join(' + ')}`;
  });
}

/* ---------- 6. Stats bars stagger index ---------- */
function initBars() {
  $$<SVGRectElement>('.bars__g rect').forEach((r, i) => r.style.setProperty('--b', String(i)));
}

/* ---------- 8. Timer ---------- */
function initTimer() {
  const time = $('[data-timer-time]');
  const ring = $<SVGCircleElement>('[data-timer-ring]');
  const start = $<HTMLButtonElement>('[data-timer-start]');
  const reset = $<HTMLButtonElement>('[data-timer-reset]');
  const status = $('[data-timer-status]');
  if (!time || !ring || !start || !reset || !status) return;
  const TOTAL = 25 * 60;
  const C = 2 * Math.PI * 52;
  let left = TOTAL, id = 0;
  const render = () => {
    time.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
    ring.style.strokeDashoffset = String(C * (1 - left / TOTAL));
  };
  const stop = () => { clearInterval(id); id = 0; start.textContent = 'Start'; };
  start.addEventListener('click', () => {
    if (id) { stop(); status.textContent = `Paused at ${time.textContent}.`; return; }
    start.textContent = 'Pause';
    status.textContent = 'Focus session started.';
    id = window.setInterval(() => {
      left = Math.max(0, left - 1);
      render();
      if (!left) { stop(); status.textContent = 'Session complete. Take a break.'; }
    }, 1000);
  });
  reset.addEventListener('click', () => { stop(); left = TOTAL; render(); status.textContent = 'Timer reset to 25 minutes.'; });
  render();
}

/* ---------- 9. Capture ---------- */
function initCapture() {
  const form = $<HTMLFormElement>('[data-capture]');
  const list = $('[data-capture-list]');
  if (!form || !list) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.elements.namedItem('note') as HTMLInputElement;
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    const li = document.createElement('li');
    li.className = 'is-new';
    const span = document.createElement('span'); span.textContent = text;
    const t = document.createElement('time'); t.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    li.append(span, t);
    list.prepend(li);
    while (list.children.length > 4) list.lastElementChild?.remove();
    input.value = '';
  });
}

/* ---------- Cursor tilt ---------- */
function initTilt() {
  if (prefersReduced() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  $$('.tile').forEach((tile) => {
    tile.addEventListener('pointermove', (e) => {
      const r = tile.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tile.style.setProperty('--ry', `${(x * 5).toFixed(2)}deg`);
      tile.style.setProperty('--rx', `${(-y * 5).toFixed(2)}deg`);
      tile.classList.add('is-tilting');
    });
    tile.addEventListener('pointerleave', () => {
      tile.classList.remove('is-tilting');
      tile.style.setProperty('--rx', '0deg');
      tile.style.setProperty('--ry', '0deg');
    });
  });
}

/* ---------- Expand to detail (View Transitions + fallback) ---------- */
const DETAILS: Record<string, { kicker: string; title: string; lead: string; points: string[] }> = {
  type: { kicker: 'Editor', title: 'A page that gets out of the way', lead: 'The editor hides everything but your words until you ask for it. Markdown is typed, not toolbarred.', points: ['Typewriter scrolling keeps the current line at eye height', 'Soft word count goals per note', 'Every keystroke saved locally, synced when online'] },
  kan: { kicker: 'Board', title: 'Drafts move like cards', lead: 'Any tag can become a board column. Move a note to "Editing" and it picks up your editing checklist.', points: ['Columns are just tags, so nothing is locked in', 'Keyboard: select a card to move it along', 'Board and list views of the same stack'] },
  cal: { kicker: 'Habits', title: 'A streak, not a scoreboard', lead: 'Quillstack marks the days you wrote anything at all. Missing a day never resets the month.', points: ['Counts any note longer than one sentence', 'Private by default, never shared', 'Weekly summary you can switch off'] },
  theme: { kicker: 'Comfort', title: 'Night desk', lead: 'A dark theme tuned for long sessions: ink-blue shadows instead of pure black, and the same contrast as daylight.', points: ['Follows your system setting until you choose', 'Every text colour checked against WCAG AA', 'Your choice is remembered on this device'] },
  tags: { kicker: 'Organise', title: 'Tags that combine', lead: 'Pick two tags and see only notes that carry both. No folders, no nesting, no lost files.', points: ['Type # anywhere to tag', 'Combine tags to narrow a stack', 'Rename a tag once, everywhere'] },
  stat: { kicker: 'Progress', title: 'Gentle numbers', lead: 'Words per day, the week at a glance, and your best day highlighted. That is all it tracks.', points: ['Stored on your device only', 'Bars use one hue plus one contrasting accent, safe for colour-blind readers', 'Figures shown here are sample data'] },
  graph: { kicker: 'Links', title: 'Backlinks with context', lead: 'Each note lists the notes that point to it, with the sentence that made the link.', points: ['Link with [[double brackets]]', 'Unlinked mentions are suggested, never forced', 'Graph view for when you want the map'] },
  timer: { kicker: 'Focus', title: 'Twenty-five minutes at a time', lead: 'A quiet focus timer lives in the corner of the editor. It never pops up over your words.', points: ['Start, pause and reset from the keyboard', 'Optional soft chime at the end', 'Sessions are tallied into your streak'] },
  cap: { kicker: 'Inbox', title: 'Capture first, sort later', lead: 'Quick capture drops a scrap into your inbox from anywhere, without asking where it belongs.', points: ['Global shortcut on desktop', 'Share sheet and widget on mobile', 'Works fully offline'] },
};

function initDetail() {
  const dialog = $<HTMLDialogElement>('[data-detail]');
  if (!dialog) return;
  const kicker = $('[data-detail-kicker]', dialog)!, title = $('[data-detail-title]', dialog)!, lead = $('[data-detail-lead]', dialog)!, list = $('[data-detail-list]', dialog)!;
  let source: HTMLElement | null = null;

  const fill = (key: string) => {
    const d = DETAILS[key];
    kicker.textContent = d.kicker; title.textContent = d.title; lead.textContent = d.lead;
    list.replaceChildren(...d.points.map((p) => Object.assign(document.createElement('li'), { textContent: p })));
  };

  document.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-open]');
    if (!btn) return;
    const key = btn.dataset.open!;
    source = btn.closest<HTMLElement>('.tile');
    fill(key);
    if (source) source.style.viewTransitionName = 'tile-expand';
    const t = withTransition(() => {
      if (source) source.style.viewTransitionName = '';
      dialog.style.viewTransitionName = 'tile-expand';
      dialog.showModal();
    });
    const done = () => { dialog.style.viewTransitionName = ''; };
    if (t) t.finished.finally(done); else done();
  });

  const close = () => {
    if (!dialog.open) return;
    dialog.style.viewTransitionName = 'tile-expand';
    const t = withTransition(() => {
      dialog.style.viewTransitionName = '';
      dialog.close();
      if (source) source.style.viewTransitionName = 'tile-expand';
    });
    const done = () => { if (source) source.style.viewTransitionName = ''; dialog.style.viewTransitionName = ''; source?.querySelector<HTMLElement>('[data-open]')?.focus(); };
    if (t) t.finished.finally(done); else done();
  };
  $('[data-close]', dialog)?.addEventListener('click', close);
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
}

export function initTiles() {
  initTyping();
  initKanban();
  initCalendar();
  initTheme();
  initTags();
  initBars();
  initTimer();
  initCapture();
  initTilt();
  initDetail();
}
