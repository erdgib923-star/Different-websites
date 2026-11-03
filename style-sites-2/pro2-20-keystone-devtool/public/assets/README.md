# Image slots

Springline has no photo slots: a developer-tool page is better served by real UI (code, plans, palettes) than by photography. Everything visible is HTML, CSS and inline SVG.

If you add product screenshots later:

| Where | Suggested element | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| Hero, right column | replace `.hero__stack` with a `<figure class="fig">` | 4:3 | 1600 × 1200 px | Use `--fig-duo: 0`: UI screenshots should keep their real colours. |
| How it works | below the diff | 16:10 | 1600 × 1000 px | Provide both a dark and a light screenshot and swap them on `[data-theme]`. |

Screenshots of real third-party products must not be used.
