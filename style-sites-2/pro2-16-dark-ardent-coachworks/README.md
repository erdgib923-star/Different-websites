# Ardent Coachworks: Type One concept GT demo

> **Everything here is fictional.** Ardent Coachworks, the Type One, its specification, the twelve-car build, viewings@example.com and (555) 555-0100 are invented. No real car, brand or photo is used.

## Concept
A dark, premium launch page for a hand-built concept grand tourer:
- **Hero:**
  - An **SVG side profile** of the car (my own drawing).
  - The outline **draws in**, then the body fills.
  - A **light sweep** travels the length of the body. It is a soft gradient clipped to the body shape, one pass every 8 s with a long rest, and it pauses while the car is offscreen.
  - A "No. 01 / 12" badge pops in.
- **Coachwork:** text about hand-formed panels, with a **parallax pair** of procedural material swatches (brushed aluminium and 2×2 twill carbon fibre, drawn once on canvas).
- **The wheel:**
  - A **Three.js forged ten-spoke wheel**: the rim barrel and tyre are `LatheGeometry` profiles; the spokes, centre-lock nut, brake disc and a fixed red caliper are separate parts. It is lit by a generated `RoomEnvironment` with no image files.
  - Scrolling turns the wheel three full revolutions while the camera swings from face-on to three-quarters.
  - Three numbered callouts **pop at 15%, 42% and 70%** of the scroll.
- **Specs:**
  - **Counters** count up for power, torque, 0–100, top speed and weight.
  - A **weight-distribution bar** shows front in ice blue and rear in signal red, a colour-blind-safe pair that is also labelled in text.
- **Spec reel:** a **horizontal reel** of six systems. On wide screens it is pinned and scrubbed; on phones it is a native swipe strip with scroll-snap (keyboard-scrollable, `tabindex="0"`).
- **Viewing request:** a form with client-side validation. **Nothing is sent**, and the confirmation says so.

### Design direction
1. A car revealed in a dark studio: one light source, a lot of black.
2. Wide, heavy Syncopate capitals for presence; Manrope for calm, legible copy.
3. Red is a signal, not a theme: the tail light, the caliper, the centre-lock nut and the buttons.
4. Everything mechanical moves mechanically: rotate, swing, slide. The only bounce is a badge.
5. 8pt rhythm, 44px+ targets, sharp 2px corners.

## Color Brief
- **Mood:** precise, nocturnal, expensive, restrained.
- **Hue anchors (OKLCH):**
  - **carbon 260** (near-black base, L 0.09–0.235);
  - **brushed-metal neutrals** (steel and chrome at 250, very low chroma);
  - **signal red 25** (brand);
  - **ice blue 220** (the one accent: data labels, callout chips, the front of the weight bar, focus ring).
- **Harmony:** an achromatic base with one warm signal and one cool accent, close to complementary (25 vs 220).
- **60 / 30 / 10:** 60% carbon, 30% metal (text, outlines, wheel), 10% red and ice.
- **Neutral ramp:** tinted toward 260 (chroma 0.012) so the blacks read as carbon, not ink.
- **Buttons:** chrome text on a deeper red (`signal-deep`, L 0.50), because chrome on the brighter signal red only reaches 3.7:1. Red text on dark uses `signal-bright` (L 0.70).

All colours are OKLCH custom properties from `palette.config.mjs`:
- 11-step neutral, brand and accent ramps;
- named carbon, metal, signal and ice colours;
- semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `border-soft`, `brand`, `brand-text`, `brand-contrast`, `button-bg`, `accent`, `accent-contrast`, `focus`, `shadow-color`;
- hex fallbacks under `@supports`.

Gradients use `in oklch` (hero studio floor, wheel backdrop). The hero gradient has an SVG noise grain overlay. Shadows are tinted carbon-black.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| dark | `text` | `bg` | Body copy | Body text | 16.47:1 | 4.5:1 | Pass |
| dark | `text-muted` | `bg` | Captions, labels | Body text | 9.21:1 | 4.5:1 | Pass |
| dark | `text` | `surface-2` | Spec cards | Body text | 13.98:1 | 4.5:1 | Pass |
| dark | `text-muted` | `surface-2` | Spec card copy | Body text | 7.82:1 | 4.5:1 | Pass |
| dark | `brand-text` | `bg` | Red kickers and links | Body text | 6.78:1 | 4.5:1 | Pass |
| dark | `brand-text` | `surface-2` | Red labels on cards | Body text | 5.75:1 | 4.5:1 | Pass |
| dark | `accent` | `bg` | Ice-blue data labels | Body text | 10.76:1 | 4.5:1 | Pass |
| dark | `brand-contrast` | `button-bg` | Primary button | Body text | 5.54:1 | 4.5:1 | Pass |
| dark | `accent-contrast` | `accent` | Callout chips | Body text | 11.33:1 | 4.5:1 | Pass |
| dark | `brand` | `bg` | Red light bar, caliper, rules | UI / graphics | 4.48:1 | 3:1 | Pass |
| dark | `border` | `bg` | Input outlines | UI / graphics | 5.00:1 | 3:1 | Pass |
| dark | `focus` | `bg` | Focus ring | UI / graphics | 10.76:1 | 3:1 | Pass |

_12 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

`border-soft` (steel-3, about 2.3:1) is used only for decorative dividers and card edges. Every input and interactive outline uses `border` (5.0:1).

## Motion system
Shared tokens (0.4/0.7/1.0/1.2 s, expo and power3 easing, 75 ms stagger, pop preset with blur turned off).

| Section | Choreography |
|---|---|
| Hero | Split-chars title; the outline draws (2 s), the body fills, the badge pops at 1.3 s, then the light sweep loops slowly. |
| Coachwork | Split heading, paragraphs rise. **Parallax pair:** the two swatches drift at -0.35 and +0.4. |
| Wheel | **Pinned and scrubbed** (≥ 900px, 220% of scroll): 3 revolutions plus a 0° → 41° camera swing. **Callouts pop at 15/42/70%.** Phones get the same scrub, unpinned. |
| Specs | Staggered pop-in of the figure cells; counters run once on entry; the distribution bar rises. |
| Spec reel | **Pinned horizontal scrub** (≥ 900px) with a red progress line. Phones use native scroll-snap. |
| Page | A 2px red reading-progress line (CSS scroll timeline, GSAP fallback). |

- **Smooth scroll:** Lenis.
- **Three.js:** lazy-loaded when the wheel section is within 800px of the viewport. It renders on demand, only when the scroll changes the state, so nothing renders while idle. DPR is capped at 2.
- **Reduced motion:**
  - the wheel is a single static three-quarter render with all callouts shown;
  - no sweep, pin, parallax, counters (final values shown), progress line or smooth scroll.
- **Without WebGL or JS:** an SVG wheel stands in for the 3D one.

## Skills actually used
- `power` (bergside, loaded for this site): bold headings on black, 8pt baseline, 44px+ targets, explicit interaction states, no low-contrast text. The skill names Oswald, but the brief's Syncopate + Manrope took precedence.
- `frontend-design` and `css-animation-patterns`, loaded earlier in this session and applied again: a committed direction, view timelines and the reduced-motion pattern.
- `motion-and-interaction-system` (read manually).
- **Not available**, so not used: 3d-web-experience, threejs-webgl, gsap, epic-design, color-expert, accesslint, web-design-guidelines. The Three.js scene is my own; the audit used axe-core.

## Run and build
```bash
npm install
npm run dev
npm run build
npm run preview
npm run palette
npm run contrast
```

## Swap in your own photos
Two material slots (`workshop` 4:5, `weave` 1:1). Set `data-photo="assets/images/<file>"`. See [`public/assets/README.md`](public/assets/README.md).

## Verification (what was actually run)
- `npm run build` passes. Vite warns that the lazy `wheel` chunk (three.js) is about 567 kB minified, 143 kB gzipped; it loads only near the wheel section. `npm run contrast`: 12/12 pairs pass.
- Headless Chromium (SwiftShader WebGL) at 375, 768 and 1440 px, with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal page scroll;
  - axe-core: 0 violations;
  - reduced-motion, no-JS and `?nosda` passes: nothing left hidden.
- Probes at 1440 px:
  - at about 55% of the wheel pin, callouts 1 and 2 were on and 3 was off, and the screenshot showed the wheel rotated and seen at three-quarters;
  - the spec reel had moved -500px with its progress line at 41%;
  - submitting the form empty focused Name and showed an error; a valid submit showed the "nothing was sent" confirmation.
- Fixed before the first commit, from the first screenshots:
  - the spec grid showed a grey empty cell in its incomplete last row;
  - the phone hero had a large empty area below the car.
- **Not tested:**
  - Safari and Firefox;
  - real GPUs and phones: the Three.js frame rate was not measured on hardware;
  - screen readers;
  - touch swiping on the reel (only a programmatic scroll was tested).

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-03):
  - No company called "Ardent Coachworks" was found.
  - The nearest matches were a French car called "Ardent" (1900–1901) and a fan-written "Ardent Motors" in a video-game forum. I kept the name, with this note.
  - "Type One" is a generic model name.
- Narrow phones show only the "Viewing" link in the header, to keep tap targets at 44px; the other sections are reached by scrolling.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
