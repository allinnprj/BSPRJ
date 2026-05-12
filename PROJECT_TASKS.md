# PROJECT TASKS

## Критично

1. Add persistent storage for long-term average so `M` can survive reboot when that behavior is needed.
2. Refine microphone sanity checks with longer-term warning counters and clearer recovery rules if the input oscillates between valid and invalid states.
3. Add a real time source so day-part statistics use actual wall-clock time instead of the current boot-based virtual clock.
4. Add Wi-Fi reconnect and recovery behavior so temporary network loss does not leave the device stuck in `FAIL`.

## Важно

5. Add a calibration mode to map relative levels to approximate real-world `dB` with clear limitations.
6. Prepare the ESP32 migration plan for `INMP441`, including what logic can be reused and what must change for I2S input.
7. Add a cleaner OLED layout with optional compact and large-font modes.
8. Add adjustable time windows so hour statistics can also be inspected over shorter warmup-friendly periods.
9. Add an NTP time module that replaces the current virtual clock for day-part statistics.
10. Unify `SIGNAL_STATE` across Datacake and MQTT to use the same human-readable levels: `SILENT`, `NORMAL`, `LOUD`, `PEAK`.
11. Remove redundant uptime/update telemetry from the active dashboard set: `LAST_UPDATE_TS`, `UPTIME_DATE`, `UPTIME_MIN`, and `UPTIME_HOURS`.
12. Keep `DAY_PCT`, `EVENING_PCT`, and `NIGHT_PCT` as the primary day-part statistics and re-evaluate whether `CURRENT_PERIOD_PCT` still adds enough value.
13. Optimize Datacake telemetry by batching fields where possible and keeping the cloud side quota-safe without weakening the live MQTT feed.
14. Investigate and reduce the light startup lag that is visible before Wi-Fi becomes available.

## Позже

15. Add historical trend pages for minute or hour summaries.
16. Add acoustic event markers or threshold counters for louder periods.
17. Harden MQTT retained/live freshness behavior for desktop dashboards so clients open with immediately usable last-known values.
18. Add level-2 power-saving optimizations: slower OLED refresh, less frequent `SHT31` reads, and less frequent non-critical live telemetry.
19. Add daily Google Sheets rotation so each day can write into a date-named sheet automatically.
