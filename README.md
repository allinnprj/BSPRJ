# BS Test WPM

Firmware playground for a clean `ESP32` restart with:

- `MAX9814` microphone amplifier as the current temporary analog source
- `SSD1306 128x64` OLED on I2C

## Status

- Type: local temporary test project
- Current version: `0.1.37-EXP`
- Current build: `91`
- GitHub flow: intentionally not used
- Planned future microphone: `INMP441`

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

Build the project step by step from a clean ESP32 base:

- OLED text output
- microphone live level
- short-term and long-term sound statistics
- Wi-Fi and time modules only after the base runtime is stable

At this stage `MAX9814` is used as a convenient experimental signal source so the project structure, telemetry, display logic, statistics, and likely pitfalls can be understood before switching to a more serious audio path.

## Roadmap

### Now

- make the current `ESP32 + MAX9814` prototype calm and predictable
- keep `DAY / EVENING / NIGHT` as the main time-of-day analysis
- keep `SILENT / NORMAL / LOUD / PEAK` as the main human-readable level set
- keep `MQTT` fast and convenient for `MqttDesk`
- keep `Datacake` as a lighter showcase-style cloud dashboard

### Next Stage

- remove the remaining startup lag
- enable level-2 soft power saving
- add more environment context with `SHT31` and `BH1750` if needed
- improve Google Sheets as an auxiliary observation log

### After New Hardware Arrives

- move from `MAX9814` to `INMP441` as the main audio source
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
This restart intentionally leaves Wi-Fi and wall-clock time out of the active runtime until the new base is stable.

## Build

```powershell
pio run
```

## Secrets

- Local credentials live in `include/secrets.h`
- `include/secrets.h` is ignored by Git

## Monitor

```powershell
pio device monitor -e esp32dev -b 115200
```
