# Image slots: Echoes of Static

Every cover is a reusable `figure.media` slot. When no photo is present it shows the generated cover: an OKLCH radial gradient plus canvas rings and static. When you add a photo, it lazy-loads, blurs up from the slot's dominant colour, and gets a duotone tint in that track's hue (`--h`), so any photo matches the palette.

| Slot (`data-slot`) | Where | Aspect | Recommended size |
|---|---|---|---|
| `art-carrier-wave` | Track 01 cover | 1 : 1 | 1200 × 1200 |
| `art-dial-tone-bloom` | Track 02 cover | 1 : 1 | 1200 × 1200 |
| `art-night-bus-static` | Track 03 cover | 1 : 1 | 1200 × 1200 |
| `art-glass-antenna` | Track 04 cover | 1 : 1 | 1200 × 1200 |
| `art-undertow-fm` | Track 05 cover | 1 : 1 | 1200 × 1200 |
| `art-last-broadcast` | Track 06 cover | 1 : 1 | 1200 × 1200 |

## How to swap

1. Put the files in `public/assets/images/` (JPG or WebP, under about 250 KB each).
2. Map slots to files in `public/assets/images/photos.json`:

   ```json
   { "art-carrier-wave": "carrier-wave.jpg", "art-glass-antenna": "glass-antenna.webp" }
   ```

3. **Tint.** Adjust the tint per figure with `--tint-strength` (0 to 1) in the figure's `style`. The duotone colours come from `--duo-dark` and `--duo-light`, which follow the track hue.

Only use photos you have the rights to. The repository ships with none.
