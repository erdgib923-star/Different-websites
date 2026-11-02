# Image slots

Drop photos in `public/assets/images/` (served as `assets/images/…`) and set the slot's `data-photo` attribute in `index.html`. Until then each slot shows its clay illustration.

| Slot (`data-slot`) | Where | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| `hero-mochi` | Hero, right | 1:1 | 1400 × 1400 px | A child with a jar or coins, subject centred. Goal chips overlap the top-left and bottom-right corners. |
| `parents-phone` | Grown-ups section | 4:3 | 1600 × 1200 px | A parent and child looking at a phone. Soft, bright light suits the palette. |

Hooks (inline style on the `<figure>`):
- `--fig-duo`: `1` duotone (default), `0` natural colour.
- `--fig-shadow` / `--fig-highlight`: duotone colours. For a candy look try `--fig-shadow: var(--brand-900); --fig-highlight: var(--candy-bubble)`.
- `--fig-placeholder`: colour shown while loading.

Please use photos you have the rights to, and the consent of anyone pictured, especially children.
