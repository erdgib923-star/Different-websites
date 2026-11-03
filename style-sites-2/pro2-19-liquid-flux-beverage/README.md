# Flux: sparkling juice with a liquid, flavour-morphing page

> **Everything here is fictional.** Flux, its four flavours, the nutrition figures, hello@example.com and (555) 555-0100 are invented. No product photos are used.

## Concept
A bright, playful launch page for a sparkling juice:
- **Metaball hero:** a WebGL fragment shader draws a cluster of liquid blobs in the brand gradient (lime → orange).
  - They drift slowly; a **cursor ball** joins the cluster and eases after the pointer (fine pointers only).
  - **Scrolling lifts the blobs** like rising bubbles.
  - Without WebGL, an **SVG goo filter** (blur + alpha threshold) merges six gradient circles into the same liquid look, and CSS floats them.
- **Flavour selector:** a native radio group of four flavours.
  - Picking one sets `--fa`/`--fb`, two **registered `@property` colours**, so every gradient on the page transitions to the new pair over 0.9 s: pills, the big can, the glass, the fallback blobs and the section wash.
  - The shader colours tween over the same 0.9 s.
  - The can label and the description update (announced via `aria-live`).
- **"From fruit to fizz":** **pinned and scrubbed**. A glass fills with the current flavour as you scroll; steps 1–3 **pop at 18%, 50% and 80%**, and bubbles rise in the glass.
- **Line-up:** four product cards **pop in staggered**, each in its own flavour gradient with an SVG can. A "New" badge pops on Cucumber Cool.
- **Facts:** counters, a labelled juice-content bar chart, and a **parallax pair** of fruit slices.

### Design direction
1. Juice in motion: everything is round, glossy and slightly wobbly.
2. One gradient does the branding; the flavour changes the gradient.
3. Unbounded, wide and bubbly, for display; Manrope for friendly, legible copy.
4. Deep green for all type, so it reads on every flavour colour.
5. Vibrant but disciplined: 2/4/8/12/16/24/32/48 spacing, 44px+ targets.

## Color Brief
- **Mood:** fresh, fizzy, sunny, playful.
- **Hue anchors (OKLCH):**
  - **lime 130** (brand) → **orange 55** (the one accent), as a gradient;
  - **deep green 160** (L 0.30) for all text;
  - a pale **citrus cream** (110) page.
- **Flavour pairs** (the brief's "flavour selector morphs the palette"):
  - Citrus lime 128 / orange 58;
  - Berry raspberry 350 / violet 305;
  - Peach 78 / 42;
  - Cucumber mint 150 / aqua 195.
  - All are kept light (L 0.78–0.90), so deep-green type passes AA on every one. Each is in the contrast table.
- **Harmony:** an analogous warm gradient anchored by a dark complementary-leaning green.
- **60 / 30 / 10:** 60% cream, 30% flavour gradient, 10% deep green (type, buttons).
- **Neutral ramp:** tinted toward 160 (chroma 0.012), so greys lean green, never blue-grey.
- **Data colours:** the juice-content bars use each flavour's own gradient. The value is always printed next to the bar and the flavour named, so colour is never the only cue.

All colours are OKLCH custom properties from `palette.config.mjs`:
- 11-step ramps;
- named cream, lime, orange, greens and `f1a`…`f4b`;
- semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `brand`, `brand-contrast`, `accent`, `accent-contrast`, `button-bg`, `button-text`, `focus`, `shadow-color`;
- hex fallbacks under `@supports`.

Gradients use `in oklch`. Shadows are tinted deep green.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| light | `text` | `bg` | Body copy | Body text | 12.66:1 | 4.5:1 | Pass |
| light | `text-muted` | `bg` | Captions | Body text | 7.79:1 | 4.5:1 | Pass |
| light | `text` | `surface-2` | Pale lime panels | Body text | 11.27:1 | 4.5:1 | Pass |
| light | `button-text` | `button-bg` | Buttons | Body text | 12.66:1 | 4.5:1 | Pass |
| light | `text` | `lime` | Text over lime blobs | Body text | 9.62:1 | 4.5:1 | Pass |
| light | `text` | `orange` | Text over orange blobs | Body text | 6.60:1 | 4.5:1 | Pass |
| light | `text` | `f2a` | Berry card / blobs | Body text | 6.71:1 | 4.5:1 | Pass |
| light | `text` | `f2b` | Berry gradient end | Body text | 6.62:1 | 4.5:1 | Pass |
| light | `text` | `f3a` | Peach card / blobs | Body text | 8.81:1 | 4.5:1 | Pass |
| light | `text` | `f3b` | Peach gradient end | Body text | 6.80:1 | 4.5:1 | Pass |
| light | `text` | `f4a` | Cucumber card / blobs | Body text | 10.25:1 | 4.5:1 | Pass |
| light | `text` | `f4b` | Cucumber gradient end | Body text | 8.69:1 | 4.5:1 | Pass |
| light | `border` | `bg` | Radio outlines | UI / graphics | 3.48:1 | 3:1 | Pass |
| light | `focus` | `bg` | Focus ring | UI / graphics | 16.39:1 | 3:1 | Pass |
| light | `focus` | `lime` | Focus ring on lime | UI / graphics | 12.46:1 | 3:1 | Pass |

_15 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens (0.4/0.7/1.0/1.2 s, expo and power3 easing, 75 ms stagger, pop preset without blur).

| Section | Choreography |
|---|---|
| Hero | Split-words title; lead and button rise. The metaballs drift continuously, the cursor ball eases after the pointer, and scroll lifts the field. |
| Flavours | The big can pops (badge preset) and bobs gently; a choice transitions the palette over 0.9 s. |
| Pour | **Pinned and scrubbed** (≥ 900px, 180%): the liquid rises; steps pop at 18/50/80%; bubbles rise. Phones scrub unpinned. |
| Line-up | Cards pop in a 75 ms stagger; the "New" badge pops 450 ms after its card. |
| Facts | **Parallax pair:** fruit slices at -0.45 / +0.4 (0.12 on phones). Counters count up; the chart rises. |

- **Smooth scroll:** Lenis.
- **Shader loop:** stops when the hero is offscreen or the tab is hidden; DPR is capped at 2.
- **Reduced motion:**
  - the shader draws a single still frame (no drift, cursor or scroll lift), and the goo fallback is static;
  - palette changes are instant;
  - no pin, parallax, bobbing, bubbles, counters or smooth scroll.
- Nothing flashes; the fastest repeating motion is the bubble rise (2.7–4.1 s cycles).

## Skills actually used
- `vibrant` (bergside, loaded for this site): bold and playful but WCAG 2.2 AA, a 2/4/8/12/16/24/32/48 spacing scale, 44px+ targets, reduced-motion support. Its Fascinate/Noto Sans pairing was replaced by the brief's Unbounded + Manrope.
- `frontend-design` and `css-animation-patterns` (loaded earlier in this session) and `motion-and-interaction-system` (read manually).
- **Not available**, so not used: shadertoy, web-shaders, gsap, color-expert, accesslint, web-design-guidelines. The metaball shader is my own; the audit used axe-core.

## Run and build
```bash
npm install
npm run dev
npm run build
npm run preview
npm run palette
npm run contrast
```
To add a flavour, add `f5a`/`f5b` to `palette.config.mjs`, run `npm run palette`, then add a radio (with `data-flavour="5"`) and a card.

## Swap in product photos
No photo slots by design; see [`public/assets/README.md`](public/assets/README.md).

## Verification (what was actually run)
- `npm run build` passes; `npm run contrast`: 15/15 pairs pass, including deep green on all eight flavour colours.
- Headless Chromium (SwiftShader WebGL) at 375, 768 and 1440 px, with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal scroll;
  - axe-core: 0 violations;
  - reduced-motion, no-JS and `?nosda` passes: nothing left hidden.
- Probe at 1440 px:
  - moving the pointer pulled the cursor blob into the cluster;
  - selecting "Berry Lift" set `--fa` to `oklch(0.8 0.12 350)`, renamed the big can and the description, and the hero shader re-rendered in berry colours (screenshot checked).
- Found and fixed while building this site (this affected **every** site; see the root README):
  - Vite's CSS minifier was rewriting oklch() tokens to lab();
  - Chromium then dropped the hue in `color-mix(in oklch, <lab>, transparent)`, tinting translucent surfaces pink (the header measured rgb 255,246,248 instead of cream);
  - `build.cssTarget` now targets oklch-capable browsers, so the built CSS keeps oklch and the header measures cream.
- Also fixed before the first commit:
  - blob edges were blurry and showed inner rings, so the shader now uses a flat fill with a crisp edge;
  - on phones the fruit slices sat behind the chart, so they now sit in the section's top padding with a smaller parallax.
- **Not tested:** Safari and Firefox (the goo fallback was not seen in a browser without WebGL; it was only checked as no-JS markup), real GPUs and phones, screen readers.

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-03): no sparkling-juice brand called "Flux" was found. "Flux" is a common word and is used by many unrelated products, so a real launch would need a trademark search.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
