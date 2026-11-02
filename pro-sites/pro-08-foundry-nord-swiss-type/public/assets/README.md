# Image slots: Foundry Nord

This site is type-only by design: Swiss layout, white, black and one red. Its imagery is the type itself (the scroll-driven hero, specimens, kinetic rows, tester and glyph grid), so there are **no photo slots** on the page.

The shared photo loader (`src/media.ts`) is still included. To add a specimen photo (for example, a printed poster), place a figure like this anywhere in `index.html`:

```html
<figure class="media" data-slot="specimen-poster" role="img" aria-label="Printed specimen poster"
        style="--ar: 3 / 4; --dominant: var(--surface-2); --duo-dark: var(--neutral-950); --duo-light: var(--neutral-50)">
  <div class="media__art"></div>
</figure>
```

Then add `"specimen-poster": "poster.jpg"` to `public/assets/images/photos.json` and put the file in `public/assets/images/` (recommended 1500 × 2000). It lazy-loads, blurs up and is duotoned to black and white to suit the palette.
