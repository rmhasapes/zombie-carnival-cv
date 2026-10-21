# Rig artwork and animation provenance

Built-in ImageGen created six transparent character-parts atlases: `assets/rig-0.png` through `assets/rig-5.png`, plus `assets/detailed-cover.png`. Runtime rectangles are in `rig-frames.json` and `prop-frames.json`. Each rig atlas includes eight body components; mirrored limbs reuse the same corresponding part.

The game loads `assets/rig-muted-0.png` through `assets/rig-muted-5.png`. These CV-safe variants lower target saturation while preserving the source atlases' exact alpha geometry, frame positions, and rig joints. Regenerate all six with `node tools/make-cv-safe-rigs.js`. The original atlases remain unchanged.

Prompt set: one cartoon zombie identity per transparent 4-column / 2-row parts atlas; ordered head, torso, pelvis, upper arm, forearm/hand, thigh, shin/boot, extra claw; consistent front-three-quarter orientation, overlapping joints, refined dimensional cartoon shading, mild decay, no text or graphic wounds. Identities: crawler, drifter, hazmat, tank, nomad, wildcard Marine. Cover prompt: isolated detailed footlocker, sandstone/scrub, drums/sack, sandbag nest, wrecked jeep and supply crates in a transparent 3×2 atlas, warm desert light and cool shadows.

Alpha-component bounds and source-rectangle insets select the parts and conceal the cut-plane artwork around joints. No image pixels were edited with Python. `rig.js` animates hierarchical joints continuously. Motion is procedural, not motion capture; facial art is static. The result is an articulated 2D cutout prototype and is not claimed to equal a hand-authored TV production.
