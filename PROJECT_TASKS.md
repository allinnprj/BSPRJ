# PROJECT TASKS

## Критично

1. Add persistent storage for long-term average so `M` can survive reboot when that behavior is needed.
2. Refine microphone sanity checks with longer-term warning counters and clearer recovery rules if the input oscillates between valid and invalid states.
3. Harden the current NTP-based time path so day-part statistics stay trustworthy after late sync, reconnects, and startup transitions.
4. Validate and harden Wi-Fi reconnect/recovery behavior under real `DISC` / `LOST` / `FAIL` cases so the device reliably returns to normal operation.

## Важно

5. Add a calibration mode to map relative levels to approximate real-world `dB` with clear limitations.
6. Prepare the ESP32 migration plan for `INMP441`, including what logic can be reused and what must change for I2S input.
7. Add a cleaner OLED layout with optional compact and large-font modes.
8. Add adjustable time windows so hour statistics can also be inspected over shorter warmup-friendly periods.
9. Expose time-sync state more clearly in telemetry/UI so users can tell when day-part statistics are already based on valid wall-clock time.
10. Unify `SIGNAL_STATE` across Datacake and MQTT to use the same human-readable levels: `SILENT`, `NORMAL`, `LOUD`, `PEAK`.
11. Remove redundant uptime/update telemetry from the active dashboard set: `LAST_UPDATE_TS`, `UPTIME_DATE`, `UPTIME_MIN`, and `UPTIME_HOURS`.
12. Keep `DAY_PCT`, `EVENING_PCT`, and `NIGHT_PCT` as the primary day-part statistics and re-evaluate whether `CURRENT_PERIOD_PCT` still adds enough value.
13. Optimize Datacake telemetry by batching fields where possible and keeping the cloud side quota-safe without weakening the live MQTT feed.
14. Investigate and reduce the light startup lag that is visible before Wi-Fi becomes available.
15. Add a minimal controller-side Telegram alert service for `Device Online`, `Wi-Fi Restored`, and a non-spamming `Warning` path via direct Telegram Bot API calls, without pulling in a heavy bot framework.

## Позже

16. Build a read-only AppSheet dashboard layer on top of `summary_conclusions`, `summary_daypart`, `summary_levels`, `summary_health`, and later `clean_summary_10m`, without changing the live `log` write contract.
17. Add historical trend pages for minute or hour summaries.
18. Add acoustic event markers or threshold counters for louder periods.
19. Harden MQTT retained/live freshness behavior for desktop dashboards so clients open with immediately usable last-known values.
20. Add level-2 power-saving optimizations: slower OLED refresh, less frequent `SHT31` reads, and less frequent non-critical live telemetry.
21. Research deeper energy-saving modes (`Light Sleep` / `Deep Sleep`) for battery operation, but design them around the city-noise monitoring goal so sleep intervals do not hide important noise events or corrupt day-part conclusions.
22. Add daily Google Sheets rotation so each day can write into a date-named sheet automatically.
23. Migrate the `INMP441` I2S input from the legacy ESP32 `driver/i2s.h` API to the newer `driver/i2s_std.h` API after the current measurement/logging behavior is stable.
24. Evaluate whether splitting work across ESP32 dual cores is useful after the single-device measurement flow is stable; only adopt it if audio sampling, Wi-Fi/cloud uploads, display, or sensor reads begin to interfere with each other.
25. Add a safe local-log archive flow before clearing logs, changing CSV schema, OTA updates, or firmware test resets, so partial multi-day runs can be preserved and merged into later analysis.
