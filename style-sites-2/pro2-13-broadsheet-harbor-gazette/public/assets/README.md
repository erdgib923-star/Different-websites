# Image slots

Drop photos in `public/assets/images/` (served as `assets/images/…`) and set `data-photo` on the slot in `index.html`.

| Slot (`data-slot`) | Where | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| `lead-lighthouse` | Lead story | 16:9 | 1600 × 900 px | Strong silhouette and simple tones read best in newsprint duotone. |
| `ferry-fog` | Side story | 4:3 | 1000 × 750 px | |

Hooks on the `<figure>`:
- `--fig-duo`: `1` ink-on-newsprint duotone (recommended), `0` natural colour.
- For a press look: `--fig-shadow: var(--ink); --fig-highlight: var(--newsprint)`.
