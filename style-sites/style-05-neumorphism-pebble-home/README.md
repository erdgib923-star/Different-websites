# Pebble Home — neumorphism demo site

> **Pebble Home is a fictional product.** The panel controls nothing real. Temperatures, energy figures, price and contact details are sample data (example.com, 555-0100).

## Brand concept
A smart-home hub whose one panel feels like a smooth stone: lights, heat, blinds and scenes for every room. The page is the panel itself, so the demo is the pitch.

## Style notes
- **One mid-tone surface** (`--surface #DDE2EA`). Raised elements use paired shadows: light `#F8FAFD` top-left and dark `#B3BBC8` bottom-right.
- **Pressed and "on" states are inset** (`--in`), on a slightly darker fill (`--surface-in`).
- **Accessibility adjustments for the style:**
  - Labels use dark text: `#1F2733` (11.6:1) and `#434C5C` (6.7:1).
  - Every control has a 1.5px `#6B7587` edge (3.6:1 against the surface, above the 3:1 non-text minimum), so controls don't rely on shadows alone.
  - Active state is also shown by colour (teal `#0B5F5B`), a dot and a text label, not just depth.
- **Working controls in `script.js`:**
  - `role="switch"` toggles with live state text.
  - Room tabs follow the ARIA tabs pattern (arrow keys, Home and End).
  - Scene radios set all devices and announce the change through `aria-live`.
  - The thermostat dial is an SVG arc with a `role="slider"` face. It supports pointer drag, arrow keys (±0.5°), Page Up/Down (±2°), Home and End, plus −/+ buttons, and `aria-valuetext` reads "21.5 degrees Celsius, heating".
- **Type:** Lexend 400/500/600.
- **Motion:** short `transform` and shadow transitions on switches and pills, disabled under `prefers-reduced-motion`.

## Skills used
- `frontend-design`: design plan.
- `accesslint` (`accessibility-scan`): automated WCAG 2.2 scan in Chrome.
- `a11y-audit`: `a11y_scanner.py` (static HTML scan) and `contrast_checker.py` (colour pairs).
- Also checked with axe-core 4.10 in Playwright, plus a scripted keyboard test of the dial, tabs and switches.

## How to run
Open `index.html` in a browser.

## How to change colours and copy
- Surface, shadows, edge and accent colours are custom properties at the top of `styles.css`. Re-check contrast if you change `--surface` or `--edge`.
- Device names and states are in `index.html` (`data-on` / `data-off` set the state text). Per-room and per-scene presets are the `rooms` and `scenes` objects in `script.js`.

## Notes
- Brand-name check: no product called "Pebble Home" was found. "Pebble" is a known smartwatch brand, and smaller "Pebble"-named smart devices exist (Pebblebee trackers, a V-Guard "Pebble" water heater). The name was kept because the brief specifies it, but treat it as a placeholder before any real use.
