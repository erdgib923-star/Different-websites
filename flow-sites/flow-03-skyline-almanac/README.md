# Skyline Almanac: flow-03

A scroll-driven 3D flyover for **Skyline Almanac**, a fictional city-and-weather publication. One day, one continuous camera flight, one persistent world: **Dawn peaks → Valley & clouds → City at dusk → Night lights**.

> Skyline Almanac, its people, copy and data are fictional. The subscribe form is a demo: nothing is sent, and the address is `desk@example.com`. The on-screen clock is an illustrative mapping of scroll progress to time of day.

```bash
npm install
npm run dev        # ?debug for the debug panel, ?tier=low|mid|high to force a tier
npm run verify     # continuity (+ terrain clearance) + contrast + build + headless smoke test
```

## Concept

| Chapter | Progress | Time shown | What happens |
|---|---|---|---|
| Dawn peaks | 0–0.25 | 05:40–12:30 | Low pink-gold sun behind ridged fbm peaks with snowfields. Morning haze. The camera passes through the lowest cloud layer as it drops into the valley |
| Valley & clouds | 0.25–0.5 | → 19:10 | Midday blue sky. Cumulus layers overhead, a green valley with a river, and the first buildings of the city appearing far ahead |
| City at dusk | 0.5–0.75 | → 21:40 | **Instanced buildings rise** from the centre outward (per-building delay). Amber backlight, glass reflecting the sky, the first windows lighting up |
| Night lights | 0.75–1 | → 23:50 | Indigo night with stars and moon. Every window and street light comes on (hue 85) and the camera climbs over the skyline. Subscribe call to action |

**Time of day** is a single sun direction (`fx.sunElev`, `fx.sunAz`) shared by every shader, along with sky colours and aerial perspective:

- **Sky dome**: zenith/horizon gradient, sun glow and HDR disc, plus static stars and a moon at night.
- **Terrain**: a CPU heightfield (ridged fbm peaks, rolling fbm hills, a river and a flattened city plain) with slope/height albedo (grass, rock, snow). It has sun diffuse light, hemisphere ambient, and fog toward the sky colour in the view direction, with sun in-scatter.
- **Three cloud layers**: fbm coverage with crisp edges, self-shadowing toward the sun, underlit by the city at night. Layers fade near the camera so they never slice the view, and they draw far-to-near.
- **Buildings**: one `InstancedMesh` (up to 1,860 boxes). Each building's height rises in the vertex shader. A procedural window grid either reflects the sky by day or glows at night.
- **Street lights**: up to 4,494 points along the street grid, shuffled so lower tiers still cover the whole city.

## Color Brief

Hue path (the **horizon** colour, the `fog` role): **pink-gold 40 → blue 230 → amber 60 → indigo 285**. City lights (the `accent` role) stay at **hue 85**, L 0.86. Hues are written unwrapped, so each change takes a deliberate route around the wheel. For example, day blue at −130 goes back up through pink to dusk amber 60, never through green.

| Role | Dawn | Valley | Dusk | Night |
|---|---|---|---|---|
| horizon (fog) | L .80–.84, h 40–50 | L .86, h 230 | L .76→.62, h 60→45 | L .27→.24, h 285 |
| zenith (bg) | L .50–.56, h 5→340 | L .60, h 245 | L .46→.36, h 330→310 | L .16→.13, h 280 |
| sun / moon (primary) | L .92, h 55–65 | L .98, h 90 (near white) | L .86→.80, h 55→45 | L .80, h 260 (moonlight) |
| land (secondary) | L .50, h 35–60 | L .55, h 130–140 (green) | L .42→.33, h 50→30 | L .2, h 270 |
| lights (accent) | L .86, C .13, h 85 throughout | | | |

## How `sceneState(progress)` works

This site uses the same engine as flow-01 and flow-02 (`src/engine`). `src/site/chapters.ts` is the one table: copy, `fx` (`sunElev`, `sunAz`, `clouds`, `rise`, `lights`, `stars`, `haze` and the base effects), OKLCH keys and camera keys. `createFlow()` turns it into a pure `sample(progress, out)`:

- smootherstep chapter weights (half-width 0.07, wide enough for the city to rise across the valley-to-dusk handover);
- weight-blended `fx`;
- monotone-cubic OKLCH tracks;
- arc-length camera curves;
- text windows.

The GSAP ticker is the one clock: Lenis → ScrollTrigger → critically damped spring → `sample()` → DOM, CSS colours, clock overlay → R3F `advance()`.

`check-continuity.ts` has a site-specific addition: it asserts that the camera clears the terrain (computed by the same `heightAt()` used to build it) by at least 12 units along the whole path.

## How to add a chapter

1. Add an entry to `chapters` with its range, copy, every `SkyFx` key, palette keys (`key(at, {sky, horizon, sun, land, hue})`) and camera keys that strictly increase in global progress.
2. If the camera goes somewhere new, run `npm run check:continuity`. The clearance check catches flights into mountains.
3. Extend the `CLOCK` track and `PosterArt` in `src/App.tsx`.

## Quality tiers

| Tier | DPR cap | Terrain grid | Buildings | Street lights | Post FX |
|---|---|---|---|---|---|
| high | 2 | 300² | 1,860 | 4,494 | bloom, speed-scaled chromatic aberration, ACES, vignette, grain |
| mid | 1.5 | 240² | 1,300 | 3,000 | bloom, ACES, vignette |
| low | 1 | 180² | 800 | 1,500 | none |

Buildings are sorted by importance (tall and central first), so dropping a tier through `InstancedMesh.count` keeps the skyline. Adaptive behaviour matches flow-01: `PerformanceMonitor` steps the tier, `AdaptiveDpr` regresses during fast scrolls, rendering pauses on hidden tabs, everything is disposed on unmount, and the 3D chunk is lazy-loaded behind the HTML hero.

## Fallbacks and accessibility

These match flow-01:

- Poster mode for no WebGL2, context loss, scene errors or reduced motion. Each chapter gets its own gradient and an SVG ridge or skyline motif.
- A Calm mode toggle.
- Real DOM headings and text, and an `aria-hidden` canvas.
- A skip link and visible focus.
- Native keyboard scrolling and anchors.
- The `?debug` panel.

The clock overlay is decorative and `aria-hidden`: the time of day is also in each chapter's eyebrow. Nothing flashes: lights fade in with `fx.lights` and stars are static.

## Test results (run in this session)

**`npm run check:continuity`**: PASS.

- Terrain clearance: at least **80 units** along the whole path (limit 12).
- The tightest quantities were view direction (0.80° per step against 1.0°) and the look-at point (78% of its limit).
- The check caught one real overshoot during development (the look-at swing at the dawn → valley handover). It was fixed by moving the keys.

**`npm run check:contrast`**: PASS. Worst case **8.45:1** (accent at p = 0.28), with the scrim at alpha 0.88 composited over black and white.

| progress | chapter | text on scrim | accent on scrim |
|---:|---|---:|---:|
| 0.00 | dawn | 12.32 | 8.78 |
| 0.25 | dawn | 12.11 | 8.54 |
| 0.30 | valley | 12.12 | 8.56 |
| 0.50 | valley | 12.01 | 8.45 |
| 0.60 | dusk | 12.30 | 8.71 |
| 0.75 | dusk | 12.04 | 8.52 |
| 0.80 | night | 12.22 | 8.64 |
| 1.00 | night | 12.18 | 8.66 |

**`npm run build`**: PASS.

| Chunk | gzip | Loaded |
|---|---:|---|
| index.js | 11.6 KB | eagerly |
| vendor.js | 121.6 KB | eagerly |
| CSS | 3.2 KB | eagerly |
| Experience.js (20.2 KB raw) | 7.4 KB | lazily |
| r3f.js | 80.8 KB | lazily |
| three.js | 192.8 KB | lazily |

**`npm run check:smoke`**: PASS. Playwright's headless Chromium (build 1243) with SwiftShader.

- The canvas was non-blank at progress 0…1.0 on desktop (`?tier=high`) and on phone (auto → low), with luminance SD 29–85.
- No console errors.
- PageDown, Space, ArrowDown, End and Home all scroll.
- The rail link `#dusk` lands in the dusk chapter.
- The Calm toggle and the reduced-motion poster mode both work.
- The `?debug` panel only appears with the flag. It reported 7 draw calls on the low tier.
- axe-core 4.14: **0 violations** in scene and poster mode.

**Real-GPU frame rates were NOT measured.**

## Known issues

- Real-GPU performance is **not measured**: headless runs use SwiftShader.
- The valley chapter is the softest visually. Clouds are thin planes, not volumes, so they look best from below or at a distance.
- The city ground is a darker disc rather than modelled streets. Streets read only through the street-light grid at night.
- Buildings are plain boxes with procedural windows: no roofs, setbacks or spires.
- Intermediate commits 1 and 2 are a file-level split. Only the final commit was built and tested as a whole.

## Skills and decisions

Skills loaded and read in this session: **r3f-fundamentals, r3f-shaders, r3f-postprocessing, r3f-animation, r3f-best-practices, motion-system** and the bOpen **shaders** skill. Not available in this session: three-best-practices, web-shaders, color-expert and scroll-experience. None are claimed as used.

Assumptions:

- The hue path is carried by the horizon colour, because it dominates every frame. Zenith, sun and land colours are tuned around it.
- "Buildings rise as the city appears" uses a blend that starts late in the valley and finishes early at dusk, with each building delayed by its distance from the centre.
- The site could not get its own GitHub repository from this cloud session, so it lives in `flow-sites/` of the session repository. See `../split-into-repos.sh`.
