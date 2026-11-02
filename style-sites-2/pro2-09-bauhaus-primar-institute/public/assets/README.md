# Image slots

Drop photos in `public/assets/images/` (served as `assets/images/…`) and set `data-photo` on the slot in `index.html`.

| Slot (`data-slot`) | Where | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| `study-01` | Exhibition grid | 1:1 | 1200 × 1200 px | Photo of a student work. A caption tab hangs below the tile. |
| `study-02` | Exhibition grid | 4:5 | 1200 × 1500 px | |
| `study-03` | Exhibition grid | 1:1 | 1200 × 1200 px | |
| `study-04` | Exhibition grid | 5:4 | 1500 × 1200 px | |
| `study-05` | Exhibition grid | 1:1 | 1200 × 1200 px | |
| `study-06` | Exhibition grid | 4:5 | 1200 × 1500 px | |

Hooks on the `<figure>`:
- `--fig-duo`: `0` natural colour (recommended for artwork), `1` duotone.
- For a primary duotone: `--fig-shadow: var(--black); --fig-highlight: var(--yellow)`.
