# Lumi & Lind: Scandinavian home goods demo

> **Lumi & Lind is a fictional shop.** The products (Snölätt, Kvällsljus, Mossgrön, Linnehav, Björkbräda, Glimta), prices, address (12 Linden Row, Example City), email (hej@example.com) and phone ((555) 555-0100) are invented. The bag is a demo and stores nothing.

## Concept
A small home-goods shop with a *hygge* mood:
- **Day-to-evening palette shift across scroll.** At the top the page is birch white in morning light; by the bottom it is warm dusk.
  - `--p` is a registered `@property <number>` driven by `animation-timeline: scroll(root)`.
  - Every shifting colour is `color-mix(in oklch, day, evening calc(var(--p) * 100%))`, so the interpolation runs in **OKLCH**, natively in CSS.
  - When scroll timelines are unavailable, and under reduced motion (it is a colour change, not movement), a few lines of JS set `--p` from the scroll position instead.
- **Candle-glow cursor.** A soft amber disc follows fine pointers. It grows stronger toward evening (`opacity` tied to `--p`) and moves by `transform` only.
- **A cozy room built entirely from CSS shapes:** window, sky, sun and moon, shelf, floor lamp, sofa with cushion and throw, side table with mug and candles, plant, rug. A second variable, `--t`, sets the time of day *inside* the room:
  - the sky moves through day, dusk and night (nested OKLCH mixes);
  - the sun sets and the moon rises;
  - the lamp turns on, the candles light, and the throw unfolds.
- **Product cards pop up:** six cards with CSS-drawn product art, each an image slot, and a working demo "Add to bag" with a live count and announcement.

### Design direction
1. Calm Nordic interiors: birch, linen, wool, wood, one warm light.
2. Time of day is the story, from first coffee to the last candle.
3. Newsreader (a gentle editorial serif) for voice; Figtree (round, friendly sans) for everything practical.
4. Gentle motion: things settle, warm and glow; nothing jumps.
5. Products shown in context, inside the room.

## Color Brief
- **Mood:** cozy, quiet, warm-lit.
- **Hue anchors (OKLCH):**
  - **birch whites** (85, chroma ≈ 0.01);
  - **sage 150** (brand): buttons, headings;
  - **dusty blue 235**: sofa, cushion, focus ring, the night sky;
  - **candle-glow amber 70**: the one accent, used for glow, flames, price tags and the evening CTA.
- **Harmony:** soft analogous neutrals with a cool pair (sage, dusty blue) against one warm accent (amber).
- **60 / 30 / 10:** 60% birch and linen, 30% sage and dusty blue in the art and furniture, 10% amber glow.
- **The shift:** day birch (L 0.975) moves to evening birch (L 0.885, warmer); cards move from L 0.99 to 0.935.
  - Text stays dark the whole way.
  - Luminance changes monotonically along the mix, so checking contrast at both ends covers every point between. The table below includes both ends.
- **Evening band:** a fixed night palette (L 0.235) with birch text.

All colours are OKLCH custom properties from `palette.config.mjs`:
- 11-step ramps for neutral, sage, dusty blue and amber;
- named day, evening and night tokens;
- semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus`;
- hex fallbacks under `@supports`, with plain backgrounds declared before every `color-mix()`.

Shadows mix blue-900, never black. Gradients use `in oklch`.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| light | `text` | `birch-day` | Body copy, day end | Body text | 13.90:1 | 4.5:1 | Pass |
| light | `text` | `birch-evening` | Body copy, evening end | Body text | 10.58:1 | 4.5:1 | Pass |
| light | `text-muted` | `birch-day` | Secondary copy, day | Body text | 6.86:1 | 4.5:1 | Pass |
| light | `text-muted` | `birch-evening` | Secondary copy, evening | Body text | 5.22:1 | 4.5:1 | Pass |
| light | `text` | `card-day` | Product cards, day | Body text | 14.61:1 | 4.5:1 | Pass |
| light | `text-muted` | `card-evening` | Card captions, evening | Body text | 6.08:1 | 4.5:1 | Pass |
| light | `brand-text` | `birch-evening` | Sage headings and links, evening | Body text | 6.96:1 | 4.5:1 | Pass |
| light | `accent-text` | `birch-day` | Amber labels | Body text | 9.45:1 | 4.5:1 | Pass |
| light | `brand-contrast` | `brand` | Sage button | Body text | 6.75:1 | 4.5:1 | Pass |
| light | `accent-contrast` | `accent` | Amber button, price tags | Body text | 9.66:1 | 4.5:1 | Pass |
| light | `night-text` | `night` | Evening band text | Body text | 15.53:1 | 4.5:1 | Pass |
| light | `night-muted` | `night` | Evening band secondary | Body text | 8.97:1 | 4.5:1 | Pass |
| light | `accent` | `night` | Glow button on night | UI / graphics | 10.79:1 | 3:1 | Pass |
| light | `night-muted` | `night-2` | Evening band secondary (lighter corner) | Body text | 7.56:1 | 4.5:1 | Pass |
| light | `border-strong` | `birch-evening` | Outlines, evening | UI / graphics | 3.59:1 | 3:1 | Pass |
| light | `focus` | `birch-evening` | Focus ring, evening end | UI / graphics | 4.97:1 | 3:1 | Pass |
| light | `focus` | `birch-day` | Focus ring, day end | UI / graphics | 6.53:1 | 3:1 | Pass |

_17 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens: 0.4/0.7/1.0/1.2 s, expo and power3 easing, 75 ms stagger, and the pop preset.

| Section | Choreography |
|---|---|
| Global | Day-to-evening colour scrub across the whole page (CSS scroll timeline). Candle-glow cursor. |
| Hero | Split-text h1; still-life figure pops; the "New · Snölätt throw" tag **pops at 0.9 s**. |
| Shop | Six product cards **pop up staggered**; the bag icon pops when an item is added. |
| A day at home | **Pinned and scrubbed** (≥ 900px, 280% of scroll): the room runs 07:30 to 21:00 and the captions crossfade. Product pins **pop at set times**: mug in the morning, cushion at midday, lamp at blue hour, candles at night. Phones scrub the room unpinned. |
| Made slowly | **Parallax pair:** two fabric swatches drift at opposite speeds. Value cards stagger. |
| Evening band | Split-text heading and fade-ups. |

Under reduced motion: no pin, parallax, glow cursor or smooth scroll. The room shows its evening state with all pins visible, and the page colour still follows scroll position (colour only, no movement). Without JS everything is visible and the room is at evening.

## Skills actually used
- `frontend-design` (julianoczkowski designer-skills), **Scandinavian**: warm whites, soft blues and greens, rounded cards, large soft shadows, gentle settling motion, no pure black.
- `css-animation-patterns` (oakoss): scroll timelines driving a registered custom property.
- `motion-and-interaction-system` (read manually): one cinematic sequence; reduced-motion handling.
- **Not available**, so not used: ui-ux-pro-max, color-expert, scroll-driven-animations. The OKLCH shift is plain CSS `color-mix()`. The accessibility audit used axe-core.

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
Seven slots: `hero-still-life` (4:5) and six product slots (1:1): `product-throw`, `product-candles`, `product-mug`, `product-cushion`, `product-board`, `product-lamp`. Set `data-photo="assets/images/<file>"`. See [`public/assets/README.md`](public/assets/README.md). The CSS room is part of the interaction, not a photo slot.

## Verification (what was actually run)
- `npm run build` passes; `npm run contrast`: 17/17 pairs pass, at both the day and evening ends.
- Headless Chromium at 375, 768 and 1440 px, with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal scroll;
  - axe-core: 0 violations;
  - reduced-motion, no-JS and `?nosda` passes: nothing left hidden.
- Room probe: I captured the pinned room at four scroll points (08:45, 12:15, 15:30 and 20:15). The sky went blue, blue, amber, night; the lamp and candles lit; product pins popped and faded at the right times.
- Bag probe: "Add to bag" updated the count, the bag's accessible name ("Bag, 1 item") and the live announcement.
- Fixed after the first audit:
  - The room sky went green between day and dusk, because the shortest OKLCH hue path from 230 to 55 passes through about 140. It now mixes with `longer hue`, through violet and pink like a sunset.
  - The sky turned to dusk too early; it now stays blue until early afternoon.
- **Not tested:** Safari and Firefox (Firefox uses the JS `--p` fallback), the cursor glow on a physical mouse, and screen readers.

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-02): no "Lumi & Lind" found.
- Product names use Swedish-style compound words. They were checked only against the brand name, not against every real product catalogue; rename them before any commercial use.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
- **Build fix (2026-11-03, after site 19):** `vite.config.ts` now sets `build.cssTarget` to oklch-capable browsers (Chrome/Edge 111, Firefox 113, Safari 16.4). Before this, Vite's CSS minifier rewrote every oklch() token to lab(). Chromium then dropped the hue in `color-mix(in oklch, <lab colour>, transparent)` and tinted translucent surfaces (headers, shadows, glows) slightly pink. Older browsers still use the hex fallbacks. After the change I rebuilt and re-audited at 1440 px (axe, console, reduced motion, no-JS, `?nosda`); new screenshots were not taken.
