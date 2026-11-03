# Inkfold: flow-05

A scroll-driven site for **Inkfold**, a fictional type-and-ink studio. One sheet of paper sits on a desk with a GPU fluid simulation running on it. One camera drifts over the sheet, with no scene cuts: **Drop → Bloom of ink → Currents → Settle into the headline lettering**.

> **Renamed.** The brief asked for "Inkwell". A quick web check found *Inkwell* is a well-known typeface by Hoefler&Co., in the same category as this fictional studio, so the brand is **Inkfold** here. The folder and repository name stay `flow-05-inkwell-fluid-type`, as specified. Inkfold, its people, copy and data are fictional. The contact form is a demo: nothing is sent and the address is `studio@example.com`.

```bash
npm install
npm run dev        # ?debug for the debug panel, ?tier=low|mid|high to force a tier
npm run verify     # continuity + contrast + build + headless smoke test
```

## Concept

| Chapter | Progress | What drives the ink |
|---|---|---|
| Drop | 0–0.20 | A single drop emitter in the centre plus a gentle radial push. Moving the pointer drags ink across the sheet |
| Bloom of ink | 0.20–0.50 | Four rotating radial emitters push the drop outward. Vorticity confinement curls the edges |
| Currents | 0.50–0.80 | Three left-to-right currents with sinusoidal wobble. The middle one carries **vermilion** |
| Settle | 0.80–1.0 | Emitters stop and damping rises. Velocity flows up the gradient of a blurred **headline mask**, ink is drawn into the crisp letters and evaporates elsewhere, so the ink settles into "Inkfold" |

### The simulation

The fluid is in `src/site/fluid.ts` and `src/site/shaders/fluid.ts`. It is a stable-fluids solver on **WebGL2 half-float ping-pong render targets**:

- buffers: velocity, pressure and dye (all double-buffered), plus divergence and curl scratch targets;
- per frame: batched splats (up to 12 gaussians in one pass per field) → curl → vorticity confinement + settle forces → divergence → pressure warm-start + Jacobi iterations → gradient subtraction → semi-Lagrangian advection of velocity and dye → dye settle;
- the dye stores ink in R and vermilion in G.

The paper shader turns the dye into ink layers. It adds paper fibres (stretched value noise), darker "wet edges" where density changes, and a vermilion layer.

**Splats from scroll velocity.** Every emitter's force scales with the (capped, low-passed) scroll speed. An extra Lissajous emitter only appears while you scroll. **Pointer splats** come from ray-casting the pointer onto the sheet plane each frame.

**Headline attractor.** The headline is rendered into a 2D canvas with the Fraunces font. The canvas is redrawn once the web font loads; Georgia is the fallback. It is packed into a texture with R = crisp letters and G = wide blur: the blur is the attractor field and the crisp letters are the settle target.

**What is a pure function of progress, and what is not.** Camera, palette, effect strengths, emitter strengths, vorticity, damping and the settle amount all come from `sceneState(progress)` and are continuous. The fluid itself is a time-stepped simulation, so its exact pattern depends on how you scrolled. Scrolling back from Settle relaxes the attraction gradually and the ink starts moving again.

## Color Brief

| Role | Value |
|---|---|
| paper (bg) | cream, OKLCH L 0.94–0.96, C 0.022, h 85 |
| desk / paper shade (fog) | L 0.91–0.93, h 80 |
| ink (primary) | blue-black, L 0.20–0.25, C 0.06, **h 262–266** |
| ink, thin (secondary) | L 0.34–0.39, h 252–256 |
| vermilion (accent) | L 0.46, C 0.17, **h 30** (also the eyebrow, link and CTA colour) |
| text / scrim | L 0.22 ink-tinted text on an L 0.975 paper scrim |

This is the only **light** theme in the series. Contrast is still checked with the translucent scrim composited over both black and white. Vermilion was darkened from L 0.50 to L 0.46 to raise the worst case from 4.62:1 to 5.46:1.

## How `sceneState(progress)` works

Same engine as the other flow sites (`src/engine`). `src/site/chapters.ts` is the one table. It holds:

- copy;
- `fx`: `drop`, `bloomInk`, `currents`, `vermilion`, `settle`, `curl`, `pointerInk`, `calm`, plus the base effects;
- OKLCH keys;
- camera keys.

`createFlow()` builds a pure, allocation-free `sample(progress, out)` with smootherstep chapter weights, weight-blended fx, monotone-cubic OKLCH, arc-length camera curves and text windows. The fluid step runs in a `useFrame` at priority −1 (before the composer) and reads `engine.state.fx` for every emitter and solver parameter.

## How to add a chapter

1. Add an entry to `chapters` with every `InkFx` key.
2. Add a new emitter, if any, in `Sheet()` (`src/site/Experience.tsx`), scaled by that chapter's fx value so it fades in and out with the blend.
3. Add a poster motif in `src/App.tsx`.
4. Run `npm run check:continuity` and `npm run check:contrast`.

## Quality tiers

| Tier | DPR cap | Velocity/pressure grid | Dye grid | Jacobi iterations | Post FX |
|---|---|---|---|---|---|
| high | 2 | 256 rows (410×256) | 1024 rows (1638×1024) | 20 | subtle bloom, chromatic aberration, ACES, vignette, grain |
| mid | 1.5 | 192 rows | 768 rows | 14 | bloom, ACES, vignette |
| low | 1 | 128 rows | 512 rows | 8 | none |

Grid sizes are fixed at the detected tier cap. Adaptive downgrades lower the Jacobi iterations and DPR, and the other engine behaviours (hidden-tab pause, disposal of every render target and material, lazy-loaded 3D chunk) apply. There are 3 draw calls in the main scene (desk, sheet, composer passes), plus about 30 small fullscreen solver passes per frame on high.

## Fallbacks and accessibility

Same as the other flow sites:

- Poster mode with paper-coloured gradients and SVG ink motifs, the last one being the word itself. It is used when there is no WebGL2, after context loss, on scene error, or under reduced motion.
- A Calm mode toggle.
- Real DOM headings and text.
- An `aria-hidden` canvas. The settled lettering is decorative, and the brand name is also real text.
- A skip link and visible focus.
- Native keyboard scrolling.
- The `?debug` panel.

The ink moves smoothly and nothing flashes.

## Test results (run in this session)

**`npm run check:continuity`**: PASS. The closest values were the look-at at 72% of its limit and camera position at 60%. Every fx key (emitters, settle, curl, calm) stays within limits.

**`npm run check:contrast`**: PASS. Worst case **5.46:1** (vermilion accent on the light scrim, composited over black). Text on scrim is 12.15–12.25:1 at every sample.

| progress | chapter | text on scrim | accent on scrim |
|---:|---|---:|---:|
| 0.00 | drop | 12.22 | 5.46 |
| 0.30 | bloom | 12.22 | 5.46 |
| 0.50 | bloom | 12.25 | 5.46 |
| 0.70 | currents | 12.15 | 5.46 |
| 0.80 | currents | 12.25 | 5.46 |
| 1.00 | settle | 12.25 | 5.46 |

**`npm run build`**: PASS.

| Chunk | gzip | Loaded |
|---|---:|---|
| index.js | 11.0 KB | eagerly |
| vendor.js | 121.6 KB | eagerly |
| CSS | 3.2 KB | eagerly |
| Experience.js (solver + shaders) | 6.8 KB | lazily |
| r3f.js | 80.8 KB | lazily |
| three.js | 192.8 KB | lazily |

**`npm run check:smoke`**: PASS (third run). Headless Chromium (Playwright build 1243) with SwiftShader. The **first two runs failed** because the phone canvas was blank in Currents. That exposed two real bugs, both fixed:

1. Emitters sat at fixed sheet positions outside a portrait camera's view. The currents now start just left of where the camera looks.
2. Splat velocities were in grid cells per second, so the low tier's coarser grid flushed ink across the sheet twice as fast. Emitter speeds and the settle force are now normalised to the high-tier grid.

What the final run showed:

- The canvas was non-blank at 0…1.0 on desktop (`?tier=high`, luminance SD 8–80) and on phone (auto → low, SD 3.1–42).
- No console errors.
- Keyboard scrolling works.
- The rail link `#currents` lands in Currents.
- The Calm toggle and the reduced-motion poster mode both work.
- The `?debug` panel appears only with the flag.
- axe-core 4.14 reported **0 violations** in both scene and poster mode.

**Real-GPU frame rates were NOT measured.**

## Known issues

- Real-GPU performance is **not measured**: headless runs use SwiftShader. The 1024-row dye grid and 20 Jacobi iterations are the cost drivers on high.
- The fluid is stateful, so two visits never look identical. A very fast scroll into Settle can leave a grey wash around the letters for a moment before it evaporates.
- The canvas `filter: blur()` used to build the attractor field is not supported in older Safari. There the field is just the crisp mask: settling still works, but the pull is weaker.
- The headline is drawn right of centre, because on desktop the text panel sits on the left. On phones the panel can cover part of the lettering at the very end.
- On narrow portrait phones, the Bloom and Currents chapters show only light ink washes. The smoke test measured luminance SD 3–9 there, just above its blank threshold. Desktop shows the full marbling.
- Intermediate commits 1 and 2 are a file-level split. Only the final commit was built and tested as a whole.

## Skills and decisions

Skills loaded and read in this session: **r3f-fundamentals, r3f-shaders, r3f-postprocessing, r3f-animation, r3f-best-practices, motion-system** and the bOpen **shaders** skill.

Not available in this session: shadertoy, shader-programming-glsl, web-shaders, three-best-practices, color-expert. None are claimed as used. The solver is my own implementation of the standard stable-fluids method.

The site could not get its own GitHub repository from this cloud session, so it lives in `flow-sites/` of the session repository. See `../split-into-repos.sh`.
