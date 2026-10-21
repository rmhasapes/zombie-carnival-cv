# Continuous rig build verification

Core and presentation checks: existing camera mapping and scoring invariants, continuous joint-pose changes, staged underground-to-standing motion, ground/cover hitbox clipping, difficulty caps/windows/site rotation, custom five-throw round completion, and rejection of non-integer/out-of-range throw settings.

Browser integration: rig parts loaded; 5-throw operator setting started with five throws; live difficulty caps and short scoring windows worked; cover was excluded from hit geometry; animation froze on pause; jump scares consumed no throws and could be disabled; five events completed a 100-point round; projector window, synthetic input, browser-simulated camera and four-point calibration worked; narrow layout had no horizontal overflow; no script errors.

Camera processing and projection/calibration code are retained. Round logic changes only to validate and apply the selected throw count. Physical iPhone/projector/ball impacts are not tested here. Inspect the included actual game recording to judge animation quality; fixed faces and visible 2D rig limitations remain.
