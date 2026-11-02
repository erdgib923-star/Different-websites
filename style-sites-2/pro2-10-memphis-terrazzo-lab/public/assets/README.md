# Image slots

Drop photos in `public/assets/images/` (served as `assets/images/…`) and set `data-photo` on the slot in `index.html`.

| Slot (`data-slot`) | Where | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| `pattern-gelato` | Library | 1:1 | 1000 × 1000 px | A photo of the pattern in use: a floor, a fabric, a package. |
| `pattern-disco` | Library | 1:1 | 1000 × 1000 px | |
| `pattern-sorbet` | Library | 1:1 | 1000 × 1000 px | |
| `pattern-gravel` | Library | 1:1 | 1000 × 1000 px | |
| `pattern-picnic` | Library | 1:1 | 1000 × 1000 px | |
| `pattern-midnight` | Library | 1:1 | 1000 × 1000 px | |

Hooks on the `<figure>`:
- `--fig-duo`: `0` natural colour (recommended), `1` duotone.
- For a pop-art duotone: `--fig-shadow: var(--ink); --fig-highlight: var(--pink)`.
