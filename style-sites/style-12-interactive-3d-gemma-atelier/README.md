# Gemma Atelier — interactive 3D demo site

> **Gemma Atelier is a fictional jewelry studio.** Address, prices, process details and contact details are invented (example.com, 555-0100).

## Brand concept
A small workshop that cuts, sets and finishes only three stones: emerald, sapphire and ruby. The hero lets you turn a cut stone and switch between the three. That is the whole pitch: the facets are the craft.

## Style notes
- **Palette:** velvet `#16120F`, ivory `#F3EDE4` / `#B9AE9F`, gold `#CDAE6E` (all at least 8.5:1). Stone colours: emerald, sapphire and ruby.
- **Type:** Cormorant Garamond for display, Jost for text.
- **Three.js gem (r128, cdnjs):**
  - **Procedural geometry:** a brilliant-cut profile (table → crown → girdle → pavilion → culet) spun with `LatheGeometry` at 16 segments. That is **256 triangles**, measured with `renderer.info`. No model files.
  - **Material and lighting:** `MeshPhysicalMaterial` with clearcoat and flat shading, a warm key light, a cool rim light, and two orbiting point lights for sparkle.
  - **Interaction:** the stone tilts toward the pointer and spins when you drag (touch included; `touch-action: pan-y` keeps vertical page scrolling). The stone selector recolours it.
  - **Lazy loading:** Three.js is fetched only when WebGL is available *and* the stage is within 200px of the viewport (IntersectionObserver).
  - **Pausing:** the render loop stops when the stage leaves the viewport or the tab is hidden, and restarts when it comes back.
  - **Static fallback:** a CSS-drawn faceted gem (`clip-path` + gradients) is shown without WebGL or JavaScript. The stone selector still recolours it.
  - **Reduced motion:** a single static frame with no auto-rotation. The stone selector and pointer tilt still re-render on demand.
- **Three feature sections:** the cut, the stones, made to measure. They use alternating asymmetric layouts, with clearly marked photo placeholders.
- **gsap-scroll:** the hero gem shrinks and lifts as the hero scrolls away (ScrollTrigger scrub feeds a value into the render loop), and the feature sections reveal once. Nothing is hidden without JavaScript.

## Skills used
- `frontend-design`: design plan, copy.
- `3d-web-experience`: vanilla Three.js chosen (no React), low-poly procedural model, static fallback, loading only when needed.
- `gsap-scroll`: ScrollTrigger scrub and reveal recipes.

## How to run
Open `index.html` in a browser. Three.js and GSAP load from cdnjs; offline, you see the CSS gem.

## How to change colours and copy
- Page tokens are at the top of `styles.css`. Stone colours for the 3D gem are the `STONES` map in `script.js`; for the CSS fallback they are `--g1` / `--g2` / `--g3` in `styles.css`.
- The cut profile is the `profile` array in `script.js` (radius, height pairs). The number of facets around is the second argument to `LatheGeometry`.

## Verification
Tested in headless Chromium with SwiftShader WebGL:
- the gem rendered (256 triangles, no console errors);
- rendering paused when scrolled off screen and resumed on return;
- with WebGL disabled, Three.js was never requested and the CSS gem stayed;
- with reduced motion, the loop was not running.

SwiftShader is a software renderer, so real-GPU performance on phones was **not** measured.
