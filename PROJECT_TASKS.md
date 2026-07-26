# PROJECT TASKS

## Project Identity

- Active project name: `BSPRJ`.
- Repository: `https://github.com/allinnprj/BSPRJ`.
- Branch model: `main` is release/stable, `devlop` is test/development.
- `BSPRJ` is the active project name; new work belongs in `BSPRJ`.
- `zaexp` is an old isolated microphone test and is not part of active `BSPRJ` planning.

## Priority Rule

- Finish the complete sound path first: reliable relative P2P analytics, diagnostics, reporting, and real dB calibration.
- Only after the sound acceptance gate is closed, continue with solar power, controller communication, GPS, GSM, permanent assembly, and final integrated validation.
- Keep `ECO`, acoustic revision `2`, the professional-microphone foam, and the accepted P2P thresholds unchanged unless new controlled evidence contradicts the clean-run findings.

## A. Confirmed Sound Foundation

1. [x] Confirm `ESP32 + INMP441` operation on the real device.
2. [x] Fix the accepted microphone construction as `ACOUSTIC REV 2`.
3. [x] Confirm that the professional-microphone foam preserves useful acoustic range.
4. [x] Use `AVG P2P`, not `NOW %`, as the basis for `SILENT / NORMAL / LOUD / PEAK`.
5. [x] Accept the relative thresholds: `SILENT <=350`, `NORMAL <=650`, `LOUD <=850`, `PEAK >850`.
6. [x] Confirm useful `DAY / EVE / NGT` separation.
7. [x] Confirm that the current soft `ECO` profile causes no hidden measurement gaps.
8. [x] Confirm stable `SIG IN`, SHT31 health, and sample counts during the clean run.
9. [x] Confirm continuous device-recorded uptime across planned soft restarts.
10. [x] Confirm that Telegram displays `AVG P2P` and real device uptime correctly.

## B. Current Sound-Pipeline Defects

11. [x] Fix automatic Telegram daily-summary date tracking so old report dates are never alternated or resent.
12. [x] Add a script lock around the automatic daily-summary decision, send, and watermark update.
13. [ ] Validate three consecutive automatic reports with exactly one report for each completed date.
14. [ ] Locate the loss of the `00:00-00:09` window between the local CSV and Google Sheets.
15. [ ] Eliminate any race between the midnight window upload and `SCHEDULED_RESTART`.
16. [ ] Achieve `144/144` full-day cloud windows and `42/42` `NGT` windows.
17. [ ] Align `BOOT / SCHEDULED_RESTART` rows with the 35-field local CSV header.
18. [ ] Verify automatic archive-sheet hiding in the deployed spreadsheet.
19. [ ] Remove stale or duplicate Apps Script triggers after the corrected script is deployed.
20. [ ] Verify that manual and automatic Telegram summaries do not conflict.

## C. Runtime Memory Reliability

21. [ ] Localize the repeated daily `FREE HEAP` decline of about `67-70 KB`.
22. [ ] Measure heap before and after HTTPS, Sheets, MQTT, Telegram, and file operations.
23. [ ] Check HTTP/TLS clients, `String` objects, and temporary buffers for retained allocations.
24. [ ] Determine whether the trend is a leak, fragmentation, or bounded caching.
25. [ ] Fix the cause or prove a safe stable plateau with sufficient heap margin.
26. [ ] Keep the daily planned restart enabled until memory stability is proven.
27. [ ] Run at least 72 hours of heap observation after the memory change.
28. [ ] Accept runtime memory only after there are no memory-related resets and minimum heap remains safe.

## D. Relative Classification Completion

29. [ ] Add `MIXED NORMAL/LOUD` handling for tied or nearly tied dominant levels.
30. [ ] Split coverage confidence from level dominance as `DATA CONFIDENCE` and `LEVEL DOMINANCE`.
31. [ ] Review days where average P2P is `LOUD` while the modal window level is `NORMAL`.
32. [ ] Align level semantics across firmware, Sheets, Telegram, MQTT, and Datacake.
33. [ ] Keep the accepted P2P thresholds unchanged unless controlled evidence requires retuning.
34. [ ] Run a clean 3-7 day regression after pipeline, memory, and classification fixes.
35. [ ] Confirm that every output surface gives the same level for the same source window.
36. [ ] Freeze the relative noise monitor as accepted sound version v1.

## E. Real dB Calibration

37. [ ] Define whether the target is indicative dB or a validated `Leq` measurement.
38. [ ] Add an RMS/Leq acoustic metric instead of converting `AVG P2P` directly to dB.
39. [ ] Document the usable INMP441 frequency-response and weighting limitations.
40. [ ] Add a calibration mode without weakening normal logging.
41. [ ] Define fixed microphone and reference sound-level-meter placement.
42. [ ] Collect paired quiet, normal, loud, and peak readings.
43. [ ] Repeat calibration readings across multiple times and relevant environmental conditions.
44. [ ] Calculate and implement the accepted calibration offset or model.
45. [ ] Validate the model against measurements not used for fitting.
46. [ ] Record the accepted error range and all limitations.
47. [ ] Add the calibrated dB metric to local logs, Sheets, and Telegram.
48. [ ] Preserve `AVG P2P` as a separate diagnostic metric.
49. [ ] Run the final seven-day sound acceptance test.
50. [ ] Mark the complete sound subsystem finished only after the dB acceptance test passes.

## F. Remaining Project Subsystems

51. [ ] Finish the reliability of the separate `ESP32-S3 + INA3221` controller.
52. [ ] Validate charge, discharge, voltage, current, and sleep behavior.
53. [ ] Select the accepted local communication protocol between controllers.
54. [ ] Implement controller status, power telemetry, heartbeat, and failure behavior.
55. [ ] Use the main ESP32 as the network gateway if integration testing confirms that architecture.
56. [ ] Implement automatic `LOW_BAT` behavior from measured power data.
57. [ ] Validate both controllers operating from the same battery supply.
58. [ ] Integrate GPS time and coordinates.
59. [ ] Validate time and day-part statistics without NTP.
60. [ ] Review Flash and OTA-slot capacity before GSM integration.
61. [ ] Design the power path for GSM current peaks.
62. [ ] Implement GSM connectivity and recovery.
63. [ ] Validate data delivery without home Wi-Fi.
64. [ ] Remove breadboards and temporary contacts.
65. [ ] Build the permanent soldered or PCB assembly.
66. [ ] Add moisture protection, drainage, cable retention, and corrosion protection.
67. [ ] Preserve USB and OTA recovery access.
68. [ ] Run an integration test across every required subsystem.
69. [ ] Run a final autonomous 20-30 day acceptance test.
70. [ ] Fix only defects confirmed by the integrated acceptance evidence.
71. [ ] Update final documentation, data dictionaries, and architecture diagrams.
72. [x] Replace the stale project backlog with this progress-aware numbered checklist.
73. [ ] Prepare the stable firmware and Apps Script release state.
74. [ ] Move the validated release from `devlop` to `main`.
75. [ ] Record and publish the final project release.
