# Nimbra Wallet — glassmorphism demo site

> **Nimbra Wallet is a fictional app.** It is not a bank and not a real product. Balances, transactions, prices and contact details are sample data (example.com, 555-0100).

**Renamed:** the brief's name, *Halo Wallet*, is already in use by an existing crypto wallet (a 2023 rebrand of KuCoin Wallet, with a Chrome extension of that name). The brand was renamed to **Nimbra Wallet**. The folder and repo keep the planned name, `style-04-glassmorphism-halo-wallet`.

## Brand concept
A personal finance app whose promise is clarity: "money you can see through". The glass style carries that idea: frosted panels show the colour behind them without hiding what's on them.

## Style notes
- **Background:** a vibrant sky (`--sky #8EC5FF`) with four large, blurred radial-gradient blobs (tangerine, magenta, teal, lemon). They drift slowly using `transform` only.
- **Glass:** `rgba(255,255,255,.6)` with `backdrop-filter: blur(24px) saturate(160%)`, a 1px light border and a soft shadow.
  - **Fallback:** when `backdrop-filter` is not supported, `@supports not (...)` switches cards to near-opaque white (`--glass-solid`).
- **Contrast:** dark navy text (`--ink #14213D`) on light glass. Worked worst case: 60% white glass over pure magenta gives `#F5AAC3`, and navy on that is 8.7:1. Secondary text `#3A4660` is 5.1:1 on the same worst case.
- **Type:** Onest 400/600/700.
- **Live element:** the round-up calculator (payments per week × multiplier × an assumed $0.50 average round-up), with `aria-live` on the result.
- **Motion:** blob drift and a staggered hero entrance. Both are disabled under `prefers-reduced-motion`. The hero cards are only hidden for the entrance once JavaScript has added the `.js` class, so they are always visible without JavaScript.

## Skills used
- `frontend-design`: design plan, copy.
- `accesslint` (`accessibility-scan`, @accesslint/cli 0.21.0 over CDP): 94 rules, 0 violations on the first build.
- `ui-ux-pro-max`: **not available.** It was not installed (no install source was given), so it was not used.
- Also checked with axe-core 4.10 in Playwright. axe marks text on glass as "incomplete" because it can't compute contrast through `backdrop-filter`, so contrast was calculated by hand (see above).

## How to run
Open `index.html` in a browser.

## How to change colours and copy
- Blob colours (`--tangerine`, `--magenta`, `--teal`, `--lemon`), glass opacity (`--glass`), blur (`--blur`) and text colours are at the top of `styles.css`. If you lighten the background or lower the glass opacity, re-check contrast.
- Copy is in `index.html`. The calculator's assumption (`AVG_ROUNDUP`) is in `script.js`.
