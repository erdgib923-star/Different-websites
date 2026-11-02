import { gsap, reduced } from './motion';

const NAMES: Record<string, string> = {
  '&': 'Ampersand', '@': 'Commercial at', '?': 'Question mark', '!': 'Exclamation mark', '€': 'Euro sign', '%': 'Percent sign',
  '(': 'Left parenthesis', ')': 'Right parenthesis', '→': 'Rightwards arrow', 'ß': 'Latin small letter sharp s', 'Æ': 'Latin capital letter AE', 'ø': 'Latin small letter o with stroke',
};
const DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const nameOf = (c: string) => {
  if (NAMES[c]) return NAMES[c];
  if (/[A-Z]/.test(c)) return `Latin capital letter ${c}`;
  if (/[a-z]/.test(c)) return `Latin small letter ${c}`;
  if (/\d/.test(c)) return `Digit ${DIGITS[Number(c)]}`;
  return 'Glyph';
};
const code = (c: string) => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`;

/** Glyph grid: hover or focus a cell to inspect it in the big preview (which sweeps its weight). */
export function initGlyphs() {
  const grid = document.querySelector<HTMLElement>('#glyph-grid');
  if (!grid) return;
  const big = document.querySelector<HTMLElement>('#glyph-big')!;
  const name = document.querySelector<HTMLElement>('#glyph-name')!;
  const chars = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&@?!€%()→ßÆø'];
  grid.innerHTML = chars.map((c) => `<div role="listitem"><button type="button" class="glyph" data-c="${c}" aria-label="${c}: ${nameOf(c)}, ${code(c)}">${c}</button></div>`).join('');
  // the cells are list items whose child is a button; the list items are the grid cells visually
  grid.querySelectorAll('div[role="listitem"]').forEach((d) => d.classList.add('glyph-cell'));
  const w = { v: 400 };
  let current: HTMLElement | null = null;
  const show = (btn: HTMLElement) => {
    if (btn === current) return;
    current?.classList.remove('is-current');
    current = btn;
    btn.classList.add('is-current');
    const c = btn.dataset.c!;
    big.textContent = c;
    name.textContent = `${code(c)} · ${nameOf(c)}`;
    if (reduced()) return;
    gsap.fromTo(w, { v: 100 }, { v: 900, duration: 0.9, ease: 'power3.out', onUpdate: () => (big.style.fontVariationSettings = `'wght' ${Math.round(w.v)}, 'wdth' 100, 'opsz' 144`) });
  };
  grid.addEventListener('pointerover', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('.glyph');
    if (b) show(b);
  });
  grid.addEventListener('focusin', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('.glyph');
    if (b) show(b);
  });
  grid.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('.glyph');
    if (b) show(b);
  });
  show(grid.querySelector<HTMLElement>('.glyph[data-c="R"]')!);
}
