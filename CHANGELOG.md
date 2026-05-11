# CHANGELOG

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
