# Wild Thread — e-commerce demo site

> **Wild Thread is a fictional brand.** Products, prices, stock, specs, address and contact details are invented (example.com, 555-0100). There is no real checkout.

## Brand concept
Small-batch outdoor clothing sewn in runs of two hundred and built to be repaired. Eight pieces, one page: browse, filter, open a piece, pick a size, add to cart.

## Style notes
- **Neutral palette:** bone `#F2EFE9`, stone `#E7E2D9`, ink `#24221F` (13.8:1), secondary `#5E5A54` (6.0:1), control borders `#8A847A` (3.2:1, non-text). One muted moss accent, `#4F5D3A`, is used only for buy actions (white on it 7.1:1).
- **Type:** Instrument Sans 400/600.
- **Products:** 8 garments drawn as inline SVG symbols (jacket, shirt, fleece, vest, base layer, pants, cap, socks), coloured per product with `currentColor`. A note says they stand in for photos.
- **Sticky header** with a cart count that announces changes (`aria-live`) and gives a small bump on add (disabled under reduced motion).
- **Filters:** category, colour, max price and sort.
  - On desktop (960px and up) they are a sticky sidebar.
  - On mobile they become an off-canvas drawer: focus moves in, the rest of the page is `inert`, and Escape, the backdrop or the close button returns focus to "Filters".
  - The filter state is mirrored in the URL (`?cat=tops&sort=price-desc`) and restored on load.
- **Product detail view:** a native `<dialog>` (built-in focus trap and Escape), deep-linkable as `#p=<id>`. Choosing no size shows an inline error and focuses the size picker.
- **Cart:** a drawer `<dialog>` with quantity, remove and subtotal.
  - It is stored in `localStorage` under `wild-thread-cart`, and every read and write is wrapped in try/catch.
  - If storage is blocked, the cart still works for the visit and says it won't be saved.
  - "Go to checkout" honestly says checkout isn't connected.
- **Without JavaScript:** all 8 products, prices and descriptions are plain HTML, and a `<noscript>` note explains how to order.

## Skills used
- `frontend-design`: design plan, copy.
- `web-design-guidelines` (Vercel Web Interface Guidelines): URL state, `inert`/`overscroll-behavior` on drawers, `aria-live` on async updates, focus return, tabular numbers.
- `accesslint` (`accessibility-scan`): automated WCAG 2.2 scan after the build. Results are in the second commit.

## How to run
Open `index.html` in a browser. To test the URL-synced filters and deep links, serve the folder (for example `python3 -m http.server`), because some browsers restrict `history.replaceState` on `file://`.

## How to change colours and copy
- Palette tokens are at the top of `styles.css`.
- Products are `<li class="card">` items in `index.html` (`data-cat`, `data-color` and `data-price` drive the filters). Detail copy, sizes and facts are the `DETAILS` map in `script.js`. Garment drawings are the `<symbol>`s at the top of `index.html`.

## Notes
- Brand-name check: no outdoor brand called exactly "Wild Thread" was found. Similar names exist (Wild Things, Wildbird Threads).

## Audit results
- accesslint (`@accesslint/cli` 0.21.0, 94 rules): 0 violations on the initial page.
- axe-core 4.10 with the product dialog, cart dialog and mobile drawer each open: 0 violations.
- Vercel guidelines review: cart removal was immediate, so an **Undo** was added (focus moves to it; it restores the line).
- Playwright interaction test passed:
  - filters (including combined filters, sort, reset and URL sync);
  - the deep link `#p=canvas-cap`;
  - size validation;
  - cart add, quantity, remove and undo;
  - persistence across a reload;
  - the mobile drawer focus and `inert` behaviour;
  - a simulated blocked `localStorage` (no errors, honest message).
