# Project Memory

This file is the quick context bridge for a new chat. When the user writes `Продолжаем проект`, read this file together with `STANDARD.md`, `AGENTS.md`, and `AGENTS.local.md`, then continue without asking for a fresh `СОС`.

## Current Snapshot

- Project: local temporary ESP32 noise-monitoring prototype, no GitHub publishing required.
- Main goal: understand when balcony/noise levels are quiet, normal, loud, or peak across `DAY / EVE / NGT`.
- Active hardware: `ESP32 DevKit`, `INMP441` microphone on `I2S`, `SSD1306 128x64` OLED, `SHT31` environment sensor.
- Active microphone wiring: `BCLK=GPIO26`, `WS=GPIO25`, `DATA=GPIO32`, `L/R=GND`.
- Real operating mode: battery power is the primary target; USB power is only a debug/service mode.
- Current firmware marker: `0.1.44-EXP` build `98`.

## Important Decisions

- `MAX9814` is finished and must not be brought back into the active path.
- Do not present readings as real `dB`; all sound values are relative until a real calibration step exists.
- Battery-powered balcony behavior is the reference scenario for tuning.
- Keep changes incremental: one behavior or one hardware check per step.
- `CHANGELOG.md` is history; this `memory.md` is the continuation context for new chats.
- `DATA_DICTIONARY.md` and `DATA_DICTIONARY_RU.md` are the practical references for table, Telegram, AppSheet, log, and analytics terms.

## Hardware Notes

- The user added power smoothing for the battery setup:
  - `3300 uF` on the controller input.
  - `470 uF` for the display/environment branch.
  - Local capacitor at the `INMP441` `3.3V` input.
- The microphone has a sponge/wind filter for balcony use.
- The current assembly is on a breadboard; the external microphone-on-wires plan is paused for now.

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
- New local CSV rows include window time, version/build, average percentages, `P2P avg/min/max`, raw min/max, signal state, environment averages, sample count, quiet/loud counts, Wi-Fi RSSI, battery target, and uptime minutes.
- If an older `/sound_log.csv` exists on the device, build `97` moves it to `/sound_log_legacy.csv` and starts a clean compact log with the new header.
- Build `98` adds `session_p2p_min/session_p2p_max` to local `/log.csv` so the sent CSV includes the overall boot-session `RANGE` context.
- Build `98` makes `http://<device-ip>/` a tiny local page with a direct `/log.csv` download link.
- Build `98` caches Wi-Fi signal readings and refreshes them every 30 seconds.
- OLED now has four pages: main `Now/H/M`, `DEBUG`, `RANGE`, and `ENV`; `ENV` shows only temperature and humidity.
- Non-main OLED pages show a small `PIN` marker when long-press pinned display mode is active.

## Next Best Steps

- Flash `0.1.44-EXP` build `98` if it is not already on the device.
- Reboot before measuring a new quiet/loud range, then use the `RANGE` page to read session `MIN` and `MAX` `P2P`.
- Run a new battery-powered balcony test with the retuned scale and range page.
- Download `/log.csv` after the run; it is now the preferred compact file to send for analysis instead of a full Google Sheets export.
- Analyze whether the new `NOW %` and `SILENT / NORMAL / LOUD / PEAK` buckets now match real balcony perception.
- If `CLIP` still appears too often, inspect clipped-sample behavior before changing user-facing levels.
- If the new scale feels reasonable, update Google Sheets/AppSheet analytics to rely on the improved values.
- Use `DATA_DICTIONARY.md` or `DATA_DICTIONARY_RU.md` when the user asks what a column, status, verdict, flag, or Telegram line means.

## Quick Commands

- Build: `pio run`
- Upload: `pio run -e esp32dev -t upload`
- Monitor: `pio device monitor -e esp32dev -b 115200`
- Local device log URL pattern: `http://<device-ip>/log.csv`
