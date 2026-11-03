# Image slots

Every frame on this page is drawn by the WebGL shader in `src/corridor.ts`. To use real frames from a film, put them in `public/assets/images/` (served as `assets/images/…`) and set `data-photo` on the slot in `index.html`.

| Slot (`data-slot`) | Where | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| `still-1` | Stills, first frame | 2.39:1 | 2400 × 1004 px | A wide, dark frame suits the grade. |
| `still-2` | Stills, second frame | 2.39:1 | 2400 × 1004 px | |
| `still-3` | Stills, third frame | 2.39:1 | 2400 × 1004 px | |
| `still-4` | Stills, fourth frame | 2.39:1 | 2400 × 1004 px | The brightest frame works best last. |

The title-sequence screen is not a photo slot: it is the live shader that the scroll drives. To replace it with a trailer you would swap the `<canvas>` for a `<video>`. Do not autoplay it under reduced motion.

Hooks on each `<figure>`:
- `--fig-duo`: `1` (default) grades your frame teal → amber like the shader; `0` keeps the photo's own colour.
- `--fig-shadow` and `--fig-highlight` set the duotone ends (default `--teal-deep` and `--amber`).
- `--fig-placeholder` is the colour shown while the photo loads.
