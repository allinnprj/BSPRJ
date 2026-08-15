# C3-WROOM UART Protocol

## Scope

This is the canonical application protocol for the short 3.3 V UART link between the autonomous ESP32-C3 power controller and the BSPRJ ESP32-WROOM network gateway.

- Transport: `115200 8N1`.
- Line ending: `LF`; optional incoming `CR` is ignored.
- Encoding: printable ASCII only.
- Maximum accepted WROOM line length: 159 characters plus terminator.
- Every frame is parsed strictly. Unknown, malformed, out-of-range, boot-ROM, or truncated lines are ignored.
- Current protocol stage transports diagnostics only. It does not yet publish C3 data to WROOM cloud services or execute remote power commands.

## Heartbeat

WROOM request:

```text
PING <sequence>
```

C3 response:

```text
PONG <sequence> C3 <build>
```

WROOM accepts only the currently pending sequence. Three consecutive 10-second response timeouts produce unexpected state `OFF`.

## Planned Deep Sleep

C3 announcement:

```text
SLEEP <seconds> C3 <build>
```

Rules:

- C3 sends and flushes the frame only after sleep cancellation checks pass.
- WROOM accepts `1..86400` seconds, changes state to `SLP`, and pauses PING traffic.
- At the declared boundary WROOM changes to wake-wait state and resumes PING.
- Loss without a valid `SLEEP` frame remains an unexpected `OFF` condition.

## Power Telemetry v1

C3 data frame:

```text
TEL <session> <sequence> <valid> <solar_mV> <solar_mA> <battery_mV> <battery_mA> <load_mV> <load_mA> <soc_pct> <charge> <mode>
```

WROOM acknowledgement:

```text
ACK <session> <sequence>
```

Field contract:

| Field | Meaning |
| --- | --- |
| `session` | Non-zero random 32-bit identifier generated on every C3 boot/wake. |
| `sequence` | Non-zero monotonically increasing frame number inside one session. |
| `valid` | `1` when all three INA3221 channels were read successfully, otherwise `0`. |
| `solar_mV`, `battery_mV`, `load_mV` | Signed millivolts; accepted range `-5000..100000`. |
| `solar_mA`, `battery_mA`, `load_mA` | Signed milliamps; accepted range `-100000..100000`. Battery current keeps the C3 sign convention. |
| `soc_pct` | Existing voltage-only approximate AGM SOC, `0..100`; not a precision coulomb-counted SOC. |
| `charge` | `0=OFF`, `1=ON` for the C3 GPIO3 charge output. |
| `mode` | `0=Classic`, `1=Smart Auto`, `2=reserved legacy Manual`. |

Reliability rules:

- C3 keeps one unacknowledged frame at a time.
- ACK timeout is 2 seconds.
- C3 retries the identical frame up to three times after the first transmission, then drops it; a later 30-second sample uses a new sequence.
- WROOM acknowledges every valid frame, including a duplicate.
- Duplicate identity is the pair `(session, sequence)`.
- A duplicate is re-acknowledged but is not stored or logged as new telemetry.
- Telemetry is sampled approximately every 30 seconds while C3 is awake and outside its protected post-wake recovery window.

## Current Acceptance Gates

- Heartbeat and bidirectional wiring: passed physically.
- Planned sleep `OK -> SLP -> WAIT -> OK`: passed physically on WROOM build 118 and C3 build 184.
- Telemetry `TEL -> ACK`, increasing sequence, and real INA3221 values: passed physically on WROOM build 119 and C3 build 185 (`q=5` through `q=11`, INA `OK`, consistent power/state fields).
- Forced ACK-loss retry/deduplication injection: deferred; source/build validation and nominal ACK transport are accepted for the next stage.
- WQTT cloud forwarding through WROOM: passed physically on WROOM build 120 and C3 build 185 (`q=2` and `q=9` published successfully).
- Remaining cloud services, commands, command ACK, authorization, and safe command failure: later stages.

## WROOM MQTT Gateway Stage

WROOM build 120 publishes each newly accepted UART telemetry frame to the existing WQTT broker as one retained JSON message:

```text
bs/devices/<DEVICE_ID>/controller/c3/telemetry
```

Payload contract:

```json
{
  "session": 123,
  "sequence": 11,
  "ina": "ok",
  "solar": {"voltage_v": 0.992, "current_a": 0.000},
  "battery": {"voltage_v": 12.304, "current_a": 0.100, "soc_pct": 60},
  "load": {"voltage_v": 7.144, "current_a": 0.160},
  "charge": "off",
  "mode": "classic"
}
```

Gateway rules:

- The MQTT message is retained.
- Successful cloud deduplication key is `(session, sequence)`.
- A successfully published frame is never intentionally republished during the same WROOM runtime.
- A failed MQTT publish is retried at most once every 5 seconds until a newer UART snapshot replaces it or publication succeeds.
- Existing sound MQTT topics and Datacake fields are unchanged.
- Datacake, Telegram, and Google Sheets forwarding are not part of build 120.
- Physical acceptance requires `[MQTT] C3 telemetry -> q=<sequence> OK` for an already accepted `TEL ACK` sequence.

Physical acceptance passed on 2026-08-15:

- WROOM startup card: `0.1.66-EXP build 120`.
- C3 link: `ONLINE -> C3 build 185`.
- Successful retained WQTT publications: increasing sequences `q=2` and `q=9`.
- Duplicate evidence: repeated UART `q=6` frames were logged as `TEL DUP` and re-ACKed instead of being stored as new telemetry.

## WROOM Telegram Read-only Status Stage

WROOM build 121 adds one separate `C3 Controller` Telegram card after the normal WROOM online alert and the first accepted C3 telemetry frame of that WROOM boot.

Card contract:

- Same WROOM Telegram bot and configured chat; no second bot.
- One card per WROOM boot after telemetry becomes available.
- Read-only fields: UART state, C3 build, sequence, age, INA health, Solar/Battery/Load measurements, SOC, Charge, and mode.
- A failed card send is retried no faster than every 30 seconds.
- No Telegram polling, command handling, C3 wake request, or control action.
- C3 build 185, UART framing, Deep Sleep, WQTT, Datacake, Google Sheets, and local logging remain unchanged.
- Physical acceptance requires the Telegram `C3 Controller` card plus `[TG] C3 POST -> 200` and `[TG] sent -> C3 Controller` on WROOM build 121.

Physical acceptance passed on 2026-08-15:

- WROOM Telegram startup card: `0.1.67-EXP build 121`.
- Telegram API and device log: `[TG] C3 POST -> 200`, then `[TG] sent -> C3 Controller`.
- Rendered card: Link `OK`, C3 build `185`, fresh `q=5` telemetry at age `19 s`, INA3221 `OK`, all Solar/Battery/Load fields visible, Charge `OFF`, and mode `Classic`.
- No truncation or layout defect was visible in the user-provided screenshot.

## WROOM Telegram Read-only Command Input

WROOM build 124 accepts only one incoming Telegram command. Builds 122/123 used the longer historical spelling `/c3_status`; it is intentionally replaced, not retained as an alias:

```text
/c3sts
```

Command contract:

- The command is handled entirely by WROOM and returns its latest local C3 link/telemetry snapshot.
- Only the configured `TELEGRAM_CHAT_ID` is accepted.
- Update age must be `-30..120` seconds relative to synchronized WROOM time.
- Telegram `update_id` is persisted in NVS and never intentionally processed twice.
- Poll interval is 60 seconds; non-long-polling HTTP and TLS are limited to 4 seconds.
- Initial synchronization looks at only the last 10 updates, preventing an unlimited historical backlog.
- If NVS persistence is unavailable, command polling stays disabled.
- If C3 telemetry has not arrived, the reply says `Waiting for C3`.
- No UART command, C3 wake, Wi-Fi/OTA control, Deep-Sleep change, or C3 firmware change exists in this stage.

Build 124 physical acceptance requires:

- WROOM startup card `0.1.70-EXP build 124` after a full flash erase and manual USB upload.
- Startup log `[TG] commands ready -> /c3sts poll=60s last_update=0` on the first clean boot.
- A fresh authorized `/c3sts` returns the `C3 Controller` card and logs `[TG] command /c3sts -> OK`.
- The removed `/c3_status` spelling produces no command reply.
- After a later WROOM restart, the already consumed Telegram update must not produce another `[TG] command /c3sts -> OK` or a second command reply. The normal one-per-boot automatic `C3 Controller` card is expected and is not a replay.

## WROOM Telegram Scheduling Hardening

Build 122 physical evidence confirmed command correctness but exposed an unacceptable synchronous-network stall during clustered startup/status messages. WROOM build 123 therefore adds these scheduling rules:

- Every Telegram TLS handshake, TCP/HTTP connect, and HTTP response is bounded to 4 seconds.
- Successful Telegram messages are separated by at least 5 seconds.
- Timing is recalculated with current `millis()` after every network operation.
- Device Online and the automatic C3 card cannot be sent in the same loop.
- Multiple `/c3_status` updates in one poll are persisted and coalesced into one reply.
- The command reply is queued for a later loop at least 5 seconds after `getUpdates`.
- A failed queued reply retries no faster than every 30 seconds and expires after 120 seconds.
- No UART command or C3 firmware change is introduced.

Build 123 physical acceptance requires:

- Device Online and the automatic C3 card both arrive, separated by at least 5 seconds.
- Regular `[STAT]` output continues without the approximately 71-second startup gap seen on build 122.
- Startup Telegram activity does not produce UART RTT above the 10-second heartbeat timeout or repeated telemetry caused by a delayed ACK.
- Two fresh `/c3_status` messages before one poll produce `command coalesced`, one queued reply, and one returned card.
- A consumed command does not execute again after WROOM restart.

## WROOM Short Command and Full-Erase Gate

Build 124 changes only the user-facing read-only Telegram spelling from `/c3_status` to `/c3sts`. Before its first USB upload, erase the complete WROOM flash. The erase intentionally clears the previous application, LittleFS `/sound_log.csv`, and NVS namespaces such as the persisted Telegram update identifier. C3 build 185 and the physical UART link remain untouched.

After the erase, manual USB upload, and clean boot, validate `/c3sts` coalescing and no-replay behavior again because NVS starts empty.
