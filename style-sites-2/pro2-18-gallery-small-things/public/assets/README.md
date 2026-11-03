# Image slots

This site has no photo slots on purpose: every artwork is generated in the browser by `src/works.ts` from a rule and a seed, and that is the point of the exhibition.

To show **real artworks** instead (a photographed collection), replace the `<canvas>` inside a frame's `.frame__mat` with an `<img>`:

| Where | Element | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| Hero work | `.hero__work .frame__mat` | 4:5 | 1000 × 1250 px | |
| Corridor, works 1–8 | `.exhibit .frame__mat` | from each exhibit's `--ar` (4:5, 1:1 or 5:4) | 1200 px on the long side | Keep `--ar` and `--arn` in step with the image. |
| About miniatures | `.mini .frame__mat` | 1:1 | 600 × 600 px | |
| Detail view | `[data-detail-canvas]` | follows the exhibit | 2000 px on the long side | Swap the `paint()` call in `initDetail` for setting the image `src`. |

Give each `<img>` `width: 100%; height: 100%; object-fit: cover` and real alt text, and remove `aria-hidden`. The frame, mat and picture light stay as they are.
