# CHANGELOG

## Ordinary dB(A) A16 publication - 0.1.99-EXP build 153 - 2026-09-13

1. Confirmed the frozen `dB(A) A16 est = a_slow_dbfs + 114.2` model on the independent build-152 run: `110` CSV rows, `109` valid, `audio_faults=0`, and `50` FNIRSI A/SLOW photos. The `45` stable pairs have bias `-0.06 dB`, MAE `1.13 dB`, RMSE `1.43 dB`, and `84.4%` within `±2 dB` over `53.2..65.9 dB(A)`; five rapid-transition frames remain timing-limited comparisons, not refit input.
2. Added the current A16/SLOW estimate to the normal OLED sound page and `/bssts`. The OLED now gives the dBA estimate the large primary row while retaining Wi-Fi/ECO status, relative H/M, environment, and the separate P2P debug/range pages.
3. Added energetic ten-minute `DBA LEQ EST` to `/log.csv` and the Google Sheets raw `log` schema. The value is computed from accumulated A16 energy, never by arithmetically averaging dB; warmup, audio faults, or clipping leave it blank. Apps Script expands the raw schema safely to `37` columns and keeps the new field visible in User mode.
4. Preserved relative `P2P`, `Now/H/M`, `LEVEL`, thresholds, day-part analytics, MQTT/Datacake, UART/C3, network services and timings. Updated the bilingual data dictionaries, calibration evidence, tasks and progress. No C3 change, upload, Apps Script deployment, or publication was performed.
5. Validation: dB publication/DSP/calibration, controller-command, Wi-Fi provisioning and five Google Sheets regressions pass; `git diff --check` passes. One compiling `pio run -e esp32dev` succeeds after the sandbox-only lock attempt stopped before compilation: RAM `66,524 / 327,680` (20.3%), Flash `1,402,059 / 1,572,864` (89.1%), OTA reserve `170,805` bytes, binary `1,402,464` bytes, SHA-256 `08AD50000CD1C345E0A626FAFC85DA210ECE2C38EC5B0A884434FA0ACC6F56AD`.

## Calibrated A16/SLOW candidate - 0.1.98-EXP build 152 - 2026-09-13

1. Accepted the build-151 FNIRSI FDM01 `A/SLOW` dataset: `1097` CSV points, `1096` valid points, `audio_faults=0`, `96.9..100.0%` valid coverage, and `67` point-linked photos. The robust fitted offset is `+114.2 dB`; after excluding four visibly transitional comparisons, MAE is about `1.0 dB` and `87.3%` of pairs are within `±2 dB` over the stable reference range `53.2..65.5 dB(A)`.
2. Added the explicit engineering conversion `dB(A) A16 est = a_slow_dbfs + 114.2` and a separate `a_slow_dba_est` column to `/dbcal.csv`. The raw `a_slow_dbfs` value remains available.
3. Kept ordinary relative `P2P`, `Now/H/M`, thresholds, local analytical log, Sheets, Telegram, display behavior, UART/C3, network services and timings unchanged. The estimated dB value will not replace user-facing relative metrics until a new independent photo/CSV control passes.
4. Validation: dB/DSP, controller-command and Wi-Fi provisioning contracts pass; `git diff --check` passes. One `pio run -e esp32dev` build succeeds: RAM `66,380 / 327,680` (20.3%), Flash `1,401,107 / 1,572,864` (89.1%), OTA reserve `171,757` bytes, binary `1,401,504` bytes, SHA-256 `D9FDC38AE30A01ED63C53F172CCA4AEB85877BD3B2D1624D184E8D1D3D57E39A`. No upload or publication was performed.

## Photo-readable calibration OLED - 0.1.97-EXP build 151 - 2026-09-13

1. Simplified the active calibration screen to two large centered rows: `TL MM:SS` and `POINT N`. Removed the small title and `TIME LEFT` caption that reduced photographic readability.
2. Kept the precise one-second calibration point/CSV relationship unchanged. A displayed point remains the exact CSV row reference; A16/SLOW processing, session duration, ordinary sound statistics, commands, network services and C3 are unchanged. No upload or publication was performed.
3. Validation: dB/DSP, controller-command and Wi-Fi provisioning contracts pass; `git diff --check` passes. `pio run -e esp32dev`: SUCCESS; RAM `66,380 / 327,680` (20.3%), Flash `1,401,067 / 1,572,864` (89.1%), OTA reserve `171,797` bytes, binary `1,401,472` bytes, SHA-256 `6924CEB0B702AA9EA545C2ADA58E47B4023CB0D3171E0E2481CFF94F69F72C51`.

## Larger dB calibration OLED values - 0.1.96-EXP build 150 - 2026-09-13

1. Enlarged only the active calibration OLED countdown and point number to text size 2. The compact header and a separate `TIME LEFT` caption preserve clarity within the 128x64 display.
2. Calibration capture, A16/SLOW processing, P2P/statistics, commands, CSV schema, network services and C3 behavior are unchanged. No upload or publication was performed.
3. Validation: dB/DSP, controller-command and Wi-Fi provisioning contracts pass; `git diff --check` passes. `pio run -e esp32dev`: SUCCESS; RAM `66,380 / 327,680` (20.3%), Flash `1,401,191 / 1,572,864` (89.1%), OTA reserve `171,673` bytes, binary `1,401,600` bytes, SHA-256 `073C7CA0F6F2BB4E02052C9C7E299ECB0282E3D5D904654085A05699BF0D0251`.

## Continuous A16/SLOW calibration preparation - 0.1.95-EXP build 149 - 2026-09-13

1. Added one I2S acquisition task (priority 2/core 1, 4096-byte runtime stack), three lightweight A-weighting biquads and a 1-second exponential SLOW energy detector. Processing uses the microphone's 24-bit samples, without audio storage, FFT, new libraries, or C3 changes. Existing 16 kHz rate is retained: this is limited-band `A16`, not calibrated/full-band dBA; approximately ±2 dB is the user's practical target, not a verified guarantee.
2. Preserved P2P scaling, smoothing, H/M formulas, level thresholds and ordinary log/Sheets schemas. P2P is now read from the latest continuous 512-sample/32-ms capture window instead of the loop-owned 25-ms read; real relative-statistics equivalence and battery overhead need field verification. Detected DMA/read gaps reset filter warmup and increment a fault counter.
3. `/dbstart`, `/dbsts`, `/dbstop` retain the 20-minute separate-file session. CSV cadence is now nominally one second; added capture-time milliseconds, A-RMS/SLOW dBFS (not SPL), sample coverage, validity, fault counter, sample rate and point ID. Network-delayed rows are not fabricated; energy is accumulated across them. Invalid/first/warmup/clipped/stale/gapped intervals are excluded from calibration. CSV/header short writes are checked explicitly; the main log need not be cleared. Start guidance requests original photos with the existing OLED POINTS visible where possible.
4. Added `DB_CALIBRATION.md` with the precise test procedure, time matching, numeric field meanings, 16-kHz limitations and physical acceptance gates. No upload, publishing or remote pull was performed.
5. Validation: focused dB contract plus float32 DSP simulation, controller-command contract, Wi-Fi provisioning contract and `git diff --check` pass. First build invocation was blocked before compilation by PlatformIO lock-file permissions; authorized local build succeeded, followed by one incremental rebuild for robust CSV short-write detection. Final `pio run -e esp32dev`: SUCCESS; RAM `66,380 / 327,680` (20.3%), Flash `1,401,139 / 1,572,864` (89.1%), OTA reserve `171,725` bytes, binary `1,401,536` bytes. Versus documented build 148: +200 static RAM / +3296 linked Flash bytes; runtime task stack/driver queue are additional heap allocations. Deprecated legacy I2S warnings remain; no driver migration in this stage.

## Dedicated real-dB calibration capture - 0.1.94-EXP build 148 - 2026-09-03

1. Added the authorized Telegram commands `/dbstart`, `/dbsts`, and `/dbstop` for one bounded `20 min` calibration session. The start response states the exact local start/finish time, the OLED shows the active countdown and point count, and completion produces a Telegram notice with the local download link.
2. During the session BS records one numerical aggregate every `10 s` to the separate `/dbcal.csv`: timestamp, elapsed time, P2P average/minimum/maximum, raw minimum/maximum, sample count, signal state, build, and acoustic revision. No audio is recorded, and starting a new session replaces only the previous calibration file; the ordinary sound log does not need to be cleared.
3. The calibration file is exposed through the existing port-80 log server with a timestamped download name and is included in storage accounting and `Clear ALL logs`. Normal sound statistics, Google Sheets, UART/C3, INA3221, Wi-Fi, alerts, and their timings remain unchanged; no library, task, server, C3 change, upload, or publication was added.
4. Local validation: the focused dB-calibration contract plus the existing controller-command and Wi-Fi provisioning regressions pass; the final `pio run -e esp32dev` succeeds with RAM `66,180 / 327,680` (`20.2%`), linked Flash `1,397,843 / 1,572,864` (`88.9%`), and OTA-slot reserve `175,021` bytes. `firmware.bin` is `1,398,240` bytes with SHA-256 `CA6C8F7EA0728DA979794A8EDA15E7E514B01F843EC85C52EE6F799A4BA3263E`. Physical acceptance requires a manually uploaded build and one session compared with original timestamped FNIRSI FDM01 photos; no upload was performed.

## Separate data confidence from level dominance - Apps Script source - 2026-08-30

1. Added one deterministic daily-summary rule for near ties: when `NORMAL` and `LOUD` are the leading classes and differ by no more than `10` percentage points, `MAIN LEVEL` becomes `MIXED NORMAL/LOUD` instead of selecting one class arbitrarily. Its chart score is `2.5`, and both NORMAL/LOUD flags remain visible to technical charts.
2. Renamed the old coverage-only `CONFIDENCE` field to `DATA CONFIDENCE` and added independent `LEVEL DOMINANCE` values `STRONG / CLEAR / MIXED / WEAK / NO DATA`. The compact daily table carries matching `DAY/EVE/NGT DOM` fields, and Telegram daily summaries use the same shared main-level calculation.
3. Preserved the accepted per-window P2P thresholds and raw/window schemas; firmware, MQTT, Datacake, BS/C3 behavior, and controller versions are unchanged. Updated the English/Russian dictionaries and AppSheet setup references.
4. Local validation: the new `google_sheets_level_semantics_test.js` plus the existing daily-summary, UI-mode, newest-first, and chart-resilience regressions all pass.
5. Live visual validation: the user deployed the script and confirmed correctly aligned historical results and styling in `summary_conclusions`, `daily_verdict`, and `daily_verdict_table`. No natural `MIXED NORMAL/LOUD` day was present in the displayed data; Telegram daily-summary and a natural mixed row remain later evidence.

## Runtime Wi-Fi setup button and OLED guidance - 0.1.93-EXP build 147 - 2026-08-30

1. Replaced the boot-only Wi-Fi setup gesture with one continuous runtime `GPIO27` hold. Short press remains display page/on; releasing after `0.8 s` and before `2 s` keeps the existing pinned/auto toggle; from `2 s` the OLED shows a `3 / 2 / 1` countdown, release cancels without changing display mode, and reaching `5 s` starts one protected setup AP without rebooting BS.
2. While setup is active, the OLED shows `WI-FI SETUP`, the `BS-Setup-XXXX` SSID, `192.168.4.1`, and the remaining window or candidate-test result. Closing or timing out setup restores the prior display state. The existing `10 min` AP bound, `30 s` candidate test, validated-only NVS save, rollback, compile-time recovery profile, shared port-80 server, and password protections are unchanged.
3. Removed the obsolete boot-hold path. No new library, task, server, captive portal, scan, Telegram credential path, C3 change, upload, or publication was added.
4. Validation: `node test/wifi_provisioning_contract_test.js` passes; `git diff --check` passes; the single `pio run -e esp32dev` succeeds with RAM `65,660 / 327,680` (`20.0%`), linked Flash `1,376,495 / 1,572,864` (`87.5%`), and OTA-slot reserve `196,369` bytes. `firmware.bin` is `1,376,896` bytes with SHA-256 `7C79264D88663DE7FC07E5F4129367A7442C2BA9EC74C86BC3565D4E83B46002`. Physical button/AP/rollback/save checks remain pending; no upload was performed.

## Protected portable Wi-Fi setup - 0.1.92-EXP build 146 - 2026-08-29

1. Added a bounded provisioning mode for moving BS to another Wi-Fi network without recompiling. Holding the existing `GPIO27` button for `5 s` during boot opens the WPA2-protected `BS-Setup-XXXX` AP and a minimal page at `http://192.168.4.1/` for at most `10 min`; normal short/long button handling after boot is unchanged.
2. Candidate SSID/password values remain only in RAM while BS tests the connection for up to `30 s`. One checksummed NVS profile is written only after the requested SSID is actually connected. Invalid input, connection failure, or NVS failure keeps/restores the previous runtime profile; an unavailable saved profile falls back to the compile-time `WIFI_SSID` / `WIFI_PASSWORD` recovery profile after `30 s`.
3. Reused the existing synchronous port-80 `WebServer`: the setup form is available only while the physically requested AP is active, submits by HTTP POST, never echoes the password, and leaves the normal log/download routes unchanged outside setup mode. No scan, captive portal, new dependency, Telegram credential path, second server, C3 change, upload, or publication was added. The separate AP password remains only in ignored `include/secrets.h`.
4. Validation: `node test/wifi_provisioning_contract_test.js` passes; the final `pio run -e esp32dev` succeeds with RAM `65,660 / 327,680` (`20.0%`), linked Flash `1,375,035 / 1,572,864` (`87.4%`), and OTA-slot reserve `197,829` bytes. `firmware.bin` is `1,375,440` bytes with SHA-256 `4F128370A4A155A5BAC0EF13BE771C1DA8709265E87B83AFF180BC4BBD62B389`. The first sandboxed PlatformIO invocation stopped before compilation because its global lock was inaccessible; one intermediate compile exposed no error, and the final rebuild followed the exact `10 min` AP-bound correction. Physical AP/rollback/save checks remain pending; no upload was performed.

## Faster ECO Telegram command polling - 0.1.91-EXP build 145 - 2026-08-29

1. Reduced only the BS Telegram command polling interval from `60 s` to `30 s`. Normal `/help` and `/bssts` response latency becomes approximately `5..35 s` instead of `5..65 s`, depending on arrival relative to the next poll.
2. Preserved the existing `5 s` send spacing, duplicate-command coalescing, authorized-group check, stale-update rejection, retry bounds, STATUS lifecycle, hardware wake, UART, telemetry, Wi-Fi/cloud behavior, and ECO operation. No fast active window, long polling, new state, library, or C3 change was added.
3. BS build `145` includes the complete bilingual BS+C3 `/help` from build `144`; build `144` therefore does not need a separate physical upload.
4. Validation: `node test/controller_command_contract_test.js` passes; `git diff --check` passes; the single `pio run -e esp32dev` succeeds with RAM `65,548 / 327,680` (`20.0%`), linked Flash `1,368,267 / 1,572,864` (`87.0%`), and OTA-slot reserve `204,597` bytes. `firmware.bin` is `1,368,672` bytes with SHA-256 `EAD19AB081F6FD6F1D9B1B5AE102D40FE893F64F024C1DD0B95DB999DD013465`. No upload or publication was performed.

## Complete BS + C3 group help - 0.1.90-EXP build 144 - 2026-08-29

1. Extended the existing unified bilingual `/help` message with the current C3-bot commands: `/status`, `/power`, `/slpon`, `/slpoff`, `/chrgon`, `/chrgoff`, and `/sa`, including concise purpose text and the Smart Auto charging boundary.
2. Clearly separated BS commands available to participants in the authorized group from C3 control commands accepted only from the configured C3 administrator. This prevents group members from mistaking an intentionally ignored C3 command for a device fault.
3. Added no command handler, BotFather menu entry, alias, callback, library, state, UART traffic, or C3 change. Existing BS commands, authorization, telemetry, wake, STATUS, sound processing, cloud delivery, and both controller behaviors are unchanged.
4. Validation: `node test/controller_command_contract_test.js` passes; `git diff --check` passes; the single `pio run -e esp32dev` succeeds with RAM `65,548 / 327,680` (`20.0%`), linked Flash `1,368,267 / 1,572,864` (`87.0%`), and OTA-slot reserve `204,597` bytes. `firmware.bin` is `1,368,672` bytes with SHA-256 `1EDAE9DA824AF18A74C6DCE29349380A6D95DD11D1DD90032BCB78BDB5D3C67E`. The complete help body is `2,439` characters (`3,168` UTF-8 bytes), below Telegram's message limit. No upload or publication was performed.

## Unified bilingual Telegram help - 0.1.89-EXP build 143 - 2026-08-29

1. Added one read-only `/help` command for the authorized BS group. It contains the complete short Russian/English command guide, BS Controller and C3 Controller field meanings, `Link/Data` state meanings, the post-wake sequence, and the C3 admin-control boundary in one message.
2. Deliberately did not add `/help_bs`, `/help_c3`, `/help_link`, `/power`, aliases, inline menus, libraries, NVS state, UART requests, or C3 changes. `/help` is locally generated by BS, coalesces duplicate requests from one Telegram poll, and follows the existing bounded reply/retry lifecycle.
3. Existing `/bssts`, `/c3sts`, `/c3wkp`, Telegram authorization, STATUS, hardware wake, telemetry, diagnostics, C3 build detection, Wi-Fi/cloud services, sound processing, and controller behavior are unchanged. Telegram's visible command menu still requires a one-time BotFather configuration because it is stored by Telegram, not in firmware.
4. Validation: `node test/controller_command_contract_test.js` passes; `git diff --check` passes; the single `pio run -e esp32dev` succeeds with RAM `65,548 / 327,680` (`20.0%`), linked Flash `1,367,343 / 1,572,864` (`86.9%`), and OTA-slot reserve `205,521` bytes. `firmware.bin` is `1,367,744` bytes with SHA-256 `F6A3261B477AB0536D77536227FAA9CAA63C8AA0C679FFD1949476A74AE6E71D`. The generated help body is `1,790` characters (`2,380` UTF-8 bytes), below Telegram's message limit. No upload or publication was performed.

## Retire redundant BS C3 build-change notice - 0.1.88-EXP build 142 - 2026-08-28

1. Removed only the BS Telegram message `C3 Update / Online · build N`. C3 now reports its own startup and firmware build in the shared group, so the BS copy was redundant.
2. Preserved C3 build parsing and storage in `ControllerLinkService`, `/c3sts`, the normal one-time `C3 Controller` card after each BS boot, serial status, diagnostics, sleep restoration, compatibility checks, and MQTT/log telemetry. C3 firmware and its bot are unchanged.
3. Removed the now-unused notification builder, sender, and cached Telegram-only observed-build field. No UART frame, command, wake behavior, timing, Wi-Fi/OTA ownership, telemetry, INA3221, GPS, sound pipeline, or cloud-delivery behavior changed.
4. Validation: `node test/controller_command_contract_test.js` passes; `git diff --check` passes; the single completed `pio run -e esp32dev` succeeds with RAM `65,540 / 327,680` (`20.0%`), linked Flash `1,363,663 / 1,572,864` (`86.7%`), and OTA-slot reserve `209,201` bytes. `firmware.bin` is `1,364,064` bytes with SHA-256 `77BFAA45EEA88F90451AEFFDB16A83580EB64EC5E5EFAE1F875B3C6B3CD9330B`. No upload or publication was performed.

## Dedicated C3 hardware-wake command - 0.1.87-EXP build 141 - 2026-08-27

1. Added the BS half of the separately approved hardware-wake path. `GPIO23` is released at startup as an active-LOW open-drain output; `/c3wkp` emits one non-blocking `15 ms` LOW pulse in every link state except confirmed `OK`, with a `10 s` cooldown. EN/Reset is not used.
2. When C3 is already `OK`, no pulse is emitted and Telegram replies `C3 already awake`. Otherwise it replies `Wake pulse sent` after issuing one pulse; this confirms only the electrical request and does not claim successful C3 wake. Existing PING/PONG and TEL/ACK later establish normal `Link OK` independently.
3. `/c3sts` remains status-only and its existing STATUS/fresh/cached behavior is unchanged. No UART frame, NVS record, library, task, command queue, C3 Wi-Fi/OTA control, sensor/control change, or blocking delay was added. Duplicate `/c3wkp` updates found in one Telegram poll are coalesced into one action.
4. The existing diagnostic callback records the bounded `C3_WAKE_CMD pin=23 pulse_ms=15` event. Existing `UART_WAIT`, `UART_OK`, and new-session `C3_WAKE` records remain the physical recovery evidence.
5. Validation: `node test/controller_command_contract_test.js` passes; the single `pio run -e esp32dev` succeeds with RAM `65,548 / 327,680` (`20.0%`), linked Flash `1,364,315 / 1,572,864` (`86.7%`), and OTA-slot reserve `208,549` bytes. `firmware.bin` is `1,364,720` bytes with SHA-256 `13D2C378DB34156A9522A96FB1E6C5A8736CABB0B2940B335D647B64F419C2FD`. Upload, publication, wiring, and physical wake proof were not performed.
6. Physical acceptance: the user manually uploaded BS build `141`, connected BS GPIO23 directly to the pulled-up C3 GPIO5 wake input with common ground, and confirmed normal operation of both controllers. One `/c3wkp` while C3 was already online returned `C3 already awake` without a wake request. Three later commands while C3 was in Deep Sleep each produced one `Wake pulse sent` response followed `6 s` later by C3 build `207` reporting `Boot: Wakeup BS` and `Last wake: Deep Sleep`.
7. The same Telegram evidence preserves an ordinary `Boot: Wakeup Timer` cycle and includes a post-wake BS `Link: OK / Data: Fresh / INA3221: OK` result. A final status captured only `7 s` after another hardware wake truthfully showed the expected transitional `WAIT`; no `FAILED`, `ERROR`, `OFFLINE`, duplicate wake request, timer-wake regression, or INA3221 fault was present. Dedicated hardware wake is physically accepted; exact cooldown timing remains covered by the source contract and is not a blocker.

## Safe source cleanup - 0.1.86-EXP build 140 - 2026-08-26

1. Removed only source elements proven unused across the repository: orphaned button/display/log/Wi-Fi/MQTT/Telegram/time APIs, unused AudioSnapshot and MQTT runtime fields, write-only MQTT state, unused Datacake helper variants, one unused Wi-Fi client, and the unused Apps Script `timestampKey_()` helper.
2. Kept runtime behavior equivalent: WQTT and Datacake publish the same signal text, the disabled startup I2C scan still emits the existing `startup scan skipped` line, and display pages receive the same live values without the two previously ignored version/build arguments.
3. PING/PONG, TEL/ACK, SLEEP/SACK, STATUS, `/c3sts`, retries, timeouts, NVS migration, Wi-Fi, Telegram, WQTT, Datacake HTTP, Google Sheets, local logs, diagnostics, OTA, scheduled restart, audio classification, and all device state remain unchanged. C3, GPIO23, and the future `/c3wkp` stage were not touched.
4. Validation: the controller contract plus all four Google Sheets regression tests pass, `git diff --check` passes, and the single `pio run -e esp32dev` succeeds. RAM is `65,532 / 327,680` (`20.0%`), `104` bytes below build `139`; linked Flash is `1,362,719 / 1,572,864` (`86.6%`), `768` bytes below build `139`; OTA-slot reserve is `210,145` bytes. `firmware.bin` is `1,363,120` bytes with SHA-256 `3FBEACDFBD51608BDC7D6F7C5478B10876C282AE4F5CD8B0B7F2C64FE14445ED`. No upload, publication, commit, or push was performed.
5. Physical deployment: the user manually uploaded build `140`. `/bssts` confirmed BS Online, synchronized time, Wi-Fi `100% (-48 dBm)` on `NKAANNE`, WQTT `OK`, a bounded Sheets queue of `1`, normal sound/environment reporting, and the expected C3 `SLP` state with telemetry age `384 s`.
6. The first build-140 diagnostic run completed approximately `81 min`: four consecutive `UART_SLP -> UART_WAIT -> UART_OK` cycles with C3 build `206`, `C3_GAP=0`, `UART_OFF=0`, nine delivered Sheets windows with `GS_DROP=0`, stable free heap near `180 KB`, and no Datacake failure. One `30 s` WQTT interruption recovered automatically while Wi-Fi stayed connected. This closes the source-cleanup compatibility gate.

## Narrow C3 diagnostic UART cleanup - 0.1.85-EXP build 139 - 2026-08-25

1. Reduced the active BS-to-C3 command allowlist to `STATUS 0` only. `/c3sts`, PING/PONG, TEL/ACK, SLEEP/SACK, strict STATUS parsing, retries, persistence, and truthful fresh/cached Telegram reporting are unchanged.
2. Removed the unused BS `TREQ/TIME` responder and dormant `WIFI_OFF` sender left by the retired Gateway/Service experiment. No new library, task, queue, NVS namespace, UART frame, or control mode was added.
3. Extended the existing command-store migration: persisted legacy command codes `2` (`OTA_ON`) and `3` (`WIFI_OFF`) are both reset and saved as `Idle`, so neither can block STATUS after the update.
4. GPIO23 wake is deliberately not part of this build. C3 source/firmware, BS tokens/chat identifiers, normal notifications, INA3221 telemetry, Wi-Fi behavior, and device state are unchanged. No upload or publication was performed.
5. Validation: `node test/controller_command_contract_test.js`, `git diff --check`, and one `pio run -e esp32dev` pass. RAM is unchanged at `65,636 / 327,680` (`20.0%`); linked Flash is `1,363,487 / 1,572,864` (`86.7%`), `528` bytes less than build `138`; OTA-slot reserve is `209,377` bytes. `firmware.bin` is `1,363,888` bytes with SHA-256 `92DC29384D5DA7E14C77EEDCD94F5358E14EA177F43BC9DB2968AE7B1C34D166`. No upload or publication was performed.

## Retire BS-mediated C3 OTA - 0.1.84-EXP build 138 - 2026-08-25

1. Removed the BS Telegram `/c3ota` command, its reply state/cards, and the specific `queueOtaOnCommand()` / `OTA_ON` sender path. The command poll now advertises and recognizes only `/c3sts` and `/bssts`.
2. Preserved the shared persisted command engine and the existing STATUS lifecycle without changing `/c3sts`, PING/PONG, telemetry/ACK, SLEEP/SACK, C3 status rendering, tokens, or the configured group `chat_id`.
3. Added a bounded build-138 migration for legacy command code `2`: any saved queued, sent, accepted, terminal, or otherwise stale OTA_ON record is reset to persisted `Idle` during command-store loading, so it cannot block a new STATUS request.
4. C3 build `205` owns its Wi-Fi, bot, MQTT, Sheets, and manual OTA again. No proxy, wakeup command, backup Wi-Fi, connectivity mode, C3 source change, upload, or publication is part of this BS-only step.
5. Validation: `node test/controller_command_contract_test.js`, `git diff --check`, and one `pio run -e esp32dev` pass. RAM is `65,636 / 327,680` (`20.0%`), linked Flash is `1,364,015 / 1,572,864` (`86.7%`), OTA-slot reserve is `208,849` bytes, and `firmware.bin` is `1,364,416` bytes with SHA-256 `90A52405641F447B93EA8D2FEC6E6CB475B1B68BD3FCAFA9C67889628B6231E1`. No upload or publication was performed.

## BS late C3 command-response tolerance - 0.1.83-EXP build 137 - 2026-08-23

1. Corrected the confirmed false `/c3ota` failure on BS build `136`: OTA_ON sequences `40`, `41`, and `42` each exhausted four identical `CMD` transmissions without a timely `CACK`, while C3 could still process the command later and physically open `Connectivity: Service` with OTA enabled.
2. Preserved the exact maximum of four identical command transmissions and the existing `2 s` ACK cadence. After the fourth transmission, BS now sends nothing further and waits passively for a matching late `CACK` or `CRES` for `40 s` before declaring bounded `ACK_TIMEOUT`.
3. A matching `CACK` now opens a `40 s` result window. Existing result-recovery sends may use only the transmissions still remaining inside the same four-transmission total; they can no longer increase UART traffic beyond that cap.
4. A strict matching `CRES OK OTA_ON=600` remains sufficient terminal proof and completes the request as `EXECUTED` even when the separate `CACK` was lost. Telegram therefore cannot publish `Not enabled / FAILED` until the final passive window really expires.
5. Investigation of sequence `42` confirmed that UART retries keep the original sequence. A new sequence is allocated only by a separately queued authorized Telegram `/c3ota`; therefore `42` was a third queue event, not a retry of `41`. Because the old journal did not retain Telegram `update_id`, it cannot distinguish a third unseen update from replay after a Telegram cursor reset. New OTA `CMD_QUEUE` diagnostics include bounded `source_update_id` metadata for future proof.
6. C3 source/firmware, `TREQ/TIME`, `SLEEP/SACK`, telemetry frames, command payloads, retry cadence, and the maximum number of `CMD` transmissions are unchanged.
7. Validation: `node test/controller_command_contract_test.js` and `git diff --check` pass. `pio run -e esp32dev` succeeds with RAM `65,636 / 327,680` (`20.0%`), linked Flash `1,366,159 / 1,572,864` (`86.9%`), OTA-slot reserve `206,705` bytes, firmware image `1,366,560` bytes, and SHA-256 `31B1563EE853DFBDEE24DBE911B24A225877DF2A133AEAF87F8626CAB464E2A6`.
8. BS OTA upload to `192.168.1.134` completed successfully. The live web endpoint identifies `WROOM 0.1.83-EXP build 137`; one `/c3ota` late-response acceptance check remains as the focused physical gate.

## BS Gateway/Service preparation - 0.1.82-EXP build 136 - 2026-08-23

1. Added a demand-driven, backward-compatible Gateway time bootstrap on BS: future C3 firmware may send strict `TREQ 1 <nonce>` and receives a flushed `TIME 1 <nonce> <utc_epoch>` response. Unsynchronized BS time is reported truthfully as epoch `0`; current C3 build `197` never requests the frame and is unaffected.
2. Added dormant BS sender support for the already specified `WIFI_OFF 0` command. There is deliberately no Telegram caller, so build `197` cannot receive the unsupported command. The persistent command record layout remains compatible with existing STATUS/OTA records.
3. Kept one clear user-facing OTA command: `/c3ota` queues `OTA_ON 600` and reports a 10-minute OTA window. The redundant alternate command name and alias behavior were removed; actual firmware upload remains in the C3 project.
4. Documented the target `Direct / Gateway / Service` state model. Direct remains the safe C3 default; Gateway cannot become normal until C3 time fallback, telemetry, Smart Auto, sleep/wake, service timeout, OTA, and recovery are physically proven.
5. This is BS-only local preparation. C3 source, C3 firmware, device settings, Wi-Fi state, autonomous control, and sleep behavior were not changed; no upload was performed.
6. Validation: `node test/controller_command_contract_test.js` and `git diff --check` pass. `pio run -e esp32dev` succeeds with RAM `65,636 / 327,680` (`20.0%`), linked Flash `1,366,051 / 1,572,864` (`86.9%`), OTA-slot reserve `206,813` bytes, firmware image `1,366,448` bytes, and SHA-256 `D1A787CE015677B060B62039A18B5F5DBC432E050257B907763C7DEDD059B3D5`.
7. Physical deployment: the user uploaded BS build `136`. Telegram `/bssts` confirmed BS Online, Wi-Fi `100% (-42 dBm) NKAANNE`, synchronized time, WQTT `OK`, and Sheets queue `0`; ordinary C3 telemetry then identified the unchanged C3 build `197` with INA3221/GPS data intact.
8. The post-OTA diagnostic segment physically passed backward compatibility: C3 announced `SLEEP 600`, BS recorded `SLP -> WAIT -> OK`, wake recovery took `7 s`, `C3_GAP` stayed `0`, `GS_DROP` stayed `0`, WQTT remained `OK`, and completed Sheets windows uploaded. A second valid `SLEEP 600` announcement followed.
9. One transient `UART_OFF` occurred after the OTA restart while C3 was already asleep, and STATUS sequence `25` ended in the known bounded `ACK_TIMEOUT` with truthful cached Telegram fallback. These stay in the parallel scheduled-restart/STATUS evidence ledger and do not block the next C3 Gateway implementation stage. `TREQ/TIME` and `WIFI_OFF` remain unexercised as expected because C3 build `197` does not use them.

## BS 135 / C3 197 controller-link field acceptance - 2026-08-23

1. Accepted the paired sleep-handshake fix on physical BS `0.1.81-EXP` build `135` and C3 `1.2.0-c3` build `197`: eight consecutive `UART_SLP -> UART_WAIT -> UART_OK` cycles recovered in `9..17 s`; after the first newly accepted sleep announcement, `UART_OFF` stayed at `1` and `C3_GAP` stayed at `0`.
2. Accepted the routine automatic C3-to-BS telemetry gateway for continued integration. Power data, saved GPS context, WQTT/Telegram delivery, duplicate re-ACK, sequence continuity, and repeated sleep/wake recovery are sufficient to move to shared-power validation.
3. Kept STATUS command reliability as explicit non-blocking evidence debt. In sequences `18..24`, four commands completed with fresh `OK STATUS` and three ended in bounded `ACK_TIMEOUT` while automatic telemetry remained active; Telegram correctly reported cached data with refresh failure instead of pretending it was fresh.
4. Deferred scheduled BS restart during declared C3 sleep, true missing-link proof, STATUS/CACK reliability, TTL expiry, and controller-restart exact-once cases to periodic long-run evidence. These remain required for final link or remote-control acceptance but no longer delay the shared-power stage.
5. Documentation only: no firmware, wire protocol, data schema, build, or device upload changed in this step.

## Google Sheets compact charts dashboard layout - 2026-08-23

1. Reorganized the `charts` sheet into two clean panels: `DAYPART LEVELS`, `NOISE MIX`, and `DATA COVERAGE` remain in `A:C`; the centered newest-first `DAILY VERDICT` table starts in `E:H`; and its chronological chart is aligned to the same left edge directly below the last visible verdict row.
2. Moved hidden chronological chart-source data to `Q:T`, outside the visible dashboard, and added a layout contract proving that the summary, verdict table, chart, and helper ranges do not overlap.
3. Centered the `DAYPART LEVELS` and `DAILY VERDICT` headings, widened the four verdict columns to the chart's `640 px` width, calculated the chart row dynamically with a one-row visual gap, normalized dashboard row heights, removed legacy merged ranges, and added a compact `No data yet` state.
4. A direct `Rebuild charts only` menu call now performs the complete formatting pass by default. Analytics calculations, source tables, newest-first visible verdict order, chronological chart order, firmware, and controller operation are unchanged. No Apps Script deployment was performed.

## Google Sheets compact user view and automatic rollover layout - 2026-08-23

1. Audited all 36 raw Google Sheets columns. No field was deleted: the non-user fields still support signal, SHT31, memory, restart, acoustic-revision, exported-log, and future dB-calibration analysis.
2. Centralized the raw-table presentation contract. User mode now keeps only `DEV ID`, date/time, day part, relative level, `NOW/H/M`, `AVG P2P`, `SIG IN`, temperature, and humidity visible; every other raw field is derived automatically as a technical column. Technical mode still shows the complete schema, and contiguous technical columns are hidden in batches to reduce Sheets API calls.
3. Hardened date rollover: a new active `log` receives the complete header/body layout and current column mode immediately, merged or renamed archives are fully formatted and newest-first, and the completed archive is hidden after the replacement `log` exists.
4. Analytics rebuilds now restore the current User/Technical column visibility after their formatting pass. The former `Refresh all table layout/order` command remains only as a recovery tool and is renamed `Repair all table layout/order`.
5. Firmware, controller UART behavior, the 36-column ingestion schema, stored rows, analytics calculations, triggers, and charts are unchanged. No Apps Script deployment was performed.
6. Removed the duplicate Technical-mode `Rebuild analytics` item because the top-level `Refresh latest data` calls the same function. Moved the rare live-state rescan from the top level to `Diagnostics -> Refresh status indicators`, retained the layout recovery under `Maintenance`, and shortened its label to `Repair table layout/order`.

## Confirmed C3 sleep announcement handshake - 2026-08-23

1. Physical C3 build `196` evidence rejected blind repetition as insufficient: four accepted `UART_SLP` cycles coexisted with four false `UART_OFF` transitions, and the counter grew from `10` to `14` while C3 continued normal wake recovery. No reset, WDT, brownout, WQTT, Datacake, Sheets-drop, or sequence-gap evidence explained the misses.
2. Added local BS `0.1.81-EXP` build `135`. Every strict valid `SLEEP <seconds> C3 <build>` frame still enters `SLP` with unchanged timing, and BS now immediately returns and flushes `SACK <seconds> C3 <build>`. Repeated valid sleep frames are acknowledged idempotently.
3. Added paired local C3 `1.2.0-c3` build `197`. C3 sends the unchanged sleep frame, waits at most `2 s` for the exact matching `SACK`, and makes at most four attempts. Unrelated input is ignored during this final sleep boundary; absence of BS never blocks autonomy because C3 still enters the already configured Deep Sleep after the bounded wait.
4. Upload order is BS build `135` first, then C3 build `197`. BS `135` remains backward-compatible with uploaded C3 `196`; uploading C3 first would only add a bounded wait because BS `134` cannot return `SACK`.
5. Sleep duration/timer identity, BS liveness thresholds, PING/PONG, TEL/ACK, command frames, sound processing, INA3221, Charge, Smart Auto/Classic, GPS, Wi-Fi, cloud, Telegram, Sheets, and OTA behavior are unchanged. No upload was performed.
6. Validation: `node test/controller_command_contract_test.js`, paired C3 `node tests/firmware_contract_test.js`, and both `git diff --check` checks pass. `pio run -e esp32dev` succeeds with RAM `65,636 / 327,680` (`20.0%`), linked Flash `1,365,491 / 1,572,864` (`86.8%`), OTA-slot reserve `207,373` bytes, and a `1,365,888`-byte image with SHA-256 `5D2B5BC6C8067FE4EFF01FFC6C2B9A5A80B04DD8B7A8B4D39F182017A54D4A2C`. C3 build `197` succeeds at RAM `13.2%`, Flash `65.7%`, image `1,381,264` bytes, SHA-256 `3DAE5B68F9138436AFD7DD6A557029A986DA92910AD300C35E377A7F010F2511`. Physical acceptance requires three consecutive `SLP -> WAIT -> OK` cycles with no new `UART_OFF`.

## Saved C3 GPS FIX relay through BS - 2026-08-22

1. Added local BS `0.1.80-EXP` build `134` and paired local C3 `1.2.0-c3` build `195`. C3 appends its already saved, manually confirmed GPS FIX to the existing reliable `TEL/ACK` frame as integer latitude/longitude microdegrees, satellites, HDOP tenths, and fix epoch; it does not power or query GPS, create a schedule, or change sleep behavior.
2. BS keeps backward compatibility with the uploaded build-194 power-only frame and strictly validates the optional GPS suffix. A valid saved FIX is exposed in `/c3sts` as a Google Maps link with satellites, HDOP, and age, and is included in the retained WQTT C3 telemetry JSON.
3. Added bounded diagnostics: accepted UART telemetry reports only `gps=FIX/NONE`, and the rotating journal emits `C3_GPS` only when saved-fix state or epoch changes. Coordinates, bot tokens, and chat identifiers are not written to the diagnostic journal.
4. Safe manual deployment order is BS build `134` first, then C3 build `195`. This lets the new BS continue accepting the currently uploaded legacy C3 build `194`; uploading C3 first would temporarily make the old BS reject the extended frame.
5. No firmware upload was performed. Physical acceptance requires the uploaded build pair, one saved manual C3 FIX, `/c3sts` Google Maps output, `C3_GPS fixed=1`, and one matching WQTT JSON payload. The C3 project's own Telegram OTA remains the primary C3 upload path.
6. Validation: both focused contract tests and both `git diff --check` checks pass. `pio run -e esp32dev` succeeds with RAM `65,636 / 327,680` (`20.0%`), linked Flash `1,365,335 / 1,572,864` (`86.8%`), OTA-slot reserve `207,529` bytes, and a `1,365,744`-byte image with SHA-256 `B6714A5249402149C29DDAAF6EC8372C79A1B10D1FDBBE134B0004F049BC915E`.
7. First physical gate passed: the user uploaded BS build `134`. Telegram confirmed BS Online, `100% (-47 dBm) NKAANNE`, synchronized time, and an `OK` link to the still-uploaded legacy C3 build `194` with fresh telemetry `q=134`, age `6 s`, and INA3221 `OK`. This proves backward-compatible parsing and normal power telemetry before the C3 half changes. C3 build `195` and the saved-FIX outputs remain pending.
8. Second physical gate passed: the user uploaded C3 build `195` through the C3 project's own OTA path. Its Online card confirmed a normal Soft Restart, Smart Auto standby, Charge OFF/GPIO3 LOW, and Wi-Fi connection. BS-side build-change, extended telemetry, saved-FIX card, diagnostic, and WQTT evidence remain the next focused gate.
9. The paired BS group then emitted exactly one compact `C3 Update / Online · build 195` notice. This physically proves build-change detection across the UART link and closes the pending notification gate from BS build `133`; same-build no-spam behavior remains covered by its source contract and continued observation.
10. The first build-195 `/c3sts` round trip passed physically with `Link: OK`, `Data: Fresh`, telemetry `q=8`, age `0 s`, INA3221 `OK`, and plausible power/control fields. The same card rendered the saved FIX as a Google Maps link with `9` satellites, HDOP `2.4`, and age `5 d 20 h`. This proves extended UART parsing and the BS user-facing GPS output; the old age is expected for a preserved manual FIX and does not imply an automatic GPS update. Only bounded diagnostic and WQTT publication evidence remains for this stage.
11. Analysis of `NT4/diagnostics.log` physically confirms the bounded GPS journal event at `20:27:41`: `C3_GPS fixed=1 sat=9 hdop10=24 epoch=1786909824`. Across build-195 operation, BS accepted `61` additional telemetry frames, all `12` HEALTH rows reported WQTT `OK`, `GS_DROP` stayed `0`, and STATUS sequences `13`, `14`, and `15` reached terminal `OK STATUS`; sequences `13/14` also proved duplicate replay after bounded retries.
12. The same log exposes an independent sleep-announcement acceptance failure that must not be hidden by the successful GPS result. Build `195` produced `8` C3 wake sessions and seven repeated `WAIT -> OFF -> OK` recoveries, but zero accepted `UART_SLP` events. The timing matches the configured `Deep 10 min / Awake 3 min`, so C3 is sleeping and waking rather than hanging; BS reports `OFF` because no valid `SLEEP 600 C3 195` frame was received. The C3 source still has the required `announceSleep()/flush()` ordering, so no WROOM timeout change is justified and root-cause work remains C3-focused.
13. Local C3 build `196` is ready without any BS firmware change. It preserves the same frame and sleep duration but sends three atomic flushed copies with `40 ms` guards, targeting the physical delivery boundary while keeping BS parsing idempotent. Contract/build checks pass; manual C3 OTA and several `SLP -> WAIT -> OK` cycles remain.

## Short C3 build-change notice in BS - 2026-08-22

1. Added local BS `0.1.79-EXP` build `133`. After the normal first `C3 Controller` card establishes a baseline, BS now sends one compact `🔧 C3 Update / Online · build N` Telegram message when the C3 build number changes while BS remains running.
2. The notice is driven only by the accepted UART build value. Ordinary C3 Deep-Sleep sessions, wakeups, retries, and restarts with the same build do not generate it, and BS does not claim that the change was necessarily caused by OTA.
3. The user confirmed C3 build `194` was uploaded through the C3 project's own Telegram OTA flow. That C3 bot remains the primary future C3 upload path. The already implemented BS `/c3ota` command is retained as an optional reserve but its remaining ACK/sleep acceptance work is deliberately skipped and does not block the next integration stage.
4. No firmware upload was performed. Physical proof is intentionally deferred until the next real C3 build change: after manually uploading BS build `133`, the next normal C3 update must produce exactly one compact BS-group notice.
5. Validation: `node test/controller_command_contract_test.js`, `git diff --check`, and `pio run -e esp32dev` pass. RAM is `65,612 / 327,680` (`20.0%`), linked Flash is `1,363,207 / 1,572,864` (`86.7%`), OTA-slot reserve is `209,657` bytes, and the firmware image is `1,363,616` bytes with SHA-256 `1DCABA335801F937FE164879F266FE1B7F3A03D4FE13A75D4E5F4D99BF913726`.
6. Physical deployment proof: the user uploaded BS build `133`. Telegram `/bssts` showed `0.1.79-EXP build 133`, BS Online, Wi-Fi `100% (-44 dBm) NKAANNE`, WQTT `OK`, Sheets queue `0`, and C3 link `OK` with telemetry age `4 s`. The remote journal confirms the build-133 boot and subsequent HEALTH rows with C3 build `194`; this establishes the notification baseline. The one-message build-change behavior remains intentionally pending until the next real C3 firmware update.

## Bounded C3 OTA activation through BS - 2026-08-22

1. Added local BS `0.1.78-EXP` build `132` and paired local C3 `1.2.0-c3` build `193`. The authorized `/c3ota` Telegram command queues only `OTA_ON 600`, using the persisted command-v1 sender and the C3 project's existing 10-minute ArduinoOTA listener; no second OTA server or second C3 bot was created.
2. An awake `OK` link gets a 180-second command lifetime. A declared `SLP` link gets the remaining announced sleep plus 180 seconds, capped at the protocol maximum of 7200 seconds; BS never transmits during declared sleep. `WAIT/OFF` is rejected without creating a misleading queue.
3. Telegram reports two distinct states: an initial `Queued` card and, only after matching `CRES`, a terminal `Enabled / EXECUTED` or truthful failure/expiry card. Duplicate `/c3ota` updates in one poll are coalesced. `/c3sts` attaches only to `STATUS`, so it cannot consume or clear an OTA transaction.
4. C3 persists the OTA duration without changing the build-192 command record layout/session history, activates the existing listener before returning `OK OTA_ON=600`, suppresses automatic sleep while the request awaits Wi-Fi and while the window is active, and retains duplicate/no-reexecution behavior. Normal C3 Wi-Fi, Telegram, MQTT, Sheets, NTP, INA3221, Charge, Solar Control, GPS, and sleep durations are unchanged; `WIFI_OFF`, `RESTART`, and control commands remain disabled.
5. No upload was performed. Manual order is C3 build `193` first, then BS build `132`; physical acceptance must prove awake activation, queued-during-`SLP`, one real OTA upload/recovery, automatic 10-minute expiry, and return to the normal sleep plan.
6. Validation: both command contract tests and `git diff --check` pass. `pio run -e esp32dev` succeeds with RAM `65,604 / 327,680` (`20.0%`), linked Flash `1,362,591 / 1,572,864` (`86.6%`), OTA-slot reserve `210,273` bytes, and a `1,362,992`-byte firmware image (SHA-256 `F2B5F023166756B045326EDD8FBB13746593F9249892E4B03C3289EFE078658A`). Relative to build `131`, RAM is unchanged and linked Flash increases by `2,576` bytes.
7. First physical evidence: BS build `132` detected C3 build `193`, queued OTA sequences `6` and `7`, and correctly retained their terminal `ACK_TIMEOUT` after four transmissions because no `CACK` arrived. In parallel, C3 physically opened the listener, completed the OTA image in `121 s`, restarted, and returned online as build `193`. This proves the OTA side effect but exposes missing command-frame transmission completion.
8. C3 build `194` was then uploaded successfully through an OTA window opened by build `193` and appeared in the BS journal as a new C3 session at `18:57:03`. The preceding sequence `8` (`18:53:51..18:53:58`) ended `OK actual=OTA_ON=600`, but it was still executed by build `193`; therefore it does not validate the build-194 `CACK/CRES` flush correction. BS build `132` remains unchanged and needs no new upload. One new awake `/c3ota` on build `194` is still required.

## Fresh C3 status and live BS status command - 2026-08-22

1. Added BS `0.1.77-EXP` build `131`. The authorized `/c3sts` Telegram command now uses the build-130 persistent `STATUS` sender only while C3 is awake and the UART link is `OK`; a successful `CMD/CACK/TEL/CRES` cycle is labelled `Data: Fresh`.
2. Preserved the low-cost read-only behavior during C3 Deep Sleep or a degraded link. `/c3sts` immediately returns the last accepted telemetry as `Data: Cached` and does not enqueue a command that cannot wake C3.
3. Added `/bssts` and `/bssts@BotName`. It reports the current BS version/build, uptime, Wi-Fi/SSID/IP, time state, relative `Now/H/M`, day part, noise level, microphone signal, SHT31 reading, WQTT state, Sheets queue, C3 link/telemetry age, and existing statistics/log links without requesting C3 or taking new measurements.
4. Kept duplicate-command coalescing for both `/c3sts` and `/bssts`, the existing authorized-chat and freshness checks, the 60-second Telegram poll interval, and bounded HTTP timeouts. No C3 Wi-Fi, Charge, Solar Control, GPS, sleep, MQTT, Sheets, log, sound-processing, or UART telemetry format changed.
5. C3 remains `1.2.0-c3` build `192`. No firmware upload is performed automatically; physical acceptance requires a manual BS build-131 upload and tests of `/bssts`, awake `/c3sts`, sleeping `/c3sts`, and duplicate coalescing.
6. Validation: `node test/controller_command_contract_test.js` and `git diff --check` pass; `pio run -e esp32dev` succeeds with RAM `65,604 / 327,680` (`20.0%`), linked Flash `1,360,015 / 1,572,864` (`86.5%`), OTA-slot reserve `212,849` bytes, and a `1,360,416`-byte firmware image (SHA-256 `991EA069DAF0DBF78BCD9FC38C2FDE97C4334164FD070E352AD345A706E70787`). Relative to build `130`, RAM increases by `16` bytes and linked Flash by `5,168` bytes.

## Dormant persistent WROOM command sender - 2026-08-22

1. Added local WROOM `0.1.76-EXP` build `130` as the first implementation-only step of command protocol v1. `ControllerLinkService` now owns one versioned `c3_command` NVS record with a persistent random command epoch, monotonic sequence, absolute expiry time, STATUS request identity, state, and terminal result.
2. Added a dormant `queueStatusCommand()` API with no caller. It requires working NVS and synchronized wall-clock time, persists before UART transmission, waits while C3 is not `OK`, freezes the first transmitted TTL, sends a maximum 47-character `CMD 1 ... STATUS 0` frame, and uses bounded identical ACK/result recovery attempts.
3. Added strict matching `CACK 1 ... NEW|DUP` and `CRES 1 ...` parsing, terminal `Executed/Failed/Expired` retention, explicit clearing, duplicate/result recovery support, and bounded `CMD_QUEUE/TX/ACK/DUP/RESULT/RETRY/EXPIRE/REJECT` diagnostic callbacks.
4. Added `test/controller_command_contract_test.js` to enforce persistence-before-send, STATUS-only execution, no Telegram/main enqueue caller, existing C3 line-capacity compatibility, sleep-safe waiting, retry limits, and the absence of executable `OTA_ON`, `WIFI_OFF`, or `RESTART` behavior in this stage.
5. C3 build `191`, Telegram commands, receive-only frames, INA3221, Charge/GPIO3, Classic/Smart Auto, GPS, Deep Sleep, MQTT, Sheets, sound processing, and all device firmware remain unchanged. No upload is authorized in this stage.
6. Validation: `node test/controller_command_contract_test.js` and `git diff --check` pass; `pio run -e esp32dev` succeeds with RAM `65,588 / 327,680` (`20.0%`), linked Flash `1,354,847 / 1,572,864` (`86.1%`), OTA-slot reserve `218,017` bytes, and a `1,355,248`-byte firmware image (SHA-256 `694BB04F9EEB6E8BDAA389CB4D0C21D0E94397D2048C6CF41BB29288AD5C7649`). Relative to build 129, RAM increases by `152` bytes and linked Flash by `4,736` bytes.

## Controller-link evidence ledger and bounded command specification - 2026-08-22

1. Added `CONTROLLER_LINK_ACCEPTANCE.md` as the compact physical-evidence ledger. The receive-only UART formats are accepted for continued development, while build-191 long-run sleep coverage, scheduled WROOM restart during declared `SLP`, and safe true-missing-link proof remain visible non-blocking evidence debt required before final link acceptance.
2. Recorded the first build-191 live baseline: two correct `SLEEP` announcements (`600 s` and `5400 s`), `UART_SLP=2`, `UART_WAIT=2`, `UART_OK=2`, `UART_OFF=0`, and maximum `C3_GAP=0` in the 2026-08-22 remote diagnostic journal.
3. Extended `CONTROLLER_UART_PROTOCOL.md` with specification-only command protocol v1: `CMD/CACK/CRES`, persistent WROOM command epoch and sequence, `1..7200 s` TTL, one persisted outstanding command, bounded identical retries, duplicate result replay, strict rejection, the existing 47-character C3 input limit, and truthful lifecycle diagnostics.
4. Staged the allowlist as `STATUS`, then `OTA_ON`, `WIFI_OFF`, and separately approved `RESTART`. Charge, Solar Control mode, GPIO3, GPS scheduling, and sleep-setting commands are explicitly excluded from v1.
5. Corrected the canonical heartbeat text to the deployed build-129 semantics: `WAIT` after three PONG misses plus 90 seconds of silence and `OFF` only after 240 seconds without valid C3 activity.
6. Documentation only: WROOM remains `0.1.75-EXP` build `129`, C3 remains `1.2.0-c3` build `191`, no firmware source/build/upload or device state changed.

## Pre-bidirectional full backups - 2026-08-22

1. Created a fresh full private snapshot of uploaded WROOM `0.1.75-EXP` build `129`: `D:\DEV\BSPRJ-backups\BSPRJ_FULL_2026-08-22_00-37-36.tar`, `110,389,760` bytes, SHA-256 `03FFAB887331E5D15F7A37C90F6D976F8288807FDC12BC6AE13C2698085516E3`.
2. Created a separate fresh full private snapshot of the current uploaded C3 `1.2.0-c3` build `191`: `D:\DEV\INA3221-C3-backups\INA3221-C3_FULL_2026-08-22_00-27-16.tar`, `4,440,384,000` bytes, SHA-256 `697765058A6417F013E9548F35DAC46C2CFD1E9D411BCB0FE58920CA6D5EE587`.
3. Both packages contain a portable workspace without the external `.git` pointer, `.pio` and the captured `firmware.bin`, local private configuration, a verified `git/repository.bundle`, `RESTORE_MANIFEST.json`, `RESTORE_INSTRUCTIONS.md`, and `SHA256SUMS.txt`. Critical-file hashes, complete workspace inventories, Git bundle verification, and standalone restore tests passed.
4. These archives must remain private because they include `include/secrets.h`. No firmware source, version, build, device upload, branch, commit, or remote repository was changed by this backup stage.

## Google Sheets automatic raw-header recovery - 2026-08-20

1. Added a lightweight raw-header repair path for the active `log`: every accepted `doPost()` row now restores the 36 header values, semantic background colors, bold 11-point text, alignment, wrapping, medium borders, and the frozen first row.
2. Kept full column sizing and body-table formatting in the existing full-layout path. The automatic repair touches only row `1`, so it does not replace the alternating odd/even body colors or reformat archives on every upload.
3. New daily `log` sheets still receive the complete layout immediately when they are created; `Refresh all table layout/order` remains an optional repair for existing raw and analytics sheets rather than a daily requirement.
4. Validation: all four Google Sheets regressions passed, including a new contract check proving that every accepted prepended row calls the header self-heal path. Firmware was not changed; WROOM `0.1.75-EXP` build `129` and C3 build `189` require no upload for this Apps Script-only step.
5. The updated bound `Code.gs` must be saved and the web-app deployment moved to a new version before live automatic recovery can be validated on the next accepted 10-minute window and the next date rollover.

## UART wait/off semantics and planned-sleep restart continuity - 2026-08-18

1. Added WROOM build `129` (`0.1.75-EXP`) after the build `128` approximately `48 h 40 min` field journal proved reliable rotation, `293` continuous ten-minute windows, `1119` accepted C3 frames, `4` handled duplicates, `C3_GAP=0`, and `GS_DROP=0`, but exposed two self-recovering awake-state `UART_OFF` transitions and one false post-restart `OFF` while C3 was in a previously declared Deep Sleep.
2. Split degraded and missing-link semantics. Three missed PONG responses plus `90 s` without valid C3 traffic now changes an online link to `WAIT`; a real `OFF` requires `240 s` without any valid C3 traffic. Any strictly parsed `TEL` or matching `PONG` immediately restores `OK`, including recovery from `WAIT`.
3. A declared C3 sleep deadline and C3 build are now retained in RTC memory only for the next planned software restart. WROOM restores `SLP` after that restart, clears the one-shot checkpoint immediately, starts a fresh `240 s` wake grace period when the expected sleep ends, and never restores this state after power-on, brownout, watchdog, or other reset causes.
4. Corrected the current WROOM OTA route: device target `192.168.1.134` and PC callback `192.168.1.81`. No upload was performed. UART frame formats, telemetry/ACK/deduplication, sound processing, cloud payloads, C3 build `187`, and C3 firmware behavior are unchanged.
5. Validation: `git diff --check` and `pio run -e esp32dev` -> SUCCESS, RAM `65,436 / 327,680` (`20.0%`), Flash `1,350,111 / 1,572,864` (`85.8%`), linked OTA-slot reserve `222,753` bytes, firmware `1,350,512` bytes, SHA-256 `6C2E8E980099CED7769834F1D28E017677ECD76EF1BEE1A25F3FE3E70E6DCECF`. The linked image is `628` bytes above build `128`; manual WROOM OTA and the focused `3-5 h` physical gate remain.
6. Physical evidence: the user uploaded build `129` and collected approximately `21 h` of WROOM build `129` / C3 build `188` diagnostics. The run confirmed repeated declared `SLP -> WAIT -> OK`, correct `90 s` WAIT and `240 s` OFF timing, automatic recovery, `GS_DROP=0`, stable heap, and exact reconciliation of all `127` local ten-minute windows with Sheets.
7. The five recorded `UART_OFF` periods recovered with new C3 sessions and are now explained by C3 Deep Sleep rather than WROOM liveness failure; the long period ending at `18:36` included a user command sent at `16:01` that could execute only after C3 woke. Some C3 Smart Auto sleep paths did not first deliver the existing UART `SLEEP` frame, so WROOM correctly treated the unexplained silence as a missing link. The focused gate remains open for universal C3 sleep announcement, `C3_GAP=0` instead of the observed total `5`, and a software WROOM restart during declared C3 sleep. WROOM code and thresholds require no change from this evidence.

## Analysis-ready remote diagnostics and lean web service - 2026-08-16

1. Added WROOM build `128` (`0.1.74-EXP`) as the finalized local implementation of the balcony diagnostic-journal contract. `/diagnostics.log` now uses the fixed 50-column TSV v2 schema, and compact `HEALTH` records are aligned with completed ten-minute sound windows instead of running as an independent five-minute stream.
2. Replaced per-frame C3 telemetry logging with event and counter evidence: `C3_WAKE`, critical `C3_CHANGE`, `C3_DUP`, `C3_GAP`, and `UART_WAIT/OK/SLP/OFF`. Ordinary accepted telemetry remains available in periodic `HEALTH`, while cumulative accepted, duplicate, gap, and offline counts preserve transport-quality evidence without excessive LittleFS growth.
3. Corrected network semantics. WQTT now reflects the actual MQTT socket, Datacake has separate cumulative HTTP success/failure counters, and each real Wi-Fi interruption is coalesced into `WIFI_LOST` followed by `WIFI_OK duration_s=...` while retaining the last valid SSID, IP, and RSSI context.
4. Simplified the WROOM log web service to a minimal generated index with build/uptime/storage information, individual diagnostic sizes, streaming downloads, archive listing, and guarded clear actions. Successful actions redirect to the index, and HTTP routes are registered only once rather than accumulating after IP changes.
5. The diagnostic pair remains bounded to approximately `256 KiB`; analytical CSV semantics, sound processing, Telegram, Google Sheets payloads, MQTT payloads, C3 build `185`, UART frames, ACK/retry/deduplication, and C3 Deep Sleep behavior are unchanged. C3 requires no upload.
6. Validation: `git diff --check` and `pio run -e esp32dev` -> SUCCESS, RAM `65,436 / 327,680` (`20.0%`), Flash `1,349,483 / 1,572,864` (`85.8%`), linked OTA-slot reserve `223,381` bytes, firmware `1,349,888` bytes, SHA-256 `EAEFE46A0A172B2FE7AC1FF422660B63E8222612D2A47531B0F8543BA5FCD552`. This is only `552` linked Flash bytes above the build `127` baseline and remains inside every resource gate. Manual WROOM OTA and the physical diagnostic acceptance gates remain.

## Rotating Wi-Fi diagnostic log for balcony operation - 2026-08-15

1. Added WROOM build `127` (`0.1.73-EXP`) with a dedicated tab-separated `/diagnostics.log`, independent from the 10-minute analytical `/sound_log.csv`. It records exact state transitions and compact analysis-ready evidence without requiring a continuously attached USB serial monitor.
2. Recorded events include boot/reset, Wi-Fi network and signal context, MQTT and UART state transitions, every accepted C3 telemetry frame, duplicate-frame counters, C3 sleep/wake context, INA3221/solar/battery/load values, SHT31 loss/recovery, Google Sheets queue/retry/delivery/drop state, OTA start/result, and scheduled restart. A complete `HEALTH` snapshot is added every five minutes with sound, environment, heap, cloud, UART, and telemetry counters.
3. The active diagnostic file rotates at `128 KB`; one previous file is retained as `/diagnostics-prev.log`, limiting the pair to approximately `256 KB`. Both files are downloadable from the existing WROOM log page. `Clear log` still clears only the analytical active CSV, while `Clear ALL logs` also clears both diagnostic files and recreates a fresh header.
4. C3 protocol, C3 firmware build `185`, Deep Sleep decisions, sound calculations, Telegram commands, MQTT payloads, Google Sheets schema, and existing analytical CSV semantics are unchanged. C3 requires no upload.
5. Validation: `pio run -e esp32dev` -> SUCCESS, RAM `65,388 / 327,680` (`20.0%`), Flash `1,348,931 / 1,572,864` (`85.8%`), linked OTA-slot reserve `223,933` bytes, firmware `1,349,328` bytes, SHA-256 `773545A1E6C96D03C87E232218C8516D9D7AF39917CA4DBFD9300A6A53D5C62E`. Manual WROOM OTA, web download, and awake/Deep-Sleep diagnostic evidence remain.

## UART liveness hardening from build 125 field evidence - 2026-08-15

1. Added WROOM build `126` (`0.1.72-EXP`) after the build `125` logs showed `32` short awake-state `UART OFFLINE` transitions during approximately `4 h 52 min`, while all `318` accepted C3 telemetry frames were still acknowledged and published to MQTT. Every link transition recovered automatically; median visible outage was `2.103 s` and maximum was `15.442 s`.
2. Corrected WROOM liveness semantics: every strictly parsed `TEL` frame now resets the missed-heartbeat counter because valid telemetry itself proves that C3 and the UART transport are alive. Duplicate telemetry also counts as valid activity before it is re-ACKed.
3. Unexpected `OFF` now requires both at least three consecutive 10-second `PONG` timeouts and 90 seconds without any valid C3 traffic. A valid C3 frame immediately restores an already-offline link. Explicit `SLEEP` continues to pause heartbeat traffic and remains unchanged.
4. This is a WROOM-only link-state correction. Frame formats, telemetry values, ACK/deduplication, C3 build `185`, Deep Sleep timing, Telegram, MQTT, Google Sheets, audio, and stored data are unchanged. C3 requires no upload.
5. Validation: `pio run -e esp32dev` -> SUCCESS, RAM `65,300 / 327,680` (`19.9%`), Flash `1,339,507 / 1,572,864` (`85.2%`), linked OTA-slot reserve `233,357` bytes, firmware `1,339,904` bytes, SHA-256 `D777F47B3528285FE2700C22CE8F94B7F5A98439938ACC29F3778047A8D66070`. Manual WROOM upload and an awake/sleep field log remain.

## WROOM Wi-Fi network context in Telegram cards - 2026-08-15

1. Added WROOM build `125` (`0.1.71-EXP`) so both `Device Online` and `C3 Controller` Telegram cards show the actual WROOM connection as signal percent, RSSI, and SSID, for example `Wi-Fi: 92% (-54 dBm) NKAANNE_plus`.
2. The SSID comes from the active `WiFi.SSID()` connection and is HTML-escaped before Telegram rendering. The same network context is also shown in `Wi-Fi Restored` for a consistent diagnostic format.
3. This is a WROOM-only presentation change. UART frames, `/c3sts` scheduling and coalescing, C3 telemetry, C3 Deep Sleep, cloud forwarding, audio processing, and stored data are unchanged. C3 remains on build `185` and requires no upload.
4. Validation: `pio run -e esp32dev` -> SUCCESS, RAM `65,284 / 327,680` (`19.9%`), Flash `1,339,287 / 1,572,864` (`85.1%`), linked OTA-slot reserve `233,577` bytes, firmware `1,339,696` bytes, SHA-256 `4ADED17F5637FFE09CE5BD7E875A99D597526EAAC3309C370C7F703B70ED4DD5`. Manual WROOM upload and physical verification of both Telegram cards remain.

## Short Telegram C3 status command and clean-flash preparation - 2026-08-15

1. Added WROOM build `124` (`0.1.70-EXP`) as a small command-interface cleanup after the build `123` device log confirmed regular 30-second statistics and sequential C3 telemetry without the previous approximately 71-second Telegram stall.
2. Replaced the incoming read-only command `/c3_status` with the shorter `/c3sts`, including bot-suffix parsing and serial diagnostics. The old command is no longer accepted, so the interface has one unambiguous spelling.
3. No UART frame, C3 wake/control action, C3 firmware behavior, cloud payload, audio path, or stored-data format changed. C3 remains on build `185` and requires no upload.
4. A full WROOM flash erase is required before the manual USB upload of build `124`. This deliberately removes the old firmware, LittleFS local log, and all NVS state, including persisted Telegram `update_id`; it is a deployment operation and is not performed by the firmware itself.
5. Validation: `pio run -e esp32dev` -> SUCCESS, RAM `65,284 / 327,680` (`19.9%`), Flash `1,338,191 / 1,572,864` (`85.1%`), linked OTA-slot reserve `234,673` bytes, firmware `1,338,592` bytes, SHA-256 `84BB17D9435C955A87A295979FDE417454E806EA5AD76F96ACEA918B91109097`. Full WROOM erase, manual USB upload, and physical `/c3sts` validation remain.

## Telegram scheduling hardening after build 122 device log - 2026-08-15

1. Added WROOM build `123` (`0.1.69-EXP`) after combined serial/Telegram evidence proved that build `122` command authorization, freshness filtering, bot-suffix handling, NVS update tracking, and recovery worked, but consecutive synchronous Telegram messages could block the main loop for about 71 seconds. The affected startup showed UART RTT `68933 ms`, three duplicate `q=2` retries, and later transient Telegram/MQTT/UART recovery events.
2. Applied a 4-second TLS handshake, client, HTTP connect, and HTTP response limit to every Telegram Device Online, Wi-Fi Restored, C3 status, and `getUpdates` request. A slow Telegram path now fails boundedly instead of holding the main loop for tens of seconds.
3. Added a minimum 5-second gap after every successful Telegram send. The automatic C3 card can no longer start in the same loop immediately after Device Online, and elapsed-time checks use a fresh `millis()` value after any blocking network call.
4. Multiple fresh `/c3_status` updates received in one poll are consumed and persisted together but coalesced into one reply. The reply is queued for a later loop at least 5 seconds after `getUpdates`, retries no faster than every 30 seconds after failure, and expires after 120 seconds instead of remaining pending indefinitely.
5. Replay protection remains fail-closed: Telegram `update_id` is persisted before the reply is queued. Authorization, 60-second polling, freshness limits, WQTT, automatic Telegram status, Datacake, Sheets, audio, UART, C3 build `185`, Deep Sleep, INA3221, GPS, and charge behavior are otherwise unchanged. C3 requires no upload.
6. Validation: `pio run -e esp32dev` -> SUCCESS, RAM `65,284 / 327,680` (`19.9%`), Flash `1,338,207 / 1,572,864` (`85.1%`), linked OTA-slot reserve `234,657` bytes, firmware `1,338,608` bytes, SHA-256 `6C17BC47E4758B13F4FF07DED9DA9D849471E632A6D728C21C60CC36742791A5`. Manual WROOM upload and a clean startup/command/replay timing test remain.

## WROOM read-only Telegram `/c3_status` - 2026-08-15

1. Added WROOM build `122` (`0.1.68-EXP`) as the first Telegram command-input stage. The existing bot now checks for `/c3_status` once every 60 seconds and returns the same read-only `C3 Controller` card from WROOM's latest UART state and telemetry.
2. Only the configured `TELEGRAM_CHAT_ID` is authorized. Messages older than 120 seconds or more than 30 seconds in the future are ignored, and no chat identifier or command body is printed to the serial log.
3. Telegram `update_id` is persisted in the dedicated `tg_commands` NVS namespace. Already consumed updates are not processed again after a WROOM restart; if persistence is unavailable or fails, command polling disables itself instead of running without replay protection.
4. Initial synchronization requests only the last 10 Telegram updates. Polling uses non-long-polling `getUpdates`, a 4-second HTTP/handshake limit, and no new JSON/library dependency. A missing C3 telemetry snapshot returns `Waiting for C3` instead of fabricated zero measurements.
5. This stage is read-only: no UART command frame, queue, C3 wake, Wi-Fi/OTA change, Deep-Sleep change, or C3 firmware change was added. WQTT, automatic Telegram status, Device Online/Wi-Fi Restored, Datacake, Google Sheets, local logging, INA3221, GPS, and charge control remain unchanged. C3 stays on build `185` and requires no upload.
6. Pre-change backups: BSPRJ archive `BSPRJ_STAGE1_2026-08-15_04-51-31.tar` plus verified Git bundle, and compact INA3221-C3 archive `INA3221-C3_STAGE1_2026-08-15_04-57-02.tar` plus verified Git bundle. Both archive/bundle pairs have recorded SHA-256 hashes; `.pio` was excluded because it is reproducible and made the full C3 backup exceed the execution window.
7. Validation: `pio run -e esp32dev` -> SUCCESS, RAM `65,276 / 327,680` (`19.9%`), Flash `1,337,707 / 1,572,864` (`85.0%`), linked OTA-slot reserve `235,157` bytes, firmware `1,338,112` bytes, SHA-256 `9BEBF2C801263290B6C3B8FD21C66C1B7DC467F9E51BFAECE5829087398B7490`. Manual WROOM upload and physical `/c3_status` replay/authentication proof remain.

## WROOM Telegram C3 status card - 2026-08-15

1. Added WROOM build `121` (`0.1.67-EXP`) as the next read-only gateway step. After the normal `Device Online` alert and the first accepted C3 telemetry frame, the same Telegram bot sends one separate `C3 Controller` status card per WROOM boot.
2. The card shows UART state, C3 build, telemetry sequence/age, INA3221 health, Solar/Battery/Load voltage and current, approximate SOC, Charge output, and Classic/Smart Auto/legacy Manual mode. It does not poll Telegram, accept commands, or change C3 behavior, and therefore cannot wake or control C3.
3. Telegram failures retry no faster than the existing 30-second alert interval. Existing Device Online/Wi-Fi Restored alerts, WQTT telemetry, Datacake, Google Sheets, local logging, UART framing, C3 firmware, Deep Sleep, GPS, INA3221, and charge logic are unchanged. C3 stays on build `185` and requires no upload.
4. Corrected the reserved UART mode `2` display to `legacy_manual` in WQTT and `MANUAL` in the serial diagnostic instead of incorrectly presenting it as Classic.
5. Validation: `pio run -e esp32dev` -> SUCCESS, RAM `65,260 / 327,680` (`19.9%`), Flash `1,333,943 / 1,572,864` (`84.8%`), linked OTA-slot reserve `238,921` bytes, firmware `1,334,352` bytes, SHA-256 `AC9DD7895F9B6D9DAFAA8194930F753D9D5E5731DA48D91F17776A6B2463096F`. Manual WROOM upload and physical Telegram-card proof remain.
6. Physical validation: the user manually uploaded WROOM build `121`; Telegram showed the correct `0.1.67-EXP build 121` startup card and a complete `C3 Controller` card from the same bot. Serial evidence was `[TG] C3 POST -> 200` and `[TG] sent -> C3 Controller`. The rendered card showed Link `OK`, C3 build `185`, fresh telemetry `q=5` / age `19 s`, INA3221 `OK`, Solar `0.992 V / 0 mA`, Battery `12.248 V / 160 mA / 55%`, Load `7.144 V / 185 mA`, Charge `OFF`, and mode `Classic`. The read-only Telegram gateway gate passes.

## WROOM MQTT gateway for C3 telemetry - 2026-08-15

1. Added WROOM build `120` (`0.1.66-EXP`) as the first cloud-gateway step. Every newly accepted C3 UART snapshot is serialized into one compact retained JSON message and published through the existing WQTT connection at `bs/devices/<DEVICE_ID>/controller/c3/telemetry`.
2. The payload preserves UART session/sequence, INA status, Solar/Battery/Load voltage and signed current, approximate SOC, Charge state, and Classic/Smart Auto mode. The gateway publishes a `(session, sequence)` only once after success; a temporary MQTT failure is retried no faster than every 5 seconds.
3. C3 firmware, UART framing, INA3221, Deep Sleep, GPS, charge logic, existing WROOM sound MQTT topics, Datacake, Telegram, Google Sheets, and local logging are unchanged. C3 stays on device-confirmed build `185` and does not require another upload for this step.
4. Validation: `git diff --check` and `pio run -e esp32dev` -> SUCCESS, RAM `65,252 / 327,680` (`19.9%`), Flash `1,330,687 / 1,572,864` (`84.6%`), linked OTA-slot reserve `242,177` bytes, firmware `1,331,088` bytes, SHA-256 `1260A293E4BFE502D5B717382CAD53A9D36EE9CD2C195D3F14C403DD2B640090`. Manual WROOM upload and physical MQTT publish proof remain.
5. Physical validation: the user manually uploaded WROOM build `120`; its Telegram startup card confirmed `0.1.66-EXP build 120`. The serial monitor then showed accepted C3 build `185` telemetry and successful WQTT publications for increasing sequences `q=2` and `q=9`. Repeated UART `q=6` frames were classified as duplicates and re-ACKed. The C3-to-WROOM-to-WQTT gateway gate passes; no C3 reflash was required.

## C3 power telemetry physical validation - 2026-08-15

1. The user manually uploaded WROOM `0.1.65-EXP` build `119` and C3 `1.2.0-c3` build `185`; both Telegram startup cards confirmed the intended builds and normal startup.
2. WROOM physically accepted increasing real telemetry from C3, including `q=5` and later `q=11`, and transmitted ACK for each accepted frame. INA3221 stayed `OK`; representative values were Solar `992 mV / 0 mA`, Battery `12304 mV / 100..101 mA`, Load `7144 mV / 160 mA`, approximate SOC `60%`, Charge `OFF`, and mode `CLASSIC`.
3. The values were stable and internally plausible for the observed night/off-charge state. No persistent duplicate or UART-offline condition was reported. The nominal diagnostic `TEL -> ACK` acceptance gate passes; forced ACK-loss injection is intentionally deferred because retry/deduplication is already source- and build-validated and is not required before cloud-forwarding work.

## C3 power telemetry TEL/ACK transport - 2026-08-15

1. Added WROOM build `119` (`0.1.65-EXP`) strict parsing for version-1 C3 power telemetry: real Solar/Battery/Load millivolts and milliamps, approximate battery SOC, charge-output state, and Classic/Smart Auto mode.
2. Every C3 frame uses a random boot session plus a monotonically increasing sequence. WROOM sends `ACK <session> <sequence>`, re-acknowledges exact duplicates without storing them twice, rejects malformed/out-of-range frames, logs accepted measurements, and exposes the latest sequence/age in `[STAT]`.
3. Added C3 build `185`, which samples the existing INA3221 data approximately every 30 seconds while awake, keeps only one unacknowledged frame, retries it after a 2-second ACK timeout up to three times, and drops it safely before a later new sample. Existing PING/PONG, expected sleep, INA3221 decisions, GPS, charge, cloud, and Deep-Sleep logic remain unchanged.
4. Added `CONTROLLER_UART_PROTOCOL.md` as the canonical strict frame, unit, retry, deduplication, and acceptance contract. This stage is diagnostic only: WROOM does not yet forward C3 telemetry to MQTT, Telegram, or Google Sheets and does not execute C3 commands.
5. Validation: `git diff --check` and both builds passed. WROOM `pio run -e esp32dev` -> SUCCESS, RAM `65,228 / 327,680` (`19.9%`), Flash `1,328,947 / 1,572,864` (`84.5%`), linked OTA-slot reserve `243,917` bytes, firmware `1,329,344` bytes, SHA-256 `BE418D07567619E60E0F6562F62B5A62C5F2EBE7C5B8BDA07450CA868A848308`. C3 `pio run -e esp32c3_supermini_ota` -> SUCCESS, RAM `43,272 / 327,680` (`13.2%`), Flash `1,330,056 / 2,031,616` (`65.5%`), firmware `1,375,056` bytes, SHA-256 `9AA577CA327BD70F2E2D5D1589FEC0D465B80041ED72CA17A484B76E050DE5F5`. Upload and physical `TEL -> ACK` validation remain manual.

## Expected-sleep UART physical validation - 2026-08-15

1. The user manually uploaded WROOM `0.1.64-EXP` build `118` and C3 `1.2.0-c3` build `184`; both Telegram startup cards confirmed the intended firmware identities and normal startup.
2. The physical link received `[UART] SLEEP -> C3 build 184 for 600 s`, then every 30-second status line reported `uart=SLP/b184` with a consistent countdown from `580 s` to `9 s`; no false `UART OFFLINE` occurred during the planned sleep.
3. At the declared wake boundary WROOM reported `WAKE WAIT`, then automatically accepted C3 build `184` with `rtt=48 ms` and returned to `uart=OK/b184`. The complete `OK -> SLP -> WAIT -> OK` acceptance gate passed without restarting WROOM or touching the wiring.

## Expected C3 Deep-Sleep UART state - 2026-08-15

1. The user-confirmed build `117/183` test completed the planned lifecycle `uart=OK -> uart=OFF -> uart=OK`: C3 entered a requested 10-minute Deep Sleep and automatically restored the link after wake with `rtt=7002 ms`.
2. Added WROOM build `118` (`0.1.64-EXP`) support for strict `SLEEP <seconds> C3 <build>` frames. A valid frame changes the link to `SLP`, exposes the remote build and remaining sleep seconds in `[STAT]`, pauses PING traffic, and resumes wake probing at the declared time.
3. C3 build `184` announces and flushes the planned sleep frame only after the sleep path has passed its cancellation checks and immediately before entering Deep Sleep. INA3221, GPS, charge control, Wi-Fi, cloud delivery, and wake scheduling are unchanged.
4. Validation: `git diff --check` and both PlatformIO builds passed. WROOM `pio run -e esp32dev` -> SUCCESS, RAM `65,084 / 327,680` (`19.9%`), Flash `1,327,479 / 1,572,864` (`84.4%`), firmware `1,327,888` bytes, SHA-256 `1DCC9AF3AFC45ECBD70321DCA17211B173E10BB04E5FAB5E01882346559331C2`. C3 `pio run -e esp32c3_supermini_ota` -> SUCCESS, RAM `43,088 / 327,680` (`13.1%`), Flash `1,328,918 / 2,031,616` (`65.4%`), firmware `1,373,744` bytes, SHA-256 `2259495571F4413D371CAE55CD5D0BFC5A90E9A863E17805E4B770C579D45C32`. Both uploads and the physical `OK -> SLP -> OK` gate remain manual.

## WROOM build 117 manual upload checkpoint - 2026-08-15

1. The user manually uploaded WROOM firmware `0.1.63-EXP` build `117`; the Device Online screenshot confirms normal Wi-Fi, NTP, Telegram, and startup identity.
2. C3 remains on build `183` and does not require another upload for this WROOM-only miss-threshold change. The remaining gate is 2-3 minutes of WROOM Serial evidence with stable `uart=OK/b183` and no false three-timeout `OFFLINE`.

## Three-miss UART offline hardening - 2026-08-15

1. Added build `117` (`0.1.63-EXP`) to prevent one network-busy response delay from falsely declaring the C3 link offline.
2. WROOM now changes the UART state to `OFF` only after three consecutive `10 s` PONG timeouts. Any valid matching PONG immediately resets the miss counter and restores or preserves `OK`.
3. PING/PONG framing, GPIO16/17, `115200 8N1`, C3 build `183`, Deep-Sleep behavior, Wi-Fi, Telegram, MQTT, Google Sheets, sound sampling, and all other controller logic remain unchanged.
4. Validation: focused source contract and `git diff --check` pass; `pio run -e esp32dev` -> SUCCESS. RAM `65,068 / 327,680` (`19.9%`), Flash `1,326,923 / 1,572,864` (`84.4%`), firmware `1,327,328` bytes / SHA-256 `127FEA7F5EFC89CE0E829DA0D1668DD58B7809766CF84C612816966526C50538`. Upload and physical no-false-offline validation remain manual.

## Minimal UART physical PING/PONG validation - 2026-08-15

1. WROOM build `116` received a valid numbered PONG from C3 build `183`, proving the installed GPIO17-to-GPIO20 and GPIO21-to-GPIO16 bidirectional UART path at `115200 8N1`.
2. The first valid response during C3 network startup arrived after `13,104 ms`. The current `10 s` single-response threshold therefore produced one false `OFFLINE`; the link recovered automatically with an `870 ms` response and `[STAT] uart=OK/b183/870ms`.
3. Wiring, resistor selection, parsing, build identity, and automatic recovery pass the minimal-link gate. Offline detection still needs software hardening before Deep-Sleep behavior and the full telemetry/command protocol are accepted.
4. The WROOM core-dump partition warning is unrelated to UART: the custom partition table has no core-dump partition, and the controller continued normal startup.

## C3 build 183 manual upload checkpoint - 2026-08-15

1. The user manually uploaded C3 firmware `1.2.0-c3` build `183`; the Telegram Online screenshot confirms normal Wi-Fi startup, Charge OFF/GPIO3 LOW, and Sleep OFF.
2. Both ends of the minimal UART test are now running. The remaining acceptance gate is a WROOM Serial Monitor line showing a valid C3 build-183 PONG; readiness is unchanged until that frame is observed.

## WROOM build 116 manual upload checkpoint - 2026-08-15

1. The user manually uploaded WROOM firmware `0.1.62-EXP` build `116` and confirmed the normal Telegram `Device Online` message from `bs-esp32-01`.
2. This confirms the WROOM image starts and its existing Wi-Fi/Telegram path remains operational. C3 build `183` is not yet uploaded, so UART PING/PONG remains physically unvalidated and readiness is unchanged.

## Minimal C3-WROOM UART PING/PONG - 2026-08-15

1. Added build `116` (`0.1.62-EXP`) with a dedicated UART2 controller-link service on WROOM GPIO16/RX and GPIO17/TX at `115200 8N1`.
2. WROOM sends numbered `PING` frames, accepts only the matching strict `PONG <sequence> C3 <build>` response, and ignores unrelated or malformed input including ESP32-C3 UART0 boot text.
3. The existing 30-second Serial status line now exposes `uart=WAIT`, `uart=OFF`, or `uart=OK/b<build>/<rtt>ms`; state transitions are logged without adding cloud, display, or local-log traffic.
4. Wi-Fi, Telegram, MQTT, Google Sheets, I2S sampling, sound statistics, OLED behavior, and all existing GPIO assignments remain unchanged. C3 Deep Sleep is expected to appear offline until the responder wakes and answers a later PING.
5. Validation: `git diff --check` and `pio run -e esp32dev` -> SUCCESS; RAM `65,068 / 327,680` (`19.9%`), Flash `1,326,879 / 1,572,864` (`84.4%`), firmware `1,327,280` bytes / SHA-256 `72877DC1D548A010C05877EE5844B0228FE276974FDC97F01FFE5C275B0D5E51`. Upload and physical PING/PONG validation remain manual.

## Google Sheets layout-refresh and chart-category resilience - 2026-08-12

1. Removed chart rebuilding from `Refresh all table layout/order`, so this maintenance command now has one responsibility and cannot report a chart-data error after successfully applying table styles and row order.
2. Hardened the chart source builder to validate normalized `PART` values before indexing chart buckets; unsupported values are skipped with an execution-log warning instead of causing `Cannot read properties of undefined (reading 'push')`.
3. Added and passed a focused regression using an unsupported `DAWN` category, confirming valid `DAY`/`NGT` data still builds, invalid data does not affect chart coverage, and the layout command contains no chart rebuild call.
4. Existing `Rebuild charts only` and `Rebuild analytics` commands remain the explicit ways to refresh charts. Source values, Telegram, automation triggers, and firmware were not changed.
5. Firmware version `0.1.61-EXP` build `115` remains current. Live validation requires saving both `Code.gs` and `appsheet_charts.gs`; web-app redeployment and ESP32 restart are not required for this fix.

## Google Sheets raw-table header and scrolling refinement - 2026-08-12

1. Kept the alternating odd/even row shades in `log` and dated archives while preserving each column's semantic color family.
2. Kept row `1` frozen and visually distinct with the matching darker header colors and bold text, while removing the frozen first column so horizontal scrolling behaves normally.
3. Left all analytics-table styling, newest-first order, menu behavior, calculations, Telegram reports, and triggers unchanged.
4. Extended the raw-table regression to verify one frozen header row, zero frozen columns, alternating odd/even body shades, stable parity for partial row formatting, and distinct header/body palettes.
5. Firmware was not changed; version `0.1.61-EXP` build `115` remains current. The updated `Code.gs` still requires saving in Apps Script and one `Refresh all table layout/order` run for existing raw sheets.

## Google Sheets fast menu, unified log style, and newest-first tables - 2026-08-12

1. Made `onOpen()` build the stable `⚙️ BS` menu from lightweight stored state instead of scanning every sheet and technical column before `addToUi()`, and added a minimal fallback menu if state loading fails.
2. Added `Refresh BS menu/status`; it explicitly scans actual sheet/column visibility, refreshes the shared diagnostics-state cache, and rebuilds the menu while preserving every `●` state indicator.
3. Restyled raw `log` and dated archive sheets to match the accepted analytics-table language: bold dark-green headers, semantic pastel column groups, stronger group separators, fixed row sizing, and a frozen header/identity column.
4. Changed incoming `doPost()` rows to be inserted directly at row `2`, preserving unused row capacity, and hardened rollover/archive merging so raw tables remain newest-first without relying on the former last-row date assumption.
5. Changed every analytics table to display newest dates/windows first while preserving the internal oldest-first record sequence used for duplicate detection, gap calculation, coverage, and daily conclusions. Dashboard chart time axes remain chronological.
6. Extended the technical maintenance command as `Refresh all table layout/order`, allowing existing raw and analytics sheets to be normalized once after deployment.
7. Added and passed regressions for lightweight/fallback menu creation, cached versus explicit diagnostics refresh, raw-row prepending, newest-first table comparators, preserved internal chronology, daily-summary locking, and English-only Apps Script UI.
8. Firmware was not changed; version `0.1.61-EXP` build `115` remains current. Because `doPost()` changed, the bound Apps Script must be saved and the existing web-app deployment updated to a new version before live row-order validation.

## Google Sheets stable single-menu optimization - 2026-08-10

1. Replaced the changing top-level menu names `⚙️ BS · USER/TECH` with one stable `⚙️ BS` menu, preventing Google Sheets from retaining two differently named custom menus during repeated mode switches.
2. Moved the current mode into the first state row as `● Interface mode: USER/TECH` and kept one explicit inverse switch command below it.
3. Changed `Technical mode` to show analytics and all columns while keeping every dated archive sheet hidden; archives can still be shown manually from Diagnostics when explicitly needed.
4. Made repeated sheet/column visibility operations idempotent and moved the active view to a primary analytics sheet before hiding archives, reducing unnecessary UI work and visible tab churn.
5. Extended and passed the UI regression for a single stable menu name, repeated USER/TECH switching, archives hidden in both modes, technical analytics visibility, and the existing Diagnostics/Automation indicators. The automatic daily-summary regression remains passing.
6. Firmware was not changed; version `0.1.61-EXP` build `115` remains current. Live Apps Script save and repeated browser-switch validation remain required.

## Google Sheets diagnostics state indicators - 2026-08-10

1. Extended the `●` convention to every stateful Diagnostics group: technical columns, dated archive sheets, and analytics sheets now report their actual table state as `SHOWN`, `HIDDEN`, `MIXED`, or `NONE`.
2. Diagnostics offers only the opposite action for a uniform shown/hidden state and both actions for a mixed state; the `●` status row remains informational and has no side effects.
3. Added menu-specific archive/analytics visibility wrappers so manual actions refresh the menu immediately while the scheduled archive-hiding trigger remains independent of Spreadsheet UI access.
4. Extended and passed the UI regression for real sheet/column inspection, user-mode mixed analytics visibility, full technical visibility, mixed Diagnostics menus, no-op status rows, and immediate menu refresh calls.
5. Firmware was not changed; version `0.1.61-EXP` build `115` remains current. Live Apps Script save and visual Diagnostics validation remain required.

## Google Sheets visible mode and automation indicators - 2026-08-10

1. Changed the custom menu title to show the current per-user interface mode as `⚙️ BS · USER` or `⚙️ BS · TECH`.
2. Replaced ambiguous mode commands with a `● ...: ACTIVE` status row plus one explicit `Switch to ...` action.
3. Added `● ...: ON/OFF` status rows for automatic analytics refresh, archive hiding, and the daily Telegram summary; each status row is informational and the following command performs only the opposite state change.
4. Rebuilds the custom menu immediately after every mode or automation toggle, so the visible indicator does not require a sheet reload.
5. Extended and passed the UI regression for both menu titles, all three automation states, inverse toggle routing, no-op status rows, immediate menu refresh calls, and English-only Apps Script UI. The daily-summary regression remains passing.
6. Firmware was not changed; version `0.1.61-EXP` build `115` remains current. Live Apps Script save and visual menu validation remain required.

## Google Sheets user/technical interface modes - 2026-08-10

1. Added an English-only `User mode` that keeps `log`, `daily_verdict_table`, and `charts` visible while hiding dated archives, internal analytics sheets, and technical columns without deleting or rebuilding data.
2. Added an English-only `Technical mode` that restores all archive/analytics sheets and columns for maintenance and exported-log analysis.
3. Simplified the default `⚙️ BS` menu to the primary refresh, mode, report, and guarded reset actions; advanced commands now appear only in `Technical mode` under `Maintenance`, `Diagnostics`, and `Automation`.
4. Stored the selected menu mode in per-user properties, so the interface preference does not modify shared trigger settings or Telegram configuration.
5. Added a concise English section map to `Code.gs` without renaming or splitting the working Apps Script functions.
6. Added and passed a regression proving the intended sheet visibility, column-mode calls, English-only source UI, and absence of sheet deletion from either mode. The existing automatic daily-summary regression also remains passing.
7. Firmware was not changed; version `0.1.61-EXP` build `115` remains current. Live Apps Script save and Google Sheets UI validation remain required.

## Google Sheets daily-summary lock-contention fix - 2026-08-10

1. Confirmed from live Apps Script executions that `runAutomaticDailyTelegramSummary_` repeatedly started while `runAutomaticAnalyticsRefresh_` still held the shared script lock; the daily job waited about five seconds, returned without sending, and was still shown as successfully completed.
2. Increased the automatic daily-summary lock wait to five minutes and added an execution warning when the lock remains busy, so long analytics refreshes no longer cause silent hourly skips.
3. Removed the unconditional redundant analytics rebuild from the normal daily-summary path. The job now uses an already prepared summary and rebuilds analytics only as a fallback when a newer archived date exists but its summary is not ready.
4. Added Telegram Bot API JSON confirmation before advancing `BS_TELEGRAM_AUTO_DAILY_LAST_SENT_DATE`, preventing an unconfirmed delivery from being recorded as sent.
5. Added and passed a local regression covering the ready-summary path, fallback rebuild, busy lock, watermark update, and Telegram API confirmation.
6. Firmware was not changed; version `0.1.61-EXP` build `115` remains current. The updated `Code.gs` still requires saving in the bound Apps Script project and live automatic-report validation.

## Architecture and subsystem acceptance update - 2026-08-08

1. Recorded the completed full standalone test of the `ESP32-C3 SuperMini + INA3221` solar-charge and power-management controller and closed checklist items 51-52.
2. Recorded that the GPS module is complete and separately tested; connection and integration into the main BSPRJ controller remain open.
3. Fixed the controller architecture description: the BSPRJ ESP32 remains the primary noise, logging, and network controller, while the ESP32-C3 manages and monitors the battery/converter power path.
4. Made migration to an ESP32-S3 module conditional on measured RAM, Flash, OTA-slot, or runtime limits that remain after optimizing the current ESP32.
5. Updated the weighted readiness baseline to `48%` (`INA3221 and solar battery charging: 100%`; `GPS and location/time context: 65%`).
6. Firmware and Apps Script were not changed; version `0.1.61-EXP` build `115` remains current and no firmware build was required for this documentation-only update.

## 0.1.61-EXP+115 evidence-integrity hardening - 2026-08-06

1. Fixed local `BOOT`, `SCHEDULED_RESTART`, OTA, and SHT31 event rows so they contain all 35 CSV fields and no longer shift Wi-Fi/acoustic diagnostics left.
2. Changed the scheduled daily restart to wait for a completed 10-minute boundary and an empty Google Sheets upload queue, preventing the normal restart path from discarding the just-closed cloud window.
3. Extended Google Sheets health analysis with leading/trailing full-day gap accounting, signal-issue windows, environment failures, minimum heap, and problematic reset windows.
4. Changed clean-window validity to require both the minimum sample count and a healthy input-signal state, while preserving explicit quality flags for diagnostics.
5. Added the shared Apps Script lock to `doPost()` so incoming rows and date rollover cannot race automatic analytics or Telegram rebuilding.
6. Validation: Apps Script syntax check -> PASS; missing-midnight health regression -> PASS; `pio run -e esp32dev` and `pio run -e esp32dev_ota` -> SUCCESS (RAM 19.8%, Flash 84.3%). Firmware size: `1,325,471` bytes, leaving `247,393` bytes in the `1,572,864`-byte OTA slot.
7. Live Apps Script deployment, device CSV confirmation, and `144/144` field validation remain required before the related acceptance tasks are closed.

## Google Sheets analytics trigger serialization - 2026-08-05

1. Added the shared Apps Script lock to the automatic analytics refresh so it cannot rebuild analytics concurrently with the automatic Telegram daily summary.
2. A busy automatic execution now skips its current scheduled run and retries on its normal trigger schedule instead of writing the same analytics sheets concurrently.
3. Validation: Apps Script syntax check and lock-coverage source check -> PASS. Live trigger validation remains open until the updated script is saved in Google Apps Script and three consecutive dates each produce exactly one automatic report.
4. Firmware version/build were not changed because this step changes Google Sheets Apps Script only.

## Google Sheets daily summary deduplication - 2026-07-26

1. Changed automatic Telegram daily-summary date selection to use the newest archived date as a monotonic watermark, so an older date cannot replace the latest sent date and trigger hourly alternating reports.
2. Added a Google Apps Script lock around the automatic summary decision, analytics refresh, Telegram send, and last-sent property update to prevent concurrent trigger executions from sending the same date.
3. Replaced the stale project backlog with a 75-item progress-aware completion checklist that keeps the full sound path ahead of solar, controller-link, GPS, GSM, and final-integration work.
4. Validation: Apps Script syntax check -> OK; automatic date-selection regression test -> PASS. Real trigger validation remains open until three consecutive dates each produce exactly one automatic report.
5. Firmware version/build were not changed because this step changes Google Sheets Apps Script and project planning only.

## Google Sheets daily summary uptime - 2026-07-17

1. Updated Google Sheets Telegram `BS Noise Summary` text to show the latest real device `UPTIME` for the summary date directly under the date line.
2. The uptime is taken from the latest valid `clean_summary_10m` row for that date, with a fallback to the latest row for the date if no valid row exists.
3. Firmware version/build were not changed because this is a Google Sheets Apps Script message-format update only.

## Google Sheets auto-hide archive sheets - 2026-07-17

1. Added Google Sheets menu actions under `⚙️ BS -> Archive` to enable or disable automatic archive-sheet hiding.
2. Added a daily Apps Script trigger handler that runs the existing `Hide archive sheets` behavior automatically around `03:00`, hiding dated raw archive sheets while leaving the active `log` and analytics sheets untouched.
3. Kept data retention unchanged: archive sheets are only hidden, not moved, deleted, or copied to another spreadsheet.
4. Firmware version/build were not changed because this is a Google Sheets Apps Script workflow update only.

## 0.1.60-EXP+114 local links and raw level column - 2026-07-11

1. Added a `Local Log` link below `Online Statistics` in firmware Telegram online/restored messages, using the current device IP address.
2. Added a fixed `Local Log` link below `Online Statistics` in Google Sheets Apps Script Telegram latest/summary messages.
3. Changed the Google Sheets custom menu icon from `⚡` to `⚙️ BS` for better visibility.
4. Added `LEVEL` after `PART` in the raw Google Sheets `log` schema. New firmware payloads send the P2P-derived level, and Apps Script can derive/migrate the level for older raw sheets from `AVG P2P`.
5. Recorded the microphone wind filter change: the sponge is now replaced with foam from a professional microphone.
6. Validation: `Code.gs` syntax check -> OK; raw table color/header array lengths are all `36`; `pio run -e esp32dev` -> SUCCESS (RAM 19.8%, Flash 84.3%); `pio run -e esp32dev_ota` -> SUCCESS (RAM 19.8%, Flash 84.3%). OTA `firmware.bin` size: `1,325,648` bytes, leaving about `247 KB` in the `1,572,864` byte OTA slot.

## 0.1.59-EXP+113 log storage controls - 2026-07-10

1. Added a LittleFS storage summary to the local `BS Noise Log` page: used/total/free space, active log size, and archived-log count/total size.
2. Added per-archive file sizes beside each archived log download link.
3. Added a separate `Clear ALL logs` danger flow with confirmation; it deletes the active log, compact archives, legacy archives, and `sound_log_legacy.csv`, then creates a fresh active log header.
4. Validation: `pio run -e esp32dev` -> SUCCESS (RAM 19.8%, Flash 84.2%); `pio run -e esp32dev_ota` -> SUCCESS (RAM 19.8%, Flash 84.2%). OTA `firmware.bin` size: `1,325,056` bytes, leaving about `248 KB` in the `1,572,864` byte OTA slot.

## 0.1.58-EXP+112 OLED power profile visibility - 2026-07-10

1. Added `PROJECT_POWER_PROFILE` as the firmware-visible active energy-saving profile marker; the current fixed profile is `ECO`.
2. Show the active profile on OLED boot, the main status page, and the debug page title as `DEBUG ECO`.
3. Kept MQTT/Datacake profile publishing out of the current payload and recorded it as a future ДВЗ task if remote dashboards need it later.
4. Validation: `pio run -e esp32dev` -> SUCCESS (RAM 19.8%, Flash 83.9%); `pio run -e esp32dev_ota` -> SUCCESS (RAM 19.8%, Flash 83.9%). OTA `firmware.bin` size: `1,320,352` bytes, leaving about `252 KB` in the `1,572,864` byte OTA slot.

## 0.1.57-EXP+111 soft ECO power profile - 2026-07-10

1. Added the first safe energy-saving firmware layer for the upcoming unattended battery/solar run without changing the continuous audio sampling or 10-minute Google Sheets/log windows.
2. Enabled ESP32 Wi-Fi modem sleep and reduced non-critical update frequency: Wi-Fi RSSI cache refresh is now every `120 s`, WQTT live publishes every `60 s`, WQTT status every `120 s`, WQTT day-part metrics every `300 s`, and Serial `[STAT]` output every `30 s`.
3. Reduced display power draw: OLED auto-off is now `15 s`, normal refresh is `2 s`, debug refresh is `1 s`, and disabling the display now sends `SSD1306_DISPLAYOFF` instead of only drawing a blank screen.
4. Reduced environment sensor activity by reading `SHT31` every `60 s` instead of every `15 s`; audio, local log, Google Sheets, OTA, Telegram online alerts, and restart diagnostics remain active.
5. Validation: `pio run -e esp32dev` -> SUCCESS (RAM 19.8%, Flash 83.9%); `pio run -e esp32dev_ota` -> SUCCESS (RAM 19.8%, Flash 83.9%). `firmware.bin` size: `1,320,240` bytes, leaving about `252 KB` in the `1,572,864` byte OTA slot.

## 0.1.56-EXP+110 analytics alignment - 2026-07-09

1. Updated Google Sheets Telegram latest/summary text to show `AVG P2P` beside the `SILENT / NORMAL / LOUD / PEAK` label, so user-facing reports no longer pair a P2P-derived level with an old `NOW %` average.
2. Changed `summary_conclusions`, `daily_verdict`, and dashboard chart daypart readings to use `AVG P2P` as the numeric basis next to the P2P-derived level labels.
3. Added a guarded Google Sheets menu command `Reset for clean run` that clears the active `log`, deletes dated archive sheets, and resets analytics sheets after a `YES / NO` confirmation.
4. Added `Hide technical columns` and `Show all columns` menu actions so the working Sheets view can stay readable while diagnostic columns remain available for final evidence.
5. Reworked the Google Sheets custom menu into a compact `⚡` menu with grouped `Data`, `Diagnostics`, `Archive`, `Reports`, and `Danger zone` sections so it stays visible and easier to scan in the compressed Sheets toolbar.
6. Updated Google Sheets setup notes, data dictionaries, project progress, and continuation memory to document the aligned P2P analytics layer and clean-run reset flow.
7. Validation: Apps Script syntax check only; firmware was not changed and `pio run` was not required for this analytics/docs step.

## 0.1.56-EXP+110 - 2026-07-06

1. Changed live `SILENT / NORMAL / LOUD / PEAK` classification from old `NOW %` buckets to the accepted protected-microphone `P2P` thresholds: `SILENT <=350`, `NORMAL <=650`, `LOUD <=850`, `PEAK >850`.
2. Changed firmware `quiet_count` to count `SILENT` samples and `loud_count` to count `LOUD` plus `PEAK` samples while keeping the existing log schema.
3. Updated Google Sheets summary classification to derive `LEVEL` from `AVG P2P` instead of `NOW %`.
4. Updated English and Russian data dictionaries so `LEVEL` documents the build `110` relative `P2P` rule and does not imply real `dB` calibration.
5. Validation: `pio run` -> SUCCESS for `esp32dev` and `esp32dev_ota` (RAM 19.8%, Flash 83.9%).

## 0.1.55-EXP+109 - 2026-05-30

1. Retuned the relative `INMP441` percent scale for the protected external-microphone construction after the clean field run showed useful `P2P` separation but compressed `NOW/H` percentages.
2. Added `PROJECT_ACOUSTIC_REV=2` to mark the protected microphone geometry in local CSV and Google Sheets rows so incompatible physical revisions are not mixed during final analysis.
3. Started a fresh persistent `M` baseline in a new NVS namespace for acoustic revision `2`, preserving the old stored baseline without reusing it.
4. Expanded Google Sheets raw-log telemetry with `P2P P95`, P2P ranges, session ranges, SHT31 counters, heap values, boot/reset context, and acoustic revision for the final microphone-validation run.
5. Validation: `pio run -e esp32dev` -> SUCCESS (RAM 19.8%, Flash 83.9%); `pio run -e esp32dev_ota` -> SUCCESS (RAM 19.8%, Flash 83.9%); real device OTA upload -> SUCCESS; active device `/log.csv` header confirmed with `acoustic_rev`; Google Apps Script syntax and 35-column formatting arrays checked locally.

## 0.1.54-EXP+108 - 2026-05-24

1. Changed the ESP32 partition table from a single factory app slot to OTA-capable `otadata`, `ota_0`, and `ota_1` slots.
2. Reduced the local LittleFS area to keep two firmware slots available; this build must be flashed once over USB before OTA uploads can work.
3. Validation: `pio run -e esp32dev` -> SUCCESS; `pio run -e esp32dev_ota` -> SUCCESS; real device OTA upload confirmed after one USB flash installed the OTA-capable partition layout.

## 0.1.53-EXP+107 - 2026-05-24

1. Changed the archived log list to display compact filenames as readable date/time labels such as `24.05.2026 16:42`, while keeping downloaded CSV filenames short and sortable.
2. Marked old non-dated archive names as legacy in the web UI instead of pretending they have a known date/time.
3. Validation: `pio run -e esp32dev` -> SUCCESS; `pio run -e esp32dev_ota` -> SUCCESS.

## 0.1.52-EXP+106 - 2026-05-24

1. Added explicit CSV download filenames through `Content-Disposition`, so active and archived log downloads save as date/time names instead of browser-generated names like `download-archive.csv`.
2. Made archive filenames unique when multiple archives are created in the same minute by appending suffixes such as `_2`.
3. Validation: `pio run -e esp32dev` -> SUCCESS; `pio run -e esp32dev_ota` -> SUCCESS.

## 0.1.51-EXP+105 - 2026-05-24

1. Shortened archived log filenames to date/time format such as `24052026_1435.csv` when wall-clock time is synced, with an uptime-based fallback before sync.
2. Changed the local log web UI to a dark theme for easier viewing.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.50-EXP+104 - 2026-05-24

1. Added archive download support to the local web log page so preserved `/sound_log_archive_*.csv` and `/sound_log_legacy.csv` files can be downloaded after archiving.
2. Added a direct `Download archived log` link on the archive confirmation result page.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.49-EXP+103 - 2026-05-23

1. Added minimal ArduinoOTA support with local hostname/password configuration from `include/secrets.h`.
2. Added OTA lifecycle diagnostics to Serial and local `/log.csv` events: `OTA_START`, `OTA_END`, and `OTA_ERROR`.
3. Added a web log archive flow: `/archive-log` asks for confirmation and `/archive-log-confirm` renames the current log to an archive file before creating a fresh active log.
4. Kept the Telegram supergroup `chat_id` fix in local secrets for controller-side `Device Online` alerts.
5. Added PlatformIO OTA env `esp32dev_ota` and `scripts/ota_upload.ps1`, defaulting to fixed OTA IP `192.168.11.124` and reading the OTA password from ignored `include/secrets.h`.
6. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.48-EXP+102 - 2026-05-22

1. Added `p2p_p95` to local `/log.csv` as a stable percentile-based sound indicator for multi-day balcony analysis.
2. Fixed runtime event rows so `BOOT`, `SCHEDULED_RESTART`, `SHT31_LOST`, `SHT31_REINIT`, and `SHT31_RECOVER` stay aligned with the CSV header.
3. Changed power-session uptime tracking to use RTC no-init memory so soft restarts should preserve `uptime_min` and increment `boot_seq`, while physical power-on starts a fresh session.
4. Added SHT31 health handling: long missing environment reads are logged, the I2C bus and SHT31 are periodically reinitialized, and recovery is logged when valid readings return.
5. Added `free_heap` and `min_free_heap` to the local log for two-day memory stability checks.
6. Validation: `pio run -e esp32dev` -> SUCCESS (RAM 18.3%, Flash 29.8%).

## 0.1.47-EXP+101 - 2026-05-21

1. Added diagnostic local `/log.csv` columns for `event`, `boot_seq`, `reset_reason`, continuous power-session `uptime_min`/`uptime_text`, stable P2P maximum, and SHT31 ok/fail sample counts.
2. Added `BOOT` and `SCHEDULED_RESTART` log events so controller restarts are visible in the same CSV timeline as measurement windows.
3. Added a daily scheduled soft restart while preserving power-session uptime across soft resets; physical power-on starts a new session.
4. Added a stable session P2P maximum based on the smoothed live level and changed OLED `RANGE` to show `MIN`, `STB`, and technical `RAW MAX`.
5. Updated the English and Russian data dictionaries for the new diagnostic local-log fields.
6. Validation: `pio run -e esp32dev` -> SUCCESS (RAM 17.9%, Flash 29.8%).

## 0.1.46-EXP+100 - 2026-05-20

1. Slimmed the compact local `/log.csv` schema by removing `ver`, `power_target`, and `uptime_min`.
2. Kept only `build` as the firmware marker in local CSV rows, while leaving richer version/uptime payloads available in Google Sheets and Telegram.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.45-EXP+99 - 2026-05-20

1. Added a lightweight web clear flow for the current compact log: `/clear-log` asks for confirmation and `/clear-log-confirm` recreates `/sound_log.csv` with only the active header.
2. Kept `/sound_log_legacy.csv` untouched during clear operations so old-format backup data is not deleted accidentally.
3. Reduced SHT31 reads from every `5 sec` to every `15 sec`, which is enough for balcony temperature/humidity while saving I2C work.
4. Split OLED refresh timing by page: `DEBUG` refreshes quickly at `250 ms`, while the calmer pages refresh at `1000 ms`.
5. Kept Serial `[STAT]` at `5 sec`; verbose ON/OFF remains a later step, not part of this change.
6. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.44-EXP+98 - 2026-05-20

1. Removed the duplicate Wi-Fi line from the OLED `ENV` page so that page stays focused on temperature and humidity only.
2. Made the root log page at `http://<device-ip>/` a tiny HTML page with a direct clickable `Download log.csv` link to `/log.csv`.
3. Added `session_p2p_min` and `session_p2p_max` to the compact local CSV so each file carries the overall boot-session `RANGE` context.
4. Cached Wi-Fi RSSI/percentage and refresh it every 30 seconds instead of reading RSSI from every display/MQTT/log call.
5. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.43-EXP+97 - 2026-05-20

1. Reworked local `/log.csv` into a compact 10-minute analysis log instead of a minute-by-minute raw stream, with window fields for `P2P avg/min/max`, raw range, signal state, environment averages, samples, quiet/loud counts, Wi-Fi RSSI, battery target, and uptime minutes.
2. Added automatic legacy handling for older local CSV files: an existing old-format `/sound_log.csv` is moved to `/sound_log_legacy.csv` before the new compact header is created.
3. Added a fourth OLED page, `ENV`, for temperature and humidity, plus Wi-Fi percentage at the bottom.
4. Added a small `PIN` marker on non-main OLED pages when long-press pinned display mode is active.
5. Changed the second long press while pinned so it returns the display to normal auto-off timing instead of immediately blanking the OLED.
6. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.42-EXP+96 - 2026-05-20

1. Added a third OLED page, `RANGE`, that shows the minimum and maximum `P2P` seen since boot so quiet baseline and loud reference can be measured directly on the device.
2. Added the same session `P2P` range to Serial Monitor as `range=min/max`, next to the current `p2p` value.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## Data dictionary - 2026-05-20

1. Added `DATA_DICTIONARY.md` as a practical reference for Google Sheets, Telegram, AppSheet, log, and analytics terms.
2. Documented what each important name means, why it exists, what the user should understand from its values, and which technical columns may become secondary later.
3. Added `DATA_DICTIONARY_RU.md` as the Russian version of the same practical reference.
4. Linked the dictionaries from `AGENTS.md` and `memory.md` so future chats know where to look when terminology questions come up.

## Project memory context - 2026-05-20

1. Added `memory.md` as a concise continuation context for new chats, covering the active `INMP441` hardware state, battery-first operating assumption, recent balcony-log findings, and next practical steps.
2. Updated `AGENTS.md` so future work starts by reading `memory.md` together with the normal project rules.
3. Added `Продолжаем проект` as the short context-restore phrase for new chats and clarified that meaningful handoff context should be kept current in `memory.md`.

## 0.1.41-EXP+95 - 2026-05-20

1. Retuned the live `INMP441` percent scale from the balcony `log.xlsx` run so `P2P` windows around `1200 / 1800 / 2400` now map near the useful `SILENT / NORMAL / LOUD / PEAK` boundaries instead of compressing the whole day into `1..9%`.
2. Made `CLIP` detection resistant to single raw sample extremes by requiring a meaningful clipped-sample share inside the current `I2S` read window.
3. Lowered the technical `LOW` threshold so ordinary quiet balcony ambience is not treated as a persistent input failure.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.40-EXP+94 - 2026-05-19

1. Reworked the display button logic for microphone observation sessions: long press now enables a pinned-on display mode that disables idle blanking, and another long press turns the display back off.
2. Kept short press behavior lightweight: it still switches pages while the display is on, and wakes the display in normal auto-off mode when it is off.
3. Recorded the new project assumption that battery power is the real target operating mode, while USB power is only a secondary debug path.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.39-EXP+93 - 2026-05-19

1. Removed the remaining current-stage `MAX9814` wording from the active project docs and rules so the repo now describes the hardware focus directly as `INMP441` on `I2S`.
2. Clarified the live microphone wiring target in `AGENTS.md` and updated the signal-quality wording so `CLIP` now describes `INMP441` digital saturation instead of the old ADC-specific interpretation.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.38-EXP+92 - 2026-05-19

1. Replaced the temporary `MAX9814` analog microphone path with `INMP441` on `I2S`, keeping the existing `Now / H / M` analytics flow intact while changing the runtime audio source to digital sampling.
2. Updated the firmware boot/runtime diagnostics and debug views so microphone wiring now reports `BCLK / WS / DATA`, and raw debug values reflect signed `I2S` sample windows instead of ADC-only ranges.
3. Synced the project docs and rules to the new active hardware stage: `ESP32 + INMP441`.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## AppSheet current-screen refinement guide - 2026-05-18

1. Expanded `APPSHEET_SETUP.md` with a practical refinement section for the current live `AppSheet` structure, based on the existing `Overview / Dayparts / Levels / Health / Noise` screens.
2. Fixed the recommended first-pass cleanup path: simplify `Overview`, trim visible columns in `Dayparts / Levels / Health`, hide technical detail views, and keep `Noise` only if it improves understanding.

## AppSheet screen roles - 2026-05-18

1. Expanded `APPSHEET_SETUP.md` with fixed responsibilities for `Overview`, `Dayparts`, `Levels`, `Health`, and `Noise` so teammates can build different layouts without losing the same product meaning.
2. Kept the `AppSheet` direction centered on human-readable interpretation: conclusion first, comparison second, trust/coverage separately, and decorative charts only when they add understanding.

## AppSheet shared UX direction - 2026-05-18

1. Expanded `APPSHEET_SETUP.md` with a shared team-facing `AppSheet` instruction so different teammates can build their own screens without drifting away from one common user goal.
2. Fixed the product meaning for the mobile layer: conclusions first, supporting numbers second, and technical diagnostics third.
3. Kept the focus explicitly non-engineering for the first reading experience, so the app should behave like a short daily noise report rather than a raw analytics console.

## Apps Script auto analytics refresh - 2026-05-17

1. Added a separate automatic analytics refresh path in `google_sheets/Code.gs` so `clean_summary_10m`, `summary_*`, and `charts` can update on a background timer without depending on manual `Rebuild analytics`.
2. Kept the live write path safe: `doPost(...)` still only writes to `log`, while the new installable trigger runs the heavier summary rebuild every 10 minutes.
3. Kept the spreadsheet layout clean by refreshing only the fixed analytics tabs instead of creating extra helper sheets during automatic runs.

## AppSheet v1 setup doc - 2026-05-16

1. Added `APPSHEET_SETUP.md` with a concrete `v1` plan for a read-only AppSheet layer on top of `summary_conclusions`, `summary_daypart`, `summary_levels`, and `summary_health`.
2. Kept the plan intentionally lightweight: no writes back into `log`, no archive-sheet dependency, and no change to the existing Google Sheets live write contract.

## Docs goal extension - 2026-05-16

1. Expanded the documented project goal in `README_RU.md`, `README.md`, and `AGENTS.md` so the current day-part noise analytics path is now explicitly tied to a longer-term direction toward scalable noise monitoring, anomaly analysis, and future mapping.
2. Kept the wording careful: the project still prioritizes a trustworthy single-device analytical core before moving into geo, multi-point, or city-scale layers.

## Apps Script header layout polish - 2026-05-15

1. Added adaptive header sizing in `google_sheets/Code.gs` so analytics sheets now widen long header columns automatically and use a taller header row when multi-word titles need cleaner wrapping.
2. This keeps labels like `MAIN LEVEL`, `VALID WINDOWS`, `EXPECTED WINDOWS`, and `CONFIDENCE` readable after each rebuild without manual column tweaking.

## Naming clarity note - 2026-05-15

1. Renamed the user-facing signal-quality header from `SIG` to `SIG IN` in the Google Sheets layer so it reads more clearly as an input-signal diagnostic rather than a noise-level label.
2. Kept the change strictly at the presentation/documentation layer without reshaping the internal firmware field naming.

## 0.1.37-EXP+91 - 2026-05-15

1. Added `sanity v1` hold counters for the microphone input so brief `LOW` / `CLIP` events no longer look the same as sustained signal problems.
2. Introduced `LOW_HOLD` and `CLIP_HOLD` as persistent signal-quality warnings in the local log, serial diagnostics, and Google Sheets `SIG` field while keeping `SILENT / NORMAL / LOUD / PEAK` separate as noise-level labels.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## Docs terminology note - 2026-05-15

1. Added a short permanent glossary to the project docs so `CLIP / LOW / OK` remain clearly separated from `SILENT / NORMAL / LOUD / PEAK`.
2. This keeps the distinction visible between signal-quality diagnostics and user-facing noise-level labels.
3. Extended the glossary and `SIG` explanation to include persistent warning states `LOW_HOLD` and `CLIP_HOLD`.

## 0.1.36-EXP+90 - 2026-05-15

1. Added lightweight `M` persistence through ESP32 `Preferences/NVS` by saving and restoring the long-term mean accumulators (`sum + count`) instead of only the derived percentage.
2. The firmware now reloads the long-term mean after reboot and refreshes the stored state on a slow interval, so `M` can survive restarts without writing to flash too aggressively.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.35-EXP+89 - 2026-05-15

1. Hardened the controller-side `Wi-Fi Restored` Telegram path so it no longer depends on a single send attempt at the exact reconnect moment.
2. The restored alert now waits for a short stable post-reconnect warmup and keeps retrying on the regular Telegram retry interval until it succeeds or the outage is deemed too short to report.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.34-EXP+88 - 2026-05-15

1. Extended the lightweight controller-side Telegram alert path with a `Wi-Fi Restored` notification that fires only after a real outage longer than a short threshold, so brief reconnect noise does not spam chat.
2. Included downtime, IP, Wi-Fi quality, time-sync state, uptime, and the `Online Statistics` link in the restored message while keeping the implementation on direct Telegram Bot API calls.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.33-EXP+87 - 2026-05-15

1. Added a minimal controller-side Telegram `Device Online` alert path that sends one boot-time notification directly through the Telegram Bot API after Wi-Fi has stayed up through a short warmup period.
2. Kept the implementation lightweight by reusing direct HTTPS POSTs instead of pulling in a heavier Telegram bot framework, while still including IP, Wi-Fi, time-sync state, uptime, and the `Online Statistics` link in the alert.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.32-EXP+86 - 2026-05-15

1. Added a clear `TIME WAIT` state to the main OLED page before NTP sync is ready, so users can see that day-part statistics are not yet running on valid wall-clock time.
2. Added matching serial visibility for the unsynced state to make startup and reconnect diagnostics easier during runtime checks.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.31-EXP+85 - 2026-05-15

1. Replaced the single pending Google Sheets upload slot with a small firmware-side queue of completed 10-minute windows, so temporary Wi-Fi or delivery failures no longer drop finished windows immediately.
2. Added queue-aware serial diagnostics for queued and delivered Google Sheets windows, making upload backlog behavior easier to see during recovery testing.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## Apps Script polish - 2026-05-15

1. Polished `google_sheets/Code.gs` by simplifying analytics-sheet checks, extracting repeated Telegram no-data and daypart-summary builders, and centralizing the coverage-quality label helper.
2. Kept the current `log`, analytics, and Telegram behavior unchanged while making the script easier to read and safer to maintain.

## Apps Script cleanup - 2026-05-15

1. Removed the unfinished `online restored` notification path from `google_sheets/Code.gs`, including its extra Script Properties and `doPost(...)` hook, so the Apps Script Telegram layer stays clean and focused on the working manual status/summary flow.
2. Cleaned the setup guide to match the new contract and avoid keeping dead Telegram recovery settings around.

## Apps Script Telegram link - 2026-05-15

1. Added a shared `Online Statistics` link to the bottom of Telegram notifications in `google_sheets/Code.gs`, so each message can open the working Google Sheets dashboard directly without searching for the spreadsheet URL again.
2. Applied the link to the latest status, daily summary, and online-restored notification paths, including the no-data fallback messages.

## Apps Script online restore fix - 2026-05-15

1. Tightened the `online restored` contract in `google_sheets/Code.gs` so Telegram now notifies only after a real communication gap between successful device posts, not after ordinary controller reboots by themselves.
2. Removed the temporary reboot/uptime-based recovery trigger and kept the alert strictly gap-based, which better matches the goal of tracking lost and restored device connectivity.

## Apps Script conclusions - 2026-05-15

1. Added a new `summary_conclusions` analytics sheet in `google_sheets/Code.gs` so each `DAY / EVE / NGT` block now has one quick human-readable line with its average relative level, dominant `SILENT / NORMAL / LOUD / PEAK` class, and a coverage-based confidence label.
2. Kept the existing `log`, archive-day contract, `summary_*` base tables, and Telegram menu flow unchanged, so the new layer stays additive and safe for the current working setup.
3. Updated `GOOGLE_SHEETS_SETUP.md` so the new summary layer is documented as part of the intended analytics reading flow.

## 0.1.30-EXP+84 - 2026-05-15

1. Added compact `UPTIME` telemetry to each Google Sheets 10-minute window as a single human-readable value like `0 d, 3 h, 14 m`, so log rows show how long the controller lived before each upload without cluttering the table with separate day/hour/minute columns.
2. Hardened Telegram by adding emoji-friendly status formatting, reboot-aware `online restored` detection based on uptime reset plus gap fallback, and safe non-blocking delivery from `Apps Script`.
3. Added `Enable auto daily summary` / `Disable auto daily summary` so Google Apps Script can run an hourly background check and send the completed-day summary once per archived day.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## Apps Script analytics - 2026-05-14

1. Expanded the Google Sheets source-of-truth script so the same `Код.gs` can now rebuild `clean_summary_10m`, `summary_daypart`, `summary_levels`, `summary_health`, and a starter `charts` sheet on top of the fixed `log` plus daily-archive contract.
2. Added local ignore rules for `backup/` and exported `test/*.xlsx` analysis files so temporary backup and spreadsheet artifacts do not pollute routine Git status or publish steps.
3. Refined the analytics sheet styling standard so `log` stays untouched while `clean_*`, `summary_*`, and `charts` get clearer visual roles, calmer palettes, and a less overwhelming default view.
4. Split the Apps Script into a dedicated `google_sheets/Code.gs` file and turned `GOOGLE_SHEETS_SETUP.md` into a readable deployment and naming guide, so future updates no longer require hunting for the start and end of a giant embedded code block.
5. Hardened the Apps Script sheet-formatting path so analytics rebuild first expands new sheets to the required width before showing or hiding columns, fixing the `columns are out of bounds` failure on freshly created summary tabs.
6. Removed the merged analytics title row from the Apps Script formatting path so frozen columns no longer collide with partially merged cells during `BS Noise` rebuilds.
7. Simplified the analytics sheet look by dropping the awkward top title band, switching `clean_*` and `summary_*` to a `log`-style full-column color scheme with lighter data cells, and tightening embedded chart generation so Sheets treats the first row as chart headers explicitly.
8. Added `Hide analytics sheets` and `Show analytics sheets` to the `BS Noise` menu, aligned the analytics tables to one shared `log`-style visual standard with per-category column coloring plus lighter alternating data rows, and rebuilt the chart helper blocks into simpler vertical label-value ranges so Google Sheets has a cleaner source for rendering charts.
9. Reworked the `charts` sheet into a tighter dashboard layout with hidden helper ranges, KPI strip, and simpler two-column sources for visual blocks so the page wastes less space and is easier to scan.
10. Replaced the fragile floating Google chart objects in `charts` with a compact cell-based dashboard using KPI rows and inline mini-diagrams, so the overview remains readable even when embedded chart rendering is unreliable.
11. Added the first manual Telegram layer in `Apps Script`: `Send latest Telegram status` and `Send daily Telegram summary` now send text reports from `clean_summary_10m` and `summary_*`, while secrets stay out of the code via `Script Properties`.
12. Added an optional `online restored` Telegram notice in `doPost(...)` that sends a short recovery message after a configurable pause between successful posts, without blocking normal log writes if Telegram delivery fails.
13. Added `Show Telegram chat debug` to the `BS Noise` menu so the bot can display the last chats returned by `getUpdates`, making `chat not found` troubleshooting much easier for private chats and groups.
14. Removed the temporary `Show Telegram chat debug` helper after group delivery was confirmed, keeping the `BS Noise` menu focused on the permanent Telegram actions.

## 0.1.29-EXP+83 - 2026-05-13

1. Added averaged `SHT31` temperature and humidity to each 10-minute Google Sheets window instead of raw high-frequency environment spam.
2. Updated the ready-to-paste Apps Script so the `log` sheet stores `TEMP C` and `HUM %` columns and keeps the daily sheet rotation behavior.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.28-EXP+82 - 2026-05-13

1. Republished `status/online=true` during the regular WQTT status cycle so the retained online flag recovers cleanly after brief MQTT reconnects.
2. Simplified the main OLED warmup label from `HW` to `H` and kept the `M` row unchanged.
3. Disabled the full startup I2C bus scan by default so boot feels less stalled before Wi-Fi and MQTT settle, while keeping the scan helper available for targeted diagnostics.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.27-EXP+81 - 2026-05-13

1. Removed the MQTT JSON snapshot topics (`status/json`, `sound/json`, `environment/json`, `period/json`) to keep the live broker surface focused on the topics actually used by `MqttDesk`.
2. Kept the regular MQTT topics unchanged, including `period/current_pct`, so the desktop dashboard does not lose any working widgets.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.26-EXP+80 - 2026-05-12

1. Started Wi-Fi earlier during boot so the connection attempt can run in parallel with the remaining hardware and service initialization.
2. Reduced the blocking startup delays for Serial and the OLED boot screen to make the pre-Wi-Fi phase feel lighter.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.25-EXP+79 - 2026-05-12

1. Switched Datacake fast, slow, and text telemetry groups from multiple single-field HTTP posts to grouped batch posts.
2. Kept the MQTT/WQTT topic structure and live desktop flow unchanged while reducing Datacake request count.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.24-EXP+78 - 2026-05-12

1. Removed `CURRENT_PERIOD_PCT` from the active Datacake set so the cloud dashboard focuses on `DAY_PCT`, `EVENING_PCT`, and `NIGHT_PCT`.
2. Kept `period/current_pct` in MQTT for desktop clients and future experiments without forcing it into the main Datacake dashboard.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.23-EXP+77 - 2026-05-12

1. Removed the redundant Datacake uptime/update fields: `LAST_UPDATE_TS`, `UPTIME_DATE`, `UPTIME_MIN`, and `UPTIME_HOURS`.
2. Kept the active telemetry focused on sound, period, status, and environment data without changing the main MQTT live flow.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.22-EXP+76 - 2026-05-12

1. Unified `SIGNAL_STATE` across Datacake and MQTT so both now use the same human-readable levels: `SILENT`, `NORMAL`, `LOUD`, and `PEAK`.
2. Switched the Google Sheets window aggregate signal label to the same level vocabulary so cloud and desktop telemetry are easier to compare.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.21-EXP+75 - 2026-05-12

1. Switched Datacake into a more quota-safe mode by slowing the regular fast metrics from every 15 minutes to every 60 minutes.
2. Slowed the Datacake slow metrics from every 30 minutes to every 6 hours and the text metrics from every 5 minutes to every 60 minutes.
3. Kept the main MQTT/WQTT live feed unchanged so desktop clients stay responsive while Datacake becomes a lighter cloud dashboard.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.20-EXP+74 - 2026-05-12

1. Enlarged the main OLED `H / M` and `T / H` rows using a bigger GFX font instead of the tiny default text, while keeping both rows on the main screen.
2. Kept the top `Now + bar + WiFi` layout intact and only reworked the lower readability of the main page.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.19-EXP+73 - 2026-05-12

1. Aligned the main OLED page to the requested compact layout by keeping `H / M` centered and placing `T / H` together on one centered line below it.
2. Added `SHT31` temperature and humidity as first-class telemetry in both MQTT and Datacake.
3. Documented the new environment entities for desktop MQTT clients and Datacake field setup.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.18-EXP+72 - 2026-05-12

1. Restored a larger main OLED look by returning `H / M` to the bigger display style instead of the temporary compact line.
2. Reworked the environment readout under the main stats into separate centered `T` and `H` lines for clearer reading on the 128x64 screen.
3. Enlarged the `DEBUG` page title and shifted the large raw-value lines slightly lower for cleaner spacing.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.17-EXP+71 - 2026-05-12

1. Enlarged the practical readability of the main OLED layout by aligning the bottom `T / H` row to the same text scale as the `H / M` row instead of leaving it as a tiny footer.
2. Reworked the debug page toward large raw values by centering `raw min-max` and `P2P` in bigger text on their own lines.
3. Started Wi-Fi earlier in boot and shortened blocking startup delays so the controller no longer spends as much visible time looking frozen before the network comes up.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.16-EXP+70 - 2026-05-12

1. Added automatic OLED idle blanking after 60 seconds of no button activity so the display can rest without requiring a manual long press every time.
2. Changed the short-press behavior while the screen is off: the first tap now wakes the display, and only later taps continue normal page switching.
3. Kept the long press as an explicit display power toggle on top of the new idle-off behavior.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.15-EXP+69 - 2026-05-12

1. Restored the default OLED page to the main sound layout with `Now + bar + WiFi`, `H / M`, and a bottom `T / H` environment line instead of the temporary dedicated `ENV` page.
2. Reduced the page flow back to two screens only: the main everyday sound page and a separate debug page for raw microphone diagnostics.
3. Kept the single-button behavior unchanged: short press switches pages, long press toggles the display off and back on.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.14-EXP+68 - 2026-05-11

1. Split the OLED into three button-driven pages: a clean environment page with centered `T/H`, a sound page for `Now / H / M`, and a separate debug page for the raw microphone diagnostics.
2. Moved the raw bottom-line data off the main sound screen and placed it on its own page, keeping the display clearer for everyday viewing.
3. Wired the single button behavior so a short press cycles pages and a long press toggles the display fully off or back on.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.13-EXP+67 - 2026-05-11

1. Corrected `SHT31` address handling so the service now tries both common I2C addresses, `0x44` and `0x45`, instead of pretending the sensor is always on `0x44`.
2. Aligned the startup diagnostic with the real detected sensor address, making the `I2C` scan and the `SHT31` ready log consistent for this mixed breakout stage.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.12-EXP+66 - 2026-05-11

1. Added a minimal `button_service` on `GPIO27` using `INPUT_PULLUP`, debounced short press, and long press events so future display switching and menu behavior can grow from one safe control pin.
2. Added a modular `sht31_service` on the existing I2C bus at `0x44`, with periodic temperature/humidity reads and readable Serial diagnostics for the first environment-aware stage.
3. Integrated both services into the ESP32 main loop without changing the current OLED contract or pretending the button/menu logic is already finished.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.11-EXP+65 - 2026-05-11

1. Kept Datacake and internal diagnostics on the existing `LOW / OK / CLIP` signal-state logic, but changed the MQTT `sound/signal` topic to publish user-facing noise levels: `SILENT`, `NORMAL`, `LOUD`, and `PEAK`.
2. Documented the new MQTT-only sound labels and their `0..100` percent ranges in the PC topics cheat sheet so desktop dashboards can use one consistent 4-step vocabulary.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.10-EXP+64 - 2026-05-11

1. Reformatted `UPTIME_DATE` for the Datacake panel into a clearer one-line style like `0d, 3h, 42m` so battery/runtime checks read naturally at a glance.
2. Kept the uptime telemetry meaning unchanged while aligning the display format with the intended single-line panel widget.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.9-EXP+63 - 2026-05-11

1. Decoupled the new Datacake text telemetry (`SIGNAL_STATE`, `LAST_UPDATE_TS`, `UPTIME_DATE`) from the 30-minute slow cycle so those fields appear shortly after boot and Wi-Fi recovery.
2. Kept the day-part aggregate cadence unchanged while moving text-field refreshes to their own lightweight 5-minute cadence for faster panel visibility without flooding the free plan.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.8-EXP+62 - 2026-05-11

1. Added the agreed Datacake telemetry fields for stable runtime visibility: `SIGNAL_STATE`, `LAST_UPDATE_TS`, `UPTIME_MIN`, `UPTIME_HOURS`, and `UPTIME_DATE`.
2. Kept the new uptime reporting truthful for this temporary project by sending a human-readable uptime string until wall-clock time is synced, then switching `LAST_UPDATE_TS` to the real NTP timestamp.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.7-EXP+61 - 2026-05-10

1. Corrected the Datacake HTTP target from the device serial-like identifier to the actual device-id taken from the Datacake device URL, fixing the `404 No Device matches the given query` response.
2. Kept the WQTT path unchanged and preserved the new Datacake HTTP diagnostics so field writes can be verified directly from Serial after the ID fix.
3. Validation: pending.

## 0.1.6-EXP+60 - 2026-05-10

1. Replaced the failing Datacake MQTT ingestion path with direct Datacake HTTP field writes while keeping WQTT publishing untouched for existing client apps.
2. Added explicit Datacake HTTP result logging per field and guarded the HTTP branch from repeatedly resetting its own publish schedule after Wi-Fi comes up.
3. Validation: pending.

## 0.1.5-EXP+59 - 2026-05-10

1. Added explicit Datacake publish diagnostics in Serial so each field write now reports `OK/FAIL` and the exact field identifier being attempted.
2. Kept the dual-broker runtime intact while making Datacake ingestion issues easier to isolate without guessing from the cloud UI alone.
3. Validation: pending.

## 0.1.4-EXP+58 - 2026-05-10

1. Restored the original WQTT topic publishing for existing MQTT apps while keeping the new Datacake MQTT path active in parallel for the hosted dashboard.
2. Split the MQTT runtime into dual broker clients so WQTT keeps the faster live feed and Datacake stays on a slower free-plan-safe cadence.
3. Validation: pending.

## 0.1.3-EXP+57 - 2026-05-10

1. Switched the MQTT service from the temporary WQTT topic tree to direct Datacake field publishing using the product slug and device UUID of the new hosted dashboard target.
2. Reduced the publish cadence for the Datacake free plan so `NOW/HOUR/MEAN/current-period` update on a lighter schedule and day-part plus Wi-Fi fields publish even more conservatively.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.2-EXP+56 - 2026-05-10

1. Added a separate `mqtt_service` for ESP32 so the project can publish live sound percentages, retained status, and three day-part aggregates (`day`, `evening`, `night`) without mixing MQTT logic into `main.cpp`.
2. Kept Google Sheets as the original developer channel and introduced MQTT as a second independent channel with `Last Will`, retained online state, and ready-to-watch topics for generic MQTT apps.
3. Validation: pending.

## 0.1.1-EXP+55 - 2026-05-10

1. Refined the OLED top layout again: added one more pixel of separation between the Wi-Fi percent and the bar, and moved the `M` block closer to `H` using pixel positioning instead of coarse text spacing.
2. Validation: pending.

## 0.1.1-EXP+54 - 2026-05-09

1. Shortened the Google Sheets header labels for easier scanning and added explicit descriptions for what each reported value means.
2. Reduced the OLED top bar by one more pixel and tightened the `H/M` row spacing for a cleaner layout.
3. Validation: pending.

## 0.1.1-EXP+53 - 2026-05-09

1. Reduced the OLED top bar by one more pixel for a slightly cleaner gap near the Wi-Fi percent during extended testing.
2. Validation: pending.

## 0.1.1-EXP+52 - 2026-05-09

1. Adjusted the OLED Wi-Fi percent placement one pixel closer to the bar and added a safer left shift for `100%` so the text does not collide with the next row.
2. Validation: pending.

## 0.1.1-EXP+51 - 2026-05-09

1. Backed off the forced Google redirect-following path and kept explicit redirect acceptance so Google Sheets uploads avoid the recent `400 Bad Request` failure mode while still preventing duplicate window resends.
2. Shortened the OLED top bar by one more pixel and moved the Wi-Fi percent farther right for clearer separation from the bar.
3. Validation: pending.

## 0.1.1-EXP+50 - 2026-05-09

1. Tightened Google Sheets delivery handling so redirect-style responses from Google can be treated as successful delivery instead of causing the same 10-minute window to be uploaded repeatedly.
2. Moved the OLED live bar closer to the left percentage and enlarged the Wi-Fi percentage display, removing the `W` prefix for cleaner reading.
3. Validation: pending.

## 0.1.1-EXP+49 - 2026-05-09

1. Fixed Google Sheets upload handling to follow the web-app redirect chain correctly, so one 10-minute window is not re-sent over and over after a `302`.
2. Kept the aggregated upload format and Wi-Fi diagnostics from the previous build, but tightened delivery handling for cleaner sheet data.
3. Validation: pending.

## 0.1.1-EXP+48 - 2026-05-09

1. Shortened the OLED live bar and added a Wi-Fi signal percent indicator beside it for quick connectivity checks.
2. Added clearer Google Sheets queue/upload diagnostics in Serial so it is visible when a 10-minute aggregate is waiting and when it was actually sent.
3. Validation: pending.

## 0.1.1-EXP+47 - 2026-05-09

1. Renamed the device identity to `bs-esp32-01` and switched the temporary firmware line from `0.1.32-test` to `0.1.1-EXP`.
2. Reworked Google Sheets uploads from test-style frequent points into 10-minute aggregate windows with averages, raw min/max, counters, sample count, and worst-signal summary.
3. Expanded the Google Sheets setup script so it can create stable headers and apply basic readability formatting to the `log` sheet automatically.
4. Validation: pending.

## 0.1.32-test+45 - 2026-05-09

1. Added an optional Google Sheets upload module that can send one JSON row per minute for shared team review across different parts of the city.
2. Added local config placeholders for `DEVICE_ID` and `GOOGLE_SHEETS_SCRIPT_URL` in `secrets.h`.
3. Added a ready-to-paste Apps Script setup guide for the shared spreadsheet workflow.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.32-test+44 - 2026-05-09

1. Fixed the custom partition table so the filesystem partition matches the ESP32 LittleFS expectations on this toolchain.
2. Kept the larger factory-app layout and offline log storage plan, but corrected the data partition subtype/name for successful filesystem mounting.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.32-test+43 - 2026-05-09

1. Added explicit Wi-Fi reconnect attempts for long unattended runs when the ESP32 drops off the network.
2. Made the log web service announce the full `http://<ip>/log.csv` URL and re-arm itself cleanly after reconnects or IP changes.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.32-test+42 - 2026-05-09

1. Added a custom ESP32 partition table for this project instead of relying on a generic default layout.
2. Allocated a larger single factory app partition and kept a substantial `LittleFS` area for long offline logs, while intentionally dropping OTA slots for more firmware headroom.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.32-test+41 - 2026-05-09

1. Added autonomous minute-by-minute logging to `LittleFS` with date, time, day part, percentages, raw range, and counters for overnight battery tests without Serial Monitor.
2. Added a minimal Wi-Fi web endpoint for log download at `/log.csv`, so the stored file can be opened from a browser while the device is online.
3. Removed the stale startup message about inactive time/Wi-Fi and stopped auto-centering the top percentage and `H/M` row so the display no longer jumps as values change.
4. Slowed the adaptive percent floor/reference logic to make `Now/H/M` behave more steadily.
5. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.32-test+40 - 2026-05-09

1. Started using real NTP time in accumulation logic by tracking stats separately for actual day parts: night, day, and evening.
2. Added per-day-part average plus simple quiet/loud counters to the Serial diagnostics, so the project can begin answering "when was it quiet or noisy" with real time context.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.32-test+39 - 2026-05-09

1. Re-enabled minimal ESP32 Wi-Fi STA connectivity in `wifi_service` so the project can reach internet time without changing the tuned OLED screen.
2. Added a separate `time_service` module that requests NTP time and reports when valid local time has been synced.
3. Updated Serial stats to include a real `HH:MM:SS` timestamp once NTP is available, giving the project a truthful base for "when was it quiet/noisy" analysis.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.32-test+38 - 2026-05-09

1. Moved percent calculation into `audio_sampler` so `Now`, `H`, and `M` use one adaptive signal scale instead of display-side level guessing.
2. Added a slow noise-floor tracker plus a decaying reference ceiling so the percentages behave more steadily across silence, speech, and louder bursts.
3. Extended Serial stats with `current/hour/total` percentages for easier live tuning.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.32-test+37 - 2026-05-09

1. Removed the `OK / LOW / CLIP` status from the OLED because it overloaded the screen visually.
2. Restored the lower raw min-max numbers to a larger centered line on the display while keeping signal status in Serial logs.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.32-test+36 - 2026-05-09

1. Added a simple live signal-status classification: `OK`, `LOW`, or `CLIP` based on raw ADC range and peak-to-peak activity.
2. Put the signal status into the bottom OLED diagnostic line and the Serial stats log so the MAX9814 input condition is visible during tuning.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.32-test+35 - 2026-05-09

1. Centered the top live percentage automatically inside the left area before the bar, so the OLED header aligns more evenly as values change.
2. Kept the firmware version unchanged at `0.1.32-test` and advanced only `PROJECT_BUILD` for this new flashed step.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.32-test+34 - 2026-05-09

1. Centered the `H/M` row automatically across the OLED width and added single-space separation between the letters and numbers.
2. Kept the firmware version at `0.1.32-test` and advanced only `PROJECT_BUILD` for this new flashed step.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.32-test+33 - 2026-05-09

1. Shifted the top live bar a couple of pixels closer to the main percentage block.
2. Centered the bottom raw min-max numbers on the OLED for a cleaner final alignment.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.31-test+32 - 2026-05-09

1. Expanded the top live bar again to use more of the available width next to the main percentage.
2. Removed the `RAW` label and promoted the raw min-max values to a larger line by themselves.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.30-test+31 - 2026-05-09

1. Simplified the OLED toward a near-final layout: top live percentage with bar, one shared large `H/M` row, and one small diagnostic `RAW` line at the bottom.
2. Restored `M` to the same larger visual weight as `H` by shortening the row format instead of shrinking the `M` value.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.29-test+30 - 2026-05-09

1. Changed the main live reading from a raw relative number to a clearer percentage display and aligned the top bar to the same percentage scale.
2. Shortened the `H` and `M` row by showing them as percentages too, while making `M` smaller so the two metrics do not collide on one line.
3. Removed `P2P` from the main screen as a duplicate-style diagnostic and kept `RAW min-max` as the remaining low-level debug readout.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.28-test+29 - 2026-05-09

1. Widened the top live bar again and aligned it higher so it sits level with the large current number.
2. Promoted `RAW min-max` to a larger line and reduced `P2P` to a smaller helper line so the lower diagnostics are easier to read.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.27-test+28 - 2026-05-09

1. Moved the top live bar onto the same visual height as the large current number, widened it, and placed it closer to the number block.
2. Combined `H` and `M` into one larger shared row and promoted `P2P` to a larger line below it.
3. Kept `RAW min-max` on one line when it fits, using the remaining bottom row for compact diagnostics.
4. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.26-test+27 - 2026-05-08

1. Removed the bottom bar from the OLED screen and moved the live level bar next to the main current-value number on the top line.
2. Removed the `NOW` label, kept only the large current number, and stacked `H` and `M` as larger separate rows for clearer reading.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.25-test+26 - 2026-05-08

1. Made the OLED bottom level bar thinner so it supports the layout instead of dominating it.
2. Increased the size of the core values beyond `NOW`, packed the rows closer together, and added `|` separators so the main readings read as one clearer panel.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.24-test+25 - 2026-05-08

1. Removed the version/build label from the main OLED screen and left firmware version information only on the startup screen.
2. Increased the visual weight of the live `NOW` value to a moderate larger size while keeping the secondary stats readable on the lower blue zone.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.23-test+24 - 2026-05-08

1. Reworked the OLED layout to fit the physical two-color panel more intentionally: the yellow top band now carries a compact `NOW` header, and the blue zone holds the secondary stats.
2. Reduced visual clutter by spacing rows more cleanly and moving the version/build label away from the center text block.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.22-test+23 - 2026-05-08

1. Removed the redundant second `Wire.begin(...)` call from the OLED init path because ESP32 I2C was already started in `main.cpp`.
2. Kept the startup I2C scan so display wiring and bus detection can still be judged separately from the render path.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.21-test+22 - 2026-05-08

1. Added an explicit OLED startup diagnostic screen so a successful SSD1306 init is visible immediately before the normal stats view starts.
2. Added an I2C bus scan and pin report in `Serial` to separate display wiring/address problems from display-rendering logic.
3. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.20-test+21 - 2026-05-08

1. Restarted the firmware from a clean ESP32 base while preserving the core OLED sound-stat display idea: `Now`, `H`, `M`, and honest hour warmup state.
2. Split the runtime into small modules for audio sampling and display rendering instead of carrying forward the ESP8266-specific mixed logic.
3. Removed active Wi-Fi behavior from the runtime and left `wifi_service` as a dormant placeholder for a later, separate ESP32 network step.
4. Updated project rules and docs to match the new ESP32-first baseline.
5. Validation: `pio run -e esp32dev` -> SUCCESS.

## 0.1.19-test+20 - 2026-05-08

1. Re-enabled Wi-Fi only as a minimal STA connection test with `WiFi.mode(WIFI_STA)` and one `WiFi.begin(...)` call.
2. Removed retry, timeout, and reconnect behavior from the temporary Wi-Fi diagnostic path so this step isolates the base ESP8266 connection attempt.
3. Kept only lightweight status-change logging and one IP announcement on success.
4. Validation: `pio run` -> `SUCCESS`.

## 0.1.18-test+19 - 2026-05-08

1. Added a temporary `WIFI_TEST_ENABLED` switch in `main.cpp` and turned it off for a clean stability check without Wi-Fi activity.
2. Kept OLED and microphone diagnostics active so LED blinking and short freezes can be tested separately from the network stack.
3. Validation: `pio run` -> `SUCCESS`.

## 0.1.17-test+18 - 2026-05-08

1. Added a clearer microphone reaction diagnostic view with current level `L`, peak hold `P`, raw span `S`, and simple `LOW/MID/HIGH` reaction bands.
2. Reworked the OLED middle rows for calibration-style checking: live level, peak hold, span, rolling averages, and raw min/max range.
3. Expanded Serial Monitor diagnostics with separate `[STAT]` and `[RAW]` lines so microphone response can be judged more confidently during silence, speech, and sharp peaks.
4. Validation: `pio run` -> `SUCCESS`.

## 0.1.16-test+17 - 2026-05-07

1. Reduced runtime load by slowing OLED refresh and slowing periodic statistics logging in Serial Monitor.
2. Added an explicit `delay(0)` after OLED buffer upload and a short loop delay so ESP8266 can service Wi-Fi and watchdog more reliably.
3. Kept the Wi-Fi status diagnostics while making the main loop less aggressive under disconnected-network conditions.
4. Validation: `pio run` -> `SUCCESS`.

## 0.1.15-test+16 - 2026-05-07

1. Removed the Wi-Fi startup scan because `scanNetworks()` itself proved unstable on this ESP8266 during live testing.
2. Reduced the Wi-Fi module back to a simpler STA connect flow: `mode -> begin -> status -> timeout`.
3. Kept readable Wi-Fi status logging while dropping the unstable scan-based diagnostic branch.
4. Validation: `pio run` -> `SUCCESS`.

## 0.1.14-test+15 - 2026-05-07

1. Added one-time Wi-Fi scanning at startup so the device logs nearby access points before attempting to connect.
2. Added explicit target visibility reporting for the configured SSID and basic encryption labels for found networks.
3. Kept the simpler Wi-Fi module and readable logs while shifting the next diagnostic step from guessing to real scan evidence.
4. Validation: `pio run` -> `SUCCESS`.

## 0.1.13-test+14 - 2026-05-07

1. Replaced the crashing `Serial.printf(...)` statistics line with a safer `snprintf(...)` buffer plus `Serial.println(...)`.
2. Shortened the runtime stats line so Serial Monitor stays readable and avoids unstable long print chains.
3. Validation: `pio run` -> `SUCCESS`.

## 0.1.12-test+13 - 2026-05-07

1. Replaced the many-step `[STAT]` serial printing chain with a single compact `Serial.printf(...)` line.
2. Added plain C-string helpers for Wi-Fi, microphone, and day-part labels so runtime logging no longer depends on many `Print::print(...)` calls in a row.
3. Kept the readable Wi-Fi diagnostics while reducing the chance of serial-print crashes during active runtime logging.
4. Validation: `pio run` -> `SUCCESS`.

## 0.1.11-test+12 - 2026-05-07

1. Reworked Serial Monitor output into readable `[WF]` and `[STAT]` lines instead of unlabeled mixed-value logs.
2. Added Wi-Fi status name decoding such as `DISC`, `NOAP`, `BADPWD`, `OK`, and short human-readable hints.
3. Updated the OLED `WF:` label to show the decoded Wi-Fi state instead of generic `WAIT/FAIL`.
4. Validation: `pio run` -> `SUCCESS`.

## 0.1.10-test+11 - 2026-05-07

1. Reduced the microphone sampling window and added `delay(0)` inside the sampling loop so ESP8266 can service Wi-Fi and the watchdog while audio is being read.
2. Kept the current Wi-Fi and OLED structure, focusing this step only on runtime stability during active Wi-Fi attempts.
3. Validation: `pio run` -> `SUCCESS`.

## 0.1.9-test+10 - 2026-05-07

1. Simplified Wi-Fi reconnect behavior to avoid aggressive disconnect/restart cycles inside the ESP8266 Wi-Fi stack.
2. Removed the previous no-sleep Wi-Fi tweak that could destabilize the driver during repeated connect attempts.
3. Reshaped the OLED to the requested line-based layout with a separate full-width bottom bar.
4. Kept the stronger live-level reaction so the bar and live value respond more clearly to sound.
5. Validation: `pio run` -> `SUCCESS`.

## 0.1.8-test+9 - 2026-05-07

1. Reworked the OLED layout toward the requested compact format: top status line, one stats line, one day-part line, and a separate bottom bar.
2. Removed the large `Now` label and placed the live value directly in the top status row.
3. Increased relative-level sensitivity and reduced smoothing so the live number and bar react more clearly to sound.
4. Improved Wi-Fi diagnostics with status codes, timeout detection, and automatic retry attempts.
5. Validation: `pio run` -> `SUCCESS`.

## 0.1.7-test+8 - 2026-05-07

1. Removed the `Now:` label from the main OLED number and made the current value larger.
2. Moved the main value closer to the top status line so `W:WAIT` and the live level read as one compact status area.
3. Shrunk and moved the bottom level bar to keep more space for the larger main number.
4. Validation: `pio run` -> `SUCCESS`.

## 0.1.6-test+7 - 2026-05-07

1. Reworked the OLED layout to make the screen cleaner and easier to read on `128x64`.
2. Moved the current level into the main visual focus and grouped secondary statistics below it.
3. Simplified the bottom level bar so it supports the screen instead of competing with the text.
4. Validation: `pio run` -> `SUCCESS`.

## 0.1.5-test+6 - 2026-05-07

1. Removed `include/secrets.example.h` because this temporary local-only project does not need a publish-safe template.
2. Simplified the project rules and README files to use only local `include/secrets.h`.
3. Validation: `pio run` -> `SUCCESS`.

## 0.1.4-test+5 - 2026-05-07

1. Added a separate `wifi_service` module for ESP8266 Wi-Fi handling.
2. Connected Wi-Fi setup to `include/secrets.h` without hardcoding credentials in `main.cpp`.
3. Added Wi-Fi status output to `Serial` and OLED: `OFF`, `WAIT`, `OK`, or `FAIL`.
4. Kept day-part timing on the existing virtual clock; NTP is still a separate next step.
5. Validation: `pio run` -> `SUCCESS`.

## 0.1.3-test+4 - 2026-05-07

1. Added modular secrets scaffolding with `include/secrets.example.h` and local `include/secrets.h`.
2. Added Git ignore rule for local secrets so Wi-Fi passwords, tokens, and chat IDs stay outside tracked files.
3. Documented the secrets workflow in project rules and README files.
4. Validation: `pio run` -> `SUCCESS`.

## 0.1.2-test+3 - 2026-05-07

1. Added three daily sound-stat buckets for `07:00-18:00`, `18:00-00:00`, and `00:00-07:00`.
2. Added per-bucket `avg`, `max`, and `samples` tracking for relative sound levels.
3. Added a virtual boot-based clock so day-part logic can be tested honestly before RTC, NTP, MQTT, or Telegram are introduced.
4. Updated OLED and `Serial` output to show current time slot and bucket statistics.
5. Validation: `pio run` -> `SUCCESS`.

## 0.1.1-test+2 - 2026-05-06

1. Added microphone signal sanity checks with explicit status classification: `OK`, `FLAT`, `BIAS`, and `CLIP`.
2. Added consecutive-warning filtering so the status changes only after repeated suspicious readings instead of one noisy spike.
3. Added microphone status output to both OLED and `Serial`.
4. Validation: `pio run` -> `SUCCESS`.

## 0.1.0-test+1 - 2026-05-06

1. Added project-standard files: `AGENTS.md`, `AGENTS.local.md`, `README.md`, `README_RU.md`, `PROJECT_TASKS.md`, and `CHANGELOG.md`.
2. Added OLED sound-statistics screen with `Now`, rolling last-hour average `H`, and all-time average `M` using relative microphone levels.
3. Kept the microphone values explicitly marked as relative levels instead of calibrated `dB`.
4. Added a dedicated project version source in `include/project_version.h` and aligned the project docs to a local non-GitHub workflow.
5. Validation: `pio run` -> `SUCCESS`.
