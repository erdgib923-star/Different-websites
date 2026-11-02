# Thalassa Deep: flow-02

A scroll-driven 3D descent for **Thalassa Deep**, a fictional ocean-exploration journal. One persistent water column, one camera that sinks along a gentle S-curve, and no scene cuts: **Sunlit → Twilight → Midnight → Abyss**.

> Thalassa Deep, its people, copy and data are fictional. The subscribe form is a demo: nothing is sent, and the address is `dive@example.com`. The depth-zone boundaries in the copy (200 m, 1,000 m, 4,000 m) follow common oceanographic conventions. The on-screen depth gauge is an illustrative mapping of scroll progress, not a measurement.

```bash
npm install
npm run dev        # ?debug for the debug panel, ?tier=low|mid|high to force a tier
npm run verify     # continuity + contrast + build + headless smoke test
```

## Concept

| Chapter | Progress | Depth shown | What happens |
|---|---|---|---|
| Sunlit | 0–0.20 | 0–200 m | You look up at the surface from below: a rippling Snell's window, rippling light on the underside of the waves, animated **caustics** on a sculpted reef wall, slanting **god rays** |
| Twilight | 0.20–0.45 | 200–1,000 m | Reds vanish, caustics and rays fade, the water turns blue, marine snow thickens and the first jellyfish glow |
| Midnight | 0.45–0.70 | 1,000–4,000 m | No sunlight: the wall is lit only by **bioluminescent speckles**, jellyfish pulse in cyan, marine snow drifts past |
| Abyss | 0.70–1.0 | 4,000–5,900 m | The abyssal plain with dunes, **lures** glowing in cyan and magenta, the brightest jellies, and the subscribe call to action |

**What the scene is made of** (7 draw calls on the low tier):

- **Water dome** (`waterColor(dir)` gradient plus the Snell's window).
- **Surface plane** with domain-warped noise ridges.
- **Reef wall + abyssal floor**: CPU-sculpted fbm geometry sharing one shader. Animated Worley-noise **caustics** (F2 − F1 ridges, two layers) projected from above and fading with `exp(y)`. Up-facing light, deep bio speckles that pulse below 0.2 Hz, and depth fog.
- **God rays**: 11 instanced cylindrical billboards hanging from the surface, flickering with value noise and fading with depth (one draw call).
- **Marine snow**: a box of flakes that wraps around the camera, so the field is endless (one draw call).
- **Jellyfish**: procedural instanced shapes. Each is a lathe bell plus 8 tentacle strips, with a vertex-shader pulse and sway, Fresnel glow, and cyan vs magenta chosen per instance with deeper ones more often magenta (one instanced draw call).
- **Lures**: glowing points with a core and halo (one draw call).

**Depth fog fades toward the water colour of the view direction**, not toward a flat colour, so distant geometry dissolves into the water instead of leaving a silhouette. A depth gauge (decorative, `aria-hidden`) is written straight from the engine ticker.

## Color Brief

Authored in OKLCH and shared by the 3D world and the UI (CSS custom properties).

| Role | Sunlit | Twilight | Midnight | Abyss |
|---|---|---|---|---|
| water (bg) hue / L | 195–200 / 0.50→0.40 | 215→235 / 0.27→0.19 | 245→255 / 0.12→0.09 | 262→266 / 0.075 |
| light (primary) | sunlight 185–190, L 0.95 | 205, L 0.86 | bio cyan 200, L 0.80 | bio cyan 200 |
| accent | cyan 190–195 | cyan 200–205 | 215 → violet 280 | magenta 330 → 340 |
| rock (secondary) | 165–175, L 0.6 | 215–230, L 0.4 | 245–255, L 0.24 | 262–266, L 0.2 |
| text / scrim | L 0.97 / L 0.17, hue following the water | | | |

The hue path is turquoise 195 → 215 → 245 → navy 265. The bioluminescent accents are **cyan 200** (light role) and **magenta 340** (accent role, which travels 200 → 280 → 340 so it never jumps across the wheel).

## How `sceneState(progress)` works

This site uses the same engine as flow-01, copied and adapted: `src/engine`. `src/site/chapters.ts` is the one data table: copy, `fx` (`caustics`, `rays`, `snow`, `bio`, `surface`, `ambient` and the base effects), OKLCH keys, and camera position and look-at keys. `createFlow()` produces a pure, allocation-free `sample(progress, out)`:

- Chapter weights come from smootherstep ramps at each boundary (half-width 0.05).
- fx values are weight-blended.
- Palette tracks are monotone-cubic OKLCH, bounded in lightness and chroma.
- The camera follows arc-length Catmull-Rom curves, with progress mapped to arc length by a monotone cubic.
- Text uses opacity windows.

Lenis + ScrollTrigger feed a critically damped spring. The GSAP ticker samples once per frame and drives the DOM, the CSS colours, the depth gauge and R3F `advance()`. React never re-renders per frame.

Engine changes since flow-01:

- `FlowApp` has an `overlay` slot (used for the depth gauge).
- Chapter weights and ramps are `Float64Array`, so constant `fx` keys stay exactly constant.
- The smoke test no longer hard-codes chapter ids.

## How to add a chapter

1. Insert an entry in `chapters` (`src/site/chapters.ts`) with `id`, `title`, `start`/`end` (the ranges must tile 0..1), `copy`, every `DeepFx` key, at least one palette key and camera keys that strictly increase in global progress.
2. If the new chapter changes the depth mapping, add a key to `DEPTH_M`.
3. Add a poster motif in `PosterArt` (`src/App.tsx`).
4. Run `npm run check:continuity` and `npm run check:contrast`.

## Quality tiers

| Tier | DPR cap | Snow | Jellies | Lures | Post FX |
|---|---|---|---|---|---|
| high | 2 | 14,000 | 54 | 1,400 | bloom, speed-scaled chromatic aberration, ACES, vignette, grain |
| mid | 1.5 | 8,000 | 40 | 900 | bloom, ACES, vignette |
| low | 1 | 3,500 | 26 | 450 | none |

The tier is chosen from hardware hints, then adapted by drei `PerformanceMonitor`. `AdaptiveDpr` regresses resolution during very fast scrolls. Counts drop through `drawRange` and `InstancedMesh.count`, without rebuilding geometry. Rendering pauses when the tab is hidden. Every geometry and material is disposed on unmount. The 3D chunks load lazily behind the HTML hero, CSS backdrop and preloader.

## Fallbacks and accessibility

These match flow-01:

- **Poster mode**: stacked sections with gradient posters and SVG motifs. It is used for no WebGL2, context loss, a scene error or `prefers-reduced-motion`.
- The **Calm mode** toggle switches to poster mode at runtime.
- Real DOM text with one heading per chapter.
- Canvas is `aria-hidden`.
- Skip link and visible focus.
- Native scroll and keyboard work everywhere.
- `?debug` panel.

Every pulse in the scene is slower than 1 Hz, and nothing flashes.

## Test results (run in this session)

**`npm run check:continuity`**: PASS. 2000 samples at 0.0005 steps, with every quantity under its limit. The closest were the text windows (54% of limit), the chapter weights and morph ramps (0.0094 per step against 0.02), and camera position (0.34 u against 0.85 u). View-direction change stayed under 1° per step everywhere. The check initially failed on a false positive: `fov` is constant here, and Float32 weights added ~1e-7 of noise. That was fixed in the engine by switching to Float64 weights.

**`npm run check:contrast`**: PASS. Worst case is **7.59:1** (accent at p = 0.90), with the scrim at alpha 0.88 composited over black and over white.

| progress | chapter | text on scrim | accent on scrim |
|---:|---|---:|---:|
| 0.00 | sunlit | 12.81 | 9.43 |
| 0.10 | sunlit | 12.81 | 9.43 |
| 0.20 | sunlit | 12.80 | 9.34 |
| 0.30 | twilight | 12.85 | 8.91 |
| 0.40 | twilight | 12.82 | 8.82 |
| 0.50 | midnight | 12.80 | 8.92 |
| 0.60 | midnight | 12.90 | 8.71 |
| 0.70 | midnight | 12.84 | 8.11 |
| 0.80 | abyss | 12.88 | 7.62 |
| 0.90 | abyss | 12.85 | 7.59 |
| 1.00 | abyss | 12.87 | 7.61 |

**`npm run build`**: PASS.

| Chunk | gzip | Loaded |
|---|---:|---|
| index.js | 11.7 KB | eagerly |
| vendor.js | 121.6 KB | eagerly |
| CSS | 3.1 KB | eagerly |
| Experience.js (24.7 KB raw) | 8.1 KB | lazily |
| r3f.js | 80.8 KB | lazily |
| three.js | 192.9 KB | lazily |

**`npm run check:smoke`**: PASS. Playwright's headless Chromium (build 1243) with SwiftShader:

- The canvas was non-blank at progress 0…1.0 on desktop 1440×900 (`?tier=high`) and on phone 390×844 (auto → low). Luminance SD ranged 4.3–49.6. The midnight chapter is intentionally very dark (mean luminance ≈ 1–4 out of 255) but still has structure.
- No console errors.
- PageDown, Space, ArrowDown, End and Home all scroll.
- The rail link `#midnight` lands in Midnight.
- The Calm toggle switches to poster mode and back.
- Reduced motion gives poster mode.
- The `?debug` panel only appears with the flag. It reported 7 draw calls on the low tier.
- axe-core 4.14: **0 violations** in scene and in poster mode.

**Real-GPU frame rates were NOT measured.**

## Known issues

- Real-GPU performance is **not measured**: headless runs use SwiftShader.
- Midnight is very dark by design. On poorly calibrated or very dim screens, its jellyfish may be hard to see.
- Caustics on the reef read as a fairly regular cellular web up close.
- The sunlit surface is bright enough that film grain is visible on it on high tier.
- The reef wall is a displaced height sheet. Its top edge pokes slightly above the surface plane, which you can see at the very start.
- Intermediate commits 1 and 2 are a file-level split. Only the final commit was built and tested as a whole.

## Skills and decisions

Skills loaded and read in this session: **r3f-fundamentals, r3f-shaders, r3f-postprocessing, r3f-animation, r3f-best-practices, motion-system** and the bOpen **shaders** skill. Not available in this session: shadertoy, web-shaders, gsap-scroll and color-expert. None of these are claimed as used.

Assumptions:

- "Procedural glowing creature silhouettes from metaballs or instanced shapes" was built with instanced procedural jellyfish rather than metaballs, because one instanced draw call is cheaper.
- The depth gauge is decorative (`aria-hidden`). The zone depths are also stated in each chapter's eyebrow text.
- The site could not get its own GitHub repository from this cloud session, so it lives in `flow-sites/` of the session repository. See `../split-into-repos.sh`.
