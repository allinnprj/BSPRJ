# Project Readiness Progress

## Purpose

This file defines how to estimate the overall project readiness percentage.
The percentage is not a reward for activity. It is a cautious expert estimate of how close the whole target system is to an autonomous noise-monitoring platform, not only how mature the current microphone prototype is.

## Scope

- The percentage refers to the whole target project, not only the current task or microphone subsystem.
- The target includes trustworthy noise measurement, real-world dB calibration, `DAY / EVE / NGT` conclusions, and usable `SILENT / NORMAL / LOUD / PEAK` interpretation.
- It also includes communication with the solar-charge controller, shared-power integration, GPS, GSM/mobile connectivity, autonomous operation, final hardware integration, and end-to-end field validation.
- A subsystem may be considered complete without implying that the whole project is close to completion.

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

- Track readiness by subsystem, with a short statement of validated evidence and remaining work for each subsystem.
- Subsystem names may be renamed, split, or merged as the architecture evolves, but preserve the history and reasoning behind material percentage changes.
- Raise a subsystem percentage only after confirmed progress in that subsystem. Code completion without relevant build, device, integration, or field validation is not automatically sufficient.
- The overall percentage is a weighted expert estimate. It must account for subsystem importance, dependencies, integration risk, and final validation; it is not the arithmetic mean of subsystem percentages.
- After a completed task, report the affected subsystem percentages and the overall percentage. Provide the full subsystem table when requested or after a major milestone.
- Change the percentage only when there is confirmed project-level progress.
- Finding a cause is not enough by itself; the fix must be validated on the device or in the relevant field test.
- If a hidden blocker is found, the percentage can stay unchanged or go down.
- Build success alone usually does not raise readiness unless the built change directly closes a project risk and is confirmed where it matters.
- Use cautious estimates when data is incomplete, and briefly say why.
- Avoid automatic upward drift. A useful diagnostic step can be important without increasing readiness.

## Current Baseline

- Current whole-project readiness estimate: `38%`.

| Subsystem | Readiness | Confirmed state | Main remaining work |
| --- | ---: | --- | --- |
| Microphone and mechanical assembly | `80%` | Protected external `INMP441` passed a multi-day build `109` field run with clear day-part separation and stable signal. Hardware geometry is accepted and will remain unchanged. | Controlled reference events and later confirmation that dB calibration works across the useful range. |
| Relative sound statistics and classification | `60%` | Clean logs support preliminary `SILENT / NORMAL / LOUD / PEAK` boundaries and build `110` implements the accepted `P2P` thresholds in firmware and Google Sheets summary logic. Build validation passed, but device/cloud output is not field-validated yet. | Deploy build `110`, deploy the updated Apps Script if cloud summaries are needed, then validate that MQTT/Datacake, local logs, and Sheets summaries classify real windows correctly. |
| Real dB calibration | `0%` | A reference sound-level meter is available, but no calibration dataset or conversion model has been accepted. | Define the calibration protocol, collect paired readings, choose the appropriate acoustic metric and weighting limitations, implement and validate the model. |
| INA3221 and solar battery charging | `30%` | A separate `ESP32-S3 + INA3221` controller exists and operates in its own test project on the shared supply. | Finish its charging/sleep/reliability logic and validate solar charge/discharge behavior independently. This percentage is partly based on user-reported progress from the separate project. |
| Communication between controllers | `0%` | Required architecture is known, but no accepted inter-controller data contract or validated link exists in this project. | Select the physical/protocol link, define messages and failure behavior, implement and test both sides. |
| GPS and location/time context | `5%` | GPS is a defined next subsystem and separate exploratory work exists, but it is not integrated into this controller. | Connect, parse, validate location/time, define logging fields, and integrate without disturbing audio sampling. |
| GSM/mobile connectivity | `0%` | Required future subsystem only. | Select/finalize the module and power path, implement connectivity and recovery, then validate network behavior and power demand. |
| Shared power and autonomous operation | `25%` | Battery operation and shared-power field behavior have been observed, and power-related gaps can be distinguished in logs. | Stabilize battery/charging contacts and transitions, prove operation with both controllers, manage GSM current peaks, and complete long autonomous testing. |
| Core firmware, logging, OTA, and health diagnostics | `75%` | Build `109`, local CSV, Google Sheets diagnostics, Telegram online reporting, SHT31 health fields, and OTA are working on the real device. | Finalize level semantics, investigate remaining power-adjacent `WDT`, harden recovery paths, and adapt telemetry for GPS/GSM/integration. |
| Permanent assembly and end-to-end field validation | `10%` | Current breadboard system has accumulated useful field evidence inside the enclosure. | Replace temporary contacts where required, complete integrated assembly, weather/power validation, and final multi-day acceptance test. |

The overall estimate remains `38%`: the microphone path and core diagnostics are relatively mature, but dB calibration, controller communication, GPS, GSM, reliable autonomous power, permanent assembly, and complete system validation are still substantial dependencies.
