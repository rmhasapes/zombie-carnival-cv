# Excavation emergence

`excavation.js` adds a procedural, reusable ground-breakthrough rig. It deliberately does not crop the supplied reference board: labels, adjacent art and opaque backgrounds make it unsuitable as a production atlas.

Rendering order per target is: background terrain → crack/interior/rear rim (`ExcavationRig.back`) → existing articulated zombie rig → foreground dirt rim (`ExcavationRig.front`) → ballistic clumps and expanding dust (`ExcavationRig.particles`). Existing cover remains in its ground-plane depth layer and continues to mask body portions.

`EMERGENCE` exposes the intended tuning surface: `duration`, per-stage `stages`, `dirtIntensity`, `particleDensity`, `dustOpacity`, `crackIntensity`, `variation`, and `quality`. Stages are disturbance, rupture, hands, upper body, climb, recovery. The existing `ZombieRig` remains the character renderer; its joint pose is driven by `emergencePose()` and returns to `rigPose()` after recovery.

The head now breaks the surface before hands, shoulders, and legs. Ground-emergence targets remain stationary at their excavation sites, keeping the excavation mask and foreground rim aligned. Fast lateral motion is reserved for separate bonus zombies, which cross the screen outside the excavation system. Their hitboxes follow their current position. A throw resolves every eligible overlapping hitbox (manual and timestamped CV inputs), consumes one ball, and awards each hit target separately.

Particles are lightweight pooled records rendered in one graphics object per target. Clumps use gravity, ground bounce and settling; dust expands, drifts upward and fades. Events emit only on stage transitions, not continuously.

Limitations: the game remains a 2D skeletal-cutout renderer, so hand placement is pose-driven rather than full inverse kinematics; soil is procedural geometry rather than a bitmap asset pack.
