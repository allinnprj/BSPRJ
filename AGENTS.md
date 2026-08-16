# AGENTS

## Project Scope

- Project type: `BSPRJ` main noise-monitoring firmware project, with GitHub publishing enabled
- Repository: `https://github.com/allinnprj/BSPRJ`
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
- Use `progress.md` as the rulebook for subsystem readiness and the weighted overall project readiness percentage.
- Keep the project incremental: one hardware check or one behavior change per step.
- After every intermediate implementation stage, show a concise checklist with: the main project goal, the current stage, what was completed, and what remains. Use it to prevent optional work from drifting too far from the main goal; defer non-essential branches instead of expanding the active stage.
- Prefer the smallest safe edit for the current task.
- Validate firmware changes with `pio run` for `env:esp32dev`.
- Do not present relative microphone levels as real `dB` until a calibration step is explicitly added.
- Keep display layouts simple and readable on `128x64`.
- GitHub flow is in scope for `BSPRJ`.
- Branch model: `main` is the release/stable branch, and `devlop` is the active test/development branch.
- Normal firmware and documentation work must happen on `devlop`; merge or fast-forward to `main` only when the state is release-ready and validated.
- `BSPRJ` is the active project name. Do not edit old backup/reference folders for new `BSPRJ` work unless the user explicitly asks to touch a backup.
- `zaexp` was an old isolated microphone workability test and is not part of the active `BSPRJ` branch model. Do not use it as a source for `BSPRJ` work unless the user explicitly reopens that old test context.
- Secrets, passwords, tokens, and chat identifiers must live in `include/secrets.h`, not in `src/main.cpp` or committed docs.
- Network features should be introduced in modules such as `wifi_service` and `time_service`, not embedded directly into `main.cpp`.
- A clean restart is preferred over carrying ESP8266-specific workarounds into the ESP32 codebase.
- At the end of each completed task, include the relevant subsystem readiness percentages and the weighted overall project readiness percentage in the final response only.
- Show only the subsystems affected by the task plus the overall percentage unless a full progress review was requested.
- The readiness block must be in Russian and must start exactly with `Готовность:`.
- Use Russian subsystem names in the readiness block:
  - `Микрофон и механическая сборка`
  - `Относительная статистика шума и классификация`
  - `Реальная dB-калибровка`
  - `INA3221 и солнечная зарядка`
  - `Связь между контроллерами`
  - `GPS и контекст места/времени`
  - `GSM/мобильная связь`
  - `Общее питание и автономная работа`
  - `Основная прошивка, логи, OTA и диагностика`
  - `Постоянная сборка и финальная полевая проверка`
  - `Общая готовность проекта`
- For a full progress review, use this exact Russian block format and the current percentages from `progress.md`:
  `Готовность:`
  `- Микрофон и механическая сборка: 80%`
  `- Относительная статистика шума и классификация: 60%`
  `- Реальная dB-калибровка: 0%`
  `- INA3221 и солнечная зарядка: 100%`
  `- Связь между контроллерами: 40%`
  `- GPS и контекст места/времени: 65%`
  `- GSM/мобильная связь: 0%`
  `- Общее питание и автономная работа: 25%`
  `- Основная прошивка, логи, OTA и диагностика: 75%`
  `- Постоянная сборка и финальная полевая проверка: 10%`
  `- Общая готовность проекта: 51%`
- Keep subsystem names flexible as the architecture becomes clearer. Split or rename a subsystem when that makes completed work and remaining work easier to understand, for example `Microphone and mechanics` separately from `Sound statistics` and `dB calibration`.
- The overall percentage refers to the complete target system, including sound measurement, dB calibration, solar-controller integration, GPS, GSM, autonomous power, final assembly, and end-to-end field validation.
- Treat percentages as expert estimates based on validated evidence. Do not use a simple arithmetic average when subsystems differ in importance.
- Change the readiness percentage only when there is confirmed project-level progress; useful diagnostics, unvalidated fixes, and build-only changes do not automatically increase readiness.
- If a hidden blocker is discovered, keep the readiness percentage unchanged or lower it when that better reflects project risk.
- Consider `memory.md`, `CHANGELOG.md`, `PROJECT_TASKS.md`, real device tests, open risks, and the main project goal before changing the percentage.
- If there is not enough data for a confident estimate, give a cautious estimate and briefly state why.

## Versioning Rules

- Version source of truth: `include/project_version.h`
- This project uses a lightweight local version format: `MAJOR.MINOR.PATCH-suffix`
- Increase `PATCH` for each meaningful firmware change in `BSPRJ`.
- Increase `PROJECT_BUILD` for each tracked firmware step that changes behavior or diagnostics.
- `CHANGELOG.md` entries must reference the current version and build.

## Current Display Contract

- `Now` = current relative sound level.
- `H` = rolling average for the last hour.
- `M` = average for all measured time since boot.
- If the hour window is not full yet, show warmup state instead of pretending the hour average is complete.
- Time-of-day features must not pretend they know wall-clock time unless RTC, NTP, or another time source is actually present.
- During the clean restart, prefer simple display clarity over carrying older diagnostic rows.
