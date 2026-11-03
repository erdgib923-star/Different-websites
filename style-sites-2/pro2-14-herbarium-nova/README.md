# Herbarium Nova: procedural natural-history plates demo

> **Every plant in Herbarium Nova is fictional.** The species (*Nova filix*, *Lumen cordata*, *Sepia arborea*, *Verdigris spiralis*, *Ventosa minor*, *Candela repens*), common names, habitats, specimen numbers, collecting dates, email (curator@example.com) and phone ((555) 555-0100) are invented.

## Concept
A natural-history book of imaginary plants, each **grown from an L-system** and **drawn stroke by stroke as you scroll**:
- **Procedural plants** (`src/lsystem.ts`):
  - Each grammar is rewritten 4–6 generations, then a turtle walks the string (`F` forward, `+`/`−` turn, `[`/`]` branch).
  - The whole plant is **one SVG path in turtle order**. Dashes run continuously along a path, and `moveTo` gaps add no length, so animating `stroke-dashoffset` from 1 to 0 draws the plant in the exact order it grew.
  - Seeded angle jitter makes each plant organic but reproducible.
- **Numbered labels with leader lines pop in:** every leaf, flower and label stores its fraction `f` along the drawing. Leaves sprout and flowers open as the pen passes them. The three vermilion labels (terminal frond, lateral node, rhizome) appear when the pen reaches that part, and Plate I's legend lines light up with them.
- **Plate I is pinned and scrubbed.** Plates II–IV draw with **CSS scroll-driven animation**: a named `view-timeline` on the plate, with each leaf's `animation-range` computed from its `--f`. A GSAP ScrollTrigger fallback covers browsers without scroll timelines.
- **Specimen-drawer index:** a wooden cabinet of six drawers with brass label holders.
  - Each drawer is a real `button` with `aria-expanded` and `aria-controls`, and only one is open at a time.
  - Opening one slides it forward and reveals a freshly grown thumbnail, the habitat and collecting date, and a link to its plate if it has one.

### Design direction
1. A 19th-century plate book: parchment, sepia line, careful labels.
2. Science as craft: each plate shows its own growth rule.
3. IM Fell English (an old-style face cut in the 1670s) for titles; Cormorant Garamond for reading.
4. Motion is the pen: lines draw, leaves sprout, labels arrive. Nothing bounces.
5. The index is a physical object you open, not a list.

## Color Brief
- **Mood:** scholarly, warm, quiet curiosity.
- **Hue anchors (OKLCH):**
  - **parchment 85** (paper);
  - **sepia 60** (text and line-work);
  - **verdigris 175** (brand): leaves, Latin names, links;
  - **vermilion 30** (the one accent): numbered labels, flowers, plate numbers.
- **Harmony:** an earthy warm base with a complementary pair: cool verdigris against warm vermilion.
- **60 / 30 / 10:** 60% parchment, 30% sepia line and text, 10% verdigris and vermilion.
- **Neutral ramp:** tinted toward sepia (65), the ink of the plates, rather than verdigris. Parchment and ink are the "neutrals" of a plate book, and that reads truer to the style.
- **Labels:** parchment numerals on vermilion discs pass 4.5:1. The leader lines use the sepia line colour, which passes 3:1.

All colours are OKLCH custom properties from `palette.config.mjs`:
- 11-step ramps for neutral, verdigris and vermilion;
- named parchment, sepia, verdigris, vermilion and brass;
- semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus`;
- hex fallbacks under `@supports`.

Paper texture is a static fractal-noise tile. Shadows are sepia-tinted. There are no large gradients.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| light | `text` | `bg` | Body copy on parchment | Body text | 11.18:1 | 4.5:1 | Pass |
| light | `text-muted` | `bg` | Captions, legends | Body text | 6.58:1 | 4.5:1 | Pass |
| light | `text` | `surface-2` | Drawer fronts | Body text | 9.73:1 | 4.5:1 | Pass |
| light | `text-muted` | `surface-2` | Drawer labels | Body text | 5.72:1 | 4.5:1 | Pass |
| light | `text` | `parchment-3` | Open drawer interior | Body text | 8.40:1 | 4.5:1 | Pass |
| light | `brand` | `bg` | Verdigris links and Latin names | Body text | 5.74:1 | 4.5:1 | Pass |
| light | `accent-text` | `bg` | Vermilion plate numbers | Body text | 6.46:1 | 4.5:1 | Pass |
| light | `accent-contrast` | `accent` | Numbered label discs | Body text | 4.61:1 | 4.5:1 | Pass |
| light | `brand-contrast` | `brand` | Verdigris buttons | Body text | 5.74:1 | 4.5:1 | Pass |
| light | `border` | `bg` | Plate frames, leader lines | UI / graphics | 6.32:1 | 3:1 | Pass |
| light | `focus` | `bg` | Focus ring | UI / graphics | 8.10:1 | 3:1 | Pass |
| light | `verdigris` | `bg` | Leaves as graphics | UI / graphics | 3.41:1 | 3:1 | Pass |

_12 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens (0.4/0.7/1.0/1.2 s, expo and power3 easing, 75 ms stagger, pop preset without blur).

| Section | Choreography |
|---|---|
| Title page | Split-text title; subtitle, ornament and note fade up. |
| Plate I | **Pinned and scrubbed** (≥ 900px, 200% of scroll): the stem draws, leaves sprout, and labels 1–3 and their legend lines **pop at the scroll position where the pen reaches each part**. |
| Plates II–IV | Scroll-driven drawing via `animation-timeline: --plate` (view timeline), with per-leaf ranges. GSAP fallback. |
| Drawers | Cabinet drawers pop in staggered; opening one slides it out (transform) and reveals the body. |
| Preface | **Parallax pair:** two pressed specimens drift at opposite speeds. |

Under reduced motion every plate shows fully drawn, and there is no pin, parallax or smooth scroll. Without JS all text, the legend, rules and drawer labels are absent or static. The plates and drawers need JS to grow the plants: plate frames show parchment with their captions, but the drawer cabinet is built by JS, so it is empty without it.

## Skills actually used
- `p5js` (nousresearch/hermes-agent): seeded generation, "parameters that change how the algorithm thinks" (each species is a grammar, angle and generation count, not a colour preset), and per-element timing derived from the algorithm (`f`). The p5 library is not used: an SVG path is what makes the stroke-by-stroke reveal possible.
- `frontend-design` (julianoczkowski designer-skills): Editorial plate layout and a committed direction.
- `css-animation-patterns` (oakoss): named view timelines and computed `animation-range`.
- `motion-and-interaction-system` (read manually).
- **Not available**, so not used: color-expert, scroll-experience. The audit used axe-core.

## Run and build
```bash
npm install
npm run dev
npm run build
npm run preview
npm run palette
npm run contrast
```
To add a species, add an entry to `SPECIES` in `src/lsystem.ts` and a `data-species` figure in `index.html`.

## Swap in your own photos
Four plate slots (`plate-i` … `plate-iv`, 400:520 portrait). Set `data-photo="assets/images/<file>"` to show a scan of a real herbarium sheet instead of the generated drawing. See [`public/assets/README.md`](public/assets/README.md).

## Verification (what was actually run)
- `npm run build` passes; `npm run contrast`: 12/12 pairs pass.
- Headless Chromium at 375, 768 and 1440 px, with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal scroll;
  - axe-core: 0 violations;
  - reduced-motion and no-JS passes: nothing left hidden.
- Probes at 1440 px:
  - halfway through the Plate I pin, the fern was partly drawn, labels 2 and 3 were lit, and label 1 (the top frond, drawn last) was not yet;
  - Plate III was drawn by the CSS view timeline as it crossed the viewport;
  - drawer No. 052 opened (`aria-expanded="true"`, body shown) with a freshly grown thumbnail.
- `?nosda` (forced JS fallback) pass:
  - after an instant jump to the page bottom, the preface text revealed about 1.5 s late, then finished;
  - I traced the delay to Lenis easing toward the jumped-to position;
  - I also made the fallback cheaper: plate nodes are cached and only changed elements are touched per scroll update.
- **Not tested:** Safari and Firefox (Firefox uses the GSAP fallback), real devices, and screen readers.

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-02): no herbarium called "Herbarium Nova" found (results were Nova Scotia herbaria).
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
