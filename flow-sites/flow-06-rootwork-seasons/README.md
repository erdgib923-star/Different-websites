# Rootwork: flow-06

A scroll-driven 3D year for **Rootwork**, a fictional regenerative-forestry nonprofit. The site has one meadow, one tree and one rising camera, with no scene cuts: **Seed → Sapling (spring) → Summer canopy → Autumn into winter**.

> Rootwork, its people, copy and data are fictional. The reports form is a demo: nothing is sent, no donation is taken, and the address is `grow@example.com`.

```bash
npm install
npm run dev        # ?debug for the debug panel, ?tier=low|mid|high to force a tier
npm run verify     # continuity + contrast + build + headless smoke test
```

## Concept

| Chapter | Progress | What happens |
|---|---|---|
| Seed | 0–0.15 | A seed on bare soil, filmed close to the ground |
| Sapling | 0.15–0.40 | The L-system tree grows: trunk first, then branches that each start exactly when their parent finishes. The first spring leaves unfold. The camera rises with it |
| Summer canopy | 0.40–0.65 | A full crown of green and gold leaves sways in the wind |
| Autumn into winter | 0.65–1.0 | The crown turns orange, then red. Leaves detach one by one, spiral down and land flat on the meadow, and more leaves blow through the air. Snow then starts, settles on the meadow and on the tops of branches, and the fallen leaves decay under it |

The tree is built in `src/site/tree.ts`. It is a real **L-system**: first string rewriting, then a 3D turtle interprets the result.

- **Axiom:** `FFA`
- **Rule:** `A → F[&A]/[&A]/[&A]^A`
- **Symbols:** `F` forward, `A` bud, `[ ]` push and pop, `&`/`^` pitch, `/` roll by the golden angle (137.5°). Every symbol gets seeded angle jitter, and an upward tropism bends each segment toward the light.
- **Size:** 6 iterations (high and mid tiers) give 1,367 branch segments and 4,096 buds. 5 iterations (low tier) give 343 segments.

**Growth.** Every segment's birth time comes from its path distance to the root. One `growth` value from sceneState then grows the whole tree continuously. In the vertex shader, the segment length scales with `clamp((growth − birth) / duration)`, and the thickness grows with overall growth.

**What is drawn**

- **Branches:** one instanced cylinder mesh (one draw call). Normals are corrected for non-uniform instance scale with the inverse transpose.
- **Leaves:** one instanced quad mesh, also one draw call: 12,288 leaves on high, 8,192 on mid, 2,048 on low.
  - Leaf shape comes from an alpha cut in the shader.
  - Colour is the season's OKLCH leaf colour mixed with the accent, with per-leaf variation.
  - Each leaf has its own fall moment. Once it falls, it spirals down and lands flat on the meadow.
- **Weather:** one points draw for the falling leaves and the snow together.
- **Shared wind:** a single wind function moves branches and attached leaves identically.

## Color Brief

The leaf colour (`primary`) follows the hue path **spring green 140 → summer green 150 (with gold 95 in the accent) → autumn 55 → 30 → winter blue-grey 250**. In winter the leaf colour fades to frost, L 0.82 and C 0.03.

| Role | Seed / Sapling | Summer | Autumn | Winter |
|---|---|---|---|---|
| leaf (primary) | L .72–.74, C .14–.15, h 140 | L .56–.58, h 150→145 | L .66→.60, C .16–.17, h 55→30 | L .82, C .03, h 250 |
| ground (secondary) | L .46–.52, h 95→130 | L .50–.52, h 135→115 | L .50→.45, h 75→50 | L .92 (snow), h 250 |
| accent (UI, leaf variation) | L .86, h 140 | **gold 95** | h 60→40 | h 250 |
| sky (bg) / haze (fog) | h 210–220 / 150–160 | h 228–232 / 120→100 | h 70→45 | h 250 / 245 |
| text / scrim | L .97 / L .20, hue following the season | | | |

## How `sceneState(progress)` works

This site uses the same engine as the other flow sites (`src/engine`). The one table is `src/site/chapters.ts`. It holds:

- copy;
- `fx` values: `growth`, `foliage`, `fall`, `flyingLeaves`, `snow`, `snowCover`, `wind` and `sun`, plus the base effects;
- OKLCH keys;
- camera keys (the camera rises from 0.45 to 8.6 units as the tree grows).

`createFlow()` builds a pure, allocation-free `sample(progress, out)` from this table.

**Site-specific addition.** The last chapter spans a whole change of season. `flow.sample` is therefore wrapped by `stageSeasons()`, which stages `fall`, `flyingLeaves`, `snow` and `snowCover` by that chapter's own local progress, using smootherstep windows. These values remain a pure, continuous function of progress. The continuity test samples the wrapped function, so it checks them too. The worst result was `fx.flyingLeaves` at 58% of its limit.

## How to add a chapter

1. Add an entry to `chapters` with every `RootFx` key. If it needs intra-chapter staging, extend `stageSeasons()` and keep using `local[i]` with smootherstep.
2. Add a poster motif in `src/App.tsx`. The SVG tree there is recursive and takes a depth per chapter.
3. Run `npm run check:continuity` and `npm run check:contrast`.

## Quality tiers

| Tier | DPR cap | L-system iterations | Leaves | Weather points | Post FX |
|---|---|---|---|---|---|
| high | 2 | 6 (1,367 segments) | 12,288 | 7,000 | bloom, chromatic aberration, ACES, vignette, grain |
| mid | 1.5 | 6 | 8,192 | 4,500 | bloom, ACES, vignette |
| low | 1 | 5 (343 segments) | 2,048 | 2,000 | none |

Leaves are shuffled, so adaptive downgrades (fewer instances drawn) thin the crown evenly. Main-scene draw calls: 6 on the low tier as measured (sky, ground, branches, leaves, seed, weather), plus the composer passes on mid and high. Tier adaptation, `AdaptiveDpr`, the hidden-tab pause, disposal and the lazily loaded 3D chunk all work the same as in flow-01.

## Fallbacks and accessibility

These work the same as in flow-01:

- Poster mode, with a recursive SVG tree per chapter. It is used when WebGL2 is missing, after context loss, on a scene error, or under reduced motion.
- A Calm mode toggle.
- Real DOM text and headings, and an `aria-hidden` canvas.
- A skip link and visible focus.
- Native keyboard scrolling.
- The `?debug` panel.

Wind, falling leaves and snow all move slowly, and nothing flashes.

## Test results (run in this session)

**`npm run check:continuity`**: PASS. The worst values were the look-at at 76% of its limit, camera position at 61%, and the staged `fx.flyingLeaves` at 58%. The first draft failed on the look-at, because the look-at heights jumped between sapling and summer. I fixed it by evening out the keys; the test was not loosened.

**`npm run check:contrast`**: PASS. The worst case was **8.25:1** (accent at p = 0.76). The scrim, at alpha 0.88, was composited over both black and white.

| progress | chapter | text on scrim | accent on scrim |
|---:|---|---:|---:|
| 0.00 | seed | 11.71 | 8.67 |
| 0.20 | sapling | 11.71 | 8.67 |
| 0.40 | sapling | 11.77 | 8.46 |
| 0.50 | summer | 11.83 | 8.38 |
| 0.65 | summer | 11.77 | 8.30 |
| 0.80 | autumn | 11.88 | 8.26 |
| 0.90 | autumn | 11.91 | 8.71 |
| 1.00 | autumn | 11.81 | 8.47 |

**`npm run build`**: PASS. Sizes are gzipped.

| Chunk | gzip | Loaded |
|---|---:|---|
| index.js | 11.3 KB | eagerly |
| vendor.js | 121.6 KB | eagerly |
| CSS | 3.2 KB | eagerly |
| Experience.js | 7.8 KB | lazily |
| r3f.js | 80.8 KB | lazily |
| three.js | 192.8 KB | lazily |

**`npm run check:smoke`**: PASS. This runs headless Chromium (Playwright build 1243) with SwiftShader.

- **Canvas:** non-blank at progress 0…1.0 on desktop (`?tier=high`) and on phone (auto, which picked low). Luminance SD was 18–63.
- **Console:** no errors.
- **Keyboard and links:** keyboard scrolling works, and the rail anchor lands in the right chapter.
- **Calm and reduced motion:** the Calm toggle works, and reduced motion switches to poster mode.
- **`?debug`:** the panel appears only with the flag. It reported 6 draw calls at the seed on the low tier.
- **axe-core 4.14:** **0 violations** in scene mode and in poster mode.

Two visual bugs were found from screenshots and fixed. The bark albedo was given in the wrong colour space, so it rendered too pale. Branch normals were skewed by the non-uniform instance scale, which turned the winter trunk white.

**Real-GPU frame rates were NOT measured.**

## Known issues

- Real-GPU performance has **not been measured**: headless runs use SwiftShader.
- Branches are simple tapered cylinders, so joints are visible up close.
- Leaves are flat alpha-cut quads, which gives a deliberately stylised look.
- Scrolling backwards un-falls the leaves, because falling is a function of progress. That is consistent, but not physical.
- Intermediate commits 1 and 2 are a file-level split. Only the final commit was built and tested as a whole.

## Skills and decisions

**Skills loaded and read in this session:** r3f-fundamentals, r3f-shaders, r3f-postprocessing, r3f-animation, r3f-best-practices, motion-system, and the bOpen shaders skill.

**Not available in this session:** p5js, color-expert and scroll-experience. None of these are claimed as used. The L-system follows the standard bracketed-turtle formalism and is my own implementation.

**Assumptions.** The fall of individual leaves is tied to progress, not time, so the whole scene stays scrubbable. The ambient leaves and snow blowing through the air are time-animated loops, whose amount comes from progress.

The site could not get its own GitHub repository from this cloud session, so it lives in `flow-sites/` of the session repository. See `../split-into-repos.sh`.
