# Flow sites

Nine scroll-driven 3D websites. Each site is one persistent world with one continuous camera path and no scene cuts, and its palette, shapes, text and motion morph as you scroll. All brands, people, copy and data are fictional, and every visual is procedural code: no images, models, textures, HDRIs or recordings.

| # | Folder | Brand | World | Core technique |
|---|---|---|---|---|
| 1 | flow-01-lumen-drift | Lumen Drift | one stream of light: spark → stream → canyon → storm → bloom → horizon | 120k-particle single-draw morph with hash-delayed curl noise, ribbon trail, fbm sky |
| 2 | flow-02-thalassa-deep | Thalassa Deep | ocean descent, sunlit → abyss | Worley caustics, god-ray billboards, marine snow, instanced bioluminescent jellyfish |
| 3 | flow-03-skyline-almanac | Skyline Almanac | dawn-to-night flyover | fbm terrain, time-of-day sky, cloud layers, instanced buildings that rise, window lights |
| 4 | flow-04-druse-crystal-cavern | Druse | crystal cavern to heart geode | noise-carved tube cave, instanced prisms with fake dispersion, MeshTransmissionMaterial heroes |
| 5 | flow-05-inkwell-fluid-type | **Inkfold** *(renamed)* | ink drop → currents → settles into lettering | WebGL2 stable-fluids GPU simulation with a text attractor mask |
| 6 | flow-06-rootwork-seasons | Rootwork | seed to tree through four seasons | L-system tree grown by one value, instanced leaves that fall, snow |
| 7 | flow-07-resonance-hall | Resonance Hall | a landscape of sound | precomputed heightmap + live AnalyserNode spectrogram; generative Web Audio music |
| 8 | flow-08-silken-weather | Silken Weather | silk ribbons through a studio | GPU-displaced ribbons along the camera path, anisotropic sheen |
| 9 | flow-09-quicksilver-audio | **Hydrargyr Audio** *(renamed)* | liquid-metal product reveal | fullscreen ray-marched SDF morph, procedural studio reflections |

**Renames** came from a quick web check. *Inkwell* is a well-known Hoefler&Co. typeface, in the same category as a type studio. *Quicksilver Audio* is a real hi-fi amplifier maker. Folder names stay as specified, and each site's README explains its rename.

## Running a site

```bash
cd flow-sites/<site>
npm install
npm run dev       # add ?debug for the debug panel, ?tier=low|mid|high to force a tier
npm run verify    # continuity + contrast + build + headless smoke test (+ audio check on flow-07)
```

## Shared flow engine (`src/engine/` in every site)

The engine was built in flow-01, then copied and adapted for the other sites.

- **Scroll and timing.** Lenis smooths native scrolling over a tall container (900vh on desktop, 700vh on phones) and never hijacks it. ScrollTrigger measures that container, and a critically damped spring turns the scroll position into `progress` and `velocity`. These values sit in a zustand store as a mutable `motion` object, read with `getState()`, so React never re-renders per frame.
- **One data table per site.** `sceneState(progress)` is pure and allocation-free. It cross-fades the chapters with smootherstep, interpolates the OKLCH palette with monotone cubics, and drives arc-length Catmull-Rom curves for both the camera position and the look-at point. It also produces the text windows.
- **One clock.** The GSAP ticker drives the DOM choreography, the CSS colour variables and R3F `advance()`, so every part of the page sees the same progress in the same frame.
- **Palette in OKLCH.** Colours are bounded and gamut-mapped. They reach shaders as linear sRGB and reach CSS as 8-bit sRGB through custom properties.
- **Post-processing:** bloom, chromatic aberration scaled by scroll speed, ACES tone mapping, vignette and grain.
- **Quality tiers.** The starting tier (high, mid or low) comes from hardware hints and then adapts to measured FPS through PerformanceMonitor. Each tier sets a DPR cap, and AdaptiveDpr also applies.
- **Efficiency.** Rendering pauses on hidden tabs, everything is disposed on unmount, and the 3D chunk is lazy-loaded behind an HTML hero with a progress-bar preloader.
- **Poster mode** is used when WebGL2 is missing, after context loss, on a scene error, or under reduced motion. The Calm mode toggle switches it on at runtime.
- **Accessibility:** real DOM headings and text, an `aria-hidden` canvas, a skip link and visible focus. A `?debug` panel is available.

## One private repository per site

These sites were built in a cloud session that could not create GitHub repositories: `gh` was not authenticated, and the session was scoped to this repository. They therefore live here as folders. Each folder's history contains only its own commits:

1. `feat: engine and core scene`
2. `feat: chapters, color flow, DOM choreography`
3. `fix: performance, accessibility and polish`

flow-06 has one extra README fix.

To turn every folder into its own **private** repository with that history, run this on a machine where `gh auth status` succeeds:

```bash
bash flow-sites/split-into-repos.sh --dry-run   # builds split/<site> branches, pushes nothing
bash flow-sites/split-into-repos.sh             # creates 9 private repos, pushes each as main
```

The script never enables GitHub Pages and skips any repository name that already exists.

## What was and was not verified

Every site's `npm run verify` passed in this session:

- continuity sampled every 0.0005 of progress, plus site-specific camera checks;
- WCAG contrast of at least 4.5:1, with the worst case composited over both black and white;
- the production build;
- a headless smoke test covering:
  - screenshots at progress 0–1.0 on desktop and at 390 px, with a non-blank canvas check;
  - console errors;
  - keyboard and anchor scrolling;
  - Calm and poster modes;
  - axe-core;
  - the `?debug` flag.

These checks ran in headless Chromium with **SwiftShader** (CPU rendering). **Frame rates on real GPUs were not measured.** The music on flow-07 was confirmed to reach the analyser, but nobody listened to it. Each README lists its known issues.
