# Image slots: The Shoalreach Atlas

Each `figure.media[data-slot]` shows a procedural "field print" (layered SVG hills, sea and a low sun, generated at build time) until you list a real photo in `public/assets/images/photos.json`.

## Adding a photo

1. Put the file in `public/assets/images/`.
2. Add `"slot-name": "file.jpg"` to `photos.json`.
3. Reload. The page reads the manifest at runtime.

Photos lazy-load, blur up, and get a CSS duotone set by `--duo-dark` and `--duo-light` on each figure. Set `--tint-strength: 0` on a figure to show its original colours.

| Slot | Section | Aspect ratio | Recommended size | Duotone |
|---|---|---|---|---|
| `field-gannet-point` | Introduction | 16:9 | 2000 × 1125 | brand-900 → brand-100 |
| `field-kessock` | Field prints, left | 4:5 | 1200 × 1500 | brand-900 → brand-100 |
| `field-brine-holm` | Field prints, right | 3:2 | 1800 × 1200 | brand-900 → accent-100 |

Keep horizons in the lower third so they match the procedural prints.
