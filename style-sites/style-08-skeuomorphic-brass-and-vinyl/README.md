# Brass & Vinyl — skeuomorphic demo site

> **Brass & Vinyl is a fictional shop and bar.** The address, artists, albums, prices and schedule are invented (example.com, 555-0100).

## Brand concept
A record shop by day and a listening bar by night: used and new vinyl from 10 to 6, then whole albums through a valve amp until midnight. The page behaves like the room: a walnut turntable you can start, a crate you flip through, a paper bar menu, ticket stubs for sessions and a brass plaque with opening hours.

## Style notes
- **Palette:** walnut `#4A2C1A` / `#2E1A0F`, cream paper `#F3E6CC`, brass `#D9B26A`, label red `#8E2B1F`. Text pairs range from 6.3:1 to 13.4:1.
- **Textures, no images:**
  - Walnut grain is two `repeating-linear-gradient`s over a vertical gradient.
  - Paper grain is an SVG `feTurbulence` noise tile (data URI) layered over cream.
  - Brass is a five-stop metallic gradient with highlight and shadow insets.
  - The crate has slat shadows; the record has grooves and a sheen in inline SVG.
- **Depth:** inner and drop shadows throughout. Buttons are physical keys with a 5px "travel" shadow that collapses on `:active` or when pressed (`aria-pressed`). Speed is a rocker switch (`role="switch"`).
- **Type:** DM Serif Display for headings, Karla for body text.
- **Live element:** press Play and the tonearm swings over, then the platter spins (33⅓ or 45 via the rocker). Under `prefers-reduced-motion` the state still changes and is announced, but nothing rotates.
- **Crate:** previous and next keys flip between sleeves (CSS-drawn covers). Without JavaScript all four records are listed one under another.
- **Bar menu:** a two-column price list with dotted leaders.

## Skills used
- `frontend-design`: design plan, copy.
- `ui-ux-pro-max`: **not available.** It was not installed (no install source was given), so it was not used.
- Checked with axe-core 4.10 in Playwright. axe marks text over textures as "incomplete" for contrast because it can't read colours through background images, so contrast was calculated by hand from the base colours (listed above).

## How to run
Open `index.html` in a browser.

## How to change colours and copy
- Colours, the brass gradient (`--brass-metal`), wood grain (`--wood`) and paper noise (`--noise`) are custom properties at the top of `styles.css`.
- Records in the crate are `<li class="sleeve">` items in `index.html`. Cover art is a CSS class (`sleeve__art--sun`, etc.), so add a new class for a new cover.

## Notes
- Brand-name check: no record shop or bar called "Brass & Vinyl" was found.
