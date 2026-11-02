# Image slots

Drop photos in `public/assets/images/` (served as `assets/images/…`), then set the slot's `data-photo` attribute in `index.html`. Until then each slot shows its procedural illustration.

| Slot (`data-slot`) | Where | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| `hero-desk` | Hero, right column | 4:5 | 1200 × 1500 px | Top-down desk or notebook shot. Keep the lower-left and upper-right corners calm; badges sit there. |
| `download-device` | Download band | 16:10 | 1600 × 1000 px | Laptop or tablet showing the app. Sits on the deep ink-blue band. |

Per-slot styling hooks (set as inline style on the `<figure>`):
- `--fig-duo`: `1` full duotone (default), `0.5` tinted, `0` natural photo.
- `--fig-shadow` / `--fig-highlight`: duotone dark and light colours (default `neutral-900` / `brand-100`).
- `--fig-placeholder`: dominant colour shown while loading.

Use JPEG or WebP at about 80% quality. The component handles lazy loading, blur-up and `object-fit: cover`.
