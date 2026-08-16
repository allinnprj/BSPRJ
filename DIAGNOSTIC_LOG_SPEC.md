# WROOM Remote Diagnostic Log Specification

## Main Goal

Keep the balcony device diagnosable and OTA-serviceable without bringing it home. The remote journal must retain enough evidence to correlate WROOM, C3, network, cloud, sensor, and sound behavior while using bounded LittleFS space and modest Flash/RAM.

## Scope Boundary

- WROOM only. C3 build `185` and the UART frame protocol remain unchanged.
- `/sound_log.csv` remains the analytical ten-minute sound dataset.
- `/diagnostics.log` and `/diagnostics-prev.log` remain the fault/timing journal.
- Diagnostic sound values remain relative and must not be labelled as calibrated `dB`.

## Storage Contract

- Active file: `/diagnostics.log`.
- One rotated file: `/diagnostics-prev.log`.
- Maximum size: `128 KiB` per file, approximately `256 KiB` total.
- Required retention under representative balcony traffic: at least `96 hours`.
- Target average diagnostic growth: no more than `64 KiB/day`; preferred `48..56 KiB/day`.
- Rotation must preserve a continuous transition from the previous file to the active file.
- Files remain tab-separated text and must parse without malformed rows.

## Fixed TSV Schema v2

One header is written per file. Rows use fixed columns so field names are not repeated inside every `HEALTH` record.

```text
date	time	uptime_s	power_uptime_min	build	boot_seq	reset	event	time_state	wifi	ssid	wifi_pct	rssi_dbm	ip	wqtt	dc_ok	dc_fail	uart	c3_build	c3_session	c3_q	c3_age_s	c3_ok	c3_dup	c3_gap	ina	solar_mv	solar_ma	battery_mv	battery_ma	soc	load_mv	load_ma	charge	mode	now	hour	total	p2p	signal	temp_c	hum_pct	heap	min_heap	gs_queue	gs_ok	gs_fail	gs_drop	info
```

Empty fields are allowed when an event does not use a value. Tabs, carriage returns, and line feeds are forbidden inside a field.

## Periodic Record

`HEALTH` is written once per completed ten-minute interval, aligned with the analytical sound window. It includes:

- version/build, boot sequence, reset cause, runtime, and time-sync state;
- stable Wi-Fi SSID, signal, RSSI, IP, and actual WQTT state;
- Datacake, Google Sheets, UART, duplicate, sequence-gap, and offline counters;
- latest C3 build/session/sequence/age and INA3221 power values;
- relative sound now/hour/total/P2P/signal fields;
- SHT31 temperature/humidity availability;
- current and minimum free heap.

## Event Records

Always preserve these events immediately:

- `BOOT`, `OTA_START`, `OTA_OK`, `OTA_ERROR`, `RESTART`;
- `WIFI_LOST`, `WIFI_OK` with outage duration;
- `WQTT_LOST`, `WQTT_OK`;
- `UART_WAIT`, `UART_OK`, `UART_SLP`, `UART_OFF`;
- `C3_WAKE` for a new C3 session;
- `C3_CHANGE` when INA status, charge output, or control mode changes;
- `C3_DUP` for retransmission evidence;
- `C3_GAP` when a sequence jump proves missing accepted telemetry;
- `GS_RETRY`, `GS_OK`, `GS_DROP`;
- `SHT_LOST`, `SHT_OK`, `SHT_REINIT`.

Do not write every ordinary accepted `TEL` frame. The latest telemetry is preserved in `HEALTH`, `C3_WAKE`, relevant change/error records, and `UART_SLP`. Cumulative accepted/duplicate/gap counters preserve transport quality without producing a line every 30 seconds.

## State Semantics

- Wi-Fi transitions depend on the actual connected state, not temporary empty SSID/IP reads while still connected.
- `WIFI_LOST` starts an outage; `WIFI_OK` closes it and records `duration_s`.
- WQTT state reflects the real MQTT socket only.
- Datacake HTTP success/failure is tracked separately and must not make WQTT appear connected.
- Expected C3 Deep Sleep is `UART_SLP`, never `UART_OFF`.
- Sequence counters reset only for a new C3 session.

## Web Contract

The root page is intentionally minimal and generated only when requested. It shows:

- WROOM version/build and uptime;
- LittleFS used/free space;
- current and previous diagnostic file sizes;
- direct streaming downloads for `sound_log.csv`, current diagnostics, and previous diagnostics;
- archive and guarded clear actions;
- a clear note that complete analysis normally needs all three files.

Downloads must continue to use streaming; a complete file must never be loaded into a RAM `String`.

`Clear current sound log` affects only `/sound_log.csv`. `Clear ALL logs` removes analytical, archive, legacy, and both diagnostic files, then creates fresh v2 headers.

## Resource Acceptance Gates

- Static RAM must remain close to build `127` (`65,388` bytes); no more than `1 KiB` unexplained growth.
- Linked Flash should preferably not exceed build `127` (`1,348,931` bytes); any growth above `2 KiB` requires justification or trimming.
- OTA-slot reserve must remain above `220 KiB`.
- No large JSON document, compression library, or in-memory file bundle is allowed.
- Estimated retention from a representative short device run must be at least `96 hours`.

## Physical Acceptance Gates

Before `Clear ALL` and the final clean run:

- WROOM build `128` must upload by OTA and return online;
- one C3 sleep/wake cycle must show `UART_SLP -> UART_WAIT -> UART_OK` without false `UART_OFF`;
- one Google Sheets window must retry/deliver correctly;
- current diagnostics must download and parse correctly;
- actual growth rate must meet the retention target;
- C3 remains build `185` and requires no upload.
