# Image slots

Flux has no photo slots: the cans are inline SVG (recoloured by the flavour variables) and the hero is a WebGL shader. That keeps the "page changes colour" idea working everywhere.

If you want **product photography**:

| Where | Element | Aspect ratio | Recommended size | Notes |
|---|---|---|---|---|
| Flavour hero can | `.flavours__can svg` | 120:220 (≈ 6:11) | 600 × 1100 px, transparent PNG/WebP | One image per flavour; swap `src` in the radio `change` handler. |
| Line-up cards | `.card .can` | 6:11 | 400 × 733 px, transparent | |

Use transparent cut-outs so the flavour gradients stay visible behind the cans. Keep real alt text (for example, "Can of Flux Berry Lift").
