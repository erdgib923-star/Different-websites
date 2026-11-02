# Primar Institute: Bauhaus exhibition demo

> **Primar Institute is a fictional design school.** The exhibition, dates (14 Nov – 21 Dec 2026), workshops, address (5 Workshop Street, Example City), email (exhibition@example.com) and phone ((555) 555-0100) are invented. No student names are used; the "studies" are generated on the page.

## Concept
A foundation-year exhibition built only from Bauhaus primitives (circle, square, triangle, bar and half-circle), the three primaries plus black, thick black borders and hard offset shadows. Signature features:
- **Shapes assemble and rotate into place on scroll.** The hero composition starts scattered: each shape is shrunk, spun and flung off-centre. As the hero scrubs (pinned on wide screens), the shapes fly and rotate home one after another, and the Circle, Square and Triangle tags pop as their shapes land.
- **Six generated studies** in a deliberately broken asymmetric grid. Each is seeded (same picture on every load) and follows the brief: a 6 × 6 grid, primaries plus black, at most seven shapes, one dominant form.
- **Composition studio:**
  - **Pointer:** add shapes in any colour and drag them.
  - **Keyboard:** Tab to a shape, arrows move it (Shift for 40px), R rotates 45°, + and − resize, Delete removes. There are matching buttons for rotate, resize, bring to front and delete.
  - **Export SVG** downloads a clean standalone `primar-composition.svg` with real fills.
  - Every action is announced in a status region.
- **Asymmetric grid:** a 7/5 hero, offset study tiles, and workshop blocks of three different heights.

### Design direction
1. The page is a poster: geometric purity, colour blocking, nothing decorative that isn't a primitive.
2. Jost (a Futura-like geometric sans) in heavy uppercase; Space Mono for labels, like workshop stencils.
3. Thick 3–4px black borders and hard 4–8px offset shadows; corners are either 0 or fully round.
4. Motion is constructive: things assemble, snap and press; nothing floats.
5. **No gradients**, by design (the Bauhaus prompt forbids them). So the gradient and grain rules have nothing to apply to here.

## Color Brief
- **Mood:** energetic, didactic, confident.
- **Hue anchors (OKLCH):**
  - **blue 262** (brand): links, focus, the blue workshop;
  - **red 28** (the one UI accent): the main CTA, highlights;
  - **yellow 92**: the third primary, used for blocks and shapes with black text;
  - **black, white and a warm grey.**
- **Harmony:** a primary triad on a neutral ground.
- **60 / 30 / 10, adapted:** about 60% warm canvas and white, about 25% black (type, borders, shadows), about 15% primaries in blocks.
- **Neutral exception:** the brief asked for *warm grey*, so the neutral ramp is tinted to hue 75. That departs from the general "tint neutrals toward the brand hue" rule; I followed the site brief.
- **Overlaps:** shapes in the hero and studies use `multiply`, so where red crosses blue you get a deep overprint, the way layered translucent card or gel behaves.

All colours are OKLCH custom properties from `palette.config.mjs`:
- 11-step ramps for neutral, blue, red and yellow;
- named canvas, paper, black, red, blue and yellow;
- semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus`;
- hex fallbacks under `@supports`.

The SVG export converts the same OKLCH values to hex with the same gamut mapping. Shadows are solid black offsets, the style's defining feature; there are no blurred shadows.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| light | `text` | `bg` | Body copy | Body text | 16.18:1 | 4.5:1 | Pass |
| light | `text-muted` | `bg` | Captions | Body text | 6.30:1 | 4.5:1 | Pass |
| light | `text` | `surface` | Cards | Body text | 17.64:1 | 4.5:1 | Pass |
| light | `text-muted` | `surface-2` | Grey blocks | Body text | 4.99:1 | 4.5:1 | Pass |
| light | `text` | `yellow` | Black on yellow block | Body text | 11.26:1 | 4.5:1 | Pass |
| light | `white` | `blue` | White on blue block and button | Body text | 7.62:1 | 4.5:1 | Pass |
| light | `white` | `red` | White on red block and button | Body text | 5.27:1 | 4.5:1 | Pass |
| light | `brand` | `bg` | Blue links | Body text | 6.69:1 | 4.5:1 | Pass |
| light | `accent` | `bg` | Red display words | Large text | 4.63:1 | 3:1 | Pass |
| light | `white` | `black` | Footer and dark blocks | Body text | 18.41:1 | 4.5:1 | Pass |
| light | `yellow` | `black` | Yellow labels on black | Body text | 11.26:1 | 4.5:1 | Pass |
| light | `border` | `bg` | Black borders and controls | UI / graphics | 16.18:1 | 3:1 | Pass |
| light | `focus` | `bg` | Focus ring | UI / graphics | 6.69:1 | 3:1 | Pass |
| light | `focus` | `yellow` | Focus ring on yellow | UI / graphics | 4.66:1 | 3:1 | Pass |
| light | `red` | `canvas` | Red shape vs canvas | UI / graphics | 4.63:1 | 3:1 | Pass |
| light | `yellow` | `black` | Yellow shape vs black | UI / graphics | 11.26:1 | 3:1 | Pass |

_16 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens: 0.4/0.7/1.0/1.2 s, expo and power3 easing, 75 ms stagger, the pop preset, and the badge pop.

| Section | Choreography |
|---|---|
| Hero | The h1 rises word by word (in three colours). **Pinned and scrubbed** (≥ 960px, 130% of scroll): seven shapes fly and rotate into the composition, staggered. **Tags pop** as their shapes land. Phones get the same assembly unpinned. |
| Exhibition | Study tiles pop in staggered. **Parallax pair:** a yellow circle and a black bar in the background drift at opposite speeds. |
| Studio | Interaction only; buttons press with a hard-shadow collapse. |
| Workshops | Three colour blocks pop in staggered. |
| Visit | "Free entry" and "Opens 14 Nov" **badges pop** with rotation. |

Under reduced motion the composition is already assembled, and there is no pin, parallax or smooth scroll. Without JS the hero composition and all text are visible; the studies and the studio need JS.

## Skills actually used
- `design-style` (nakanosanku/ohmyskills), **Bauhaus** prompt: primaries plus black and white, thick borders, hard offset shadows, binary radii, colour blocking, uppercase geometric display, no gradients.
- `frontend-design` (julianoczkowski): Swiss and functionalist grid discipline, broken on purpose.
- `css-animation-patterns` and `motion-and-interaction-system` (read manually).
- **Not available**, so not used: bauhaus-design, design-movements, the `impeccable` audit skill (the bergside `impeccable` is a different visual style, not used here), gsap-web, color-expert. The audit used axe-core.

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
The six study tiles are image slots (`study-01` … `study-06`, 1:1, 4:5 and 5:4). Set `data-photo="assets/images/<file>"` to show photos of real student work instead of generated studies. See [`public/assets/README.md`](public/assets/README.md).

## Verification (what was actually run)
- `npm run build` passes; `npm run contrast`: 16/16 pairs pass.
- Headless Chromium at 375, 768 and 1440 px, with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal scroll;
  - axe-core: 0 violations;
  - reduced-motion, no-JS and `?nosda` passes: nothing left hidden.
- Studio probe: I picked blue, added a triangle, moved it with ArrowRight and Shift+ArrowUp, and rotated it with R ("Rotated to 45 degrees" was announced, and focus stayed on "blue triangle"). Export SVG downloaded `primar-composition.svg`, a standalone SVG with real hex fills.
- Fixed after the first audit: the hero opened on an empty board, because every shape started invisible. Shapes now start visible but scattered and spun inside the board, then assemble.
- **Not tested:** touch dragging on a real device, Safari and Firefox, and screen readers. The shapes are announced as buttons with their colour and name, but I have not verified that with a real screen reader.

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-02): no "Primar Institute" found; the nearest name is "Primo Institute of Design" in Hyderabad.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
