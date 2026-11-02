# Auralis: AI audio-mastering landing page

> **Everything here is fictional.** Auralis, its prices, policies, address (9 Harbour Lane, Port Selby), phone number (555-0100), email (example.com) and every figure are sample content. The waveforms come from a synthetic signal, and the loudness and peak readouts are simulated. They are not a real audio analysis.

A single-page landing site built with **Vite 8, TypeScript, raw WebGL2 (no 3D library), GSAP 3.15 (ScrollTrigger + SplitText) and Lenis**.

## Concept and design direction

1. **The product is the sky.** A fullscreen domain-warped "aurora" shader stands in for the abstract idea of sound being shaped.
2. **Glass over light.** Every content block is a frosted card, so the aurora reads through the whole page.
3. **Wide display type.** Unbounded headlines against a plain Figtree body. Feels engineered, not mystical.
4. **Warm against cool.** One amber accent marks only the things you can act on: CTAs, toggles, active states.
5. **Show, don't claim.** The interactive A/B waveform and the scrolled signal chain carry the explanation, not testimonials.

## Color Brief

| | |
|---|---|
| **Mood** | Night sky, studio-dark, focused, with one warm glow |
| **Hue anchors** | Brand indigo-violet h 285 · aurora teal h 195 → violet h 295 → magenta h 340 (imagery only) · amber accent h 68 |
| **Harmony** | Analogous cool aurora (teal → magenta, about 145° of hue) with a near-complementary warm accent |
| **60 / 30 / 10** | 60% deep indigo (`brand-950` page, `brand-900` glass) · 30% aurora light and violet surfaces · 10% amber (`accent-200` CTAs, toggles, labels) |

The palette is defined in `scripts/palette.config.mjs`, and `scripts/build-tokens.mjs` generates `src/styles/tokens.css` from it:

- **Ramps:** neutral (chroma 0.014, tinted to h 282), brand and accent, each 11 steps (50–950) with even OKLCH lightness steps. Gamut mapping reduces chroma only.
- **Fallbacks:** hex values first, then `oklch()` inside `@supports`.
- **Display-P3:** `--amber-hi` and `--aurora-hi` are used only for glows (the CTA bloom and the HUD dots), inside `@media (color-gamut: p3)`.
- **Semantic tokens:** `bg`, `surface`, `surface-2`, `glass`, `text`, `text-muted`, `border`, `border-strong`, `accent`, `accent-strong`, `accent-contrast`, `focus`.
- **Aurora colours** are reference tokens used only in imagery (the shader, the mesh fallback, artwork gradients), never as UI colours. Amber is the only UI accent.
- **Gradients** use `in oklch`. The **shader mixes its colour stops in OKLCH on the GPU** (shortest hue path), then converts to sRGB.
- **Contrast guard in the shader:** OKLCH lightness is clamped to **0.62**, so white headline text keeps ≥ 3:1 over any pixel. Hero body copy sits on a 55% `bg` scrim.
- **Glass cards** are 84% opaque. That figure came from the contrast check: 78% failed for muted text over the brightest teal.
- **Shadows** are tinted with `brand-950`, never black.
- **Grain:** a dither in the shader, plus an SVG-noise overlay on the CSS fallback and on the artwork.
- **Data colours:** the waveform uses one continuous teal → magenta ramp (lightness ≥ 0.68, readable for all colour-vision types) on a single series. No categorical colours are needed.

### Contrast results (`npm run contrast`)

The checker resolves each semantic token from the generated CSS. For translucent layers it composites them over the worst-case colour behind them, the same way browsers do.

| Pair | Foreground | Background | Ratio | Target | Result |
|---|---|---|---|---|---|
| Body text on page | `--text` #f5f6ff | `--bg` #080526 | 18.42:1 | 4.5:1 | pass |
| Muted text on page | `--text-muted` #a4a5af | `--bg` #080526 | 8.11:1 | 4.5:1 | pass |
| Body text on surface | `--text` #f5f6ff | `--surface` #18173d | 15.87:1 | 4.5:1 | pass |
| Muted text on surface | `--text-muted` #a4a5af | `--surface` #18173d | 6.98:1 | 4.5:1 | pass |
| Muted text on raised surface | `--text-muted` #a4a5af | `--surface-2` #2b2467 | 5.53:1 | 4.5:1 | pass |
| Text on glass over brightest aurora (teal) | `--text` #f5f6ff | `--glass` @84% over `--aurora-teal` = #1b3656 | 11.45:1 | 4.5:1 | pass |
| Muted text on glass over teal | `--text-muted` #a4a5af | `--glass` @84% over `--aurora-teal` = #1b3656 | 5.04:1 | 4.5:1 | pass |
| Muted text on glass over magenta | `--text-muted` #a4a5af | `--glass` @84% over `--aurora-magenta` = #3a2152 | 5.67:1 | 4.5:1 | pass |
| Large hero headline over brightest shader colour | `--text` #f5f6ff | `--aurora-cap` #009a9a | 3.22:1 | 3:1 | pass |
| Hero body copy on its scrim over brightest shader colour | `--text` #f5f6ff | `--bg` @55% over `--aurora-cap` = #04485a | 9.41:1 | 4.5:1 | pass |
| Amber labels on page | `--accent` #f7b65d | `--bg` #080526 | 11.15:1 | 4.5:1 | pass |
| CTA label on amber | `--accent-contrast` #080526 | `--accent` #f7b65d | 11.15:1 | 4.5:1 | pass |
| CTA label on amber (hover) | `--accent-contrast` #080526 | `--accent-strong` #ffd59c | 14.36:1 | 4.5:1 | pass |
| Focus ring (UI) | `--focus` #f7b65d | `--bg` #080526 | 11.15:1 | 3:1 | pass |
| Control outlines (UI) | `--border-strong` #6c5ada | `--bg` #080526 | 3.89:1 | 3:1 | pass |
| Control outlines on surface (UI) | `--border-strong` #6c5ada | `--surface` #18173d | 3.35:1 | 3:1 | pass |

## Motion system

Tokens live in `src/motion.ts`:

- **Durations:** 0.4 / 0.6 / 0.8 / 1.2 s.
- **Easing:** `expo.out` and `power3`, plus `back.out(2.6)` for the pop.
- **Stagger:** 75 ms.
- **`pop()`:** scale 0.9 → ~1.02 → 1, y 24 → 0, opacity 0 → 1, blur 8px → 0.

| Section | Choreography |
|---|---|
| Hero | SplitText headline rise. Three HUD callouts pop in after the intro, then drift as a parallax set at different depths (`data-speed` −0.6 / 0.4 / −0.25). The shader responds to cursor swirl and to scroll. |
| How it works / Features | Staggered pop-ins on frosted cards (`ScrollTrigger.batch`) |
| Demo | Card pop-in. The canvas redraws live as you move the controls. |
| Signal chain | **Pinned and scrubbed** over 260% of the viewport. Scroll applies the mastering chain progressively, highlights each stage row, and pops stat callouts in at 20/40/60/80% progress. |
| Imagery | clip-path reveals (up / left) with the artwork settling from 1.2× |
| Pricing | Pop-in cards. The toggle counts prices to their new values and pops the "Save 20%" badge. |
| Nav | Hides while scrolling down, returns on any upward scroll or keyboard focus |

**Lenis:**

- Lenis runs on the GSAP ticker (`lenis.raf(t * 1000)`, `lagSmoothing(0)`, `lenis.on('scroll', ScrollTrigger.update)`).
- In-page anchors are routed through `lenis.scrollTo`, and focus moves to the target.
- `ScrollTrigger.refresh()` runs after fonts and the window have loaded.

**Shader performance:**

- Rendered at half resolution, with `devicePixelRatio` capped at 2.
- Paused while the tab is hidden; throttled to about 30 fps once you are 1.5 viewports past the hero.
- If WebGL2 is unavailable or the context is lost, `html.no-webgl` keeps the **CSS OKLCH mesh-gradient fallback** visible.

**Progressive enhancement:**

- Hidden start states apply only under `html.js:not(.reduced)`. If boot fails, `js` is removed after 4 s.
- Without JS, all text, cards and pricing are visible over the CSS mesh gradient. The two canvases show `<noscript>` notes.
- **Reduced motion:**
  - No Lenis, pinning, parallax or pop-ins.
  - The shader renders one static frame.
  - The signal chain shows its final state.
  - The pricing toggle swaps numbers instantly.

## Imagery system

There are no photos, generated images or hotlinks:

- **Shader:** fbm noise in GLSL (`src/aurora.ts`).
- **Mesh fallback:** layered CSS radial gradients in OKLCH, plus grain.
- **Waveforms:** drawn on a canvas. Gradient stops are pre-sampled in OKLCH, because canvas gradients interpolate in sRGB.
- **Artwork:** two inline SVG compositions (sound rings, spectrum) on OKLCH gradients.

Lighting rules: highlights come from the top-left (the glass cards have an inset top-left sheen), shadows are tinted `brand-950`, and all artwork carries the same grain.

Image slots use the reusable `figure.media` component: fixed aspect ratio, dominant colour, lazy loading, blur-up and a CSS duotone. See [`public/assets/README.md`](public/assets/README.md).

## Run and build

```bash
npm install
npm run dev        # Vite dev server (regenerates tokens)
npm run build      # tokens → tsc --noEmit → vite build (dist/)
npm run preview    # serve dist/ on http://localhost:4173
npm run contrast   # WCAG check of the generated tokens
```

## Swapping in photos

Drop files in `public/assets/images/` and map slots in `public/assets/images/photos.json`. The full slot list is in [`public/assets/README.md`](public/assets/README.md).

## Skills used

I read these SKILL.md files from `.claude/skills` and applied them:

- **shadertoy** and **shader-programming-glsl:** GLSL ES rules, fbm and domain warping, dithering against banding, vignette.
- **color-expert:** OKLCH ramps, chroma-only gamut mapping, token layering.
- **color-theory-palette-harmony-expert:** OKLCH hue anchors and warm/cool balance. Most of this skill is about photo collages, so only that part applied.
- **gsap-web:** the Lenis + ScrollTrigger single loop, SplitText, pinning and scrub.

These requested skills were **not available**: `web-shaders`, `3d-web-experience`.

## Verification

- `npm run build` passes (`tsc --noEmit` strict, then `vite build`).
- `npm run contrast`: all 16 pairs pass, including the glass and shader-composite cases.
- **Playwright with headless Chromium**, WebGL via SwiftShader:
  - Screenshots at 375, 768 and 1440 px, at 0/25/50/75/100% scroll, plus reduced-motion and no-JS runs.
  - No console errors or warnings, no failed requests, no horizontal overflow, exactly one `<h1>`.
- **Interaction checks:**
  - The shader reaches `webgl-ready`.
  - The demo's readout tracks the target (−14 → −14.0, −9 → −9.0, with peaks limited to −1.0 dB).
  - The A/B radio switches the readout to the original.
  - The pricing switch updates prices, `aria-checked` and the live note.
  - With `getContext('webgl2')` forced to return null, the page falls back to the CSS mesh (`no-webgl`, canvas hidden).
- **axe-core** (WCAG 2.2 AA + best-practice), with and without reduced motion: **0 violations**. Some text over the shader is reported as "incomplete" because axe can't measure contrast over a canvas. The lightness cap and scrim above cover that.

## Notes and known limitations

- **Repository.** You asked for one private repo per site. This session can only push to `Different-websites`, so the site lives in `pro-sites/`. `pro-sites/split-into-repos.sh` publishes each folder as its own private repo using your `gh` login.
- **Testing scope.** Only headless Chromium with SwiftShader was tested. Real GPUs, Safari and Firefox are untested. The shader is tuned for quality at half resolution; on very weak integrated GPUs it may still run below 60 fps.
- **cdnjs not used.** The network policy blocked cdnjs in this environment, so every dependency comes from npm with pinned versions.
