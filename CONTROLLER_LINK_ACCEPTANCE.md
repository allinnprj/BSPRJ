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
| STATUS command envelope | `PASSED` | Uploaded BS build `131` / C3 build `192` returned a fresh matched command result and new `TEL`; the accepted Telegram card showed `Link: OK`, build `192`, `Data: Fresh`, telemetry `q=94` age `4 s`, and Sheets queue `0`. Two `/c3sts` updates in one poll were coalesced into one response; `/bssts` coalescing also passed. | Keep as a regression invariant while broader lifecycle fault cases remain below. | No |
| Exactly-once command lifecycle | `PARTIAL` | Both uploaded halves persist command identity/state before acknowledgement/completion, and the normal STATUS lifecycle plus user-level duplicate coalescing are physical. Terminal records are cleared only after Telegram delivery. | Prove identical UART retry/duplicate replay, TTL expiry, actual-state result, and recovery across either controller restart on the physical pair. | Yes, before remote-control acceptance |
| Temporary C3 OTA window | `LOCAL` | Local BS build `132` / C3 build `193` implement only `/c3ota -> OTA_ON 600`, existing-listener activation, sleep-aware TTL, duplicate-safe execution, truthful queued/terminal replies, awake hold, and automatic listener expiry. Both contract tests and firmware builds pass. Normal C3 Wi-Fi remains unchanged in this stage. | Manually upload C3 first and BS second; prove awake activation, declared-sleep queueing, one OTA/recovery cycle, 10-minute expiry, and normal sleep resumption. | Yes before `WIFI_OFF` or normal C3 Wi-Fi migration |

## Long-run Collection Rules

- Keep both controllers powered and do not clear `diagnostics.log` or `diagnostics-prev.log` during the run.
- Record the approximate time and reason for every manual reset, mode change, sleep change, power interruption, or OTA upload.
- Normal evidence comes from the WROOM rotating diagnostic pair; a continuously attached Serial Monitor is not required.
- Each submitted log package updates this ledger with exact counts, times, builds, and verdicts.
- A newly observed regression reopens only the affected contract; it does not erase unrelated passed evidence.

## Development Decision

The receive-only UART baseline is accepted for continued development. `PARTIAL`, `PENDING`, and `DEFERRED` rows remain explicit evidence debt and must be closed before final controller-link acceptance, but they do not block protocol documentation or the first safe `STATUS` implementation stage.
