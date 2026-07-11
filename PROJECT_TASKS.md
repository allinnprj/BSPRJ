# PROJECT TASKS

## Project Identity

- Active project name: `BSPRJ`.
- Repository: `https://github.com/allinnprj/BSPRJ`.
- Branch model: `main` is release/stable, `devlop` is test/development.
- `BSPRJ` is the active project name; new work belongs in `BSPRJ`.
- `zaexp` is an old isolated microphone test and is not part of active `BSPRJ` planning.

## Критично

1. Validate build `113` soft-ECO behavior on the real device before the upcoming unattended/vacation run. Builds `111..113` already added the first safe ECO layer, visible `ECO` profile marker, and long-run log cleanup tools without deep sleep; next decide from FNB58/current logs whether this is enough or whether deeper sleep/coverage accounting is necessary.
2. Before the upcoming unattended/vacation run, design and implement the smart link between the current ESP32 noise controller and the nearby ESP32-C3 Super Mini + INA3221 solar controller. Account for the C3's weak Wi-Fi and the main controller's better antenna; evaluate a local controller-to-controller link such as UART, I2C, or ESP-NOW, with the main ESP32 acting as the gateway if that is the most reliable path.
3. If only one pre-departure task can be completed, complete energy saving first and defer the ESP32-C3/INA3221 link.
4. Add persistent storage for long-term average so `M` can survive reboot when that behavior is needed.
5. Refine microphone sanity checks with longer-term warning counters and clearer recovery rules if the input oscillates between valid and invalid states.
6. Harden the current NTP-based time path so day-part statistics stay trustworthy after late sync, reconnects, and startup transitions.
7. Validate and harden Wi-Fi reconnect/recovery behavior under real `DISC` / `LOST` / `FAIL` cases so the device reliably returns to normal operation.

## Важно

8. Add a calibration mode to map relative levels to approximate real-world `dB` with clear limitations.
9. Prepare the ESP32 migration plan for `INMP441`, including what logic can be reused and what must change for I2S input.
10. Add a cleaner OLED layout with optional compact and large-font modes.
11. Add adjustable time windows so hour statistics can also be inspected over shorter warmup-friendly periods.
12. Expose time-sync state more clearly in telemetry/UI so users can tell when day-part statistics are already based on valid wall-clock time.
13. Unify `SIGNAL_STATE` across Datacake and MQTT to use the same human-readable levels: `SILENT`, `NORMAL`, `LOUD`, `PEAK`.
14. Remove redundant uptime/update telemetry from the active dashboard set: `LAST_UPDATE_TS`, `UPTIME_DATE`, `UPTIME_MIN`, and `UPTIME_HOURS`.
15. Keep `DAY_PCT`, `EVENING_PCT`, and `NIGHT_PCT` as the primary day-part statistics and re-evaluate whether `CURRENT_PERIOD_PCT` still adds enough value.
16. Optimize Datacake telemetry by batching fields where possible and keeping the cloud side quota-safe without weakening the live MQTT feed.
17. Investigate and reduce the light startup lag that is visible before Wi-Fi becomes available.
18. Add a minimal controller-side Telegram alert service for `Device Online`, `Wi-Fi Restored`, and a non-spamming `Warning` path via direct Telegram Bot API calls, without pulling in a heavy bot framework.

## Позже

19. Build a read-only AppSheet dashboard layer on top of `summary_conclusions`, `summary_daypart`, `summary_levels`, `summary_health`, and later `clean_summary_10m`, without changing the live `log` write contract.
20. Add historical trend pages for minute or hour summaries.
21. Add acoustic event markers or threshold counters for louder periods.
22. Harden MQTT retained/live freshness behavior for desktop dashboards so clients open with immediately usable last-known values.
23. If build `113` ECO is still not efficient enough, add level-2 power-saving with explicit measurement coverage accounting rather than only slower refresh/telemetry. Do not weaken 10-minute day-part sound conclusions without logging measured seconds, skipped/sleep seconds, coverage percent, and window quality.
24. Add daily Google Sheets rotation so each day can write into a date-named sheet automatically.
25. Migrate the `INMP441` I2S input from the legacy ESP32 `driver/i2s.h` API to the newer `driver/i2s_std.h` API after the current measurement/logging behavior is stable.
26. Evaluate whether splitting work across ESP32 dual cores is useful after the single-device measurement flow is stable; only adopt it if audio sampling, Wi-Fi/cloud uploads, display, or sensor reads begin to interfere with each other.
27. Extend the build `113` local-log housekeeping only if field use shows it is still missing something, for example a one-click download-all package or clearer storage warning before LittleFS fills up.
28. Add `POWER_PROFILE` to MQTT/Datacake only if remote dashboards later need to show the active energy-saving profile; keep it out of the current MQTT payload until explicitly reopened.

## Сделано / частично закрыто

- Build `111`: first safe soft-ECO layer without deep sleep; OLED real display-off, slower visible refresh, Wi-Fi modem sleep, less frequent SHT31/RSSI/WQTT/Serial updates.
- Build `112`: visible `PROJECT_POWER_PROFILE=ECO` on OLED boot, main status, and `DEBUG ECO`; MQTT/Datacake profile publishing deliberately deferred.
- Build `113`: local `BS Noise Log` page shows LittleFS used/total/free, active log size, archived-log count/total, per-archive size, and a confirmed `Clear ALL logs` action for local LittleFS logs only.
