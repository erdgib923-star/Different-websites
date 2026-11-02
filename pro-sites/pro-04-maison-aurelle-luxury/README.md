# Maison Aurelle: Automne–Hiver 2026

> **Everything here is fictional.** Maison Aurelle, its collection, the atelier at "12 Quai des Tisseurs, Lyonne", the numbered edition, the figures, the email (example.com) and the phone number (555-0100) are invented for a design demo. A web search for "Maison Aurelle" found no matching brand.

A single-page collection site built with **Vite 8, TypeScript, GSAP 3.15 (ScrollTrigger + SplitText) and Lenis**. All imagery is **generative fabric** made with SVG filters.

## Concept and design direction

1. **Quiet luxury, editorial.** Ivory paper and ink type, with huge Bodoni Moda set against small, widely tracked Hanken Grotesk capitals.
2. **The cloth is the image.** Each look is a textile study generated from SVG turbulence, displacement and lighting, not a photo of a model.
3. **Slow motion.** Long expo curtains (clip-path), unhurried scrubbing, and nothing that bounces.
4. **Gold is a hairline, not a fill.** Champagne gold appears only as rules, numerals and the preview frame.
5. **Bordeaux, once.** A single full-bleed bordeaux section is the collection's one saturated moment.

## Color Brief

| | |
|---|---|
| **Mood** | Hushed, tactile, autumnal, expensive |
| **Hue anchors** | Neutral h 80 (ivory → ink, chroma 0.007) · Brand bordeaux h 15 · Accent champagne gold h 86 |
| **Harmony** | Analogous warm (gold 86° and bordeaux 15° sit on the warm side, about 70° apart) over near-achromatic neutrals |
| **60 / 30 / 10** | 60% ivory paper (`neutral-50/100`) · 30% ink (type, the index section, ink fabrics) · 10% champagne gold (rules, numerals, labels). The bordeaux section is a single deliberate full-bleed exception. |

**Token pipeline:**

- `scripts/palette.config.mjs` → `scripts/build-tokens.mjs` → `src/styles/tokens.css`.
- Three 11-step OKLCH ramps (even lightness steps, chroma-only gamut mapping).
- Hex fallbacks first, OKLCH inside `@supports`, and a display-P3 `--gold-hi` inside `@media (color-gamut: p3)`.
- Semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus`, plus `ink-*` and `bordeaux-*` section roles.
- **The fabric generator reads the same palette config,** so every textile uses ramp colours only.
- **Shadows** are tinted with `neutral-950`, never black.
- **Grain:** a paper-grain overlay (multiply, 6%), plus grain on the bordeaux section.
- **Data colours:** not applicable; there are no charts.

### Contrast results (`npm run contrast`)

| Pair | Foreground | Background | Ratio | Target | Result |
|---|---|---|---|---|---|
| Ink text on ivory | `--text` #0f0d0a | `--bg` #f9f6f2 | 18.06:1 | 4.5:1 | pass |
| Muted text on ivory | `--text-muted` #4b4845 | `--bg` #f9f6f2 | 8.41:1 | 4.5:1 | pass |
| Muted text on oat surface | `--text-muted` #4b4845 | `--surface` #dedbd7 | 6.57:1 | 4.5:1 | pass |
| Bronze-gold labels on ivory | `--accent` #6c582d | `--bg` #f9f6f2 | 6.33:1 | 4.5:1 | pass |
| Ivory label on ink button | `--accent-contrast` #f9f6f2 | `--text` #0f0d0a | 18.06:1 | 4.5:1 | pass |
| Focus ring (UI) | `--focus` #846c36 | `--bg` #f9f6f2 | 4.69:1 | 3:1 | pass |
| Control outlines (UI) | `--border-strong` #797672 | `--bg` #f9f6f2 | 4.20:1 | 3:1 | pass |
| Decorative gold hairline (non-text, decorative) | `--accent-line` #b0965b | `--bg` #f9f6f2 | 2.66:1 | 1.5:1 | pass |
| Text on ink section | `--ink-text` #f9f6f2 | `--ink` #0f0d0a | 18.06:1 | 4.5:1 | pass |
| Muted text on ink section | `--ink-muted` #918e8a | `--ink` #0f0d0a | 5.98:1 | 4.5:1 | pass |
| Gold numerals on ink | `--ink-accent` #c4ac76 | `--ink` #0f0d0a | 8.82:1 | 4.5:1 | pass |
| Text on bordeaux moment | `--bordeaux-text` #f9f6f2 | `--bordeaux` #5c282c | 10.91:1 | 4.5:1 | pass |
| Muted text on bordeaux | `--bordeaux-muted` #c4c1bd | `--bordeaux` #5c282c | 6.54:1 | 4.5:1 | pass |
| Gold labels on bordeaux | `--bordeaux-accent` #d7c495 | `--bordeaux` #5c282c | 6.81:1 | 4.5:1 | pass |

The gold hairline (`accent-line`, 2.66:1) is decorative and is never the only cue for anything. Its target is set to 1.5:1 so it is recorded rather than hidden. Text in gold uses `accent` (`accent-700`, 6.33:1).

## Motion system

Tokens are in `src/motion.ts`:

- **Durations:** 0.4 / 0.6 / 0.8 / 1.2 s.
- **Easing:** `expo.out` / `power3`, with `back.out(2.6)` for the pop.
- **Stagger:** 75 ms.
- **Pop:** scale 0.9 → ~1.02 → 1, y 24 → 0, blur 8 → 0.

| Section | Choreography |
|---|---|
| Hero | SplitText headline rise. The text and the silk image form a **parallax pair** (−0.35 / +0.18). The image opens with a clip-path curtain. |
| Manifesto | Line-by-line masked reveal of the paragraph |
| Lookbook | **Pinned horizontal scroll** (≥ 768 px), scrubbed with a counter and a gold progress rule. Each fabric opens with a clip-path curtain and a 1.25 → 1 settle as it slides in (`containerAnimation`). Captions pop in after it. |
| Bordeaux moment | Clip-path reveal from the centre, with a split heading |
| Collection index | Rows pop in with stagger. Hovering a row brings in a **cursor-following preview** with a gold frame. Each change of cloth runs an `feDisplacementMap` ripple (scale 60 → 0) and a scale settle. |
| Atelier | Clip-path reveals and staggered stat pop-ins |

**Scroll:**

- Lenis runs on the GSAP ticker (`lenis.raf(t * 1000)`, `lagSmoothing(0)`).
- Anchors are routed through `lenis.scrollTo` and move focus to the target.
- `ScrollTrigger.refresh()` runs after fonts and `load`.

**Progressive enhancement:**

- Hidden start states apply only under `html.js:not(.reduced)`, with a 4 s boot fallback.
- Without JS, every fabric image is a plain `<img>`, so the whole collection is visible.

**Reduced motion:**

- No Lenis, pinning or parallax.
- The lookbook is a vertical list.
- The preview appears without the ripple.

**Touch:**

- No cursor preview. Each index row shows a small fabric thumbnail inline instead.
- **Keyboard:** focusing a row anchors the preview beside it.

## Imagery system (generative fabric)

`scripts/build-fabrics.mjs` writes 12 standalone SVGs. Each is a recipe of filter primitives:

| Cloth | Technique |
|---|---|
| Twill, gabardine | anisotropic `feTurbulence` (rotated group) → `feDiffuseLighting` |
| Bouclé | fractal noise displaced by turbulence (`feDisplacementMap`) → lighting → curly loops |
| Cashmere | blurred fractal noise → soft lighting |
| Silk, velvet | low-frequency noise → diffuse shading × base colour + `feSpecularLighting` sheen (velvet adds a pile grain) |
| Herringbone | a chevron `<pattern>` → blurred alpha relief + fibre noise → lighting |
| Tweed | turbulence weave + a thresholded noise mask of champagne flecks |

All of them pass through the same **drape**: low-frequency noise drives an `feDisplacementMap`, and its own lighting is multiplied in as folds.

**Shared lighting rule:** one distant light at **azimuth 225° (top-left)**, plus a top-left highlight / bottom-right ink-tinted falloff gradient.

The SVGs are used as `<img>`, so each is **rasterised once** and stays cheap to pin, scroll and transform. This follows the svg-animation skill's warning that filters are paint-heavy. Only the index preview animates a displacement filter, and only on change.

The figure component, photo manifest and duotone are documented in [`public/assets/README.md`](public/assets/README.md).

## Run and build

```bash
npm install
npm run dev        # tokens + fabrics + Vite dev server
npm run build      # tokens → fabrics → tsc --noEmit → vite build
npm run preview    # serve dist/ on http://localhost:4173
npm run contrast   # WCAG check of the generated tokens
npm run fabrics    # regenerate public/fabrics/*.svg only
```

## Swapping in photos

See [`public/assets/README.md`](public/assets/README.md). The slot list includes recommended sizes.

## Skills used

Loaded and applied:

- **gsap-web:** pinned horizontal scroll, `containerAnimation`, SplitText, the Lenis single loop.
- **color-expert:** OKLCH ramps and very-low-chroma neutrals.
- **svg-animation:** filter animation guidance, `<img>` versus inline SVG.

**Not available:** `frontend-design`, `antislopui`, `epic-design`, `taste-skill`, `impeccable`.

## Verification

- `npm run build` passes (`tsc --noEmit` strict, then `vite build`).
- `npm run contrast`: all 14 pairs pass.
- **Playwright** at 375, 768 and 1440 px, at 0/25/50/75/100% scroll, plus reduced-motion and no-JS runs:
  - No console errors, failed requests or horizontal overflow; one `<h1>`.
  - Found and fixed: the phone masthead overlapped the nav, so the nav now sits on its own row and "Appointments" is shortened to "Visit".
- **Interaction (Playwright):**
  - Hovering an index row shows the preview with the right fabric. The ripple runs and settles to 0.
  - Keyboard focus on a row anchors the preview.
- **axe-core**, with and without reduced motion: **0 violations**. The first run flagged `aria-label` on a split `<p>`. Fixed by splitting non-headings with `aria: 'none'`.

## Notes and known limitations

- **Repository.** This session can only push to `Different-websites`, so the site lives in `pro-sites/`. `pro-sites/split-into-repos.sh` publishes it as its own private repo.
- **Rasterisation cost.** The first paint of each fabric SVG costs about 50–100 ms in Chromium. On low-end phones the lookbook images may appear a beat late (they are lazy-loaded).
- **Browsers.** Safari renders SVG lighting filters slightly differently (softer specular). Only headless Chromium was tested.
