# C3-WROOM UART Protocol

## Scope

This is the canonical application protocol for the short 3.3 V UART link between the autonomous ESP32-C3 power controller and the BSPRJ ESP32-WROOM network gateway.

Canonical controller names in user-facing discussion and project status are:

- `BS`: the main BSPRJ ESP32-WROOM-32U noise, network, logging, and gateway controller.
- `C3`: the autonomous ESP32-C3 SuperMini INA3221, Solar Control, GPS, and sleep controller.
- Use `WROOM` or `SuperMini` only when a hardware-specific distinction is required. Existing device IDs, filenames, class names, and wire labels remain unchanged.

- Transport: `115200 8N1`.
- Line ending: `LF`; optional incoming `CR` is ignored.
- Encoding: printable ASCII only.
- Maximum accepted WROOM input line length: 159 characters plus terminator.
- Maximum accepted C3 input line length remains 47 printable characters plus terminator.
- Every frame is parsed strictly. Unknown, malformed, out-of-range, boot-ROM, or truncated lines are ignored.
- The receive-only telemetry/gateway baseline is accepted for continued development. WQTT forwarding and the read-only Telegram C3 card are physically proven.
- The bounded BS-to-C3 command envelope is specified below. Uploaded BS build `130` implements the dormant persistent sender/queue and strict `CACK/CRES` receiver; uploaded C3 build `192` implements only the strict persistent `STATUS 0` executor and fresh ordinary telemetry request. Local BS build `131` connects the existing authorized `/c3sts` as the first caller; it is not uploaded yet.

## Heartbeat

WROOM request:

```text
PING <sequence>
```

C3 response:

```text
PONG <sequence> C3 <build>
```

WROOM accepts only the currently pending `PONG` sequence. A strictly parsed `PONG`, `TEL`, or `SLEEP` frame counts as valid C3 activity. Three consecutive 10-second `PONG` response timeouts plus 90 seconds without any valid C3 frame change an online link to `WAIT`; a real unexpected `OFF` requires 240 seconds without valid C3 activity. This prevents a busy but actively transmitting C3 from being reported offline. A valid frame restores a waiting or offline link immediately.

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
- C3 build 191 sleep framing: two live `SLEEP` announcements (`600 s` and `5400 s`) were recorded on 2026-08-22. The `600 s` cycle completed through `SLP -> WAIT -> OK`; the `5400 s` sleep was still active at the captured boundary. The journal snapshot had `UART_SLP=2`, `UART_WAIT=2`, `UART_OK=2`, `C3_GAP=0`, and `UART_OFF=0`. Longer evidence and the scheduled-WROOM-restart-during-`SLP` case continue in parallel and do not block command-contract design.
- The evidence status and remaining physical gates are maintained in `CONTROLLER_LINK_ACCEPTANCE.md`.
- Commands, command ACK/result, authorization, and safe command failure are later implementation/acceptance stages.

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

## WROOM Wi-Fi Context in Telegram Cards

WROOM build 125 adds the active WROOM Wi-Fi context to the `Device Online`, `Wi-Fi Restored`, and `C3 Controller` Telegram cards:

```text
Wi-Fi: 92% (-54 dBm) NKAANNE_plus
```

- Signal percent, RSSI, and SSID all describe the WROOM connection used as the C3 internet gateway.
- The SSID is read from the current `WiFi.SSID()` connection and escaped for Telegram HTML.
- This does not report or enable C3 Wi-Fi and does not change the UART protocol or C3 build 185.
- Physical acceptance requires the line to appear in both the startup `Device Online` card and a `/c3sts` `C3 Controller` reply after manual WROOM build 125 upload.

## Bounded Command Protocol v1 - Specification Only

This section freezes the WROOM-to-C3 command contract. The receive-only frames above remain unchanged. Local, not-uploaded WROOM build 130 implements the persistent one-command sender and strict `CACK/CRES` receiver without a Telegram or automatic enqueue surface. Current C3 build 191 does not parse or execute `CMD`, so no command can complete or cause a C3 side effect yet.

### Design Boundaries

- WROOM remains the only network/Telegram gateway for UART commands.
- C3 remains autonomous for INA3221, Charge/GPIO3, Classic/Smart Auto, GPS, and Deep Sleep.
- One command may be outstanding at a time. There is no unbounded queue on either controller.
- WROOM cannot electrically wake a sleeping C3. A queued command waits for valid C3 activity or expires.
- No v1 command changes Charge, Solar Control mode, thresholds, Solar window, GPS schedule, or sleep duration.
- Command processing must not block `PING/PONG`, `TEL/ACK`, the sound loop, or the existing C3 autonomous control loop.

### Command Frame

WROOM request:

```text
CMD 1 <wroom_session> <command_sequence> <ttl_s> <command> <arg>
```

Example safe first-stage request:

```text
CMD 1 305419896 1 120 STATUS 0
```

Field contract:

| Field | Contract |
| --- | --- |
| `1` | Protocol version. Only exact decimal `1` is accepted. |
| `wroom_session` | Non-zero random 32-bit command epoch persisted by WROOM across ordinary restarts while commands are enabled. |
| `command_sequence` | Non-zero monotonically increasing 32-bit value inside one WROOM command epoch. |
| `ttl_s` | Remaining lifetime when the frame is first transmitted, `1..7200` seconds. It is not reset by retry. |
| `command` | Exact uppercase allowlisted token. Maximum 8 characters. |
| `arg` | One canonical unsigned decimal argument. `0` means no argument; leading zeroes are rejected except for the single token `0`. |

The complete line must contain no more than 47 printable ASCII characters before `LF`, so it fits the existing C3 input buffer. Incoming `CR` may be ignored. Spaces are single separators; leading/trailing spaces, tabs, extra fields, signs, quoting, and embedded whitespace are invalid.

### Allowlist and Staging

| Stage | Command | Argument | Effect | Initial state |
| --- | --- | --- | --- | --- |
| A | `STATUS` | exactly `0` | Execute a safe command round-trip and request a fresh ordinary telemetry publication. It changes no C3 state. | First and only command enabled in the initial implementation. |
| B | `OTA_ON` | `300..900` seconds | Enable the existing C3 Wi-Fi/OTA service for a bounded window, hold C3 awake for that window, then automatically disable Wi-Fi and return authority to the normal sleep plan. | Specified, disabled until STATUS acceptance passes. |
| C | `WIFI_OFF` | exactly `0` | End an active OTA window, report the result over UART, flush it, disable C3 Wi-Fi, and return to the normal autonomous plan. | Specified, disabled until OTA_ON acceptance passes. |
| D | `RESTART` | exactly `0` | Report `RESTARTING`, flush UART, wait the existing safe post-frame interval, then perform a software restart. | Specified, disabled until separately approved and tested. |

Any command not enabled for the current implementation stage is rejected. Charge/mode/GPIO3/GPS/sleep-setting commands are deliberately absent from this protocol version.

### Receipt and Result Frames

C3 durable receipt acknowledgement:

```text
CACK 1 <wroom_session> <command_sequence> NEW
CACK 1 <wroom_session> <command_sequence> DUP
```

Terminal result:

```text
CRES 1 <wroom_session> <command_sequence> <result> <actual>
```

Allowed result tokens:

| Result | Meaning |
| --- | --- |
| `OK` | Command executed and `actual` describes the real resulting state. |
| `EXPIRED` | TTL ended before a not-yet-started side effect; no side effect was executed. |
| `REJECTED` | Envelope was valid enough to identify the request, but version, command stage, argument, session, or sequence policy rejected it. |
| `BUSY` | A different accepted command is still pending; the new request was not stored or executed. |
| `FAILED` | Execution was attempted but the requested state could not be confirmed. |
| `STALE` | Sequence/session is older than the persisted accepted command epoch/high-water mark. |

`actual` is one printable token without spaces, maximum 48 characters. Initial canonical values are `STATUS`, `OTA_ON=<seconds>`, `WIFI_OFF`, `RESTARTING`, and `NONE`. A result must report observed state, not merely repeat requested state.

### Persistence and Exactly-Once Rules

- WROOM persists its command epoch, next sequence, and the complete single pending request before the first UART transmission.
- WROOM keeps the same `(wroom_session, command_sequence)`, TTL value, command, and argument for every retry.
- C3 validates the entire envelope before persistence or side effects.
- Before executing a new allowed command, C3 persists the command identity and `PENDING` state, then sends `CACK ... NEW`.
- A duplicate of the pending identity receives `CACK ... DUP` and does not repeat the side effect.
- A duplicate of the last terminal identity receives `CACK ... DUP` followed by the identical cached `CRES`; an already executed command never becomes `EXPIRED` merely because its result was lost.
- C3 persists the active WROOM command epoch, sequence high-water mark, pending/terminal state, and last terminal result. Lower sequences are `STALE` and never execute.
- A new WROOM command epoch is accepted only with sequence `1`, no command pending, and a different non-zero session. The immediately retired session remains rejected so a delayed old frame cannot reopen it.
- WROOM removes its persisted pending request only after a matching terminal `CRES` or a locally proven pre-transmission TTL expiry.
- A WROOM restart restores and retries the identical pending request. A C3 restart restores its pending/terminal record before accepting another command.

### TTL, Sleep, Retry, and Timing

- Queue age advances while C3 is `SLP`, `WAIT`, or `OFF`. WROOM never transmits a command whose TTL is already exhausted.
- The TTL placed in the first frame is the remaining queue lifetime at that moment. Every retry is byte-for-byte identical.
- No command frame is sent while WROOM has a valid declared C3 `SLP`; transmission starts only after valid wake activity restores the link.
- `CACK` timeout is 2 seconds. WROOM may make at most three identical retransmissions after the first send.
- After `CACK`, WROOM waits at most 15 seconds for `CRES`; recovery requests are identical command retransmissions, no faster than every 5 seconds and no more than three times.
- If a not-yet-started command expires on C3, C3 stores and returns `CRES ... EXPIRED NONE`.
- Commands that intentionally hold C3 awake, such as a future `OTA_ON`, must publish a terminal result immediately after the bounded window is established; they do not keep the command transaction pending for the whole window.

### Strict Rejection Rules

The following inputs are discarded without ACK and without side effects: non-printable bytes, overflow/truncation, missing or extra fields, bad separators, numeric overflow, zero session/sequence, TTL outside `1..7200`, non-canonical decimal arguments, and lines that do not begin with an exact known frame prefix.

A structurally complete `CMD` with a recognizable identity but an unsupported version, disabled/unknown command, invalid command-specific argument, stale session, or stale sequence receives one bounded `CRES ... REJECTED|STALE NONE`. Raw rejected input is never copied to Telegram or cloud logs.

### WROOM Lifecycle and Diagnostics

The user-visible command lifecycle is truthful and monotonic:

```text
Queued -> Waiting for C3 -> Accepted -> Executed
                              |             |
                              +-> Failed <--+
Queued/Waiting -> Expired
```

WROOM diagnostics record bounded metadata only: `CMD_QUEUE`, `CMD_TX`, `CMD_ACK`, `CMD_DUP`, `CMD_RESULT`, `CMD_RETRY`, `CMD_EXPIRE`, and `CMD_REJECT`, with session, sequence, command, attempt, age, and result. Tokens, chat identifiers, raw Telegram bodies, and arbitrary UART input are not logged.

### Implementation and Acceptance Order

1. Implement the persistent single-command sender/queue on WROOM, but expose no user command yet.
2. In the separately managed C3 project, implement only strict parsing, persistence, duplicate handling, and `STATUS 0`.
3. Pass parser/contract tests and both local firmware builds; do not upload automatically.
4. Manually upload C3 in its own VS Code project, then add the existing authorized BS `/c3sts` command as the minimal acceptance trigger; this avoids an otherwise untestable local sender and an unnecessary intermediate BS upload.
5. Build and manually upload BS once, then prove STATUS success, duplicate replay, TTL expiry, malformed rejection, and both-controller restart recovery with truthful `Queued/Waiting/Accepted/Executed/Failed/Expired` states.
6. Add `OTA_ON`, then `WIFI_OFF`, then `RESTART` as separate approved stages. Do not add Charge/mode control in this protocol version.

### Telegram Status Bridge

- `/c3sts` is the user-facing Telegram command; `STATUS 0` is its internal UART refresh mechanism, not a second Telegram command.
- If C3 is `OK`, BS queues one persisted `STATUS` request and sends one Telegram card after the terminal result. `EXECUTED` is shown as `Data: Fresh`; failed or expired refreshes remain truthful and use the last accepted telemetry as cached data.
- If C3 is `SLP`, `WAIT`, or `OFF`, BS does not enqueue `STATUS` because UART cannot wake C3. It replies with `Data: Cached` and preserves the telemetry age.
- `/bssts` is BS-local. It reports already available BS runtime values and a short C3 link summary without sending UART traffic or taking a new sensor measurement.
- Both commands accept the normal bot-name suffix and coalesce duplicate requests found in one Telegram poll.
