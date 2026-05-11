# MQTT Topics For PC

Quick reference for subscribing to the firmware MQTT feed from a Windows computer.

Important:

- This file describes the `WQTT` MQTT topics published by the firmware.
- Do not copy broker credentials into this file. Read them from `include/secrets.h` locally.
- Topic root depends on `DEVICE_ID`.

Current device id:

- `bs-esp32-01`

Current topic root:

- `bs/devices/bs-esp32-01`

## Shared Percent Scale

Use this shared 4-step scale for all `%` topics in this project:

- Min payload: `0`
- Max payload: `100`
- Unit: `%`

Recommended practical preset:

- Zone borders:
  - `0..20` = Very Low
  - `21..40` = Low
  - `41..60` = Medium
  - `61..100` = High / Very High

Recommended `MqttDesk` fields:

- `From`: `20`
- `To`: `40`
- `To`: `60`
- `Till`: `100`

Recommended colors:

- Start color: red
- Mid color: yellow
- End color: green

Percent topics that use this scale:

- `bs/devices/bs-esp32-01/status/wifi_pct`
- `bs/devices/bs-esp32-01/sound/now_pct`
- `bs/devices/bs-esp32-01/sound/hour_pct`
- `bs/devices/bs-esp32-01/sound/mean_pct`
- `bs/devices/bs-esp32-01/period/current_pct`
- `bs/devices/bs-esp32-01/period/day_pct`
- `bs/devices/bs-esp32-01/period/evening_pct`
- `bs/devices/bs-esp32-01/period/night_pct`

## Status Topics

### `bs/devices/bs-esp32-01/status/online`

- Payload: `true` or `false`
- Min: `false`
- Max: `true`
- Meaning: device online state

### `bs/devices/bs-esp32-01/status/time_synced`

- Payload: `true` or `false`
- Min: `false`
- Max: `true`
- Meaning: whether NTP time is already synced

### `bs/devices/bs-esp32-01/status/wifi`

- Payload: text
- Min: not applicable
- Max: not applicable
- Meaning: Wi-Fi status text from firmware

### `bs/devices/bs-esp32-01/status/wifi_pct`

- Payload: number
- Unit: `%`
- Min: `0`
- Max: `100`
- 4-step scale:
  - `0..20` = Very Low
  - `21..40` = Low
  - `41..60` = Medium
  - `61..100` = High / Very High
- Meaning: Wi-Fi signal percent

### `bs/devices/bs-esp32-01/status/ip`

- Payload: text
- Min: not applicable
- Max: not applicable
- Meaning: current device IP address

### `bs/devices/bs-esp32-01/status/json`

- Payload: JSON
- Min: not applicable
- Max: not applicable
- Meaning: compact status snapshot

Example JSON fields:

- `device`
- `online`
- `time_synced`
- `wifi`
- `wifi_pct`
- `rssi_dbm`
- `ip`
- `environment_available`
- `temperature_c`
- `humidity_pct`
- `timestamp`

## Sound Topics

### `bs/devices/bs-esp32-01/sound/now_pct`

- Payload: number
- Unit: `%`
- Min: `0`
- Max: `100`
- 4-step scale:
  - `0..20` = Very Low
  - `21..40` = Low
  - `41..60` = Medium
  - `61..100` = High / Very High
- Meaning: current relative sound level

### `bs/devices/bs-esp32-01/sound/hour_pct`

- Payload: number
- Unit: `%`
- Min: `0`
- Max: `100`
- 4-step scale:
  - `0..20` = Very Low
  - `21..40` = Low
  - `41..60` = Medium
  - `61..100` = High / Very High
- Meaning: last-hour rolling average

### `bs/devices/bs-esp32-01/sound/mean_pct`

- Payload: number
- Unit: `%`
- Min: `0`
- Max: `100`
- 4-step scale:
  - `0..20` = Very Low
  - `21..40` = Low
  - `41..60` = Medium
  - `61..100` = High / Very High
- Meaning: all-time mean since boot

### `bs/devices/bs-esp32-01/sound/signal`

- Payload: text
- Min: `SILENT`
- Max: `PEAK`
- Current values: `SILENT`, `NORMAL`, `LOUD`, `PEAK`
- Meaning:
  - `SILENT` = `0..20`
  - `NORMAL` = `21..40`
  - `LOUD` = `41..60`
  - `PEAK` = `61..100`

Note:

- This MQTT topic is intentionally more user-facing than the internal diagnostic `LOW / OK / CLIP` logic used elsewhere.

### `bs/devices/bs-esp32-01/sound/json`

- Payload: JSON
- Min: not applicable
- Max: not applicable
- Meaning: compact sound snapshot

Example JSON fields:

- `now_pct`
- `hour_pct`
- `mean_pct`
- `signal`
- `current_period`
- `current_period_pct`
- `environment_available`
- `temperature_c`
- `humidity_pct`
- `timestamp`

## Environment Topics

### `bs/devices/bs-esp32-01/environment/temperature_c`

- Payload: number
- Unit: `C`
- Min: project/environment dependent
- Max: project/environment dependent
- Meaning: current temperature from `SHT31`

### `bs/devices/bs-esp32-01/environment/humidity_pct`

- Payload: number
- Unit: `%`
- Min: `0`
- Max: `100`
- Meaning: current relative humidity from `SHT31`

### `bs/devices/bs-esp32-01/environment/json`

- Payload: JSON
- Min: not applicable
- Max: not applicable
- Meaning: compact environment snapshot

Example JSON fields:

- `temperature_c`
- `humidity_pct`
- `timestamp`

## Day-Part Topics

### `bs/devices/bs-esp32-01/period/current`

- Payload: `day`, `evening`, or `night`
- Min: `day`
- Max: `night`
- Meaning: current day-part

### `bs/devices/bs-esp32-01/period/current_pct`

- Payload: number
- Unit: `%`
- Min: `0`
- Max: `100`
- 4-step scale:
  - `0..20` = Very Low
  - `21..40` = Low
  - `41..60` = Medium
  - `61..100` = High / Very High
- Meaning: mean for the current day-part

### `bs/devices/bs-esp32-01/period/day_pct`

- Payload: number
- Unit: `%`
- Min: `0`
- Max: `100`
- 4-step scale:
  - `0..20` = Very Low
  - `21..40` = Low
  - `41..60` = Medium
  - `61..100` = High / Very High
- Meaning: mean for daytime

### `bs/devices/bs-esp32-01/period/evening_pct`

- Payload: number
- Unit: `%`
- Min: `0`
- Max: `100`
- 4-step scale:
  - `0..20` = Very Low
  - `21..40` = Low
  - `41..60` = Medium
  - `61..100` = High / Very High
- Meaning: mean for evening

### `bs/devices/bs-esp32-01/period/night_pct`

- Payload: number
- Unit: `%`
- Min: `0`
- Max: `100`
- 4-step scale:
  - `0..20` = Very Low
  - `21..40` = Low
  - `41..60` = Medium
  - `61..100` = High / Very High
- Meaning: mean for night

### `bs/devices/bs-esp32-01/period/json`

- Payload: JSON
- Min: not applicable
- Max: not applicable
- Meaning: compact day-part snapshot

Example JSON fields:

- `day_pct`
- `evening_pct`
- `night_pct`
- `time_synced`
- `timestamp`

## Good First Subscriptions

If you want a minimal live setup on PC, start with:

- `bs/devices/bs-esp32-01/sound/now_pct`
- `bs/devices/bs-esp32-01/sound/hour_pct`
- `bs/devices/bs-esp32-01/sound/mean_pct`
- `bs/devices/bs-esp32-01/sound/signal`
- `bs/devices/bs-esp32-01/environment/temperature_c`
- `bs/devices/bs-esp32-01/environment/humidity_pct`
- `bs/devices/bs-esp32-01/status/online`
- `bs/devices/bs-esp32-01/status/wifi_pct`
- `bs/devices/bs-esp32-01/period/current`
- `bs/devices/bs-esp32-01/period/current_pct`

If you want one compact feed instead, start with:

- `bs/devices/bs-esp32-01/status/json`
- `bs/devices/bs-esp32-01/sound/json`
- `bs/devices/bs-esp32-01/environment/json`
- `bs/devices/bs-esp32-01/period/json`

## Topic Wildcards

Subscribe to the whole device:

- `bs/devices/bs-esp32-01/#`

Subscribe only to sound:

- `bs/devices/bs-esp32-01/sound/#`

Subscribe only to status:

- `bs/devices/bs-esp32-01/status/#`

Subscribe only to day-part metrics:

- `bs/devices/bs-esp32-01/period/#`

## Example Commands

Examples below use `mosquitto_sub` on Windows.

Subscribe to everything for this device:

```powershell
mosquitto_sub -h <MQTT_HOST> -p <MQTT_PORT> -u <MQTT_USER> -P <MQTT_PASSWORD> -t "bs/devices/bs-esp32-01/#" -v
```

Subscribe only to sound metrics:

```powershell
mosquitto_sub -h <MQTT_HOST> -p <MQTT_PORT> -u <MQTT_USER> -P <MQTT_PASSWORD> -t "bs/devices/bs-esp32-01/sound/#" -v
```

Subscribe only to JSON summaries:

```powershell
mosquitto_sub -h <MQTT_HOST> -p <MQTT_PORT> -u <MQTT_USER> -P <MQTT_PASSWORD> -t "bs/devices/bs-esp32-01/+/json" -v
```
