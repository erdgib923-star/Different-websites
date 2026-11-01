# Riot Parade — maximalist demo site

> **Riot Parade is a fictional festival.** Every artist, the venue, dates, prices and contact details are invented (example.com, 555-0100).

## Brand concept
A three-day, four-stage music festival whose signature moment is a parade through the park at sunset on Saturday. The page is loud on purpose: oversized type, whole fields of colour, overlapping shapes and marquee bands, all held in place by a CSS grid.

## Style notes
- **Four saturated colours:** sun `#FFD60A` (ground), cobalt `#1B3BFF`, pink `#FF2E93` and leaf `#00A86B`, plus ink `#111`. Every text pair passes AA (lowest is 4.8:1, sun on cobalt).
- **One consistent type scale:** Bricolage Grotesque on a perfect-fourth scale (`--step-0` … `--step-8`, ratio 1.333). Only the hero title uses a viewport-based size (`--display`, clamped to the scale's `--step-5` minimum).
- **Overlapping shapes:** a circle, a starburst, a zigzag and a blob as inline SVGs, all `aria-hidden`, layered with `z-index` over a 6-column hero grid.
- **Marquee bands:** two tilted bands. Each band clips its own overflow and `html`/`body` use `overflow-x: clip`, so there is no horizontal page scroll (checked at 375px and 1440px: `scrollWidth` equals the viewport).
- **Lineup grid:** Friday, Saturday and Sunday in cobalt, pink and green fields. Headliners are set at a larger step.
- **Live element:** star the acts you want to see. The list is stored in `localStorage` (wrapped in try/catch) and announced through `aria-live`.
- **Motion (GSAP 3.12.5 + ScrollTrigger from cdnjs):** looping marquees, one hero entrance, and a starburst and sun that move with scroll.
  - A visible **Pause motion** button stops every looping tween (WCAG 2.2.2).
  - Under `prefers-reduced-motion`, GSAP never starts.
  - Without JavaScript, the bands sit still and nothing is hidden.

## Skills used
- `frontend-design`: design plan, type scale, copy.
- `gsap`: marquee loop, entrance timeline, ScrollTrigger scrub and cleanup/pause patterns, applied in vanilla JS.
- `design-taste-frontend` (taste-skill): composition rules, such as each section having a different layout and the footer name at full width. Its bans on decorative shapes were overridden by this brief, which asks for overlapping shapes.

## How to run
Open `index.html` in a browser.

## How to change colours and copy
- The four colours and the type scale are custom properties at the top of `styles.css`.
- The lineup is plain HTML lists in `index.html`. Marquee text is duplicated inside each `.band__track` (both copies must match for the loop to be seamless).

## Notes
- Brand-name check: no festival called "Riot Parade" was found. The similarly named Riot Fest (Chicago) is a different, well-known event, so this name should be treated as a placeholder.
