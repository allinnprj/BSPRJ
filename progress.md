# Project Readiness Progress

## Purpose

This file defines how to estimate the overall project readiness percentage.
The percentage is not a reward for activity. It is a cautious expert estimate of how close the whole target system is to an autonomous noise-monitoring platform, not only how mature the current microphone prototype is.

## Scope

- The percentage refers to the whole target project, not only the current task or microphone subsystem.
- The target includes trustworthy noise measurement, real-world dB calibration, `DAY / EVE / NGT` conclusions, and usable `SILENT / NORMAL / LOUD / PEAK` interpretation.
- It also includes communication with the solar-charge controller, shared-power integration, GPS, GSM/mobile connectivity, autonomous operation, final hardware integration, and end-to-end field validation.
- A subsystem may be considered complete without implying that the whole project is close to completion.

## Evidence To Consider

- Current `memory.md` state and next steps.
- `CHANGELOG.md` entries and whether they were validated on the real device.
- `PROJECT_TASKS.md` critical and important open work.
- Actual field tests, especially battery-powered balcony runs.
- Local CSV log quality, archive/download usability, and analysis usefulness.
- Sensor reliability, including SHT31 availability and recovery behavior.
- OTA/serviceability only after a real OTA upload succeeds end-to-end.
- Known risks, hidden blockers, and unverified assumptions.

## Update Rules

- Track readiness by subsystem, with a short statement of validated evidence and remaining work for each subsystem.
- Subsystem names may be renamed, split, or merged as the architecture evolves, but preserve the history and reasoning behind material percentage changes.
- Raise a subsystem percentage only after confirmed progress in that subsystem. Code completion without relevant build, device, integration, or field validation is not automatically sufficient.
- The overall percentage is a weighted expert estimate. It must account for subsystem importance, dependencies, integration risk, and final validation; it is not the arithmetic mean of subsystem percentages.
- After a completed task, report the affected subsystem percentages and the overall percentage. Provide the full subsystem table when requested or after a major milestone.
- Change the percentage only when there is confirmed project-level progress.
- Finding a cause is not enough by itself; the fix must be validated on the device or in the relevant field test.
- If a hidden blocker is found, the percentage can stay unchanged or go down.
- Build success alone usually does not raise readiness unless the built change directly closes a project risk and is confirmed where it matters.
- Use cautious estimates when data is incomplete, and briefly say why.
- Avoid automatic upward drift. A useful diagnostic step can be important without increasing readiness.

## Current Baseline

- Current whole-project readiness estimate: `57%`.

## Russian Report Block

Use this exact Russian format for full progress reviews and in new-chat status summaries:

```text
Готовность:
- Микрофон и механическая сборка: 80%
- Относительная статистика шума и классификация: 60%
- Реальная dB-калибровка: 0%
- INA3221 и солнечная зарядка: 100%
- Связь между контроллерами: 85%
- GPS и контекст места/времени: 80%
- GSM/мобильная связь: 0%
- Общее питание и автономная работа: 25%
- Основная прошивка, логи, OTA и диагностика: 80%
- Постоянная сборка и финальная полевая проверка: 10%
- Общая готовность проекта: 57%
```

| Subsystem | Readiness | Confirmed state | Main remaining work |
| --- | ---: | --- | --- |
| Microphone and mechanical assembly | `80%` | Protected external `INMP441` passed a multi-day build `109` field run with clear day-part separation and stable signal. Hardware geometry is accepted and will remain unchanged. | Controlled reference events and later confirmation that dB calibration works across the useful range. |
| Relative sound statistics and classification | `60%` | Clean logs support preliminary `SILENT / NORMAL / LOUD / PEAK` boundaries and build `110` implements the accepted `P2P` thresholds in firmware and Google Sheets summary logic. Local Apps Script now aligns `AVG P2P` readings, handles near-tied `NORMAL/LOUD` days as `MIXED NORMAL/LOUD`, and separates coverage-based `DATA CONFIDENCE` from `LEVEL DOMINANCE`. A guarded Sheets reset command and technical-column hide/show controls support a clean final run. All local regressions pass, but deployed cloud output is not field-validated yet. | Deploy the updated Apps Script, visually validate the new columns and Telegram summary, run `Reset for clean run`, then confirm across the multi-day run that charts, AppSheet, MQTT/Datacake, local logs, and Sheets summaries classify real windows consistently. |
| Real dB calibration | `0%` | A reference sound-level meter is available, but no calibration dataset or conversion model has been accepted. | Define the calibration protocol, collect paired readings, choose the appropriate acoustic metric and weighting limitations, implement and validate the model. |
| INA3221 and solar battery charging | `100%` | The separate `ESP32-C3 SuperMini + INA3221` solar-charge and power-management controller has completed its full standalone test. | No standalone INA3221/solar work remains. Its later link to BSPRJ and shared-power validation are tracked as separate integration subsystems. |
| Communication between controllers | `85%` | UART power/GPS telemetry, WQTT/Telegram delivery, ACK/deduplication, saved GPS relay, and repeated `SLEEP/SACK -> WAIT -> OK` recovery are physically proven. C3 build `205+` owns its Wi-Fi, bot, cloud delivery, and OTA; the Gateway/Service experiment is retired. Uploaded C3 build `207` and BS build `141`, powered-off wiring checks, one `C3 already awake` guard, three independent GPIO wake cycles, preserved timer wake, and post-wake `Link: OK / Data: Fresh / INA3221: OK` are physically proven without changing `/c3sts` or UART frames. | Keep scheduled-restart-during-`SLP`, controlled true missing-link behavior, physical cooldown timing, and STATUS reliability (`4/8` fresh, `4/8` bounded timeout) as explicit non-blocking acceptance debt during later long runs. |
| GPS and location/time context | `80%` | GPS is integrated and tested on C3 with manual Current/Fixed handling. Uploaded builds `134/195` physically relayed the saved FIX to a BS Google Maps card with `9` satellites, HDOP `2.4`, and truthful age. | Confirm diagnostic/WQTT evidence, decide final location refresh policy without adding unwanted automatic acquisition, and include the result in final system validation. |
| GSM/mobile connectivity | `0%` | Required future subsystem only. | Select/finalize the module and power path, implement connectivity and recovery, then validate network behavior and power demand. |
| Shared power and autonomous operation | `25%` | Battery operation and shared-power field behavior have been observed, and power-related gaps can be distinguished in logs. | Stabilize battery/charging contacts and transitions, prove operation with both controllers, manage GSM current peaks, and complete long autonomous testing. |
| Core firmware, logging, OTA, and health diagnostics | `80%` | Build `128` physically proved the bounded TSV v2 journal and rotation. Uploaded build `129` produced approximately `21 h` of parseable diagnostics, `127` analytical windows reconciled with Sheets, `GS_DROP=0`, and stable heap. Uploaded BS `135` / C3 `197` physically prove strict sleep acknowledgement and recovery; BS `141` / C3 `207` additionally prove dedicated hardware wake without regressing normal telemetry, INA3221, or timer wake. | Collect scheduled-restart-during-`SLP` evidence and improve STATUS reliability during later long runs; keep C3 Wi-Fi, bot, and OTA independently owned by C3. |
| Permanent assembly and end-to-end field validation | `10%` | Current breadboard system has accumulated useful field evidence inside the enclosure. | Replace temporary contacts where required, complete integrated assembly, weather/power validation, and final multi-day acceptance test. |

The overall estimate is now `57%`: standalone INA3221/solar work, routine C3-to-BS telemetry, C3-owned OTA, repeated sleep-handshake recovery, build-change notice, saved-GPS Maps output, and the dedicated BS-to-C3 GPIO wake path are physically proven. The controller-link subsystem rises to `85%`; remaining restart/missing-link/STATUS evidence is non-blocking debt for later long runs. dB calibration, GSM, integrated autonomous power, permanent assembly, and complete system validation remain substantial dependencies. The estimate is weighted rather than a simple average.
