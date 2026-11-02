# Beanwick Ops — analytics dashboard demo

> **Beanwick Ops and its coffee chain are fictional.** Every store, city, number and contact detail is sample data (example.com, 555-0100), and the dashboard labels it as such.

**Renamed:** the brief's name, *Beanline*, is used by an existing coffee brand (@beanline.coffee). The brand was renamed to **Beanwick**. The folder and repo keep the planned name, `style-15-dashboard-beanline-ops`.

## Concept
The weekly operations view for a 15-store coffee chain: how the week is going, which days and stores drive it, and whether bean stock is running low.

## Style notes
- **App screen, not a landing page:** warm neutral UI, quiet 1px borders on panels, one coffee-brown accent used only for the active nav item and focus rings.
- **Type:** Public Sans with tabular figures everywhere numbers align.
- **Sidebar navigation:** fixed at 900px and wider. Below that it collapses into an off-canvas drawer, with focus moving in, the rest of the app `inert`, and Escape, the scrim or × returning focus to the menu button.
- **Top bar:** search (filters the stores table by store or city, with an empty state), a light/dark toggle and an avatar.
- **KPI cards:** revenue, orders, average ticket and bean stock. Change is shown by an arrow icon and words as well as colour. Bean stock uses a warning icon and label.
- **Charts (Chart.js 4.4.1, cdnjs):**
  - Daily revenue is a line chart: this week (solid) vs last week (dashed), with an index-mode tooltip listing both series and an HTML legend.
  - Revenue by store is a horizontal bar chart from a zero baseline with 4px rounded ends.
  - Each chart states its finding in one line.
- **Chart data lives in on-page `<table>`s**, which JavaScript reads to build the charts. Without JavaScript or the CDN, those tables are shown open; with charts, they sit behind "Show as table" as the accessible alternative.
- **Sortable table:** 15 sample rows. Column headers are buttons with `aria-sort`, and numeric columns sort descending first. The sort result is announced in the live status line.
- **Light/dark:** `data-theme` on `<html>`. The first visit follows the OS; the toggle choice is saved in `localStorage` (try/catch). Dark mode has its own validated steps rather than an automatic inversion, and charts re-theme live.

## Skills used
- `frontend-design`: layout and type decisions.
- `dataviz`: form choice (line for change over time, bars for comparison), one axis, thin marks, legend plus a dashed second series, findings as titles, table views. Chart colours are the reference palette's slots 1–2, run through `validate_palette.js`: light ΔE CVD 24.7 and dark ΔE CVD 26.8, all checks PASS.
- `web-design-guidelines` (Vercel Web Interface Guidelines): reviewed after the build. Fixes are in the second commit.
- `accesslint` (`accessibility-scan`): automated scan after the build. Results are in the second commit.
- `ui-ux-pro-max`: **not available.** It was not installed (no install source was given), so it was not used.

## How to run
Open `index.html` in a browser. Chart.js loads from cdnjs; offline, the data tables are shown instead.

## How to change colours and copy
- UI and chart colours are custom properties at the top of `styles.css`, once for light and once for dark (`--series-1`, `--series-2`). If you change chart colours, re-run the dataviz validator.
- Chart numbers are the `#line-data` and `#bar-data` tables in `index.html`. Edit the tables and the charts follow.

## Audit results
- **Fixed after the audit:**
  - The page `h1` was `display: none` on mobile (axe `page-has-heading-one`). It is now visually hidden but still present.
  - The sidebar close button no longer shows on desktop.
  - The City column is left-aligned like its header.
- **accesslint** (`@accesslint/cli` 0.21.0, 94 rules): 0 violations. Its Chrome could not reach cdnjs, so it scanned the no-Chart.js fallback state (data tables open).
- **axe-core 4.10 in Playwright** with Chart.js loaded (from the same version's npm package): 0 violations at 375px and 1440px.
- **Playwright interaction test passed:**
  - sort by text and number, both directions (including values with a unicode minus);
  - search, plus the empty state;
  - the theme toggle and its persistence across a reload;
  - the mobile nav drawer focus and `inert` behaviour;
  - the CDN-blocked fallback.
- **Not verified:** the cdnjs path `Chart.js/4.4.1/chart.umd.js` (cdnjs is blocked in the build environment), and Windows High Contrast / forced-colors rendering.
