# Style sites

Fifteen static demo websites, one per design style. Every brand is fictional. Each folder is self-contained: `index.html`, `styles.css`, `script.js`, `README.md` and `.gitignore`. Open any `index.html` directly in a browser.

| # | Folder | Brand | Style |
|---|---|---|---|
| 1 | style-01-minimalist-verra-ceramics | Verra Ceramics | Minimalist |
| 2 | style-02-brutalist-slab-os | SLAB/OS | Brutalist |
| 3 | style-03-editorial-marginalia-review | The Slow Margin *(renamed)* | Editorial |
| 4 | style-04-glassmorphism-halo-wallet | Nimbra Wallet *(renamed)* | Glassmorphism |
| 5 | style-05-neumorphism-pebble-home | Pebble Home | Neumorphism |
| 6 | style-06-retro-y2k-cyber-sundae | Cyber Sundae | Retro Y2K |
| 7 | style-07-dark-cyberpunk-voidline | Voidline | Dark cyberpunk |
| 8 | style-08-skeuomorphic-brass-and-vinyl | Brass & Vinyl | Skeuomorphic |
| 9 | style-09-flat-material-tasklane | Taskferry *(renamed)* | Flat / material |
| 10 | style-10-maximalist-riot-parade | Riot Parade | Maximalist |
| 11 | style-11-scroll-cinematic-halcyon-audio | Halcyon Audio | Cinematic scroll |
| 12 | style-12-interactive-3d-gemma-atelier | Gemma Atelier | Interactive 3D |
| 13 | style-13-restaurant-fiorella-trattoria | Trattoria Fioraliso *(renamed)* | Restaurant |
| 14 | style-14-ecommerce-wild-thread | Wild Thread | E-commerce |
| 15 | style-15-dashboard-beanline-ops | Beanwick Ops *(renamed)* | Dashboard |

Renamed brands were too close to an existing business with the same name in the same category. Each site's README explains its rename.

## One repository per site
These sites were built in a cloud session that could not create GitHub repositories, so they live here as folders. Each folder's history contains only its own commits (`feat: initial …` then `fix: accessibility and responsive polish`).

To turn every folder into its own **private** repository, with that history, on a machine where `gh auth status` succeeds:

```bash
bash style-sites/split-into-repos.sh --dry-run   # check: builds split/<site> branches, pushes nothing
bash style-sites/split-into-repos.sh             # creates 15 private repos and pushes each as main
```

The script never enables GitHub Pages, and it skips any repository name that already exists on your account.
