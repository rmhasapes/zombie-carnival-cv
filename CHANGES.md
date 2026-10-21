# Changes from v5

Added `cv-lab.html`, `cv/` modules, calibration/tracking/scoring-adapter tests and updated documentation.

Preserved byte-for-byte: rig.js, perspective.js, core.js, tracker.js, projector.js/projector.html, style.css, all runtime artwork, vendor code/licenses, launcher scripts and original tests. The original game camera estimator is unchanged.

Small integration edits:
- index.html: lab button and build labels.
- app.js: isolated adapter import/instance and opener button; old camera stops when entering the lab.
- game.js: generic historical collision entry point and shared throw effects/scoring method; a set of defeated target IDs prevents duplicate historical awards. No animation/scene/update logic was changed.
- boot.js: build query label.
- server.py: build label and completeness checks for the CV modules.
- package.json: build version and description.
- README.md: link to the CV guide; existing v5 setup remains below it.

PRESERVATION.json lists unchanged file hashes. The adapter is off until the lab operator opts into test scoring after calibration and physical checks.
