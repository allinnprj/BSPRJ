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

## Status Topics

### `bs/devices/bs-esp32-01/status/online`

- Payload: `true` or `false`
- Meaning: device online state

### `bs/devices/bs-esp32-01/status/time_synced`

- Payload: `true` or `false`
- Meaning: whether NTP time is already synced

### `bs/devices/bs-esp32-01/status/wifi`

- Payload: text
- Meaning: Wi-Fi status text from firmware

### `bs/devices/bs-esp32-01/status/wifi_pct`

- Payload: number
- Unit: `%`
- Meaning: Wi-Fi signal percent

### `bs/devices/bs-esp32-01/status/ip`

- Payload: text
- Meaning: current device IP address

### `bs/devices/bs-esp32-01/status/json`

- Payload: JSON
- Meaning: compact status snapshot

Example JSON fields:

- `device`
- `online`
- `time_synced`
- `wifi`
- `wifi_pct`
- `rssi_dbm`
- `ip`
- `timestamp`

## Sound Topics

### `bs/devices/bs-esp32-01/sound/now_pct`

- Payload: number
- Unit: `%`
- Meaning: current relative sound level

### `bs/devices/bs-esp32-01/sound/hour_pct`

- Payload: number
- Unit: `%`
- Meaning: last-hour rolling average

### `bs/devices/bs-esp32-01/sound/mean_pct`

- Payload: number
- Unit: `%`
- Meaning: all-time mean since boot

### `bs/devices/bs-esp32-01/sound/signal`

- Payload: text
- Current values: `LOW`, `OK`, `CLIP`
- Meaning:
  - `LOW` = signal too weak
  - `OK` = normal working range
  - `CLIP` = overload or ADC limit reached

Note:

- If later you decide to rename these UI labels to something friendlier like `Silent`, `Normal`, `High`, this topic is the place to update in firmware and desktop clients.

### `bs/devices/bs-esp32-01/sound/json`

- Payload: JSON
- Meaning: compact sound snapshot

Example JSON fields:

- `now_pct`
- `hour_pct`
- `mean_pct`
- `signal`
- `current_period`
- `current_period_pct`
- `timestamp`

## Day-Part Topics

### `bs/devices/bs-esp32-01/period/current`

- Payload: `day`, `evening`, or `night`
- Meaning: current day-part

### `bs/devices/bs-esp32-01/period/current_pct`

- Payload: number
- Unit: `%`
- Meaning: mean for the current day-part

### `bs/devices/bs-esp32-01/period/day_pct`

- Payload: number
- Unit: `%`
- Meaning: mean for daytime

### `bs/devices/bs-esp32-01/period/evening_pct`

- Payload: number
- Unit: `%`
- Meaning: mean for evening

### `bs/devices/bs-esp32-01/period/night_pct`

- Payload: number
- Unit: `%`
- Meaning: mean for night

### `bs/devices/bs-esp32-01/period/json`

- Payload: JSON
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
- `bs/devices/bs-esp32-01/status/online`
- `bs/devices/bs-esp32-01/status/wifi_pct`
- `bs/devices/bs-esp32-01/period/current`
- `bs/devices/bs-esp32-01/period/current_pct`

If you want one compact feed instead, start with:

- `bs/devices/bs-esp32-01/status/json`
- `bs/devices/bs-esp32-01/sound/json`
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
