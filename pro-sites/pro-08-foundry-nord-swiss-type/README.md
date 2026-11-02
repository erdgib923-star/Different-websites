# Foundry Nord: an independent type foundry

> **Everything here is fictional.**
>
> - Foundry Nord, its three families (Nord Grotesk Flex, Nord Breit and Nord Mono Kasual), the licence prices and the address (Kaiplatz 9, Nordhaven) are invented. The email uses example.com and the phone number is 555-0100.
> - A web search for "Foundry Nord" found no matching foundry.
>
> **Fonts.** The brief asked for Google Fonts variable fonts only. The specimens use three open-source Google Fonts as clearly labelled **stand-ins**: **Roboto Flex**, **Anybody** and **Recursive**, all under the SIL Open Font License.
>
> - They are self-hosted through `@fontsource-variable` npm packages rather than loaded from fonts.googleapis.com. That keeps them private, avoids layout shift, and builds offline.
> - The site says on the page that these are stand-ins, so the fictional families are never presented as these real fonts.

Built with **Vite 8, TypeScript, GSAP 3.15 (ScrollTrigger + SplitText) and Lenis**.

## Concept and design direction

1. **Swiss, strict.** A visible 12-column grid you can toggle on, flush-left text, hard 2 px black rules, and no rounded corners.
2. **Type is the image.** There are no photos; every visual is a variable font moving along its axes.
3. **One signal.** Red marks only the first letter, numbers, active states, hot rows and focus.
4. **Show the axes.** Weight, width and optical size scrub with scroll, with live numeric readouts.
5. **A real tool.** The tester is editable text with every axis exposed and a "Copy CSS" button.

## Color Brief

| | |
|---|---|
| **Mood** | Neutral, exact, confident; a printed specimen sheet |
| **Hue anchors** | Neutral h 25 (chroma 0.006, very slightly warm) · signal red h 27 |
| **Harmony** | Monochrome with a single accent. **Deliberate deviation:** the general brief asks for a brand ramp *and* an accent ramp, but this brief allows exactly one signal red, so there is no second hue and `accent` maps to the brand red. |
| **60 / 30 / 10** | 60% white (`neutral-50`) · 30% black (type, rules, the kinetic band) · 10% signal red |

**Tokens:**

- `scripts/palette.config.mjs` → `src/styles/tokens.css`: an 11-step OKLCH neutral ramp and a red ramp, with hex fallbacks first, OKLCH inside `@supports`, and a display-P3 `--signal-hi`.
- Semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `border-strong`, `accent`, `accent-text`, `accent-contrast`, `focus`, plus `ink-*` for the black band.

**Rendering:**

- No gradients, shadows or grain. This is a flat Swiss page by intent, so the gradient, shadow and grain rules have nothing to apply to.
- **Data colours:** not applicable; there are no charts.

### Contrast results (`npm run contrast`)

| Pair | Foreground | Background | Ratio | Target | Result |
|---|---|---|---|---|---|
| Black on white | `--text` #0b0808 | `--bg` #fffbfa | 19.33:1 | 4.5:1 | pass |
| Muted on white | `--text-muted` #4a4545 | `--bg` #fffbfa | 9.15:1 | 4.5:1 | pass |
| Muted on grey panel | `--text-muted` #4a4545 | `--surface-2` #e4dedd | 7.09:1 | 4.5:1 | pass |
| Red text on white | `--accent-text` #c20011 | `--bg` #fffbfa | 6.17:1 | 4.5:1 | pass |
| Red large type / UI on white | `--accent` #e41a22 | `--bg` #fffbfa | 4.57:1 | 3:1 | pass |
| White on red | `--accent-contrast` #fffbfa | `--accent` #e41a22 | 4.57:1 | 4.5:1 | pass |
| White on deep red (hover) | `--accent-contrast` #fffbfa | `--accent-text` #c20011 | 6.17:1 | 4.5:1 | pass |
| Focus ring (UI) | `--focus` #e41a22 | `--bg` #fffbfa | 4.57:1 | 3:1 | pass |
| Control outlines (UI) | `--border-strong` #615c5c | `--bg` #fffbfa | 6.36:1 | 3:1 | pass |
| White on black | `--ink-text` #fffbfa | `--ink` #0b0808 | 19.33:1 | 4.5:1 | pass |
| Muted on black | `--ink-muted` #ada8a7 | `--ink` #0b0808 | 8.46:1 | 4.5:1 | pass |
| Red on black | `--ink-accent` #ff3f3d | `--ink` #0b0808 | 5.71:1 | 4.5:1 | pass |

## Motion system

Tokens are in `src/motion.ts`:

- **Durations:** 0.4 / 0.6 / 0.8 / 1.2 s.
- **Easing:** `expo.out` / `power3`, with `back.out(2.6)` for the pop.
- **Stagger:** 75 ms.
- **Pop:** scale 0.9 → ~1.02 → 1, y 24 → 0, blur 8 → 0.

| Section | Choreography |
|---|---|
| Hero | SplitText headline. The giant word "NORD" is fitted to the grid at its widest state, then **scrubbed** from `wght 250 / wdth 50 / opsz 144` to `wght 1000 / wdth 151 / opsz 96`, with live axis readouts. **Parallax pair:** the word and its axis readouts against the headline block. |
| Families | Cards pop in. Each specimen **sweeps its weight axis** with scroll (scrubbed). |
| Kinetic band | Two rows drift in opposite directions, with a weight **wave** running through the words (`--w` 200 ↔ 950, staggered). Scroll velocity speeds up the drift, the rows pause offscreen, and a **Pause motion** button covers WCAG 2.2.2. |
| Tester | The panel pops in and the sliders fade in whenever the family changes |
| Glyphs | Hover or focus a cell: the preview shows the character, its Unicode code point and name, and sweeps from weight 100 to 900 |
| Licences | Toggling between one family and all three counts the prices to their new values (`€180 → €420`, and so on) with a small drop |

**Scroll:**

- Lenis runs on the GSAP ticker, and anchors go through `lenis.scrollTo` with focus moved to the target.
- `ScrollTrigger.refresh()` runs after `document.fonts.ready`, which matters because the hero is fitted to the real font metrics.

**Progressive enhancement:**

- **No JS:** all content and the licence table are visible. The tester sliders and the glyph grid show `<noscript>` notes.
- **Reduced motion:**
  - The hero shows a fixed bold-wide state.
  - The kinetic rows become static, wrapped text, with no pause button.
  - No sweeps, scrubbing, Lenis or count-ups.

## The type tester

- **Family:** radio buttons for the three stand-in fonts.
- **Axis sliders,** rebuilt per family from each font's real ranges:
  - Roboto Flex: `wght`, `wdth`, `opsz`, `slnt`, `GRAD`.
  - Anybody: `wght`, `wdth`.
  - Recursive: `wght`, `CASL`, `MONO`, `slnt`.
- **Size** from 16 to 180 px (phones start at 44 px).
- **Sample:** a `contenteditable` region with `role="textbox"` and `aria-multiline`. Pasted text is inserted as plain text.
- **Buttons:** Invert, Reset, and Copy CSS (Clipboard API, with a fallback message).
- **Output:** a live CSS block showing the exact `font-family`, `font-size` and `font-variation-settings`.

## Run and build

```bash
npm install
npm run dev        # tokens + Vite dev server
npm run build      # tokens → tsc --noEmit → vite build
npm run preview    # serve dist/ on http://localhost:4173
npm run contrast   # WCAG check of the generated tokens
```

## Swapping in photos

The page has no image slots by design. See [`public/assets/README.md`](public/assets/README.md) for how to add one.

## Skills used

Loaded and applied:

- **gsap-web:** scrub, stagger waves, the Lenis single loop, SplitText.
- **color-expert:** OKLCH ramps and a near-neutral tint.

**Not available:** `frontend-design`, `taste-skill`, `impeccable`, `scroll-experience`, `web-design-guidelines`.

## Verification

- `npm run build` passes (`tsc --noEmit` strict, then `vite build`).
- `npm run contrast`: all 12 pairs pass.
- **Playwright** at 375, 768 and 1440 px, at 0/25/50/75/100% scroll, plus reduced-motion and no-JS runs: no console errors, failed requests or overflow; one `<h1>`.
- **Found and fixed:**
  - The stand-in note rendered one word per line, because the grid class was on the `<p>` itself.
  - The hero start state was a hairline sliver, so it now starts at weight 250 and width 50.
  - The phone tester size was too large.
  - The hero was measured from the block width; it now uses the text's bounding box.
- **Interaction tests:**
  - Typing into the sample works.
  - Switching to Mono Kasual rebuilds the sliders as `wght, CASL, MONO, slnt`.
  - `CASL 0` and size 120 apply to the sample.
  - Copy CSS reports success, and Invert sets `aria-pressed`.
  - Focusing the `&` glyph shows "U+0026 · Ampersand".
  - The all-families toggle shows €0 / €420 / €560 / €1,400 / Quote.
  - The grid overlay toggles.
- **axe-core**, with and without reduced motion: **0 violations**. The first run flagged 10 glyph buttons whose `aria-label` didn't contain the visible character; each label now starts with the character.

## Notes and known limitations

- **Repository.** This session can only push to `Different-websites`, so the site lives in `pro-sites/`. `pro-sites/split-into-repos.sh` publishes it as its own private repo.
- **Pasting.** `document.execCommand('insertText')` is deprecated but still the most reliable plain-text paste for `contenteditable` in current browsers. If a browser drops it, pasting simply falls back to inserting nothing.
- **Browsers.** Only headless Chromium was tested.
