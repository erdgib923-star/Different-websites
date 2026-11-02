# The Shoalreach Atlas: a scrollytelling atlas of a fictional coastline

> **Everything here is fictional.**
>
> - **Shoalreach**, its towns, islands and river are invented.
> - **Every map, tide, temperature and erosion figure is synthetic sample data**, generated in code (`src/geo.js`).
> - The contact details use example.com and 555-0100.
>
> **Brand rename:** you suggested "Tidewater". A web search showed that name is a well-known real company (Tidewater Inc., NYSE: TDW) and also the name of several other businesses, so I renamed the atlas **Shoalreach**. A search for "Shoalreach" found no matching brand. The repository folder keeps your requested name.

Built with **Vite 8, TypeScript, D3 7 (contour, geo, shape, scale), GSAP 3.15 (ScrollTrigger + SplitText) and Lenis**.

## Concept and design direction

1. **A printed atlas that moves.** Paper-white pages, deep-sea navy chapters, and a Newsreader serif at reading sizes.
2. **One map, many states.** A single sticky SVG panel changes with each chapter instead of a new chart per section.
3. **The coastline becomes the data.** In chapter 3, the shore line morphs into the tide curve.
4. **Colour is the method.** One-hue depth, a two-hue diverging scale for temperature, and validated two-series lines.
5. **Readable without the motion.** Every value appears in a table, and the base map is pre-rendered into the HTML.

## Chapters

| # | Chapter | What the panel does |
|---|---|---|
| 1 | The reach | Base map. Place labels stagger in, then the view zooms to the estuary and two annotations pop in. |
| 2 | Depth | The flat sea fades away as the six depth bands reveal from shallow to deep. A depth legend pops in. |
| 3 | The tide | A paper veil covers the map and the **coastline morphs into a 48-hour tide curve**. Axes appear and high/low-water markers pop in. Hover shows a crosshair and tooltip. |
| 4 | Warming water | Hexagonal sea zones are coloured by temperature anomaly on a diverging scale, with a legend and per-zone tooltips. |
| 5 | A shore in retreat | A **scrubbed timeline**: scrolling a 240–260 vh step moves the year from 1950 to 2025. The blue shoreline retreats from the fixed dashed 1950 line, and the per-segment bar inset grows. A range slider (mouse, touch or arrow keys) controls the same year. |
| 6 | What the reach asks | All layers are calm again, the fastest-eroding segment is annotated, and three stat cards pop in. |

## Color Brief

| | |
|---|---|
| **Mood** | Calm, archival, maritime; paper and deep water |
| **Hue anchors** | Brand navy h 252 · neutral h 250 (chroma 0.012) · accent coral h 40 |
| **Harmony** | Complementary (navy against coral). Coral is both the only UI accent and the warm pole of the diverging data scale. |
| **60 / 30 / 10** | 60% paper (`neutral-50/100`) · 30% navy (text, deep-sea sections, water) · 10% coral (chapter labels, slider, warm data, historic shoreline) |

**Token pipeline:**

- Three 11-step OKLCH ramps (even lightness steps, chroma-only gamut mapping), generated from `scripts/palette.config.mjs` into `src/styles/tokens.css`.
- Hex fallbacks first, then OKLCH inside `@supports`.
- A display-P3 coral highlight token inside `@media (color-gamut: p3)`.
- Tokens follow the **design-system-creator** three tiers: primitives → semantic (`bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus`, plus night and map roles) → component (`--card-*`, `--panel-bg`, `--map-*`). The spacing scale is 8 px based and the type scale is 1.25.

**Data scales** were checked with the dataviz skill's `validate_palette.js` (OKLab ΔE, Machado CVD simulation):

| Scale | Colours | Result |
|---|---|---|
| Depth (sequential, one hue) | `brand-300 … brand-800` (6 steps) | ordinal: PASS. A first attempt starting at `brand-100` failed the light-end contrast check (1.37:1) and was re-stepped. |
| Temperature anomaly (diverging) | `brand-700/500/300` · grey midpoint `neutral-200` · `accent-300/500/700` | Each arm passes as ordinal. The arms are mirror-symmetric in lightness by construction. |
| Shoreline lines (2 series) | `brand-600` + `accent-500` | categorical: PASS. Normal-vision ΔE 29.9, protan ΔE 20.2. A first attempt with `brand-700` failed the lightness band. The lines also differ by dash pattern, so identity never relies on colour alone. |

- **Gradients** are interpolated `in oklch`, with plain-gradient fallbacks.
- **Shadows** are tinted with `brand-900`, never black.
- **Grain:** SVG noise over the hero gradient.

### Contrast results (`npm run contrast`)

| Pair | Foreground | Background | Ratio | Target | Result |
|---|---|---|---|---|---|
| Body text on paper | `--text` #001024 | `--bg` #f6fbff | 18.34:1 | 4.5:1 | pass |
| Muted text on paper | `--text-muted` #43484e | `--bg` #f6fbff | 8.80:1 | 4.5:1 | pass |
| Muted text on card | `--text-muted` #43484e | `--surface` #d9dfe6 | 6.85:1 | 4.5:1 | pass |
| Muted text on raised card | `--text-muted` #43484e | `--surface-2` #bec4cb | 5.23:1 | 4.5:1 | pass |
| Coral links / labels on paper | `--accent` #8e3914 | `--bg` #f6fbff | 7.34:1 | 4.5:1 | pass |
| Button label on coral | `--accent-contrast` #f6fbff | `--accent` #8e3914 | 7.34:1 | 4.5:1 | pass |
| Button label on coral (hover) | `--accent-contrast` #f6fbff | `--accent-strong` #6c2f16 | 9.82:1 | 4.5:1 | pass |
| Focus ring (UI) | `--focus` #1a61a5 | `--bg` #f6fbff | 6.12:1 | 3:1 | pass |
| Slider track / control outline (UI) | `--border-strong` #71777e | `--bg` #f6fbff | 4.32:1 | 3:1 | pass |
| Text on deep-sea section | `--night-text` #f6fbff | `--night` #0d2239 | 15.37:1 | 4.5:1 | pass |
| Muted text on deep-sea section | `--night-muted` #a4aab1 | `--night` #0d2239 | 6.83:1 | 4.5:1 | pass |
| Coral labels on deep-sea section | `--night-accent` #f88964 | `--night` #0d2239 | 6.69:1 | 4.5:1 | pass |
| Muted text on deep-sea card | `--night-muted` #a4aab1 | `--night-2` #0e365d | 5.24:1 | 4.5:1 | pass |
| Place labels on land | `--text` #001024 | `--land` #d9dfe6 | 14.28:1 | 4.5:1 | pass |
| Coastline vs shallowest water (graphic) | `--coast` #0d2239 | `--brand-300` #67aaf3 | 6.56:1 | 3:1 | pass |
| Map labels on shallowest water band | `--text` #001024 | `--brand-300` #67aaf3 | 7.82:1 | 4.5:1 | pass |
| Map labels on deepest water band | `--night-text` #f6fbff | `--brand-800` #0e365d | 11.81:1 | 4.5:1 | pass |
| Shoreline 2025 series vs paper (graphic) | `--brand-600` #1a61a5 | `--bg` #f6fbff | 6.12:1 | 3:1 | pass |
| Historic shoreline series vs paper (graphic) | `--accent-500` #cc572b | `--bg` #f6fbff | 4.05:1 | 3:1 | pass |

## Motion system

Tokens are in `src/motion.ts`:

- **Durations:** 0.4 / 0.6 / 0.8 / 1.2 s.
- **Easing:** `expo.out` / `power3`, with `back.out(2.6)` for the pop overshoot.
- **Stagger:** 75 ms.
- **Pop:** scale 0.9 → ~1.02 → 1, y 24 → 0, opacity 0 → 1, blur 8 → 0.

**Sitewide choreography:**

- **Hero:** SplitText headline. Three wave layers parallax at different speeds (the parallax layer pair).
- **Chapter headings:** split on scroll.
- **Field prints:** clip-path reveals (up, left, right).
- **Stat cards:** pop with stagger.
- **Atlas:**
  - Annotations pop in from their anchor point (`svgOrigin`).
  - Legends pop on state change.
  - View-box zooms run on `power3.inOut`.
  - The coastline/tide morph interpolates 200 resampled points.
  - The timeline is scrubbed.

**Scroll and loading:**

- Lenis runs on the GSAP ticker, with `ScrollTrigger.update` on scroll.
- `ScrollTrigger.refresh()` runs after fonts load, after `load`, and after each atlas state change.
- **D3 and the atlas are lazy-loaded** (a 63 kB chunk) when the scrolly section approaches. Until then the pre-rendered map is already in place.

**Progressive enhancement:**

- `vite.config.ts` pre-renders the base map SVG, the field prints, the four data tables and the computed headline stats into `index.html` at build time. Without JavaScript you get the full text, a real map and all the data.
- Hidden start states apply only under `html.js:not(.reduced)`, and the 4 s boot fallback removes them if JS fails.
- **Reduced motion:** state changes happen instantly (every duration × 0), with no scrub, parallax or Lenis. The timeline is driven by the slider only.

## Imagery system

There are no photos, generated images or hotlinks:

- **Map:** a height field built from layered value noise with domain warping. `d3-contour` traces the land, depth bands and hill contours, and `d3-geo` draws the paths.
- **Islands and estuary:** shaped analytically.
- **Field prints:** seeded SVG landscapes generated at build time.

Shared lighting rules:

- A low sun on the left (coral disc); shadows fall to the right.
- Navy water and grey land, with grain on the hero.

The three figures use the reusable `figure.media` slot. See [`public/assets/README.md`](public/assets/README.md).

## Accessibility notes

- **Map:** the SVG has `<title>` and `aria-describedby` text. Each chart's values are repeated in a **table view**: four `<details>` tables, pre-rendered.
- **Tooltips:** pointer-only, with the same information in the tables.
- **Timeline:** a native range input that works with the keyboard.
- **Colour:** never the only channel. Lines differ by dash pattern, bars by direction (up for loss, down for gain), and legends name every scale.

## Run and build

```bash
npm install
npm run dev        # tokens + Vite dev server
npm run build      # tokens → tsc --noEmit → vite build (pre-renders map/tables into dist/index.html)
npm run preview    # serve dist/ on http://localhost:4173
npm run contrast   # WCAG check of the generated tokens
```

## Swapping in photos

Add files to `public/assets/images/` and list them in `photos.json`. Slots and sizes are in [`public/assets/README.md`](public/assets/README.md).

## Skills used

Loaded and applied:

- **dataviz** (built-in skill): scale construction, `validate_palette.js` runs, table view, hover layer, selective labels.
- **design-system-creator**: three-tier tokens, spacing and type scales.
- **color-expert**: OKLCH ramps, gamut mapping, diverging scale with a grey midpoint.
- **gsap-web**: Lenis/ScrollTrigger single loop, SplitText, scrub.

**Not available:** `scroll-experience`, `gsap` (I used `gsap-web` instead), `frontend-design`, `accesslint` (axe-core used instead), `web-design-guidelines`, `claude-d3js-skill`.

## Verification

- `npm run build` passes (`tsc --noEmit` strict, then `vite build`).
- `npm run contrast`: all 19 pairs pass.
- **Playwright** at 375, 768 and 1440 px, at 0/25/50/75/100% scroll, plus reduced-motion and no-JS runs:
  - No console errors, no failed requests, no horizontal overflow, one `<h1>`.
  - No-JS shows the pre-rendered map.
- **Per-state captures** of all six chapter states at 1440 and 375 px. These found and fixed:
  - a tween-overwrite bug that hid the tide curve when steps fired back to back
  - an inverted timeline (empty bars at 1950)
  - the "+-0.4 °C" sign bug, plus data that contradicted the warming narrative
  - a low-contrast year label
  - the phone layout, where cards covered the map
- **axe-core** (WCAG 2.2 AA + best-practice), with and without reduced motion: **0 violations**. axe reports text over SVG fills as "incomplete" because it can't compute those backgrounds. Those pairs are in the contrast table.

## Notes and known limitations

- **Repository.** This session can only push to `Different-websites`, so the site lives in `pro-sites/`. `pro-sites/split-into-repos.sh` publishes it as its own private repo with your `gh` login.
- **Browsers.** Only headless Chromium was tested; Safari and Firefox are untested.
- **Cartography.** The map is deliberately stylised. Depth bands are smooth contours, not survey data.
