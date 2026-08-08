# AGENTS.local

## Local Workspace Notes

- Workspace mode: local disposable test project
- Current PlatformIO environment: `esp32dev`
- Current monitor speed: `115200`
- Serial port may change after switching boards; detect it fresh before upload/monitor.
- Git metadata is intentionally stored outside the Google Drive-synchronized project at `D:\GitMetadata\BSPRJ.git`; `D:\DEV\BSPRJ\.git` is a relative gitdir pointer. Do not replace it with a synced `.git` directory.
- Each additional Windows workstation needs its own local `D:\GitMetadata\BSPRJ.git` before using Git in the Drive-synchronized working tree.

## Local Validation

- Build: `pio run`
- Monitor example: `pio device monitor -e esp32dev -b 115200`
