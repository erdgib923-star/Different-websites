/**
 * Photo slots. Every <figure class="media" data-slot="…"> shows procedural art until a real photo is
 * listed in public/assets/images/photos.json ({ "slot": "file.jpg" }). The photo is lazy-loaded,
 * blurs up and is duotoned by CSS so it matches the palette.
 */
export async function initMedia() {
  let manifest: Record<string, string> = {};
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}assets/images/photos.json`, { cache: 'no-cache' });
    if (r.ok) manifest = await r.json();
  } catch {
    /* no manifest: keep procedural art */
  }
  document.querySelectorAll<HTMLElement>('figure.media[data-slot]').forEach((fig) => {
    const file = manifest[fig.dataset.slot!];
    if (!file) return;
    const img = new Image();
    img.className = 'media__img';
    img.alt = fig.dataset.alt ?? fig.getAttribute('aria-label') ?? '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
    img.src = `${import.meta.env.BASE_URL}assets/images/${file}`;
    fig.removeAttribute('role');
    fig.removeAttribute('aria-label');
    fig.classList.add('has-photo');
    fig.append(img);
  });
}
