# Pixel Hollow: cozy pixel farming game demo

> **Pixel Hollow is a fictional game** by a fictional studio (Lanternbug Games). The release window ("spring 2027"), features, crop counts, email (hello@example.com) and phone ((555) 555-0100) are invented. There is no store page.

## Concept
A landing page for a cozy farming game where the page itself is a little game world:
- **Parallax pixel landscape with a scroll-driven day-night cycle.**
  - A fixed 180-pixel-tall canvas (its width follows the viewport aspect) sits behind the page, scaled with `image-rendering: pixelated`.
  - Scrolling moves the day from morning through sunset to night: the sun arcs and sets, the moon rises, stars come out (static, no twinkle).
  - The sky blends between palette colours with **4 × 4 Bayer ordered dithering**, so it never leaves the 16-colour palette, the way real pixel games do it.
  - Trees, house, crops and characters **palette-swap** for dusk and night instead of being tinted.
  - Four layers (ridge, hills, trees, field) parallax at different rates in whole pixels.
- **Sprites drawn from code arrays.** Every sprite is an array of strings, one character per palette entry (`src/pixel.ts`):
  - characters and animals: farmer (2 walk frames), chicken;
  - crops in four growth stages, plus seed and coin;
  - scenery: tree, house, cloud, sun, moon, fence.
  - Sprites are rasterised once per palette variant and blitted with smoothing off.
- **Collect-the-seeds mini-game** (`src/game.ts`): 30 seconds on a 160 × 96 canvas.
  - Catch falling seeds; misses sprout where they land.
  - Controls: ← → or A / D, press-and-hold arrow buttons, or tap either side of the field.
  - The HUD is real text, and a live region announces milestones and the final score.
  - The loop runs only while playing, on screen and with the tab visible. Best score is kept in localStorage (wrapped in try/catch).
- **`steps()` animations everywhere:**
  - pop-ins and split-text use `steps()` timing, so content arrives in chunky pixel steps;
  - the hero's walking farmer is a generated 2-frame sprite sheet animated with `steps(2)`, crossing the panel in 72 stepped moves;
  - "PRESS START" blinks with `step-end`, at 1.2 s per cycle (under 1 flash per second).

### Design direction
1. A 16-colour world, and nothing on the page uses a colour outside it.
2. Day turns to night as you scroll: the scroll bar is a clock.
3. Pixelify Sans for reading; Press Start 2P only for the logo, title, labels and HUD.
4. Motion is stepped, never smooth: pixel art should snap.
5. Cream "dialog box" panels with notched pixel borders keep text readable over any time of day.

## Color Brief
- **Mood:** warm, nostalgic, gentle.
- **The 16-colour palette (OKLCH):**
  - ink (280) and cream (90);
  - grass ×3 (145/140/130, L 0.45/0.62/0.80);
  - soil and wood ×3 (55–70, L 0.36/0.50/0.68);
  - sky ×3 (255/240/225, L 0.45/0.65/0.85);
  - sun and wheat ×2 (92/75);
  - berry ×2 (25/20);
  - dusk (300).
  - Every hue family has 2–3 lightness steps for shading.
- **Brand / accent:** grass green 140 (brand) and sun yellow 90 (the one UI accent: primary buttons, logo, HUD numbers).
- **Harmony:** a classic warm and cool game palette, with greens and earth for the land, blues for the sky, and a berry red for small hits.
- **60 / 30 / 10:** the landscape fills the page and the panels are cream; sun yellow marks every call to action.
- **Neutral ramp:** a UI-only ramp tinted toward the night ink (280). Sprites use only the 16 entries.
- **Data colours:** none; the HUD uses text.

All colours are OKLCH custom properties from `palette.config.mjs`, with hex fallbacks under `@supports`. The canvas reads them through a one-pixel paint, which turns oklch/lab into exact RGB. Shadows are ink, never black. The only CSS gradient is the no-JS fallback sky, and it interpolates `in oklch`; dithering is the "gradient" everywhere else.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| light | `text` | `surface` | Panel text (ink on cream) | Body text | 15.78:1 | 4.5:1 | Pass |
| light | `text-muted` | `surface` | Panel captions (dark soil on cream) | Body text | 9.60:1 | 4.5:1 | Pass |
| light | `text` | `surface-2` | Ink on wood panel | Body text | 6.21:1 | 4.5:1 | Pass |
| light | `text` | `brand` | Green button | Body text | 5.29:1 | 4.5:1 | Pass |
| light | `text` | `accent` | Sun button, coin badges | Body text | 11.93:1 | 4.5:1 | Pass |
| light | `text` | `grass-l` | Ink on light grass tag | Body text | 10.19:1 | 4.5:1 | Pass |
| light | `text` | `berry-l` | Ink on berry tag | Body text | 8.08:1 | 4.5:1 | Pass |
| light | `on-dark` | `ink` | Cream on ink (footer, game HUD) | Body text | 15.78:1 | 4.5:1 | Pass |
| light | `on-dark` | `dusk` | Cream on dusk panel | Body text | 8.33:1 | 4.5:1 | Pass |
| light | `sun` | `ink` | Sun labels on ink | Body text | 11.93:1 | 4.5:1 | Pass |
| light | `border` | `surface` | Pixel borders | UI / graphics | 15.78:1 | 3:1 | Pass |
| light | `focus` | `surface` | Focus ring on cream | UI / graphics | 4.09:1 | 3:1 | Pass |
| light | `focus` | `ink` | Focus ring on ink (berry) | UI / graphics | 3.85:1 | 3:1 | Pass |

_13 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens (0.4/0.7/1.0/1.2 s, 75 ms stagger, pop preset). This site sets `--pop-ease: steps(6, end)` and no blur, so every pop is a stepped pixel animation.

| Section | Choreography |
|---|---|
| Whole page | The fixed landscape: **scroll-driven day-night** plus **four-layer pixel parallax**, and an 8 fps idle loop (clouds drift, farmer strolls, chicken pecks). |
| Hero | The title **types in by character** (stepped split-text). Panel elements pop in steps; the walking farmer sprite loops with `steps()`. |
| Features | Feature rows and screenshot figures pop in staggered steps. |
| One season | **Pinned** (≥ 860px, 220% of scroll). Crops jump through four discrete growth stages, Day 1 → 4 → 7 → 10. The "+12 coins" badge **pops on day 7** and "Level up!" **pops at harvest**. Phones scrub unpinned. |
| Play | The mini-game (user-driven only). |
| Wishlist | Stepped pops; "PRESS START" blink (1.2 s cycle). |

Under reduced motion:
- no idle loop, no parallax, no walker, no blink, no pin; the season shows harvest day;
- the sky still follows the scroll (a colour change, not movement);
- the game still works, with seeds falling 30% slower.

Without JS there is a static CSS sky and all text; the canvases need JS.

## Skills actually used
- `p5js` (nousresearch/hermes-agent): seeded generation for the ridge and stars, "dense, layered, considered" scene composition, and per-layer motion speeds (primary, secondary, ambient). **The p5 library is not used**; a tiny dedicated pixel engine is lighter and keeps exact control over the 16-colour palette.
- `frontend-design` (julianoczkowski): committing to one strong direction and keeping it consistent.
- `css-animation-patterns` (oakoss): `steps()` and `step-end` timing, and sprite-sheet animation.
- `motion-and-interaction-system` (read manually).
- **Not available**, so not used: 8-bit-pixel-art-patterns (its download was blocked by the network proxy), color-expert, accesslint. The audit used axe-core.

## Run and build
```bash
npm install
npm run dev
npm run build
npm run preview
npm run palette
npm run contrast
```
To edit art, change the string arrays in `src/pixel.ts`. Each letter is a palette entry (see `KEY`), and `.` is transparent.

## Swap in your own photos
Two screenshot slots (`screenshot-farm`, `screenshot-night`, 16:9) show code-drawn scenes by default. Set `data-photo="assets/images/<file>"` to use real game screenshots. See [`public/assets/README.md`](public/assets/README.md). For crisp pixels, export screenshots at an exact multiple of the game resolution.

## Verification (what was actually run)
- `npm run build` passes; `npm run contrast`: 13/13 pairs pass.
- Headless Chromium at 375, 768 and 1440 px, with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal scroll;
  - axe-core: 0 violations;
  - reduced-motion pass: nothing hidden, and the landscape reported `static` (no idle loop);
  - no-JS and `?nosda` passes: nothing left hidden.
- Landscape probe at 1440 px: morning, a dithered sunset and a starry night at 0%, 50% and 97% scroll, with trees and house palette-swapped.
- Game probe at 375 px: Start, then holding → and ← moved the farmer; 2 seeds were caught and missed seeds sprouted. Pause updated the button ("Resume") and the live region ("Paused.").
- Fixed after the first audit: on portrait phones the canvas was stretched (non-square pixels). Canvas dimensions now come from the viewport aspect.
- **Not tested:** the game with real touch input (the press-and-hold buttons use pointer events), Safari and Firefox, and screen readers. The game itself is inherently visual; the HUD and announcements are text.

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-02): no game called "Pixel Hollow" found.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
- **Build fix (2026-11-03, after site 19):** `vite.config.ts` now sets `build.cssTarget` to oklch-capable browsers (Chrome/Edge 111, Firefox 113, Safari 16.4). Before this, Vite's CSS minifier rewrote every oklch() token to lab(). Chromium then dropped the hue in `color-mix(in oklch, <lab colour>, transparent)` and tinted translucent surfaces (headers, shadows, glows) slightly pink. Older browsers still use the hex fallbacks. After the change I rebuilt and re-audited at 1440 px (axe, console, reduced motion, no-JS, `?nosda`); new screenshots were not taken.
