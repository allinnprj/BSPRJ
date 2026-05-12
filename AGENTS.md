# AGENTS

## Project Scope

- Project type: local temporary test project, no GitHub publishing required
- Current device target: `ESP32 DevKit`
- Current microphone stage: `MAX9814` on an ESP32 ADC pin as a temporary relative-level source
- Display: `SSD1306 128x64 I2C` at address `0x3C`
- Framework target: `Arduino / ESP32`
- Planned future microphone platform: `ESP32 + INMP441`

## Main Project Goal

- The core project goal is to understand when noise is high or low across the day.
- `DAY / EVENING / NIGHT` are the main statistical time buckets.
- `SILENT / NORMAL / LOUD / PEAK` are the human-readable noise-level labels.
- The intended outcome is not just raw telemetry, but conclusions such as:
  - what the average daytime noise level is
  - what the average evening noise level is
  - what the average night noise level is
  - which level is most typical for each period
- Future code, dashboard, display, MQTT, Datacake, and hardware decisions should support this analytical goal.

## Working Rules

- Keep the project incremental: one hardware check or one behavior change per step.
- Prefer the smallest safe edit for the current task.
- Validate firmware changes with `pio run` for `env:esp32dev`.
- Do not present relative microphone levels as real `dB` until a calibration step is explicitly added.
- Keep display layouts simple and readable on `128x64`.
- GitHub flow is intentionally out of scope for this repository unless the user explicitly changes that decision.
- Secrets, passwords, tokens, and chat identifiers must live in `include/secrets.h`, not in `src/main.cpp` or committed docs.
- Network features should be introduced in modules such as `wifi_service` and `time_service`, not embedded directly into `main.cpp`.
- A clean restart is preferred over carrying ESP8266-specific workarounds into the ESP32 codebase.

## Versioning Rules

- Version source of truth: `include/project_version.h`
- This project uses a lightweight local version format: `MAJOR.MINOR.PATCH-suffix`
- Increase `PATCH` for each meaningful firmware change in this temporary test project.
- Increase `PROJECT_BUILD` for each tracked firmware step that changes behavior or diagnostics.
- `CHANGELOG.md` entries must reference the current version and build.

## Current Display Contract

- `Now` = current relative sound level.
- `H` = rolling average for the last hour.
- `M` = average for all measured time since boot.
- If the hour window is not full yet, show warmup state instead of pretending the hour average is complete.
- Time-of-day features must not pretend they know wall-clock time unless RTC, NTP, or another time source is actually present.
- During the clean restart, prefer simple display clarity over carrying older diagnostic rows.
