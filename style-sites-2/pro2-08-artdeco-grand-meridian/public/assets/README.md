# Image slots

Drop photos in `public/assets/images/` (served as `assets/images/…`) and set `data-photo` on the slot in `index.html`.

| Slot (`data-slot`) | Where | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| `facade` | Reservation panel | 3:4 | 1200 × 1600 px | The building at night, or a lobby detail in brass and marble. |

Hooks on the `<figure>`:
- `--fig-duo`: `1` duotone (recommended), `0` natural colour.
- For an emerald-and-gold duotone: `--fig-shadow: var(--emerald-deep); --fig-highlight: var(--gold-pale)`.
