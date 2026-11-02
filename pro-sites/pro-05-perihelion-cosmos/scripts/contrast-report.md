| Pair | Foreground | Background | Ratio | Target | Result |
|---|---|---|---|---|---|
| Text on space | `--text` #f0f5ff | `--bg` #030409 | 18.76:1 | 4.5:1 | pass |
| Muted text on space | `--text-muted` #9da2ab | `--bg` #030409 | 8.01:1 | 4.5:1 | pass |
| Text on HUD / card | `--text` #f0f5ff | `--surface` #020715 | 18.46:1 | 4.5:1 | pass |
| Muted text on HUD / card | `--text-muted` #9da2ab | `--surface` #020715 | 7.88:1 | 4.5:1 | pass |
| Gold readouts on HUD | `--accent` #dea83b | `--surface` #020715 | 9.36:1 | 4.5:1 | pass |
| Muted text on card over star glow (worst case) | `--text-muted` #9da2ab | `--surface` @86% over `--star` = #232121 | 6.28:1 | 4.5:1 | pass |
| Gold readout on HUD over star glow (worst case) | `--accent` #dea83b | `--surface` @86% over `--star` = #232121 | 7.45:1 | 4.5:1 | pass |
| Text on card over brightest planet limb | `--text` #f0f5ff | `--surface` @86% over `--planet-3-light` = #1a252e | 14.30:1 | 4.5:1 | pass |
| Button label on gold | `--accent-contrast` #030409 | `--accent` #dea83b | 9.50:1 | 4.5:1 | pass |
| Button label on gold (hover) | `--accent-contrast` #030409 | `--accent-strong` #edc16c | 12.10:1 | 4.5:1 | pass |
| Focus ring (UI) | `--focus` #dea83b | `--bg` #030409 | 9.50:1 | 3:1 | pass |
| Control outline (UI) | `--border-strong` #4e6ea8 | `--surface` #020715 | 3.95:1 | 3:1 | pass |
