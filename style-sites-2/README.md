# style-sites-2: 20 demo sites

Twenty self-contained demo websites, one folder each. Every folder is its own Vite + TypeScript project with its own README, `package.json`, palette config, contrast script and `.gitignore`.

**Why one repo for now:** the brief asked for one private GitHub repo per site. In the session that built these, `gh` was not authenticated and repo creation was not available. The sites were committed here instead, one folder per site, with no shared code between folders. To give each site its own private repo, with its history, run:

```bash
gh auth login
bash style-sites-2/publish-repos.sh          # every site
bash style-sites-2/publish-repos.sh pro2-07-* # just one
```

Each site:
```bash
cd style-sites-2/<site>
npm install
npm run dev       # or: npm run build && npm run preview
npm run contrast  # WCAG contrast check for every text/background pair
```

All brands, people, addresses, phone numbers and data are fictional.

| # | Folder | Brand |
|---|---|---|
| 1 | `pro2-01-bento-quillstack` | Quillstack, notes and writing app |
| 2 | `pro2-02-claymorphism-mochi-money` | Mochi Money, kids' savings app |
| 3 | `pro2-03-papercut-fernfold` | Fernfold Journeys, woodland tours |
| 4 | `pro2-04-risograph-inkpress` | Inkpress Collective, risograph print studio |
| 5 | `pro2-05-doodle-scribble-sprout` | Scribble & Sprout, kids' drawing classes |
| 6 | `pro2-06-wabisabi-yugure-tea` | Yugure Tea Atelier |
| 7 | `pro2-07-hygge-lumi-and-lind` | Lumi & Lind, Scandinavian home goods |
| 8 | `pro2-08-artdeco-grand-meridian` | The Grand Meridian, 1920s-style hotel |
| 9 | `pro2-09-bauhaus-primar-institute` | Primar Institute, design school exhibition |
| 10 | `pro2-10-memphis-terrazzo-lab` | Terrazzo Lab, pattern studio |
| 11 | `pro2-11-pixel-hollow-game` | Pixel Hollow, cozy farming game |
| 12 | `pro2-12-terminal-root-vesper` | root@vesper, developer portfolio |
| 13 | `pro2-13-broadsheet-harbor-gazette` | The Harbor Gazette, fictional newspaper |
| 14 | `pro2-14-herbarium-nova` | Herbarium Nova, natural-history plates |
| 15 | `pro2-15-film-nocturne-pictures` | Nocturne Pictures, "The Long Hallway" short film |
| 16 | `pro2-16-dark-ardent-coachworks` | Ardent Coachworks, concept grand tourer |
| 17 | `pro2-17-atlas-wayfinder` | Atlas Wayfinder, voyage on a hand-built SVG chart |
| 18 | `pro2-18-gallery-small-things` | Museum of Small Things, generative-art corridor |
| 19 | `pro2-19-liquid-flux-beverage` | Flux, sparkling juice with metaballs |

## Build note (applies to every site)
All sites share a `vite.config.ts` that sets `build.cssTarget: ['chrome111', 'edge111', 'firefox113', 'safari16.4']`. Without it, Vite 8's CSS minifier (Lightning CSS) rewrites oklch() tokens to lab(). Chromium then loses the hue in `color-mix(in oklch, <lab>, transparent)`, which tints translucent surfaces pink. I found this while building site 19, applied the fix to all sites, rebuilt them, and re-audited sites 1–18 at 1440 px; each site's README notes it.
