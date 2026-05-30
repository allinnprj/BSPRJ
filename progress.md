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

- Current readiness estimate: `62%`.
- Reason: build `108` remains OTA-serviceable, and the protected external-microphone construction completed a useful battery balcony run with `191` local measurement windows. Outside known manual battery interruptions, the local timeline is complete; all windows report `signal=OK`, and SHT31 produced no failed samples or recovery events. The estimate stays cautious because the new physical microphone geometry needs percent-scale retuning, persisted `M` needs a deliberate re-baseline, final `SILENT / NORMAL / LOUD / PEAK` thresholds still need validation, and battery/runtime behavior remains part of the field-test stage.
