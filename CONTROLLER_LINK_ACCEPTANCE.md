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
- `RETIRED`: intentionally removed from the current architecture; retained only as history.
- `NOT STARTED`: the related implementation does not exist yet.

## Evidence Ledger

| Contract | Status | Current evidence | What still closes it | Blocks next design stage |
| --- | --- | --- | --- | --- |
| Short protected UART wiring and `115200 8N1` | `PASSED` | Physical wiring, heartbeat, telemetry, and ACK traffic are stable. | Nothing. | No |
| Strict receive-only parsing | `PASSED` | `PING/PONG`, `SLEEP`, `TEL/ACK`, duplicate re-ACK, and session/sequence behavior are physically exercised; strict invalid-line rejection is enforced by the accepted parser contract. | Keep as a regression invariant. | No |
| Real C3 power telemetry through WROOM | `PASSED` | INA3221 Solar/Battery/Load, SOC, Charge, and mode reached WROOM, WQTT, and Telegram. | Nothing for the receive-only baseline. | No |
| Ordinary planned sleep recovery | `PASSED` | Repeated earlier `SLP -> WAIT -> OK`; build 191 added two live announcements on 2026-08-22. The `600 s` cycle completed through `WAIT -> OK`; the `5400 s` sleep was still active at the captured journal boundary. | Keep watching during normal logs. | No |
| Universal C3 sleep announcement | `PASSED` | Paired BS `135` / C3 `197` produced eight consecutive accepted `UART_SLP -> UART_WAIT -> UART_OK` cycles. Wake recovery took `9, 9, 9, 17, 10, 9, 11, 12 s`; after the first newly accepted sleep announcement, `UART_OFF` stayed at `1` and `C3_GAP` stayed at `0`. Every accepted strict `SLEEP` frame also invokes the flushed exact `SACK` response in BS source. | Keep `UART_OFF` and `C3_GAP` under normal long-run regression observation. | No |
| WROOM scheduled restart while C3 remains in declared `SLP` | `PENDING` | Source/build contract stores remaining C3 sleep in RTC before the scheduled software restart. An OTA restart of BS build `135 -> 136` while C3 was asleep started in `WAIT`, produced one transient `UART_OFF`, and then recovered automatically when C3 woke; this is useful evidence but is not the required scheduled-restart sequence. | Capture `UART_SLP -> SCHEDULED_RESTART -> SOFT boot/restored SLP -> WAIT -> OK` in the rotating diagnostic pair. | No; required before final link acceptance |
| True missing-link detection | `DEFERRED` | WROOM build 129 uses `WAIT` after 90 s and `OFF` after 240 s without valid activity. | Safe controlled disconnection with power removed, or a separately agreed non-destructive fault-injection mode. | No; required before final link acceptance |
| STATUS command envelope | `PASSED` | Uploaded BS build `131` / C3 build `192` returned a fresh matched command result and new `TEL`; coalescing for `/c3sts` and `/bssts` passed. The later BS `135` / C3 `197` sample returned four fresh matched STATUS results and three truthful `Cached / refresh FAILED` responses while automatic telemetry continued. | Keep freshness reliability as part of the lifecycle debt below; the truthful cached fallback is accepted. | No |
| Exactly-once STATUS command lifecycle | `PARTIAL` | Uploaded build `195` completed STATUS sequences `13`, `14`, and `15`; sequences `13/14` proved bounded retry plus `CMD_DUP` replay. Across later sequences `18..25`, `4/8` completed as fresh `OK STATUS` and `4/8` ended in bounded `ACK_TIMEOUT`, even though automatic telemetry remained active. Local BS build `139` keeps this STATUS lifecycle and clears retired persisted command codes `2/3` before accepting new STATUS work. | Keep STATUS TTL/restart recovery as later evidence debt. | No for the next integration stage |
| BS build 136 compatibility before retired Gateway work | `PASSED` | Telegram and diagnostics prove BS `0.1.82-EXP` build `136` Online with synchronized time, Wi-Fi/WQTT `OK`, Sheets queue recovery, unchanged C3 build `197` INA3221/GPS telemetry, one complete `SLEEP 600 -> WAIT -> OK` cycle with `7 s` recovery, a second valid sleep announcement, `C3_GAP=0`, and `GS_DROP=0`. | Nothing; the Gateway branch is retired and its runtime paths are removed locally in build `139`. | No |
| Saved C3 GPS FIX relay | `PARTIAL` | Safe upload order, legacy compatibility, build-change notice, fresh Maps card, and `C3_GPS fixed=1 sat=9 hdop10=24 epoch=1786909824` passed. BS accepted `61` further frames; all `12` build-195 HEALTH rows had WQTT `OK`. | Directly inspect one retained WQTT GPS JSON if exact broker payload proof is required; the diagnostic file proves connection, not JSON content. | No; functional GPS gateway is accepted |
| Temporary C3 OTA window through BS | `RETIRED` | Historical BS builds `132..137` exercised `/c3ota`, but C3 build `205` restored C3-owned Wi-Fi/bot/manual OTA. Local BS build `139` has no `/c3ota`, OTA_ON, WIFI_OFF, or TREQ/TIME runtime path; legacy command codes `2/3` are cleared on load. | Nothing. C3 OTA is controlled only from the C3 project and bot. | No |
| Compact C3 build-change notice in BS | `PARTIAL` | Uploaded BS build `133` is online and its journal shows the build-133 boot followed by healthy C3 build `194` traffic, establishing the baseline. It sends one short `C3 Update / Online · build N` message only when that build changes; same-build sleep/wake cycles remain silent by contract. | Accept naturally on the next real C3 firmware update without creating a test-only C3 build. | No |

## Long-run Collection Rules

- Keep both controllers powered and do not clear `diagnostics.log` or `diagnostics-prev.log` during the run.
- Record the approximate time and reason for every manual reset, mode change, sleep change, power interruption, or OTA upload.
- Normal evidence comes from the WROOM rotating diagnostic pair; a continuously attached Serial Monitor is not required.
- Each submitted log package updates this ledger with exact counts, times, builds, and verdicts.
- A newly observed regression reopens only the affected contract; it does not erase unrelated passed evidence.

## Development Decision

The paired sleep handshake and routine C3-to-BS telemetry gateway are accepted for continued integration. `PARTIAL`, `PENDING`, and `DEFERRED` rows remain explicit evidence debt for final controller-link or remote-control acceptance, but they do not block the shared-power and autonomous long-run stage. Periodic submitted logs may close this debt naturally; only a new regression reopens an accepted contract.
