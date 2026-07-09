# Data Dictionary

This document explains the names used in Google Sheets, Telegram messages, AppSheet, logs, and analytics. It is written as a practical reading guide: what the term means, why it exists, what you should understand from it, and when it may become less useful later.

## Core Principle

The project currently measures relative sound behavior, not calibrated `dB`.

The main question is not "how many decibels?" yet. The main question is:

- when was it quiet?
- when was the usual background active?
- when was it noisy?
- when were the strongest peaks?
- how reliable is the data for that conclusion?

After the `INMP441` migration, the most important raw sound clue is usually `AVG P2P`, while `NOW %`, `H %`, and `M %` are the human-readable scaled values.

## Time Terms

### `DATE`

The calendar date of the measurement window.

Use it to group all windows from the same day. In archive sheets it also helps separate one day from another.

### `T FROM`

The start time of a measurement window.

Example: `07:10:00` means the row starts at 07:10.

Why it exists: the firmware does not send every tiny audio sample to Google Sheets. It groups data into time windows. `T FROM` tells you where that window begins.

### `T TO`

The end time of a measurement window.

Example: `07:19:59` means the row covers data until the end of that 10-minute block.

Together, `T FROM` and `T TO` answer: "which exact period does this row describe?"

### `PART`

The day-part bucket for the row.

Current values:

- `DAY`: daytime
- `EVE`: evening
- `NGT`: night

This is one of the main project concepts. The goal is to compare noise by time of day, not just collect one long list of readings.

### `TS`

Timestamp used in the timeline summary.

It combines date and time so charts can draw a proper time line.

## Device And Version Terms

### `DEV ID`

Device identifier.

Useful when there will be more than one monitor later. For now it mostly confirms that the row came from this ESP32.

### `VER`

Firmware version.

Use it to understand which firmware logic produced the row. This matters because the meaning of `NOW %` changed after the `INMP441` retune.

### `BUILD`

Firmware build number.

More specific than version. If two rows have different builds, they may use slightly different logic.

### `ACOUSTIC REV`

Physical microphone-construction revision.

Use it to avoid mixing measurements from mechanically different microphone layouts. Revision `2` is the protected external `INMP441` construction used for the final microphone-validation run.

## Sound Terms

### `NOW %`

The current relative sound level for the window, scaled to a human-readable percentage.

After build `95`, this is based on the `INMP441` `P2P` scale. It is meant to be the main simple number for "how loud was this window?"

How to read it:

- low value: quieter window
- higher value: louder window
- not real `dB`

Why useful: this is the easiest number to show on OLED, MQTT, Datacake, Telegram, and dashboards.

Possible future simplification: if `LEVEL` becomes reliable enough, you may look at labels more often than raw `NOW %`.

### `H %`

Rolling hour average percentage.

It answers: "what has the last hour felt like?"

Useful because one short loud event should not define the whole situation. `H %` smooths the recent past.

On OLED, `H` means this value. During warmup, the firmware should not pretend a full hour exists yet.

### `M %`

Long-term mean percentage.

It answers: "what is the average level across all measured time since the saved mean started?"

Useful for long-term baseline, but slower to react. If the environment changes, `M %` can lag behind reality.

### `RAW MIN`

The lowest raw digital sample seen in the window.

With `INMP441`, this is a signed digital audio value, not an analog ADC value.

Useful mostly for technical diagnostics:

- are samples changing?
- is the input stuck?
- are there suspicious extreme values?

For everyday noise interpretation, `RAW MIN` is less useful than `AVG P2P`.

### `RAW MAX`

The highest raw digital sample seen in the window.

Read together with `RAW MIN`. If both stay near zero forever, the microphone path may be dead or disconnected.

If values hit extreme limits often, it may indicate clipping, decoding issues, power noise, or an overly sensitive raw diagnostic.

### `AVG P2P`

Average peak-to-peak activity for the window.

`P2P` means the span between low and high audio samples. In this project it is one of the best clues for real sound activity from `INMP441`.

Why it is useful:

- it reacted clearly during the balcony test
- it showed quiet windows, background windows, strong windows, and peaks better than old `NOW %`
- it helped retune build `95`

Practical current anchors from the balcony run:

- around `220..800`: very quiet low end
- around `1200`: quiet/normal boundary area
- around `1700`: typical middle area
- around `2300+`: strong activity
- around `2900`: observed high peak in that run

Possible future simplification: `AVG P2P` may remain a technical column while `NOW %` and `LEVEL` become the normal user-facing values.

### `P2P P95`

Stable high-end `P2P` reference for the window. It is the 95th percentile, so it shows stronger sound activity without letting one random digital spike dominate the conclusion.

### `P2P MIN`, `P2P MAX`, `P2P STB MAX`

Technical window range:

- `P2P MIN`: quietest observed sample window
- `P2P MAX`: raw technical maximum
- `P2P STB MAX`: smoothed practical maximum

For normal analysis, prefer `AVG P2P` and `P2P P95`.

### `SESSION P2P MIN`, `SESSION P2P MAX`, `SESSION P2P STB MAX`

Boot-session range context. These values help distinguish normal window behavior from rare technical peaks accumulated since the last restart.

### `LEVEL`

Human-readable relative noise level derived from the window average `AVG P2P`.

Current values:

- `SILENT`
- `NORMAL`
- `LOUD`
- `PEAK`

This is what the project ultimately wants: simple human language instead of raw numbers.

Current rule in firmware and Google Sheets for `acoustic_rev=2`:

- `AVG P2P <= 350`: `SILENT`
- `AVG P2P <= 650`: `NORMAL`
- `AVG P2P <= 850`: `LOUD`
- above `850`: `PEAK`

Important: these are relative `INMP441` thresholds from the protected external microphone field run. They are not real `dB` values.

## Signal Quality Terms

### `SIG IN`

Technical input-signal status.

It is not the same as `LEVEL`.

Examples:

- `OK`: input looks usable
- `LOW`: signal is very weak or almost empty
- `LOW_HOLD`: weak signal stayed long enough to be considered persistent
- `CLIP`: input appears saturated
- `CLIP_HOLD`: clipping stayed long enough to be persistent

How to use it:

- use it to detect hardware/input problems
- do not use it as the main noise label

Good distinction:

- `SIG IN` says whether the microphone input looks technically healthy
- `LEVEL` says whether the environment sounds quiet or loud

### `LOW`

Technical signal is too weak or too empty.

For `INMP441`, after build `95`, `LOW` should be rarer and should mean the input is suspiciously weak, not just normal quiet balcony ambience.

### `OK`

Technical input looks usable.

It does not mean the environment is loud. It only means the microphone signal is not obviously broken.

### `CLIP`

Technical input appears saturated.

Before build `95`, this was too sensitive because single raw extremes could make many windows look clipped. Build `95` made `CLIP` require a meaningful share of clipped samples in the read window.

If `CLIP` still appears too often, inspect it before trusting it.

## Environment Terms

### `TEMP C`

Average temperature in Celsius for the window.

Useful for context. It can help explain changes in outdoor/balcony conditions, but it is not directly a sound measurement.

### `HUM %`

Average humidity percentage for the window.

Useful for environmental context. It may matter later if weather or dampness affects the balcony setup.

### `ENV OK COUNT`

How many internal window updates had a valid SHT31 temperature/humidity reading.

Use it together with `ENV FAIL COUNT` to see whether missing environment data is occasional or persistent.

### `ENV FAIL COUNT`

How many internal window updates did not have a valid SHT31 reading.

Useful during the breadboard stage because it can point to I2C, power, contact, or sensor stability issues.

## Window And Sample Terms

### `WIN MIN`

Window length in minutes.

Usually `10`, because the firmware aggregates readings into 10-minute windows for Google Sheets.

### `SAMPLES`

Number of internal samples/updates included in the window.

A normal 10-minute window should have enough samples. Google Sheets currently treats a row as valid when `SAMPLES >= 100`.

If samples are too low, the row may be incomplete.

### `QUIET`

Count of internal samples inside the window that were considered quiet.

It helps show whether a 10-minute window was mostly calm or only briefly calm.

Possible future simplification: if `LEVEL` and `AVG P2P` become enough, this may become a technical detail.

### `LOUD`

Count of internal samples inside the window that were considered loud.

Useful for detecting whether a window had repeated loud moments, not just one spike.

### `UPTIME`

How long the device had been running when the row was sent.

Useful for diagnosing resets and power stability.

In local `/log.csv`, `uptime_min` is the analysis-friendly numeric value and `uptime_text` is the human-readable form. After build `101`, this is power-session uptime: a soft restart continues it, while a physical power-on starts a fresh session.

### `EVENT`

Type of local log row.

Common values:

- `WINDOW`: a normal measurement window
- `BOOT`: controller boot marker
- `SCHEDULED_RESTART`: planned soft restart marker
- `SHT31_LOST`: environment sensor readings stayed missing long enough to matter
- `SHT31_REINIT`: firmware tried to reinitialize I2C/SHT31
- `SHT31_RECOVER`: valid SHT31 readings returned

This helps read the CSV as a timeline, not only as measurement rows.

### `BOOT SEQ`

Boot number inside the current power session.

Usually `1` after physical power-on. It increases after soft restarts while power-session uptime continues.

### `RESET REASON`

ESP32 reset reason for the current boot.

Examples include `POWERON`, `SOFT`, `BROWNOUT`, `WDT`, and `PANIC`. This is mainly diagnostic and helps separate normal scheduled restarts from power or firmware trouble.

### `P2P STABLE MAX`

Highest smoothed P2P-like level seen inside the measurement window.

It is more useful for balcony noise interpretation than raw `P2P MAX`, because raw max can be dominated by one digital spike.

### `P2P P95`

95th percentile of the smoothed one-second sound levels inside the measurement window.

This is the preferred stable upper-noise indicator for the multi-day balcony test. It should ignore the worst few digital spikes better than `P2P MAX` and should be more representative than one raw peak.

### `SESSION P2P STABLE MAX`

Highest smoothed P2P-like level seen since the current device boot.

On OLED this is shown as `STB` on the `RANGE` page. Treat it as the practical upper range; treat `RAW MAX` as the technical peak.

### `FREE HEAP`

Free ESP32 heap memory when the row was written.

Useful for checking whether the firmware is slowly losing memory during a multi-day run.

### `MIN FREE HEAP`

Lowest free heap observed by the ESP32 runtime since boot.

If this keeps falling over days, it may point to a leak, fragmentation, or a network/library path that needs attention.

## Clean Summary Terms

### `SOURCE SHEET`

Which raw sheet the row came from.

Examples:

- `log`: current active day
- date-named sheet: archived day

Useful for tracing where a clean row came from.

### `DAY STATE`

Whether the row came from the current live log or an archived day.

Usually:

- `CURRENT`
- `ARCHIVE`

### `RECORD KEY`

Unique identity for a measurement window.

It is built from device, date, time range, and part. It helps detect duplicates.

### `DUP COUNT`

How many raw rows share the same `RECORD KEY`.

If this is greater than `1`, the same window was received more than once.

### `IS DUPLICATED`

Flag showing whether a row is duplicated.

Usually:

- `0`: not duplicated
- `1`: duplicated

### `IS VALID`

Flag showing whether the row is valid enough for analytics.

Currently based mainly on sample count:

- `1`: valid
- `0`: not valid

### `GAP BEFORE`

How many expected 10-minute windows appear to be missing before this row.

Useful for detecting power loss, Wi-Fi upload gaps, or device downtime.

### `QUALITY`

Compact technical quality label for the row.

Examples:

- `OK`
- `DUPLICATED`
- `LOW_SAMPLES`
- `GAP_BEFORE`
- combinations such as `LOW_SAMPLES+GAP_BEFORE`

This helps decide whether to trust the row.

## Day-Part Summary Terms

### `WINDOWS TOTAL`

Total unique windows found for a device/date/part.

It includes valid and invalid windows.

Example meaning: "How many 10-minute rows do we have for this night/day/evening block?"

### `WINDOWS VALID`

Number of windows that passed the validity rule.

This is more important than `WINDOWS TOTAL` for conclusions.

If `WINDOWS TOTAL` is high but `WINDOWS VALID` is low, there is data, but it is not trustworthy enough.

### `EXPECTED WINDOWS`

How many 10-minute windows should exist for a full part of day.

Current expectations:

- `DAY`: `66`
- `EVE`: `36`
- `NGT`: `42`

Why these numbers exist:

- `DAY` covers 11 hours, so `11 * 6 = 66`
- `EVE` covers 6 hours, so `6 * 6 = 36`
- `NGT` covers 7 hours, so `7 * 6 = 42`

### `COVERAGE %`

How complete the data is.

Formula idea:

```text
WINDOWS VALID / EXPECTED WINDOWS * 100
```

How to read it:

- `80%+`: good
- `40..79%`: partial
- below `40%`: weak

This is a trust score for the summary. A loud/quiet conclusion with low coverage should be treated carefully.

### `AVG NOW %`

Average `NOW %` for that day-part.

This is a legacy/simple percent-scale view. For current build `110` level conclusions, prefer `AVG P2P` and `LEVEL`.

### `AVG H %`

Average rolling-hour value across the day-part.

This is smoother than `AVG NOW %`. It can be useful for trend stability, but may be less direct.

### `AVG M %`

Average long-term mean value across the day-part.

This is usually less useful for immediate day-part conclusions because it changes slowly.

### `AVG P2P`

Average `AVG P2P` for the day-part.

For `INMP441`, this is the main numeric summary for current relative `SILENT / NORMAL / LOUD / PEAK` conclusions.

### `AVG TEMP C`

Average temperature for the day-part.

### `AVG HUM %`

Average humidity for the day-part.

### `QUIET %`

Share of quiet internal samples inside the day-part.

Useful for answering: "Was this part mostly quiet even if it had occasional spikes?"

### `LOUD %`

Share of loud internal samples inside the day-part.

Useful for answering: "Was this part repeatedly loud, or only briefly loud?"

### `MISSING WIN`

Estimated number of missing 10-minute windows.

High value means the day is incomplete or the device had gaps.

## Level Mix Terms

### `VALID WINDOWS`

Number of windows used for level calculations.

Only valid windows should influence the level mix.

### `SILENT WIN`

How many valid windows were classified as `SILENT`.

### `NORMAL WIN`

How many valid windows were classified as `NORMAL`.

### `LOUD WIN`

How many valid windows were classified as `LOUD`.

### `PEAK WIN`

How many valid windows were classified as `PEAK`.

### `SILENT %`, `NORMAL %`, `LOUD %`, `PEAK %`

Percent mix of valid windows in each level.

This is very useful because averages can hide the day shape. A day can have the same average as another day but a very different mix of quiet and peak windows.

## Timeline Terms

### `SILENT FLAG`, `NORMAL FLAG`, `LOUD FLAG`, `PEAK FLAG`

Numeric chart helpers.

Usually:

- `1`: this row belongs to that level
- `0`: it does not

Why they exist: charts and AppSheet can count or graph flags more easily than text labels.

For human reading, they are less important than `LEVEL`.

## Health Summary Terms

### `WINDOWS UNIQUE`

How many unique measurement windows exist for the day.

This is a raw completeness count before judging validity.

### `DUP EXTRA ROWS`

How many duplicate extra rows were found.

High value means the same window was sent more than once. Duplicates should not distort analytics.

### `LOW SAMPLE WIN`

How many windows had too few samples.

This can point to resets, partial windows, or unstable runtime.

### `FIRST TIME`

First measurement time found for the day.

Useful for checking when the device started logging.

### `LAST TIME`

Last measurement time found for the day.

Useful for checking when the device stopped or last uploaded.

### `HAS LOG ROWS`

Shows whether the active `log` sheet still has rows for that date.

Mostly technical. It helps distinguish current-day data from archived-day data.

## Conclusion And Verdict Terms

### `MAIN LEVEL`

The most common level for the period.

Example: if `NORMAL` has the most windows, `MAIN LEVEL` is `NORMAL`.

This is usually more meaningful than one peak event.

### `MAIN SHARE %`

How dominant the `MAIN LEVEL` is.

Example: `80%` means most windows agree with the main level. `35%` means the day-part was mixed.

### `CONFIDENCE`

Trust label based on coverage.

Current values:

- `GOOD`: enough coverage
- `PARTIAL`: usable but incomplete
- `WEAK`: too little data for a strong conclusion

Important: `CONFIDENCE` does not mean "the microphone is correct." It means "we have enough windows to trust this summary."

### `READING`

Human-readable sentence summarizing the row.

Example:

```text
NGT: typical SILENT, avg 219 P2P, mix share 90.5%, good confidence
```

This is meant to be read directly by a person or shown in AppSheet.

### `VERDICT SCORE`

Numeric score for the main level.

Current mapping:

- `SILENT`: `1`
- `NORMAL`: `2`
- `LOUD`: `3`
- `PEAK`: `4`

Why it exists: charts, sorting, and comparisons are easier with numbers than text.

For human reading, `MAIN LEVEL` is easier.

### `DAY LEVEL`, `EVE LEVEL`, `NGT LEVEL`

Daily table columns showing the main level for each part of the day.

These are the quickest way to compare one day at a glance.

### `DAY SHARE %`, `EVE SHARE %`, `NGT SHARE %`

Main-level dominance for each part.

If `NGT LEVEL = SILENT` and `NGT SHARE % = 90%`, the night was very consistently silent. If share is low, the night was mixed.

### `DAY CONF`, `EVE CONF`, `NGT CONF`

Coverage confidence for each part of the day.

Use these before trusting the verdict.

### `VERDICT`

One-line daily summary.

Example:

```text
2026-05-20: DAY LOUD, EVE NORMAL, NGT SILENT
```

This is a compact daily label, not a detailed diagnosis.

## Telegram Terms

### `BS Noise Latest`

Latest valid clean window report.

Use it to see what the device most recently measured.

### `Device`

Same meaning as `DEV ID`.

### `Version` / `build`

Firmware version and build that produced the latest data.

Important when interpreting old vs new scale behavior.

### `Window`

Same idea as `T FROM` and `T TO`.

It tells which time block the Telegram message describes.

### `Part`

Same as `PART`: `DAY`, `EVE`, or `NGT`.

### `Now`, `H`, `M`

Same as `NOW %`, `H %`, and `M %`.

Telegram uses shorter names because the message must stay readable.

### `Quality`

Same idea as row validity/quality.

If quality is not good, treat the latest message as technical information rather than a strong conclusion.

### `BS Noise Summary`

Daily or completed-day summary.

It includes:

- average level by part
- main level by part
- valid windows
- coverage
- quality label
- short result text

## How To Read One Day

1. Check `summary_health`.

Look at `COVERAGE %`, `LOW SAMPLE WIN`, and `MISSING WIN`. If coverage is weak, conclusions are weak.

2. Check `summary_daypart`.

Compare `AVG NOW %`, `AVG P2P`, `QUIET %`, and `LOUD %` for `DAY`, `EVE`, and `NGT`.

3. Check `summary_levels`.

Look at the mix: how many windows were `SILENT`, `NORMAL`, `LOUD`, or `PEAK`.

4. Check `summary_conclusions` or `daily_verdict_table`.

Use `MAIN LEVEL`, `MAIN SHARE %`, and `CONFIDENCE` for the simple conclusion.

5. Only then look at raw technical columns.

Use `RAW MIN`, `RAW MAX`, `SIG IN`, and `QUALITY` to explain suspicious data, not as the first user-facing answer.

## Terms That May Become Less Important Later

These columns are useful while the system is still being tuned, but may become hidden or secondary later:

- `RAW MIN`
- `RAW MAX`
- `SIG IN`
- `DUP COUNT`
- `IS DUPLICATED`
- `RECORD KEY`
- `DAY STATE`
- `SOURCE SHEET`
- `HAS LOG ROWS`
- chart helper flags such as `SILENT FLAG`

These columns are likely to remain important:

- `DATE`
- `T FROM`
- `T TO`
- `PART`
- `NOW %`
- `AVG P2P`
- `LEVEL`
- `WINDOWS VALID`
- `EXPECTED WINDOWS`
- `COVERAGE %`
- `MAIN LEVEL`
- `MAIN SHARE %`
- `CONFIDENCE`
- `VERDICT`
