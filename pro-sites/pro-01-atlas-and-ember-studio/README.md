# Atlas & Ember: creative studio portfolio

> **Everything here is fictional.** Atlas & Ember, its projects, clients, people, address (14 Kiln Row, Port Calder), phone number (555-0100), email (example.com) and every figure on the site are invented sample content for a design demo.

A three-route portfolio for an imaginary independent studio, built with **Next.js 16 (App Router, static export), Tailwind CSS v4, GSAP 3.15 (ScrollTrigger + SplitText) and Lenis**.

- `/` home: preloader, split-text hero, scrubbed statement, pinned horizontal gallery, services marquee, service cards, stats, studio teaser
- `/work/[slug]/` case study, statically generated for five fictional projects
- `/about/` studio page: pinned, scrubbed process sequence, team, principles

## Concept and design direction

1. **Editorial-industrial.** Oversized Bricolage Grotesque display type (narrow width, tight tracking) against small JetBrains Mono metadata labels.
2. **Warm darkness.** Smoky near-black planes lit from the top-left by an ember glow, with film grain over everything.
3. **One accent.** Ember orange marks only live things: the cursor, CTAs, labels, progress and the active state.
4. **Physical motion.** Heavy expo easing, magnetic buttons, and a scrubbed horizontal gallery as the centrepiece.
5. **Procedural artwork.** Each project cover is a generated composition: SVG geometry and turbulence, OKLCH gradients and a shared light direction.

## Color Brief

| | |
|---|---|
| **Mood** | Warm, smoky, confident; a forge at night |
| **Hue anchors** | Neutral h 62 (warm umber), Bone h 80 (sand), Ember h 42 (accent) |
| **Harmony** | Analogous warm (h 42–80, all within 40°), with a single accent hue |
| **60 / 30 / 10** | 60% warm near-black (`neutral-950/900` page and surfaces) · 30% bone (`brand-50` text, `brand-100` paper band) · 10% ember (`accent-400` CTAs, cursor, labels, progress) |

The palette lives in `scripts/palette.config.mjs`. `scripts/build-tokens.mjs` generates `app/tokens.css` from it on every `npm run build`:

- **Ramps:** three 11-step ramps (50–950) with evenly spaced OKLCH lightness.
  - `neutral`: chroma 0.016, tinted toward the brand hue.
  - `brand` (bone): low chroma.
  - `accent` (ember).
  - Out-of-gamut colours are mapped into sRGB by reducing chroma only, so lightness and hue are preserved.
- **Fallbacks:** hex values are declared first. OKLCH values follow inside `@supports (color: oklch(0% 0 0))`.
- **Display-P3:** a wider-gamut `--ember-hi` is used only for glows and the cursor dot, inside `@media (color-gamut: p3)`. It is never used for text.
- **Semantic tokens:** `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus` (plus `paper`, `ink` and `ink-muted` for the bone band). Components only use these, through Tailwind v4 `@theme inline` utilities.
- **Gradients:** interpolated `in oklch`, each with a plain-gradient fallback declared before it.
- **Shadows:** tinted with `neutral-950` via `color-mix` (with an rgb fallback), never pure black.
- **Grain:** a fixed SVG `feTurbulence` overlay at 9% opacity over the whole page, plus 22% on each artwork, to prevent banding in the large gradients.
- **Data colours:** the site has no charts, so a colourblind-safe data palette isn't needed.

### Contrast results (`npm run contrast`)

`scripts/check-contrast.mjs` parses the generated CSS, resolves every semantic token to its OKLCH value, and computes the WCAG 2.x ratio for each declared pair. It exits non-zero if any pair is below target.

| Pair | Foreground | Background | Ratio | Target | Result |
|---|---|---|---|---|---|
| Body text on page | `--text` #fbf4ea | `--bg` #0c0603 | 18.45:1 | 4.5:1 | pass |
| Body text on surface | `--text` #fbf4ea | `--surface` #1f1812 | 16.10:1 | 4.5:1 | pass |
| Body text on raised surface | `--text` #fbf4ea | `--surface-2` #342c25 | 12.58:1 | 4.5:1 | pass |
| Muted text on page | `--text-muted` #ada39b | `--bg` #0c0603 | 8.14:1 | 4.5:1 | pass |
| Muted text on surface | `--text-muted` #ada39b | `--surface` #1f1812 | 7.10:1 | 4.5:1 | pass |
| Muted text on raised surface | `--text-muted` #ada39b | `--surface-2` #342c25 | 5.55:1 | 4.5:1 | pass |
| Ember links / labels on page | `--accent` #ed5c00 | `--bg` #0c0603 | 5.89:1 | 4.5:1 | pass |
| Ember labels on surface | `--accent` #ed5c00 | `--surface` #1f1812 | 5.14:1 | 4.5:1 | pass |
| Button label on ember | `--accent-contrast` #0c0603 | `--accent` #ed5c00 | 5.89:1 | 4.5:1 | pass |
| Button label on ember (hover) | `--accent-contrast` #0c0603 | `--accent-strong` #ff7e42 | 7.97:1 | 4.5:1 | pass |
| Focus ring vs page (UI) | `--focus` #ff7e42 | `--bg` #0c0603 | 7.97:1 | 3:1 | pass |
| Control outlines (UI) | `--border-strong` #797069 | `--bg` #0c0603 | 4.18:1 | 3:1 | pass |
| Ink text on bone paper section | `--ink` #0c0603 | `--paper` #e4d9c8 | 14.46:1 | 4.5:1 | pass |
| Muted ink on bone paper | `--ink-muted` #4a423b | `--paper` #e4d9c8 | 7.11:1 | 4.5:1 | pass |
| Cursor label on bone | `--accent-contrast` #0c0603 | `--text` #fbf4ea | 18.45:1 | 4.5:1 | pass |

The first run failed one pair: the button label on the hover ember was 4.36:1. I fixed it by moving `accent-strong` to the lighter `accent-300` step.

## Motion system

Motion tokens are defined once in `lib/motion.ts`:

- **Durations:** `DUR` = 0.4 / 0.6 / 0.8 / 1.2 s.
- **Easing:** `EASE` = `expo.out` and `power3.out` / `inOut`, plus `back.out(2.6)` for the pop overshoot.
- **Stagger:** 75 ms.
- **Pop preset (`pop()`):** scale 0.9 → ~1.02 → 1 (from the back-ease overshoot), translateY 24px → 0, opacity 0 → 1, blur 8px → 0.

`components/Reveals.tsx` turns declarative attributes into choreography:

| Attribute | Effect |
|---|---|
| `data-split="intro\|scroll"` | SplitText headline reveal: masked lines, rising words |
| `data-clip="up\|left\|center"` | clip-path media reveal; the inner art settles from 1.22× |
| `data-pop` | `ScrollTrigger.batch` staggered pop-ins (cards, stats, meta) |
| `data-fade` | rise and fade |
| `data-speed` | parallax layer |
| `data-scrub-words` | words light up as you scroll; forward-only, so read text never dims again |

Section-specific choreography:

- **Preloader:** a 000 → 100 counter that waits for `document.fonts.ready` (2.5 s cap), then wipes up via clip-path.
- **Hero:** split headline, plus a parallax layer pair (glow at −0.35, orbit lines at +0.25). A scroll badge pops in after 12% of the viewport and then rotates with scroll only.
- **Work:** a pinned horizontal gallery (≥ 768 px). The track is scrubbed, a progress rule fills, and a "Now viewing" callout re-pops whenever the focused project changes. Cards pop in as they slide into view (`containerAnimation`). Hovering or focusing a card drives an SVG `feDisplacementMap` heat-haze distortion.
- **Marquee:** speeds up and reverses with scroll velocity, pauses offscreen, and has a pause button (WCAG 2.2.2).
- **About:** a pinned, scrubbed four-step process. The numeral rolls, a rule fills, and the active step gets an ember marker. A floating "Founded" card is the parallax pair.
- **Page transitions:** an ember panel, then an ink curtain, then `router.push`. After that the scroll is reset, the curtain lifts, and focus moves to `<main>`. A small "stage" gate (`lib/stage.ts`) holds every intro until the preloader or curtain has lifted.
- **Cursor:** a magnetic custom cursor on fine pointers only. It is a dot plus a lagging ring that grows over links and shows labels ("View", "Next", "Write"). Buttons pull toward the pointer (`components/Magnetic.tsx`).
- **Lenis:** Lenis runs on the GSAP ticker (`lenis.raf(t * 1000)`, `lagSmoothing(0)`, `lenis.on('scroll', ScrollTrigger.update)`). `ScrollTrigger.refresh()` runs after fonts load, on window `load` and after each route change. Every page's triggers live in a `gsap.context` that is reverted on unmount.

**Progressive enhancement:**

- An inline boot script adds `html.js` (and `html.reduced` when reduced motion is preferred). Hidden start states apply only under `.js:not(.reduced)`.
- If the app hasn't booted within 4 s, `js` is removed again and everything shows.
- Without JS, all content is visible. The preloader and curtain never render.
- **Reduced motion:**
  - Lenis, the preloader, the cursor, the transitions, pinning, parallax and the marquee are all disabled.
  - The gallery becomes a vertical list.
  - Every element shows its final state immediately.

## Imagery system

There are no photos, generated images or hotlinks. Every image slot is a reusable `<Media>` figure:

- fixed `aspect-ratio`, `object-fit: cover` and a dominant-colour background
- blur-up and lazy loading
- a CSS duotone (`lighten`/`darken` blend layers driven by `--duo-dark`, `--duo-light` and `--tint-strength`)

When no photo is supplied, a slot renders a `ProjectArt` composition. There are five variants: orbit, contour, monolith, weave and flare.

All artwork shares one lighting rule. The key light comes from the top-left, shadows fall bottom-right and are tinted `neutral-950`, the palette is bone plus ember only, and every piece gets the same grain.

See [`public/assets/README.md`](public/assets/README.md) for every slot, its ratio and its recommended size.

## Swapping in photos

Drop files into `public/assets/images/` and list them in `public/assets/images/photos.json` (`{ "slot-name": "file.jpg" }`). They are picked up at runtime, with no rebuild needed.

## Run and build

```bash
npm install
npm run dev        # http://localhost:3000 (regenerates tokens first)
npm run build      # tokens + static export to ./out
npm run preview    # serves ./out on http://localhost:4173 (zero-dependency server)
npm run contrast   # WCAG contrast check of the generated tokens
```

All versions in `package.json` are pinned. Fonts (Bricolage Grotesque and JetBrains Mono, both Google Fonts) are self-hosted through `@fontsource-variable`.

## Skills used

I read these skills' SKILL.md files from `.claude/skills` and followed them:

- **color-expert:** OKLCH ramps, chroma-only gamut mapping, semantic token layer, 60-30-10.
- **gsap-web:** the Lenis + ScrollTrigger single-loop wiring, SplitText masking, `gsap.context` cleanup.

These requested skills were **not available** in this environment, so they were not used: `antislopui`, `frontend-design`, `scroll-experience`, `taste-skill`, `web-design-guidelines`. In place of `web-design-guidelines`, I ran an axe-core audit and did a manual review.

## Verification

- `npm run build` succeeds (TypeScript strict, 9 static pages).
- `npm run contrast`: all 15 pairs pass (table above).
- **Playwright** screenshots of `/`, a case study and `/about/`:
  - widths 375, 768 and 1440 px, at scroll positions 0/25/50/75/100% (0/50/100% on sub-pages)
  - plus reduced-motion and JavaScript-disabled runs
  - no console errors, no page errors, no failed requests, no horizontal overflow, exactly one `<h1>` per page
- **Interaction checks (Playwright):**
  - The preloader counts and then hides.
  - The custom cursor activates.
  - Hovering a card drives the displacement scale to 42.
  - Clicking a card runs the ember-then-ink curtain and lands on the case study, with the curtain hidden afterwards.
- **axe-core** (WCAG 2.2 A/AA + best-practice), run after scrolling every page end to end, with and without reduced motion: **0 violations**. axe lists some text over gradient backgrounds as "incomplete" (it can't compute contrast there). Those spots use the same text/background tokens as the contrast table.

## Notes and known limitations

- **Repository.** You asked for a separate private GitHub repo per site. This session's GitHub access is limited to one repository (`Different-websites`), so the site is committed there under `pro-sites/`. Run `pro-sites/split-into-repos.sh` from the parent folder to publish each site as its own private repo with your own `gh` login.
- **Real devices.** I haven't tested on real mobile devices or Safari/Firefox. Only headless Chromium was used. SVG `feDisplacementMap` on hover is GPU-heavy on very old devices.
- **Next prefetches.** Next.js prefetches linked routes. On a slow network, the first transition can wait on that fetch while the curtain is closed.
