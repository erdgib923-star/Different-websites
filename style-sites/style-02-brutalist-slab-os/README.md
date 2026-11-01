# SLAB/OS — brutalist demo site

> **SLAB/OS is a fictional design collective.** Members, clients, projects, numbers, address and contact details are invented (example.com, 555-0100).

## Brand concept
Seven designers sharing one room and one invoice template. The page runs like a plain operating manual for the collective: house rules, the people at each desk, a project index, and a type "stress test".

## Style notes
- **Palette:** black `#000`, white `#FFF`, and one loud accent `#FF3B00`. The accent is used only as a fill behind black text (5.9:1) or as text on black, so it always passes AA.
- **Type:** Archivo variable, pushed to its extremes (width 62% / weight 900 for the giants, width 125% for section bands). IBM Plex Mono for body copy and data.
- **Structure:** every block is a cell with a visible 3px border. The cells butt together with negative margins, so the borders read as one grid.
- **No gradients, no rounded corners, no shadows.** Buttons are plain black rectangles. Hover inverts colours instantly, with no animation.
- **Live element:** the Stress test sets your word in Archivo with width and weight sliders, using CSS `font-variation-settings`.
- **Motion:** one 3px "press" on button `:active`, disabled under `prefers-reduced-motion`.

## Skills used
- `frontend-design`: design plan, type-as-image direction, copy.
- `design-taste-frontend` (taste-skill): house rules applied where they don't contradict this brief. The brief explicitly asks for visible borders, a visible grid and mono type, so those taste-skill bans were overridden on purpose.
- `impeccable`: **not available.** It was not installed (no install source was given), so it was not used.

## How to run
Open `index.html` in a browser. Fonts load from Google Fonts. Without a network connection the page falls back to Arial Narrow and Courier.

## How to change colours and copy
- Edit the custom properties at the top of `styles.css`: `--signal` is the accent and `--rule` is the border thickness.
- All copy is in `index.html`. The project index is a plain `<table>`.
- The contact form posts to a `mailto:` address. Wire it to a real backend before using it.

## Notes
- Brand-name check: no existing collective called "SLAB/OS" was found. Several unrelated studios use the word "SLAB" alone.
