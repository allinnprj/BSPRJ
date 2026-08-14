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
- Cloud forwarding, commands, command ACK, authorization, and safe command failure: later stages.
