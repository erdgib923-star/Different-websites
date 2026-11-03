# Echoes of Static: album microsite for *Low Orbit Radio*

> **Everything here is fictional.**
>
> - **The band and album.** Echoes of Static, the album *Low Orbit Radio*, its six tracks, the track lengths and the tour (cities, venues and dates) are invented. The tour dates are labelled "Sample date" on the page. Contact uses `band@example.com` and `555-0100`.
> - **Name check.** A web search found no band called "Echoes of Static" and no album called "Low Orbit Radio". The nearest real names are *Echo-static* (Madison, WI) and the Toronto band *Low Orbit*. Neither matches, so the names were kept.
> - **The music** is **generated live by code** (Web Audio oscillators and noise). There are no samples, recordings, lyrics or copyrighted melodies. The progressions and patterns were written for this demo.

Built with **Vite 8, TypeScript, GSAP 3.15 (ScrollTrigger + SplitText), Lenis and the Web Audio API**. There are no audio files and no audio libraries.

## Concept and design direction

1. **Six tracks, six colours.** Each song has a hue, 60° apart, at identical OKLCH lightness and chroma. The whole page drifts between them as you scroll.
2. **Sound is opt-in.** Nothing makes noise until you press play. A persistent player bar has play/pause, prev/next, mute, volume and a "Follow scroll" switch.
3. **Scroll is the tracklist.** With *Follow scroll* on, the chapter in view becomes the current track, and audio crossfades to it over 0.6 s while playing.
4. **A visualizer, not a strobe.** A ring of radial bars and a waveform sits behind the page. A soft glow changes **size**, never brightness, with the music.
5. **Poster typography.** Condensed Big Shoulders Display for headlines over Azeret Mono body text, like a gig poster or radio dial.

## Color Brief

| | |
|---|---|
| **Mood** | Late-night radio: dark, warm static, one saturated colour per song |
| **Hue anchors** | Track hues h 20 · 80 · 140 · 200 · 260 · 320. Neutral ramp tinted to h 20 (chroma 0.012). |
| **Harmony** | Hexadic, at equal **L** and **C**. Background `L 17% C 0.035`, card `L 23.5% C 0.045`, accent `L 80% C 0.13`, muted `L 80% C 0.025`. Only the hue changes, so every contrast ratio is essentially the same for every track. |
| **60 / 30 / 10** | 60% the dark track background · 30% the track surface (cards and player) plus off-white text · 10% the track accent (play buttons, numbers, links, visualizer) |

**Deliberate deviation.** The general brief allows one accent hue beyond the brand hue. This concept is *one hue per song*, so the six hues take that role, but **only one is on screen at a time**. Between tracks the hue is interpolated along the shortest path round the hue circle. The track number is always shown in text, so no meaning depends on colour alone.

**Tokens:**

- `scripts/palette.config.mjs` → `src/styles/tokens.css`. It produces an 11-step neutral ramp and an 11-step brand ramp (h 20), plus a `t1…t6` set (`bg`, `surface`, `accent`, `muted`) for each track. The contrast script checks every one.
- The live page derives the same colours from a single CSS variable, `--h`:
  - `oklch(17% 0.035 var(--h))` and similar, inside `@supports (color: oklch(0% 0 0))`.
  - Hex fallbacks are track 1's colours; the swatches each fall back to their own track's hex.
- `--signal-hi` is a display-P3 accent under `@media (color-gamut: p3)`.
- Semantic tokens: `bg`, `surface`, `text`, `text-muted`, `border`, `border-strong`, `accent`, `accent-contrast`, `focus`.

**Rendering:**

- **Gradients:** the cover art uses `radial-gradient(… in oklch …)`.
- **Shadows** are hue-tinted (`oklch(10% 0.04 var(--h) / 0.7)`), never black.
- **Grain:** an SVG-noise layer sits over the page at 10% overlay.
- **Data colours:** not applicable; there are no charts.

### Contrast results (`npm run contrast`)

All 49 pairs pass. Every track is checked separately.

| Pair | Foreground | Background | Ratio | Target | Result |
|---|---|---|---|---|---|
| Track 1 (h 20) · text on page | `--neutral-50` #fdf2f2 | `--t1-bg` #1c0909 | 17.57:1 | 4.5:1 | pass |
| Track 1 · muted text on page | `--t1-muted` #ceb8b7 | `--t1-bg` #1c0909 | 10.20:1 | 4.5:1 | pass |
| Track 1 · accent text on page | `--t1-accent` #ff9f9f | `--t1-bg` #1c0909 | 9.83:1 | 4.5:1 | pass |
| Track 1 · text on card | `--neutral-50` #fdf2f2 | `--t1-surface` #301515 | 15.44:1 | 4.5:1 | pass |
| Track 1 · muted on card | `--t1-muted` #ceb8b7 | `--t1-surface` #301515 | 8.96:1 | 4.5:1 | pass |
| Track 1 · label on accent button | `--neutral-950` #0c0606 | `--t1-accent` #ff9f9f | 10.29:1 | 4.5:1 | pass |
| Track 1 · accent text on card / player | `--t1-accent` #ff9f9f | `--t1-surface` #301515 | 8.63:1 | 4.5:1 | pass |
| Track 1 · control outline on player (UI) | `--neutral-400` #928887 | `--t1-surface` #301515 | 4.88:1 | 3:1 | pass |
| Track 2 (h 80) · text on page | `--neutral-50` #fdf2f2 | `--t2-bg` #170d00 | 17.49:1 | 4.5:1 | pass |
| Track 2 · muted text on page | `--t2-muted` #c6bcac | `--t2-bg` #170d00 | 10.24:1 | 4.5:1 | pass |
| Track 2 · accent text on page | `--t2-accent` #e9b452 | `--t2-bg` #170d00 | 10.13:1 | 4.5:1 | pass |
| Track 2 · text on card | `--neutral-50` #fdf2f2 | `--t2-surface` #291b02 | 15.28:1 | 4.5:1 | pass |
| Track 2 · muted on card | `--t2-muted` #c6bcac | `--t2-surface` #291b02 | 8.95:1 | 4.5:1 | pass |
| Track 2 · label on accent button | `--neutral-950` #0c0606 | `--t2-accent` #e9b452 | 10.65:1 | 4.5:1 | pass |
| Track 2 · accent text on card / player | `--t2-accent` #e9b452 | `--t2-surface` #291b02 | 8.85:1 | 4.5:1 | pass |
| Track 2 · control outline on player (UI) | `--neutral-400` #928887 | `--t2-surface` #291b02 | 4.83:1 | 3:1 | pass |
| Track 3 (h 140) · text on page | `--neutral-50` #fdf2f2 | `--t3-bg` #071305 | 17.37:1 | 4.5:1 | pass |
| Track 3 · muted text on page | `--t3-muted` #b6c2b3 | `--t3-bg` #071305 | 10.27:1 | 4.5:1 | pass |
| Track 3 · accent text on page | `--t3-accent` #90d281 | `--t3-bg` #071305 | 10.63:1 | 4.5:1 | pass |
| Track 3 · text on card | `--neutral-50` #fdf2f2 | `--t3-surface` #12230e | 15.05:1 | 4.5:1 | pass |
| Track 3 · muted on card | `--t3-muted` #b6c2b3 | `--t3-surface` #12230e | 8.90:1 | 4.5:1 | pass |
| Track 3 · label on accent button | `--neutral-950` #0c0606 | `--t3-accent` #90d281 | 11.26:1 | 4.5:1 | pass |
| Track 3 · accent text on card / player | `--t3-accent` #90d281 | `--t3-surface` #12230e | 9.21:1 | 4.5:1 | pass |
| Track 3 · control outline on player (UI) | `--neutral-400` #928887 | `--t3-surface` #12230e | 4.76:1 | 3:1 | pass |
| Track 4 (h 200) · text on page | `--neutral-50` #fdf2f2 | `--t4-bg` #001314 | 17.37:1 | 4.5:1 | pass |
| Track 4 · muted text on page | `--t4-muted` #acc3c4 | `--t4-bg` #001314 | 10.28:1 | 4.5:1 | pass |
| Track 4 · accent text on page | `--t4-accent` #28d6df | `--t4-bg` #001314 | 10.69:1 | 4.5:1 | pass |
| Track 4 · text on card | `--neutral-50` #fdf2f2 | `--t4-surface` #002425 | 15.04:1 | 4.5:1 | pass |
| Track 4 · muted on card | `--t4-muted` #acc3c4 | `--t4-surface` #002425 | 8.90:1 | 4.5:1 | pass |
| Track 4 · label on accent button | `--neutral-950` #0c0606 | `--t4-accent` #28d6df | 11.32:1 | 4.5:1 | pass |
| Track 4 · accent text on card / player | `--t4-accent` #28d6df | `--t4-surface` #002425 | 9.26:1 | 4.5:1 | pass |
| Track 4 · control outline on player (UI) | `--neutral-400` #928887 | `--t4-surface` #002425 | 4.76:1 | 3:1 | pass |
| Track 5 (h 260) · text on page | `--neutral-50` #fdf2f2 | `--t5-bg` #060f1e | 17.48:1 | 4.5:1 | pass |
| Track 5 · muted text on page | `--t5-muted` #b5bece | `--t5-bg` #060f1e | 10.25:1 | 4.5:1 | pass |
| Track 5 · accent text on page | `--t5-accent` #98bfff | `--t5-bg` #060f1e | 10.22:1 | 4.5:1 | pass |
| Track 5 · text on card | `--neutral-50` #fdf2f2 | `--t5-surface` #111e33 | 15.25:1 | 4.5:1 | pass |
| Track 5 · muted on card | `--t5-muted` #b5bece | `--t5-surface` #111e33 | 8.94:1 | 4.5:1 | pass |
| Track 5 · label on accent button | `--neutral-950` #0c0606 | `--t5-accent` #98bfff | 10.76:1 | 4.5:1 | pass |
| Track 5 · accent text on card / player | `--t5-accent` #98bfff | `--t5-surface` #111e33 | 8.92:1 | 4.5:1 | pass |
| Track 5 · control outline on player (UI) | `--neutral-400` #928887 | `--t5-surface` #111e33 | 4.82:1 | 3:1 | pass |
| Track 6 (h 320) · text on page | `--neutral-50` #fdf2f2 | `--t6-bg` #160a19 | 17.57:1 | 4.5:1 | pass |
| Track 6 · muted text on page | `--t6-muted` #c5b9c8 | `--t6-bg` #160a19 | 10.21:1 | 4.5:1 | pass |
| Track 6 · accent text on page | `--t6-accent` #e3a2f2 | `--t6-bg` #160a19 | 9.78:1 | 4.5:1 | pass |
| Track 6 · text on card | `--neutral-50` #fdf2f2 | `--t6-surface` #27172b | 15.43:1 | 4.5:1 | pass |
| Track 6 · muted on card | `--t6-muted` #c5b9c8 | `--t6-surface` #27172b | 8.96:1 | 4.5:1 | pass |
| Track 6 · label on accent button | `--neutral-950` #0c0606 | `--t6-accent` #e3a2f2 | 10.24:1 | 4.5:1 | pass |
| Track 6 · accent text on card / player | `--t6-accent` #e3a2f2 | `--t6-surface` #27172b | 8.59:1 | 4.5:1 | pass |
| Track 6 · control outline on player (UI) | `--neutral-400` #928887 | `--t6-surface` #27172b | 4.88:1 | 3:1 | pass |
| Hairline borders (decorative) | `--neutral-600` #605757 | `--t1-bg` #1c0909 | 2.75:1 | 1.5:1 | pass |

## Motion system

Tokens are in `src/motion.ts`:

- **Durations:** 0.4 / 0.6 / 0.8 / 1.2 s.
- **Easing:** `expo.out` / `power3`, with `back.out(2.6)` for the pop.
- **Stagger:** 75 ms.
- **Pop:** scale 0.9 → ~1.02 → 1, y 24 → 0, blur 8 → 0.

| Section | Choreography |
|---|---|
| Hero | SplitText line-masked headline intro, then fade-ups. The visualizer idles with a slow 6-second "breathing" ring. |
| Six colours | **Pinned** for 180% of the viewport and **scrubbed**. The six swatches reveal bottom-up with a clip-path while the page hue sweeps from h 20 to h 320. |
| Track chapters | Split-text titles. Cover art reveals with a **clip-path** and a 1.2 → 1 scale. **Parallax pair:** the cover drifts up (y 60 → −60 px) while the text card drifts down (−24 → 24 px). The track number pops in when the chapter becomes current. |
| Tour | The title splits and the six date rows **pop in** as a batch |
| Whole page | `--h` is updated on the GSAP ticker from the scroll position. Stops come from the pinned section and the centre of each chapter, so colour changes stay continuous. |

**Scroll:**

- Lenis runs on the GSAP ticker (`lagSmoothing(0)`).
- Anchors go through `lenis.scrollTo`, with focus moved to the target.
- `ScrollTrigger.refresh()` runs after fonts and the `load` event, and hue stops are re-measured on every refresh.

**Progressive enhancement:**

- **No JS:** all text, buttons, covers (as gradients) and tour dates are visible. Hidden start states exist only under `html.js`, and a 4-second boot fallback removes `js` if the script never runs.
- **Reduced motion:**
  - No Lenis, pin, scrub, parallax, split text or pop-ins.
  - The hue still follows scroll but is set directly.
  - The visualizer draws **one static frame** and redraws only when the hue changes; it never animates.
  - Audio still works, because the user starts it.

## Audio engine (`src/audio.ts`)

- **Start:** the `AudioContext` is created only inside a click handler (`ensure()`), so there is no autoplay. If Web Audio is missing or fails, the player shows "audio unavailable in this browser" and the page carries on.
- **Scheduler:** a look-ahead scheduler (25 ms tick, 120 ms look-ahead) plays 16-step patterns.
- **Instruments:**
  - Kick: a sine pitch drop.
  - Snare and hats: filtered noise.
  - Bass: a filtered saw.
  - Arpeggio: a pluck.
  - Chords: a pad.
  - A feedback delay sits on the arpeggio.
- **Tracks** (each with its own tempo, key, mode, chord progression and drum pattern):

| # | Track | Tempo | Key / mode |
|---|---|---|---|
| 01 | Carrier Wave | 92 | D aeolian |
| 02 | Dial Tone Bloom | 104 | F lydian |
| 03 | Night Bus Static | 84 | A aeolian |
| 04 | Glass Antenna | 120 | E dorian |
| 05 | Undertow FM | 76 | C aeolian (no hats or snare) |
| 06 | Last Broadcast | 98 | G ionian |

- **Mute** (`aria-pressed`) and volume ramp the master gain, so there are no clicks. Switching tracks crossfades over 0.6 s.

**Flash safety (WCAG 2.3.1):**

- The analyser uses `smoothingTimeConstant 0.86`, and the glow level follows it with a further slow, one-pole filter.
- The background never changes brightness, line opacity stays at or below 0.6, and nothing fills the screen.
- The glow responds to volume by changing size, not brightness.
- The hue changes only with scroll position, never with the beat.

## Run and build

```bash
npm install
npm run dev        # tokens + Vite dev server
npm run build      # tokens → tsc --noEmit → vite build
npm run preview    # serve dist/ on http://localhost:4173
npm run contrast   # WCAG check of every track colour set
```

## Swapping in photos

There are six square cover slots, one per track. See [`public/assets/README.md`](public/assets/README.md). A photo is duotoned to its track's hue automatically.

## Skills used

Loaded earlier in this session and applied here:

- **gsap-web:** the ScrollTrigger pin and scrub, SplitText masks, Lenis on the ticker, and refresh after fonts.
- **color-expert:** equal-L/C hue rotation in OKLCH, shortest-path hue interpolation, and P3 under `color-gamut`.

**Not available:**

- `frontend-design`, `taste-skill`, `impeccable`, `web-design-guidelines` and `accesslint`.
- axe-core was used in place of accesslint.

## Verification

**Build and contrast:**

- `npm run build` passes (`tsc --noEmit` strict, then `vite build`).
- `npm run contrast`: all 49 pairs pass.

**Playwright (headless Chromium):**

- **Screenshots** at 375, 768 and 1440 px, at 0/25/50/75/100% scroll, plus reduced-motion and no-JS runs.
  - No console errors, page errors, failed requests or horizontal overflow; exactly one `<h1>`.
  - Visually checked: the hue drifts per chapter, and the visualizer rings show behind the content.
- **Audio checks:**
  - No `AudioContext` exists before the first click.
  - After pressing play the context is `running` and the analyser shows signal (peak byte 255).
  - Mute sets `aria-pressed="true"`.
  - With Follow scroll on, scrolling to chapter 4 switched the player to "Glass Antenna" with `--h ≈ 186–200`.
  - Pause stops playback.

**axe-core (WCAG 2.2 AA + best practice),** with and without reduced motion:

- **0 violations.** The first run flagged the swatch labels mid-scrub: they started at opacity 0.3 and were squashed by `scaleY`. The scrub is now a bottom-up clip-path, so the labels always show at full contrast.
- axe reports "needs review" for three contrast items (text over the canvas and gradients) and three `label-content-name-mismatch` items (the ▶ ⏮ ⏭ glyph buttons, which have text labels).

**Also fixed during polish:**

- The visualizer was hidden behind the body background.
- Player outlines were moved to a 3:1 `border-strong` token.
- The player shadow is now tinted instead of black.
- A parallax pair was added.
- Each swatch has its own hex fallback.
- **Photo duotone fixed in the shared kit (all sites):**
  - The light layer used `mix-blend-mode: darken`, which only clamped the extremes and left mid-greys untinted.
  - It now uses `multiply`, so the result is `max(photo, dark) × light`.
  - Verified on this site with a generated test image in the Glass Antenna slot (`--h 200`).

## Notes and known limitations

- **Untested:** sound was only checked through the analyser in headless Chromium; nobody listened to it on speakers or headphones. Mixing levels and timbre are unverified by ear. Safari and Firefox and real phones were not tested.
- **iOS Safari** may stay silent while the ringer switch is on silent, because of how iOS handles Web Audio. This is a platform behaviour that was not tested here.
- **Repository.** This session can only push to `Different-websites`, so the site lives in `pro-sites/`. `pro-sites/split-into-repos.sh` publishes it as its own private repo.
