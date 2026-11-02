# Image slots: Auralis

Each `<figure class="media" data-slot="…">` shows its procedural SVG/CSS artwork until a photo is listed in `public/assets/images/photos.json`.

## Adding a photo

1. Copy the file to `public/assets/images/`.
2. Add `"slot-name": "file.jpg"` to `public/assets/images/photos.json`.
3. Reload. The page reads the manifest at runtime, so no rebuild is needed.

Photos lazy-load, blur up and get a CSS duotone set by `--duo-dark` and `--duo-light` on each figure. Set `--tint-strength: 0` on a figure to show the photo's original colours.

| Slot | Section | Aspect ratio | Recommended size | Duotone |
|---|---|---|---|---|
| `for-bedroom` | "Built for bedrooms and big rooms": left | 4:5 | 1200 × 1500 | brand-950 → aurora teal |
| `for-control-room` | same section: right | 3:2 | 1800 × 1200 | brand-950 → aurora magenta |

Use JPEG or WebP at about 80% quality.
