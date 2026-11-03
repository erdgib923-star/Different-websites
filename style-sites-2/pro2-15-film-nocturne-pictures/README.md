# Nocturne Pictures: "The Long Hallway", a film title-sequence demo

> **Everything here is fictional.** Nocturne Pictures, *The Long Hallway*, the director (Odile Brannoch), the cast, every crew name, Example City Film Week, the dates, press@example.com and (555) 555-0100 are invented. There are no laurels, reviews or press quotes.

## Concept
A one-page site for a fictional 19-minute short film. **Scrolling plays the title sequence:**
- **Pinned, scrubbed title sequence** (`src/main.ts`, `src/corridor.ts`):
  - A WebGL fragment shader draws a **one-point-perspective corridor**: side walls with door frames, wall lamps, floor boards, fog, and a **door of light** at the far end.
  - As you scroll, the **letterbox bars open** to 2.39:1 and the **camera dollies** down the hallway (`uCam`).
  - **Title cards** fade in and out below the frame: "Nocturne Pictures presents", "a film by", the cast, then the title *The Long Hallway* (the h1).
  - The **door opens** (`uDoor`), the lamps dim, "Coming spring 2027" appears, and the **premiere badge pops** over the frame's corner at 88% of the sequence.
- **Film grain** is drawn in the shader. It is fine, low-amplitude noise that changes 12 times a second; there are no flashes or flicker.
- **Stills** are rendered **once** from the same shader with different camera, door, lamp, offset and warmth values, then copied into 2D canvases (figure slots). The offscreen WebGL context is released afterwards.
- **Credits roll:** a sticky window over a tall section. The list moves up one pixel for every pixel scrolled.
- **Synopsis** with a parallax pair of film strips.

### Design direction
1. Cinema before the lights go down: near-black, quiet, slow.
2. One image, the hallway, carries the whole page.
3. Bebas Neue for titles and names, the language of title cards; Cormorant Garamond italic for roles and prose.
4. Motion is a camera move: dolly, open, fade. Nothing bounces except the one premiere badge.
5. Credits are the finale, not a footnote.

## Color Brief
- **Mood:** nocturnal, warm-against-cold, expectant.
- **Hue anchors (OKLCH):**
  - **near-black 220** (night, the base);
  - **amber 70** (brand): the light, the title glow, key names, links;
  - **teal 200** (the one accent): shadows, labels, "Coming spring 2027".
- **Harmony:** a cinematic **teal-and-amber split-complementary grade**: cool shadows, warm highlights. The shader reads both hues from the tokens (`--teal`, `--amber`), so the grade and the UI always match.
- **60 / 30 / 10:** 60% near-black, 30% bone text and teal shadow, 10% amber light.
- **Neutral ramp:** tinted toward 220, the hue of the shadows (chroma 0.012).
- **Title cards** use bone on letterbox black (see the contrast table). They sit *below* the frame, not over the image, because the bright door would make text over the picture unreadable.

All colours are OKLCH custom properties from `palette.config.mjs`:
- 11-step neutral, brand (amber) and accent (teal) ramps;
- named night, night-2, night-3, bone, ash, amber, amber-deep, teal, teal-deep and black;
- semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `brand`, `brand-contrast`, `accent`, `accent-contrast`, `focus`, `shadow-color`;
- hex fallbacks under `@supports`.

Gradients use `in oklch` (header fade, premiere card glow, CSS corridor fallback). Shadows are tinted amber or black-220. Without WebGL, the CSS corridor gradient gets an SVG noise grain overlay.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| dark | `text` | `bg` | Body copy | Body text | 15.65:1 | 4.5:1 | Pass |
| dark | `text-muted` | `bg` | Credits roles, captions | Body text | 7.97:1 | 4.5:1 | Pass |
| dark | `text` | `surface-2` | Cards | Body text | 13.57:1 | 4.5:1 | Pass |
| dark | `text-muted` | `surface-2` | Card captions | Body text | 6.92:1 | 4.5:1 | Pass |
| dark | `brand` | `bg` | Amber titles and links | Body text | 10.43:1 | 4.5:1 | Pass |
| dark | `accent` | `bg` | Teal labels | Body text | 7.17:1 | 4.5:1 | Pass |
| dark | `brand-contrast` | `brand` | Amber buttons | Body text | 10.43:1 | 4.5:1 | Pass |
| dark | `text` | `black` | Title cards on letterbox black | Body text | 16.34:1 | 4.5:1 | Pass |
| dark | `border` | `bg` | Outlines | UI / graphics | 3.92:1 | 3:1 | Pass |
| dark | `focus` | `bg` | Focus ring | UI / graphics | 10.43:1 | 3:1 | Pass |

_10 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens (0.4/0.7/1.0/1.2 s, expo and power3 easing, 75 ms stagger, a pop preset with blur turned off).

| Section | Choreography |
|---|---|
| Title sequence | **Pinned and scrubbed** (all widths, 320% of scroll). The letterbox opens, the camera dollies, four cards cross-fade, the door opens and the lamps dim. The **premiere badge pops at 88%**. The scroll hint fades after the first 3%. |
| Synopsis | Split-text heading; paragraphs rise; facts pop in a staggered group. **Parallax pair:** two film strips drift at opposite speeds. |
| Stills | The heading splits in. Each frame is a **clip reveal** that wipes up, staggered. |
| Premiere | The card rises. |
| Credits | **Scroll-driven roll**: a named `view-timeline` on the section with `animation-range: contain`, falling back to a GSAP scrub. |

- **Smooth scroll:** Lenis.
- **Render loop:** stops when the screen is offscreen or the tab is hidden. It redraws only when the scroll state changes or the grain ticks, and DPR is capped at 2.
- **Reduced motion:**
  - one static frame (letterbox open, door ajar), with no grain animation, pin, parallax, smooth scroll or roll;
  - all title cards are shown as a stacked credit block, and the credits are a plain list.
- **No JS:** the CSS corridor gradient replaces the shader. All text, stills (as gradients) and credits are visible.

## Skills actually used
These skills were loaded earlier in this build session (sites 1–5) and applied again here:
- `frontend-design` (julianoczkowski designer-skills): committed direction, typographic pairing, and one dominant image.
- `css-animation-patterns` (oakoss): named view timelines and `animation-range: contain` for the credits roll.
- `motion-and-interaction-system` (read manually).
- **Not available**, so not used: gsap, shadertoy, epic-design, color-expert, accesslint, web-design-guidelines. The shader is my own; the audit used axe-core.

## Run and build
```bash
npm install
npm run dev
npm run build
npm run preview
npm run palette   # regenerate tokens.css from palette.config.mjs
npm run contrast  # check pairs and update the table above
```

## Swap in your own frames
Four still slots (`still-1` … `still-4`, 2.39:1). Set `data-photo="assets/images/<file>"` on a slot to show a real frame, graded teal → amber by the duotone. See [`public/assets/README.md`](public/assets/README.md). The title-sequence screen is the live shader, not a slot.

## Verification (what was actually run)
- `npm run build` passes; `npm run contrast`: 10/10 pairs pass.
- Headless Chromium (Playwright, with SwiftShader WebGL) at 375, 768 and 1440 px, with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal scroll;
  - axe-core: 0 violations;
  - reduced-motion, no-JS and `?nosda` passes: nothing left hidden.
- Probes at 1440 px:
  - At 30% of the sequence, the letterbox was open and the camera was partway down the hall, with "a film by" fading.
  - Near the end, `--shut` was 0, the door was open, the title and date were shown, and the badge had `is-in`.
  - All four stills rendered from the shader (`is-rendered`) and clip-revealed.
- Fixed before the first commit, all found by the first audit run:
  - Duplicate landmark name: the credits section was also labelled "The Long Hallway".
  - `data-pop="clip"` reveals never fired. IntersectionObserver counts a target's own `clip-path`, so a fully clipped target never reports as visible. The clip preset now clips the element's children, and this fix is also in the shared kit.
  - The premiere badge wrapped its date mid-phrase.
- **Not tested:**
  - Safari and Firefox (Firefox has no scroll timelines and uses the GSAP fallback for the credits roll);
  - real GPUs and phones: the shader ran on software WebGL here, so I could not measure real frame rates;
  - screen readers.

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-02 and 2026-11-03):
  - "Nocturne Pictures": no prominent studio found; kept as fictional.
  - "The Long Hallway": no film with that exact title found (there are several unrelated shorts called "Hallway" / "The Hallway").
  - All people's names were made up for this page. Any match with a real person is coincidence.
- Title cards sit under the frame, in the letterbox black, so they stay readable over a bright image. This is a deliberate deviation from cards laid over the picture.
- The title sequence pins at every width, because it starts at the top of the page and so cannot pin below the fold. Phones get a full-width 2.39:1 frame.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
- **Build fix (2026-11-03, after site 19):** `vite.config.ts` now sets `build.cssTarget` to oklch-capable browsers (Chrome/Edge 111, Firefox 113, Safari 16.4). Before this, Vite's CSS minifier rewrote every oklch() token to lab(). Chromium then dropped the hue in `color-mix(in oklch, <lab colour>, transparent)` and tinted translucent surfaces (headers, shadows, glows) slightly pink. Older browsers still use the hex fallbacks. After the change I rebuilt and re-audited at 1440 px (axe, console, reduced motion, no-JS, `?nosda`); new screenshots were not taken.
