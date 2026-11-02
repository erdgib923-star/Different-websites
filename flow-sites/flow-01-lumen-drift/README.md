# Lumen Drift: flow-01

A scroll-driven 3D site for **Lumen Drift**, a fictional creative-technology studio. The page follows one stream of light through a single persistent world with one continuous camera path and no scene cuts: **Spark → Stream → Canyon → Storm → Bloom → Horizon**.

> Lumen Drift, its people, copy and data are fictional. The contact form is a demo: nothing is sent and the address is `hello@example.com`.

```bash
npm install
npm run dev               # http://localhost:5173  (add ?debug for the debug panel, ?tier=low|mid|high to force a tier)
npm run verify            # continuity + contrast + build + headless smoke test
```

## Concept

One particle system of 120k points (60k mid tier, 25k low tier) is the whole story. All of its shapes are drawn in a **single draw call**:

| Chapter | Progress | What the particles become | Camera |
|---|---|---|---|
| Spark | 0–0.12 | a breathing point of light (dense core plus halo) | slow push-in |
| Stream | 0.12–0.30 | a river flowing along a spline (animated on the GPU) | follows the river |
| Canyon | 0.30–0.48 | fbm-noise terrain walls and a rippled floor | flies low between the walls |
| Storm | 0.48–0.66 | a curl-noise vortex with five twisted arms; spin and turbulence react to scroll speed | arcs around the funnel |
| Bloom | 0.66–0.84 | a phyllotaxis flower (golden-angle disc plus 13 petals) | orbits the flower |
| Horizon | 0.84–1.0 | a vast luminous plain and a bright horizon line, plus the call to action | settles, looking at the horizon |

Each particle stores its own morph targets (spark, canyon, bloom, horizon). Stream and storm are computed procedurally in the vertex shader. Particles evaluate the same smootherstep boundary ramps as `sceneState()`, shifted by a per-particle hash delay, so the swarm morphs as a wave rather than all at once. A divergence-free curl-noise field (the cross product of two analytic noise gradients) swells while a morph is in flight. Particles also part around the pointer: they are repelled from the pointer ray. A light **ribbon** leads the camera along its own path, an **fbm sky dome** carries the palette gradient, a drifting nebula and the horizon band, and particles fade with **palette-tinted fog**.

## Color Brief

Palettes are authored in **OKLCH**, interpolated per channel with monotone cubics (C1, no overshoot), bounded in lightness and chroma, gamut-mapped by chroma reduction and converted to linear sRGB (for shader uniforms) and 8-bit sRGB (for CSS). The same numbers drive the 3D world and the UI: `--c-bg`, `--c-text`, `--c-scrim`, `--c-accent` and the other custom properties are rewritten whenever an 8-bit channel changes. Borders, scrims, the rail and the form all track the 3D palette.

Hue path (primary hue): **255 → 215 → 175 → 85 → 30 → 345 → 330 → 295 → 250**. Hues are written unwrapped (`-15` = 345) so the path rotates continuously instead of jumping across 0°.

| Role | Lightness | Chroma | Hue |
|---|---|---|---|
| bg | 0.10–0.17 | ≤ 0.06 | primary hue |
| fog | 0.17–0.27 | ≤ 0.08 | primary − 8 |
| primary | 0.80 | ≤ 0.18 | primary hue |
| secondary | 0.72 | ≤ 0.16 | primary − 34 |
| accent | 0.86 | ≤ 0.12 | primary + 42 (+50 in Storm) |
| text | 0.97 | ≤ 0.012 | primary hue |
| scrim | 0.16–0.19 | ≤ 0.04 | primary hue |

## How `sceneState(progress)` works

`src/site/chapters.ts` holds **one data table**: for each chapter its id, title, start/end, copy, effect strengths (`fx`), OKLCH palette keys and camera keys. `createFlow()` in `src/engine/timeline.ts` turns that table into a pure function `flow.sample(progress, out)` (exposed as `engine.state` every frame):

- **Chapter weights.** Every boundary gets a smootherstep ramp `s_k` (half-width `blend`, capped at 45% of either neighbour). Chapter `i` has weight `s_(i-1) − s_i`, so the weights always sum to 1 and neighbours cross-fade. There are no `if (chapter)` cuts.
- **fx.** Each effect strength is the weight-blended mix of the chapter values.
- **Palette.** OKLCH keys (local 0..1 inside a chapter) are flattened to global tracks and interpolated with monotone cubics.
- **Camera.** Position keys and look-at keys become two centripetal Catmull-Rom curves (pure TypeScript, `src/engine/curve.ts`) with arc-length tables. Progress maps to arc length through a monotone cubic, so the camera never stops dead or snaps at a key.
- **Text.** Each chapter has an opacity window plus local progress.

`sample()` writes into a pre-built object, so it allocates nothing per frame. It has no three.js dependency, so it also runs in the eager main chunk (poster colours, CSS) and in Node (the test scripts).

The runtime (`src/engine/runtime.ts`) is the single source of truth and the single clock. Lenis smooths native scrolling over the tall `#main` container (900vh on desktop, 700vh on phones). ScrollTrigger measures it. On every GSAP ticker frame, a **critically damped spring** (exact closed form, ω = 10) turns the raw scroll into `progress` and `velocity`, stored in the zustand store's mutable `motion` object and read with `getState()`. The ticker then samples `sceneState`, runs the DOM choreography (`src/engine/dom.ts`) and calls R3F's `advance()` (`frameloop="never"`). Scroll, DOM and WebGL therefore share one progress value per frame. React never re-renders per frame.

## How to add a chapter

1. In `src/site/chapters.ts`, split an existing range and insert an entry in `chapters` with `id`, `title`, `start`, `end`, `copy`, `fx` (every key of `LumenFx`), at least one palette key (`key(at, hue, …)`) and one or more camera keys. Camera keys must strictly increase in global progress, so do not put a key at `at: 1` if the next chapter has one at `at: 0`.
2. If the new shape is a particle morph, add a target to `src/site/targets.ts` and a ramp to `src/site/shaders/particles.ts`. The shader reads `flow.boundaries` and `flow.blendWidths`, so the array sizes (`uB[5]`, `uW[5]`) must match `chapters.length − 1`.
3. Add a poster motif in `PosterArt` (`src/App.tsx`).
4. Run `npm run check:continuity` and `npm run check:contrast`. They name the exact progress where anything jumps or contrast drops.

## Quality tiers

| Tier | DPR cap | Particles | Post FX |
|---|---|---|---|
| high | 2 | 120,000 | bloom, chromatic aberration (speed-scaled, capped at 0.0022), ACES tone mapping, vignette, grain |
| mid | 1.5 | 60,000 | bloom, tone mapping, vignette |
| low | 1 | 25,000 | none (the renderer tone-maps directly) |

The initial tier comes from hardware hints (`src/engine/quality.ts`): WEBGL renderer string (software renderers count as low), mobile UA or coarse pointer, `hardwareConcurrency` and `deviceMemory`. drei's `PerformanceMonitor` then steps the tier down or up from measured FPS, never above the detected cap (three flip-flops fall back to low). `AdaptiveDpr` lowers resolution briefly during very fast scrolls. Lowering the particle count is free: geometry is built once for the cap tier, and lower tiers use a `drawRange` prefix of a shuffled order, which remains an even sample of every shape. A `uCountGain` uniform keeps the tiers equally bright. Rendering pauses while the tab is hidden. There are **3 draw calls** at low tier (sky, particles, ribbon), plus the composer passes on mid and high. The 3D stack (three, R3F, postprocessing: ~281 KB gzip) is lazy-loaded behind the HTML hero and CSS poster, with a staged progress bar.

## Fallbacks and accessibility

- **Poster mode**: each chapter becomes a normal stacked section with a CSS gradient poster in its own palette, an SVG motif and no scrubbing (native scroll, Lenis off). It is used when WebGL2 is missing, after `webglcontextlost`, if the 3D chunk throws, and under `prefers-reduced-motion`.
- **Calm mode** toggle in the header does the same at runtime and is remembered in `localStorage` (wrapped in try/catch). Turning Calm mode off under reduced motion is an explicit user choice.
- All copy is real DOM text with one heading per chapter (`h1` for the first). The canvas is `aria-hidden`. There is a skip link, visible focus rings and a status line explaining poster mode. Closed panels stay focusable: tabbing into one scrolls it into view and opens it.
- Native scroll is never hijacked: Space, PageDown, arrows, Home/End, the scrollbar and anchors all work. Rail links scroll with Lenis easing.
- `?debug` shows a progress slider, FPS, the tier with an override, draw calls, triangles, points, particle count and DPR. The panel is hidden otherwise.
- Flashing: every effect is a damped, continuous function of progress or speed. The ribbon's travelling bands change brightness below 1 Hz at any pixel. Chromatic aberration is capped and low-passed. Nothing flashes more than 3 times per second.

## Test results (run in this session)

**`npm run check:continuity`**: PASS. 2000 samples at 0.0005 steps. Worst offenders relative to their limits:

| Quantity | Worst step | Limit | Where |
|---|---|---|---|
| camera view direction | 0.969° | 1.0° | p = 0.819 (Bloom → Horizon turn) |
| camera look-at point | 0.685 u | 0.863 u (4× average) | p = 0.914 |
| camera position | 0.509 u | 0.668 u (4× average) | p = 0.622 |
| chapter weights / morph ramps | 0.0134 | 0.02 | each boundary |
| palette (any role, OKLab ΔE) | < 0.006 | 0.006 | — |

The check caught two real problems during development, both fixed: a 150° look-around at the Bloom → Horizon handover, and a too-tight Storm → Bloom turn.

**`npm run check:contrast`**: PASS. Text and accent were checked on the scrim (alpha 0.88), composited over **both** pure black and pure white, so the ratio holds whatever the 3D scene shows behind the panel. Worst: **8.44:1** (accent, p = 0.91).

| progress | chapter | text on scrim | accent on scrim |
|---:|---|---:|---:|
| 0.00 | spark | 13.12 | 9.15 |
| 0.10 | spark | 12.83 | 8.99 |
| 0.20 | stream | 12.87 | 9.19 |
| 0.30 | stream | 12.83 | 9.18 |
| 0.40 | canyon | 12.94 | 9.47 |
| 0.50 | storm | 12.94 | 9.59 |
| 0.60 | storm | 13.27 | 9.46 |
| 0.70 | bloom | 12.91 | 9.04 |
| 0.80 | bloom | 12.97 | 9.03 |
| 0.90 | horizon | 12.37 | 8.51 |
| 1.00 | horizon | 12.13 | 8.50 |

(All 101 samples are printed by the script. Every 0.05 step is between 8.45 and 13.27.)

**`npm run build`**: PASS (`tsc --noEmit` + Vite 7).

| Chunk | Size | gzip | Loaded |
|---|---:|---:|---|
| index.js (app + engine) | 27.7 KB | 11.8 KB | eagerly |
| vendor.js (react, gsap, lenis, zustand) | 360.1 KB | 121.6 KB | eagerly |
| CSS | 8.7 KB | 3.0 KB | eagerly |
| Experience.js (scene + shaders) | 19.6 KB | 7.4 KB | lazily |
| r3f.js (fiber, drei parts, postprocessing) | 269.5 KB | 80.8 KB | lazily |
| three.js | 752.6 KB | 192.8 KB | lazily |

**`npm run check:smoke`**: PASS. Playwright's bundled headless Chromium (build 1243) with **SwiftShader** (CPU WebGL):

- Screenshots at progress 0, 0.1 … 1.0 at 1440×900 (`?tier=high`) and 390×844 (auto-detected as low). The canvas was non-blank at all 22 positions (luminance SD 17–96, 83–419 colour buckets, DOM hidden).
- No console errors and no page errors.
- Keyboard: PageDown, Space, ArrowDown, End and Home all scroll as expected.
- Rail anchor `#storm` lands in the Storm chapter.
- The Calm mode toggle switches to poster mode and back, unmounting and remounting the canvas.
- `prefers-reduced-motion` gives poster mode with stacked sections.
- `?debug` panel: hidden by default, shown with the flag.
- axe-core 4.14 (WCAG 2.1 A/AA + best practice): **0 violations** in scene mode and in poster mode.

**Not measured: real-GPU frame rates.** The headless run uses a software rasteriser, and its FPS figures say nothing about real hardware. The 120k-particle high tier, the per-vertex curl noise and the postprocessing cost still need profiling on actual devices.

**Accessibility review.** The `accesslint` and `web-design-guidelines` skills were **not available** in this session (not installed). Instead, axe-core ran in the smoke test, plus a manual pass over focus order and visibility, touch target sizes (≥ 40 px on phones, 44 px for the Calm toggle), form labels, heading order, reduced motion and the `lang` attribute.

## Known issues

- Real-GPU performance is unverified (see above). On weak integrated GPUs the PerformanceMonitor should step down, but the thresholds are untuned.
- Intermediate commits 1 and 2 are a file-level split of work developed together. Only the final commit was built and tested as a whole.
- On phones, the long Horizon panel (with the form) slides under the header pills near the end. They keep their own scrim, so text stays legible.
- After `webglcontextlost` the page stays in poster mode for the session. It does not try to restore the context.
- Poster SVG motifs are deliberately simple.

## Skills and decisions

Skills actually loaded and read in this session: **r3f-fundamentals, r3f-shaders, r3f-postprocessing, r3f-animation, r3f-interaction, r3f-best-practices, motion-system** and the bOpen **shaders** skill. The `bopen-tools` plugin itself failed to install (GitHub 401); its `shaders` skill was read from the plugin repository's current location, `modules/creative`. **Not available:** shadertoy, web-shaders, scroll-experience, gsap-scroll and color-expert. These were not installed by the given commands, and none were claimed as used.

Assumptions:

- "Hue about 255" was interpreted as the primary (particle) hue, with the background a dark low-chroma version of it.
- The Storm's "peak velocity effects" use scroll speed: spin, turbulence, roll, FOV breathing and chromatic aberration all scale with it, capped.
- The site could not get its own GitHub repository from this cloud session (no `gh` auth and no repository-creation access), so it lives in `flow-sites/` of the session repository. See `../split-into-repos.sh`.
