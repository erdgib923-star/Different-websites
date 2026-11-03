# Druse: flow-04

A scroll-driven 3D journey for **Druse**, a fictional mineral-and-gemstone collective. The site is one continuous cave, one camera path along its axis, and has no scene cuts: **Cave mouth → Quartz corridor → Amethyst chamber → Heart geode**.

> Druse, its people, copy and data are fictional. The visit form is a demo: nothing is sent, and the address is `show@example.com`. The mineral facts in the copy (what a druse is, why rose quartz is pink, why amethyst is violet) are general geology, simplified.

```bash
npm install
npm run dev        # ?debug for the debug panel, ?tier=low|mid|high to force a tier
npm run verify     # continuity (+ cave containment) + contrast + build + headless smoke test
```

## Concept

| Chapter | Progress | What happens |
|---|---|---|
| Cave mouth | 0–0.20 | A flared, noise-carved opening, with daylight spilling in from behind and the first amethyst clusters |
| Quartz corridor | 0.20–0.45 | The tube narrows. Rose-quartz points line the walls, the light shifts to rose, and dust and glitter catch the headlamp |
| Amethyst chamber | 0.45–0.70 | The cave opens into a wide chamber lined with thousands of violet points under teal light, with the camera arcing across it |
| Heart geode | 0.70–1.0 | A closed spherical geode lined with citrine-amber points. **Three hero crystals** rise in the centre, and the call to action appears |

**What is drawn** (5 draw calls on low, plus a transmission pass for the hero crystals on mid and high):

- **Cave wall.** A tube built around a centripetal Catmull-Rom centreline (`src/site/cave.ts`) with a radius profile and 3D value-noise displacement, closed at the far end. The rock shader uses flat facets from screen-space derivatives. It is lit by a soft headlamp on the camera, the chapter light and the daylight at the mouth. It also has fbm texture, mineral veins tinted with the crystal colour, and glitter cells.
- **Instanced crystals.** Two `InstancedMesh`es: hexagonal prisms with pyramid tips (up to 3,200) and octahedra (up to 900). They grow in clusters of 5–14 on the wall, point toward the axis and are denser in the wide sections. The **fake-refraction shader** refracts the view ray through each flat facet at three IORs (1.44 / 1.47 / 1.51), one per colour channel, and samples a procedural light field. That gives cheap dispersion, plus a Fresnel rim, a headlamp highlight and an **emissive inner glow** at the crystal base that breathes below 0.15 Hz.
- **Hero crystals.** Three large prisms merged into **one** mesh, so drei's `MeshTransmissionMaterial` needs only one extra pass. On the low tier they fall back to a `MeshStandardMaterial` (emissive, slightly transparent). An amber point light grows with `fx.hero`.
- **Floating dust.** A wrap-around box of points around the camera.

## Color Brief

Hue path (light and glow: the `primary` and `accent` roles): **amethyst 300 → rose 350 → teal 190 → amber 80**. The crystal bodies (the `secondary` role) keep their mineral colour: amethyst 300, rose quartz 352, amethyst 295 under teal light, and citrine 75. In the chamber this gives a violet-on-teal contrast.

| Role | Mouth | Corridor | Chamber | Geode |
|---|---|---|---|---|
| light (primary) | L .82 C .14 h 300–305 | h 345–355 | h 195–185 | h 80–75 |
| crystal (secondary) | L .62 C .15 h 300 | L .72 C .10 h 352 | L .58 C .16 h 298–292 | L .80 C .13 h 78–72 |
| rock / fog (bg, fog) | L .11–.17, C ≤ .05, following the light hue | | | |
| text / scrim | L .97 / L .17 | | | |

## How `sceneState(progress)` works

This site uses the same engine as the other flow sites (`src/engine`). `src/site/chapters.ts` is the single table:

- copy
- `fx`: `glow`, `dust`, `sparkle`, `wallLight`, `daylight`, `hero`, plus the base effects
- OKLCH keys
- camera keys

`CAVE` (centreline and radii) lives next to the table, so the world and the camera share one source.

`createFlow()` builds a pure, allocation-free `sample(progress, out)` from the table:

- smootherstep chapter weights (half-width 0.06)
- weight-blended fx
- monotone-cubic OKLCH
- arc-length camera curves
- text windows

`check-continuity.ts` adds a site-specific **cave containment** test. The camera must stay within 75% of the safe radius around the centreline, from the mouth onward. The worst case measured was 59%.

## How to add a chapter

1. Add the chapter to `chapters`. If the cave needs to grow, extend `CAVE.points` and `CAVE.radius` together.
2. Run `npm run check:continuity`. It checks jumps and that the camera stays inside the cave.
3. Add a poster motif in `src/App.tsx`.

## Quality tiers

| Tier | DPR cap | Wall rings × segments | Prisms | Octahedra | Dust | Hero crystals | Post FX |
|---|---|---|---|---|---|---|---|
| high | 2 | 460 × 72 | 3,200 | 900 | 5,000 | MeshTransmissionMaterial, 6 samples, 512² | full |
| mid | 1.5 | 360 × 72 | 1,900 | 550 | 3,000 | MeshTransmissionMaterial, 3 samples, 256² | bloom, ACES, vignette |
| low | 1 | 260 × 48 | 900 | 260 | 1,500 | MeshStandardMaterial fallback | none |

Crystal lists are shuffled, so a lower `InstancedMesh.count` thins every cluster evenly. Adaptive tiering, `AdaptiveDpr`, hidden-tab pause, disposal on unmount and the lazy-loaded 3D chunk all work as in flow-01.

## Fallbacks and accessibility

Same as flow-01:

- **Poster mode**: gradient plus SVG crystal clusters per chapter. Used for no WebGL2, context loss, scene errors or reduced motion.
- **Calm mode** toggle.
- Real DOM text and headings, and an `aria-hidden` canvas.
- Skip link and visible focus.
- Native scrolling: keyboard and anchors.
- `?debug` panel.

The glitter on the rock changes only when the camera moves. Glows breathe slower than 0.2 Hz, so nothing flashes.

## Test results (run in this session)

**`npm run check:continuity`**: PASS.
- Cave containment: at worst **59%** of the safe radius (limit 75%).
- Closest quantities: look-at 83% of its limit, palette (crystal colour at the geode handover) 73%, camera position 69%.
- The check caught one camera turn that was too fast in the amethyst chamber (1.36°/step against a 1° limit). It was fixed by moving the look-at key.

**`npm run check:contrast`**: PASS. Worst case **8.56:1** (accent at p = 0.24). The scrim (alpha 0.88) was composited over both black and white.

| progress | chapter | text on scrim | accent on scrim |
|---:|---|---:|---:|
| 0.00 | mouth | 12.86 | 8.63 |
| 0.20 | mouth | 13.04 | 8.66 |
| 0.30 | quartz | 12.94 | 8.64 |
| 0.45 | quartz | 12.98 | 8.63 |
| 0.50 | amethyst | 12.83 | 9.09 |
| 0.70 | amethyst | 12.70 | 9.11 |
| 0.75 | geode | 12.81 | 8.89 |
| 1.00 | geode | 12.84 | 8.83 |

**`npm run build`**: PASS.

| Chunk | Size (gzip) | Loaded |
|---|---:|---|
| index.js | 11.3 KB | eagerly |
| vendor.js | 121.6 KB | eagerly |
| CSS | 3.2 KB | eagerly |
| Experience.js | 7.6 KB | lazily |
| r3f.js (now includes MeshTransmissionMaterial) | 85.1 KB | lazily |
| three.js | 193.9 KB | lazily |

**`npm run check:smoke`**: PASS. Headless Chromium (Playwright build 1243) with SwiftShader:
- The canvas was non-blank at progress 0…1.0 on desktop (`?tier=high`, so MeshTransmissionMaterial was active in the geode) and on phone (auto → low, standard-material fallback). Luminance SD ranged 13–63.
- No console errors.
- PageDown, Space, ArrowDown, End and Home all work.
- The rail link `#amethyst` lands in the chamber.
- Calm toggle works, and the reduced-motion poster mode works.
- The `?debug` panel only appears with the flag. It reported 5 draw calls on the low tier at the mouth.
- axe-core 4.14: **0 violations** in scene and in poster mode.

**Real-GPU frame rates were NOT measured.**

## Known issues

- Real-GPU performance is **not measured**: headless runs use SwiftShader. MeshTransmissionMaterial renders the scene once more per frame on mid and high tiers, which is the most expensive part of this site.
- Without an environment map, the hero crystals read mostly through what they refract (the crystal field behind them) rather than through reflections.
- The wall closes at the far pole of the geode, and a tiny dark point can be visible there.
- Intermediate commits 1 and 2 are a file-level split. Only the final commit was built and tested as a whole.

## Skills and decisions

Skills loaded and read in this session:

- **r3f-fundamentals, r3f-shaders, r3f-postprocessing, r3f-animation, r3f-best-practices**
- **drei** (TerminalSkills; for `MeshTransmissionMaterial` usage)
- **motion-system**
- the bOpen **shaders** skill

**Not available** in this session: three-best-practices, color-expert. Neither is claimed as used.

Assumptions:

- The hue path in the brief (300 → 350 → 190 → 80) is applied in chapter order to the *light*. Crystal bodies keep mineral colours, so the "amethyst chamber" stays violet under teal light rather than turning teal.
- The site could not get its own GitHub repository from this cloud session, so it lives in `flow-sites/` of the session repository. See `../split-into-repos.sh`.
