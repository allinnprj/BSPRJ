# Project Readiness Progress

## Purpose

This file defines how to estimate the overall project readiness percentage.
The percentage is not a reward for activity. It is a cautious expert estimate of how close the current prototype is to the project goal: trustworthy single-device noise monitoring with useful day-part conclusions.

## Scope

- The percentage refers to the whole current prototype goal, not the current task.
- The main goal is trustworthy `DAY / EVE / NGT` noise conclusions with usable `SILENT / NORMAL / LOUD / PEAK` interpretation.
- Future expansion ideas such as GPS, mobile network, mapping, and multi-device analytics do not raise the current readiness unless they directly improve the current prototype goal.

## Evidence To Consider

- Current `memory.md` state and next steps.
- `CHANGELOG.md` entries and whether they were validated on the real device.
- `PROJECT_TASKS.md` critical and important open work.
- Actual field tests, especially battery-powered balcony runs.
- Local CSV log quality, archive/download usability, and analysis usefulness.
- Sensor reliability, including SHT31 availability and recovery behavior.
- OTA/serviceability only after a real OTA upload succeeds end-to-end.
- Known risks, hidden blockers, and unverified assumptions.

## Update Rules

- Change the percentage only when there is confirmed project-level progress.
- Finding a cause is not enough by itself; the fix must be validated on the device or in the relevant field test.
- If a hidden blocker is found, the percentage can stay unchanged or go down.
- Build success alone usually does not raise readiness unless the built change directly closes a project risk and is confirmed where it matters.
- Use cautious estimates when data is incomplete, and briefly say why.
- Avoid automatic upward drift. A useful diagnostic step can be important without increasing readiness.

## Current Baseline

- Current readiness estimate: `72%`.
- Reason: build `109` / `acoustic_rev=2` completed a multi-day final field run with `654` unique final-run measurement windows after deduplicating the log package. Known data gaps align with user-reported battery or charging interventions, while the 2026-06-02 and 2026-06-03 `Device Online` events are confirmed scheduled soft restarts. All final-run windows report `signal=OK`; SHT31 has `env_fail_count=0`; heap and Wi-Fi evidence do not show systemic instability. The protected external INMP441 construction now has enough evidence to close the microphone/mechanical stage and use preliminary relative `SILENT / NORMAL / LOUD / PEAK` thresholds. The estimate remains below a higher readiness level because autonomous power continuity is still the main field risk, one `WDT` restart occurred adjacent to a known battery/charging gap, and the thresholds are still relative rather than calibrated dB.
