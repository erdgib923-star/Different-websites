# Yugure Tea Atelier: wabi-sabi tea house demo

> **Yugure Tea Atelier is a fictional place.** The teas are invented blends; prices, the address (3 Lantern Lane, Example City), email (seats@example.com) and phone ((555) 555-0100) are sample content.

## Concept
*Yūgure* (夕暮れ) means dusk. An eight-seat tea counter that opens in the hour before evening, designed in a **wabi-sabi / Japanese minimalist** language:
- generous *ma* (negative space) and asymmetric placement;
- hairlines instead of boxes, and slow, quiet motion.

Signature details:
- **Ink-wash reveals.** Brush art is inline SVG shaped by `feTurbulence` and `feDisplacementMap` (a dry-brush ensō and misty sumi-e hills). Images open the way ink bleeds into paper: a turbulence-edged blot grows through a CSS mask. The blot is rasterised to a PNG once at start-up, so the reveal only animates `mask-size`, not a live SVG filter.
- **Slow 1.2 s fades.** No bounce, no overshoot: the shared pop preset is reduced to a 12px fade-up on a gentle curve.
- **Seasonal tea menu:** accessible tabs (arrow keys, Home and End). The current season is chosen from today's date and marked with the page's only vermilion dot. Without JS, all four seasons are listed under headings.
- **The pour:** a pinned, slow scrub. The steps swap, the tea rises in a mended bowl (a clay-coloured *kintsugi* seam), the temperature note appears, then steam draws in.

### Design direction
1. Emptiness carries the mood; content floats off-centre.
2. Ink, ash and clay; colour arrives only as a vermilion seal.
3. Shippori Mincho (a delicate Mincho serif) for voice; Zen Kaku Gothic New for small practical text.
4. Motion is breath-paced: fades and ink spreading, never springs.
5. Imperfection on purpose: dry-brush texture, mended bowls, washi grain.

## Color Brief
- **Mood:** still, warm, crepuscular.
- **Hue anchors (OKLCH):**
  - **muted clay 50** (brand, chroma 0.06): headings, numerals;
  - **moss 135** (chroma 0.04): small labels, tea in the bowl;
  - **charcoal ink** (0.24 0.008 60): text and brushwork;
  - **ash neutrals**, chroma at most 0.012 (rule: 0.02 or less), tinted toward clay;
  - **vermilion 30** as the one accent.
- **Harmony:** a near-monochrome, low-chroma analogous set (clay and moss, both earth hues) with one complementary-temperature accent.
- **60 / 30 / 10, adapted:** about 75% washi and ash, about 20% ink, about 4% clay and moss, **under 2% vermilion**.
- **Vermilion budget:** the two seal stamps (30px and 44px squares) and one 6px dot on the current-season tab. That is far under 2% of any viewport.
- **Focus** uses charcoal ink, not vermilion, so focusing doesn't spend the accent budget.

All colours are OKLCH custom properties from `palette.config.mjs`:
- 11-step ramps for ash, clay, moss and vermilion;
- named washi and ink tokens;
- semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus`;
- hex fallbacks under `@supports`.

There are no gradients. The texture is a static washi-fibre noise tile plus the turbulence brush filters.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| light | `text` | `bg` | Body copy | Body text | 14.83:1 | 4.5:1 | Pass |
| light | `text-muted` | `bg` | Secondary copy, captions | Body text | 6.17:1 | 4.5:1 | Pass |
| light | `text` | `surface-2` | Menu panel | Body text | 13.60:1 | 4.5:1 | Pass |
| light | `text-muted` | `surface-2` | Tasting notes | Body text | 5.66:1 | 4.5:1 | Pass |
| light | `brand-text` | `bg` | Clay headings and links | Body text | 9.16:1 | 4.5:1 | Pass |
| light | `moss` | `bg` | Moss labels | Body text | 6.27:1 | 4.5:1 | Pass |
| light | `moss` | `surface-2` | Moss labels on panel | Body text | 5.75:1 | 4.5:1 | Pass |
| light | `accent-contrast` | `accent` | Seal characters (large) | Large text | 4.54:1 | 3:1 | Pass |
| light | `border-strong` | `bg` | Tab underline, inputs | UI / graphics | 4.56:1 | 3:1 | Pass |
| light | `focus` | `bg` | Focus ring | UI / graphics | 14.83:1 | 3:1 | Pass |
| light | `accent` | `bg` | Current-season mark | UI / graphics | 4.54:1 | 3:1 | Pass |

_11 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens: 0.4/0.7/1.0/1.2 s and 75 ms stagger, with power3 and expo easing available. This site uses the slow end: `--pop-dur: 1.2s`, a gentle cubic-bezier, 12px rise and 140 ms stagger, with no overshoot.

| Section | Choreography |
|---|---|
| Hero | The ensō **draws in with a dry brush** over 2.6 s. The figure **ink-washes in**, and the h1 splits word by word. The vertical kanji and the seal fade in last (0.9 s, 1.4 s). |
| Ma | Three statements fade in, alternating sides. The hairline rules between them wipe in, **scrubbed** (CSS `view()` with a GSAP fallback). |
| Menu | Heading split, quiet fades. "Limited" badges **pop (fade-rise) as each tea arrives**. Panels fade on tab change. |
| The pour | **Pinned slow scrub** (≥ 880px, 240% of scroll, `scrub: 1`). The step captions crossfade; the "80 °C" note **appears at a fixed point** before the tea rises; steam draws last. Phones get the same scrub, unpinned. |
| Visit | Ink-wash reveal of the room sketch. **Parallax pair:** two faint brush strokes drift at opposite speeds. Facts stagger in. |

Under reduced motion: the ensō and figures show complete, there are no masks, pins, parallax or smooth scroll, and tabs switch instantly. Without JS, everything is visible and all four menus are listed.

## Skills actually used
- `frontend-design` (julianoczkowski designer-skills), **Japanese Minimalism (Ma)**: negative space as content, thin serif type, generous line height (1.9), slow fades, no overshoot, hairlines and paper texture.
- `css-animation-patterns` (oakoss): `view()` scrubs and animating `mask-size`.
- `motion-and-interaction-system` (read manually): calm tier-3 sequence and reduced motion.
- **Not available**, so not used: color-expert, taste-skill, web-design-guidelines. The audit used axe-core plus a manual check of tab keyboard behaviour.

## Run and build
```bash
npm install
npm run dev
npm run build
npm run preview
npm run palette
npm run contrast
```
`dist/` is large (about 18 MB) because it contains every unicode-range chunk of the Japanese fonts. Browsers download only the chunks for characters on the page: Latin plus a few kanji.

## Swap in your own photos
Two slots: `hero-ink` (1:1) and `atelier-room` (4:5). Set `data-photo="assets/images/<file>"`, and the photo ink-washes in like the artwork. See [`public/assets/README.md`](public/assets/README.md).

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-02): no "Yugure Tea" found. Similar names exist (Yugen Tea in Vilnius and Melbourne), so the name was kept.
- Japanese words appear with `lang="ja"`. The decorative vertical title is `aria-hidden`, because the English h1 carries the meaning.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
