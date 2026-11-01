# Voidline — dark cyberpunk demo site

> **Voidline and its game, Null Harbor, are fictional.** Dates, team size, features and contact details are sample content (example.com, 555-0100).

## Brand concept
Voidline, a nine-person independent studio, announces its first game. *Null Harbor* is a four-player heist on an orbital port that went dark eleven years ago and is still being run by its docking AI. The page is the announcement: glitch title, trailer slot, the world's three design pillars, a public roadmap and a wishlist.

## Style notes
- **Near-black ground** `#0A0A0F` with **one neon accent**, cyan `#36E2F5`. It is used sparingly: the primary button, the trailer frame, the current roadmap milestone and focus rings.
- **Glowing thin borders:** a 1px neon border plus a soft outer glow (`--glow`) on the trailer frame, and on pillar cards on hover.
- **Monospace labels** (JetBrains Mono), Chakra Petch for display, IBM Plex Sans for body text.
- **Background:** a fixed, CSS-only layer of a 64px grid, 3px scanlines and a vignette.
- **Glitch headline:** CSS only. Two offset copies (in `aria-hidden` spans, so screen readers announce the title once) are sliced with `clip-path` and play a short burst every 5 seconds. They are fully disabled under `prefers-reduced-motion`. `clip-path` is the one non-transform/opacity property animated here, because the slicing *is* the effect.
- **Roadmap:** a real `<ol>` with done, in-progress and planned states. The neon progress line is scrubbed to scroll with GSAP ScrollTrigger and drawn with `scaleY`.
- **Motion (GSAP 3.12.5 + ScrollTrigger from cdnjs):** one hero timeline and one-time staggered section entrances. Nothing is hidden in CSS, so without JavaScript, or if the CDN fails, the page is complete. With reduced motion, GSAP is never started.

## Skills used
- `frontend-design`: design plan, copy.
- `gsap`: timeline, ScrollTrigger and reduced-motion patterns. The skill is written for Vue; its principles were applied in vanilla JS.
- `design-taste-frontend` (taste-skill): `lint.mjs` flags monospace, gradients, thin rules and glows. Every one of those is explicitly requested by this brief (monospace labels, scanline/grid background, glowing thin borders), so the brief overrides those rules.

## How to run
Open `index.html` in a browser. GSAP loads from cdnjs; without a network connection the page still works, just without the scroll animation.

## How to change colours and copy
- `--neon` changes the single accent everywhere. `--glow` controls the border glow. Grid size and scanline density are in `.bg` in `styles.css`.
- Roadmap entries are `<li class="road__item">` in `index.html`. Mark the current one with `is-now` and finished ones with `is-done`; the progress line follows automatically.

## Notes
- Brand-name check: no studio called "Voidline" was found. Nearby names exist (Void Labs, Voidliner on itch.io).
- The cdnjs URLs (`gsap/3.12.5/gsap.min.js`, `ScrollTrigger.min.js`) could not be fetched from the build environment, whose network blocks cdnjs. Testing used the same version from the gsap@3.12.5 npm package; the cdnjs paths themselves are unverified.
