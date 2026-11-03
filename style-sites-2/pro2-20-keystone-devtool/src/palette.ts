/**
 * Command palette (Cmd/Ctrl+K). A modal <dialog> with a combobox input and a listbox of
 * commands: jump to a section, switch theme, copy the install command. Keyboard: ArrowUp/Down
 * move the active option (aria-activedescendant), Enter runs it, Escape closes (native dialog),
 * Home/End jump to the first/last option. Typing filters by label and keywords, and an empty state
 * shows when nothing matches. Focus returns to whatever opened it.
 */
export interface Command { id: string; label: string; group: string; keywords?: string; hint?: string; run: () => void }

export function initPalette(commands: Command[]) {
  const dlg = document.querySelector<HTMLDialogElement>('[data-palette]');
  const input = dlg?.querySelector<HTMLInputElement>('[data-palette-input]');
  const list = dlg?.querySelector<HTMLUListElement>('[data-palette-list]');
  const empty = dlg?.querySelector<HTMLElement>('[data-palette-empty]');
  if (!dlg || !input || !list || !empty) return { open: () => undefined };

  let shown: Command[] = [];
  let active = 0;
  let opener: HTMLElement | null = null;

  const render = () => {
    const q = input.value.trim().toLowerCase();
    shown = commands.filter((c) => !q || `${c.label} ${c.group} ${c.keywords ?? ''}`.toLowerCase().includes(q));
    active = Math.min(active, Math.max(0, shown.length - 1));
    list.replaceChildren();
    let lastGroup = '';
    shown.forEach((c, i) => {
      if (c.group !== lastGroup) {
        lastGroup = c.group;
        const h = document.createElement('li');
        h.className = 'palette__group';
        h.setAttribute('role', 'presentation');
        h.textContent = c.group;
        list.append(h);
      }
      const li = document.createElement('li');
      li.id = `cmd-${c.id}`;
      li.className = 'palette__item';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === active));
      li.innerHTML = `<span>${c.label}</span>${c.hint ? `<span class="palette__hint">${c.hint}</span>` : ''}`;
      li.addEventListener('pointermove', () => { if (active !== i) { active = i; sync(); } });
      li.addEventListener('click', () => run(i));
      list.append(li);
    });
    empty.hidden = shown.length > 0;
    list.hidden = shown.length === 0;
    sync();
  };
  const sync = () => {
    list.querySelectorAll('[role="option"]').forEach((el, i) => el.setAttribute('aria-selected', String(i === active)));
    const cur = shown[active];
    if (cur) {
      input.setAttribute('aria-activedescendant', `cmd-${cur.id}`);
      document.getElementById(`cmd-${cur.id}`)?.scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  };
  const close = () => { if (dlg.open) dlg.close(); };
  const run = (i: number) => {
    const c = shown[i];
    if (!c) return;
    close();
    c.run();
  };
  const open = (from?: HTMLElement | null) => {
    opener = from ?? (document.activeElement as HTMLElement | null);
    input.value = '';
    active = 0;
    render();
    dlg.showModal();
    input.focus();
  };

  input.addEventListener('input', () => { active = 0; render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % Math.max(1, shown.length); sync(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + shown.length) % Math.max(1, shown.length); sync(); }
    else if (e.key === 'Home') { e.preventDefault(); active = 0; sync(); }
    else if (e.key === 'End') { e.preventDefault(); active = Math.max(0, shown.length - 1); sync(); }
    else if (e.key === 'Enter') { e.preventDefault(); run(active); }
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener('close', () => {
    // A command may have moved focus on purpose (e.g. to a section heading); only restore otherwise.
    if (document.activeElement === document.body || dlg.contains(document.activeElement)) opener?.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dlg.open) close(); else open();
    }
  });
  document.querySelectorAll<HTMLElement>('[data-open-palette]').forEach((b) => b.addEventListener('click', () => open(b)));
  return { open };
}
