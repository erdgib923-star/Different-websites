# Taskferry — flat / material demo site

> **Taskferry is a fictional product.** Prices, features and contact details are sample content (example.com, 555-0100).

**Renamed:** the brief's name, *Tasklane*, is already used by an existing task-and-project app (Tasklane Technologies Ltd, on the App Store). The brand was renamed to **Taskferry**. The folder and repo keep the planned name, `style-09-flat-material-tasklane`.

## Brand concept
A project management tool with exactly three lanes: Planned, Crossing, Shipped. Work "crosses" only when someone moves it, so the board stays honest. The hero is a working sample board you can use.

## Style notes
- **One primary plus two neutrals:** harbour green `#0A7C59`, ink `#1B1F24` and paper `#F2F3F0`. Every other colour is a tint of these (secondary text `#4E545C`, surface step `#E3E6E1`, green tint `#DCEFE7`).
- **Flat:** solid colour blocks, no shadows and no gradients anywhere.
- **8px spacing grid:** every space token is a multiple of 8 (`--s1` to `--s16`).
- **Icons:** inline Lucide-style SVGs (24px grid, 2px round stroke) in a `<symbol>` sprite.
- **Type:** Figtree 400/600/800.
- **Pricing:** three tiers (Solo, Team, Fleet) with a monthly/yearly toggle (`aria-pressed` buttons).
- **Live element:** the sample board. Each card has back and forward buttons with names like "Move 'Final QA pass' to Shipped". Focus stays on the moved card and the move is announced through `aria-live`. Without JavaScript a static list of the same tasks is shown.
- **Copy:** buttons use Title Case, per the Vercel guidelines. Headings use sentence case.

## Skills used
- `frontend-design`: design plan.
- `web-design-guidelines` (Vercel Web Interface Guidelines): reviewed after the build. Fixes are in the second commit.
- `ui-ux-pro-max`: **not available.** It was not installed (no install source was given), so it was not used.

## How to run
Open `index.html` in a browser.

## How to change colours and copy
- `--primary`, `--ink` and `--paper` at the top of `styles.css` drive the whole palette. Spacing tokens are `--s1` to `--s16`.
- Sample board cards are the `cards` array in `script.js`. Prices are `data-monthly` and `data-yearly` attributes in `index.html`.
