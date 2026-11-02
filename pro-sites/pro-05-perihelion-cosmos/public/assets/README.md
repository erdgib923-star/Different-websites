# Image slots: Halcyra

The 3D view is fully procedural (Three.js shaders). The **CSS planet illustrations** in each chapter card are reusable `figure.media` slots. They appear in low-power mode, without WebGL, without JavaScript and under reduced motion.

## Adding a photo or render

1. Put the file in `public/assets/images/`.
2. Add `"slot-name": "file.jpg"` to `public/assets/images/photos.json`.
3. Reload. The image lazy-loads, blurs up and is duotoned (`--duo-dark` → `--duo-light`, the planet's light tone). Set `--tint-strength: 0` on the figure to keep the original colours.

| Slot | Chapter | Aspect ratio | Recommended size |
|---|---|---|---|
| `planet-vey` | World I | 1:1 | 1000 × 1000, planet centred on transparent or black |
| `planet-orrin` | World II | 1:1 | 1000 × 1000 |
| `planet-selk` | World III | 1:1 | 1000 × 1000 |
| `planet-mauna-rel` | World IV | 1:1 | 1000 × 1000 |
| `planet-isk` | World V | 1:1 | 1000 × 1000 |

For consistency, light your renders from the top-left, to match the CSS planets.
