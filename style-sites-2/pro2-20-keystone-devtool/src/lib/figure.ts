/**
 * Image slots. Each `<figure class="fig">` shows procedural art (`.fig__art`) until a photo
 * path is set in `data-photo`. Then the photo lazy-loads near the viewport, starts blurred
 * over the dominant-colour placeholder (`--fig-placeholder`) and sharpens once decoded.
 * The duotone overlay (`--fig-duo`, `--fig-shadow`, `--fig-highlight`) keeps your photos on
 * palette. See assets/README.md for every slot and its recommended size.
 *
 *   <figure class="fig" data-slot="hero" data-photo="assets/images/hero.jpg" style="--ar: 16 / 9">
 */
export function initFigures(root: ParentNode = document) {
  const figs = [...root.querySelectorAll<HTMLElement>('.fig[data-photo]')].filter((f) => f.dataset.photo?.trim());
  if (!figs.length) return;

  const load = (fig: HTMLElement) => {
    const src = fig.dataset.photo!.trim();
    const img = document.createElement('img');
    img.className = 'fig__img';
    img.alt = fig.dataset.alt ?? '';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.addEventListener('load', () => {
      fig.classList.add('has-photo');
      requestAnimationFrame(() => img.classList.add('is-loaded'));
      fig.querySelector('.fig__art')?.setAttribute('aria-hidden', 'true');
    }, { once: true });
    img.addEventListener('error', () => img.remove(), { once: true });
    img.src = src;
    fig.prepend(img);
  };

  if (!('IntersectionObserver' in window)) return figs.forEach(load);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { load(e.target as HTMLElement); io.unobserve(e.target); }
    });
  }, { rootMargin: '400px' });
  figs.forEach((f) => io.observe(f));
}
