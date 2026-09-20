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
13. [ ] CODE READY; RUN EVIDENCE PENDING: validate three consecutive automatic reports with exactly one report for each completed date.
14. [ ] CODE READY; RUN EVIDENCE PENDING: confirm that the guarded upload path retains the `00:00-00:09` window between the local CSV and Google Sheets.
15. [ ] CODE READY; RUN EVIDENCE PENDING: confirm that the completed/delivered-window gate prevents a midnight race with `SCHEDULED_RESTART`.
16. [ ] Achieve `144/144` full-day cloud windows and `42/42` `NGT` windows.
17. [x] Align `BOOT / SCHEDULED_RESTART` rows with the 35-field local CSV header; build `115+` source and later physical logs use the corrected event shape.
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

29. [ ] LOCAL SOURCE READY; DEPLOYMENT PENDING: use `MIXED NORMAL/LOUD` when the two leading classes differ by no more than `10` percentage points.
30. [x] Deploy and visually accept the split between coverage-based `DATA CONFIDENCE` and independent `LEVEL DOMINANCE`; `summary_conclusions`, `daily_verdict`, and `daily_verdict_table` show correctly aligned values and styling.
31. [ ] Review days where average P2P is `LOUD` while the modal window level is `NORMAL`.
32. [ ] LOCAL SOURCE ALIGNED; LIVE VALIDATION PENDING: Sheets tables and Telegram daily summaries share the same mixed/dominance calculation, while firmware/MQTT/Datacake retain the accepted per-window P2P levels.
33. [x] Keep the accepted P2P thresholds unchanged unless controlled evidence requires retuning.
34. [ ] Run a clean 3-7 day regression after pipeline, memory, and classification fixes.
35. [ ] Confirm that every output surface gives the same level for the same source window.
36. [ ] Freeze the relative noise monitor as accepted sound version v1.

## E. Real dB Calibration

37. [x] Define the target as an indicative calibrated `dB(A) A16` estimate, not a certified full-band meter.
38. [x] Add A16 RMS/SLOW energy metrics instead of converting `AVG P2P` directly to dB.
39. [x] Document the 16 kHz INMP441 weighting and frequency-response limitations.
40. [x] Add a calibration mode without weakening normal logging.
41. [x] Define fixed adjacent microphone and reference sound-level-meter placement.
42. [x] Collect paired quiet, normal, loud, and peak readings.
43. [ ] Repeat calibration readings across multiple times and relevant environmental conditions.
44. [x] Calculate and implement the accepted `+114.2 dB` A/SLOW calibration offset for `acoustic_rev=2`.
45. [x] Validate the frozen model on the independent build-152 session: 50 photo pairs, 45 stable pairs, stable MAE `1.13 dB`, RMSE `1.43 dB`, and `84.4%` within `±2 dB`.
46. [x] Record the accepted practical range `53.2..65.9 dB(A)` and the A16/SLOW, 16 kHz, transition-timing and non-certified limitations.
47. [x] PHYSICALLY ACCEPTED: uploaded build `153` shows current A16/SLOW on OLED and `/bssts`, writes energetic ten-minute `DBA LEQ EST` to `/log.csv`, and publishes non-empty values to the exact deployed Google Sheets endpoint. The temporary blank cloud column was a stale deployment-URL mismatch, not a dB calculation failure.
48. [x] Preserve `AVG P2P`, `Now/H/M`, `LEVEL`, thresholds and the P2P debug display as separate unchanged relative metrics.
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
58. [x] Complete system-level GPS integration through C3: uploaded builds `134/195` physically relayed the saved manual FIX to BS and its Google Maps card; GPS remains C3-owned and manual-only.
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
83. [x] Upload and physically accept paired BS build `135` first and C3 build `197` second. Eight consecutive accepted `UART_SLP -> UART_WAIT -> UART_OK` cycles recovered in at most `17 s`; after the first newly accepted announcement, `UART_OFF` stayed at `1` and `C3_GAP` stayed at `0`. The scheduled BS restart during declared `SLP` remains non-blocking evidence debt in `CONTROLLER_LINK_ACCEPTANCE.md` and may close naturally in a later long run.
84. [ ] Prove true missing-link detection with a safe controlled test performed only with power removed, or use an agreed non-destructive protocol test mode if disturbing the permanent wiring is unsafe. This remains required before final link acceptance but does not block the safe STATUS development stage.
85. [x] Freeze the corrected receive-only UART formats and behavior as the accepted development baseline. Remaining long-run/restart and true-missing-link evidence stays explicitly open in tasks `83-84` and `CONTROLLER_LINK_ACCEPTANCE.md`; reopen the baseline only if new logs expose a regression.
86. [x] Before bidirectional work, create and verify fresh full backups of WROOM build `129` and the separately managed current C3 build `191`, including `.pio` firmware artifacts, private local configuration, portable workspaces, Git bundles, restore manifests/instructions, file inventories, and critical SHA-256 checks. Verified archives: `D:\DEV\BSPRJ-backups\BSPRJ_FULL_2026-08-22_00-37-36.tar` (`03FFAB887331E5D15F7A37C90F6D976F8288807FDC12BC6AE13C2698085516E3`) and `D:\DEV\INA3221-C3-backups\INA3221-C3_FULL_2026-08-22_00-27-16.tar` (`697765058A6417F013E9548F35DAC46C2CFD1E9D411BCB0FE58920CA6D5EE587`). Both passed critical-hash, complete workspace-inventory, Git-bundle, and standalone-restore checks; keep them private because each includes `include/secrets.h`.
87. [x] Extend `CONTROLLER_UART_PROTOCOL.md` with the bounded WROOM-to-C3 command v1 envelope: protocol version, persistent WROOM command epoch, monotonic sequence, `1..7200 s` TTL, strict single-argument allowlist, `CACK/CRES`, 47-character C3 input limit, persistence/exactly-once rules, bounded retries, malformed rejection, truthful lifecycle states, and staged `STATUS -> OTA_ON -> WIFI_OFF -> RESTART` rollout. Uploaded builds `131/192` physically pass STATUS; uploaded `132/193` pass the OTA side effect/upload/restart, and uploaded C3 `194` addresses missing command-frame completion while later stages remain specification-only.
88. [x] Close the abandoned Gateway/Service branch without weakening autonomous INA3221, solar-charge, GPS, or Deep-Sleep logic. C3 build `205` again owns Wi-Fi and Internet services; BS remains the diagnostic/status UART peer.
89. [ ] Validate exactly-once STATUS behavior before final remote-diagnostic acceptance. Sequences `18..25` returned `4/8` fresh `OK STATUS` and `4/8` bounded `ACK_TIMEOUT` while automatic telemetry continued. Local BS build `139` preserves STATUS and clears retired persisted command codes `2/3` so they cannot block `/c3sts`; STATUS TTL/restart recovery stays later evidence debt.
90. [x] Route C3 status through the existing authorized BS Telegram bot with replay protection and truthful lifecycle states. `/c3sts` is physically accepted; local build `139` keeps only STATUS as an outgoing C3 command and leaves the BS token and group `chat_id` unchanged.
91. [x] Superseded and physically covered by later uploaded BS builds: `/c3ota` is absent, `/c3sts` still returns fresh/cached status, and retired OTA_ON/WIFI_OFF records do not block STATUS. C3 remains unchanged.
92. [x] Migrate and physically prove routine C3 Internet-bound telemetry through BS. Power telemetry, saved GPS FIX, WQTT forwarding, Telegram status, duplicate re-ACK, continuous sequence handling, and repeated sleep/wake recovery are accepted. Preserve C3's current Wi-Fi and own-bot OTA recovery for now; decide later whether normal C3 Wi-Fi can be reduced or disabled without losing the selected upload path. USB recovery remains mandatory.
93. [x] Functionally accept the saved-GPS UART extension. Uploaded builds `134/195` prove fresh extended telemetry, `/c3sts` Google Maps with `9` satellites/HDOP `2.4`/truthful age, and bounded `C3_GPS fixed=1`; all `12` build-195 HEALTH rows show WQTT connected. Direct retained-JSON inspection remains optional evidence because the journal does not store payload bodies. The manual-only GPS workflow is unchanged.
94. [ ] FOLLOWING STAGE: after dedicated hardware-wake acceptance, validate both controllers on the real shared battery/converter path, including charge transitions, UART integrity, resets, ground/noise behavior, and later SIM800 interference/current peaks. Keep noncritical STATUS/restart evidence as a parallel log ledger instead of delaying the active stage.
95. [x] Synchronize the acceptance ledger, tasks, `progress.md`, `memory.md`, and append-only history with the accepted BS `135` / C3 `197` sleep-handshake results and the later BS `136` / C3 `197` backward-compatibility proof. Protocol wire formats and data schema remain unchanged.
96. [ ] Commit and push each accepted stage to `devlop`; move to `main` only after the accepted narrow controller link, saved-GPS relay, shared-power, recovery, and final field-validation gates pass. C3-owned Wi-Fi/bot/OTA are not BS release gates.
97. [ ] Feed the verified final controller wiring and protocol into task `76`; create the final as-built `NETLIST` only after GPS, SIM800, power, sensors, and all interconnections are physically finalized.

## H. Later Portability and Productization

98. [ ] CORE PHYSICALLY ACCEPTED IN BUILD 147; FINAL SERVICE CHECKS PENDING: the runtime `GPIO27` hold, OLED countdown/AP guidance, correct new-network save, Telegram `/bssts`, restart, loss of the phone hotspot, and fallback to the recovery Wi-Fi are physically proven. Candidate credentials remain RAM-only until validation, the protected AP stays bounded to `10 min`, and no captive portal, new library/server, Telegram credential path, or C3 change exists. Close this item with one convenient wrong-password rollback check, normal log-page check, and the next real OTA upload; do not create a dummy firmware build only for evidence.
99. [x] PHYSICALLY ACCEPTED: C3 build `207` and BS `0.1.87-EXP` build `141` implement the two software halves of dedicated hardware wake. The powered-off wiring and continuity gates passed; BS GPIO23 open-drain is connected to the pulled-up C3 GPIO5 wake input with common ground. One online-guard check returned `C3 already awake`; three Deep-Sleep commands each produced one request and a matching C3 `Boot: Wakeup BS` report after `6 s`; ordinary timer wake and later `Link: OK / Data: Fresh / INA3221: OK` remain intact. `/c3sts` is still status-only; EN/Reset and new UART frames are not used. Physical cooldown timing remains optional regression evidence, not a blocker.
100. [x] Remove the redundant BS `C3 Update / Online · build N` Telegram card now that the C3 bot reports its own startup/build in the same group. BS build `142` retains C3 build detection for `/c3sts`, diagnostics, sleep restoration, compatibility, and telemetry; C3 is not modified.
101. [x] Add one compact bilingual `/help` command in BS build `143`. Keep all command, BS/C3 block, `Link/Data`, wake-sequence, and admin-boundary explanations inside this single message; do not add help subcommands, aliases, inline menus, NVS, UART activity, or C3 changes. Telegram/BotFather command-menu cleanup remains a one-time external configuration step after upload.
102. [x] Extend the same unified `/help` in BS build `144` with the current C3-bot command guide: `/status`, `/power`, `/slpon`, `/slpoff`, `/chrgon`, `/chrgoff`, and `/sa`. Clearly separate group-member BS commands from admin-only C3 controls without adding command handlers, menu entries, UART activity, or C3 changes.
103. [x] Reduce only the BS Telegram command polling interval from `60 s` to `30 s` in build `145`, keeping the `5 s` send spacing and all ECO, authorization, coalescing, STATUS, wake, UART, telemetry, and C3 behavior unchanged.
104. [x] Prepare BS `0.1.100-EXP` build `154` from the T4 evidence: calculate ten-minute `DBA LEQ EST` from warmed, fault-free, non-clipped blocks when valid coverage is at least `95%`; publish hidden technical `DBA VALID % / DBA FAULTS / DBA CLIPS`; and stop reformatting every historical raw row on each Apps Script POST. Preserve the accepted `+114.2 dB` offset, P2P/LEVEL behavior, UART/C3, timings, and services.
105. [x] T7 physically confirms manually uploaded BS build `156`: `139/139` consecutive dB windows match raw Sheets rows without duplicates or `GS_DROP`; equal-length retry windows fell from `114` on build `155` to `23` on build `156`. All `23` build-156 retry windows have populated dB, `100%` valid audio, zero audio faults, and zero clips. The reduced `SAMPLES` during HTTP waits counts main-loop snapshots, while raw I2S energy is captured by a dedicated task; it does not prove lost dB data. Legacy relative P2P/LEVEL can be undersampled during timeouts and is carried into task `106`. A naturally low-quality `<95%` dB window remains unobserved.
106. [ ] T9 SHORT GATE ACCEPTED; EXTERNAL OUTPUT CHECKS REMAIN: approved trial boundaries are `SILENT <56`, `NORMAL 56..<62`, `LOUD 62..<66`, `PEAK >=66 dB(A)`. T8 proves the deployed script recalculates LEVEL and energetic DAY/EVE/NGT averages from dB(A), emits `OK / PARTIAL / NO DATA`, and sends the new dB daily summary. T9 physically confirms manually uploaded build `157` across `15` consecutive `13:30..15:50` windows: every window has dB(A), `100%` valid audio, zero faults/clips, `GS_DROP=0`, and the refreshed summary matches the raw rows (`13 NORMAL`, one `65.7 dB(A)` LOUD, one `68.7 dB(A)` PEAK). Keep this task open only for a concise MQTT/Datacake/AppSheet consistency check during later acceptance; do not treat old P2P-era rows as converted measurements or add an HTTP worker without evidence of lost dB capture.
107. [x] LIVE ACCEPTED: deployed User mode shows only `Summary`, `Measurements`, and `Charts`; `Summary` uses `BUILD` plus compact `DATA = confidence · coverage`, `Measurements` is newest-first and hides microphone diagnostics, and `Charts` still uses numeric valid-minute coverage. A Technical-mode screenshot confirms `MIC = INMP441 · REV 2 · OK` followed by `AVG P2P / RAW MIN / RAW MAX / DBA CLIPS`, with raw/internal sheets restored. Raw schemas, Technical identity fields, dB(A) calculations, triggers, firmware, and AppSheet sources remain unchanged.
108. [ ] Only after the final dB outputs are physically accepted, use a separate cleanup build to remove `/dbstart`, `/dbsts`, `/dbstop`, `/dbcal.csv`, calibration OLED/Telegram state, obsolete Now/H/M and detailed relative/P2P presentation and accumulators. Keep minimal P2P `LOW/CLIP` health detection, then run task `49` as the clean final seven-day sound test.
109. [ ] LATER: review the Technical-mode presentation of `DEV ID / VER / BUILD`. Preserve all three raw fields and their historical/AppSheet compatibility; decide later whether a presentation-only compact identity view is useful without changing the ingestion schema, archives, filters, or diagnostic exports.
110. [ ] LIVE LAYOUT ACCEPTED; FINAL LABEL REFRESH PENDING: screenshots confirm exactly four Technical views (`Summary`, `Measurements`, `Charts`, `Technical Log`), populated newest-first rows, clearer microphone fields, hidden raw/internal sheets, and healthy visible audio evidence. The raw 40-column `log`, payload order, archives, AppSheet compatibility, firmware, and calculations remain unchanged and recoverable through Diagnostics. The screenshot also clarified that raw `BOOT SEQ / RESET REASON` describe one boot session, not every ten-minute row; the local presentation now uses the more accurate `BOOT NUMBER / BOOT REASON`. Seven focused regressions pass. Save the corrected `Code.gs`, run one `Refresh latest data`, and verify only those two final headings before closing the presentation half. After acceptance, audit every hidden column, sheet, firmware accumulator, Apps Script consumer, Telegram/MQTT/Datacake/AppSheet output, archive/migration path, and test before optimization. Remove only proven-unused items after a backup and the task `108` final dB-output gate; otherwise keep them hidden.
