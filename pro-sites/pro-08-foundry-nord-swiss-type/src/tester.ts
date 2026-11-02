import { gsap, reduced } from './motion';

type Axis = { tag: string; label: string; min: number; max: number; step: number; value: number };
/** The fictional families and the open-source fonts that stand in for them (axis ranges from each font). */
const FAMILIES: Record<string, { name: string; css: string; axes: Axis[] }> = {
  flex: {
    name: 'Nord Grotesk Flex',
    css: "'Roboto Flex Variable'",
    axes: [
      { tag: 'wght', label: 'Weight', min: 100, max: 1000, step: 1, value: 520 },
      { tag: 'wdth', label: 'Width', min: 25, max: 151, step: 1, value: 100 },
      { tag: 'opsz', label: 'Optical size', min: 8, max: 144, step: 1, value: 96 },
      { tag: 'slnt', label: 'Slant', min: -10, max: 0, step: 1, value: 0 },
      { tag: 'GRAD', label: 'Grade', min: -200, max: 150, step: 1, value: 0 },
    ],
  },
  breit: {
    name: 'Nord Breit',
    css: "'Anybody Variable'",
    axes: [
      { tag: 'wght', label: 'Weight', min: 100, max: 900, step: 1, value: 600 },
      { tag: 'wdth', label: 'Width', min: 50, max: 150, step: 1, value: 130 },
    ],
  },
  mono: {
    name: 'Nord Mono Kasual',
    css: "'Recursive Variable'",
    axes: [
      { tag: 'wght', label: 'Weight', min: 300, max: 1000, step: 1, value: 500 },
      { tag: 'CASL', label: 'Casual', min: 0, max: 1, step: 0.01, value: 1 },
      { tag: 'MONO', label: 'Monospace', min: 0, max: 1, step: 0.01, value: 1 },
      { tag: 'slnt', label: 'Slant', min: -15, max: 0, step: 1, value: 0 },
    ],
  },
};

export function initTester() {
  const axesBox = document.querySelector<HTMLElement>('#axes');
  if (!axesBox) return;
  const sample = document.querySelector<HTMLElement>('#sample')!;
  const stage = document.querySelector<HTMLElement>('#stage')!;
  const cssOut = document.querySelector<HTMLElement>('#css-out')!;
  const size = document.querySelector<HTMLInputElement>('#size')!;
  const sizeOut = document.querySelector('#size-out')!;
  const status = document.querySelector('#copy-status')!;
  let fam = 'flex';
  const values: Record<string, Record<string, number>> = {};
  Object.entries(FAMILIES).forEach(([k, f]) => (values[k] = Object.fromEntries(f.axes.map((a) => [a.tag, a.value]))));

  const settings = () => FAMILIES[fam].axes.map((a) => `'${a.tag}' ${values[fam][a.tag]}`).join(', ');
  const render = () => {
    const f = FAMILIES[fam];
    sample.style.fontFamily = f.css;
    sample.style.fontVariationSettings = settings();
    sample.style.fontSize = `${size.value}px`;
    sizeOut.textContent = `${size.value} px`;
    cssOut.textContent = `/* ${f.name} */\nfont-family: ${f.css};\nfont-size: ${size.value}px;\nfont-variation-settings: ${settings()};`;
  };

  const buildSliders = () => {
    axesBox.innerHTML = FAMILIES[fam].axes
      .map(
        (a) =>
          `<label class="axis"><span>${a.label} <output id="o-${a.tag}">${values[fam][a.tag]}</output></span><input type="range" data-tag="${a.tag}" min="${a.min}" max="${a.max}" step="${a.step}" value="${values[fam][a.tag]}" aria-describedby="o-${a.tag}" /></label>`,
      )
      .join('');
    if (!reduced()) gsap.from(axesBox.children, { autoAlpha: 0, y: 10, duration: 0.4, stagger: 0.05, ease: 'power3.out' });
  };
  axesBox.addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    const tag = input.dataset.tag!;
    values[fam][tag] = Number(input.value);
    axesBox.querySelector(`#o-${tag}`)!.textContent = input.value;
    render();
  });
  size.addEventListener('input', render);
  document.querySelectorAll<HTMLInputElement>('input[name="family"]').forEach((r) =>
    r.addEventListener('change', () => {
      fam = r.value;
      buildSliders();
      render();
    }),
  );
  const invert = document.querySelector<HTMLButtonElement>('#invert')!;
  invert.addEventListener('click', () => {
    const on = !stage.classList.contains('is-inverted');
    stage.classList.toggle('is-inverted', on);
    invert.setAttribute('aria-pressed', String(on));
  });
  document.querySelector('#reset')!.addEventListener('click', () => {
    Object.entries(FAMILIES).forEach(([k, f]) => (values[k] = Object.fromEntries(f.axes.map((a) => [a.tag, a.value]))));
    size.value = window.innerWidth < 700 ? '44' : '96';
    sample.textContent = 'Quiet fjords, bright signage, big zinc quays.';
    buildSliders();
    render();
    status.textContent = 'Reset to defaults.';
  });
  document.querySelector('#copy')!.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(cssOut.textContent ?? '');
      status.textContent = 'CSS copied to the clipboard.';
    } catch {
      status.textContent = 'Copy is blocked in this browser; select the CSS below instead.';
    }
  });
  // keep the sample plain text (no pasted formatting)
  sample.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, text);
  });
  // phones start at a size where a few words fit on a line
  if (window.innerWidth < 700) size.value = '44';
  buildSliders();
  render();
}
