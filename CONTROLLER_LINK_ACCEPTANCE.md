# Controller Link Acceptance Evidence

## Purpose

This is the compact evidence ledger for the physical `ESP32-WROOM-32U <-> ESP32-C3 SuperMini` UART link. It separates an accepted development baseline from final field proof so long-running or rare events do not unnecessarily block the next implementation stage.

Status meanings:

- `PASSED`: sufficient physical evidence exists for the stated contract.
- `PARTIAL`: correct evidence exists, but more natural cycles are still useful.
- `PENDING`: no conclusive physical event has been captured yet.
- `DEFERRED`: intentionally moved to a later safe test stage.
- `SPECIFIED`: the reviewed contract exists, but firmware implementation has not started.
- `LOCAL`: source and local contract checks exist, but no device proof has been performed.
- `NOT STARTED`: the related implementation does not exist yet.

## Evidence Ledger

| Contract | Status | Current evidence | What still closes it | Blocks next design stage |
| --- | --- | --- | --- | --- |
| Short protected UART wiring and `115200 8N1` | `PASSED` | Physical wiring, heartbeat, telemetry, and ACK traffic are stable. | Nothing. | No |
| Strict receive-only parsing | `PASSED` | `PING/PONG`, `SLEEP`, `TEL/ACK`, duplicate re-ACK, and session/sequence behavior are physically exercised; strict invalid-line rejection is enforced by the accepted parser contract. | Keep as a regression invariant. | No |
| Real C3 power telemetry through WROOM | `PASSED` | INA3221 Solar/Battery/Load, SOC, Charge, and mode reached WROOM, WQTT, and Telegram. | Nothing for the receive-only baseline. | No |
| Ordinary planned sleep recovery | `PASSED` | Repeated earlier `SLP -> WAIT -> OK`; build 191 added two live announcements on 2026-08-22. The `600 s` cycle completed through `WAIT -> OK`; the `5400 s` sleep was still active at the captured journal boundary. | Keep watching during normal logs. | No |
| Universal build-191 sleep announcement | `PARTIAL` | Current build-191 journal: `UART_SLP=2`, `UART_WAIT=2`, `UART_OK=2`, `UART_OFF=0`, maximum `C3_GAP=0`. | Accumulate a 24-48 h run with multiple Classic/Smart Auto sleep cycles and no increase of `C3_GAP`. | No |
| WROOM scheduled restart while C3 remains in declared `SLP` | `PENDING` | Source/build contract stores remaining C3 sleep in RTC before the scheduled software restart. | Capture `UART_SLP -> SCHEDULED_RESTART -> SOFT boot/restored SLP -> WAIT -> OK` in the rotating diagnostic pair. | No; required before final link acceptance |
| True missing-link detection | `DEFERRED` | WROOM build 129 uses `WAIT` after 90 s and `OFF` after 240 s without valid activity. | Safe controlled disconnection with power removed, or a separately agreed non-destructive fault-injection mode. | No; required before final link acceptance |
| Bounded BS-to-C3 command envelope | `LOCAL` | Uploaded BS build `130` contains the persisted dormant STATUS sender; uploaded C3 build `192` contains only the strict persistent `STATUS 0` executor. Local BS build `131` connects the authorized `/c3sts` only when C3 is `OK`, labels successful fresh results, and preserves cached replies during `SLP/WAIT/OFF`. Focused local contract checks pass; build-131 device proof remains open. | Manually upload BS `131`, then prove one awake fresh result and one sleeping cached result before broader command work. | No |
| Exactly-once command lifecycle | `LOCAL` | Both uploaded halves persist command identity/state before acknowledgement or completion, but the deployed BS build has no caller. Local BS build `131` adds the first bounded caller and clears a terminal record only after the Telegram result is delivered. | Prove persistence, identical retry, duplicate replay, TTL expiry, actual-state result, and recovery across either controller restart on the physical pair. | Yes, before remote-control acceptance |
| Temporary C3 Wi-Fi/OTA window | `NOT STARTED` | Current C3 still manages its own Wi-Fi. | Implement only after safe `STATUS` command acceptance; prove timeout, automatic Wi-Fi OFF, and USB recovery. | No for STATUS; yes before normal C3 Wi-Fi is disabled |

## Long-run Collection Rules

- Keep both controllers powered and do not clear `diagnostics.log` or `diagnostics-prev.log` during the run.
- Record the approximate time and reason for every manual reset, mode change, sleep change, power interruption, or OTA upload.
- Normal evidence comes from the WROOM rotating diagnostic pair; a continuously attached Serial Monitor is not required.
- Each submitted log package updates this ledger with exact counts, times, builds, and verdicts.
- A newly observed regression reopens only the affected contract; it does not erase unrelated passed evidence.

## Development Decision

The receive-only UART baseline is accepted for continued development. `PARTIAL`, `PENDING`, and `DEFERRED` rows remain explicit evidence debt and must be closed before final controller-link acceptance, but they do not block protocol documentation or the first safe `STATUS` implementation stage.
