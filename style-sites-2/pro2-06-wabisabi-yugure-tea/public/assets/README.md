# Image slots

Drop photos in `public/assets/images/` (served as `assets/images/…`) and set `data-photo` on the slot in `index.html`. Photos ink-wash in the way the artwork does.

| Slot (`data-slot`) | Where | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| `hero-ink` | Hero, upper right | 1:1 | 1400 × 1400 px | A bowl, steam or a dusk window. Leave lots of empty space. |
| `atelier-room` | Visit | 4:5 | 1200 × 1500 px | The counter or a shoji screen at dusk. |

Hooks on the `<figure>`:
- `--fig-duo`: `1` gives an ink duotone (default: shadow `neutral-900`, highlight `brand-100`). `0` keeps natural colour.
- For a sumi look try `--fig-shadow: var(--ink); --fig-highlight: var(--washi)`.
