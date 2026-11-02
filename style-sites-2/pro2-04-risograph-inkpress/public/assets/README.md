# Image slots

Drop files in `public/assets/images/` (served as `assets/images/…`) and set `data-photo` on the slot in `index.html`.

| Slot (`data-slot`) | Where | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| `hero-poster` | Hero, right | 3:4 | 1200 × 1600 px | A photo or scan of a real riso print. Pass labels sit on the left edge and the stamp on the bottom-right. |

Hooks on the `<figure>`:
- `--fig-duo`: duotone strength. `1` maps the photo to two inks via `--fig-shadow` and `--fig-highlight`; `0` keeps natural colour.
- A riso-style duotone: `--fig-shadow: var(--ink-blue); --fig-highlight: var(--ink-pink)`.

With a photo in place, the ink-registration scrub has nothing to move, so it does nothing.
