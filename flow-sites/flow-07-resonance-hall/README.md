# Resonance Hall: flow-07

A scroll-driven 3D site for **Resonance Hall**, a fictional sound-art venue. It is one landscape of sound with one camera gliding over it and no scene cuts: **Silence → Bass hills → Midrange ridges → Treble shimmer**. Optional generative music is synthesised live in the browser.

> Resonance Hall, its people, copy and data are fictional. The seat form is a demo: nothing is sent, and the address is `listen@example.com`. The music is an original algorithmic piece built from Web Audio oscillators, filters and noise. It uses no samples, no recordings and no existing music.

```bash
npm install
npm run dev        # ?debug for the debug panel, ?tier=low|mid|high to force a tier
npm run verify     # continuity (+ clearance) + contrast + build + smoke test + audio check
```

## Concept

| Chapter | Progress | Landscape (precomputed) | Music mix (only if you press Play) |
|---|---|---|---|
| Silence | 0–0.15 | a nearly still plain | quiet drone |
| Bass hills | 0.15–0.40 | broad, slow fbm hills | drone + breathing sub bass (E1, 0.12 Hz swell) |
| Midrange ridges | 0.40–0.70 | sharp ridged noise | + detuned saw pad (A2 · E3 · C#4 · E4) through a slowly sweeping band-pass |
| Treble shimmer | 0.70–1.0 | fine ripples, floating motes | + sparse A-major pentatonic chimes through a feedback delay, plus high-passed noise "air" |

**The landscape** comes from a heightmap precomputed on the CPU (`src/site/world.ts`) and baked into a 256 × 900 grid on the high tier. It looks complete in silence. The shader draws:

- a dark surface with flat facets (derivative normals);
- glowing **contour lines**, whose density follows `fx.contour`;
- a faint grid;
- fog toward the palette.

**Live audio.** While sound plays, an `AnalyserNode` (FFT 512, smoothing 0.86) fills a **256 × 64 spectrogram texture**. Each frame, rows shift away from the camera and the newest spectrum sits nearest. The terrain vertex shader adds displacement from it: low frequencies in the central channel, highs toward the edges, fading with distance. The audio influence (`uAudio`) is damped in and out. When sound stops, the spectrogram decays to zero and the landscape settles back to its precomputed shape.

**Audio rules**
- The `AudioContext` is created only on the first press of **Play sound**. No autoplay.
- **Mute** and **Volume** are always visible.
- A polite live region announces the sound state.
- The music mix follows the chapter (`fx.droneLevel`, `bassLevel`, `midLevel`, `trebleLevel`) with 0.6 s smoothing.
- The site works fully without audio. Poster mode and Calm mode do not depend on it.
- **No flashing.** Audio-driven light is smoothed and capped: the glow is at most 0.3 of the accent. The motes twinkle below 1 Hz.

## Color Brief

The contour glow (the `primary` role) follows the hue path **dark plum 320 (silence) → 280 (low) → 200 (mid) → 90 (high)**. Background, fog and surface follow the same hue, much darker.

| Role | Silence | Bass | Mid | Treble |
|---|---|---|---|---|
| glow (primary) | L .76–.80, C .15, h 320 | h 285→275 | L .82, h 210→195 | L .84–.86, h 105→90 |
| background (bg) | L .08–.10, C .04 | L .10 | L .10 | L .11–.12 |
| surface (secondary) | L .28–.30, C .06, same hue | | | |
| accent (UI, audio glow) | L .86, C .12, hue + 20 (treble: 95→85) | | | |
| text / scrim | L .97 / L .17 | | | |

## How `sceneState(progress)` works

The engine is the same as in the other flow sites (`src/engine`). The single data table is `src/site/chapters.ts`. It holds:
- the copy;
- the `fx` values: `lineGlow`, `contour`, `grid`, `shimmer`, `audioGain` and the four music levels, plus the base effects;
- the OKLCH palette keys;
- the camera keys.

`createFlow()` builds a pure, allocation-free `sample(progress, out)`.

The music mixer reads the same `engine.state.fx` ten times a second, so the sound flows with the scroll exactly like the colour does.

`check-continuity.ts` adds a site-specific terrain-clearance check, using the same `heightAt()` that built the mesh. Minimum clearance is **5.5 units**.

## How to add a chapter

1. Add an entry to `chapters` with every `SoundFx` key.
2. If the landscape needs a new region, extend `REGIONS` and `regionWeights()` in `world.ts`.
3. If the music needs a new voice, add it in `audio.ts` with its own bus gain driven from `setMix`.
4. Add a poster motif in `src/App.tsx`.
5. Run `npm run check:continuity` and `npm run check:contrast`.

## Quality tiers

| Tier | DPR cap | Terrain grid | Motes | Post FX |
|---|---|---|---|---|
| high | 2 | 256 × 900 | 4,000 | bloom, chromatic aberration, ACES, vignette, grain |
| mid | 1.5 | 192 × 680 | 2,500 | bloom, ACES, vignette |
| low | 1 | 128 × 450 | 1,200 | none |

The main scene uses 3 draw calls: sky, landscape and motes. The spectrogram upload is 16 KB per frame, and only while sound plays or decays. Tier adaptation, `AdaptiveDpr`, the hidden-tab pause, disposal and the lazy-loaded 3D chunk all work as in flow-01. The audio scheduler runs only while playing, and the context is suspended after Stop.

## Fallbacks and accessibility

These are the same as in flow-01:
- poster mode, with sine-ridge SVGs per chapter;
- the Calm mode toggle;
- real DOM text and headings;
- an `aria-hidden` canvas;
- a skip link and visible focus;
- native keyboard scrolling;
- the `?debug` panel.

The sound controls are real buttons with `aria-pressed`, the volume is a labelled range input, and the touch targets are at least 40 px.

## Test results (run in this session)

**`npm run check:continuity`: PASS.** Terrain clearance is at least **5.5 units**. The tightest values were the text windows at 54% of their limit, and camera position and look-at at 43%.

**`npm run check:contrast`: PASS.** The worst case is **8.82:1**, for the accent at p = 0.16. The scrim has alpha 0.88 and was composited over both black and white.

| progress | chapter | text on scrim | accent on scrim |
|---:|---|---:|---:|
| 0.00 | silence | 13.02 | 8.91 |
| 0.15 | silence | 13.04 | 8.92 |
| 0.30 | bass | 12.88 | 9.03 |
| 0.50 | mid | 12.73 | 9.24 |
| 0.70 | mid | 12.74 | 9.46 |
| 0.80 | treble | 12.68 | 9.07 |
| 1.00 | treble | 12.88 | 9.13 |

**`npm run build`: PASS.**

| Chunk | gzip | Loaded |
|---|---:|---|
| index.js (includes the audio engine) | 13.1 KB | eagerly |
| vendor.js | 121.6 KB | eagerly |
| CSS | 3.4 KB | eagerly |
| Experience.js | 4.9 KB | lazily |
| r3f.js | 80.8 KB | lazily |
| three.js | 192.8 KB | lazily |

**`npm run check:smoke`: PASS.** Headless Chromium (Playwright build 1243) with SwiftShader.

- The canvas was non-blank at progress 0…1.0, on desktop (`?tier=high`) and on phone (auto, which picked low). Luminance SD was 15–30.
- No console errors.
- Keyboard scrolling works.
- The rail link `#mid` lands in the midrange chapter.
- The Calm toggle and the reduced-motion poster mode both work.
- The `?debug` panel only appears with the flag. It reported 3 draw calls on the low tier.
- axe-core 4.14 found **0 violations** in scene and poster mode. The first run reported one moderate `region` issue: the sound controls were outside a landmark. They are now an `<aside aria-label="Sound controls">`.

**`npm run check:audio`: PASS.**

- No `AudioContext` exists before a click.
- After **Play sound**, the context is `running` and the analyser receives signal (spectrum sum about 20,500 out of a possible 65,280).
- **Mute** toggles, with `aria-pressed="true"`.
- **Stop** stops playback and suspends the context.
- No page errors.
- `screenshots/audio-playing.png` shows the live displacement.

**Real-GPU frame rates were NOT measured. The music was not listened to.**

## Known issues

- Real-GPU performance is **not measured**: headless runs use SwiftShader.
- The music was verified to run and reach the analyser in headless Chromium. **It was not listened to**, so its musical quality and loudness balance on real speakers are unverified.
- The landscape is a single-sided strip. Its far edges are hidden by fog and the rising rim, not modelled.
- Intermediate commits 1 and 2 are a file-level split. Only the final commit was built and tested as a whole.

## Skills and decisions

**Loaded and read in this session:** r3f-fundamentals, r3f-shaders, r3f-postprocessing, r3f-animation, r3f-best-practices, motion-system, and the bOpen shaders skill.

**Not available in this session:** shadertoy, web-shaders, scroll-experience, color-expert and accesslint. None of these are claimed as used. axe-core was run in the smoke test instead of accesslint.

The site could not get its own GitHub repository from this cloud session, so it lives in `flow-sites/` of the session repository. See `../split-into-repos.sh`.
