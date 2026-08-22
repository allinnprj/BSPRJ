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
| Universal C3 sleep announcement | `LOCAL FIX` | Build `191` previously produced two valid frames, but build `195` NT4 had `UART_SLP=0`, `UART_OFF=7`, and normal wake recovery. Local C3 build `196` now sends three atomic flushed copies of the unchanged frame with short guards; BS is unchanged. | Upload C3 build `196` and re-prove several `SLP -> WAIT -> OK` cycles with no OFF growth. | Yes, before final link acceptance |
| WROOM scheduled restart while C3 remains in declared `SLP` | `PENDING` | Source/build contract stores remaining C3 sleep in RTC before the scheduled software restart. | Capture `UART_SLP -> SCHEDULED_RESTART -> SOFT boot/restored SLP -> WAIT -> OK` in the rotating diagnostic pair. | No; required before final link acceptance |
| True missing-link detection | `DEFERRED` | WROOM build 129 uses `WAIT` after 90 s and `OFF` after 240 s without valid activity. | Safe controlled disconnection with power removed, or a separately agreed non-destructive fault-injection mode. | No; required before final link acceptance |
| STATUS command envelope | `PASSED` | Uploaded BS build `131` / C3 build `192` returned a fresh matched command result and new `TEL`; the accepted Telegram card showed `Link: OK`, build `192`, `Data: Fresh`, telemetry `q=94` age `4 s`, and Sheets queue `0`. Two `/c3sts` updates in one poll were coalesced into one response; `/bssts` coalescing also passed. | Keep as a regression invariant while broader lifecycle fault cases remain below. | No |
| Exactly-once command lifecycle | `PARTIAL` | Uploaded build `195` completed STATUS sequences `13`, `14`, and `15` as `OK STATUS`; sequences `13/14` physically proved bounded retry plus `CMD_DUP` replay. Terminal records are cleared only after Telegram delivery. | Prove TTL expiry and recovery across either controller restart. BS-triggered OTA remains an optional reserve, not an active gate. | Yes, before remote-control acceptance |
| Saved C3 GPS FIX relay | `PARTIAL` | Safe upload order, legacy compatibility, build-change notice, fresh Maps card, and `C3_GPS fixed=1 sat=9 hdop10=24 epoch=1786909824` passed. BS accepted `61` further frames; all `12` build-195 HEALTH rows had WQTT `OK`. | Directly inspect one retained WQTT GPS JSON if exact broker payload proof is required; the diagnostic file proves connection, not JSON content. | No; functional GPS gateway is accepted |
| Temporary C3 OTA window through BS | `DEFERRED` | BS build `132` / C3 build `193` physically opened the listener, completed a `121 s` upload, restarted, and returned online. Sequence `8` supplied the window used to upload C3 build `194`. The user selected the C3 project's own Telegram OTA flow as the primary future upload path; the existing BS `/c3ota` path remains available only as a reserve. | No further proof is required for the active plan. Reopen only if BS-triggered OTA becomes necessary later. | No |
| Compact C3 build-change notice in BS | `PARTIAL` | Uploaded BS build `133` is online and its journal shows the build-133 boot followed by healthy C3 build `194` traffic, establishing the baseline. It sends one short `C3 Update / Online · build N` message only when that build changes; same-build sleep/wake cycles remain silent by contract. | Accept naturally on the next real C3 firmware update without creating a test-only C3 build. | No |

## Long-run Collection Rules

- Keep both controllers powered and do not clear `diagnostics.log` or `diagnostics-prev.log` during the run.
- Record the approximate time and reason for every manual reset, mode change, sleep change, power interruption, or OTA upload.
- Normal evidence comes from the WROOM rotating diagnostic pair; a continuously attached Serial Monitor is not required.
- Each submitted log package updates this ledger with exact counts, times, builds, and verdicts.
- A newly observed regression reopens only the affected contract; it does not erase unrelated passed evidence.

## Development Decision

The receive-only UART baseline is accepted for continued development. `PARTIAL`, `PENDING`, and `DEFERRED` rows remain explicit evidence debt and must be closed before final controller-link acceptance, but they do not block protocol documentation or the first safe `STATUS` implementation stage.
