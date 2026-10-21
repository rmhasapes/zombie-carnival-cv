# Zombie Carnival CV Lab 2 · build 0.6.0

Launch the complete extracted folder using **Start_Mac.command** or `python3 server.py`. Click **Projectile CV lab** in the game footer. This opens the lab with the game as its opener, allowing the optional test-scoring connection. No new Python packages or sensors are needed for play. Node is needed only for developer tests and offline measurement replay.

## What changed

The existing Phaser game remains the renderer and owner of score, throws, hitboxes, difficulty, props and zombie animation. The new CV system is implemented in separate modules. The old v5 camera modes remain separate: the game's existing **Experimental automatic hits** option still runs its old estimator and is not the new lab.

The original game sources were inspected before editing. The missing first CV-lab deliverable was rebuilt alongside the available v5 project, incorporating the source-review findings. No claim is made that the earlier lab's missing files were recovered.

| Improvement | Implementation |
|---|---|
| Ball geometry | HSV segmentation, mask opening/closing, connected-component boundaries, circularity, outline variation, area/radius consistency |
| Motion estimation | Six-state Kalman filter: x, y, radius, vx, vy, radius velocity; real frame intervals; innovation gating and covariance |
| Rebound handling | Bounded radius-velocity uncertainty adjustment near an existing impact candidate so a real reversal is not discarded as an outlier |
| Calibration | Existing four-point homography solver; five independent interior check points; nine wall-radius points; bilinear interpolation |
| Camera timing | Unique frame IDs; captureTime when supplied by browser; otherwise mediaTime on an anchored page clock; repeated/out-of-order frames rejected |
| Processing isolation | OffscreenCanvas in a module worker; one bitmap in flight; busy frames dropped; stall watchdog |
| Game adapter | Immutable target/cover snapshots, round and jump-scare guards, impact-time collision resolution and event deduplication; off by default |

Contour circularity and confidence are approximate engineering quality scores. They are not calibrated probabilities of contact. The grid-edge perimeter correction and median-boundary radius are original JavaScript implementations; OpenCV code is not bundled.

## Setup sequence

1. Connect the HDMI projector and make the iPhone available to the computer as a webcam using your existing setup. The app does not itself stream the iPhone. Mount it securely with a clear view of the wall. Stop the older camera feed; opening the lab from the game also stops it.
2. Connect the camera in the lab. Select a requested rate of 30, 60 or 120 fps. The status reports the negotiated camera rate, while diagnostics report processed rate and busy-frame drops. A requested high rate is not guaranteed, and requestVideoFrameCallback can still be limited by browser/display scheduling. No image analysis runs on the game's render thread.
3. Use **Monitored zoom** to crop the centered camera region before the preview, color picker, calibration, and detector. This excludes peripheral movement from analysis. Frame the wall so the monitored area still contains every calibration mark, then set the zoom before mapping. Any zoom change clears calibration and saved calibration only reloads at the same zoom.

When reopening CV setup, the saved zoom and crop position are restored automatically before connecting. Keep the same camera, projection placement, and monitored view; after connecting, use **Verify saved alignment** before enabling test scoring.

In the assisted-camera panel, **Crop position** moves that zoomed monitored region horizontally and vertically. This is useful when the wall is not centered in the camera frame. The crop is applied before display, color sampling, calibration, and tracking; any position change requires recalibration.
3. Open **HDMI calibration**, move the window to the projector, enter fullscreen, fit it, and hide tools. Finish projection changes before camera calibration. Use this single HDMI window throughout calibration and test scoring. The calibration surface is a frozen capture of the actual Zombie Carnival scene so projected brightness and color spill resemble gameplay; use **Refresh game scene** if the preview was captured too early. Changes to projector fit invalidate the lab calibration and the opener game's saved camera alignment.
4. Click **Pick ball color**, then click a saturated region of the actual ball in the camera preview while the game-lit calibration scene is projected. Choose a distinctive ball color that does not appear prominently in the projection or scene.
5. Click **Map corners**. Click the four numbered projected marks in the camera preview, in top-left, top-right, bottom-right, bottom-left order.
6. Click **Validate interior**. Five independent marks appear one at a time. Click each highlighted mark in the camera preview. All five must map within 20 game pixels of their intended positions. These marks are not used to fit the homography. If validation fails, remap corners and repeat; do not try to pass by intentionally clicking elsewhere.
7. Hold the actual ball against highlighted wall mark 1 and click **Auto-capture 9 points** once. Keep the full outline stationary until 20 accepted observations are collected. A success message confirms the point and automatically highlights and arms the next one; move the ball to that mark and repeat without clicking again. Point 9 completes and saves calibration. The active marker is a hollow segmented bracket so the representative game background continues to illuminate the ball center. Each point records radius, diameter, median center and robust radius variability.
8. Choose **Shrinks toward wall** for a camera behind the player facing the wall. Choose **Grows toward wall** only if that is what your actual placement produces. Size direction is camera-dependent, not universal.
9. Test throws and non-impacts while watching the camera and projection overlays. Export a session for tuning. A completed CV calibration is saved locally for the same browser address, camera label and capture dimensions. On the next launch it loads automatically and offers **Verify saved alignment**; use that check whenever the camera, projector, wall or zoom might have moved. The program cannot sense a physical bump, so a passed old calibration is not proof the setup remains aligned. Detector-geometry or projector changes clear the saved calibration. Changes turn test scoring off.

The calibrated region covers 10–90% of each game dimension. The outer border is deliberately excluded; the radius field does not extrapolate. Use the outlined region for tests.

## Impact estimate

The detector supplies ball centers and radii in a 640×360 analysis image. The Kalman model estimates motion using capture intervals and reports covariance. Radius evidence is normalized against expected wall size at the mapped location. A throw must approach from beyond the plane tolerance, provide multiple approaching measurements, produce a near-plane candidate, and then show multiple departing measurements. Predictions alone, a stationary near-wall object, or 2D target overlap cannot trigger a new event.

Tracking uses confidence hysteresis: a new track must meet the configured confidence threshold, while an established track may continue through moderately weaker contours. This reduces flicker from projector illumination and motion blur without allowing weak blobs to acquire a track. Wall-radius capture uses the same continuation floor while retaining position, stability, full-outline, and 20-frame checks.

After an event the tracker locks. Cooldown alone cannot rearm it: it must also lose qualifying detections for the lost timeout. Occlusion can look like loss; this is another reason to test repeated bounces and hand interference physically.

A ball reversal near the wall can imitate an impact. Radius calibration does not provide complete 3D camera geometry. This build does not implement lens-distortion correction, automatic ArUco/chessboard detection, a physical depth measurement, or ballistic reconstruction. Those are future improvements. No claim of reliable physical contact detection is made without a real test session.

Stopping or temporarily losing the camera now disables scoring but preserves a completed calibration in memory and local storage. Reconnect the matching camera and verify alignment. A different camera, resolution, crop, zoom, projector fit, or explicit **Clear calibration** still invalidates the active mapping.

## Timing limitations

When `captureTime` is available, it is used as the event clock. If missing, `mediaTime` is anchored to the page clock; this preserves frame spacing but cannot remove unknown camera/Continuity Camera latency. The diagnostics and JSON log identify the clock used. Consequently, historical hitbox timing with that fallback is approximate.

The adapter stores 1.2 seconds of hitboxes, uses the snapshot immediately preceding the impact, and rejects gaps over 60 ms. This gives frame-level collision timing rather than continuous interpolation. Events older than 400 ms, from another round, during blocked/calibration/scare snapshots, or delivered while paused/complete are rejected. A contact just before the round ends may therefore be rejected if confirmation arrives after completion.

## Optional test scoring

Scoring is off by default. First check physical throws and non-impacts at the actual installation. With calibration complete, check **I have checked real throws and non-impacts**, then enable **Send impacts to the opener game (test mode)**. This is an operator attestation, not an automatically established accuracy result.

Start a round in the opener game. The existing HDMI calibration window now displays the opener's live game canvas using the same projector warp. The lab's own preview retains its diagnostic grid. Disable the checkbox to return HDMI to calibration view. Keep the game page and lab open. Changing configuration, stopping the camera, or closing the lab disables the adapter.

`cv/game-adapter.js` translates timestamps between pages using their performance time origins. It checks historical target and cover geometry before calling the game's generic `throwResolved()` method. Scoring never imports the ball detector or tracker. If a zombie has already left the scene, a valid past hit can award points without animating or harming its replacement. Target IDs prevent awarding the same defeated zombie twice.

The original `throwAt()` path still resolves current hitboxes and uses the same shared scoring/effect method. Throw limits, pause, timeouts and round event deduplication remain owned by `Round`.

## Export and replay

**Export session JSON** saves calibration, configuration, clock information, measurements, filter diagnostics and estimated events. Logs are bounded to the latest 12,000 processed frames and 2,000 events; export each test group to avoid truncation. Raw footage is not recorded or uploaded.

Run offline measurement replay with:

```bash
node cv/replay.mjs /path/to/zombie-cv-session-v2.json
```

This replays recorded detections through the tracker; it does not rerun image segmentation. Detector comparisons require video recordings supplied separately. Events expose `id`, `timestamp`, game-pixel `x/y`, analysis-pixel camera position/velocity, confidence, uncertainty and `estimated: true`.

## Physical acceptance procedure

Record actual contacts and locations independently, alongside the exported session. Test at least ten true impacts at each of the nine wall locations, including intended player distances and slow/normal/fast throws. Also test airborne crossings, held balls, floor bounces, repeated rebounds, hand occlusion and matching colors in the projection. Include at least 100 non-impacts.

Suggested trial gate: no duplicate or false-impact events in that test set, at least 95% true-impact detection, and mapped error comfortably smaller than the smallest active zombie hitbox. Measure detection latency and examine failures before using automatic scores for guests. These are proposed criteria, not achieved measurements. Repeat after lighting, ball or camera geometry changes.

## Source review and architecture boundaries

Source snapshots inspected on 2026-09-30:

- [Balloon Pop Game](https://github.com/nachman8/balloon-pop-game/tree/efce4c8062dab53edbe22e7c3c0cc2ef3c2bcecd): CalibrationWizard.py, main.py, Kalman_filter.py, and game.py. Its five-position radius-match scoring rejects direction changes; it does not confirm approach/rebound contact. Useful concepts: morphology, contour geometry and state estimation. Fixed 30 fps filter timing and radius-region coordinate inconsistency were not adopted.
- [OpenTarget-Core](https://github.com/JSK-Project/OpenTarget-Core/tree/d35040d1e439a15dd3aa633330f320753bf8f089): hardware/calibration.py, camera_manager.py and laser_platform.py. Useful concepts: stable calibration, event IDs, monotonic timestamps, metadata and observation clustering. ArUco auto-calibration and laser detection were not imported.
- [InteractiveProjectionLib](https://github.com/alvesmaicon/InteractiveProjectionLib/tree/58ecff3b8cc8293ebd26c3bf307f5d3d9c339567): InteractiveProjection.cpp/.hpp and sample.cpp. Useful concept: calibration with independent correspondences. Its “undistort” is a homography warp, not intrinsic lens correction; fingertip/region overlap cannot prove projectile contact.
- [InteractiveProjector-CameraGame](https://github.com/Jitenrai21/InteractiveProjector-CameraGame/tree/7557df5984ff2350ac6f2eefcef749df449677be): capture/inference/state/calibration modules and main_threaded.py. Useful concepts: processing isolation, bounded buffers and freshness checks. Repeatable frame reads, processing-time timestamps, inverse-coordinate conversion after warping, and detection-to-click logic were not adopted.

All new CV code is original; these repositories were reviewed for concepts, not copied into the delivery. Existing vendor licenses remain included. See CHANGES.md and CV_TEST_RESULTS.md for preservation and verification details.
