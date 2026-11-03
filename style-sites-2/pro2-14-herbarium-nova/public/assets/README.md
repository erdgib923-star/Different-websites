# Image slots

Drop scans or photos in `public/assets/images/` (served as `assets/images/…`) and set `data-photo` on the slot in `index.html`.

| Slot (`data-slot`) | Where | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| `plate-i` | Plate I (pinned) | 400:520 (≈ 10:13) | 1200 × 1560 px | A herbarium sheet scan works best. The numbered labels belong to the generated drawing and are hidden behind a photo. |
| `plate-ii` | Plate II | 400:520 | 1200 × 1560 px | |
| `plate-iii` | Plate III | 400:520 | 1200 × 1560 px | |
| `plate-iv` | Plate IV | 400:520 | 1200 × 1560 px | |

Hooks on the `<figure>`:
- `--fig-duo`: `1` sepia duotone (recommended for a book look), `0` natural colour.
- For a sepia plate: `--fig-shadow: var(--sepia); --fig-highlight: var(--parchment)`.
