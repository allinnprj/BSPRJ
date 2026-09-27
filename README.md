# BSPRJ

Main ESP32 noise-monitoring firmware project `BSPRJ`, with:

- `INMP441` microphone on `I2S` as the current audio source
- `SSD1306 128x64` OLED on I2C

## Status

- Type: main firmware project
- Current version: `0.1.93-EXP`
- Current build: `147`
- GitHub: `https://github.com/allinnprj/BSPRJ`
- Branch model: `main` = release/stable, `devlop` = test/development
- Active microphone path: `INMP441` on `I2S`

## Main Goal

The main goal of the project is to understand **when** noise is high or low and make that visible both as numeric averages and as human-readable noise levels.

The project should answer two practical questions:

- at what time of day it is usually noisy or quiet
- which kind of noise level is typical for that time of day

To do that, the project relies on two analysis axes:

- `DAY / EVENING / NIGHT` as time-of-day statistics
- `SILENT / NORMAL / LOUD / PEAK` as human-readable level interpretation

Long-term direction:

- grow from a local single-device prototype into a noise-monitoring system that can later scale further
- add a more honest audio path, geo context, cross-location comparison, anomaly detection, and mapping later
- keep the current core principle intact: first understand reliably **when** and **how much** noise is present, then expand the platform

Practical end goal:

- determine the average noise level for day, evening, and night
- understand which level is most typical for each period
- for example: night is usually `SILENT`, evening is usually `NORMAL`, day is usually `LOUD`

All future choices in code, MQTT, Datacake, display layout, and hardware should support that goal instead of collecting telemetry without a clear analytical purpose.

## Technical Goal Of The Current Stage

Continue the project from the validated ESP32 prototype base:

- OLED text output
- microphone live level
- short-term and long-term sound statistics
- Wi-Fi, time, logging, OTA, Telegram, Google Sheets, and health diagnostics are already part of the current validated base

At this stage the project is fully focused on `INMP441`, so the runtime reads digital `I2S` audio directly and treats this as the primary microphone path for further tuning and analytics work.

## Roadmap

### Now

- make the current `ESP32 + INMP441` prototype calm and predictable
- keep `DAY / EVENING / NIGHT` as the main time-of-day analysis
- keep `SILENT / NORMAL / LOUD / PEAK` as the main human-readable level set
- keep `MQTT` fast and convenient for `MqttDesk`
- keep `Datacake` as a lighter showcase-style cloud dashboard

### Next Stage

- remove the remaining startup lag
- enable level-2 soft power saving
- add more environment context with `SHT31` and `BH1750` if needed
- improve Google Sheets as an auxiliary observation log

### Current Hardware Focus

- stabilize the new `INMP441` digital audio path before any further audio hardware changes
- use `FNIRSI FDM01` as an external reference for validation and future calibration
- add `Neo-8M` for accurate time and, if useful later, location context
- add `SIM800L` as an additional communication path instead of the main telemetry path

### Smart Version

- determine the typical noise profile for day, evening, and night
- detect deviations from the usual profile
- highlight when noise is unusually high for the current time of day
- later improve dirty-signal and wind-noise filtering
- consider any ESP32-side neural approach only at the very end, if it turns out to be truly useful

## Current Behavior

The firmware currently shows relative sound-level values on the OLED:

- `Now` for the current level
- `H` for the rolling last-hour average
- `M` for the mean over all measured time since boot
- a warmup message until the hour window is actually filled

These values are relative levels, not calibrated `dB`.
Current firmware already includes Wi-Fi, wall-clock time sync, local logging, OTA serviceability, Telegram online alerts, Google Sheets diagnostics, and SHT31 health tracking.

## Build

```powershell
pio run
```

## Secrets

- Local credentials live in `include/secrets.h`
- `include/secrets.h` is ignored by Git
- Define a separate `WIFI_SETUP_AP_PASSWORD` there for the temporary setup AP; use `8..63` characters and do not reuse the normal Wi-Fi or OTA password

## Portable Wi-Fi Setup

1. While BS is running, hold the existing `GPIO27` button continuously.
2. After `2 s`, follow the `3 / 2 / 1` countdown on the OLED. Releasing before `5 s` cancels setup.
3. At `5 s`, connect to the protected `BS-Setup-XXXX` AP shown on the OLED and open `http://192.168.4.1/`.
4. Enter the new SSID/password and select `Test and save`.

The AP exists for at most `10 min`; the OLED shows its SSID, address, and remaining time or connection-test status. New credentials are stored only after a successful connection test. A failed test keeps the previous profile, and the compile-time `WIFI_SSID` / `WIFI_PASSWORD` profile remains the boot recovery path. The setup page and credential POST are restricted to the protected AP interface; normal LAN access keeps the log page.

Build `160` also opens the same AP automatically after `60 s` continuously
without Wi-Fi, or after `180 s` of repeated failed Internet checks while Wi-Fi
is connected. A low-priority worker tries Google's HTTP 204 endpoint and
Microsoft's exact connect-test response; either provider succeeding is enough.
An individual MQTT, Sheets, Telegram or Datacake failure does not trigger setup.
Checks run at most once per `30 s` and do not block the sound/control main loop.
Automatic setup keeps trying the existing network and closes on confirmed Internet
recovery. There is one automatic ten-minute window per outage to avoid permanent
AP/OLED battery drain; confirmed Internet recovery rearms it, and the button can
always reopen setup. DNS/probe blocking can make Internet unavailable to this
test even when a particular cloud service is reachable.

The AP password is local `WIFI_SETUP_AP_PASSWORD` in `include/secrets.h`
(separate from the target network password). Build `160` rejects an invalid
length at compile time instead of producing firmware with an unusable AP.

## Monitor

```powershell
pio device monitor -e esp32dev -b 115200
```
