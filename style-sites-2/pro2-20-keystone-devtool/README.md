# Springline (brief: "Keystone"): developer-tool landing page with a working command palette

> **Rename note:** the brief named this brand **Keystone**. A web search found **KeystoneJS**, an established open-source CMS and developer tool, so I renamed the fictional brand to **Springline**: the line where an arch begins to curve, a nod to the keystone idea. I kept the folder and repo name `pro2-20-keystone-devtool`, as the brief specified. I also considered "Voussoir" and rejected it, because a developer tool called "Vousoir" exists on GitHub.
>
> **Everything here is fictional.** Springline, its plans, changelog, pull request #482, numbers, sales@example.com and (555) 555-0100 are invented. Links go to example.com.

## Concept
A Vercel/GitHub-style landing page for a tool that shows you, as a diff, what a commit will do to your infrastructure before it deploys:
- **Command palette (Cmd/Ctrl+K)**, fully working (`src/palette.ts`):
  - **Navigation:** jump to Home, How it works, Changelog or Pricing (moves focus to the section heading).
  - **Themes:** dark, light or match system. The choice is remembered per viewer in `localStorage`, with try/catch, so private mode still works.
  - **Copy:** the install command.
  - **Interaction:**
    - typing filters by label and keywords, with an empty state;
    - ArrowUp/Down, Home/End and Enter work, with `aria-activedescendant` on a combobox input and a listbox of options;
    - Escape or a backdrop click closes it, and focus returns to the opener.
  - The shortcut label shows `⌘ K` on Apple platforms and `Ctrl K` elsewhere. The header button opens it too.
- **Theme toggle** in the header, plus the palette commands. Light and dark each have a full set of semantic tokens, and every pair is checked in both themes.
- **Animated code diff:** **pinned and scrubbed**.
  - Unchanged lines are present from the start. The changed lines land in order: removals turn violet and get struck through; additions slide in cyan.
  - Every line also carries a `+`/`−` sign, so colour is never the only cue.
  - The three steps (Read, Plan, Show) light up at 15/50/85%, and the plan summary chips (**+2 to create, ~1 to change, 0 to destroy**) **pop at 88/92/96%**.
- **Changelog timeline:** the gradient line **draws with scroll** (a CSS view timeline on a registered `--line` number, with a GSAP fallback), and entries slide in.
- **Pricing:** a monthly/yearly toggle (native radios) re-prices the plans with a small rise. The featured plan has a **glowing gradient border**, a conic gradient on a registered `--angle` that turns slowly.
- **Parallax pair:** two floating "plan" and "checks" cards in the hero.

### Design direction
1. A calm, dark cloud-platform UI: near-black, soft glass panels, one glow per screen.
2. The product is the hero: real-looking code, plans and commands instead of illustrations.
3. Instrument Sans for a crisp modern voice; JetBrains Mono for anything a developer would type.
4. Motion explains the product: the diff applies, the plan pops, the timeline draws.
5. Keyboard first: the palette, visible focus, 44px targets, and an 8pt grid.

## Color Brief
- **Mood:** focused, trustworthy, quietly futuristic.
- **Hue anchors (OKLCH):**
  - **near-black 270** (dark theme base, L 0.14–0.23);
  - **violet 295** (brand): buttons, links, removals, timeline start;
  - **cyan 215** (the one accent): additions, labels, focus ring in dark mode, the timeline end.
- **Harmony:** analogous cool (violet and cyan, 80° apart) on a tinted near-black.
- **60 / 30 / 10:** 60% near-black (or paper in light mode), 30% neutral panels and text, 10% violet and cyan.
- **Neutral ramp:** tinted toward 270 (chroma 0.014).
- **Light theme:**
  - paper 270 at L 0.985;
  - violet and cyan deepened to L 0.50 so they pass as text;
  - the focus ring switches to violet.
- **Diff colours:** cyan (additions) against violet (removals) is distinguishable for red-green colour-blind users, unlike the usual green/red. The `+`/`−` signs carry the meaning regardless.

All colours are OKLCH custom properties from `palette.config.mjs`:
- 11-step ramps;
- two themes (`:root, [data-theme="dark"]` and `[data-theme="light"]`);
- semantic tokens including `add`, `add-bg`, `del`, `del-bg`;
- hex fallbacks under `@supports`.

The hero glow is two `in oklch` radial gradients with an SVG noise grain, masked to fade out. Shadows are tinted neutral-950/700.

## Contrast
<!-- contrast-table:start -->
| Theme | Foreground | Background | Used for | Type | Ratio | Target | Result |
|---|---|---|---|---|---|---|---|
| dark | `text` | `bg` | Body copy | Body text | 18.56:1 | 4.5:1 | Pass |
| light | `text` | `bg` | Body copy | Body text | 16.65:1 | 4.5:1 | Pass |
| dark | `text-muted` | `bg` | Secondary copy | Body text | 7.72:1 | 4.5:1 | Pass |
| light | `text-muted` | `bg` | Secondary copy | Body text | 6.82:1 | 4.5:1 | Pass |
| dark | `text` | `surface-2` | Cards, palette | Body text | 15.80:1 | 4.5:1 | Pass |
| light | `text` | `surface-2` | Cards, palette | Body text | 13.85:1 | 4.5:1 | Pass |
| dark | `text-muted` | `surface-2` | Card details | Body text | 6.57:1 | 4.5:1 | Pass |
| light | `text-muted` | `surface-2` | Card details | Body text | 5.67:1 | 4.5:1 | Pass |
| dark | `brand-text` | `bg` | Violet links, kickers | Body text | 10.33:1 | 4.5:1 | Pass |
| light | `brand-text` | `bg` | Violet links, kickers | Body text | 6.34:1 | 4.5:1 | Pass |
| dark | `accent-text` | `bg` | Cyan labels | Body text | 11.85:1 | 4.5:1 | Pass |
| light | `accent-text` | `bg` | Cyan labels | Body text | 5.55:1 | 4.5:1 | Pass |
| dark | `brand-contrast` | `brand` | Primary buttons | Body text | 7.02:1 | 4.5:1 | Pass |
| light | `brand-contrast` | `brand` | Primary buttons | Body text | 6.34:1 | 4.5:1 | Pass |
| dark | `add` | `add-bg` | Added diff lines | Body text | 10.22:1 | 4.5:1 | Pass |
| light | `add` | `add-bg` | Added diff lines | Body text | 4.90:1 | 4.5:1 | Pass |
| dark | `del` | `del-bg` | Removed diff lines | Body text | 9.23:1 | 4.5:1 | Pass |
| light | `del` | `del-bg` | Removed diff lines | Body text | 5.50:1 | 4.5:1 | Pass |
| dark | `text` | `add-bg` | Code on added lines | Body text | 16.00:1 | 4.5:1 | Pass |
| light | `text` | `add-bg` | Code on added lines | Body text | 14.69:1 | 4.5:1 | Pass |
| dark | `text` | `del-bg` | Code on removed lines | Body text | 16.58:1 | 4.5:1 | Pass |
| light | `text` | `del-bg` | Code on removed lines | Body text | 14.43:1 | 4.5:1 | Pass |
| dark | `border` | `bg` | Inputs, outlines | UI / graphics | 3.91:1 | 3:1 | Pass |
| light | `border` | `bg` | Inputs, outlines | UI / graphics | 3.49:1 | 3:1 | Pass |
| dark | `focus` | `bg` | Focus ring | UI / graphics | 11.85:1 | 3:1 | Pass |
| light | `focus` | `bg` | Focus ring | UI / graphics | 6.34:1 | 3:1 | Pass |

_26 pairs checked by `npm run contrast`; 0 below target._
<!-- contrast-table:end -->

## Motion system
Shared tokens (0.4/0.7/1.0/1.2 s, expo and power3 easing, 75 ms stagger, pop preset without blur).

| Section | Choreography |
|---|---|
| Hero | Split-words title; note, lead, buttons and install line rise in sequence. **Parallax pair:** the two cards drift at -0.35 / +0.4. |
| Diff | **Pinned and scrubbed** (≥ 960px, 170%): lines apply in order (10–80%), steps light up, and **plan chips pop at 88/92/96%**. Phones scrub unpinned. |
| Changelog | The timeline line draws with a view timeline; entries slide in from the left. |
| Pricing | Toggle, cards pop in a stagger; the "Most teams" badge pops after its card; prices rise on change. |
| Glow borders | One slow 8 s turn of the conic border. The glow itself is a static shadow. |
| Palette | 0.4 s rise in; active option moves instantly. |

- **Smooth scroll:** Lenis. The palette is excluded with `data-lenis-prevent`.
- **Reduced motion:**
  - no pin, parallax, border rotation, smooth scroll or line drawing;
  - all diff lines, chips and steps are in their final state;
  - palette jumps scroll instantly.

## Skills actually used
- `enterprise` (bergside, loaded for this site): a dark cloud-platform look, an 8pt grid, 44px targets, explicit states including empty states (the palette's "No matches"), and no decorative motion without purpose. Its IBM Plex fonts were replaced by the brief's Instrument Sans + JetBrains Mono.
- `frontend-design` and `css-animation-patterns` (loaded earlier in this session) and `motion-and-interaction-system` (read manually).
- **Not available**, so not used: gsap, scroll-experience, color-expert, accesslint, web-design-guidelines. The audit used axe-core.

## Run and build
```bash
npm install
npm run dev
npm run build
npm run preview
npm run palette
npm run contrast
```
To add a palette command, push an entry onto `commands` in `src/main.ts` (`id`, `group`, `label`, optional `keywords`/`hint`, and `run`).

## Swap in screenshots
No photo slots by design; see [`public/assets/README.md`](public/assets/README.md).

## Verification (what was actually run)
- `npm run build` passes; `npm run contrast`: 26/26 pairs pass (13 pairs × dark and light).
- Headless Chromium at 375, 768 and 1440 px, with screenshots at 0/25/50/75/100%:
  - no console errors, no failed or external requests, one h1, no horizontal scroll;
  - axe-core: 0 violations;
  - reduced-motion, no-JS and `?nosda` passes: nothing left hidden.
- **Palette probe** (1440 px, keyboard only):
  - Ctrl+K opened it with focus in the input and `aria-activedescendant="cmd-go-top"` (8 options);
  - typing "zzz" showed the empty state;
  - typing "light" plus Enter set `data-theme="light"`, stored it, and closed the palette;
  - Meta+K, then "pric" plus Enter, scrolled #pricing to the top (80 px under the header) and focused its heading;
  - the yearly toggle changed prices to $0 / $20 / $40.
- Fixed before the first commit, from the audits and screenshots:
  - the hero glow overflowed the page width, so `main` now clips it, and a mask removes a hard edge;
  - the hero cards overlapped on phones, so they now stack;
  - the glowing border was invisible because card backgrounds overrode it, so its specificity is raised;
  - an animated blurred glow was replaced with a static shadow, because blurring every frame is expensive;
  - the palette's `::backdrop` used `backdrop-filter`, and after closing the palette, headless screenshots hung (repeatable). I removed the blur, and screenshots work again. I don't know whether real browsers had a visible problem, but removing it is harmless.
- **Not tested:**
  - Safari and Firefox, including `⌘K` on a real Mac (only Meta+K in headless Chromium);
  - real clipboard permissions: headless copy may report "Copy failed", and the UI says so honestly;
  - screen readers, real devices.

## Notes and decisions
- Built in `style-sites-2/` of `erdgib923-star/different-websites` instead of its own repo: `gh` was not authenticated and repo creation was unavailable. Split later with `publish-repos.sh`.
- Brand check (web search, 2026-11-03): see the rename note at the top. No developer tool called "Springline" was found; the results were the unrelated Spring CLI.
- The theme default is dark (the brief's near-black). "Match system" is offered in the palette.
- Fonts are self-hosted via `@fontsource` (`font-display: swap`).
