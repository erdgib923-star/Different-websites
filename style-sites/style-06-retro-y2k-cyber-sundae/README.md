# Cyber Sundae — retro Y2K demo site

> **Cyber Sundae is a fictional collective.** The venue, artists, songs, zines, guestbook entries, visitor counter and contact details are invented (example.com, 555-0100).

## Brand concept
A music and zine collective that, once a month, plays one whole record to a quiet room, then photocopies what everyone wrote about it on the wall. The page is their homepage, as if it were still 2003: listening-party flyer, zine shelf, mixtape and a guestbook.

## Style notes
- **Palette:** blue-black ground `#10102A` with hot pink `#FF3EA5`, lime `#B6FF3B` and cyan `#3DF5FF`. All three pass AA as text on the ground, and the ground passes as text on all three.
- **Chrome headings:** a silver `linear-gradient` clipped to the text, with a purple and pink drop-shadow stack. Every gradient stop is at least 7:1 against the ground, so the text passes wherever the gradient lands. Browsers without `background-clip: text` fall back to solid light grey.
- **Type:** Unbounded 800/900 for display, Rubik for body, and Silkscreen pixel font for accents only (labels, track numbers, badges).
- **Stickers:** inline SVG starburst, pill and heart badges with offset shadows, marked `aria-hidden`.
- **Noise overlay:** an SVG `feTurbulence` data-URI on `body::after`, at 9% opacity with `pointer-events: none`.
- **Guestbook:** sample entries are labelled as samples. Visitors can sign it; entries are saved only in their own browser (`localStorage`, wrapped in try/catch, rendered with `textContent`).
- **Motion:** a slowly spinning star sticker and cassette reels (`transform` only), plus button nudges. All are disabled under `prefers-reduced-motion`.

## Skills used
- `frontend-design`: design plan, copy.
- `design-taste-frontend` (taste-skill): composition and copy rules. This brief explicitly asks for gradients (chrome), stickers and a pixel font, which the taste-skill house rules ban, so the brief overrides them here.

## How to run
Open `index.html` in a browser.

## How to change colours and copy
- The palette and the chrome gradient (`--chrome`) are at the top of `styles.css`. Keep every chrome stop light enough to stay readable on `--night`.
- Copy, tracklist and sample entries are in `index.html`. Clear saved guestbook entries by removing the `cyber-sundae-guestbook` key from your browser's localStorage.

## Notes
- Brand-name check: no existing act or collective called "Cyber Sundae" was found. Only unrelated "Sundae" and "Cyber" acts came up.
