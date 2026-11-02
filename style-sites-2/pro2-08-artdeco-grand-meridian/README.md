# The Grand Meridian: Art Deco hotel demo

> **The Grand Meridian is a fictional hotel.** The history ("Est. MCMXXVI"), floors, rooms, rates, address (1 Meridian Square, Example City), email (concierge@example.com) and phone ((555) 555-0100) are invented. "Guest favourite" refers to made-up demo data, not a review.

## Concept
A 1920s-style grand hotel told through Art Deco geometry:
- **Sunburst fan that expands on scroll.** A CSS `repeating-conic-gradient` behind the hero opens from 0.7× to 1.45× and turns 6° as you leave the hero. It is driven by `animation-timeline: scroll(root)` with a GSAP fallback.
- **Gold line-drawn stepped frames.** Ziggurat-cornered SVG frames (`pathLength="1"`, non-scaling strokes) draw in: around the hero on load, and around each room card as it scrolls in.
- **Elevator-door clip-path reveal ("Going up").** A pinned scroll sequence:
  - the lift scene opens from the centre with `clip-path: inset(0 50% 0 50%)` → `inset(0)` while the gilded door panels slide apart;
  - a brass floor dial's needle swings from I to XII;
  - the lobby, the Emerald Bar, the ballroom and the rooftop crossfade in turn, each with its note;
  - the floor badge pops at every stop.
- **Room cards:** stepped (ziggurat) clip-path cards with drawn gold frames, CSS deco artwork and a popping "Guest favourite" ribbon.
- **Booking form:** date validation (departure after arrival, no past dates), live pricing (nights × rate), and clear error messages. Nothing is sent.

### Design direction
1. Gatsby meets Metropolis: obsidian, emerald velvet and decisive gold.
2. Symmetry and verticality; the page reads like floors of a tower.
3. Poiret One (thin geometric deco display, uppercase, wide tracking) with Jost (geometric, vintage-modern body).
4. Motion is theatrical but mechanical: doors, dials, a fan opening. No bounce, except the floor badge's small "ding".
5. Sharp corners only; glows instead of soft shadows.

## Color Brief
- **Mood:** opulent, nocturnal, confident.
- **Hue anchors (OKLCH):**
  - **near-black 270** (obsidian and lacquer, with the neutral ramp tinted 270);
  - **emerald 165** (brand): velvet bands, the bar, the booking panel;
  - **gold 85** (the one accent): line-work, headings, buttons;
  - **ivory** (0.95 0.025 90) for text.
- **Harmony:** a dark neutral base with a complementary-temperature pair: cool emerald against warm gold.
- **60 / 30 / 10:** 60% obsidian and lacquer, 30% emerald and ivory, 10% gold.
- **Contrast:**
  - Gold is bright on obsidian (body-safe).
  - The darkest gold stop used in gradients and pattern lines (`gold-deep`) is checked as large text.
  - Ivory and champagne are checked on emerald.
- **No data visualisation** on this site.

All colours are OKLCH custom properties from `palette.config.mjs`:
- 11-step ramps for neutral (tinted 270), emerald and gold;
- named tokens: obsidian, lacquer, ivory, champagne, gold, gold-deep, gold-pale, emerald;
- semantic tokens: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus`;
- hex fallbacks under `@supports`.

Gradients use `in oklch` with plain fallbacks first. Glows are gold mixed into transparent; there are no black shadows. The hero gradient carries the SVG grain overlay.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| dark | `text` | `bg` | Body copy | Body text | 16.66:1 | 4.5:1 | Pass |
| dark | `text-muted` | `bg` | Secondary copy | Body text | 11.04:1 | 4.5:1 | Pass |
| dark | `text` | `surface` | Room cards | Body text | 15.48:1 | 4.5:1 | Pass |
| dark | `text-muted` | `surface` | Card details | Body text | 10.26:1 | 4.5:1 | Pass |
| dark | `text-muted` | `surface-2` | Form panel | Body text | 9.20:1 | 4.5:1 | Pass |
| dark | `accent` | `bg` | Gold labels and prices | Body text | 9.90:1 | 4.5:1 | Pass |
| dark | `accent` | `surface` | Gold on cards | Body text | 9.20:1 | 4.5:1 | Pass |
| dark | `gold-deep` | `bg` | Darkest stop of gold gradient headings | Large text | 5.24:1 | 3:1 | Pass |
| dark | `text` | `emerald` | Ivory on emerald band | Body text | 9.07:1 | 4.5:1 | Pass |
| dark | `text-muted` | `emerald-deep` | Champagne on deep emerald | Body text | 8.72:1 | 4.5:1 | Pass |
| dark | `accent` | `emerald` | Gold on emerald | Body text | 5.39:1 | 4.5:1 | Pass |
| dark | `accent-contrast` | `accent` | Solid gold button | Body text | 9.90:1 | 4.5:1 | Pass |
| dark | `border-strong` | `surface-2` | Form field borders | UI / graphics | 4.37:1 | 3:1 | Pass |
| dark | `focus` | `bg` | Focus ring | UI / graphics | 14.34:1 | 3:1 | Pass |
| dark | `focus` | `emerald` | Focus ring on emerald | UI / graphics | 7.81:1 | 3:1 | Pass |

_15 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens: 0.4/0.7/1.0/1.2 s, expo and power3 easing, 75 ms stagger, and the pop preset.

| Section | Choreography |
|---|---|
| Hero | The double stepped frame **draws in** (2.2 s). The h1 **splits by character**, then the lead and CTAs follow. The **sunburst opens on scroll**. **Parallax pair:** the deco skyline drifts slower than the fan expands. |
| Going up | **Pinned and scrubbed** (≥ 900px, 300% of scroll): clip-path door reveal, then a dial needle and floor crossfades. The floor badge **pops at each stop** (I, IV, VII, XII). On phones the floors are a list of captioned figures. |
| Rooms | Cards pop in staggered with gold frames drawing; the ribbon **pops 600 ms** after its card. |
| Reserve | Facade figure pops, split heading, live price summary. |

Under reduced motion: no pin, door reveal, fan scrub or smooth scroll. Frames show complete, and the four floors are listed. Without JS everything is visible.

## Skills actually used
- `design-style` (nakanosanku/ohmyskills), **ArtDeco** prompt: stepped corners, sunbursts, double frames, Roman numerals, all-caps wide tracking, gold glows, 0 radius.
- `frontend-design` (julianoczkowski), **Art Deco / Geometric** philosophy: symmetry, a strong vertical axis, ornamental frames.
- `css-animation-patterns` (oakoss): scroll and view timelines, and `clip-path` reveals.
- `motion-and-interaction-system` (read manually).
- **Not available**, so not used: design-movements, frontend-design-pro, gsap-web, color-expert. The audit used axe-core.

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
`facade` (3:4) in the reservation panel is the photo slot. Set `data-photo="assets/images/<file>"`. See [`public/assets/README.md`](public/assets/README.md). The floor scenes and room art are part of the deco system; to show photos there, add `.fig` slots in their place.

## Verification (what was actually run)
- `npm run build` passes; `npm run contrast`: 15/15 pairs pass.
- Headless Chromium at 375, 768 and 1440 px, with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal scroll;
  - axe-core: 0 violations;
  - reduced-motion, no-JS and `?nosda` passes: nothing left hidden.
- Lift probe at 1440 px, halfway through the pin: the doors were open, the dial needle was at IV, the badge read "IV", and the Emerald Bar scene and note were showing.
- The audit found nothing that needed fixing.
- **Not tested:** the booking form's date validation in Safari (native date pickers differ), Firefox (uses the GSAP fallbacks), real devices, and screen readers.

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-02): a small budget "Hotel Grand Meridian" exists in Katni, India. It is not a well-known brand, and this demo is a fictional 1920s grand hotel, so the name was kept. Rename it before any public use.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
