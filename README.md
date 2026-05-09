# BS Test WPM

Firmware playground for a clean `ESP32` restart with:

- `MAX9814` microphone amplifier as the current temporary analog source
- `SSD1306 128x64` OLED on I2C

## Status

- Type: local temporary test project
- Current version: `0.1.20-test`
- Current build: `21`
- GitHub flow: intentionally not used
- Planned future microphone: `INMP441`

## Goal

Build the project step by step from a clean ESP32 base:

- OLED text output
- microphone live level
- short-term and long-term sound statistics
- Wi-Fi and time modules only after the base runtime is stable

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
