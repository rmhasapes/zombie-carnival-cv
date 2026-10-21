# CV update · build 0.6.0

Choose **Calibrated CV / test mode** in the game’s Round panel, then click **Open CV setup & validation**. Complete the calibration and physical-test gate before a round can receive CV events. Start with [CV_GUIDE.md](CV_GUIDE.md) for calibration, diagnostics and optional test scoring. See [CV_TEST_RESULTS.md](CV_TEST_RESULTS.md) for verification limits.

# Zombie Carnival — animated pop-up prototype v0.5.0

A local game with six animated zombies, layered cover and a polished desert playfield, three-throw rounds, hit reactions, sound effects, a volunteer console and a separate HDMI projector window. This is a working prototype; automatic ball-contact scoring still needs physical testing.

## Launch

1. Install Python 3 if the computer does not already have it: https://www.python.org/downloads/ . No paid software is required for the game.
2. Extract the complete ZIP. Keep `assets` and `vendor` next to the HTML files.
3. On Windows, double-click `Start_Windows.bat`. On Mac, open Terminal in this folder and run `python3 server.py` (or use `Start_Mac.command` if macOS allows it). Alternatively run `python server.py` on Windows.
4. Open **the exact address printed by the launcher** in current desktop Chrome or Edge. Keep the terminal open. Do not launch the HTML directly: camera access and artwork loading require the local server.
5. Click **Start round**. Click a zombie to score; click empty space for a miss. By default each round gives three throws; a hit earns 100 points. Click **Reset** to return to the title screen.

The server binds only to the computer's loopback interface. The game, assets and libraries are included locally. Browser camera permission is required; camera frames are processed on the computer, not sent to a service. No donation payment processor is included. Collect donations separately using your existing method.

## Equipment and materials

| Item | Purpose | Low-budget approach |
| --- | --- | --- |
| Existing computer | Runs game and tracking | Mac or Windows with HDMI output or existing adapter |
| Existing projector + HDMI cable | Displays game | Extended desktop, preferably 16:9; dim ambient light |
| iPhone + compatible USB cable | Camera source | Use existing phone and cable; camera faces the screen |
| Stable phone mount | Keeps calibration fixed | Borrow a tripod or clamp; avoid handheld operation |
| Flat matte white surface | Ball contact and projection | Wall, board, or firmly tensioned existing screen approved for foam-ball impacts |
| Three brightly colored soft foam balls | Play objects | Same solid color; orange is the initial tracking preset |
| Tape, catch area and donation sign | Lane and event setup | Reuse available supplies; keep people and equipment out of the throw path |
| Volunteer | Starts rounds and confirms scores | Required for dependable fundraiser operation during prototype testing |

Plan roughly **$30–100 in additional supplies**, excluding equipment already owned. This is a planning allowance, not a vendor quote: list what you have before buying anything. A wrinkled sheet, moving screen or unstable phone makes calibration unreliable. Never throw hard balls at the projector or phone.

## iPhone camera to computer

The iPhone is a webcam source for the computer. The computer drives the projector through HDMI; there is no direct iPhone-to-projector connection in this version.

**Mac / Continuity Camera — wireless or USB:** Apple supports iPhone XR or later with iOS 16 or later and a Mac running macOS Ventura 13 or later. For wireless use, sign both devices into the same Apple Account with two-factor authentication; turn on Wi-Fi, Bluetooth and Continuity Camera; keep them within 10 m / 30 ft; mount the phone in landscape and lock it. Do not use AirPlay or Sidecar on the Mac. The iPhone should then appear in the browser's camera list—choose it in **CV setup & validation** and click **Connect**. USB remains an option for charging or recovery; trust the Mac if prompted. Close other apps using the phone camera. Source: [Apple Continuity Camera](https://support.apple.com/102546).

**Windows or another webcam route:** Install Camo on the iPhone and Camo Studio on the computer from https://camo.com/ . Connect by USB and follow the current Camo pairing instructions. Verify the phone picture in Camo Studio, then select its virtual camera in the browser's Camera tab. Use its free tier if it provides the resolution needed; premium effects are unnecessary. Source: https://camo.com/support/camo/camo-getting-started . This prototype does not include or configure Camo itself.

Calls, unlocking the phone, another app taking the camera, USB disconnects and exposure changes may interrupt tracking. The game pauses camera-mode rounds when the stream ends or frames stall. Check the feed before resuming.

## HDMI projection and calibration — in this order

1. Connect the projector over HDMI. Set the operating system to **extend** displays so the volunteer console stays on the computer.
2. Click **Open projector**, allow the popup, and move that window onto the projector display.
3. Click **Full screen** in the projector window before adjusting its geometry. The projector view contains the game alone; controls can be hidden with **Hide controls** and restored with **H**.
4. Click **Fit corners**. Drag the four mapped corners to the play surface. Turn fitting off when done. Shift+Space also toggles Maptastic's corner controls. Fitting is remembered only for the same window dimensions; resizing resets it.
5. Mount the iPhone so the entire play area is visible, close to the screen's normal axis where possible, but out of the throw lane. Connect the camera from the console.
6. In **Calibrate**, click **Calibrate camera**. Four numbered crosshairs appear on the projection. In the camera preview, click **1 top-left, 2 top-right, 3 bottom-right, 4 bottom-left**. These are the numbered marks inside the image, not the outer image corners.
7. Hold a ball against known points on the actual wall. Enable **Tracking marker** and verify the estimated location at center and edges. Select **Sample ball color** and click a bright part of the ball in the camera preview. Adjust tolerance and minimum size only enough to detect the ball while rejecting scenery.
8. Recalibrate after moving the phone, changing lens/zoom/capture resolution, moving the projector, altering corner fit or moving the screen. Saved camera calibration cannot detect every physical change: always verify it.

The camera calibration is a planar perspective mapping. It maps a ball accurately only near the calibrated wall plane; an airborne ball can appear at a different location. One camera cannot establish depth or prove contact.

## Scoring modes

| Mode | How it works | Recommended use |
| --- | --- | --- |
| Manual / click-to-play | Volunteer clicks the actual struck zombie or records a miss | Presentation, first rehearsal and dependable fundraiser fallback |
| Camera + attendant | Tracks ball color; volunteer presses Space at contact to submit its current estimated location | Trials after calibration; timing and parallax can still cause errors |
| Automatic / experimental | Estimates contact from trajectory reversal plus an apparent-size peak | Controlled experiments only until physical throws pass your tests |

Automatic mode is a heuristic, not a validated contact detector. It can miss a throw, count a near miss, follow the wrong similarly colored object, or fail when a hand/player hides the ball. Colored projected artwork can also interfere. There is no accuracy claim. Use manual scoring if it does not perform consistently.

Keyboard shortcuts: **Enter** start, **P** pause/resume, **R** reset, **Space** confirm calibrated tracked position, **M** record miss. Shortcuts are inactive while a form control is focused. Sound defaults off. **Export session** downloads event metadata and estimated points, not camera footage or player names.

## Fundraiser rehearsal

Try at least 20 known hits and 20 known misses spread across the wall, including different heights and lighting. Record duplicate scores, missed scores and incorrect locations. Compare the exported session with a volunteer's notes. This sample is a practical rehearsal, not statistical certification. Switch to manual input if errors would make guest scores unfair. Do a full round with an untrained volunteer before the event.

Suggested donation sign: **“[Selected number] throws. Six zombies. One desert carnival. Your donation supports [cause].”** Fill in your own donation amount and beneficiary. The prototype does not track money or issue receipts.

## What was tested

Software checks cover skewed four-point calibration, invalid calibration, duplicate-event prevention, three-throw scoring, pause and timeout, and contact-estimator logic. Browser checks exercise artwork loading, manual hit/miss scoring, the projector popup, synthetic tracking, a browser-simulated webcam and camera calibration. These checks do **not** validate a physical iPhone, projector or thrown-ball impact.

Developer checks: `node --test tests/*.test.js` using a current Node release. Node is unnecessary to play. No build step, CDN or npm installation is needed.

## Project files

`game.js` runs Phaser visuals and rounds; `perspective.js` schedules visual target appearances; `tracker.js` uses tracking.js for colored-ball blobs; `core.js` contains calibration, scoring and the experimental contact estimator; `app.js` runs the volunteer console; `projector.js` runs the clean output and Maptastic geometry fitting. `server.py` is the local launcher. `vendor` contains pinned libraries and licenses. See `CREDITS.md` and `ASSET_NOTES.md` before redistributing.

## Continuous rig animation update (0.5.0)

Character motion now uses separately drawn head, torso, hips, upper/lower arms and upper/lower legs on hierarchical joints. Joint angles are interpolated continuously at the game frame rate, rather than cycling full-character poses. The digging preparation alternates the arms, throws up dirt, bends the knees, lifts the torso and settles into an alert target stance. There are visible soil openings at ground spawn sites and masks for underground/covered body areas. Facial artwork remains fixed; this is 2D skeletal cutout animation, not a full 3D or hand-drawn television animation pipeline.

The six characters have newly drawn, dimensional cartoon parts. Cover now includes a footlocker, scrub-covered sandstone, drums and sacks, sandbags, a wrecked jeep front and detailed supply crates. Six cover positions and three open soil sites span far, middle and near ground planes. Nine spawn sites rotate between appearances and target height increases with apparent depth. Near cover also visually occludes farther characters. Each slot avoids another occupied site.

### Operator settings

| Difficulty | Maximum target slots | Digging preparation | Scoreable hit window |
| --- | --- | --- | --- |
| Easy | 3 | 2.25 seconds | 3.0 seconds |
| Normal | 2 | 1.95 seconds | 1.8 seconds |
| Hard | 2 | 1.65 seconds | 0.95 seconds |

Preparation is deliberately longer so guests can see where a zombie is emerging before the short scoring window opens. The character then retreats for 0.35 seconds and waits briefly before another appearance. The operator's difficulty setting takes effect immediately and reschedules active appearances without resetting scores or remaining throws.

**Throws per round** accepts any whole number from **1 to 20**, default **3**. The value applies on starting the next round. Changing the number during a round does not replenish throws. The round can still finish early if its timer expires. A zombie hit remains worth 100 points. You can reuse the same physical balls; the setting does not require buying twenty balls. The HUD and exported event counts reflect the selected throw count.

The optional jump-scare setting, Sound switch, manual/assisted/experimental scoring, iPhone capture, four-point calibration and HDMI fitting remain available. Jump scares do not consume throws. Continuous pose/appearance timing freezes when paused or calibrating. Physical camera contact accuracy is still unvalidated in this environment.

### Launch

Extract the complete ZIP into a new folder and use `Start_Mac.command` or `python3 server.py`. Open the exact address printed in Terminal; the footer should show **Build 0.5.0**. The startup repair from 0.4.1 is retained: free-port selection, package validation, explicit JavaScript MIME types, no-store caching and visible startup errors. A different address/port may require camera calibration again because browser storage is scoped to the address.
