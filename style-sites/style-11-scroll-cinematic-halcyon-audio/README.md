# Halcyon Audio — cinematic scroll demo site

> **Halcyon Audio and Halcyon One are fictional.** Specifications, price and contact details are sample data (example.com, 555-0100).

## Brand concept
A launch page for *Halcyon One*, over-ear noise-cancelling headphones named after the halcyon (kingfisher) and its calm days. The story is "three layers of quiet": shell, microphones, driver. The page tells it the way a product film would.

## Style notes
- **Palette from the kingfisher:** night `#0B1620`, back-feather blue `#2E9BD6`, breast amber `#F08A3C`, mist text `#EAF2F7` / `#9FB4C3` (all at least 5.9:1).
- **Type:** Instrument Serif for display, Familjen Grotesk for text.
- **Headphones drawn in SVG:** a single `<symbol>` reused in the hero, the pinned story, five colourway panels and the pre-order block.
- **Cinematic techniques (epic-design / gsap-scroll catalogue):**
  1. Split-text hero: characters converge from both sides, with the headline's full text kept in an `aria-label`.
  2. Six-layer depth parallax in the hero (horizon gradient, glows, SVG waves, product, text, motes), each layer at a different scroll speed. The product also has a 9s float loop.
  3. Pinned storytelling section scrubbed to scroll (`pin`, `scrub: 1`, `+=250%`). Steps swap text while the matching part of the headphone lights up.
  4. Horizontal-scroll colourway gallery, pinned and scrubbed.
  5. Animated counters that count up once on entry (`snap: textContent`).
- **Mobile, reduced motion and no JavaScript:**
  - Pins and horizontal scroll only run at 768px and wider with no reduced-motion preference (`gsap.matchMedia`).
  - On phones the steps stack and the gallery is a native swipe row with scroll-snap.
  - Without JavaScript, every step, panel and final number is already in the HTML.

## Skills used
- `frontend-design`: design plan, copy.
- `epic-design`: depth system, technique choice and `validate-layers.js`. Its default of a single file with jsDelivr imports was overridden by the brief (separate files, cdnjs).
- `gsap-scroll`: pin + scrub timeline, horizontal track, counter, split-text recipes, and `gsap.matchMedia` guards.
- `gsap`: reduced-motion and cleanup patterns (the matchMedia callback returns a cleanup function).
- `scroll-experience`: story beats (hook → context → journey → climax → resolution) and anti-scroll-hijacking guidance (native scroll speed is kept; only scrub is used).

## How to run
Open `index.html` in a browser. GSAP loads from cdnjs; without a network connection the page is still complete, just static.

## How to change colours and copy
- Palette and type tokens are at the top of `styles.css`. The headphone colours are the `#g-shell`, `#g-band` and `#g-driver` gradients at the top of `index.html`.
- Story steps are `<li class="step">` in `index.html`. If you add steps, also extend the timeline in `script.js`.
- Counter targets are `data-count` attributes. The HTML text is the no-JavaScript fallback, so keep them equal.
