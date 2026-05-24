# AGENTS

## Project Scope

- Project type: local temporary test project, no GitHub publishing required
- Current device target: `ESP32 DevKit`
- Current microphone stage: `INMP441` on ESP32 `I2S` as the active relative-level source
- Current microphone wiring target: `BCLK=GPIO26`, `WS=GPIO25`, `DATA=GPIO32`, `L/R=GND`
- Current real-world power target: battery operation is the primary mode; USB readings are secondary debug mode only
- Display: `SSD1306 128x64 I2C` at address `0x3C`
- Framework target: `Arduino / ESP32`
- Active microphone platform: `ESP32 + INMP441`

## Main Project Goal

- The core project goal is to understand when noise is high or low across the day.
- `DAY / EVENING / NIGHT` are the main statistical time buckets.
- `SILENT / NORMAL / LOUD / PEAK` are the human-readable noise-level labels.
- The intended outcome is not just raw telemetry, but conclusions such as:
  - what the average daytime noise level is
  - what the average evening noise level is
  - what the average night noise level is
  - which level is most typical for each period
- The longer-term direction is to let this analytical core grow into a scalable noise-monitoring system with stronger audio input, location context, anomaly detection, and mapping later on.
- That future direction must not weaken the current stage rule: first make the single-device runtime and its time-based conclusions trustworthy, then expand outward.
- Future code, dashboard, display, MQTT, Datacake, and hardware decisions should support this analytical goal.

## Working Rules

- If the user writes `Продолжаем проект`, treat it as a context-restore command: read `STANDARD.md`, `AGENTS.md`, `AGENTS.local.md`, and `memory.md`, then give a short current-state summary and continue from the next practical step.
- At the start of a new chat or before continuing non-trivial work, read `memory.md` together with `STANDARD.md`, `AGENTS.md`, and `AGENTS.local.md`.
- Treat `memory.md` as the project continuation context: it summarizes where the work stopped, what decisions are already settled, and what the next likely steps are.
- Keep `memory.md` concise and update it only with durable context that helps a future chat continue the project quickly.
- After meaningful project decisions, hardware changes, log-analysis conclusions, or end-of-session handoff points, update `memory.md` so `Продолжаем проект` works in a new chat without requiring a fresh manual `СОС`.
- Use `DATA_DICTIONARY.md` and `DATA_DICTIONARY_RU.md` as the human-readable references for Google Sheets, Telegram, AppSheet, log, and analytics term meanings.
- Keep the project incremental: one hardware check or one behavior change per step.
- Prefer the smallest safe edit for the current task.
- Validate firmware changes with `pio run` for `env:esp32dev`.
- Do not present relative microphone levels as real `dB` until a calibration step is explicitly added.
- Keep display layouts simple and readable on `128x64`.
- GitHub flow is intentionally out of scope for this repository unless the user explicitly changes that decision.
- Secrets, passwords, tokens, and chat identifiers must live in `include/secrets.h`, not in `src/main.cpp` or committed docs.
- Network features should be introduced in modules such as `wifi_service` and `time_service`, not embedded directly into `main.cpp`.
- A clean restart is preferred over carrying ESP8266-specific workarounds into the ESP32 codebase.
- At the end of each completed task, include an estimated overall project readiness percentage in the final response only.
- This readiness percentage refers to the whole current prototype goal, not only the current task.
- Treat the percentage as an expert estimate based on firmware stability, logging quality, sensor reliability, calibration readiness, OTA/serviceability, and confidence in multi-day data.
- If there is not enough data for a confident estimate, give a cautious estimate and briefly state why.

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
