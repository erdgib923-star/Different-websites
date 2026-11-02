# root@vesper: terminal developer portfolio demo

> **Vesper Marlowe is a fictional developer.** The projects (tidepool, lanternfish, quietbus, orbit-notes), star counts, dates, employer ("Example Systems"), email (vesper@example.com) and phone ((555) 555-0100) are invented.

## Concept
A developer portfolio that *is* a terminal, with an accessible plain-HTML version always in the same page:
- **A working terminal** (`src/terminal.ts`):
  - **Commands:** `help`, `about`, `projects` (and `projects <name>`), `contact`, `theme green|amber`, `clear`, `whoami`, `ls`, `cat <file>`, `history`, `date`, `echo` and `plain`.
  - **Tab completion** for commands, project names, themes and file names (on an empty input, Tab moves focus as usual).
  - **History** with ↑ and ↓.
  - Output goes to a `role="log"` live region, so results are announced without forcing the boot chatter on screen readers.
- **Skippable boot sequence:** fictional BIOS lines type in when the terminal first appears. **[ skip boot ]** or **Esc** skips it, and under reduced motion it is instant.
- **Plain HTML view:** the full portfolio (readme, projects, career log, contact) is semantic HTML below the terminal, and the skip link jumps straight to it. **[ plain view ]**, or the `plain` command, hides the terminal entirely and focuses the readme heading; the choice is remembered.
- **Two themes:** phosphor green and amber, toggled by the header button or `theme amber`, and remembered.
- **Subtle CRT:** faint scanlines and a vignette as one static overlay (no flicker), a light phosphor glow, and a blinking block cursor (1.1 s cycle). The overlay and glow are **removed under reduced motion**, and also in plain view.

### Design direction
1. A clean, usable zsh session, not Matrix rain.
2. Monospace everything: JetBrains Mono for the shell and UI, IBM Plex Mono for long-form reading.
3. 1px panes, 0 radius, bracketed `[ buttons ]` with inverted-video hover.
4. Motion stays out of the way: a boot, a cursor, a git log that lights up.
5. Accessibility is a first-class "view", not a fallback.

## Color Brief
- **Mood:** focused, late-night, nostalgic but crisp.
- **Hue anchors (OKLCH):**
  - **near-black 200** (void 0.16, panes 0.20 and 0.24);
  - **phosphor green 145** (brand): text in the green theme;
  - **amber 75** (the one accent): command names, links and badges in the green theme.
  - In the amber theme the roles swap: amber is the text and green is the accent. Each theme still has exactly one accent hue.
- **Harmony:** two analogous warm and cool phosphors on a cool near-black; one carries the text, the other highlights.
- **60 / 30 / 10:** 60% void and panes, 30% phosphor text, 10% accent highlights.
- **Fixed during the build:** the pane and input borders started at 2.3:1. I raised the "faint" tones to L 0.54, so borders now pass 3:1 in both themes (3.96 green, 3.76 amber).

All colours are OKLCH custom properties from `palette.config.mjs`:
- 11-step ramps for the neutral (tinted 200), green and amber;
- named phosphor, amber and void tokens;
- semantic tokens for **both themes**: `bg`, `surface`, `surface-2`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus`;
- hex fallbacks under `@supports`.

There are no gradients except the CRT vignette (a radial mix toward the background colour) and the scanline stripes. The glow is the text colour at 45% alpha, never black.

## Contrast
Both themes are checked:
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| green | `text` | `bg` | Terminal text | Body text | 13.51:1 | 4.5:1 | Pass |
| amber | `text` | `bg` | Terminal text | Body text | 11.69:1 | 4.5:1 | Pass |
| green | `text-muted` | `bg` | Dim output | Body text | 7.60:1 | 4.5:1 | Pass |
| amber | `text-muted` | `bg` | Dim output | Body text | 7.13:1 | 4.5:1 | Pass |
| green | `text` | `surface` | Panes | Body text | 12.54:1 | 4.5:1 | Pass |
| amber | `text` | `surface` | Panes | Body text | 10.86:1 | 4.5:1 | Pass |
| green | `text-muted` | `surface-2` | Dim text on raised pane | Body text | 6.44:1 | 4.5:1 | Pass |
| amber | `text-muted` | `surface-2` | Dim text on raised pane | Body text | 6.04:1 | 4.5:1 | Pass |
| green | `accent` | `bg` | Highlighted commands and links | Body text | 11.69:1 | 4.5:1 | Pass |
| amber | `accent` | `bg` | Highlighted commands and links | Body text | 13.51:1 | 4.5:1 | Pass |
| green | `brand-contrast` | `brand` | Inverted-video buttons | Body text | 13.51:1 | 4.5:1 | Pass |
| amber | `brand-contrast` | `brand` | Inverted-video buttons | Body text | 11.69:1 | 4.5:1 | Pass |
| green | `accent-contrast` | `accent` | Inverted accent badges | Body text | 11.69:1 | 4.5:1 | Pass |
| amber | `accent-contrast` | `accent` | Inverted accent badges | Body text | 13.51:1 | 4.5:1 | Pass |
| green | `error` | `bg` | Error output | Body text | 6.74:1 | 4.5:1 | Pass |
| amber | `error` | `bg` | Error output | Body text | 6.74:1 | 4.5:1 | Pass |
| green | `border` | `bg` | Pane and input borders | UI / graphics | 3.96:1 | 3:1 | Pass |
| amber | `border` | `bg` | Pane and input borders | UI / graphics | 3.76:1 | 3:1 | Pass |
| green | `focus` | `bg` | Focus ring | UI / graphics | 11.69:1 | 3:1 | Pass |
| amber | `focus` | `bg` | Focus ring | UI / graphics | 13.51:1 | 3:1 | Pass |

_20 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens (0.4/0.7/1.0/1.2 s, expo and power3 easing, 75 ms stagger). The pop preset here is a quiet 10px rise with no blur.

| Section | Choreography |
|---|---|
| Terminal | The name types in by character (split-text); the boot sequence types in, skippable; the cursor blinks. |
| Readme | Fade-ups. **Parallax pair:** two ASCII drawings drift at opposite speeds behind the text (hidden on small screens). |
| Projects | Panes pop in staggered; each `[ OK ]` / `[ BETA ]` status **badge pops** as its pane lands. |
| Commit history | **Pinned and scrubbed** (≥ 860px, 160% of scroll): the graph line fills, each commit's node **lights as the line passes**, and the `open` and `v1.0` tags **pop** at those points. Phones scrub unpinned. |
| Contact | Key/value rows stagger in. |

Under reduced motion: instant boot, no scanlines or glow, no pin, parallax or smooth scroll, and nodes are lit. Without JS the terminal shows a note pointing to the plain portfolio, which is complete.

## Skills actually used
- `design-style` (nakanosanku/ohmyskills), **TerminalCLI** prompt: monospace supremacy, block cursor, shell metaphors (`$`, `[ OK ]`), 1px panes, inverted-video buttons, subtle scanlines and phosphor glow. I deliberately did **not** follow its "no focus ring" advice; focus stays visible.
- `frontend-design` (julianoczkowski): Brutalist/Raw (visible structure, monospace) tempered by usability.
- `motion-and-interaction-system` (read manually).
- **Not available**, so not used: tui-designer (its GitHub install failed with an authentication error), taste-skill, accesslint. The audit used axe-core.

## Run and build
```bash
npm install
npm run dev
npm run build
npm run preview
npm run palette
npm run contrast
```
To add a command, add an entry to `COMMANDS` in `src/terminal.ts`; it appears in `help` and Tab completion automatically.

## Swap in your own photos
This site has **no image slots** (the brief said imagery was "none needed"). See [`public/assets/README.md`](public/assets/README.md) for how to add a portrait if you want one.

## Verification (what was actually run)
- `npm run build` passes; `npm run contrast`: 20/20 pairs pass (10 per theme).
- Headless Chromium at 375, 768 and 1440 px, with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal scroll;
  - axe-core: 0 violations;
  - reduced-motion, no-JS and `?nosda` passes: nothing left hidden.
- Terminal probe at 1440 px:
  - [ skip boot ] enabled the prompt;
  - Tab completed `proj` → `projects ` and `projects lan` → `projects lanternfish`;
  - `theme amber` switched the palette (`html[data-theme="amber"]`);
  - an unknown command printed a red "command not found";
  - ↑ recalled the last command;
  - `plain` hid the terminal and moved focus to the readme heading.
- The audit found nothing that needed fixing.
- **Not tested:** screen-reader announcement of the `role="log"` output (only the markup was checked), mobile soft keyboards with Tab completion (there is no Tab key on most phones; commands still work by typing them in full), Safari and Firefox.

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-02): no "root@vesper" portfolio found; "Vesper" is used by unrelated products (an iOS Python app, a VS Code theme).
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
