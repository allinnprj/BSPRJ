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

51. [x] Complete and validate the separate `ESP32-C3 SuperMini + INA3221` solar-charge and power-management controller.
52. [x] Validate charge, discharge, voltage, current, and sleep behavior on the separate controller.
53. [x] Select the accepted local communication protocol between the main BSPRJ ESP32 and the ESP32-C3 SuperMini: short protected `115200 8N1` UART with strict ASCII frames, documented in `CONTROLLER_UART_PROTOCOL.md`.
54. [x] Implement controller status, real INA3221 power telemetry, heartbeat, planned-sleep state, ACK/retry/deduplication, and safe timeout/drop behavior; nominal `TEL -> ACK` is physically validated on builds `119/185`.
55. [x] Keep the BSPRJ ESP32 as the primary noise, logging, and network controller; WROOM build `120` physically passed repeated C3-to-WQTT gateway delivery with accepted sequences `q=2` and `q=9`.
56. [ ] Implement automatic `LOW_BAT` behavior from measured power data.
57. [ ] Validate the main controller operating from the battery/converter path managed and monitored by the ESP32-C3 solar controller.
58. [ ] Complete system-level GPS integration through C3: the tested GPS remains physically and logically owned by C3, while local builds `134/195` relay its saved manual FIX to BS; physical gateway proof remains.
59. [ ] Validate time and day-part statistics without NTP.
60. [x] Optimize the current ESP32 firmware and review RAM, Flash, and OTA-slot capacity before GSM integration; build `128` passes at `65,436` bytes RAM and `1,349,483` bytes linked Flash with `223,381` bytes OTA-slot reserve, so an ESP32-S3 migration is not currently required.
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
76. [ ] Create the final as-built `NETLIST` for the complete system after all controller, power, sensor, GPS, GSM, and interconnection wiring is finalized.

## G. Active ESP32-WROOM-32U to ESP32-C3 SuperMini Completion Plan

- This is the active controller-link sequence approved after tasks `53-55`.
- Complete it incrementally in the listed order. Do not start bidirectional C3 commands before the receive-only link correction and short physical acceptance gate pass.
- WROOM work belongs to `BSPRJ`. C3 source changes and C3 uploads require a separately agreed stage; the user performs the C3 upload from its own VS Code project.

77. [x] Confirm the final short UART wiring: C3 `GPIO21/U0TXD -> 2.2 kOhm -> WROOM GPIO16/U2RXD`, WROOM `GPIO17/U2TXD -> 2.2 kOhm -> C3 GPIO20/U0RXD`, common GND only, no UART-side `3.3V/5V/EN/BOOT` connection.
78. [x] Confirm the receive-only transport baseline: strict `115200 8N1`, `PING/PONG`, declared `SLEEP`, `SLP -> WAIT -> OK`, real `TEL -> ACK`, session/sequence handling, duplicate re-ACK, strict parsing, C3-to-WQTT forwarding, Telegram `C3 Controller`, and `/c3sts` coalescing.
79. [x] Accept the build `128/187` long-run evidence: approximately `48 h 40 min`, valid diagnostic rotation, `293` continuous ten-minute windows, `1119` accepted C3 frames, `4` handled duplicates, `C3_GAP=0`, `GS_DROP=0`, stable heap, and complete local-to-Sheets reconciliation.
80. [x] Correct WROOM UART liveness semantics: remove the two observed short false `UART_OFF` transitions, preserve or reconstruct declared C3 sleep across a planned WROOM restart, use `SLP/WAIT/UNKNOWN` while an expected wake is pending, immediately restore `OK` on valid C3 traffic, and still detect a real missing link as `OFF`. Build `129` implements `WAIT` at `90 s`, `OFF` at `240 s`, immediate valid-traffic recovery, and a one-shot RTC sleep checkpoint; physical validation remains task `83`.
81. [x] Correct WROOM OTA routing for the current network without uploading: target `192.168.1.134`, PC callback `192.168.1.81`, while keeping USB recovery available.
82. [x] Prepare the next WROOM build with the smallest UART-state/OTA edit, synchronized version/build and `CHANGELOG.md`, then pass `git diff --check` and `pio run -e esp32dev` with RAM, Flash, and OTA-slot headroom recorded. Build `129` passes with RAM `65,436` bytes, linked Flash `1,350,111` bytes, and OTA-slot reserve `222,753` bytes; C3 was not changed or uploaded.
83. [ ] Upload and physically accept local C3 build `196`. Build `195` / BS build `134` NT4 had zero `UART_SLP` across seven repeat Deep-Sleep recoveries; build `196` sends three atomic flushed copies of the unchanged frame without changing BS thresholds or sleep duration. Prove several `SLP -> WAIT -> OK` cycles with no new OFF, then later capture the scheduled BS restart during declared `SLP`.
84. [ ] Prove true missing-link detection with a safe controlled test performed only with power removed, or use an agreed non-destructive protocol test mode if disturbing the permanent wiring is unsafe. This remains required before final link acceptance but does not block the safe STATUS development stage.
85. [x] Freeze the corrected receive-only UART formats and behavior as the accepted development baseline. Remaining long-run/restart and true-missing-link evidence stays explicitly open in tasks `83-84` and `CONTROLLER_LINK_ACCEPTANCE.md`; reopen the baseline only if new logs expose a regression.
86. [x] Before bidirectional work, create and verify fresh full backups of WROOM build `129` and the separately managed current C3 build `191`, including `.pio` firmware artifacts, private local configuration, portable workspaces, Git bundles, restore manifests/instructions, file inventories, and critical SHA-256 checks. Verified archives: `D:\DEV\BSPRJ-backups\BSPRJ_FULL_2026-08-22_00-37-36.tar` (`03FFAB887331E5D15F7A37C90F6D976F8288807FDC12BC6AE13C2698085516E3`) and `D:\DEV\INA3221-C3-backups\INA3221-C3_FULL_2026-08-22_00-27-16.tar` (`697765058A6417F013E9548F35DAC46C2CFD1E9D411BCB0FE58920CA6D5EE587`). Both passed critical-hash, complete workspace-inventory, Git-bundle, and standalone-restore checks; keep them private because each includes `include/secrets.h`.
87. [x] Extend `CONTROLLER_UART_PROTOCOL.md` with the bounded WROOM-to-C3 command v1 envelope: protocol version, persistent WROOM command epoch, monotonic sequence, `1..7200 s` TTL, strict single-argument allowlist, `CACK/CRES`, 47-character C3 input limit, persistence/exactly-once rules, bounded retries, malformed rejection, truthful lifecycle states, and staged `STATUS -> OTA_ON -> WIFI_OFF -> RESTART` rollout. Uploaded builds `131/192` physically pass STATUS; uploaded `132/193` pass the OTA side effect/upload/restart, and uploaded C3 `194` addresses missing command-frame completion while later stages remain specification-only.
88. [ ] Implement the command path in separate controller stages without weakening autonomous INA3221, solar-charge, GPS, or Deep-Sleep logic. STATUS is physically accepted on BS `131` / C3 `192`. BS `132` / C3 `193` physically pass the optional OTA activation/upload/restart side effect, and C3 build `194` is uploaded. The user selected the C3 bot as the primary OTA path, so further BS `/c3ota` acceptance is deferred and does not block routine data migration. `WIFI_OFF` and `RESTART` remain absent.
89. [ ] Validate exactly-once command behavior: bounded retry, duplicate suppression across Deep Sleep, explicit result with actual state, expiration of stale queued commands, fail-safe handling after either controller restarts, and diagnostic evidence for every command lifecycle.
90. [x] Route C3 status through the existing authorized BS Telegram bot with replay protection and truthful lifecycle states; do not create another full bot in BS. `/c3sts` is physically accepted, `/c3ota` remains an optional reserve, and uploaded BS build `133` adds one compact build-change notice for natural proof on the next real C3 update.
91. [ ] Keep the minimum safe C3 command set staged: STATUS is physically accepted, while BS-triggered OTA is retained but no longer an active acceptance gate because future C3 uploads use the C3 bot. Reassess `WIFI_OFF` only after routine data migration; keep restart separately confirmed.
92. [ ] Migrate routine C3 Internet-bound telemetry through BS and prove the gateway path first. Power telemetry is physically proven and local builds `134/195` add the saved GPS FIX. Preserve C3's current Wi-Fi and own-bot OTA recovery during this stage; decide later whether normal C3 Wi-Fi can be reduced or disabled without losing the selected upload path. USB recovery remains mandatory.
93. [x] Functionally accept the saved-GPS UART extension. Uploaded builds `134/195` prove fresh extended telemetry, `/c3sts` Google Maps with `9` satellites/HDOP `2.4`/truthful age, and bounded `C3_GPS fixed=1`; all `12` build-195 HEALTH rows show WQTT connected. Direct retained-JSON inspection remains optional evidence because the journal does not store payload bodies. The manual-only GPS workflow is unchanged.
94. [ ] Validate both controllers on the real shared battery/converter path, including charge transitions, UART integrity, resets, ground/noise behavior, and later SIM800 interference/current peaks.
95. [ ] Update the protocol, data dictionaries, architecture, `progress.md`, `memory.md`, and append-only history with the accepted physical results.
96. [ ] Commit and push each accepted stage to `devlop`; move to `main` only after command, Wi-Fi-off/OTA, GPS relay, shared-power, and recovery gates pass.
97. [ ] Feed the verified final controller wiring and protocol into task `76`; create the final as-built `NETLIST` only after GPS, SIM800, power, sensors, and all interconnections are physically finalized.
