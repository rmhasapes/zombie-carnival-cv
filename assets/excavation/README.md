# Procedural excavation asset set

The excavation system intentionally uses procedural alpha-rendered primitives instead of extracting pixels from the supplied reference sheet. The source board includes titles, adjacent imagery and opaque scenery, so cropping it would leave rectangular artifacts and would not be reusable at different depths.

`../../excavation.js` supplies reusable equivalents at runtime:

- crack spokes with randomized reach and opacity;
- an irregular elliptical interior shadow/opening;
- rear and foreground soil rims with raised clumps;
- ballistic dirt/rock clumps with alpha;
- expanding, fading dust puffs with alpha.

All geometry is drawn at the target's `footY` / cover clip plane, scaled from its apparent height, and uses the desert palette already established by the game. The graphics objects are allocated once per active target and reused across every animation frame.
