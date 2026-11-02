# Halcyra: explorer of a fictional star system

> **Everything here is fictional.**
>
> - **Halcyra** and its worlds are invented: Vey, Orrin, Selk, Mauna Rel and Isk.
> - Every distance, period, temperature and gravity value is sample data.
> - The contact details use example.com and 555-0100.
>
> **Brand rename:** you suggested "Perihelion". A web search found existing space-sector organisations with that name (Perihelion, a creative agency for the space industry in Vienna, and Perihelion Space in Estonia), so I renamed the explorer **Halcyra**. A search for "Halcyra" found no matching brand or star system. The repository folder keeps your requested name.

Built with **Vite 8, TypeScript, Three.js r187 (custom `ShaderMaterial`s), GSAP 3.15 and Lenis**.

## Concept and design direction

1. **A guided fall inward.** Scrolling flies a camera along a spline from an overview of the system, past each world, to a final look back at the star.
2. **Everything is procedural.** The planets, rings, star granulation and starfield are all GLSL noise, with no textures.
3. **Instrument, not poster.** Wide Syne headlines, Red Hat Mono body text, and a glass HUD that reads like a flight panel.
4. **One warm light in the dark.** Star-gold is the only UI accent. Each planet gets its own hue only inside the imagery.
5. **Graceful degradation.** Low-power, no-WebGL, reduced-motion and no-JS visitors get a complete, attractive static atlas.

## Color Brief

| | |
|---|---|
| **Mood** | Deep, quiet, cinematic; a long night with one warm star |
| **Hue anchors** | Space neutral and brand h 262 (near-black blue) · accent star-gold h 78 · planets h 30 / 98 / 166 / 234 / 302 |
| **Harmony** | Complementary (gold against space blue) for the UI. The planets are a **hue-rotation family**: five hues 68° apart, at identical OKLCH lightness and chroma steps (L 0.34 / 0.64 / 0.86, C 0.07 / 0.12 / 0.06), so no world is visually louder than another. |
| **60 / 30 / 10** | 60% near-black blue space · 30% planet colour and cool surfaces · 10% star-gold (labels, readouts, active nav, the low-power toggle) |

**Token pipeline:**

- `scripts/palette.config.mjs` defines three 11-step OKLCH ramps plus the 15 planet tokens. `scripts/build-tokens.mjs` writes `src/styles/tokens.css`: hex fallbacks first, OKLCH inside `@supports`, and a display-P3 `--star-hi` inside `@media (color-gamut: p3)`.
- `src/system.ts` converts the **same OKLCH planet values to linear sRGB** for the shader uniforms, so CSS planets and shader planets match.
- **Shadows** are tinted `brand-950`.
- **Night sides** fall to a space-blue ambient, never black.
- **Grain:** a soft-light overlay on the static sky.
- **Data colours:** the data-sheet swatches use the five equal-lightness planet hues. Each row is also labelled by name, so colour is never the only key.

### Contrast results (`npm run contrast`)

Cards and the HUD are 86% opaque over the live scene. The checker composites them over the brightest colours that can sit behind them: the star's glow and the brightest planet limb.

| Pair | Foreground | Background | Ratio | Target | Result |
|---|---|---|---|---|---|
| Text on space | `--text` #f0f5ff | `--bg` #030409 | 18.76:1 | 4.5:1 | pass |
| Muted text on space | `--text-muted` #9da2ab | `--bg` #030409 | 8.01:1 | 4.5:1 | pass |
| Text on HUD / card | `--text` #f0f5ff | `--surface` #020715 | 18.46:1 | 4.5:1 | pass |
| Muted text on HUD / card | `--text-muted` #9da2ab | `--surface` #020715 | 7.88:1 | 4.5:1 | pass |
| Gold readouts on HUD | `--accent` #dea83b | `--surface` #020715 | 9.36:1 | 4.5:1 | pass |
| Muted text on card over star glow (worst case) | `--text-muted` #9da2ab | `--surface` @86% over `--star` = #232121 | 6.28:1 | 4.5:1 | pass |
| Gold readout on HUD over star glow (worst case) | `--accent` #dea83b | `--surface` @86% over `--star` = #232121 | 7.45:1 | 4.5:1 | pass |
| Text on card over brightest planet limb | `--text` #f0f5ff | `--surface` @86% over `--planet-3-light` = #1a252e | 14.30:1 | 4.5:1 | pass |
| Button label on gold | `--accent-contrast` #030409 | `--accent` #dea83b | 9.50:1 | 4.5:1 | pass |
| Button label on gold (hover) | `--accent-contrast` #030409 | `--accent-strong` #edc16c | 12.10:1 | 4.5:1 | pass |
| Focus ring (UI) | `--focus` #dea83b | `--bg` #030409 | 9.50:1 | 3:1 | pass |
| Control outline (UI) | `--border-strong` #4e6ea8 | `--surface` #020715 | 3.95:1 | 3:1 | pass |

## Motion system

Tokens are in `src/motion.ts`:

- **Durations:** 0.4 / 0.6 / 0.8 / 1.2 s.
- **Easing:** `expo.out` / `power3`, with `back.out(2.6)` for the pop.
- **Stagger:** 75 ms.
- **Pop:** scale 0.9 → ~1.02 → 1, y 24 → 0, blur 8 → 0.

**Choreography:**

- **Loading screen:** a percentage and progress bar tied to real stages (renderer import, star field, star, planets, shader compile).
- **Intro:** SplitText headline.
- **Camera (the scrubbed sequence):** each chapter's centre maps to the camera's waypoint at that planet along a centripetal Catmull-Rom spline. A second spline drives the look-at target. Easing is frame-rate independent (`1 − e^(−5·dt)`).
- **Framing:** on desktop the view is offset right, so planets clear the left-hand cards. On phones it is offset up, so planets sit above the cards.
- **HUD:** pops in and re-pops its readouts (staggered) whenever the active world changes. A mini orbit diagram marks the planet.
- **Hover labels:** raycasting against the planet meshes shows "World II · Orrin: click to visit". Clicking flies to that chapter. The I–V nav does the same for keyboard users.
- **Parallax layer pair:** the starfield shell (distance 380–800) moves far slower than the planets as the camera travels, which gives real depth parallax.

**Performance:**

- `devicePixelRatio` is capped at 2.
- Three.js and the scene are **lazy-loaded** (`scene` chunk ≈ 139 kB gzip).
- Rendering **pauses** when the flight section is off screen or the tab is hidden.
- A **frame-time watchdog** switches to the low-power view if frames average more than 45 ms. A toast says so, and the toggle switches it back.
- Very weak devices (≤ 2 cores, ≤ 2 GB memory, or Save-Data) start in low power.
- **`?quality=high`** forces the 3D view.

**Fallbacks:**

- **No WebGL, low power, or no JS:** a static OKLCH sky with CSS-drawn planets in each chapter.
- **Reduced motion:** **one static rendered frame** of the system overview, plus the CSS planets. No Lenis, no camera flight, no stagger.
- Hidden start states apply only under `html.js:not(.reduced)`, with a 6 s boot fallback.

## Imagery system

**3D (procedural GLSL, value-noise fbm):**

- **Lava:** glowing seams on dark basalt.
- **Desert:** warped dunes.
- **Ocean:** sea depth, land masses and drifting clouds.
- **Gas giant:** turbulent bands and a storm, plus a banded ring shader with a gap.
- **Ice:** a cracked surface.
- **Atmospheres:** fresnel rims, lit toward the star.
- **The star:** animated granulation and limb brightening, with a canvas-gradient glow sprite.
- **Starfield:** 4,200 points with a slow (~0.1 Hz) shimmer, never a flash.

**Lighting rule:** the star at the origin is the only light, night sides use a tinted ambient, and the CSS planets use the same top-left highlight logic.

The slots for photos or renders are documented in [`public/assets/README.md`](public/assets/README.md).

## Run and build

```bash
npm install
npm run dev        # tokens + Vite dev server
npm run build      # tokens → tsc --noEmit → vite build
npm run preview    # serve dist/ on http://localhost:4173
npm run contrast   # WCAG check of the generated tokens
```

## Skills used

Loaded and applied:

- **shadertoy:** noise, fbm, GLSL ES rules.
- **color-expert:** OKLCH ramps and the equal-L/C hue-rotation family.
- **gsap-web:** the Lenis + ScrollTrigger single loop, SplitText.

**Not available:** `3d-web-experience`, `threejs-webgl`, `web-shaders`, `gsap-scroll`, `scroll-experience`.

## Verification

- `npm run build` passes (`tsc --noEmit` strict, then `vite build`).
- `npm run contrast`: all 12 pairs pass. The first run failed the control outline (2.78:1), which I fixed.
- **Playwright with headless Chromium**, WebGL through SwiftShader:
  - Default and `?quality=high` at 375, 768 and 1440 px, plus reduced-motion and no-JS runs.
  - No console errors or warnings after the fixes (`THREE.Clock` replaced by `THREE.Timer`, and a sync shader compile to avoid the SwiftShader-only `KHR_parallel_shader_compile` warning), no overflow, one `<h1>`.
  - Per-chapter 3D captures at 1440 and 375 px.
- **Bugs found and fixed:**
  - The canvas was hidden behind the body background (stacking order).
  - The renderer was sized while the canvas was still `display: none`, so it drew nothing.
  - The camera lagged a full planet behind on slow GPUs (fixed with frame-rate independent easing).
  - Night-side approaches (now sunward).
  - Phone framing.
  - The topbar overflowed on phones.
  - The low-power background was drowned in grain.
- **Interaction checks:**
  - The hover label appears over Orrin.
  - The low-power toggle hides the canvas and sets `aria-pressed`, and toggles back.
  - With WebGL blocked, the page falls back to `no-webgl` and loads.
- **axe-core** (default, `?quality=high`, and reduced motion): **0 violations**.
- **Note on this test machine:** in default mode the frame-time watchdog switched headless Chromium to low power, because SwiftShader renders only a few frames per second. That is the intended behaviour. On a real GPU the 3D view stays on, but **I could not measure real-GPU frame rates here**.

## Notes and known limitations

- **Repository.** This session can only push to `Different-websites`, so the site lives in `pro-sites/`. `pro-sites/split-into-repos.sh` publishes it as its own private repo.
- **Browsers and devices.** Not tested on real mobile GPUs, Safari or Firefox. The scene chunk is large (≈ 556 kB raw / 139 kB gzip). It loads behind the loading screen.
- **Scale.** Planet sizes and distances are compressed for the flight, not to scale.
