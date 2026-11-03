# Silken Weather: flow-08

A scroll-driven 3D site for **Silken Weather**, a fictional fashion label. Silk ribbons stream along the camera's own path through one soft studio void, with no scene cuts: **Unfurl → Twist → Wave → Veil**.

> Silken Weather, its people, copy and data are fictional. The waitlist form is a demo: nothing is sent, and the address is `atelier@example.com`.

```bash
npm install
npm run dev        # ?debug for the debug panel, ?tier=low|mid|high to force a tier
npm run verify     # continuity + contrast + build + headless smoke test
```

## Concept

| Chapter | Progress | Silk |
|---|---|---|
| Unfurl | 0–0.20 | Champagne ribbons emerge as a tight bundle just below the camera and start to open |
| Twist | 0.20–0.45 | Deep wine. The bundle spreads and the ribbons twist hard along their length |
| Wave | 0.45–0.70 | Midnight blue satin. Waves travel along the ribbons and the edges flutter. The sheen does most of the work |
| Veil | 0.70–1.0 | Pearl organza. The ribbons widen and become translucent, and the call to action appears |

**Ribbons** (`src/site/shaders/silk.ts`) are flat strips: 7 on high, 5 on mid, 3 on low, merged into **one geometry and one draw call**. All displacement happens on the GPU, with no physics:

- **Path.** Each ribbon reads the camera's own arc-length path, sampled into a 512 × 1 float texture. It renders a window starting just ahead of the camera, so the ribbons always stream along the route you travel.
- **Motion.** Each ribbon orbits the path and twists along its length. Twist increases with damped, capped scroll velocity. Waves run along the ribbon and the edges flutter.
- **Normals and tangents** come from finite differences of the same displacement function.

**Shading.** A soft procedural studio light: key, fill and rim lights, plus a **Kajiya-Kay style anisotropic sheen** along the ribbon tangent. There are two lobes, a sharp white one and a broad tinted one shifted toward the normal, which gives silk its streaked highlight. A Fresnel rim and fog complete it. In Veil the opacity follows the Fresnel term, so edges read as gauze.

**Backdrop.** A seamless studio cyclorama: a gradient that is darker toward the floor and ceiling, with a soft key-light glow ahead of the camera.

**Motion design.** I applied the *Premium* archetype from the `motion-design` skill (LottieFiles): 350–600 ms UI durations, `cubic-bezier(0.4, 0, 0.2, 1)`, no overshoot. There are three motion layers:
- **primary:** the ribbons;
- **secondary:** the sheen and Fresnel shimmer;
- **ambient:** the backdrop glow and slow orbit.

## Color Brief

Silk colour (`primary`) follows **champagne 80 → deep wine 10 → midnight 265 → pearl (h 250, near-neutral)**. Hues are unwrapped: midnight is −95 and pearl is −110, so the turn from wine to midnight passes through plum rather than green.

| Role | Unfurl | Twist | Wave | Veil |
|---|---|---|---|---|
| silk (primary) | L .88–.90, C .07, h 82→76 | L .47→.44, C .15, h 12→8 | L .38–.40, C .10, h 265 | L .93–.95, C .015, h 250 |
| second silk (secondary) | L .78–.80, h 70→60 | L .34–.36, h 2→356 | L .30–.32, h 252–250 | L .86–.88, h 265–260 |
| studio (bg) | warm L .60→.55 | wine L .30→.24 | midnight L .14→.12 | cool pearl-grey L .50–.54 |
| accent (UI) | L .84–.87, C ≤ .09, hue following the silk | | | |
| text / scrim | L .97 / L .17 | | | |

The first draft used near-white studios for Unfurl and Veil, and the ribbons almost vanished against them. The backdrops were darkened so silk stays the brightest thing in frame.

## How `sceneState(progress)` works

Same engine as the other flow sites (`src/engine`). The single table in `src/site/chapters.ts` holds the copy, the fx (`spread`, `width`, `twist`, `wave`, `flutter`, `sheen`, `veil` and the base effects), the OKLCH keys and the camera keys. `createFlow()` turns it into a pure, allocation-free `sample(progress, out)`. The ribbon window starts at `state.camU`, the camera's normalised arc length, so ribbons and camera share one curve.

## How to add a chapter

1. Add an entry to `chapters` with every `SilkFx` key.
2. Add a poster motif in `src/App.tsx`.
3. Run `npm run check:continuity` and `npm run check:contrast`.

New fabric behaviour goes in `ribbon()` in `silk.ts`. Keep it a function of `(s, v)` so the finite-difference normals stay correct.

## Quality tiers

| Tier | DPR cap | Ribbons | Segments per ribbon | Post FX |
|---|---|---|---|---|
| high | 2 | 7 | 420 × 28 | bloom, chromatic aberration, ACES, vignette, grain |
| mid | 1.5 | 5 | 300 × 20 | bloom, ACES, vignette |
| low | 1 | 3 | 200 × 12 | none |

An adaptive downgrade draws a prefix of the merged index buffer, so fewer ribbons are drawn without rebuilding geometry. The main scene uses 2 draw calls: backdrop and ribbons. Hidden-tab pause, disposal and the lazily loaded 3D chunk all work as in flow-01.

## Fallbacks and accessibility

These work as in flow-01:
- **Poster mode**: SVG ribbon curves per chapter. It is used when WebGL2 is missing, after context loss, on a scene error, or under reduced motion.
- **Calm mode** toggle.
- **Real DOM text and headings**, with the canvas `aria-hidden`.
- **Skip link** and visible focus.
- **Native keyboard scrolling**.
- **`?debug` panel**.

Ribbon motion is slow, and nothing flashes.

## Test results (run in this session)

**`npm run check:continuity`**: PASS. The tightest quantities were palette primary/secondary at the Wave → Veil handover (58–59% of the limit) and the camera look-at and position (54–55%).

**`npm run check:contrast`**: PASS. Worst case **8.33:1** (accent at p = 0.47). The scrim (alpha 0.88) was composited over both black and white.

| progress | chapter | text on scrim | accent on scrim |
|---:|---|---:|---:|
| 0.00 | unfurl | 12.81 | 9.12 |
| 0.20 | unfurl | 12.87 | 8.95 |
| 0.30 | twist | 12.87 | 8.64 |
| 0.50 | wave | 12.84 | 8.42 |
| 0.70 | wave | 12.82 | 8.71 |
| 0.80 | veil | 12.82 | 9.20 |
| 1.00 | veil | 12.82 | 9.45 |

**`npm run build`**: PASS. Sizes below are gzip.

| Chunk | gzip | Loaded |
|---|---:|---|
| index.js | 11.0 KB | eagerly |
| vendor.js | 121.6 KB | eagerly |
| CSS | 3.2 KB | eagerly |
| Experience.js | 4.5 KB | lazily |
| r3f.js | 80.8 KB | lazily |
| three.js | 193.9 KB | lazily |

**`npm run check:smoke`**: PASS, in headless Chromium (Playwright build 1243) with SwiftShader.

- The canvas was non-blank at progress 0…1.0 on desktop (`?tier=high`) and on phone (auto → low), with luminance SD 14–30.
- No console errors.
- Keyboard scrolling works.
- The rail link `#wave` lands in Wave.
- Calm mode and reduced-motion poster mode both work.
- The `?debug` panel appears only with the flag. It reported 2 draw calls and 3 ribbons on the low tier.
- axe-core 4.14 found **0 violations** in scene mode and in poster mode.

**Real-GPU frame rates were NOT measured.**

## Known issues

- Real-GPU performance is **not measured**: headless runs use SwiftShader.
- Ribbons are single-layer transparent strips drawn with depth writes on. Where two translucent veils overlap, the draw order can show faint seams.
- Strong flutter can produce thin slivers at the ribbon edges, close to the camera.
- On narrow phones, the ribbon bundle sits partly behind the text panel.
- Intermediate commits 1 and 2 are a file-level split. Only the final commit was built and tested as a whole.

## Skills and decisions

Skills loaded and read in this session:
- r3f-fundamentals, r3f-shaders, r3f-postprocessing, r3f-animation, r3f-best-practices
- the bOpen **shaders** skill
- **motion-system**
- **motion-design**

**Not available in this session:** taste-skill and color-expert. Neither is claimed as used.

The site could not get its own GitHub repository from this cloud session, so it lives in `flow-sites/` of the session repository. See `../split-into-repos.sh`.
