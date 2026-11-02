# Image slots

Drop photos in `public/assets/images/` (served as `assets/images/…`) and set `data-photo` on the slot in `index.html`. A photo replaces that slot's paper diorama.

| Slot (`data-slot`) | Where | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| `walk-spring` | Spring walk | 4:3 | 1600 × 1200 px | Creek or fern path, fresh greens. A tag sits top-left. |
| `walk-summer` | Summer walk | 4:3 | 1600 × 1200 px | Ridge or canopy. A tag sits top-right. |
| `walk-autumn` | Autumn walk | 4:3 | 1600 × 1200 px | Copper woodland. A tag sits top-left. |
| `walk-winter` | Winter walk | 4:3 | 1600 × 1200 px | Snowy hollow. A tag sits top-right. |

Hooks on the `<figure>`:
- `--fig-duo`: `1` duotone, `0` natural.
- `--fig-shadow` / `--fig-highlight`: duotone colours. For a seasonal duotone try `--fig-shadow: var(--autumn-front); --fig-highlight: var(--autumn-sky)`.
- `--fig-placeholder`: colour shown while loading. It defaults to the slot's season sky.

The hero valley is a procedural scene, not a photo slot.
