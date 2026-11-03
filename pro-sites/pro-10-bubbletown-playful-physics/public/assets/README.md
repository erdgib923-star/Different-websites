# Image slots: Bubbletown

Every toy picture is a reusable `figure.media` slot. When no photo is present it shows the procedural SVG toy. When you add a photo, it lazy-loads, blurs up from the cream `--dominant` colour, and is **duotoned**: plum shadows (`--duo-dark: var(--brand-800)`) grading to that toy's own pastel (`--duo-light: var(--p-…)`, set on each figure). Any photo then matches the palette.

| Slot (`data-slot`) | Where | Aspect | Recommended size |
|---|---|---|---|
| `toy-pip` | Card: Pip the Bear (peach) | 1 : 1 | 1000 × 1000 |
| `toy-juniper` | Card: Juniper Cloud (sky) | 1 : 1 | 1000 × 1000 |
| `toy-bo` | Card: Bo Bunny (rose) | 1 : 1 | 1000 × 1000 |
| `toy-tilly` | Card: Tall Tilly (mint) | 1 : 1 | 1000 × 1000 |
| `toy-nova` | Card: Nova Star (butter) | 1 : 1 | 1000 × 1000 |
| `toy-remy` | Card: Round Remy (lilac) | 1 : 1 | 1000 × 1000 |

The toy box, stickers, maker bubble and builder preview are interactive or generated art, not photo slots.

## How to swap

1. Put the files in `public/assets/images/` (JPG or WebP, under about 200 KB each). Product shots on a plain light background work best.
2. Map slots to files in `public/assets/images/photos.json`:

   ```json
   { "toy-pip": "pip.jpg", "toy-juniper": "juniper.webp" }
   ```

3. **Tint.** Lower `--tint-strength` (0 to 1) in a figure's `style` to show more of the photo's own colour. The default of 1 is a full duotone.

The photo's `alt` text comes from the figure's `aria-label`. Only use photos you have the rights to; the repository ships with none.
