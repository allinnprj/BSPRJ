# BSPRJ defense presentation

## Current version

[BSPRJ_Akustik_Monitorinq_AZ_15_Technical_Final.pptx](output/BSPRJ_Akustik_Monitorinq_AZ_15_Technical_Final.pptx) is the latest approved deck: 15 Azerbaijani slides, with speaker notes totaling 9 minutes 25 seconds.

It includes the project purpose, practical uses, actual prototype and tester photographs, original schematics, calibration limits, historical DAY/EVE/NGT evidence, Telegram examples, a future Android design concept and a future project website. Concept illustrations are not evidence of manufactured hardware or deployed software. Relative web-panel values are not dB(A).

## Contents

- `output/`: delivered versions and source/background assets with prompts and attribution records.
- `build/`: authoring scripts, source images, slide previews, validation reports and intermediate decks.
- `.chart-data-*`: intermediate chart-validation snapshots and candidate decks, retained at the user's request.
- `PRESENTATION_REVISION_PLAN.md`: recorded revision plan; subsequent implementation is described in the project changelog.

Earlier decks and intermediate materials are intentionally retained. Use the current version linked above for the defense.

## Verification and reproduction

Run `python presentation_work/build/verify-technical.py` from the repository root to verify slide/notes counts, speaker timing, original image preservation and package validation status. The latest deck has 15 slides, 15 notes and 565 seconds of speaker timing.

Authoring uses Node.js, `@oai/artifact-tool` and the Codex Presentations skill. `build/build-v8.mjs` contains workstation-specific runtime/skill paths; adapt them when rebuilding on another computer. Export and QA scripts are retained as working materials, not a standalone portable build system.

Native PowerPoint playback remains unverified. Firmware installation, cloud deployment and physical autonomous operation are separate acceptance gates. Project firmware remains local 0.1.107-EXP build 161, with installation unconfirmed; overall readiness remains 60%.
