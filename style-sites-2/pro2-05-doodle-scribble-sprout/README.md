# Scribble & Sprout: doodle drawing-class demo

> **Scribble & Sprout is a fictional studio.** Classes, prices, the address (Upstairs at 9 Bakery Lane, Example Town), email (hello@example.com) and phone ((555) 555-0100) are invented. There are no testimonials or real children on this page.

## Concept
Drawing classes for kids aged 4 to 11, designed like a sketchbook page:
- graph paper, felt-tip markers, sticky notes with tape;
- wobbly borders and hard pencil shadows;
- handwriting for headings.

Signature features:
- **Hand-built SVG doodles that draw themselves.** Every doodle is hand-written SVG path data with deliberate wobble (`pathLength="1"`, so the dash trick needs no measuring). The hero drawing (a sprout in a pot under a sun) draws stroke by stroke on load. The class icons draw in as they scroll into view, using CSS `animation-timeline: view()` with a GSAP fallback.
- **"How a class goes": a pinned drawing.** Scroll and the picture builds in four stages (squiggles, shapes, sprout, flower and gold star) while the matching step caption swaps. "Gold star!" and "WOW" stickers pop at set points.
- **Doodle stickers pop in:** sticky-note class cards, a star and a note in the hero, all with a rotation overshoot.
- **A working drawing playground** (`src/playground.ts`):
  - **Input:** pointer, touch and stylus drawing (pen pressure supported) with smoothed quadratic strokes.
  - **Tools:** marker colours that overlap with `multiply` like real felt-tips, pencil, three sizes, undo, clear, and **Save PNG** (composited onto graph paper).
  - **Keyboard:** the tools are radio groups with arrow-key navigation, and **Surprise squiggle** draws for anyone not using a pointer.
  - A polite status line announces every action.

### Design direction
1. A real sketchbook: graph paper, tape, sticky notes, nothing perfectly straight.
2. Marker colours are for drawing; pencil graphite carries the reading.
3. Caveat for big marker headings, Patrick Hand for labels and notes, Nunito so grown-ups can read the details easily.
4. Motion means drawing: strokes draw in, stickers slap down; nothing slides for its own sake.
5. Kid-friendly sizes: 44px+ targets and big type; the grown-up information stays plain.

## Color Brief
- **Mood:** bright, playful, safe; a sunny art room.
- **Hue anchors (OKLCH):**
  - **blue marker 255** (brand): headings, primary buttons, focus;
  - **red marker 25** (the one UI accent): kickers, the main CTA (red-700 fill);
  - **green 145** and **yellow 95**: *drawing* colours, used for doodles, swatches and sticky notes, never for text;
  - **graph paper:** warm white with blue-grey grid lines (235).
- **Harmony:** primary-ish marker set (blue, red, yellow, plus green) on a near-neutral paper, held together by graphite outlines.
- **60 / 30 / 10:** 60% paper and grid, 30% graphite (text, outlines, shadows), 10% marker colour, with blue leading.
- **Pastel notes:** four sticky-note tints at L 0.94. Both graphite and muted text are checked on every one.
- **Swatches:** marker swatches carry a 3px graphite outline, so even the yellow marker (low contrast on paper) is identifiable. Blue, red and green swatches also pass 3:1 on their own.

All colours are OKLCH custom properties from `palette.config.mjs`:
- 11-step ramps for neutral (tinted toward 255), blue and red;
- single tokens for the four markers, the four notes, paper and grid;
- semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus`;
- hex fallbacks under `@supports`.

Shadows are solid graphite offsets (the sketch style), never black blur. There are no large gradients, so no grain is needed; the texture is the graph-paper grid. The playground reads the same config to stroke in matching colours.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| light | `text` | `bg` | Body copy on paper | Body text | 13.22:1 | 4.5:1 | Pass |
| light | `text-muted` | `bg` | Secondary copy | Body text | 7.45:1 | 4.5:1 | Pass |
| light | `text` | `grid-strong` | Text crossing a grid line (worst case) | Body text | 8.49:1 | 4.5:1 | Pass |
| light | `text` | `surface` | Cards | Body text | 13.69:1 | 4.5:1 | Pass |
| light | `text-muted` | `surface` | Card captions | Body text | 7.71:1 | 4.5:1 | Pass |
| light | `text` | `note-yellow` | Text on yellow sticky note | Body text | 11.89:1 | 4.5:1 | Pass |
| light | `text-muted` | `note-yellow` | Muted text on yellow note | Body text | 6.70:1 | 4.5:1 | Pass |
| light | `text` | `note-green` | Text on green sticky note | Body text | 11.74:1 | 4.5:1 | Pass |
| light | `text-muted` | `note-green` | Muted text on green note | Body text | 6.61:1 | 4.5:1 | Pass |
| light | `text` | `note-blue` | Text on blue sticky note | Body text | 11.50:1 | 4.5:1 | Pass |
| light | `text-muted` | `note-blue` | Muted text on blue note | Body text | 6.48:1 | 4.5:1 | Pass |
| light | `text` | `note-pink` | Text on pink sticky note | Body text | 11.38:1 | 4.5:1 | Pass |
| light | `text-muted` | `note-pink` | Muted text on pink note | Body text | 6.41:1 | 4.5:1 | Pass |
| light | `brand-text` | `bg` | Blue headings, links | Body text | 6.97:1 | 4.5:1 | Pass |
| light | `accent-text` | `bg` | Red labels | Body text | 7.50:1 | 4.5:1 | Pass |
| light | `brand-contrast` | `brand` | Blue button | Body text | 5.57:1 | 4.5:1 | Pass |
| light | `accent-contrast` | `accent-text` | Red button (red-700 fill) | Body text | 7.76:1 | 4.5:1 | Pass |
| light | `border` | `bg` | Pencil outlines on controls | UI / graphics | 13.22:1 | 3:1 | Pass |
| light | `focus` | `bg` | Focus ring | UI / graphics | 6.97:1 | 3:1 | Pass |
| light | `marker-blue` | `bg` | Blue marker swatch | UI / graphics | 5.38:1 | 3:1 | Pass |
| light | `marker-red` | `bg` | Red marker swatch | UI / graphics | 4.23:1 | 3:1 | Pass |
| light | `marker-green` | `bg` | Green marker swatch | UI / graphics | 3.06:1 | 3:1 | Pass |

_22 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens: 0.4/0.7/1.0/1.2 s, expo and power3 easing, 75 ms stagger, the pop preset, and the badge pop for stickers.

| Section | Choreography |
|---|---|
| Hero | Split-text h1. A red double underline **draws in**, then the hero drawing draws stroke by stroke (160 ms apart) and its fills fade in after. A star sticker and an age note **pop at 1.4 s and 1.6 s**. |
| Classes | Sticky notes pop in staggered with a rotation overshoot; each note's icon **draws in on scroll** (CSS `view()`, GSAP fallback). |
| How a class goes | **Pinned and scrubbed** (≥ 880px, 260% of scroll): four drawing stages and their captions. Stickers **pop at timeline 2.9 and 3.6**. Phones get the same drawing scrub, unpinned, next to the full list. |
| Playground | Interaction only. The surprise squiggle draws progressively (instant under reduced motion). |
| Grown-ups | **Parallax pair:** a paper plane and a cloud doodle drift at opposite speeds. FAQ cards stagger. |
| Sign up | Split-text heading and a fade-up. |

Progressive enhancement: without JS every stroke is complete and all text is visible. Under reduced motion, drawings are complete and there is no pin, parallax or smooth scroll.

## Skills actually used
- `design-style` (nakanosanku/ohmyskills), **Sketch** prompt: wobbly border-radius, hard offset shadows, small rotations, tape and sticky notes, handwritten type.
- `doodle` (bergside): playful hand-drawn language with accessibility gates.
- `frontend-design` (julianoczkowski): a committed direction, mobile-first, 44px targets.
- `css-animation-patterns` (oakoss): `view()` timelines and the stroke-dashoffset draw pattern.
- `motion-and-interaction-system` (read manually): reduced-motion rules, one cinematic sequence.
- **Not available**, so not used: gsap-web, taste-skill, accesslint. The accessibility audit used axe-core.

## Run and build
```bash
npm install
npm run dev
npm run build
npm run preview
npm run palette
npm run contrast
```

## Swap in your own photos
`hero-drawing` (5:4) is the image slot. Set `data-photo="assets/images/<file>"` and the photo replaces the hand-drawn doodle. See [`public/assets/README.md`](public/assets/README.md). Only use photos of children with their guardians' consent.

## Verification (what was actually run)
- `npm run build` passes; `npm run contrast`: 22/22 pairs pass.
- Headless Chromium at 375, 768 and 1440 px, with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal scroll;
  - axe-core: 0 violations;
  - reduced-motion, no-JS and `?nosda` passes: nothing left hidden.
- Playground probe: a mouse-drawn line, a red surprise squiggle, arrow-key colour selection (focus and `aria-checked` moved to "Green marker") and undo all worked; the status line updated.
- Fixed after the first audit:
  - Marker strokes looked beaded because each segment's round caps multiplied over each other. Strokes now composite once per line.
  - In the pinned drawing, leaf and flower fills appeared before their outlines; fills now fade in with each stage.
- **Not tested:** real touch and stylus input (pressure handling is untested on hardware), the PNG download in a real browser, Safari and Firefox, and screen readers.

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-02): no "Scribble & Sprout" found. Similar names exist (Scribble & Scribe, Scribbles & Strokes), so the name was kept as is.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`). Patrick Hand has only a regular weight, so red buttons use the darker red-700 to pass 4.5:1 rather than relying on a large-text exception.
- **Build fix (2026-11-03, after site 19):** `vite.config.ts` now sets `build.cssTarget` to oklch-capable browsers (Chrome/Edge 111, Firefox 113, Safari 16.4). Before this, Vite's CSS minifier rewrote every oklch() token to lab(). Chromium then dropped the hue in `color-mix(in oklch, <lab colour>, transparent)` and tinted translucent surfaces (headers, shadows, glows) slightly pink. Older browsers still use the hex fallbacks. After the change I rebuilt and re-audited at 1440 px (axe, console, reduced motion, no-JS, `?nosda`); new screenshots were not taken.
