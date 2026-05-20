# CHANGELOG

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
