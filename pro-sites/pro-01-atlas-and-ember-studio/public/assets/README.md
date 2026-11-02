# Image slots: Atlas & Ember

Every image on the site is a `<Media>` slot (`components/Media.tsx`). Until a photo is supplied, each slot shows its procedural artwork.

## Adding a photo

1. Put the file in `public/assets/images/`, for example `public/assets/images/work-halden.jpg`.
2. Map the slot name to the file in `public/assets/images/photos.json`:
   ```json
   { "work-halden-observatory": "work-halden.jpg" }
   ```
3. Reload the page. The static export reads the manifest at runtime, so no rebuild is needed.

Photos are lazy-loaded and blur up when they arrive. A CSS duotone (`data-tint="ember"` or `"bone"`) maps them into the palette. To change how strong the tint is, set `--tint-strength` on the figure: `0` gives the original colours, `1` the full duotone.

## Slots

| Slot | Where | Aspect ratio | Recommended size |
|---|---|---|---|
| `work-halden-observatory` | Home gallery card | 4:5 | 1200 × 1500 |
| `work-saltworks-ferry` | Home gallery card | 4:5 | 1200 × 1500 |
| `work-kiln-and-quarry` | Home gallery card | 4:5 | 1200 × 1500 |
| `work-verdant-seed-archive` | Home gallery card | 4:5 | 1200 × 1500 |
| `work-noct-audio` | Home gallery card | 4:5 | 1200 × 1500 |
| `home-studio` | Home "Inside the studio" | 5:4 | 1600 × 1280 |
| `about-hero` | About hero | 16:10 | 2000 × 1250 |
| `case-<slug>-hero` (one per project) | Case study hero | 16:9 | 2400 × 1350 |
| `case-<slug>-1` (one per project) | Case study step 1 | 4:3 | 1600 × 1200 |
| `case-<slug>-2` (one per project) | Case study step 2 | 4:5 | 1200 × 1500 |
| `case-<slug>-3` (one per project) | Case study step 3 | 4:3 | 1600 × 1200 |

`<slug>` is one of `halden-observatory`, `saltworks-ferry`, `kiln-and-quarry`, `verdant-seed-archive` or `noct-audio`.

Use JPEG or WebP at about 80% quality. Keep the subject inside the central 80% of the frame, because `object-fit: cover` crops the edges at some widths.
