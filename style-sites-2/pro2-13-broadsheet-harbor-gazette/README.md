# The Harbor Gazette: broadsheet newspaper demo

> **The Harbor Gazette and everything in it is fictional.** Every story, headline, person (including "Mara Ellison" and "Ruth Okafor"), place, number, quotation, tide time and classified ad is invented for a design demo. The address (1 Quay Road, Example Harbor), email (newsroom@example.com) and phone ((555) 555-0100) are placeholders. A banner at the top of the page says so too.

## Concept
A small-town broadsheet front page, built for the web:
- **Masthead:** flag, edition line with today's date, volume number, a weather box and the section rail.
- **Ticker:** an ink bar with a red "Latest" label.
  - It pauses on hover and focus, and has a **Pause/Play button** (WCAG 2.2.2).
  - The list is cloned once (the clone is `aria-hidden`) for a seamless loop.
  - Under reduced motion it becomes a static wrapped list.
- **Multi-column flow:** CSS columns with visible **column rules**, justified and hyphenated text, and **drop caps**. Heavy and hairline rules divide sections, and the grid is a 2:1 lead and side rail.
- **Halftone photos via SVG:** each "photo" is a small grey scene drawn on a hidden canvas and screened into ink dots on a 45° grid (`src/halftone.ts`), so it prints like a real plate.
- **Headlines that typeset in on scroll:** every headline rises word by word as it arrives.
- **"Stop the presses" (pinned):** the late-edition headline is set letter by letter, the photo plate resolves from coarse dots (26px screen) to fine (7px) in discrete steps, the night's press log lights up line by line, and a red **EXTRA** stamp pops.
- **Tides box:** a tide-height chart (cosine-interpolated between sample high and low waters) with a red "Now" dot for the current time, plus the same data as a real `<table>`.
- **Opinion** in three columns and **classifieds** in a ruled grid.

### Design direction
1. Ink on cream, black and white 99% of the time; red only for kickers, the EXTRA stamp and "now".
2. Visible structure: rules are the grid, corners are square, density is high.
3. Old Standard TT (a 19th-century news serif) for flag, headlines and text; Libre Franklin (a news-gothic sans) for kickers, bylines, captions and UI.
4. Motion is editorial: headlines set, plates resolve, the ticker scrolls (pausable).
5. Paper texture comes from a faint fractal-noise tile, never from gradients.

## Color Brief
- **Mood:** authoritative, warm, local.
- **Hue anchors (OKLCH):**
  - **newsprint cream** (0.95 0.02 90), as you specified;
  - **ink** (0.19 0.01 80);
  - **one spot red 25** (0.52 0.19 27).
- **Brand and accent:** the brand is ink (neutral); the one accent hue is the spot red.
- **Harmony:** monochrome warm neutrals plus a single spot colour, like a two-plate press run.
- **60 / 30 / 10, adapted:** about 70% newsprint, about 28% ink, about 2% red.
- **Fixed during the build:** the hairline column rules were too faint at first (2.23:1); they now use neutral-600 (4.39:1).
- **Data colours:** the tide chart is a single ink line. "Now" is a red dot **with a text label**, so colour is never the only signal, and the full data is in a table.

All colours are OKLCH custom properties from `palette.config.mjs`:
- 11-step ramps for the neutral (tinted 90) and red;
- named newsprint, ink and spot;
- semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus`;
- hex fallbacks under `@supports`.

There are no gradients on the page. The halftones use ink dots on paper. The chart area fill is ink at 10% alpha.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| light | `text` | `bg` | Body copy on newsprint | Body text | 16.01:1 | 4.5:1 | Pass |
| light | `text-muted` | `bg` | Bylines, captions | Body text | 9.36:1 | 4.5:1 | Pass |
| light | `text` | `surface-2` | Boxed panels (weather, tides) | Body text | 14.36:1 | 4.5:1 | Pass |
| light | `text-muted` | `surface-2` | Captions in boxes | Body text | 8.40:1 | 4.5:1 | Pass |
| light | `accent` | `bg` | Red kickers | Body text | 5.26:1 | 4.5:1 | Pass |
| light | `accent` | `surface-2` | Red kickers in boxes | Body text | 4.71:1 | 4.5:1 | Pass |
| light | `accent-contrast` | `accent` | EXTRA stamp, ticker label | Body text | 5.26:1 | 4.5:1 | Pass |
| light | `brand-contrast` | `brand` | Inverted ink bars (ticker, buttons) | Body text | 16.01:1 | 4.5:1 | Pass |
| light | `border-soft` | `bg` | Hairline column rules | UI / graphics | 4.39:1 | 3:1 | Pass |
| light | `focus` | `bg` | Focus ring | UI / graphics | 5.26:1 | 3:1 | Pass |

_10 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens: 0.4/0.7/1.0/1.2 s, expo and power3 easing, 75 ms stagger. The pop preset here is a 14px rise with no blur, which suits print.

| Section | Choreography |
|---|---|
| Front page | Headlines **typeset in** word by word (split-text). Deck, byline and photo fade up. The "212 t in a week" **callout pops** with the fishing story; briefs stagger. |
| Ticker | Continuous scroll (48 s per loop), pausable, static under reduced motion. |
| Extra | **Pinned and scrubbed** (≥ 900px, 220% of scroll): letters set, the plate resolves in 5 screen steps, the press log lights, and the **EXTRA stamp pops at the end**. Phones get the same sequence unpinned. |
| Classifieds | Ads stagger in. **Parallax pair:** two gull silhouettes drift at opposite speeds. |

Under reduced motion: static ticker list; finished headline, fine plate and stamp; no pin, parallax or smooth scroll. Without JS all text is present; the halftones need JS, so their frames show the paper colour with captions.

## Skills actually used
- `design-style` (nakanosanku/ohmyskills), **Newsprint** prompt: zero radius, visible grid rules, typographic drama, extreme hierarchy, red used extremely sparingly, paper texture.
- `frontend-design` (julianoczkowski designer-skills), **Editorial / Magazine**: a column grid, drop caps, print-inspired details (folio line, bylines, captions).
- `css-animation-patterns`, `motion-and-interaction-system` (read manually): the pausable marquee and reduced-motion handling.
- **Not available**, so not used: color-expert, web-design-guidelines. The audit used axe-core plus a manual check of the ticker's pause control.

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
Two slots: `lead-lighthouse` (16:9) and `ferry-fog` (4:3). Set `data-photo="assets/images/<file>"`; the default duotone (`--fig-duo: 1`) turns photos into ink on newsprint. See [`public/assets/README.md`](public/assets/README.md). The pinned EXTRA plate is part of the animation and stays generated.

## Verification (what was actually run)
- `npm run build` passes; `npm run contrast`: 10/10 pairs pass.
- Headless Chromium at 375, 768 and 1440 px, with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal scroll (the ticker track is wider than the screen but clipped inside its bar);
  - axe-core: 0 violations after fixes;
  - reduced-motion, no-JS and `?nosda` passes: nothing left hidden.
- Probes:
  - the pinned extra at 1440 px showed the typeset headline, a mid-step halftone plate and the EXTRA stamp;
  - the ticker's Pause button set `animation-play-state: paused`, `aria-pressed="true"` and the label "Play ticker".
- Fixed after the first audit:
  - axe "region": the fictional-content banner and the ticker sat outside any landmark; they are now labelled `<aside>` elements;
  - the letter-by-letter headline could break mid-word ("wil / l"); letters are now grouped in no-wrap words.
- **Not tested:** Safari and Firefox, printing the page, and screen readers.

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-02): no newspaper named "The Harbor Gazette" found (similar: South County Gazette, Harbor Country News).
- The h1 is the lead headline, as on a newspaper front page; the flag is a paragraph styled as the masthead.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
- **Build fix (2026-11-03, after site 19):** `vite.config.ts` now sets `build.cssTarget` to oklch-capable browsers (Chrome/Edge 111, Firefox 113, Safari 16.4). Before this, Vite's CSS minifier rewrote every oklch() token to lab(). Chromium then dropped the hue in `color-mix(in oklch, <lab colour>, transparent)` and tinted translucent surfaces (headers, shadows, glows) slightly pink. Older browsers still use the hex fallbacks. After the change I rebuilt and re-audited at 1440 px (axe, console, reduced motion, no-JS, `?nosda`); new screenshots were not taken.
