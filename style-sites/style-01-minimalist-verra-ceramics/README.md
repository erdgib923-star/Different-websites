# Verra Ceramics — minimalist demo site

> **Verra Ceramics is a fictional brand.** All names, addresses, prices and contact details are placeholders (example.com, 555-0100).

## Brand concept
A two-potter stoneware studio with one kiln that is fired once a month. Everything that comes out whole goes on sale that weekend. The page is built around that rhythm: one idea per section, and a live "next kiln opening" date.

## Style notes
- **Minimalist:** off-white ground (`--paper #F7F6F2`), one muted clay accent (`--clay #8B5A43`), one sans family (Hanken Grotesk) in two weights (400 and 600).
- **Split-stage layout:** on desktop a single drawn jar stays fixed in the left 45% while a narrow text column scrolls. On mobile the drawing becomes the opening block.
- **Huge whitespace:** sections are 6–14rem apart, with one idea each (intro, firing, clay, pieces, visit).
- **Motion:** hover fades only (`opacity`). Nothing animates on load or scroll. `prefers-reduced-motion` turns off smooth scrolling and transitions.
- **Visuals:** the jar is an inline SVG. Product photos are clearly marked grey placeholder boxes.
- **Sample content:** piece names, sizes and prices are placeholders, and the page says so.

## Skills used
- `frontend-design`: design plan, typography and copy guidance.
- `design-taste-frontend` (taste-skill): direction draw (chose "split-stage"), house rules, `lint.mjs` (0 fails) and `inspect.mjs`. Inspector items left in on purpose because they contradict this brief:
  - no photographs or video, since the brief forbids stock or downloaded images;
  - fewer than 8 moving elements, since the brief asks for low motion with hover fades only;
  - asymmetric right margin, which comes from the split layout;
  - the "cream" warning, since the brief asks for an off-white ground.
- `web-design-guidelines` (Vercel Web Interface Guidelines): reviewed after the build. Fixes are in the second commit.

## How to run
Open `index.html` in a browser. There is no build step. Fonts load from Google Fonts; without a network connection the page falls back to Helvetica or Arial.

## How to change colours and copy
- **Colours, type sizes and spacing** are CSS custom properties at the top of `styles.css` (`:root`). For example, change `--clay` to recolour the button, the jar and the footer name.
- **Copy** is plain HTML in `index.html`. The next-opening date is computed in `script.js` (the first Saturday of each month). Edit `firstSaturday` to change the schedule. If JavaScript is off, the static sentence "the first Saturday of each month" is shown instead.

## Notes and assumptions
- The headline names the brand plus what it makes, so the first screen says what this is.
- Headings use sentence case (frontend-design guidance) rather than the Title Case the Vercel guidelines suggest.
- Brand-name check: a search found a Vietnamese tile supplier called "Vera Ceramics" (different spelling, different product). It is not a well-known brand, so the name was kept.
