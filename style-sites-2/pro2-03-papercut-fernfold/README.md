# Fernfold Journeys: papercut woodland tours demo

> **Fernfold Journeys is a fictional company and the Fernfold Valley is an invented place.** The walks, prices, address (The Old Mill, 1 Weir Lane, Example Valley), email (walks@example.com) and phone ((555) 555-0100) are sample content.

## Concept
A small-group woodland walking company, told as a **paper diorama**:
- **Hero: eight cut-paper layers.** In order: sky with sun, far hills, near hills, a back pine row, a winding river, a middle pine row, big foreground pines and fern fronds. Each layer is one SVG path, **generated procedurally** from a seeded random generator (`src/paper.ts`), so the valley is identical on every load. Each layer casts a tinted drop shadow and catches a thin top-edge highlight, as if lit from above.
- **Pinned "walk into the fold".** Scroll and the hero holds while you walk in: nearer layers grow and drop away faster than far ones (eight parallax speeds), the headline lifts away, and a caption appears.
- **Four seasonal walks.** Each has its own five-layer diorama that **folds up from its bottom edge and slides into place** as it scrolls into view, like a pop-up book.
- **The palette shifts through the seasons.** As you scroll from spring to winter, every paper colour is interpolated in **OKLCH** (`src/seasons.ts`): lightness and chroma linearly, hue the shortest way round. This covers the hero, logo, season nav and decorative leaves. A season "holds" near its own section, then blends into the next.

### Design direction
1. A paper theatre of one valley: layers, cast shadows, hand-cut curves, paper grain.
2. Colour is the season, and the season is your scroll position.
3. Fraunces (soft, slightly "wonky" serif) for warmth; DM Sans for clear practical details.
4. Motion is spatial: walk in, layers unfold, nothing spins.
5. Practical facts (distance, time, level, price) sit on paper chips, never hidden in prose.

## Color Brief
- **Mood:** calm, outdoorsy, crafted; a valley at different times of year.
- **Hue anchors (OKLCH):**
  - **forest 150** (brand): text and buttons;
  - **mustard 90** (the one accent): tags, tape, the booking button;
  - **teal 195**: sky and water in the illustrations, plus the focus ring;
  - **cream** paper (0.965 0.022 90).
- **Harmony:** analogous greens with a warm mustard counterpoint. Teal is the cool neighbour of forest, used for illustration and focus only, never for text.
- **60 / 30 / 10:** 60% cream paper, 30% forest (text, illustration, booking band), 10% mustard.
- **Seasons:** spring, summer, autumn and winter each define eight layer colours (sky, far, mid, back, water, front, leaf, sun) in `palette.config.mjs`. That one file generates the static tokens (with hex fallbacks) and is also imported by `seasons.ts`, which gamut-maps the values the same way and interpolates them at runtime. Without OKLCH support the page simply stays in spring.
- **Contrast with moving colours:** the shifting colours are illustration only. Text colours are fixed. The one place text sits on a seasonal colour (the hero title and lead on the sky) is checked against all four skies.

All colours are OKLCH custom properties with `@supports` hex fallbacks:
- 11-step ramps: neutral (tinted toward 150), forest, mustard, teal;
- semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus`.

Shadows mix brand-950, never black. Gradients use `in oklch`. A fixed paper-grain layer covers the whole page, and the hero and booking band get extra grain.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| light | `text` | `bg` | Body copy on cream | Body text | 15.43:1 | 4.5:1 | Pass |
| light | `text-muted` | `bg` | Secondary copy | Body text | 7.16:1 | 4.5:1 | Pass |
| light | `text` | `surface` | Paper cards | Body text | 16.38:1 | 4.5:1 | Pass |
| light | `text-muted` | `surface` | Card captions | Body text | 7.60:1 | 4.5:1 | Pass |
| light | `text-muted` | `surface-2` | Fact chips | Body text | 6.65:1 | 4.5:1 | Pass |
| light | `brand-contrast` | `brand` | Primary button | Body text | 6.50:1 | 4.5:1 | Pass |
| light | `accent-contrast` | `accent` | Mustard badges | Body text | 6.62:1 | 4.5:1 | Pass |
| light | `accent-text` | `bg` | Eyebrow labels | Body text | 9.02:1 | 4.5:1 | Pass |
| light | `brand` | `bg` | Links | Body text | 6.12:1 | 4.5:1 | Pass |
| light | `border-strong` | `surface` | Form field outline | UI / graphics | 4.81:1 | 3:1 | Pass |
| light | `focus` | `bg` | Focus ring | UI / graphics | 6.21:1 | 3:1 | Pass |
| light | `focus` | `surface` | Focus ring on cards | UI / graphics | 6.59:1 | 3:1 | Pass |
| light | `text` | `spring-sky` | Hero title on spring sky | Large text | 14.14:1 | 3:1 | Pass |
| light | `text` | `summer-sky` | Hero title on summer sky | Large text | 12.91:1 | 3:1 | Pass |
| light | `text` | `autumn-sky` | Hero title on autumn sky | Large text | 13.48:1 | 3:1 | Pass |
| light | `text` | `winter-sky` | Hero title on winter sky | Large text | 14.82:1 | 3:1 | Pass |
| light | `text` | `spring-sky` | Hero lead on spring sky | Body text | 14.14:1 | 4.5:1 | Pass |
| light | `text` | `summer-sky` | Hero lead on summer sky | Body text | 12.91:1 | 4.5:1 | Pass |
| light | `paper` | `brand-900` | Booking band text | Body text | 12.73:1 | 4.5:1 | Pass |

_19 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens: 0.4/0.7/1.0/1.2 s, expo-out and power3-out, 75 ms stagger, and the pop preset (`src/styles/motion.css`, `src/lib/motion.ts`).

| Section | Choreography |
|---|---|
| Hero | Split-text h1; staggered lead and CTAs. **Pinned and scrubbed** "walk in" (120% of scroll) with eight depth-weighted parallax layers. |
| Walks | Each diorama **folds up layer by layer**: CSS `animation-timeline: view()` with staggered `animation-range`, and a GSAP ScrollTrigger scrub fallback. Two layers slide in from opposite sides. Season tags **pop with overshoot** as each walk arrives. Fact chips stagger. |
| How | **Parallax pair:** two paper leaves drift at opposite speeds (CSS scroll-driven, GSAP fallback). The three taped paper cards pop in staggered. |
| Book | Split-text heading and a fade-up. |
| Global | Season colours interpolate continuously with scroll; Lenis smooth scrolling runs on the GSAP ticker. |

Progressive enhancement:
- Without JS: all text, the walks and the form are readable. The procedural dioramas need JS, so the hero shows its sky colour and each walk card shows its season's sky.
- Under reduced motion: no pin, no dive, no fold-in, no parallax, no smooth scroll; content shows in its final state. The season colours still follow the scroll, because that is a colour change, not movement.

## Skills actually used
- `design-style` (nakanosanku/ohmyskills), **Botanical** prompt: earthbound palette, mandatory paper grain, slow and graceful motion, staggered rhythm.
- `css-animation-patterns` (oakoss): the `view()` timeline and `animation-range` patterns behind the fold-in, and the rule that `animation-timeline` goes after the `animation` shorthand.
- `motion-and-interaction-system` (SKILL.md read manually): one cinematic sequence (the dive) and mandatory reduced motion.
- **Not available** in this session, so not used: epic-design, scroll-driven-animations, gsap-scroll, scroll-experience, color-expert. The OKLCH season interpolation and palette tooling are my own code. The accessibility audit used axe-core in Playwright.

## Run and build
```bash
npm install
npm run dev
npm run build
npm run preview
npm run palette    # regenerate tokens.css (including the season colours)
npm run contrast
```
To change the forest, edit the seeds or parameters in `HERO_LAYERS` and `cardLayers` (`src/paper.ts`).

## Swap in your own photos
Each walk card is an image slot (`data-slot="walk-spring"` and so on). Put a photo in `public/assets/images/` and set `data-photo="assets/images/<file>"`; it replaces the diorama. See [`public/assets/README.md`](public/assets/README.md). The hero valley is an interactive scene, not an image slot.

## Verification (what was actually run)
- `npm run build` passes; `npm run contrast`: 19/19 pairs pass.
- Headless Chromium at 375, 768 and 1440 px with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal scroll;
  - axe-core: 0 violations;
  - reduced-motion, no-JS and `?nosda` passes: nothing left hidden.
- Season probe: scrolling each walk to the viewport centre set `--s-front` to the spring, summer, autumn and winter values in turn. The season nav's `aria-current` and `html[data-season]` followed.
- Problems found and fixed during the audit:
  - The first build painted too slowly to screenshot: eight full-screen SVG layers with blur `drop-shadow` filters. Shadows are now offset copies of each path, with no blur.
  - The season interpolation silently never ran: Chromium serializes colour custom properties as `lab()`, so reading them back from CSS failed. Season values are now imported from the config.
  - axe found the h1 hidden after the hero dive (`visibility: hidden`). The hero copy now fades with opacity only, and focusing it scrolls back up.
  - On phones: the form inputs overflowed the panel, the header wrapped, and the sun sat behind the buttons.
- **Not tested:** Safari and Firefox (Firefox has no `animation-timeline`, so it would use the GSAP fold fallback; I only exercised that path in Chromium with `?nosda`), real devices, and screen readers. Scroll performance was not measured on a real GPU.

## Notes and decisions
- Built in `erdgib923-star/different-websites/style-sites-2/` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. `style-sites-2/publish-repos.sh` can split it out.
- Brand check (web search, 2026-11-02): no company called Fernfold found.
- You named both teal and mustard. I treated mustard as the single accent and kept teal for illustration (sky, water) and the focus ring, so the one-accent rule holds for UI colour.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
- **Build fix (2026-11-03, after site 19):** `vite.config.ts` now sets `build.cssTarget` to oklch-capable browsers (Chrome/Edge 111, Firefox 113, Safari 16.4). Before this, Vite's CSS minifier rewrote every oklch() token to lab(). Chromium then dropped the hue in `color-mix(in oklch, <lab colour>, transparent)` and tinted translucent surfaces (headers, shadows, glows) slightly pink. Older browsers still use the hex fallbacks. After the change I rebuilt and re-audited at 1440 px (axe, console, reduced motion, no-JS, `?nosda`); new screenshots were not taken.
