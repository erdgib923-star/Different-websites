# Image slots

Drop images in `public/assets/images/` (served as `assets/images/…`) and set `data-photo` on the slot in `index.html`.

| Slot (`data-slot`) | Where | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| `screenshot-farm` | Features | 16:9 | 1280 × 720 px (or any exact multiple of the native game resolution) | Game screenshot. Keep it unfiltered so pixels stay crisp. |
| `screenshot-night` | Features | 16:9 | 1280 × 720 px | |

Hooks on the `<figure>`:
- `--fig-duo`: `0` natural colour (recommended for screenshots), `1` duotone.
- Add `image-rendering: pixelated` to `.fig__img` in `site.css` if your screenshots are upscaled.
