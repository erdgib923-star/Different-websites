# Image slots: Maison Aurelle

Every image is a `figure.media[data-slot]`. Until you supply a photo, it shows a **generated fabric study**: a standalone SVG in `public/fabrics/`, rebuilt by `npm run fabrics` from feTurbulence, feDisplacementMap and SVG lighting filters.

## Adding a photo

1. Put the file in `public/assets/images/`.
2. Add `"slot-name": "file.jpg"` to `public/assets/images/photos.json`.
3. Reload. The photo lazy-loads, blurs up and is duotoned by the figure's `--duo-dark` and `--duo-light`. Set `--tint-strength: 0` on a figure to keep its true colours (recommended for colour-critical product shots).

| Slot | Section | Aspect ratio | Recommended size |
|---|---|---|---|
| `hero` | Hero | 4:5 | 1600 × 2000 |
| `look-01` … `look-08` | Lookbook cards | 3:4 | 1200 × 1600 |
| `bordeaux` | Bordeaux moment | 4:5 | 1600 × 2000 |
| `atelier-spin`, `atelier-weave`, `atelier-finish` | Atelier steps | 1:1 | 1200 × 1200 |

The collection-index preview and the row thumbnails use the fabric files listed in each row's `data-fabric`. To use photos there, point `data-fabric` at a file and update the `src` path in `src/main.ts`.
