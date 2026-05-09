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

## Позже

10. Add historical trend pages for minute or hour summaries.
11. Add acoustic event markers or threshold counters for louder periods.
