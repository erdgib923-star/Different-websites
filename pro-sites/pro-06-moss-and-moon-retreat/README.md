# Mossmere: a botanical wellness retreat

> **Everything here is fictional.**
>
> - Mossmere, Greywater Valley, the cabins, rates, availability and contact details are invented. The email uses example.com and the phone number is 555-0100.
> - The booking calendar uses **sample availability** and sends nothing.
>
> **Brand rename:** you suggested "Moss & Moon". A web search found an existing lodging business called Moss & Moon Cabins, so I renamed the retreat **Mossmere**. A search for "Mossmere" found no matching retreat. The repository folder keeps your requested name.

Built with **Vite 8, TypeScript, GSAP 3.15 (ScrollTrigger + SplitText), Lenis and inline SVG**. Every plant and blob is drawn in code.

## Concept and design direction

1. **A garden you can scroll through.** Soft Fraunces headlines (SOFT and WONK axes) over cream paper, with sage cards and rounded everything.
2. **Plants drawn in code.** Fern, willow and round-leaf sprigs are generated from a seed. They sway with scroll velocity and settle with a spring.
3. **Living shapes.** Organic blobs morph slowly behind the hero, like moss under water.
4. **Day and night.** One button switches the whole palette through `light-dark()`. The sun becomes a moon, and a circular view transition grows from the button.
5. **Booking without a backend.** A full, keyboard-friendly range calendar shows the experience honestly, with sample data.

## Color Brief

| | |
|---|---|
| **Mood** | Damp, calm, restorative; morning moss and a lamp-lit night |
| **Hue anchors** | Brand: one analogous green ramp from pale sage (h ≈ 145) to deep moss (h ≈ 123) · neutral: warm cream (h 88) · accent: terracotta (h 42) |
| **Harmony** | Analogous greens with a warm counterpoint. Terracotta is the painter's traditional complement to moss. Strictly in OKLCH, the opposite of moss (h 134) is about h 314 (magenta), so terracotta works here as a **warm split-complement**. |
| **60 / 30 / 10** | 60% cream (day) or deep moss (night) background · 30% sage/moss (cards, blobs, plants, itinerary panel) · 10% terracotta (CTAs, times, the sun, links) |

**Tokens:**

- `scripts/palette.config.mjs` → `src/styles/tokens.css`.
- Three 11-step OKLCH ramps, each with hex fallbacks, OKLCH under `@supports`, and a display-P3 `--clay-hi`.
- **Every semantic token has a day and a night value**, emitted three ways:
  1. A plain light value, for browsers without `light-dark()`.
  2. Explicit dark values under `@supports not (color: light-dark(#000,#fff))`, for both `prefers-color-scheme` and `[data-theme=dark]`.
  3. `light-dark()` for modern browsers, driven by `color-scheme`, which the toggle sets.

**Rendering:**

- **Shadows** are tinted `brand-900`, never black.
- **Grain:** a soft-light overlay at 8%.
- **Lighting:** every leaf is two-tone, with the half facing the top-left light in the paler `--leaf` and the other half in `--leaf-deep`.
- **Data colours:** not applicable; there are no charts.

### Contrast results (`npm run contrast`, both themes)

| Pair | Foreground | Background | Ratio | Target | Result |
|---|---|---|---|---|---|
| light · Body text | `--text` #0f1405 | `--bg` #fbf6ec | 17.44:1 | 4.5:1 | pass |
| light · Muted text | `--text-muted` #303c1f | `--bg` #fbf6ec | 10.95:1 | 4.5:1 | pass |
| light · Text on card | `--text` #0f1405 | `--surface` #e0dcd2 | 13.63:1 | 4.5:1 | pass |
| light · Muted text on card | `--text-muted` #303c1f | `--surface` #e0dcd2 | 8.55:1 | 4.5:1 | pass |
| light · Muted text on sage panel | `--text-muted` #303c1f | `--surface-2` #c6e1c4 | 8.38:1 | 4.5:1 | pass |
| light · Text over hero blobs | `--text` #0f1405 | `--blob` #c6e1c4 | 13.35:1 | 4.5:1 | pass |
| light · Terracotta labels / links | `--accent` #884427 | `--bg` #fbf6ec | 6.72:1 | 4.5:1 | pass |
| light · Terracotta on card | `--accent` #884427 | `--surface` #e0dcd2 | 5.25:1 | 4.5:1 | pass |
| light · Button label on terracotta | `--accent-contrast` #fbf6ec | `--accent` #884427 | 6.72:1 | 4.5:1 | pass |
| light · Button label on terracotta (hover) | `--accent-contrast` #fbf6ec | `--accent-strong` #693823 | 8.91:1 | 4.5:1 | pass |
| light · Booked-out dates (UI, also struck through) | `--disabled` #7a766e | `--surface` #e0dcd2 | 3.28:1 | 3:1 | pass |
| light · Focus ring (UI) | `--focus` #a55330 | `--bg` #fbf6ec | 5.04:1 | 3:1 | pass |
| light · Focus ring on card (UI) | `--focus` #a55330 | `--surface` #e0dcd2 | 3.93:1 | 3:1 | pass |
| light · Control outlines (UI) | `--border-strong` #506a3a | `--bg` #fbf6ec | 5.62:1 | 3:1 | pass |
| light · Control outlines on card (UI) | `--border-strong` #506a3a | `--surface` #e0dcd2 | 4.39:1 | 3:1 | pass |
| light · Botanical line art (graphic) | `--leaf` #63824e | `--bg` #fbf6ec | 4.03:1 | 3:1 | pass |
| dark · Body text | `--text` #fbf6ec | `--bg` #0f1405 | 17.44:1 | 4.5:1 | pass |
| dark · Muted text | `--text-muted` #aba79e | `--bg` #0f1405 | 7.85:1 | 4.5:1 | pass |
| dark · Text on card | `--text` #fbf6ec | `--surface` #202615 | 14.44:1 | 4.5:1 | pass |
| dark · Muted text on card | `--text-muted` #aba79e | `--surface` #202615 | 6.50:1 | 4.5:1 | pass |
| dark · Muted text on sage panel | `--text-muted` #aba79e | `--surface-2` #303c1f | 4.93:1 | 4.5:1 | pass |
| dark · Text over hero blobs | `--text` #fbf6ec | `--blob` #202615 | 14.44:1 | 4.5:1 | pass |
| dark · Terracotta labels / links | `--accent` #eb9170 | `--bg` #0f1405 | 7.88:1 | 4.5:1 | pass |
| dark · Terracotta on card | `--accent` #eb9170 | `--surface` #202615 | 6.53:1 | 4.5:1 | pass |
| dark · Button label on terracotta | `--accent-contrast` #0f1405 | `--accent` #eb9170 | 7.88:1 | 4.5:1 | pass |
| dark · Button label on terracotta (hover) | `--accent-contrast` #0f1405 | `--accent-strong` #f9ac90 | 10.12:1 | 4.5:1 | pass |
| dark · Booked-out dates (UI, also struck through) | `--disabled` #928f85 | `--surface` #202615 | 4.78:1 | 3:1 | pass |
| dark · Focus ring (UI) | `--focus` #eb9170 | `--bg` #0f1405 | 7.88:1 | 3:1 | pass |
| dark · Focus ring on card (UI) | `--focus` #eb9170 | `--surface` #202615 | 6.53:1 | 3:1 | pass |
| dark · Control outlines (UI) | `--border-strong` #779b67 | `--bg` #0f1405 | 5.93:1 | 3:1 | pass |
| dark · Control outlines on card (UI) | `--border-strong` #779b67 | `--surface` #202615 | 4.91:1 | 3:1 | pass |
| dark · Botanical line art (graphic) | `--leaf` #779b67 | `--bg` #0f1405 | 5.93:1 | 3:1 | pass |

Booked-out dates use `--disabled` (≥ 3:1). They are also **struck through** and labelled "booked (sample)" in their accessible name, so colour is never the only cue.

## Motion system

Tokens are in `src/motion.ts`:

- **Durations:** 0.4 / 0.6 / 0.8 / 1.2 s.
- **Easing:** `expo.out` / `power3`, with `back.out(2.6)` for the pop.
- **Stagger:** 75 ms.
- **Pop:** scale 0.9 → ~1.02 → 1, y 24 → 0, blur 8 → 0.

| Section | Choreography |
|---|---|
| Hero | SplitText headline. Three blobs morph continuously (a closed Catmull-Rom spline through wobbling radii, about 30 fps, only while the hero is visible). **Parallax pair:** blobs at −0.2 and sprigs at +0.35 / +0.55. |
| Everywhere | Sprigs (`.sway`) rotate and skew by scroll velocity, then spring back with `elastic.out` |
| Intro, cabins | clip-path reveals, with the art settling from 1.2× |
| Rituals | Staggered card pop-ins |
| Itinerary | **Scrubbed** terracotta line drawing down the timeline. Days and items pop in as they arrive. The heading is sticky on desktop. |
| Booking | Card pop-in. Selected days pop, months slide, and the guest count and confirmation pop. |
| Theme switch | View Transitions API: a circular `clip-path` grows from the toggle (instant under reduced motion or without support) |

**Scroll:**

- Lenis runs on the GSAP ticker, and anchors go through `lenis.scrollTo` with focus moved to the target.
- `ScrollTrigger.refresh()` runs after fonts and `load`.

**Progressive enhancement:**

- `vite.config.ts` **pre-renders the first frame of every blob, sprig and cabin illustration into the HTML**, so the page is complete without JS. The calendar shows a `<noscript>` note with an email alternative.
- **Reduced motion:** no blob morphing, sway, parallax, scrub or Lenis. Everything is shown in its final state.

## The booking calendar

The calendar follows the WAI-ARIA grid pattern:

- **Keyboard:** roving `tabindex`. Arrow keys move by day, Up and Down by week, Home and End to the week's edges, Page Up and Page Down by month. Enter or Space selects.
- **Unavailable days** use `aria-disabled` rather than `disabled`, so the keyboard can travel across them. Selecting one explains why it can't be chosen.
- **Selection state** is set with `aria-selected` on the `gridcell`, and today is marked with `aria-current="date"`.
- **Range rules:** the first click sets the arrival and the second sets the departure. If a range would cross a booked night, the new date becomes the arrival and a message explains.
- **Summary:** nights, guests (a stepper from 1 to 4) and an estimate at sample rates, all in polite live regions.

## Run and build

```bash
npm install
npm run dev        # tokens + Vite dev server
npm run build      # tokens → tsc --noEmit → vite build (botanicals pre-rendered into dist/index.html)
npm run preview    # serve dist/ on http://localhost:4173
npm run contrast   # WCAG check of both themes
```

## Swapping in photos

See [`public/assets/README.md`](public/assets/README.md).

## Skills used

Loaded and applied:

- **color-expert:** OKLCH ramps, theme tokens, contrast in both themes.
- **color-theory-palette-harmony-expert:** analogous greens with a warm counterpoint, and warm/cool balance.
- **design-system-creator:** three-tier tokens with light and dark values.
- **gsap-web:** the Lenis + ScrollTrigger loop, SplitText, scrub, velocity-based motion.

**Not available:** `frontend-design`, `taste-skill`, `accesslint`. I ran axe-core instead of accesslint.

## Verification

- `npm run build` passes (`tsc --noEmit` strict, then `vite build`).
- `npm run contrast`: all 32 pairs pass (16 per theme).
- **Playwright** at 375, 768 and 1440 px, at 0/25/50/75/100% scroll, plus reduced-motion and no-JS runs:
  - No console errors, failed requests or overflow; one `<h1>`.
  - Separate night-theme captures using `colorScheme: 'dark'`.
- **Interaction tests:**
  - The theme toggle switches `data-theme` and `aria-pressed`, and the background changes.
  - Keyboard calendar navigation moves focus correctly, including across unavailable days.
  - A range that crosses a booked night restarts from the new date with a message.
  - Mouse selection of 14–17 Dec for 3 guests gives "3 nights, $840 (sample)", and the request is "held" with the demo notice.
- **axe-core** in both themes: **0 violations**. The first dark-mode run flagged `aria-selected` on buttons, which I moved to the gridcells. Bugs found by testing and fixed:
  - Disabled days broke arrow-key navigation (now `aria-disabled`).
  - A `<span>` sat directly inside an `<ol>`.

## Notes and known limitations

- **Repository.** This session can only push to `Different-websites`, so the site lives in `pro-sites/`. `pro-sites/split-into-repos.sh` publishes it as its own private repo.
- **Browsers.** The view-transition theme reveal only runs in browsers that support the View Transitions API; elsewhere the theme switches instantly. Only headless Chromium was tested.
- **Rates.** The estimate uses one sample nightly rate ($240, plus $40 per extra guest) whichever cabin you look at. It is a demo of the interaction, not a pricing engine.
