# AppSheet Daily Verdict Table Setup

## Purpose

This document is the team instruction for configuring the `daily_verdict_table`
sheet inside `AppSheet`.

Use this guide when a teammate needs to build the same `Daily Verdict` screen
without inventing their own structure.

The goal is simple:

- one row per date
- clear `DAY / EVE / NGT` conclusion
- human-readable noise labels
- consistent colors across every teammate's app

This guide is intentionally narrow.

It does not describe the whole app.
It only standardizes the `daily_verdict_table` setup.

## Source Table

Google Sheets source:

- `daily_verdict_table`

Expected columns:

- `DEV ID`
- `DATE`
- `DAY LEVEL`
- `EVE LEVEL`
- `NGT LEVEL`
- `DAY SHARE %`
- `EVE SHARE %`
- `NGT SHARE %`
- `DAY CONF`
- `EVE CONF`
- `NGT CONF`
- `DAY DOM`
- `EVE DOM`
- `NGT DOM`
- `VERDICT`

## Setup Order

Configure in this order:

1. Add the table in `Data > Tables`
2. Configure columns in `Data > Columns`
3. Create the main view in `UX > Views`
4. Add format rules in `UX > Format Rules`

## 1. Data > Tables

Open:

- `Data > Tables`

Add or verify this table:

- `daily_verdict_table`

If the table already exists, confirm that AppSheet has refreshed the latest
columns from Google Sheets.

## 2. Data > Columns

Open:

- `Data > Columns`
- select table `daily_verdict_table`

Apply the following settings.

### `_RowNumber`

- `Type`: `Number`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: empty

### `DEV ID`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: empty

Note:

- keep it hidden for the current single-device setup
- if the app later becomes multi-device, this field can be shown

### `DATE`

- `Type`: `Date`
- `Key?`: `ON`
- `Label?`: `ON`
- `Show?`: `ON`
- `App formula`: empty

Important:

- this is the current project default because the current setup is one device
- if multiple devices later produce the same date, `DATE` will no longer be a
  safe unique key

### `DAY LEVEL`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `ON`
- `App formula`: empty

### `EVE LEVEL`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `ON`
- `App formula`: empty

### `NGT LEVEL`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `ON`
- `App formula`: empty

### `DAY SHARE %`

- `Type`: `Percent`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: empty

### `EVE SHARE %`

- `Type`: `Percent`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: empty

### `NGT SHARE %`

- `Type`: `Percent`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: empty

### `DAY CONF`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: empty

### `EVE CONF`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: empty

### `NGT CONF`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: empty

### `DAY DOM`, `EVE DOM`, `NGT DOM`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: empty

These fields keep level dominance separate from the `DAY/EVE/NGT CONF` coverage labels.

### `VERDICT`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `ON`
- `App formula`: empty

## Column Visibility Result

Leave `Show? = ON` only for:

- `DATE`
- `DAY LEVEL`
- `EVE LEVEL`
- `NGT LEVEL`
- `VERDICT`

Leave hidden:

- `_RowNumber`
- `DEV ID`
- `DAY SHARE %`
- `EVE SHARE %`
- `NGT SHARE %`
- `DAY CONF`
- `EVE CONF`
- `NGT CONF`
- `DAY DOM`
- `EVE DOM`
- `NGT DOM`

## 3. UX > Views

Open:

- `UX > Views`
- `New View`

Create this view.

### Main View Settings

- `View name`: `Daily Verdict`
- `For this data`: `daily_verdict_table`
- `View type`: `Table`
- `Position`: `Menu`
- `Display name`: `Daily Verdict`
- `Icon`: `assessment`
- `Prominence`: `Normal`

### Table Columns

Use this exact order:

1. `DATE`
2. `DAY LEVEL`
3. `EVE LEVEL`
4. `NGT LEVEL`
5. `VERDICT`

### Sorting

- `Sort by`: `DATE`
- `Order`: `Descending`

### Grouping

- `Group by`: `None`

### Event Actions

Leave default behavior.
Do not add row actions for this view in `v1`.

## 4. UX > Format Rules

Open:

- `UX > Format Rules`

For this table, the correct approach is column-level meaning, not whole-row
meaning.

Reason:

- one row can contain different states at the same time
- example: `DAY = NORMAL`, `EVE = LOUD`, `NGT = SILENT`
- because of that, row-wide coloring is misleading

Use `12` rules total:

- `4` rules for `DAY LEVEL`
- `4` rules for `EVE LEVEL`
- `4` rules for `NGT LEVEL`

## Color Standard

Use these exact colors:

- `SILENT` -> `#d9ead3`
- `NORMAL` -> `#fff2cc`
- `LOUD` -> `#f9cb9c`
- `PEAK` -> `#f4cccc`

## Rule List

Create the following rules.

### DAY Rules

#### Rule 1

- `Name`: `DAY Silent`
- `For this data`: `daily_verdict_table`
- `Condition`:

```appsheet
[DAY LEVEL] = "SILENT"
```

- `Format color`: `#d9ead3`

#### Rule 2

- `Name`: `DAY Normal`
- `For this data`: `daily_verdict_table`
- `Condition`:

```appsheet
[DAY LEVEL] = "NORMAL"
```

- `Format color`: `#fff2cc`

#### Rule 3

- `Name`: `DAY Loud`
- `For this data`: `daily_verdict_table`
- `Condition`:

```appsheet
[DAY LEVEL] = "LOUD"
```

- `Format color`: `#f9cb9c`

#### Rule 4

- `Name`: `DAY Peak`
- `For this data`: `daily_verdict_table`
- `Condition`:

```appsheet
[DAY LEVEL] = "PEAK"
```

- `Format color`: `#f4cccc`

### EVE Rules

#### Rule 5

- `Name`: `EVE Silent`
- `For this data`: `daily_verdict_table`
- `Condition`:

```appsheet
[EVE LEVEL] = "SILENT"
```

- `Format color`: `#d9ead3`

#### Rule 6

- `Name`: `EVE Normal`
- `For this data`: `daily_verdict_table`
- `Condition`:

```appsheet
[EVE LEVEL] = "NORMAL"
```

- `Format color`: `#fff2cc`

#### Rule 7

- `Name`: `EVE Loud`
- `For this data`: `daily_verdict_table`
- `Condition`:

```appsheet
[EVE LEVEL] = "LOUD"
```

- `Format color`: `#f9cb9c`

#### Rule 8

- `Name`: `EVE Peak`
- `For this data`: `daily_verdict_table`
- `Condition`:

```appsheet
[EVE LEVEL] = "PEAK"
```

- `Format color`: `#f4cccc`

### NGT Rules

#### Rule 9

- `Name`: `NGT Silent`
- `For this data`: `daily_verdict_table`
- `Condition`:

```appsheet
[NGT LEVEL] = "SILENT"
```

- `Format color`: `#d9ead3`

#### Rule 10

- `Name`: `NGT Normal`
- `For this data`: `daily_verdict_table`
- `Condition`:

```appsheet
[NGT LEVEL] = "NORMAL"
```

- `Format color`: `#fff2cc`

#### Rule 11

- `Name`: `NGT Loud`
- `For this data`: `daily_verdict_table`
- `Condition`:

```appsheet
[NGT LEVEL] = "LOUD"
```

- `Format color`: `#f9cb9c`

#### Rule 12

- `Name`: `NGT Peak`
- `For this data`: `daily_verdict_table`
- `Condition`:

```appsheet
[NGT LEVEL] = "PEAK"
```

- `Format color`: `#f4cccc`

## Expected Result

After setup, the `Daily Verdict` view should:

- show one row per day
- show `DAY / EVE / NGT` labels clearly
- keep the screen short and readable
- use the same level colors for every teammate

The table should feel like:

- a short daily human report

It should not feel like:

- a raw sheet mirror
- a debug screen
- a warehouse of technical columns

## Current Project Assumption

This guide assumes:

- one active device
- `DATE` is unique enough to act as the key

If the project later becomes multi-device, the team should introduce a dedicated
row key such as:

- `DEV ID + DATE`

or

- a separate `ROW KEY` column generated in Google Sheets

That change is outside this `v1` setup guide.
