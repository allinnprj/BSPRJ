# Project Memory

This file is the quick context bridge for a new chat. When the user writes `Продолжаем проект`, read this file together with `STANDARD.md`, `AGENTS.md`, and `AGENTS.local.md`, then continue without asking for a fresh `СОС`.

## Current Snapshot

- Project: local temporary ESP32 noise-monitoring prototype, no GitHub publishing required.
- Main goal: understand when balcony/noise levels are quiet, normal, loud, or peak across `DAY / EVE / NGT`.
- Active hardware: `ESP32 DevKit`, `INMP441` microphone on `I2S`, `SSD1306 128x64` OLED, `SHT31` environment sensor.
- Active microphone wiring: `BCLK=GPIO26`, `WS=GPIO25`, `DATA=GPIO32`, `L/R=GND`.
- Real operating mode: battery power is the primary target; USB power is only a debug/service mode.
- Current firmware marker: `0.1.54-EXP` build `108`.

## Important Decisions

- `MAX9814` is finished and must not be brought back into the active path.
- Do not present readings as real `dB`; all sound values are relative until a real calibration step exists.
- Battery-powered balcony behavior is the reference scenario for tuning.
- Keep changes incremental: one behavior or one hardware check per step.
- `CHANGELOG.md` is history; this `memory.md` is the continuation context for new chats.
- `DATA_DICTIONARY.md` and `DATA_DICTIONARY_RU.md` are the practical references for table, Telegram, AppSheet, log, and analytics terms.
- `progress.md` defines the readiness percentage method; current baseline is `52%` after build `108` was USB-flashed and OTA upload succeeded end-to-end.

## Hardware Notes

- The user added power smoothing for the battery setup:
  - `3300 uF` on the controller input.
  - `470 uF` for the display/environment branch.
  - Local capacitor at the `INMP441` `3.3V` input.
- The microphone has a sponge/wind filter for balcony use.
- The current assembly is still on breadboards inside a metal enclosure.
- The `INMP441` is now outside the enclosure on a separate cable, close to the outer end of a short plastic support tube. A thin sponge layer and enlarged outer opening provide wind/rain protection without the earlier narrow acoustic restriction.
- A second test-stage controller for solar-charge management shares the battery supply. Its own connectivity/reboot issues must be treated as separate background evidence unless the noise-monitoring ESP32 shows matching failures.

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

## Next Best Steps

- Use OTA for future firmware updates when the device is reachable on the local network; USB remains the recovery path.
- Before starting the next clean run, download the current `/log.csv`; optionally use `/archive-log` after download to preserve the on-device file and start a fresh active log.
- Reboot or power-cycle before the multi-day balcony run; a physical power cycle starts a fresh power-session uptime and `boot_seq=1`.
- Use the `RANGE` page during the run: `STB` is the stable practical maximum, while `RAW MAX` is only the technical peak.
- Run a `48..72 h` battery-powered balcony test with the diagnostic log.
- Download `/log.csv` after the run; it is now the preferred compact file to send for analysis instead of a full Google Sheets export.
- For future firmware updates, use OTA when the device is reachable on the local network; keep USB as the recovery path.
- Analyze `p2p_avg`, `p2p_p95`, `p2p_stable_max`, `session_p2p_stable_max`, `env_ok_count/env_fail_count`, `SHT31_*` events, `boot_seq`, `reset_reason`, and heap fields before changing user-facing `SILENT / NORMAL / LOUD / PEAK` levels.
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
