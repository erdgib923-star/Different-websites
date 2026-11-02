# Terrazzo Lab: Neo-Memphis pattern studio demo

> **Terrazzo Lab is a fictional studio.** The pattern names, prices, address (3 Chip Street, Example City), emails (hello@ / samples@example.com) and phone ((555) 555-0100) are invented.

## Concept
A loud, cheerful pattern studio whose site *is* its product:
- **Seeded procedural terrazzo and squiggle generator with SVG export** (`src/terrazzo.ts`):
  - **Chips:** irregular 5–9-sided stones, placed by rejection sampling on a **torus**. Distances wrap around the tile edges, so chips never collide across the seam.
  - **Squiggles:** sine strokes with round caps. **Confetti:** dots, rings and tiny triangles.
  - **Seamless:** anything crossing an edge is also drawn on the opposite side. The preview repeats the tile, and "Show tile edges" overlays the seams so you can check them yourself.
  - **Controls:** seed (and shuffle), chip count, chip size, squiggles, confetti, four palettes (House, Sorbet, Night, Mono) and preview tile size.
  - **Export SVG tile** downloads a standalone `terrazzo-<palette>-<seed>.svg` (400 × 400). Its colours are resolved from the OKLCH tokens to hex.
  - Same seed plus same settings always gives the same tile.
- **Shapes pop in with rotation:** Memphis characters (circle, squiggle, triangle, half-moon, dot grid, chip) spin in with overshoot, and so do library tiles, stickers and the "NEW!" burst.
- **How it works (pinned build):** chips pop in at random, squiggles draw, confetti scatters, then the view zooms out to a 3 × 3 repeat to prove there is no seam. The "seed #2047" and "Seamless ✓" callouts pop at fixed points.
- **Library:** six seeded house patterns, each loadable into the generator.

### Design direction
1. Neo-Memphis: shapes as characters, a broken grid, irregular rhythm.
2. Flat colour, thick black lines and hard offset shadows, sometimes coloured.
3. Rubik (chunky, rounded, friendly) for display; Space Grotesk (quirky geometric) for text.
4. Motion is bouncy and a little cheeky: spins, overshoot, wiggles on hover.
5. The generator is the hero feature; everything else invites you to use it.

## Color Brief
- **Mood:** playful, sunny, irreverent.
- **Hue anchors (OKLCH):**
  - **teal 190** (brand);
  - **hot pink 350** (the one UI accent: primary CTA, highlights);
  - **yellow 95** (third pattern colour, blocks);
  - **black ink and off-white**, plus a lilac sticker colour for variety.
- **Harmony:** Memphis's classic clash, a near-complementary pink and teal triangle completed by yellow, held together by black.
- **60 / 30 / 10:** 60% off-white with a dot grid, 30% black line-work, 10% colour blocks. The patterns themselves are maximal; that is the point.
- **Contrast:** black text works on every colour block (teal, pink, yellow, lilac). Pink and teal are never used for small text, so links use teal-800 and labels use pink-800.

All colours are OKLCH custom properties from `palette.config.mjs`:
- 11-step ramps for neutral (tinted 190), teal, pink and yellow;
- named offwhite, paper, ink, teal, pink, yellow and lilac;
- semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus`;
- hex fallbacks under `@supports`.

The generator reads palettes as CSS custom properties and paints each one to a 1px canvas to get exact hex for the SVG. (Reading them as strings returns `lab()` in Chromium, which other software can't open.)

There are no gradients in the UI, by Memphis design; texture comes from the dot grid and the patterns. Shadows are solid black or coloured offsets.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| light | `text` | `bg` | Body copy | Body text | 16.66:1 | 4.5:1 | Pass |
| light | `text-muted` | `bg` | Secondary copy | Body text | 6.55:1 | 4.5:1 | Pass |
| light | `text` | `surface` | Cards | Body text | 17.55:1 | 4.5:1 | Pass |
| light | `text` | `teal` | Black on teal block | Body text | 5.19:1 | 4.5:1 | Pass |
| light | `text` | `pink` | Black on pink button | Body text | 6.66:1 | 4.5:1 | Pass |
| light | `text` | `yellow` | Black on yellow band | Body text | 12.56:1 | 4.5:1 | Pass |
| light | `text` | `lilac` | Black on lilac sticker | Body text | 8.79:1 | 4.5:1 | Pass |
| light | `brand-text` | `bg` | Teal links and labels | Body text | 8.98:1 | 4.5:1 | Pass |
| light | `accent-text` | `bg` | Pink labels | Body text | 10.02:1 | 4.5:1 | Pass |
| light | `offwhite` | `ink` | Off-white on black blocks | Body text | 16.66:1 | 4.5:1 | Pass |
| light | `yellow` | `ink` | Yellow on black | Body text | 12.56:1 | 4.5:1 | Pass |
| light | `border` | `bg` | Thick black outlines | UI / graphics | 16.66:1 | 3:1 | Pass |
| light | `focus` | `teal` | Focus ring on teal | UI / graphics | 5.19:1 | 3:1 | Pass |

_13 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens: 0.4/0.7/1.0/1.2 s, expo and power3 easing, 75 ms stagger, and the pop preset. This site adds **`pop-spin`**: scale 0.2 → 1.12 → 0.96 → 1 while rotating −120° → 10° → −4° → 0, with a back-out ease.

| Section | Choreography |
|---|---|
| Hero | Six Memphis shapes **spin in** staggered. **Parallax pair:** the teal circle and yellow triangle drift at opposite speeds. Split-text h1 and a sticker pop. |
| Generator | Sticker pops; the generator is interactive and has no autoplay. |
| How it works | **Pinned and scrubbed** (≥ 900px, 280% of scroll): chips, squiggles, confetti, then a zoom-out to the tiled repeat. **Callouts pop** at 0.5 and 3.85. Phones get the same build unpinned. |
| Library | Tiles **spin in** staggered, each slightly tilted. |
| Samples | Split heading; the "NEW!" burst spins in. |

Under reduced motion: no spins, pins, parallax or smooth scroll. The build shows the finished tile, and the generator still works. Without JS the hero and all text are visible; the generator, library tiles and build need JS.

## Skills actually used
- `frontend-design` (julianoczkowski designer-skills), **Neo-Memphis**: clashing brights, thick borders, hard coloured shadows, a broken grid, bouncy exaggerated motion, shapes as characters.
- `p5js` (nousresearch/hermes-agent): seeded determinism (same seed, same output), parameters that change how the algorithm behaves (chip density and size change the packing, not just the look), an invented element (toroidal rejection sampling for seamless chips), and the export workflow. **The p5 library itself is not used here**, because the output has to be vector SVG and p5 renders to canvas; the generator is plain TypeScript.
- `css-animation-patterns`, `motion-and-interaction-system` (read manually).
- **Not available**, so not used: taste-skill, color-expert. The audit used axe-core.

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
The six library tiles are image slots (`pattern-gelato` … `pattern-midnight`, 1:1). Set `data-photo="assets/images/<file>"` to show a photo of a real installation instead of the generated tile. See [`public/assets/README.md`](public/assets/README.md).

## Verification (what was actually run)
- `npm run build` passes; `npm run contrast`: 13/13 pairs pass.
- Headless Chromium at 375, 768 and 1440 px, with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal scroll;
  - axe-core: 0 violations;
  - reduced-motion, no-JS and `?nosda` passes: nothing left hidden.
- Generator probe:
  - With "Show tile edges" on, the repeated preview shows chips and squiggles continuing across every seam (checked visually in a screenshot).
  - "Load in generator" on Disco Lobby set seed 5150 and the Night palette.
  - Export SVG downloaded `terrazzo-night-5150.svg` (17 KB, 87 paths, hex colours only, no `lab()`/`oklch()`).
- The audit found nothing that needed fixing.
- **Not tested:** opening the exported SVG in design software (it is plain SVG 1.1 paths, circles and fills), Safari and Firefox, and screen readers.

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-02): no studio called "Terrazzo Lab" found.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
