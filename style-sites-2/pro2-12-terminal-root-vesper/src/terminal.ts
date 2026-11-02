/**
 * A small, real terminal: commands, Tab completion, ↑/↓ history, and a skippable boot sequence.
 * Output goes into a role="log" region (polite), so screen readers hear results without the boot
 * chatter being forced on them. Under reduced motion the boot text appears instantly.
 */
import { prefersReduced } from './lib/motion';

type Line = string | [cls: string, text: string];
interface Ctx { print: (...lines: Line[]) => void; clear: () => void; setTheme: (t: 'green' | 'amber') => void; plain: () => void }

const PROJECTS: Record<string, { desc: string; meta: string }> = {
  tidepool: { desc: 'Syncs dotfiles across machines with a readable three-way merge.', meta: 'rust · 2024 · 2.1k stars (sample)' },
  lanternfish: { desc: 'Tiny static-site generator for zines and changelogs. One binary, zero config.', meta: 'typescript · 2025 · v1.0' },
  quietbus: { desc: 'Linter for terminal UIs: contrast, focus order, screen-reader output.', meta: 'go · 2026 · beta' },
  'orbit-notes': { desc: 'Local-first notes with conflict-free sync on a small CRDT engine.', meta: 'typescript · 2023' },
};

const COMMANDS: Record<string, { help: string; run: (args: string[], c: Ctx) => void }> = {
  help: { help: 'list commands', run: (_a, c) => c.print(['acc', 'available commands:'], ...Object.entries(COMMANDS).map(([k, v]) => `  ${k.padEnd(10)} ${v.help}`), ['dim', 'tip: Tab completes, ↑ ↓ recall history']) },
  about: { help: 'who is vesper?', run: (_a, c) => c.print('Vesper Marlowe — builds small, sharp developer tools.', 'CLIs, terminal UIs, and the glue between them. 7 years in.', ['dim', 'currently: open to a tooling team · remote, UTC+1'], ['dim', '(a fictional person for a design demo)']) },
  projects: { help: 'list projects  (projects <name> for detail)', run: (a, c) => {
    if (a[0]) {
      const p = PROJECTS[a[0]];
      if (!p) return c.print(['err', `projects: no such project: ${a[0]}`]);
      return c.print(['acc', a[0]], p.desc, ['dim', p.meta]);
    }
    c.print(...Object.entries(PROJECTS).map(([k, v]) => `  ${k.padEnd(12)} ${v.desc}`), ['dim', 'try: projects lanternfish']);
  } },
  contact: { help: 'how to reach vesper', run: (_a, c) => c.print('email    vesper@example.com', 'phone    (555) 555-0100', 'code     example.com/vesper') },
  whoami: { help: 'print the current user', run: (_a, c) => c.print('root (but only of this page)') },
  ls: { help: 'list files', run: (_a, c) => c.print('README.md  projects/  career.log  contact.txt') },
  cat: { help: 'print a file  (cat README.md)', run: (a, c) => {
    if (a[0] === 'README.md') return COMMANDS.about.run([], c);
    if (a[0] === 'contact.txt') return COMMANDS.contact.run([], c);
    if (a[0] === 'career.log') return c.print('2026 open to work', '2025 lanternfish v1.0', '2023 moved to developer tools', '2021 led design-system CLI', '2019 first job');
    c.print(['err', `cat: ${a[0] ?? ''}: no such file`]);
  } },
  theme: { help: 'switch colours  (theme green | theme amber)', run: (a, c) => {
    if (a[0] !== 'green' && a[0] !== 'amber') return c.print(['err', 'usage: theme green | theme amber']);
    c.setTheme(a[0]); c.print(['ok', `[ OK ] theme set to ${a[0]}`]);
  } },
  plain: { help: 'switch to the plain HTML view', run: (_a, c) => c.plain() },
  date: { help: 'print the date', run: (_a, c) => c.print(new Date().toString()) },
  echo: { help: 'print text', run: (a, c) => c.print(a.join(' ')) },
  history: { help: 'show previous commands', run: () => undefined },
  clear: { help: 'clear the screen', run: (_a, c) => c.clear() },
};

const BOOT: Line[] = [
  ['dim', 'VESPER BIOS v2.6  (c) 2026 — a fictional machine'],
  ['dim', 'memory check ........ 640K ok'],
  ['dim', 'mounting /home/vesper ........ ok'],
  ['dim', 'starting portfolio.service ........ ok'],
  '',
  ['acc', 'welcome. type "help" to begin.'],
];

export function initTerminal(opts: { setTheme: (t: 'green' | 'amber') => void; plain: () => void }) {
  const log = document.querySelector<HTMLElement>('[data-log]');
  const form = document.querySelector<HTMLFormElement>('[data-form]');
  const input = document.querySelector<HTMLInputElement>('[data-input]');
  const screen = document.querySelector<HTMLElement>('[data-screen]');
  const skip = document.querySelector<HTMLButtonElement>('[data-skip]');
  if (!log || !form || !input || !screen || !skip) return;
  const history: string[] = [];
  let hIndex = 0;

  const line = (l: Line) => {
    const el = document.createElement('span');
    el.className = 'l';
    if (Array.isArray(l)) { el.classList.add(l[0]); el.textContent = l[1]; } else el.textContent = l || ' ';
    log.appendChild(el);
    return el;
  };
  const ctx: Ctx = {
    print: (...lines) => { lines.forEach(line); screen.scrollTop = screen.scrollHeight; },
    clear: () => log.replaceChildren(),
    setTheme: opts.setTheme,
    plain: () => { ctx.print(['ok', '[ OK ] switching to plain view']); opts.plain(); },
  };
  COMMANDS.history.run = (_a, c) => c.print(...(history.length ? history.map((h, i) => `  ${String(i + 1).padStart(3)}  ${h}`) : [['dim', '(empty)'] as Line]));

  // Boot: typed line by line (skippable), then the prompt is enabled.
  let booted = false;
  const finishBoot = () => {
    if (booted) return;
    booted = true;
    log.replaceChildren();
    BOOT.forEach(line);
    skip.hidden = true;
    input.disabled = false;
  };
  const typeBoot = async () => {
    log.setAttribute('aria-busy', 'true');
    for (const l of BOOT) {
      if (booted) break;
      const text = Array.isArray(l) ? l[1] : l;
      const el = line(Array.isArray(l) ? [l[0], ''] : '');
      for (let i = 1; i <= text.length && !booted; i += 2) {
        el.textContent = text.slice(0, i);
        await new Promise((r) => setTimeout(r, 14));
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    log.removeAttribute('aria-busy');
    finishBoot();
  };
  skip.addEventListener('click', () => { finishBoot(); input.focus(); });
  addEventListener('keydown', (e) => { if (!booted && e.key === 'Escape') finishBoot(); });
  if (prefersReduced()) finishBoot();
  else {
    // Start the boot when the terminal is first on screen.
    new IntersectionObserver(([e], io) => { if (e.isIntersecting) { io.disconnect(); void typeBoot(); } }).observe(screen);
  }

  const run = (raw: string) => {
    const text = raw.trim();
    const echo = line(text); echo.classList.add('echo');
    if (!text) return;
    history.push(text); hIndex = history.length;
    const [cmd, ...args] = text.split(/\s+/);
    const c = COMMANDS[cmd.toLowerCase()];
    if (c) c.run(args, ctx); else ctx.print(['err', `zsh: command not found: ${cmd}`], ['dim', 'type "help" for a list']);
    screen.scrollTop = screen.scrollHeight;
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); run(input.value); input.value = ''; });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') { if (hIndex > 0) { hIndex--; input.value = history[hIndex]; } e.preventDefault(); }
    else if (e.key === 'ArrowDown') { if (hIndex < history.length) { hIndex++; input.value = history[hIndex] ?? ''; } e.preventDefault(); }
    else if (e.key === 'Tab' && input.value.trim()) {
      // Tab completes command names, then project names / theme values. Empty input: Tab moves focus as usual.
      const parts = input.value.split(/\s+/);
      const pool = parts.length === 1 ? Object.keys(COMMANDS)
        : parts[0] === 'projects' ? Object.keys(PROJECTS)
        : parts[0] === 'theme' ? ['green', 'amber']
        : parts[0] === 'cat' ? ['README.md', 'career.log', 'contact.txt'] : [];
      const last = parts[parts.length - 1];
      const hits = pool.filter((p) => p.startsWith(last));
      if (!hits.length) return;
      e.preventDefault();
      if (hits.length === 1) { parts[parts.length - 1] = hits[0] + (parts.length === 1 ? ' ' : ''); input.value = parts.join(' '); }
      else ctx.print(['dim', hits.join('   ')]);
    }
  });
  screen.addEventListener('click', () => { if (!input.disabled && !getSelection()?.toString()) input.focus({ preventScroll: true }); });
}
