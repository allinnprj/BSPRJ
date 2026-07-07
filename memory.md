# Project Memory

This file is the quick context bridge for a new chat. When the user writes `Продолжаем проект`, read this file together with `STANDARD.md`, `AGENTS.md`, and `AGENTS.local.md`, then continue without asking for a fresh `СОС`.

## Current Snapshot

- Project: `BSPRJ`, the main ESP32 noise-monitoring firmware project.
- Repository: `https://github.com/allinnprj/BSPRJ`.
- Branch model: `main` is release/stable, `devlop` is test/development.
- Main goal: understand when balcony/noise levels are quiet, normal, loud, or peak across `DAY / EVE / NGT`.
- Active hardware: `ESP32 DevKit`, `INMP441` microphone on `I2S`, `SSD1306 128x64` OLED, `SHT31` environment sensor.
- Active microphone wiring: `BCLK=GPIO26`, `WS=GPIO25`, `DATA=GPIO32`, `L/R=GND`.
- Real operating mode: battery power is the primary target; USB power is only a debug/service mode.
- Current firmware marker: `0.1.56-EXP` build `110`.

## Important Decisions

- `MAX9814` is finished and must not be brought back into the active path.
- Do not present readings as real `dB`; all sound values are relative until a real calibration step exists.
- Overall readiness percentage now refers to the complete target system, including dB calibration, solar-controller communication, shared-power integration, GPS, GSM, permanent hardware integration, and end-to-end field validation. Do not use microphone-only maturity as the whole-project percentage.
- Progress reporting must be subsystem-based. Keep flexible named percentages in `progress.md`, show the subsystem(s) affected by each completed task plus the weighted overall percentage, and use a full table for major milestones or explicit progress reviews. Percentages change only with validated progress; the overall value is weighted, not a simple average.
- Battery-powered balcony behavior is the reference scenario for tuning.
- Keep changes incremental: one behavior or one hardware check per step.
- `BSPRJ` is the active project name; all new work should happen in `D:\DEV\BSPRJ`.
- `zaexp` was an old isolated microphone workability test and is no longer part of the active project model. Do not bring it into `BSPRJ` unless the user explicitly reopens that test context.
- Use `devlop` for active testing/development and `main` only for release-ready states.
- `CHANGELOG.md` is history; this `memory.md` is the continuation context for new chats.
- `DATA_DICTIONARY.md` and `DATA_DICTIONARY_RU.md` are the practical references for table, Telegram, AppSheet, log, and analytics terms.
- `progress.md` defines the readiness percentage method; current whole-project baseline is `38%` after the build `109` field-run analysis broadened the estimate to the complete target system.
- Memory/Flash planning is now an explicit project constraint. Current BSPRJ ESP32 DevKit build `110` evidence: static RAM is about `19.8%`, Flash is about `83.9%`, `firmware.bin` is about `1,319,824` bytes, OTA app slot is `0x180000` / `1,572,864` bytes, leaving roughly `253 KB` inside one OTA slot. RAM is acceptable for the next steps, but Flash must be watched after every added subsystem.
- Do not treat ESP-NOW as the main memory risk. A compact inter-controller ESP-NOW packet between the BSPRJ noise controller and the solar-charge controller should be feasible. The larger memory risks are duplicated HTTPS/TLS/cloud paths, heavy GSM libraries, large String/JSON buffers, retained diagnostics, and unnecessary web/UI payloads.
- For future additions, record the build-size baseline after each module: RAM percent, Flash percent, `firmware.bin` size, and remaining bytes in the OTA slot. If the app approaches the OTA slot limit, first remove/trim obsolete diagnostics and cloud/web payloads; later consider resizing partitions by reducing LittleFS and increasing both OTA app slots.
- Project organization can evolve to one repository/project containing two firmware targets/controllers if that becomes cleaner: the main BSPRJ noise-monitoring ESP32 and the ESP32-C3 Super Mini solar-charge controller. Keep runtime responsibilities separate even if both controllers eventually live in one PlatformIO project.

## Hardware Notes

- The user added power smoothing for the battery setup:
  - `3300 uF` on the controller input.
  - `470 uF` for the display/environment branch.
  - Local capacitor at the `INMP441` `3.3V` input.
- The microphone has a sponge/wind filter for balcony use.
- The current assembly is still on breadboards inside a metal enclosure.
- The `INMP441` is now outside the enclosure on a separate cable, close to the outer end of a short plastic support tube. A thin sponge layer and enlarged outer opening provide wind/rain protection without the earlier narrow acoustic restriction.
- A second controller for solar-charge management is an intentional required part of the target system. It shares the battery supply with the noise-monitoring ESP32 and exists to keep solar charging, discharging, and power monitoring work off the main controller. Final field validation must run with both controllers powered together. Its own connectivity/reboot issues must still be analyzed separately unless the noise-monitoring ESP32 shows matching failures.
- The solar-charge controller is developed in a separate project/branch with its own runtime contract. Its normal design may include frequent `Light Sleep` and `Deep Sleep` periods. Do not treat its expected sleep-related connectivity gaps as evidence of a noise-monitoring ESP32 failure or shared-power instability unless the noise controller shows matching local-log gaps, reset events, or other correlated anomalies.
- The shared-power solar controller is specifically an `ESP32-S3 + INA3221` system. It currently sends frequent reboot/online Telegram notifications, possibly due to its own contact issues or unfinished test-stage behavior. Analyze it as a separate layer. Only treat it as relevant to `bs-esp32-01` accuracy when its events correlate with the noise controller's own `BOOT`, `reset_reason`, uptime reset, local CSV gap, SHT31 issue, or `Device Online` evidence.

## Recent Findings

- The first `INMP441` logs proved the microphone was alive: raw values and `P2P` reacted to sound.
- USB and battery power produced noticeably different readings. Battery behavior is considered the real target.
- The balcony `log.xlsx` run from `2026-05-20` covered about `00:00` to `18:19`, with `110` ten-minute windows.
- Old `NOW %` was too compressed: almost the whole day stayed around `1..9%`.
- Old `CLIP` was too sensitive because single raw extremes near `-32768 / 32767` made many windows look clipped.
- Useful observed `AVG P2P` anchors from the balcony run:
  - very quiet low end: around `220..800`
  - median area: around `1700`
  - strong windows: around `2300+`
  - observed maximum: around `2903`
- Analysis of logs from `D:\MD\Downloads\newlog` on 2026-05-25/26:
  - Several downloaded CSV files are duplicates; do not count duplicate archives as separate runs.
  - Manual/user-caused sections to filter: the 2026-05-24 evening power/reset interruption around `20:00..22:49`, the 2026-05-25 full restart around `09:40`, and the 2026-05-24 OTA experiments with `OTA_ERROR`.
  - Weather/hardware-risk sections to treat cautiously: 2026-05-25 `08:30..09:39` had many `BROWNOUT` boots and wild `boot_seq` jumps after rain/wetness; 2026-05-25 `17:50..19:09` also had an unplanned gap/restart during light rain while the user was away.
  - A non-user suspicious section remains around 2026-05-25 `15:10..15:20` with nearby `BOOT` rows and higher sound values; keep it as a real field anomaly until more logs clarify it.
  - The 2026-05-24 `23:00..00:40` high sound/p2p spike may be a real peak or an electrical/contact/post-restart artifact; do not use it yet for `LOUD/PEAK` threshold decisions.
  - Current expert direction: collect a couple more days of battery balcony logs before deciding; do not rush soldering to a board until power/moisture/contact behavior is clearer.
- Current clean physical-construction run started on 2026-05-29 around `01:00` after clearing the log and rebooting the controller.
  - During this run the battery disconnected after the `08:29:59` window.
  - A different battery was installed around `12:30:00`, and the run continued.
  - The battery was changed again at `22:02`.
  - Due to the battery/user handling, the controller stopped around `22:19` and resumed around `22:57`; treat this as a user-caused power interruption, not a firmware or normal hardware fault.
  - On 2026-05-30 around `11:11`, the battery discharged and was changed; allow about `5 min` for this user-caused replacement interruption.
  - A second controller for solar-charge management is running in parallel on the same battery supply during this test. That controller is itself in a test stage and sometimes reboots or loses connectivity. During later log analysis, consider shared-supply voltage dips or electrical interference from this controller before attributing anomalies to the noise-monitoring ESP32, microphone construction, or firmware.
  - For later analysis, split this run into `01:00..08:29:59` as the first valid segment, `08:30..12:29:59` as a power-gap/non-measurement interval, `12:30..22:01` as a second segment on another battery, `22:02..22:18` as a short post-change segment, `22:19..22:56` as a user-caused power interruption, `22:57..2026-05-30 11:10` as the resumed segment, and about `11:11..11:16` as another battery-replacement interruption.
- Analysis of the clean protected-construction run from `D:\MD\Downloads\newlog\30052026_1327.csv` and Telegram export on 2026-05-30:
  - Use the latest CSV snapshot only for the clean run; intermediate downloaded CSV files are growing snapshots and must not be counted as separate runs.
  - The local CSV contains `191` measurement windows. Outside the known user-caused battery interruptions, the timeline is complete with no unexplained missing windows.
  - Treat the first window after each power restart as partial and exclude it from precise threshold calibration, even though it remains useful for continuity checks.
  - All `191` windows report `signal=OK`; `env_fail_count=0` throughout; no `SHT31_LOST`, `SHT31_REINIT`, or `SHT31_RECOVER` events appeared.
  - The protected microphone construction preserves useful relative separation: `NGT p2p_avg` is around `235`, while `DAY` and `EVE` are around `528..532`.
  - Current percent scaling is now too conservative for the protected microphone geometry: average `now_avg_pct` is below `1%`, and `hour_pct` is almost always `0`. Retune only after enough clean logs are collected.
  - Persisted `M` is contaminated by earlier physical revisions and must be reset or deliberately re-baselined when the new acoustic scale is finalized.
  - Telegram export contains many `INA3221 Online` / `INA3221 Solar Summary` entries from the separate solar controller. Exclude them from noise-controller stability conclusions. The noise-monitoring ESP32 showed only expected `Device Online` messages near manual battery changes.

## Current Firmware Behavior

- Build `95` retuned the `INMP441` percent scale using fixed `P2P` anchors.
- Approximate live scale target:
  - `P2P 1200` maps near `20%`
  - `P2P 1800` maps near `40%`
  - `P2P 2400` maps near `60%`
- `CLIP` now requires a meaningful share of clipped samples inside the current `I2S` read window.
- `LOW` is meant to indicate a very weak or empty input, not ordinary quiet balcony ambience.
- Long button press now supports display observation:
  - short press while display is on: next page
  - short press while display is off: display on with auto-off
  - long press: pin display on without idle blanking
  - another long press while pinned: return to normal auto-off timing
- Build `96` adds an OLED `RANGE` page and Serial `range=min/max` output for finding quiet baseline and loud reference from session `P2P`.
- Build `97` changes local `/log.csv` into a compact 10-minute analysis log instead of a frequent raw stream.
- New local CSV rows include window time, build, average percentages, `P2P avg/min/max`, session `P2P min/max`, raw min/max, signal state, environment averages, sample count, quiet/loud counts, and Wi-Fi RSSI.
- If an older `/sound_log.csv` exists on the device, build `97` moves it to `/sound_log_legacy.csv` and starts a clean compact log with the new header.
- Build `98` adds `session_p2p_min/session_p2p_max` to local `/log.csv` so the sent CSV includes the overall boot-session `RANGE` context.
- Build `98` makes `http://<device-ip>/` a tiny local page with a direct `/log.csv` download link.
- Build `98` caches Wi-Fi signal readings and refreshes them every 30 seconds.
- Build `99` adds a safe web clear flow: `/clear-log` asks for confirmation, `/clear-log-confirm` clears only current `/sound_log.csv` and recreates the active header.
- Build `99` reads SHT31 every `15 sec` instead of every `5 sec`.
- Build `99` refreshes OLED by page: `DEBUG` at `250 ms`, calmer pages at `1000 ms`.
- Serial `[STAT]` remains every `5 sec`; verbose ON/OFF is a future optimization, not implemented yet.
- Build `100` slims local `/log.csv` by removing `ver`, `power_target`, and `uptime_min`; only `build` remains as the firmware marker.
- OLED now has four pages: main `Now/H/M`, `DEBUG`, `RANGE`, and `ENV`; `ENV` shows only temperature and humidity.
- Non-main OLED pages show a small `PIN` marker when long-press pinned display mode is active.
- Build `101` makes the local `/log.csv` diagnostic again for the breadboard test stage: rows now include `event`, `boot_seq`, `reset_reason`, continuous power-session `uptime_min`/`uptime_text`, `p2p_stable_max`, `session_p2p_stable_max`, and SHT31 `env_ok_count/env_fail_count`.
- Build `101` adds `BOOT` and `SCHEDULED_RESTART` rows so restarts are visible in the log timeline.
- Build `101` schedules a daily soft restart and keeps power-session uptime across soft resets using RTC memory; physical power-on starts a new session.
- Build `101` changes OLED `RANGE` to show `MIN`, stable `STB`, and technical `RAW MAX` so random digital spikes do not dominate the main range interpretation.
- Build `102` fixes the diagnostic log shape after the first 101 run: event rows now align with the CSV header, `p2p_p95` was added as the main stable upper sound indicator, and `free_heap/min_free_heap` were added for memory stability checks.
- Build `102` changes power-session uptime to RTC no-init memory so soft restart should preserve `uptime_min` and increment `boot_seq`; physical power-on should start a fresh session.
- Build `102` adds SHT31 health events and recovery: `SHT31_LOST`, periodic `SHT31_REINIT`, and `SHT31_RECOVER` when valid temperature/humidity returns.
- Build `103` adds minimal ArduinoOTA with hostname/password from `include/secrets.h`; OTA lifecycle events are logged as `OTA_START`, `OTA_END`, and `OTA_ERROR`.
- Build `103` adds a local web archive flow at `/archive-log` so the current `/sound_log.csv` can be preserved before clearing, schema changes, OTA, or test resets.
- Build `103` keeps the Telegram supergroup chat id fix in local secrets for controller-side `Device Online` alerts.
- OTA helper tooling is configured with PlatformIO env `esp32dev_ota` and `scripts/ota_upload.ps1`; default OTA target is the fixed IP `192.168.11.124`, and the helper reads `OTA_PASSWORD` from ignored `include/secrets.h`.
- Build `104` adds archive download links to the local web log page, including `/sound_log_archive_*.csv` and `/sound_log_legacy.csv`, so preserved logs can be downloaded after archiving.
- Build `105` shortens archived log filenames to `DDMMYYYY_HHMM.csv` when time is synced and changes the local log web UI to a dark theme.
- Build `106` fixes browser download names for active and archived CSV logs using explicit CSV filenames, and makes same-minute archive names unique with suffixes such as `_2`.
- Build `107` changes the archived-log web list to show readable date/time labels such as `24.05.2026 16:42`, while keeping downloaded filenames in `DDMMYYYY_HHMM.csv` format.
- Build `108` changes the partition table to add `otadata`, `ota_0`, and `ota_1`; after one USB flash, a real OTA upload was confirmed working end-to-end.
- OTA is now considered serviceable for future firmware updates when the device is reachable on the local network; keep USB as the recovery path.
- `esp32dev_ota` currently pins the PC-side OTA callback to `host_ip=192.168.11.135`, `host_port=3233`, and `timeout=30` so the ESP32 can connect back to the correct Windows Wi-Fi interface.
- Build `109` marks the protected external-microphone construction as `acoustic_rev=2`, retunes the relative percent scale for its lower but useful `P2P` range, and starts a fresh persistent `M` baseline without deleting the older revision's NVS data.
- Build `109` also sends the final-run diagnostics to Google Sheets: `P2P P95`, window/session P2P ranges, SHT31 counters, heap values, boot/reset context, and acoustic revision.
- Build `109` was uploaded successfully by OTA on 2026-05-30; the device recreated active `/log.csv` with the new `acoustic_rev` column. The updated local `google_sheets/Code.gs` must be deployed in Google Apps Script before the final run if the expanded cloud-table columns are required.
- Build `110` applies the accepted protected-microphone relative thresholds to user-facing level classification: `SILENT <=350`, `NORMAL 351..650`, `LOUD 651..850`, `PEAK >850` based on `P2P` level. Firmware MQTT/Datacake `SIGNAL_STATE`, local `quiet_count`/`loud_count`, and Google Sheets `LEVEL` summaries now use this `P2P`-based logic instead of the old `NOW %` buckets.
- Final-run preparation checkpoint on 2026-05-30:
  - Updated `google_sheets/Code.gs` has been deployed in Google Apps Script.
  - The noise-monitoring ESP32 is running `0.1.55-EXP` build `109`.
  - The previous active `/log.csv` and `/sound_log_legacy.csv` were downloaded and preserved before the clean final run.
  - The remaining clean-start steps will happen when the user explicitly starts the final run: clear the active log, physical power-cycle, record the exact start time, and keep both controllers running together.
- Final-run field-event notes:
  - A preliminary build `109` observation run started on 2026-05-30 around `16:02` without a physical power-cycle. Its accumulated log is useful for context and live-response checks, but it is not the final clean multi-day run.
  - The user plans to start the final clean multi-day run around `2026-05-31 00:00`: clear the active log, physical power-cycle the noise-monitoring ESP32, record the exact start time, and then keep the system unchanged for several days.
  - Final clean multi-day run actually started on `2026-05-31 00:00`. The active local log and Telegram chat were cleared before the run, and power was physically disconnected/reconnected for a clean session start.
  - The battery was not replaced at the initial start and the noise-monitoring controller stopped around `00:30`. A new battery was installed around `01:30`. Treat `00:00..00:29` as a short preliminary segment, `00:30..01:29` as a user-caused battery-outage gap, and use `01:30+` as the main final-run segment on the fresh battery.
  - On 2026-05-31, another battery outage occurred approximately around `11:10`, and the battery was replaced approximately around `11:25`. The user notes that these times may be off by about `10..20 min`. During final analysis, derive the precise interruption boundary from local CSV gaps, `BOOT` rows, and uptime values instead of treating the reported times as exact.
  - The user sometimes temporarily charges the noise-monitoring system's working battery from a separate battery charged by the solar panel, to avoid moving batteries indoors. That solar-charged battery is not a permanent part of the noise controller's normal power path.
  - During this temporary charging connection, the noise-monitoring controller may sometimes reboot or hang. Treat these episodes as `charging-related intervention` intervals, separate from normal autonomous runtime and separate from microphone-quality conclusions. Record approximate connect/disconnect times, whether a `BOOT`, hang, or connectivity-only interruption occurred, whether a manual restart was needed, and the approximate duration.
  - Confirmed `charging-related intervention` on 2026-05-31: the noise-monitoring controller lost power approximately around `16:09` during battery charging, and the outage was noticed later. The controller was powered again around `17:56`. Exclude approximately `16:09..17:55` from normal-runtime and acoustic-statistics conclusions; refine the exact boundary from CSV gaps and boot/uptime evidence.
  - Battery-outage interruption on 2026-06-01: the working battery was not charged in time, the noise-monitoring controller stopped approximately around `17:55..18:00`, and it was powered again at `19:21`. Exclude this interval from normal-runtime and acoustic-statistics conclusions; refine the exact boundary from CSV gaps and boot/uptime evidence.
  - Plan: keep the final run unchanged until approximately `2026-06-02 20:48`, then perform the controlled acoustic events, download the final logs, and begin the final microphone-stage analysis.
  - Field note on 2026-06-02 at approximately `18:56`: no code, hardware, or power-path changes were made during the day; the system was still running. Weather was windy. Use the 2026-06-02 windows as a wind-exposure check for the protected external microphone and sponge layer.
  - Screenshot evidence on 2026-06-02: Telegram showed an unexpected `Device Online` message for `bs-esp32-01`, version `0.1.55-EXP` build `109`, IP `192.168.11.124`, Wi-Fi `92% (-54 dBm)`, time synced, and uptime `1 d 0 h 0 m`. The visible Telegram message time is `19:21`. The user did not touch the device and reports the battery was full. Treat this as an unexplained restart candidate and inspect nearby local CSV `BOOT`, `reset_reason`, uptime, gaps, and Telegram export timestamps during final analysis.
  - The user decided to extend the final run beyond the earlier planned end time to capture possible additional weather changes. Keep code and microphone mechanics unchanged; use the extended windows as extra weather-exposure evidence.
  - Screenshot/table evidence on 2026-06-04: the device was found off in the morning with a discharged battery. The last visible pre-outage window was `2026-06-04 04:00..04:09` (`NGT`, build `109`, `boot_seq=3`, `reset_reason=SOFT`, uptime `2 d 8 h 49 m`). The next visible event was `BOOT` with `reset_reason=POWERON`, followed by window `08:20..08:29` (`DAY`, uptime `3 min`). Treat the outage as a battery-depletion power gap roughly between `04:10..08:19`; the restart appears to have happened around `08:17`. Refine from the full CSV during final analysis.
  - Final log package `D:\MD\Downloads\newlog\Log.zip` was analyzed on 2026-06-04/05. Exact-deduplicated CSV evidence contains `705` `WINDOW` rows, `7` `BOOT` rows, and `2` `SCHEDULED_RESTART` rows; the final clean run from `2026-05-31 00:00` through `2026-06-04 21:20` contains `654` unique measurement windows. Known gaps align with user-reported battery/charging events: `2026-05-31 00:20..01:20`, `10:50..11:20`, `16:00..17:50`, `2026-06-01 17:40..19:20`, and `2026-06-04 04:00..08:20`. No unexplained long data-loss gap remained after these exclusions.
  - Final acoustic statistics for the clean run use `p2p_avg` as the main typical-background metric: `DAY` median `593`, p75 `633`, p90 `664`, p95 `685`, max `839`; `EVE` median `542`, p75 `605`, p90 `639`, p95 `663`, max `722`; `NGT` median `219`, p75 `304`, p90 `375`, p95 `421`, max `512`. `p2p_p95` remains useful for short peaks: `DAY` median `997`, p95 `1182`; `EVE` median `892`, p95 `1094`; `NGT` median `497`, p95 `815`.
  - Final health evidence: all final-run windows report `signal=OK`; `env_fail_count` stayed `0`; no `SHT31_LOST`, `SHT31_REINIT`, or `SHT31_RECOVER` events were present; minimum observed `free_heap` was about `138648`, and minimum `min_free_heap` was about `75980`. Telegram export has `8` `Device Online` messages for `bs-esp32-01` and no `INA3221 Online` / `INA3221 Solar Summary` messages in this package.
  - The 2026-06-02 `19:21` Telegram `Device Online` event is confirmed by local CSV as `SCHEDULED_RESTART` at `19:20:45` followed by `BOOT` with `reset_reason=SOFT`, not as battery loss. The 2026-06-03 `19:21` event is the same daily scheduled soft restart pattern. The 2026-06-01 `19:21` `Device Online` follows the known battery/charging gap and has `reset_reason=WDT`; keep it as a power/intervention-adjacent anomaly to watch, not as evidence against the microphone construction.
  - Final microphone-stage verdict: the protected external INMP441 construction (`acoustic_rev=2`) is good enough to close the microphone/mechanical stage. It preserves clear `NGT` vs `DAY/EVE` separation, reacts across real field conditions, and shows no evidence of being over-damped by the tube/sponge. Preliminary relative thresholds based on `p2p_avg`: `SILENT <=350`, `NORMAL 351..650`, `LOUD 651..850`, `PEAK >850`; for short transient review, cross-check with `p2p_p95` / `p2p_stable_max`. Main remaining system risk is power continuity, not microphone sensitivity or firmware audio processing.
  - Perform the controlled acoustic events at the end of the final clean run, not at the beginning, so they do not distort the natural multi-day statistics. Record exact times for: `1 min` ordinary quiet, `1 min` conversation at `0.5..1 m`, and `3..5` claps at a known distance.
  - On 2026-05-30, moderate but not heavy rain started approximately around `19:24..19:29` local time (`+04:00`). Treat this as a weather-context boundary when comparing microphone behavior, SHT31 readings, and any later anomalies.
  - On 2026-05-30 around `20:05` local time, a nearby car alarm sounded roughly once per second. The user observed live OLED `P2P` reacting approximately in the `500..1024` range.
  - During the same wet-road period, passing-car tire noise on wet asphalt also produced visible live `P2P` changes. Exact values were not captured. Use the nearby CSV windows around `20:00..20:09` and subsequent rainy-road windows as real-world acoustic-response evidence.
  - The approximate distance from the external microphone to the road opposite the installation is `8.5 m`.
  - Preliminary live OLED `DEBUG` observations on build `109`: ordinary quiet is around `P2P 300..400`, while medium road noise including tire noise on wet asphalt is around `P2P 700..800`. Treat these as live-response anchors and compare them with the final local CSV aggregates before fixing user-facing thresholds.

## BSPRJ Migration Notes

- `BSPRJ` is the active project in `D:\DEV\BSPRJ`.
- The new GitHub remote is `https://github.com/allinnprj/BSPRJ`.
- Only `main` and `devlop` are active project branches in `BSPRJ`: `main` = release, `devlop` = test/development.
- Old backup/reference folders should not receive normal new work.

## Next Best Steps

- Use OTA for future firmware updates when the device is reachable on the local network; USB remains the recovery path.
- Before starting the next clean run, download the current `/log.csv`; optionally use `/archive-log` after download to preserve the on-device file and start a fresh active log.
- Reboot or power-cycle before the multi-day balcony run; a physical power cycle starts a fresh power-session uptime and `boot_seq=1`.
- Use the `RANGE` page during the run: `STB` is the stable practical maximum, while `RAW MAX` is only the technical peak.
- Run a final `48..72 h` battery-powered balcony test on build `109` without changing the microphone mechanics.
- Download `/log.csv` after the run; it is now the preferred compact file to send for analysis instead of a full Google Sheets export.
- For future firmware updates, use OTA when the device is reachable on the local network; keep USB as the recovery path.
- Microphone/mechanical stage can be treated as complete on build `109` / `acoustic_rev=2`; next practical project stage can move to GPS integration while keeping the current microphone mechanics unchanged.
- Keep the build `110` relative thresholds under review as field defaults: `SILENT <=350`, `NORMAL 351..650`, `LOUD 651..850`, `PEAK >850` based on `p2p_avg` / stable `P2P` level. Use `p2p_p95` and `p2p_stable_max` to inspect sharp transient events separately.
- Before integrating larger modules, keep memory decisions incremental: ESP-NOW first is acceptable, GPS should use a compact parser, and GSM needs a separate memory/architecture plan before implementation. A single PlatformIO project with multiple controller environments is allowed later if it helps manage both BSPRJ controllers together.
- If SHT31 data still disappears, use `env_fail_count`, `SHT31_LOST/SHT31_REINIT/SHT31_RECOVER`, and restart rows to decide whether the issue is sensor/I2C/power/contact related before soldering.
- Use `DATA_DICTIONARY.md` or `DATA_DICTIONARY_RU.md` when the user asks what a column, status, verdict, flag, or Telegram line means.

## Quick Commands

- Build: `pio run`
- Upload: `pio run -e esp32dev -t upload`
- OTA upload by fixed IP: `.\scripts\ota_upload.ps1`
- OTA upload by IP: `.\scripts\ota_upload.ps1 -Port <device-ip>`
- VS Code OTA env: `esp32dev_ota`
- Monitor: `pio device monitor -e esp32dev -b 115200`
- Local device log URL pattern: `http://<device-ip>/log.csv`
