# Inkpress Collective: risograph print studio demo

> **Inkpress Collective is a fictional studio.** The ink names (Flamingo, Federal, Sunflower), prices, address (Unit 4, 18 Mill Yard, Example City), email (press@example.com) and phone ((555) 555-0100) are invented.

## Concept
A community risograph studio whose whole site behaves like a riso print: three translucent spot inks overprinting with `mix-blend-mode: multiply`.
- **Hero: ink layers slide into registration.** The hero poster (inline SVG) is three separate ink passes, sunflower then flamingo then federal. Each has its own halftone screen angle and its own registration marks. They start visibly off-register; scrolling (pinned on wide screens) slides each pass home. Pass labels pop as each ink lands, then an "In register" stamp pops. At rest without JS, the poster keeps a gentle 2px "house miss".
- **Deliberate misregistration everywhere:** headings carry a pink pass printed a hair off, the logo is two overprinted inks, and buttons have an offset second-ink "print shadow".
- **Halftone dots:** SVG `<pattern>` screens at 15°, 45° and 75° on the poster and step art, CSS `radial-gradient` halftones on the swatches and parallax discs, plus a static paper-speckle tile.
- **Overprint chart:** the three inks as a multiply Venn diagram, so pink and blue make grape, pink and yellow make coral, blue and yellow make moss.
- **Poster lab (p5.js)**, the signature feature (`src/lab.ts`):
  - **Process:** each chosen ink gets a greyscale master (orbits, stripes, blobs or grid), screened into halftone dots on its own rotated grid. Dot area follows darkness. The ink then gets random drop-outs (uneven coverage) and is stacked with `MULTIPLY` at a seeded misregistration offset.
  - **Controls:** inks, pattern, misregistration (0–24 px), halftone pitch, title, new seed, and **Download PNG**.
  - **Determinism:** the same seed and settings always give the same poster.
  - **Accessibility:** a status line and the canvas wrapper's `aria-label` describe the current poster in words.

### Design direction
1. Everything looks printed, not rendered: flat inks, multiply overprints, halftone, speckle.
2. Imperfection is the brand. Misregistration is designed in, then resolved on scroll.
3. Space Grotesk for confident, slightly quirky headlines; Space Mono for press-room labels.
4. Blue carries the type, pink drives interaction, yellow only ever prints underneath.
5. Square corners and offset shadows, like paper stacked on a press bed.

## Color Brief
- **Mood:** joyful, hands-on, a little loud; a print studio on a Thursday night.
- **Hue anchors (OKLCH):**
  - **blue 250 to 262** (brand ink): headings, links, text-heavy UI;
  - **fluorescent pink 350 to 355** (the one accent): buttons, stickers, focus;
  - **yellow 100**: a third *ink*, used only in artwork, the Venn chart and print shadows, never for text or controls;
  - **cream stock** (0.955 0.03 88).
- **Harmony:** a triadic ink set (pink, blue, yellow) on warm paper. Overprints make the secondary colours.
- **60 / 30 / 10:** 60% cream stock, 30% federal blue, 10% flamingo pink. Sunflower yellow appears inside the art.
- **Gamut:** real fluorescent pink is outside sRGB. The generator keeps its lightness and hue and reduces chroma until it fits; the hex fallbacks are those mapped values.
- **Pink as a graphic:** flamingo on cream is 2.87:1, so pink is never the only thing that identifies a control. Pink buttons carry dark text (5.31:1), and the checked state of the ink checkboxes uses pink-700 (passes 3:1).

All colours are OKLCH custom properties generated from `palette.config.mjs`:
- 11-step ramps for neutral (tinted toward cream), blue, pink and yellow;
- the three ink tokens;
- semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus`;
- hex fallbacks under `@supports`.

The p5 lab imports the same config and converts it to RGB with the same gamut mapping, so canvas inks match the CSS inks. Shadows are tinted blue, never black. There are no large gradients; texture comes from halftone and the static speckle tile.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| light | `text` | `bg` | Body copy | Body text | 15.24:1 | 4.5:1 | Pass |
| light | `text-muted` | `bg` | Secondary copy | Body text | 7.48:1 | 4.5:1 | Pass |
| light | `text` | `surface` | Cards | Body text | 16.15:1 | 4.5:1 | Pass |
| light | `text-muted` | `surface` | Card captions | Body text | 7.93:1 | 4.5:1 | Pass |
| light | `brand` | `bg` | Blue ink headings and links | Body text | 6.83:1 | 4.5:1 | Pass |
| light | `brand` | `surface` | Blue ink on stock | Body text | 7.24:1 | 4.5:1 | Pass |
| light | `brand-contrast` | `brand` | Blue button | Body text | 7.24:1 | 4.5:1 | Pass |
| light | `accent-contrast` | `accent` | Pink button, stickers | Body text | 5.31:1 | 4.5:1 | Pass |
| light | `accent-text` | `bg` | Pink labels | Body text | 6.98:1 | 4.5:1 | Pass |
| light | `text` | `ink-yellow` | Text on yellow ink | Body text | 12.98:1 | 4.5:1 | Pass |
| light | `border-strong` | `surface` | Inputs, controls | UI / graphics | 6.65:1 | 3:1 | Pass |
| light | `focus` | `bg` | Focus ring | UI / graphics | 6.98:1 | 3:1 | Pass |
| light | `focus` | `ink-yellow` | Focus ring on yellow | UI / graphics | 5.95:1 | 3:1 | Pass |
| light | `accent-text` | `surface` | Checked control fill (pink-700) | UI / graphics | 7.40:1 | 3:1 | Pass |

_14 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens: 0.4/0.7/1.0/1.2 s, expo and power3 easing, 75 ms stagger, and the pop preset.

| Section | Choreography |
|---|---|
| Hero | Split-text h1 (with misregistered pink shadow), staggered copy. **Pinned scrub** (150% of scroll, ≥ 900px): three ink passes rotate and slide into registration one after another. **Pass labels pop at fixed timeline points** (0.65, 1.65, 2.65); the stamp pops at 3.1. Phones get the same scrub unpinned. |
| Studio | **Parallax pair:** a pink and a yellow halftone disc drift at opposite speeds (CSS scroll-driven, GSAP fallback). Step cards pop staggered. |
| Inks | Swatches stagger in; the Venn chart pops. |
| Poster lab | Redraws on input (debounced). No autoplay. |
| Print runs | Cards stagger; the "Most booked" sticker pops 450 ms after its card. |

Under `prefers-reduced-motion` there is no pin, scrub or parallax; the poster rests at the 2px house miss, and the pass labels and stamp read as a legend. The lab is never animated.

## Skills actually used
- `p5js` (nousresearch/hermes-agent): instance mode, `disableFriendlyErrors`, `pixelDensity` capped at 2, seeded `randomSeed`/`noiseSeed`, offscreen `createGraphics` buffers per ink, `MULTIPLY` compositing, `saveCanvas` export. A parameter design where misregistration and pitch change how the screen *behaves*, and an invented element: per-ink screen angles with ink drop-outs.
- `riso` (bergside): pink as the sole interaction driver, blue headings, offset print shadows, one warm paper surface.
- `frontend-design` (julianoczkowski): commit to one direction and avoid generic UI.
- `motion-and-interaction-system` (read manually): one cinematic sequence, tier-1 press feedback, reduced motion.
- **Not available** in this session, so not used: taste-skill, color-expert, and the `impeccable` audit skill. The installed bergside `impeccable` is a visual style (cream and orange editorial), not the audit tool, so I did not apply it. The accessibility audit used axe-core.

## Run and build
```bash
npm install
npm run dev
npm run build      # p5 builds into its own lazy chunk
npm run preview
npm run palette
npm run contrast
```

## Swap in your own photos
The hero poster is an image slot (`data-slot="hero-poster"`, 3:4). Set `data-photo="assets/images/<file>"` to show a photo of a real print instead. The ink-registration animation only applies to the SVG artwork. See [`public/assets/README.md`](public/assets/README.md).

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-02): no "Inkpress Collective" found.
- p5.js 1.11.13 from npm (pinned), loaded with a dynamic `import()` when the lab is within 600px of the viewport, so it is not on the critical path.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`). The lab waits for the fonts before its first draw so the canvas text uses them.
