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

- Current whole-project readiness estimate: `60%`.

## Russian Report Block

Use this exact Russian format for full progress reviews and in new-chat status summaries:

```text
Готовность:
- Микрофон и механическая сборка: 80%
- Относительная статистика шума и классификация: 60%
- Реальная dB-калибровка: 75%
- INA3221 и солнечная зарядка: 100%
- Связь между контроллерами: 85%
- GPS и контекст места/времени: 80%
- GSM/мобильная связь: 0%
- Общее питание и автономная работа: 25%
- Основная прошивка, логи, OTA и диагностика: 80%
- Постоянная сборка и финальная полевая проверка: 10%
- Общая готовность проекта: 60%
```

| Subsystem | Readiness | Confirmed state | Main remaining work |
| --- | ---: | --- | --- |
| Microphone and mechanical assembly | `80%` | Protected external `INMP441` passed a multi-day build `109` field run with clear day-part separation and stable signal. Hardware geometry is accepted and will remain unchanged. | Controlled reference events and later confirmation that dB calibration works across the useful range. |
| Relative sound statistics and classification | `60%` | Clean logs support preliminary relative P2P thresholds and prior Sheets views, but T7 shows main-loop snapshots can be undersampled during HTTP waits. Manually uploaded build `157` and the deployed dB script implement approved trial `dB(A)` LEVEL boundaries (`56/62/66`), energetic daypart conclusions, and valid-minute coverage. T9 physically accepts a `15`-window short gate with exact refreshed summary, including natural NORMAL/LOUD/PEAK cases. The local task-107 candidate reduces User mode to `Summary`, `Measurements`, and `Charts` while preserving technical evidence. | Deploy and visually accept the three simplified Sheets views, then verify concise MQTT/Datacake/AppSheet consistency and check additional natural mixed/high-level cases during the later multi-day run. |
| Real dB calibration | `75%` | The frozen `a_slow_dbfs + 114.2 dB` model passed an independent build-152 session with 50 photo pairs. Across 45 stable pairs, bias was `-0.06 dB`, MAE `1.13 dB`, RMSE `1.43 dB`, and `84.4%` were within `±2 dB` over `53.2..65.9 dB(A)`. Uploaded build 153 is physically confirmed end to end. T4 exposed `9/148` overly strict blank dB windows. Uploaded builds 154 and 155 produced `135/135` T5 and `133/133` T6 populated dB windows. T7 confirms manually uploaded build 156 has `139/139` populated dB windows matching raw Sheets; all `23` retry windows had `100%` valid audio, zero faults, and zero clips. T9 confirms manually uploaded build `157` across `15/15` populated windows with `100%` valid audio, zero faults/clips, and matching dB summaries without changing the calibrated offset. A naturally low-quality `<95%` window remains unobserved, values below the reference-tested range remain estimates, and the `>=66 dB(A)` trial level still lacks a controlled reference event. | Visually accept the simplified final Sheets views, then complete the later seven-day sound acceptance run without changing the accepted offset or microphone mechanics. |
| INA3221 and solar battery charging | `100%` | The separate `ESP32-C3 SuperMini + INA3221` solar-charge and power-management controller has completed its full standalone test. | No standalone INA3221/solar work remains. Its later link to BSPRJ and shared-power validation are tracked as separate integration subsystems. |
| Communication between controllers | `85%` | UART power/GPS telemetry, WQTT/Telegram delivery, ACK/deduplication, saved GPS relay, and repeated `SLEEP/SACK -> WAIT -> OK` recovery are physically proven. C3 build `205+` owns its Wi-Fi, bot, cloud delivery, and OTA; the Gateway/Service experiment is retired. Uploaded C3 build `207` and BS build `141`, powered-off wiring checks, one `C3 already awake` guard, three independent GPIO wake cycles, preserved timer wake, and post-wake `Link: OK / Data: Fresh / INA3221: OK` are physically proven without changing `/c3sts` or UART frames. | Keep scheduled-restart-during-`SLP`, controlled true missing-link behavior, physical cooldown timing, and STATUS reliability (`4/8` fresh, `4/8` bounded timeout) as explicit non-blocking acceptance debt during later long runs. |
| GPS and location/time context | `80%` | GPS is integrated and tested on C3 with manual Current/Fixed handling. Uploaded builds `134/195` physically relayed the saved FIX to a BS Google Maps card with `9` satellites, HDOP `2.4`, and truthful age. | Confirm diagnostic/WQTT evidence, decide final location refresh policy without adding unwanted automatic acquisition, and include the result in final system validation. |
| GSM/mobile connectivity | `0%` | Required future subsystem only. | Select/finalize the module and power path, implement connectivity and recovery, then validate network behavior and power demand. |
| Shared power and autonomous operation | `25%` | Battery operation and shared-power field behavior have been observed, and power-related gaps can be distinguished in logs. | Stabilize battery/charging contacts and transitions, prove operation with both controllers, manage GSM current peaks, and complete long autonomous testing. |
| Core firmware, logging, OTA, and health diagnostics | `80%` | Build `128` physically proved the bounded TSV v2 journal and rotation. T4/T5/T6/T7 show continuous windows, stable heap, `GS_DROP=0`, and exact local-to-Sheets equality. Build 155 exposed repeated Google Sheets client `HTTP -11 read Timeout`; manually uploaded build 156 bounds the read wait to `12 s` and T7 reduces equal-length retry windows from `114` to `23`, with all `139` rows delivered. Lower `SAMPLES` during retries counts main-loop snapshots; the I2S dB energy capture runs in a separate task. T9 physically accepts manually uploaded build `157` across `15` consecutive windows with dB-based LEVEL, exact refreshed summary, and `GS_DROP=0`. Uploaded BS `135` / C3 `197` physically prove strict sleep acknowledgement and recovery; BS `141` / C3 `207` additionally prove dedicated hardware wake. | Deploy and visually verify the task-107 Sheets presentation; collect scheduled-restart-during-`SLP` evidence and improve STATUS reliability during later long runs while keeping C3 Wi-Fi, bot, and OTA independently owned by C3. |
| Permanent assembly and end-to-end field validation | `10%` | Current breadboard system has accumulated useful field evidence inside the enclosure. | Replace temporary contacts where required, complete integrated assembly, weather/power validation, and final multi-day acceptance test. |

The overall estimate remains `60%`: T9 physically accepts build 157's short dB-based LEVEL and summary gate, while the task-107 simplified `Summary / Measurements / Charts` interface is locally validated but not yet deployed or visually accepted in the live workbook. Concise MQTT/Datacake/AppSheet consistency, cleanup task `108`, and the final seven-day sound run remain open. The lower main-loop snapshot cadence during HTTP retries is a caveat for legacy relative statistics, not direct evidence of lost raw dB capture. The accepted A16/SLOW offset, standalone INA3221/solar work, routine C3-to-BS telemetry, C3-owned OTA, sleep-handshake recovery, saved-GPS Maps output, and BS-to-C3 hardware wake remain intact. GSM, integrated autonomous power, permanent assembly, wider dB validation, and complete system validation remain substantial dependencies. The estimate is weighted rather than a simple average.
