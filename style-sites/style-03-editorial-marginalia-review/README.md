# The Slow Margin — editorial demo site

> **The Slow Margin is a fictional magazine.** Writers, essays, survey figures, contents, address and contact details are invented (example.com, 555-0100).

**Renamed:** the brief's name, *The Marginalia Review*, is very close to an existing publication, *The Marginalia Review of Books* (themarginaliareview.com). The brand was renamed to **The Slow Margin**. The folder and repo keep the original name, `style-03-editorial-marginalia-review`, so they match the project plan.

## Brand concept
A quarterly of long-form culture writing that prints wide margins so readers can answer back. The page is one issue's lead essay. The magazine's idea, *the margin belongs to the reader*, is also the layout: a real margin column holds the side notes.

## Style notes
- **Warm paper palette:** paper `#F2EBDD`, ink `#1E1B16`, pencil grey `#655C50` for captions and notes, ink blue `#26406A` for links, the drop cap and pull-quote rules. Every text pair passes WCAG AA (lowest is 4.9:1).
- **Type:** Fraunces for display, using its optical-size axis (144 for headlines, 24–72 for smaller serif). Source Sans 3 for body copy at 18px, with the measure capped at 65 characters.
- **Editorial devices:** a drop cap (`::first-letter`), two pull quotes taken from the essay itself, figure captions, side notes, an issue contents list and a subscription block.
- **Asymmetric two-column layout** from 1000px up: headline left with standfirst right, text column offset, notes in the right margin. On mobile, notes appear inline with a blue rule.
- **Interaction:** a "Hide/Show margin notes" toggle (`aria-pressed`). It is hidden without JavaScript, and the notes stay visible.
- **Motion:** none apart from hover fades. `prefers-reduced-motion` is respected.

## Skills used
- `frontend-design`: design plan, type scale, copy.
- `web-design-guidelines` (Vercel Web Interface Guidelines): reviewed after the build. Fixes are in the second commit.
- `ui-ux-pro-max`: **not available.** It was not installed (no install source was given). Its typography role was covered by frontend-design's guidance.

## How to run
Open `index.html` in a browser. Fonts load from Google Fonts, with Georgia and Arial as fallbacks.

## How to change colours and copy
- Colours, type sizes, the measure (`--measure: 65ch`) and the note width are custom properties at the top of `styles.css`.
- The essay is plain HTML in `index.html`. To add a side note, put an `<aside class="note" id="nX">` before the paragraph that references it, and a `<sup class="ref"><a href="#nX">X</a></sup>` in that paragraph.
