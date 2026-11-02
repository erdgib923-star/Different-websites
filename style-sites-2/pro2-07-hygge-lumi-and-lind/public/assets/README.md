# Image slots

Drop photos in `public/assets/images/` (served as `assets/images/…`) and set `data-photo` on the slot in `index.html`.

| Slot (`data-slot`) | Where | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| `hero-still-life` | Hero, right (arched top) | 4:5 | 1200 × 1500 px | Window-light still life. A tag sits on the lower-left edge. |
| `product-throw` | Shop | 1:1 | 1000 × 1000 px | Product on a linen or plain backdrop. |
| `product-candles` | Shop | 1:1 | 1000 × 1000 px | |
| `product-mug` | Shop | 1:1 | 1000 × 1000 px | |
| `product-cushion` | Shop | 1:1 | 1000 × 1000 px | |
| `product-board` | Shop | 1:1 | 1000 × 1000 px | |
| `product-lamp` | Shop | 1:1 | 1000 × 1000 px | |

Hooks on the `<figure>`:
- `--fig-duo`: `0` natural colour (recommended for products), `1` duotone.
- For a soft tint try `--fig-duo: 0.35; --fig-shadow: var(--blue-800); --fig-highlight: var(--linen)`.
