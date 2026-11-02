# Image slots

This site has **no image slots by design**: the brief for a terminal portfolio said imagery was "none needed".

To add a portrait, use the shared figure component (styles are already loaded via `src/styles/figure.css`), e.g. in the readme section:

```html
<figure class="fig" data-slot="portrait" data-photo="assets/images/portrait.jpg" data-alt="Portrait of Vesper" style="--ar: 1 / 1; --fig-radius: 0; --fig-shadow: var(--void); --fig-highlight: var(--phosphor)">
  <div class="fig__art"></div>
</figure>
```

Recommended size: 800 × 800 px. The phosphor duotone (`--fig-duo: 1`) keeps it on-theme. Also import `initFigures` from `./lib/figure` in `src/main.ts` and call it.
