# Plinthwell Architects: buildings that start at the ground

> **Everything here is fictional.**
>
> - Plinthwell Architects, its projects, the places (Eastwold, Sallow, Brackenford) and the address (4 Foundry Yard) are invented.
> - The figures are sample data, the email uses example.com and the phone number is 555-0100.
>
> **Brand rename:** you suggested "Strata Architects". A web search found several real practices with that exact name (in New Zealand, Seattle and Kansas City), so I renamed the firm **Plinthwell Architects**. A search for "Plinthwell" found no matching firm. The repository folder keeps your requested name.

Built with **Vite 8, TypeScript, GSAP 3.15 (ScrollTrigger, SplitText, Flip), Lenis and code-generated SVG**.

## Concept and design direction

1. **The drawing set is the website.** Elevations, a plan and isometric stages draw themselves line by line, in the order architects draw.
2. **Concrete and blueprint.** Blue-tinted concrete greys with one full-bleed blueprint section, on a strict grid with hairline rules.
3. **Condensed and mono.** Archivo, narrowed with its `wdth` axis, in uppercase for headings; Martian Mono for dimensions and labels.
4. **Safety orange means "look here".** It is reserved for dimension callouts, the slider handle, active filters, the entrance and CTAs.
5. **Proof, not adjectives.** A before/after restoration and a filterable project index carry the portfolio.

## Color Brief

| | |
|---|---|
| **Mood** | Precise, calm, constructive; a drawing office on site |
| **Hue anchors** | Neutral concrete h 245 (chroma 0.012) · brand blueprint blue h 258 · accent safety orange h 48 |
| **Harmony** | Complementary (blueprint blue against safety orange), over cool-tinted neutrals |
| **60 / 30 / 10** | 60% concrete greys (`neutral-100/200`, cards `neutral-50`) · 30% blueprint blue and ink line work · 10% safety orange |

**Tokens:**

- `scripts/palette.config.mjs` → `src/styles/tokens.css`: three 11-step OKLCH ramps, hex fallbacks, OKLCH inside `@supports`, and a display-P3 `--safety-hi`.
- Orange comes in three roles:
  - `accent` (`accent-400`) for fills under dark text.
  - `mark` (`accent-600`) for thin dimension lines on light grounds. The first contrast run failed the bright orange as a line colour at 2.16:1.
  - `accent-text` (`accent-700`) for orange text.

**Rendering:**

- **Shadows** are tinted `neutral-900`, never black.
- **Grain:** a multiply overlay at 7%.
- **Lighting rule:** every drawing is lit from the top-left. Shadows are hatched (45° lines) on the right-hand and underside faces, sills cast hatched shadows, and isometric faces step from top (lightest) to left (mid) to right (shaded and hatched).
- **Data colours:** not applicable; there are no charts.

### Contrast results (`npm run contrast`)

| Pair | Foreground | Background | Ratio | Target | Result |
|---|---|---|---|---|---|
| Text on concrete | `--text` #0b1014 | `--bg` #d6dde4 | 13.96:1 | 4.5:1 | pass |
| Muted text on concrete | `--text-muted` #464c51 | `--bg` #d6dde4 | 6.40:1 | 4.5:1 | pass |
| Text on card | `--text` #0b1014 | `--surface` #f0f8ff | 17.80:1 | 4.5:1 | pass |
| Muted text on card | `--text-muted` #464c51 | `--surface` #f0f8ff | 8.16:1 | 4.5:1 | pass |
| Muted text on darker panel | `--text-muted` #464c51 | `--surface-2` #bcc3ca | 4.92:1 | 4.5:1 | pass |
| Text and links on contact panel | `--text` #0b1014 | `--surface-2` #bcc3ca | 10.74:1 | 4.5:1 | pass |
| Orange labels on concrete | `--accent-text` #9e4200 | `--bg` #d6dde4 | 4.74:1 | 4.5:1 | pass |
| Orange labels on card | `--accent-text` #9e4200 | `--surface` #f0f8ff | 6.05:1 | 4.5:1 | pass |
| Label on safety-orange button / callout | `--accent-contrast` #0b1014 | `--accent` #f36f00 | 6.45:1 | 4.5:1 | pass |
| Orange dimension marks on concrete (graphic) | `--mark` #ba5100 | `--bg` #d6dde4 | 3.61:1 | 3:1 | pass |
| Orange dimension marks on card (graphic) | `--mark` #ba5100 | `--surface` #f0f8ff | 4.61:1 | 3:1 | pass |
| Drawing line weight (graphic) | `--line` #31363c | `--surface` #f0f8ff | 11.32:1 | 3:1 | pass |
| Focus ring (UI) | `--focus` #2b61b0 | `--bg` #d6dde4 | 4.44:1 | 3:1 | pass |
| Control outlines (UI) | `--border-strong` #72797f | `--bg` #d6dde4 | 3.22:1 | 3:1 | pass |
| Text on blueprint | `--blueprint-text` #f0f8ff | `--blueprint` #1a3a68 | 10.60:1 | 4.5:1 | pass |
| Muted text on blueprint | `--blueprint-muted` #95c0ff | `--blueprint` #1a3a68 | 6.09:1 | 4.5:1 | pass |
| Plan lines on blueprint (graphic) | `--blueprint-line` #bdd8ff | `--blueprint` #1a3a68 | 7.81:1 | 3:1 | pass |
| Orange dimensions on blueprint | `--blueprint-accent` #ff8d48 | `--blueprint` #1a3a68 | 4.94:1 | 4.5:1 | pass |
| Text on blueprint card | `--blueprint-text` #f0f8ff | `--blueprint-2` #214d8d | 7.80:1 | 4.5:1 | pass |

## Motion system

Tokens are in `src/motion.ts`:

- **Durations:** 0.4 / 0.6 / 0.8 / 1.2 s.
- **Easing:** `expo.out` / `power3`, with `back.out(2.6)` for the pop.
- **Stagger:** 75 ms.
- **Pop:** scale 0.9 → ~1.02 → 1, y 24 → 0, blur 8 → 0.
- **Draw-on** follows the svg-animation skill: each stroke has `pathLength="1"` and `stroke-dasharray: 1`, and `stroke-dashoffset` is tweened from 1 to 0.

| Section | Choreography |
|---|---|
| Hero | SplitText headline. The elevation draws itself (55 strokes, staggered), then its **dimension callouts pop in**. The drawing and the background grid form a **parallax pair** (+0.12 / −0.25). |
| Practice | Stat rows pop in |
| Blueprint | **Pinned and scrubbed** for 180% of the viewport: walls → doors and windows → stair and fit-out → room labels and dimensions pop in. The step list on the left tracks the pass. |
| Process | **Pinned walkthrough** for 240%. Four isometric stages (site, massing, structure, facade) wipe in with clip-path, the captions stay **synced** (the active caption expands and pops), there is a progress bar, and the scroll snaps to each stage. |
| Before/after | The card pops in, the handle sweeps 50 → 22 → 78 → 50% once to show it can be dragged, and both drawings draw on |
| Projects | Thumbnails draw on as they arrive. The **filter** uses GSAP **Flip** (cards slide into new positions, leaving cards shrink out) with a live count. |

**Scroll:**

- Lenis runs on the GSAP ticker, and anchors go through `lenis.scrollTo` with focus moved to the target.
- `ScrollTrigger.refresh()` runs after fonts, after `load`, and after each Flip.

**Progressive enhancement:**

- `vite.config.ts` pre-renders every drawing into the HTML.
- Draw-on and hidden-dimension start states apply only under `html.js:not(.reduced)`. Without JS or under reduced motion:
  - Every drawing is complete.
  - The walkthrough shows all four stages in a 2×2 grid, with every caption visible.
  - There is no pinning, sweep or Flip.

**Before/after accessibility:**

- The slider is a native `<input type=range>` laid over the image. It has a label, keyboard arrows and an `aria-valuetext` like "40% before, 60% after".
- The visible handle shows a focus ring when the input is focused.

## Run and build

```bash
npm install
npm run dev        # tokens + Vite dev server
npm run build      # tokens → tsc --noEmit → vite build (drawings pre-rendered into dist/index.html)
npm run preview    # serve dist/ on http://localhost:4173
npm run contrast   # WCAG check of the generated tokens
```

## Swapping in photos

See [`public/assets/README.md`](public/assets/README.md) for every slot and size.

## Skills used

Loaded and applied:

- **gsap-web:** pinning, scrub, snap, Flip, SplitText, the Lenis single loop.
- **svg-animation:** `pathLength`-normalised draw-on.
- **color-expert:** OKLCH ramps, and separate fill, line and text roles for the accent.

**Not available:** `frontend-design`, `epic-design`, `gsap` (I used `gsap-web` instead), `scroll-experience`, `impeccable`, `web-design-guidelines`.

## Verification

- `npm run build` passes (`tsc --noEmit` strict, then `vite build`).
- `npm run contrast`: all 19 pairs pass.
- **Playwright** at 375, 768 and 1440 px, at 0/25/50/75/100% scroll, plus reduced-motion and no-JS runs: no console errors, failed requests or overflow; one `<h1>`.
- **Interaction checks:**
  - The hero draws all 55 strokes and both dimension callouts appear.
  - Ten presses of ArrowLeft on the before/after slider give 40% ("40% before, 60% after").
  - The Civic filter shows exactly 2 cards with a "Showing 2 civic projects" live count, and All restores 9.
- **axe-core**, with and without reduced motion: **0 violations**. The first run found two problems, both fixed:
  - Bronze contact links at 3.64:1. That pair was missing from my contrast table; it has been added.
  - `role="img"` on a captioned `<figure>`.

## Notes and known limitations

- **Repository.** This session can only push to `Different-websites`, so the site lives in `pro-sites/`. `pro-sites/split-into-repos.sh` publishes it as its own private repo.
- **Phones.** On short phone screens the pinned blueprint and walkthrough sections are close to the viewport height. They fitted at 375 × 812, but very short screens may crop the bottom of the drawing while pinned.
- **Browsers.** Only headless Chromium was tested.
