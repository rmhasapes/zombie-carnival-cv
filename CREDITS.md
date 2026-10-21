# Credits, licenses and reference builds — desert update

This prototype combines newly written game/console/tracking integration code with the following bundled open-source libraries. Their original license files are included and must travel with redistribution.

| Component | Pinned version | Repository | License / actual reuse |
| --- | --- | --- | --- |
| Phaser | 3.90.0 | https://github.com/phaserjs/phaser | MIT; rendering, scenes, tweens, input, scaling |
| tracking.js | 1.1.3 | https://github.com/eduardolundgren/tracking.js | BSD-3-Clause; custom-color blob extraction |
| Maptastic | 3.0.0 | https://github.com/glowbox/maptasticjs | MIT; four-corner CSS projection warping |

`vendor/manifest.json` records package versions and registry integrity identifiers. The package contains browser bundles so guests do not need a live CDN connection. Phaser 3 is intentionally pinned to match the APIs implemented here; this does not claim to be the latest major release.

Related build researched: **FLOAT**, https://github.com/smmankad/float , combines a projector and webcam for wall interaction. It is an older Processing project under GPL-3.0. It informed the architecture discussion only; none of its source code or artwork was copied or bundled. This build does not claim to port or reproduce FLOAT's detection.

Artwork is newly generated from the user-supplied desert carnival reference for this update, not downloaded from those repositories. See `ASSET_NOTES.md`. No third-party music, commercial game sprites or copyrighted character likenesses are included. Sound effects are synthesized at runtime. Original project-specific source is made available under the MIT license in `LICENSE.txt`; bundled libraries retain their own licenses. Generated artwork provenance is described separately and is not a warranty of exclusive ownership.
