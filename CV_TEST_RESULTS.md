# Build 0.6.0 verification · 2026-09-30

## Completed

- 28/28 automated Node tests passed, including the 11 original game/core/rig/perspective tests.
- Variable-interval Kalman velocity/radius estimation, covariance and outlier rejection checked.
- Both approach directions, rebounds, airborne crossings, stationary input, jitter, prediction-only rejection, gaps, unique frames and duplicate suppression checked.
- Contour detector tested against noisy circles, wrong hue, rings and streaks.
- Interior validation tested independently of the four fitting points; inaccurate maps and unstable wall samples rejected.
- Frame pump tested for repeated media frames, capture-clock fallback, busy-frame dropping and disposal after stop.
- Historical target movement, cover occlusion, blocked frames, round boundaries, stale/paused events and expired target hits checked.
- Manual throw regression verified: the selected target animates once, one throw is consumed and score is awarded once.
- New and changed JavaScript passed syntax checks.
- Extracted ZIP startup, every required asset response, JavaScript MIME types, no-cache headers and Mac launcher executable metadata passed.
- Static HTML/JavaScript ID wiring passed; preserved file hashes verified. These checks do not establish browser UI behavior.

## Outstanding

Chromium downloaded successfully, but browser startup failed with `socket() failed: Operation not permitted` in this execution environment. The Playwright workflow could not run. Browser UI, live OffscreenCanvas/camera integration and visual/responsive behavior therefore remain unverified. A browser workflow script is included under development/ for running on a computer that supports Chromium/Playwright.

No physical iPhone, actual HDMI projector alignment, actual ball impacts, accuracy-rate measurements or latency measurements were tested here. Synthetic Node tests do not establish real-world reliability.

The earlier TEST_RESULTS.md reports the original v5 tests and should not be interpreted as verification of the new CV modules.
