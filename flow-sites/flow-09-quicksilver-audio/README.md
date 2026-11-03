# Hydrargyr Audio: flow-09

A scroll-driven, real-time ray-marched product reveal for **Hydrargyr Audio**, a fictional audio brand. The page is one body of liquid metal in one studio, filmed by one orbiting camera, with no scene cuts: **Pool → Headphone-like form → Watch-like form → Sphere**.

> **Renamed.** The brief asked for "Quicksilver Audio". A quick web check found that *Quicksilver Audio* is a real American maker of hi-fi tube amplifiers, so the brand here is **Hydrargyr Audio**. *Hydrargyrum* is the Latin name for mercury, and no audio company of that name turned up. The folder and repository name stay `flow-09-quicksilver-audio`, as specified. Hydrargyr Audio, its products, copy and data are fictional. The forms are abstract shapes built from primitives, not models of real products. The form is a demo: nothing is sent, and the address is `hello@example.com`.

```bash
npm install
npm run dev        # ?debug for the debug panel, ?tier=low|mid|high to force a tier
npm run verify     # continuity + contrast + build + headless smoke test
```

## Concept

| Chapter | Progress | Form |
|---|---|---|
| Pool | 0–0.20 | A flattened liquid pool with concentric ripples and droplets rising out of it (smooth-min metaballs) |
| Headphones | 0.20–0.50 | The pool pours into a headphone-like form: capped-torus band, capsule yokes, rounded-cylinder cups, torus cushions |
| Watch | 0.50–0.80 | A watch-like form: rounded-cylinder case, bezel torus, curved rounded-box straps, crown |
| Sphere | 0.80–1.0 | Everything settles into a single wobbling sphere, with the call to action |

`src/site/shaders/metal.ts` is a fullscreen fragment-shader ray marcher.

- **Shapes.** Each form is a signed-distance function built from primitives joined with polynomial smooth-min.
- **Morph.** The morph is the **convex blend of the four distances**, weighted by `fx.wPool`, `wHead`, `wWatch` and `wSphere` from `sceneState`. The smootherstep chapter blend *is* the morph. A liquid wobble term peaks halfway through each morph (`4·w₁·w₂`). Forms with zero weight are skipped through uniform branches.
- **Normals.** Four-tap tetrahedral gradient.
- **Shading.** Chrome uses Fresnel on a mirror reflection of a **procedural studio environment**: a large cool softbox at upper left, a warm strip at right, a dim front softbox behind the camera, a rim band, and a darker floor. A 4-tap SDF ambient-occlusion term is used on high and mid.
- **Floor.** An analytic floor plane with a soft contact shadow, also taken from the SDF.
- **Camera.** The ray camera is the engine camera after the camera rig, so the camera path, pointer parallax and velocity roll all apply.

The march renders into a half-float target at a **tier-dependent resolution**, then a fullscreen quad blits it into the main frame. Bloom, chromatic aberration, ACES tone mapping, vignette and grain still apply on top.

## Color Brief

Chrome neutrals. The cool reflection (`primary`) stays at hue **250**, and the warm reflection (`secondary`) at hue **60**. The softbox balance (`fx.warmth`) moves between them by chapter: cool for Pool and Watch, warm for Headphones, balanced for Sphere.

| Role | Value |
|---|---|
| studio (bg / fog) | L 0.13–0.16 / 0.19–0.22, C ≤ 0.016, h 250 |
| cool softbox (primary) | L 0.84, C 0.06–0.095, **h 250** |
| warm softbox (secondary) | L 0.82, C 0.05–0.095, **h 60** |
| accent (UI) | L 0.86, C 0.05–0.06. Follows the dominant reflection: 250 → 62–70 → 250–255 → 55–60 |
| text / scrim | L 0.97 / L 0.17, nearly neutral |

## How `sceneState(progress)` works

This site uses the same engine as the other flow sites (`src/engine`). The single data table, `src/site/chapters.ts`, holds the copy, the fx values (the four shape weights, `ripple`, `warmth`, `studio`, and the base effects), the OKLCH keys and the camera keys. `createFlow()` turns that table into a pure, allocation-free `sample(progress, out)`.

**Change to the continuity test.** The camera orbits a small object and always looks near the origin, so the look-at path totals only about 0.8 units. That made the "4× average step" rule flag motion of 0.003 units per step. Here, both camera limits also allow a scale-aware floor of 0.2% of the current camera-to-target distance per step. The 1°-per-step view-angle check still guards real swings. The test also caught a camera move that really was too fast (headphones → watch), and I fixed it by moving the keys.

## How to add a chapter

1. Add a weight key `wX` to `MetalFx`, and give it to every chapter: 1 in the new chapter, 0 elsewhere.
2. In `metal.ts`, write the SDF for the new form and add `if (uW.? > 0.001) d += uW.? * shape(p)` to `map()`. Extend `uW` beyond a `vec4` if needed.
3. Add a chrome SVG silhouette in `PosterArt` (`src/App.tsx`).
4. Run `npm run check:continuity` and `npm run check:contrast`.

## Quality tiers

| Tier | DPR cap | March resolution | Max steps | AO | Post FX |
|---|---|---|---|---|---|
| high | 2 | 100% of canvas | 110 | 4 taps | bloom, chromatic aberration, ACES, vignette, grain |
| mid | 1.5 | 70% | 72 | 4 taps | bloom, ACES, vignette |
| low | 1 | 50% | 48 | off | none |

The main scene is **1 draw call** (the blit quad) plus one offscreen march pass. The debug panel reports the march target's pixel count as "particles". Adaptive behaviour works as in flow-01: `PerformanceMonitor` changes the tier, which changes the resolution and step budget live; `AdaptiveDpr` regresses during fast scrolls; rendering pauses when the tab is hidden; resources are disposed on unmount; and the 3D chunk is lazy-loaded.

## Fallbacks and accessibility

- **Strong static fallback.** Poster mode is used when WebGL2 is missing, after context loss, on scene error, under reduced motion, or in Calm mode. It shows each chapter's form as an **SVG silhouette with chrome gradients**: dark–light–dark linear bands, tinted with the chapter's cool and warm palette, and a radial gradient for the sphere.
- The rest matches flow-01: real DOM text and headings, an `aria-hidden` canvas, a skip link, visible focus, native keyboard scrolling, and the `?debug` panel.
- Ripples and wobble are slow, and nothing flashes.

## Test results (run in this session)

**`npm run check:continuity`**: PASS. The worst quantities were camera position (56% of limit) and the text windows (54%). Shape weights change by at most 0.0067 per step against a 0.02 limit.

**`npm run check:contrast`**: PASS. The worst ratio was **8.96:1** (accent at p = 0.90), measured with the scrim at alpha 0.88 composited over both black and white. Text on the scrim was 12.78:1 everywhere.

| progress | chapter | text on scrim | accent on scrim |
|---:|---|---:|---:|
| 0.00 | pool | 12.78 | 9.15 |
| 0.20 | pool | 12.78 | 9.29 |
| 0.35 | headphones | 12.78 | 8.98 |
| 0.50 | headphones | 12.78 | 9.21 |
| 0.65 | watch | 12.78 | 9.13 |
| 0.80 | watch | 12.78 | 9.33 |
| 0.90 | sphere | 12.78 | 8.96 |
| 1.00 | sphere | 12.78 | 8.98 |

**`npm run build`**: PASS.

| Chunk | gzip | Loaded |
|---|---:|---|
| index.js | 11.0 KB | eagerly |
| vendor.js | 121.6 KB | eagerly |
| CSS | 3.2 KB | eagerly |
| Experience.js (ray marcher) | 5.2 KB | lazily |
| r3f.js | 80.8 KB | lazily |
| three.js | 192.8 KB | lazily |

**`npm run check:smoke`**: PASS, in headless Chromium (Playwright build 1243) with SwiftShader:
- The canvas was non-blank at progress 0…1.0 on desktop (`?tier=high`) and phone (auto → low), with luminance SD 18–75.
- No console errors.
- Keyboard scrolling works.
- The rail link `#watch` lands in Watch.
- The Calm toggle and reduced-motion poster mode both work.
- The `?debug` panel appears only with the flag. It reported 1 draw call and a 256,000-pixel march target on low.
- axe-core 4.14 found **0 violations** in both scene and poster mode.

**Real-GPU frame rates were NOT measured.** Real devices need profiling, because full-resolution ray marching is the most GPU-heavy technique in the series.

## Known issues

- Real-GPU performance is not measured. On weak GPUs the tier system should fall back to 50% resolution and 48 steps, but the thresholds are untuned.
- Blending distance fields is not an exact SDF, so the march uses 0.85 step relaxation. Rare grazing-angle misses can show as tiny holes during a morph.
- The watch face reflects the front softbox as a flat grey disc. There is no dial detail.
- Intermediate commits 1 and 2 are a file-level split. Only the final commit was built and tested as a whole.

## Skills and decisions

Skills loaded and read in this session: **r3f-fundamentals, r3f-shaders, r3f-postprocessing, r3f-animation, r3f-best-practices, motion-system**, and the bOpen **shaders** skill. Its raymarching/SDF notes informed the GLSL structure.

**Not available** in this session: shadertoy, shader-programming-glsl, web-shaders, three-best-practices, color-expert. None of these are claimed as used. The SDF primitives are standard closed-form distance functions, written for this site.

The site could not get its own GitHub repository from this cloud session, so it lives in `flow-sites/` of the session repository. See `../split-into-repos.sh`.
