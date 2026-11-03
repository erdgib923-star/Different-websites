# Image slots

Put photos in `public/assets/images/` (served as `assets/images/…`) and set `data-photo` on the slot in `index.html`. Until then each slot shows a procedural material swatch drawn on a canvas (`src/art.ts`).

| Slot (`data-slot`) | Where | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| `workshop` | Coachwork, large swatch (parallax, drifts up) | 4:5 | 1200 × 1500 px | A panel on the English wheel, or any brushed-metal close-up. |
| `weave` | Coachwork, small swatch (parallax, drifts down) | 1:1 | 1000 × 1000 px | A carbon-fibre close-up. |

The hero car is an inline SVG drawing and the wheel is a Three.js model. Neither is a photo slot. To show a studio photo of a real car in the hero, replace the `<svg class="car__svg">` with an `<img>` and drop the light-sweep rules from `site.css`.

Hooks on each `<figure>`:
- `--fig-duo`: `1` (default) renders the photo as a black → chrome duotone, which matches the metal neutrals; `0` keeps its natural colour.
- `--fig-shadow` and `--fig-highlight` set the duotone ends.
- `--fig-placeholder` is the colour shown while the photo loads.
