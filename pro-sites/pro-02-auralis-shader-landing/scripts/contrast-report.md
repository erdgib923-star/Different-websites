| Pair | Foreground | Background | Ratio | Target | Result |
|---|---|---|---|---|---|
| Body text on page | `--text` #f5f6ff | `--bg` #080526 | 18.42:1 | 4.5:1 | pass |
| Muted text on page | `--text-muted` #a4a5af | `--bg` #080526 | 8.11:1 | 4.5:1 | pass |
| Body text on surface | `--text` #f5f6ff | `--surface` #18173d | 15.87:1 | 4.5:1 | pass |
| Muted text on surface | `--text-muted` #a4a5af | `--surface` #18173d | 6.98:1 | 4.5:1 | pass |
| Muted text on raised surface | `--text-muted` #a4a5af | `--surface-2` #2b2467 | 5.53:1 | 4.5:1 | pass |
| Text on glass over brightest aurora (teal) | `--text` #f5f6ff | `--glass` @84% over `--aurora-teal` = #1b3656 | 11.45:1 | 4.5:1 | pass |
| Muted text on glass over teal | `--text-muted` #a4a5af | `--glass` @84% over `--aurora-teal` = #1b3656 | 5.04:1 | 4.5:1 | pass |
| Muted text on glass over magenta | `--text-muted` #a4a5af | `--glass` @84% over `--aurora-magenta` = #3a2152 | 5.67:1 | 4.5:1 | pass |
| Large hero headline over brightest shader colour | `--text` #f5f6ff | `--aurora-cap` #009a9a | 3.22:1 | 3:1 | pass |
| Hero body copy on its scrim over brightest shader colour | `--text` #f5f6ff | `--bg` @55% over `--aurora-cap` = #04485a | 9.41:1 | 4.5:1 | pass |
| Amber labels on page | `--accent` #f7b65d | `--bg` #080526 | 11.15:1 | 4.5:1 | pass |
| CTA label on amber | `--accent-contrast` #080526 | `--accent` #f7b65d | 11.15:1 | 4.5:1 | pass |
| CTA label on amber (hover) | `--accent-contrast` #080526 | `--accent-strong` #ffd59c | 14.36:1 | 4.5:1 | pass |
| Focus ring (UI) | `--focus` #f7b65d | `--bg` #080526 | 11.15:1 | 3:1 | pass |
| Control outlines (UI) | `--border-strong` #6c5ada | `--bg` #080526 | 3.89:1 | 3:1 | pass |
| Control outlines on surface (UI) | `--border-strong` #6c5ada | `--surface` #18173d | 3.35:1 | 3:1 | pass |
