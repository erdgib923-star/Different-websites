# Trattoria Fioraliso — restaurant demo site

> **Trattoria Fioraliso is a fictional restaurant.** The address, menu, prices, hours and phone number are placeholders (example.com, 555-0100).

**Renamed:** the brief's name, *Fiorella Trattoria*, is very close to real restaurants: Trattoria Fiorella (Philadelphia, a well-known Marc Vetri restaurant) and Fiorella's Trattoria (Wellesley, MA). The brand was renamed to **Trattoria Fioraliso** (*fioraliso* is Italian for cornflower). The folder and repo keep the planned name, `style-13-restaurant-fiorella-trattoria`.

## Brand concept
A family trattoria since 1987: pasta rolled every morning, a wood oven, and a short menu that follows the market. The cornflower is its small emblem, drawn in SVG.

## Style notes
- **Palette:** cream ground `#F6EEDF`, deep oxblood accent `#6E1423` (10.2:1), ink `#2B1B17`, muted `#6B5A50` (5.7:1). Cornflower blue is used only in the illustration.
- **Type:** Playfair Display for display, Pinyon Script for small Italian accents (*Benvenuti a tavola*, *Il menù*, *Orari*, *Prenota*, marked `lang="it"`), and Mulish for body text.
- **Menu:** two columns (Antipasti and Primi | Secondi and Dolci). Each line is name, dotted leader, price, using a flex row with a `dotted` border filler and tabular figures.
- **Hours and a fake address**, plus clearly marked photo and map placeholder boxes.
- **Sticky reservation button on mobile:** fixed at the bottom under 760px.
  - It slides away while the booking form is on screen, so it never covers a field.
  - `scroll-padding-bottom` keeps focused elements clear of it.
  - It respects `safe-area-inset-bottom`.
- **Booking form:** date (no past dates), time, guests, name, phone and notes, with inline validation that focuses the first error. On submit it opens an email with the details filled in, because there is no booking backend (the page says so).

## Skills used
- `frontend-design`: design plan, copy.
- `web-design-guidelines` (Vercel Web Interface Guidelines): reviewed after the build. Fixes are in the second commit.
- `ui-ux-pro-max`: **not available.** It was not installed (no install source was given), so it was not used.

## How to run
Open `index.html` in a browser.

## How to change colours and copy
- Palette, fonts and spacing are custom properties at the top of `styles.css`.
- Menu items are `<li>` rows in `index.html`: `<span class="dish">…</span><span class="dots"></span><span class="price">…</span>`.
- The booking email address is in `script.js` (`tavola@example.com`).
