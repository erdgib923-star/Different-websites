# Bubbletown: soft toys that bounce back

> **Everything here is fictional.**
>
> - Bubbletown, its six toys (Pip, Juniper, Bo, Tilly, Nova and Remy), the prices, the specs and the "est. 2019" line are invented. Prices are labelled as sample prices, and the page says nothing is for sale.
> - Contact uses `hello@example.com` and `555-0100`.
> - A web search for "Bubbletown" earlier in this session found no matching toy brand.
> - There are no testimonials and no real products. The builder and the game submit nothing.

Built with **Vite 8, TypeScript, Matter.js 0.20, GSAP 3.15 (ScrollTrigger + SplitText) and Lenis**.

Matter.js is installed from npm and bundled by Vite, because cdnjs was not reachable from this build environment. It is **lazy-loaded** as a separate 26 kB (gzip) chunk, so it never blocks first paint.

## Concept and design direction

1. **A toy box, not a hero image.** The ten letters of BUBBLETOWN are physics bubbles you can grab and fling. **Shake** and **Tidy up** buttons give keyboard users the same play.
2. **Pastels that behave.** Six toy colours with identical OKLCH lightness and chroma, so no colour shouts. Each has a plum outline, so it never relies on contrast against the cream page.
3. **Everything springs.** Stickers pop in with elastic overshoot, the maker bubble passes a squish test, and the builder preview wobbles when you change it.
4. **Hands-on sections.** You flip cards, build a bubble and catch stars, so there is something to do in every section, not just read.
5. **Rounded and chunky.** Fredoka for headings, Nunito for body text, 3 px plum outlines and "pressable" button shadows.

## Color Brief

| | |
|---|---|
| **Mood** | Cheerful, soft, safe; a toy shop on a sunny morning |
| **Hue anchors** | Brand plum h 330 (text, outlines, primary buttons) · accent coral h 32 · cream page h 88 · toy pastels peach 25, butter 85, mint 150, sky 215, lilac 285, rose 345 |
| **Harmony** | Plum and cream as a near-complementary base. **Coral** is the single accent hue (prices, labels, focus ring, bonus stars). The six pastels sit at **L 0.86, C 0.068**: C 0.068 is the largest chroma that keeps all six inside sRGB at that lightness, with blue (h 265) the limiting hue at ≈ 0.069. Six roughly evenly spaced hues at equal lightness and chroma look equally heavy. |
| **60 / 30 / 10** | 60% cream (page, cards) · 30% plum (text, outlines, buttons, night-sky game) · 10% pastels and coral (toys, stickers, highlights) |

**Deliberate deviation.** The general brief allows one accent hue beyond the brand hue. Coral is that accent; the six pastels are the **product colours**. The "border trick" makes them safe:

- Every pastel fill has a plum outline at ≥ 7:1, so pastels never need contrast against the page or each other.
- Every colour also carries a text name: swatches are labelled Peach, Butter and so on, and cards name their toy. No meaning depends on colour alone.

**Tokens:**

- `scripts/palette.config.mjs` → `src/styles/tokens.css` produces three 11-step OKLCH ramps:
  - **neutral:** plum-tinted, chroma 0.014.
  - **brand:** plum.
  - **accent:** coral.
- It also defines `cream`, `cream-2`, `paper`, `night`, `night-2` and `p-<pastel>`.
- Hex fallbacks come first, OKLCH sits inside `@supports`, and `--coral-hi` is display-P3 under `@media (color-gamut: p3)`.
- Semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `border-strong`, `accent`, `accent-ui`, `accent-contrast`, `button`, `button-hover`, `focus`.

**Rendering:**

- **Gradients:** the page wash uses `radial-gradient(… in oklch …)` with a plain fallback. An SVG-noise grain sits over it at 6% multiply.
- **Shadows:** plum-tinted (`oklch(35% 0.07 328 / …)`), never black.
- **Data colours:** not applicable; there are no charts.

### Contrast results (`npm run contrast`)

All 35 pairs pass.

| Pair | Foreground | Background | Ratio | Target | Result |
|---|---|---|---|---|---|
| Body text on cream | `--text` #332033 | `--bg` #fdf5e3 | 13.87:1 | 4.5:1 | pass |
| Text on card | `--text` #332033 | `--surface` #fffcf3 | 14.62:1 | 4.5:1 | pass |
| Text on cream panel | `--text` #332033 | `--surface-2` #f7ead2 | 12.60:1 | 4.5:1 | pass |
| Muted text on cream | `--text-muted` #6a3b69 | `--bg` #fdf5e3 | 7.93:1 | 4.5:1 | pass |
| Muted text on card | `--text-muted` #6a3b69 | `--surface` #fffcf3 | 8.35:1 | 4.5:1 | pass |
| Muted text on cream panel | `--text-muted` #6a3b69 | `--surface-2` #f7ead2 | 7.20:1 | 4.5:1 | pass |
| Coral labels and prices on cream | `--accent` #933927 | `--bg` #fdf5e3 | 6.77:1 | 4.5:1 | pass |
| Coral labels on card | `--accent` #933927 | `--surface` #fffcf3 | 7.14:1 | 4.5:1 | pass |
| Button label on plum | `--accent-contrast` #fffcf3 | `--button` #4e2d4e | 11.28:1 | 4.5:1 | pass |
| Button label on plum (hover) | `--accent-contrast` #fffcf3 | `--button-hover` #6a3b69 | 8.35:1 | 4.5:1 | pass |
| Focus ring (UI) | `--focus` #933927 | `--bg` #fdf5e3 | 6.77:1 | 3:1 | pass |
| Focus ring on card (UI) | `--focus` #933927 | `--surface` #fffcf3 | 7.14:1 | 3:1 | pass |
| Control and toy outlines (UI) | `--border-strong` #4e2d4e | `--bg` #fdf5e3 | 10.71:1 | 3:1 | pass |
| Coral stars on the night sky (graphic) | `--accent-ui` #cf5640 | `--night` #23112f | 4.23:1 | 3:1 | pass |
| Paper on coral sticker (large bold text) | `--accent-contrast` #fffcf3 | `--accent-ui` #cf5640 | 4.04:1 | 3:1 | pass |
| Text on the night-sky game | `--paper` #fffcf3 | `--night` #23112f | 17.10:1 | 4.5:1 | pass |
| Butter stars on the night sky (graphic) | `--p-butter` #e6ce9e | `--night` #23112f | 11.48:1 | 3:1 | pass |
| Plum text on peach | `--text` #332033 | `--p-peach` #fbc0bb | 9.58:1 | 4.5:1 | pass |
| Plum outline around peach (UI) | `--border-strong` #4e2d4e | `--p-peach` #fbc0bb | 7.40:1 | 3:1 | pass |
| Focus ring on peach (UI) | `--focus` #933927 | `--p-peach` #fbc0bb | 4.68:1 | 3:1 | pass |
| Plum text on butter | `--text` #332033 | `--p-butter` #e6ce9e | 9.81:1 | 4.5:1 | pass |
| Plum outline around butter (UI) | `--border-strong` #4e2d4e | `--p-butter` #e6ce9e | 7.57:1 | 3:1 | pass |
| Focus ring on butter (UI) | `--focus` #933927 | `--p-butter` #e6ce9e | 4.79:1 | 3:1 | pass |
| Plum text on mint | `--text` #332033 | `--p-mint` #b2deba | 10.07:1 | 4.5:1 | pass |
| Plum outline around mint (UI) | `--border-strong` #4e2d4e | `--p-mint` #b2deba | 7.77:1 | 3:1 | pass |
| Focus ring on mint (UI) | `--focus` #933927 | `--p-mint` #b2deba | 4.92:1 | 3:1 | pass |
| Plum text on sky | `--text` #332033 | `--p-sky` #9ddded | 10.03:1 | 4.5:1 | pass |
| Plum outline around sky (UI) | `--border-strong` #4e2d4e | `--p-sky` #9ddded | 7.74:1 | 3:1 | pass |
| Focus ring on sky (UI) | `--focus` #933927 | `--p-sky` #9ddded | 4.90:1 | 3:1 | pass |
| Plum text on lilac | `--text` #332033 | `--p-lilac` #cccbfd | 9.71:1 | 4.5:1 | pass |
| Plum outline around lilac (UI) | `--border-strong` #4e2d4e | `--p-lilac` #cccbfd | 7.49:1 | 3:1 | pass |
| Focus ring on lilac (UI) | `--focus` #933927 | `--p-lilac` #cccbfd | 4.74:1 | 3:1 | pass |
| Plum text on rose | `--text` #332033 | `--p-rose` #f3c0db | 9.55:1 | 4.5:1 | pass |
| Plum outline around rose (UI) | `--border-strong` #4e2d4e | `--p-rose` #f3c0db | 7.37:1 | 3:1 | pass |
| Focus ring on rose (UI) | `--focus` #933927 | `--p-rose` #f3c0db | 4.66:1 | 3:1 | pass |

## Motion system

Tokens are in `src/motion.ts`:

- **Durations:** 0.4 / 0.6 / 0.8 / 1.2 s.
- **Easing:** `expo.out` / `power3`, with `back.out(2.6)` for the pop.
- **Stagger:** 75 ms.
- **Pop:** scale 0.9 → ~1.02 → 1, y 24 → 0, blur 8 → 0.
- **Springs:** `elastic.out(1, 0.45–0.5)` for stickers, the builder and the squish test.

| Section | Choreography |
|---|---|
| Hero | SplitText line-masked headline, then fade-ups. **Physics toy box:** Matter.js with a fixed 60 Hz step and an accumulator, so it doesn't depend on frame rate. Pointer dragging uses a spring constraint. **Shake** throws every bubble; **Tidy up** tweens the letters back into the word over 0.9 s. |
| How a bubble is made | **Pinned for 240%** of the viewport and **scrubbed**: the outline draws on (`pathLength=1`), the fill pops in, the face springs in, then a squash-and-stretch "squish test". The step list highlights the current step. On phones the bubble sits beside the title so the pinned scene fits on one screen. |
| Stickers | **Spring pop-ins:** scale 0 → 1 from a random ±50° rotation with `elastic.out`, a 70 ms stagger in random order. Hover peels a sticker up. **Parallax pair:** the floating background bubbles (`data-speed`) against the sheet. The callout pops in. |
| Toys | Cards pop in as a batch. Each toy's art reveals with a **clip-path** (bottom-up) and a 1.2 → 1 scale. The Flip button turns the card in 3D (`rotateY`), and the hidden face is made `inert`. A second **parallax pair** of bubbles sits behind the cards. |
| Build a bubble | The form and preview pop in. Every choice redraws the SVG toy with an elastic wobble. |
| Catch the stars | The panel pops in. The game runs on its own canvas loop. |

**Scroll:**

- Lenis runs on the GSAP ticker (`lenis.raf(t * 1000)`, `lagSmoothing(0)`).
- Anchors go through `lenis.scrollTo`, with focus moved to the target.
- `ScrollTrigger.refresh()` runs after fonts and images load.

**Loops** (toy box, game) pause when offscreen (IntersectionObserver) or when the tab is hidden. Canvas DPR is capped at 2.

**Progressive enhancement:**

- **No JS:**
  - A **pre-rendered SVG** shows the letter bubbles neatly spelling the word. It is generated at build time by a Vite plugin from the same art code.
  - All toy art, stickers and builder art are inline SVG.
  - Card backs show below their fronts.
  - The game shows a `<noscript>` note.
  - Shake and Tidy up stay hidden.
- **Reduced motion:**
  - No Lenis, pin, scrub, parallax, split text, pop-ins or springs. The maker shows its final state with step 4 highlighted.
  - The toy box stays static, with "Physics is off because your device asks for reduced motion" and an opt-in **Turn physics on** button.
  - Cards flip without the rotation transition.
  - The game still works, because the user starts it, but without catch rings and with still background stars.

## Interactive pieces

- **Toy box** (`src/physics.ts`):
  - The canvas is `aria-hidden`; the figure caption describes it.
  - `touch-action: none` applies only inside the box, so dragging a toy doesn't scroll the page. The page scrolls from anywhere outside the box.
  - The world is rebuilt when the box width really changes.
- **Flip cards:** a real `<button aria-pressed>` on each card. The face you can't see is `inert`, so it is skipped by keyboard and screen readers.
- **Build a bubble** (`src/builder.ts`):
  - Native radio groups (arrow keys work) and a text field for the name.
  - The live summary is `aria-live="polite"`, debounced while typing.
  - The SVG is built only from the fixed option values; the typed name never enters markup.
- **Catch the stars** (`src/game.ts`):
  - 30-second rounds. Butter stars are worth +1 and coral stars +3.
  - Controls: the mouse, a finger drag, or ←/→ (A/D) when the canvas is focused. Enter or Space starts a round.
  - It auto-pauses offscreen or in a hidden tab, and the timer stops while paused.
  - The best score is stored in `localStorage`, wrapped in try/catch so it just isn't remembered when storage is blocked.
  - The final score is announced through `aria-live`.
  - **No flashing:** background stars twinkle on 3–5 s cycles, and a catch shows a soft ring.

## Run and build

```bash
npm install
npm run dev        # tokens + Vite dev server
npm run build      # tokens → tsc --noEmit → vite build
npm run preview    # serve dist/ on http://localhost:4173
npm run contrast   # WCAG check of the generated tokens
```

## Swapping in photos

The six toy cards are photo slots. See [`public/assets/README.md`](public/assets/README.md). A photo is duotoned from plum to that toy's own pastel automatically.

## Skills used

Loaded for this site and applied:

- **color-expert:** equal-L/C pastels with the chroma set by the sRGB gamut limit, the border trick for pastel fills, and P3 under `color-gamut`.
- **gsap-web:** the Lenis single loop, pin and scrub timeline, elastic springs, `ScrollTrigger.batch` pops and SplitText.

**Not available:** `frontend-design`, `taste-skill` and `accesslint`. axe-core was used in place of accesslint.

## Verification

**Build and contrast:**

- `npm run build` passes (`tsc --noEmit` strict, including `vite.config.ts`, then `vite build`).
- `npm run contrast`: all 35 pairs pass.

**Playwright (headless Chromium):**

- **Screenshots** at 375, 768 and 1440 px, at 0/25/50/75/100% scroll, plus reduced-motion and no-JS runs.
  - No console errors, page errors, failed requests or horizontal overflow; exactly one `<h1>`.
- **Interaction tests:**
  - **Toy box:** goes live, and Shake and Tidy up appear. Tidy up lines up "BUBBLE / TOWN". Dragging the first letter 250 px right and 220 px up moves it there (the letter's plum pixel was found at the target). Shake scatters everything.
  - **Flip:** sets `aria-pressed="true"`, makes the front inert and the back not inert.
  - **Builder:** choosing Mint, Bunny, Wow and "Zed" gives "Zed: a mint bubble bunny with a surprised face." Arrow keys on the colour radios move to Lilac.
  - **Game:** Start focuses the canvas. After 4 s of arrow-key play the timer showed 26 and the score 1. Scrolling away shows "Paused" and freezes the timer.
  - **Reduced motion:** the box starts static with the opt-in button, and "Turn physics on" makes it live.
  - **Captions** are correct in normal, reduced and no-JS modes.
- **Photo swap:** a generated test image in the `toy-juniper` slot loads, is duotoned from plum to sky, and keeps its alt text.
- **axe-core** (WCAG 2.2 AA + best practice), with and without reduced motion: **0 violations**.
  - axe reports contrast as "needs review" for text over the page's gradient background, which it can't measure. Those colours are the token pairs above.

**Found and fixed while testing:**

- The pinned section didn't fit a 375 × 667 screen; the bubble now sits beside the title.
- Shake and Tidy up showed as disabled without JS; they are now hidden until physics runs.
- The toy-box caption promised dragging without JS.
- The floating bubbles were hidden behind the page background; each section now uses `isolation`.
- Toy art sat on the same pastel as its own fill.

## Notes and known limitations

- **Untested:**
  - Touch dragging on real phones (only mouse input was automated).
  - Frame rate on real low-end devices.
  - Safari and Firefox.
- **Touch trade-off:** a finger that starts inside the toy box drags toys instead of scrolling the page. The box is at most 52% of the screen height, so the page still scrolls from above and below it.
- **Repository.** This session can only push to `Different-websites`, so the site lives in `pro-sites/`. `pro-sites/split-into-repos.sh` publishes it as its own private repo.
