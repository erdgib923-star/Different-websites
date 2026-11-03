# Museum of Small Things: "Small Rules" corridor exhibition

> **Everything here is fictional.** The museum on this page, the exhibition *Small Rules*, the eight artists, the address (12 Example Lane, Example City), visit@example.com, (555) 555-0100 and the dates are invented. **Name note:** a real gift shop in Brisbane, Australia, trades as "The Museum of Small Things". This demo has no connection to it. If this design were used for real, the name would need to change.

## Concept
A small museum's exhibition of **eight generative drawings**, each made by a rule short enough to fit on a postcard:
- **The corridor:** on wide screens the section **pins** and the wall slides past as you scroll, a horizontal walk.
  - Each work hangs in a **charcoal frame with a white mat** under a brass picture light, with a **wall label** beside it (number, title, artist, year, medium and the rule in italics).
  - The wall picks up a **faint tint of the exhibit in front of you**, and a counter tracks it (3 / 8).
  - On phones it becomes a swipe strip with scroll-snap (keyboard-scrollable).
- **Spotlight follows the cursor:** on fine pointers, the wall dims slightly except in a soft circle around the pointer.
- **Click for detail:** each frame is a button that opens a modal `<dialog>` with the work redrawn large from the same seed, its label and rule, and Previous/Next.
  - Arrow keys page through the works; Escape, the × button or a backdrop click closes it.
  - Focus returns to the frame you opened.
- **Eight works** (`src/works.ts`): flow field, circle packing, Truchet tiles, recursive subdivision, moiré, noise contours, grid random walks, and stippled sphere. Each uses only paper, charcoal and **its own exhibit hue**.
- **About** with a **parallax pair** of miniatures; **Visit** with hours and entry.

### Design direction
1. A white-walled gallery at opening time: quiet, lit, unhurried.
2. The works carry all the colour; the UI is paper and charcoal.
3. Newsreader, an editorial serif, for titles and rules; Space Grotesk for labels and wayfinding, the voice of museum signage.
4. Motion is walking: the wall passes, labels arrive, the light follows you.
5. Minimal, with a 4/8/12/16/24/32 spacing rhythm.

## Color Brief
- **Mood:** calm, attentive, bright, curious.
- **Hue anchors (OKLCH):**
  - **gallery white** (80, chroma 0.004–0.008);
  - **charcoal** (60, L 0.24);
  - **bronze 60** (brand, very low chroma: the museum's own mark, kickers, the picture-light bars);
  - **gallery blue 255** (the UI accent: links, buttons, focus).
- **Exhibit hues:** the brief asks for **one accent hue per exhibit**. These eight are the art, not the UI:
  - `ex-1` red 27, `ex-2` orange 55, `ex-3` ochre 88, `ex-4` green 145, `ex-5` teal 190, `ex-6` blue 245, `ex-7` violet 290, `ex-8` magenta 345;
  - they are spaced around the wheel at L 0.52–0.60, so each passes 3:1 as a label dot on the wall.
  - Each appears only in its own work, its label's rule line and dot, and the corridor tint.
- **Harmony:** an achromatic stage with a full but controlled spectrum of single accents.
- **60 / 30 / 10:** 60% wall white, 30% charcoal (type, frames, floor), 10% the exhibit hues.
- **Neutral ramp:** tinted toward warm 70 (chroma 0.008), so the white reads as painted plaster.
- **Colour-blind safety:** the hues never carry information alone. Every exhibit has a number, a title and its position.

All colours are OKLCH custom properties from `palette.config.mjs`:
- 11-step ramps;
- named wall, floor, charcoal, bronze, gallery-blue and `ex-1`…`ex-8`;
- semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `brand`, `brand-contrast`, `accent`, `accent-contrast`, `focus`, `shadow-color`;
- hex fallbacks under `@supports`.

The corridor wall is a gradient `in oklch` with an SVG noise grain. The `--tint` is a registered `@property` colour, so it transitions smoothly. Shadows are charcoal-tinted.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| light | `text` | `bg` | Body copy, wall labels | Body text | 15.33:1 | 4.5:1 | Pass |
| light | `text-muted` | `bg` | Label details (medium, year) | Body text | 7.24:1 | 4.5:1 | Pass |
| light | `text` | `surface-2` | Detail dialog | Body text | 12.67:1 | 4.5:1 | Pass |
| light | `text-muted` | `surface-2` | Dialog captions | Body text | 5.99:1 | 4.5:1 | Pass |
| light | `brand` | `bg` | Bronze kickers | Body text | 6.15:1 | 4.5:1 | Pass |
| light | `accent` | `bg` | Links | Body text | 6.15:1 | 4.5:1 | Pass |
| light | `accent-contrast` | `accent` | Buttons | Body text | 6.15:1 | 4.5:1 | Pass |
| light | `wall` | `floor` | Text on the corridor floor | Body text | 10.08:1 | 4.5:1 | Pass |
| light | `border` | `bg` | Frames, rules | UI / graphics | 3.40:1 | 3:1 | Pass |
| light | `focus` | `bg` | Focus ring | UI / graphics | 6.15:1 | 3:1 | Pass |
| light | `ex-1` | `bg` | Exhibit 1 label dot | UI / graphics | 4.32:1 | 3:1 | Pass |
| light | `ex-2` | `bg` | Exhibit 2 label dot | UI / graphics | 3.86:1 | 3:1 | Pass |
| light | `ex-3` | `bg` | Exhibit 3 label dot | UI / graphics | 3.68:1 | 3:1 | Pass |
| light | `ex-4` | `bg` | Exhibit 4 label dot | UI / graphics | 3.47:1 | 3:1 | Pass |
| light | `ex-5` | `bg` | Exhibit 5 label dot | UI / graphics | 3.49:1 | 3:1 | Pass |
| light | `ex-6` | `bg` | Exhibit 6 label dot | UI / graphics | 4.46:1 | 3:1 | Pass |
| light | `ex-7` | `bg` | Exhibit 7 label dot | UI / graphics | 5.43:1 | 3:1 | Pass |
| light | `ex-8` | `bg` | Exhibit 8 label dot | UI / graphics | 4.39:1 | 3:1 | Pass |

_18 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens (0.4/0.7/1.0/1.2 s, expo and power3 easing, 75 ms stagger, pop preset without blur).

| Section | Choreography |
|---|---|
| Hero | Split-words title; sub, lead and button rise in sequence; the hero work **clip-reveals** (a wipe up). |
| Corridor | **Pinned horizontal scrub** (≥ 900px): the wall slides 1:1 with scroll. Each label's **number badge pops** as it comes into view; the wall tint cross-fades (0.8 s) to the exhibit in front. |
| Spotlight | Follows a fine pointer directly (no lag), with a 0.5 s fade in and out. |
| Detail | The dialog rises in; Previous/Next re-run a short rise on the art and text. |
| About | **Parallax pair:** miniatures at -0.4 / +0.35; split heading, paragraphs rise. |
| Visit | Cards pop in a stagger. |

- **Smooth scroll:** Lenis. The dialog is excluded with `data-lenis-prevent`, and page scroll is locked while it is open.
- **Reduced motion:**
  - no pin (a native horizontal strip), no spotlight, no parallax, no smooth scroll;
  - pops show their final state at once.
- **No JS:** frames show their placeholder tint (the art needs JS), and every label is fully readable.

## Skills actually used
- `minimal` (bergside, loaded for this site): the 4/8/12/16/24/32 spacing, a restrained palette, explicit states, WCAG 2.2 AA. Its Open Sans and Inter were replaced by the brief's Newsreader + Space Grotesk.
- `p5js` (loaded earlier in this session): seeded, parameter-driven generative systems. The p5 library itself is not used; the works are plain Canvas 2D.
- `frontend-design` and `css-animation-patterns` (loaded earlier in this session) and `motion-and-interaction-system` (read manually).
- **Not available**, so not used: gsap, color-expert, accesslint, web-design-guidelines. The audit used axe-core.

## Run and build
```bash
npm install
npm run dev
npm run build
npm run preview
npm run palette
npm run contrast
```
To add a work, write a `Draw` function in `src/works.ts`, add it to `WORKS`, and add an `<li class="exhibit">` with `data-work`, `data-seed`, `data-hue` and `--ar`/`--arn`.

## Swap in real artworks
See [`public/assets/README.md`](public/assets/README.md). The art is canvas by design, so there are no `data-photo` slots; the file explains how to hang photographed works in the same frames.

## Verification (what was actually run)
- `npm run build` passes; `npm run contrast`: 18/18 pairs pass, including all eight exhibit dots at 3:1 or more.
- Headless Chromium at 375, 768 and 1440 px, with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal page scroll;
  - axe-core: 0 violations;
  - reduced-motion, no-JS and `?nosda` passes: nothing left hidden.
- Probes at 1440 px:
  - partway through the pin, the corridor showed works 3–4 with the counter at 3 / 8 and a visible cursor spotlight;
  - focusing frame 3 and pressing Enter opened the dialog ("Nine by Nine", canvas redrawn at 457 px);
  - Escape closed it and returned focus to frame 3;
  - ArrowRight moved to the next work.
- Fixed before the first commit, from the screenshots:
  - the wall labels overlapped the dark floor band, so the floor is now a separate strip below the track;
  - the dialog was not centred (the CSS reset removed `margin: auto`);
  - the picture-light cone had hard edges;
  - the moiré work was too dense and shimmery, so its rings are wider and softer.
- **Not tested:** Safari and Firefox, touch swiping on the strip (only a programmatic scroll was tested), real devices, screen readers.

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check: see the name note at the top (a Brisbane gift shop uses the name).
- The cursor spotlight dims the wall by at most 16% charcoal, away from the pointer. Label text far from the cursor is slightly lower in contrast while the spotlight is on. It is only enabled for fine pointers with motion allowed, and it fades out when the pointer leaves the corridor.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
