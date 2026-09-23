# AppSheet Setup

## Shared Team Intent

This file is not only a technical setup note. It is also the shared `AppSheet` direction for every teammate working on this project.

The rule is:

- each person may build their own view structure differently
- but the user-facing meaning must stay the same
- the app must explain the daily noise picture simply, not like an engineering console

The main audience is:

- a person who is only beginning to understand the numbers
- a person who wants the conclusion first
- a person who should not need to think like the creator of the system

Because of that, every `AppSheet` decision should move the interface toward these outcomes:

- show the noise picture for `DAY / EVE / NGT` clearly
- explain which level is most typical: `SILENT / NORMAL / LOUD / PEAK`
- show whether the data is trustworthy enough to read confidently
- help the user understand the result quickly without decoding too many raw metrics

This means:

- conclusions first
- supporting numbers second
- technical diagnostics third

If a screen looks useful only to the engineer who built it, that screen is not the main result yet.

## Цель

Этот файл фиксирует `v1` для `AppSheet` без ломки текущего контракта записи.

Правило простое:

- `ESP32 -> Google Apps Script -> Google Sheets` остаётся как есть
- `AppSheet` работает только как `read-only` витрина
- `log` и архивные raw-листы не используются как основной AppSheet-источник

## Product Goal Inside AppSheet

The practical goal of `AppSheet v1` is not to display all available analytics.

The practical goal is to let a user open the app and answer these questions fast:

- was the day mostly noisy or mostly calm
- was the evening better or worse than the day
- was the night calmer than the rest
- can this date be trusted, or is coverage too weak

So the app should feel like:

- a short daily noise report

not like:

- a raw analytics warehouse
- a debug console
- a sheet mirror

## Screen Responsibilities

The team should treat each main screen as having one clear job.

If one screen tries to explain everything at once, the app becomes harder to read.

### `Overview`

This is the main human screen.

Its job is:

- show the conclusion first
- help the user understand the date quickly
- explain the day in simple words, not in table logic

The user should be able to open `Overview` and understand:

- what the day looked like overall
- whether `DAY`, `EVE`, and `NGT` were mostly calm or noisy
- whether the data confidence is strong enough

If `Overview` looks like a raw list of rows, it is not doing its job yet.

### `Dayparts`

This screen explains the three daily periods directly.

Its job is:

- compare `DAY`, `EVE`, and `NGT`
- show how strong the average noise was in each period
- show whether coverage for each part is complete enough

The user should leave this screen with one answer:

- which part of the day was louder or calmer than the others

### `Levels`

This screen explains the mix of human-readable levels.

Its job is:

- show how much of the period looked `SILENT`, `NORMAL`, `LOUD`, or `PEAK`
- make the dominant level easy to understand
- support the conclusion without forcing the user to decode raw counts first

The user should leave this screen with one answer:

- what level was most typical in that period

### `Health`

This screen is about trust, not about noise itself.

Its job is:

- show whether the data is complete enough
- show whether missing windows weaken the conclusion
- show whether low-sample windows or duplicates reduce confidence

The user should leave this screen with one answer:

- can I trust this date fully, partially, or only carefully

### `Noise`

This screen is optional as a main screen and must justify its existence.

Its job is not to repeat what the other screens already say.

It is allowed only if it adds one of these:

- faster visual comparison
- easier pattern recognition
- clearer summary than the tables

If `Noise` only shows decorative charts without improving understanding, it should become a secondary screen or be simplified.

## Что брать в AppSheet

Для `v1` подключать только эти листы:

- `summary_conclusions`
- `summary_daypart`
- `summary_levels`
- `summary_health`

Пока не подключать:

- `log`
- архивные листы дней
- `clean_summary_10m`

Причина:

- `summary_*` уже являются человеко-читаемым слоем
- они компактнее
- они лучше подходят для мобильного чтения
- это не вмешивается в live write path

## Рекомендуемая структура AppSheet

### Таблицы

Добавить в AppSheet таблицы:

- `SummaryConclusions`
  - source: `summary_conclusions`
- `SummaryDaypart`
  - source: `summary_daypart`
- `SummaryLevels`
  - source: `summary_levels`
- `SummaryHealth`
  - source: `summary_health`

### Access mode

Для всех таблиц:

- `Are updates allowed?` -> `READ_ONLY`

Если AppSheet спросит про добавление/редактирование/удаление:

- `Adds` = `OFF`
- `Updates` = `OFF`
- `Deletes` = `OFF`

## Ключи для v1

Самый быстрый безопасный вариант для первого `read-only` запуска:

- использовать `_RowNumber` как key в AppSheet

Это допустимо именно для `v1`, потому что:

- AppSheet здесь только читает
- deep-link стабильность пока не критична
- аналитические листы у нас пересобираются целиком

Если позже понадобятся:

- стабильные ссылки
- action/navigation между экранами
- более строгие reference-связи

тогда следующим шагом добавим отдельные `APP_KEY` колонки в `summary_*`.

## Что показывать в каждом листе

### `summary_conclusions`

Это главный стартовый экран.

Оставить видимыми:

- `DATE`
- `PART`
- `DBA LEQ EST`
- `MAIN LEVEL`
- `MAIN SHARE %`
- `COVERAGE %`
- `DATA CONFIDENCE`
- `LEVEL DOMINANCE`
- `READING`

Скрыть в AppSheet при первом проходе:

- `DEV ID`
- `VALID WINDOWS`
- `EXPECTED WINDOWS`

Если устройство пока одно, `DEV ID` только шумит интерфейс.

### `summary_daypart`

Оставить видимыми:

- `DATE`
- `PART`
- `WINDOWS VALID`
- `EXPECTED WINDOWS`
- `COVERAGE %`
- `DBA LEQ EST`
- `AVG TEMP C`
- `AVG HUM %`
- `MISSING WIN`

`AVG NOW %`, `AVG H %`, `AVG M %`, `AVG P2P`, `QUIET %` и `LOUD %`
оставить скрытыми как переходную относительную диагностику.

### `summary_levels`

Оставить видимыми:

- `DATE`
- `PART`
- `VALID WINDOWS`
- `SILENT %`
- `NORMAL %`
- `LOUD %`
- `PEAK %`

Числа `SILENT WIN / NORMAL WIN / LOUD WIN / PEAK WIN` можно сначала скрыть и вернуть позже, если понадобятся.

### `summary_health`

Оставить видимыми:

- `DATE`
- `WINDOWS UNIQUE`
- `WINDOWS VALID`
- `DUP EXTRA ROWS`
- `LOW SAMPLE WIN`
- `MISSING WIN`
- `FIRST TIME`
- `LAST TIME`
- `COVERAGE %`

`HAS LOG ROWS` можно скрыть в `v1`, если не нужен технический контроль активного дня.

## Рекомендуемые представления

### 1. `Overview`

Тип:

- `Deck` или `Table`

Источник:

- `SummaryConclusions`

Сортировка:

- сначала `DATE` по убыванию
- потом `PART` по порядку суток

Главная идея:

- один быстрый человеко-понятный экран
- читать `READING` как основной итог

### 2. `Daypart Detail`

Тип:

- `Table`

Источник:

- `SummaryDaypart`

Идея:

- точные агрегаты по `DAY / EVE / NGT`

### 3. `Level Mix`

Тип:

- `Table`

Источник:

- `SummaryLevels`

Идея:

- быстро смотреть структуру `SILENT / NORMAL / LOUD / PEAK`

### 4. `Data Health`

Тип:

- `Table`

Источник:

- `SummaryHealth`

Идея:

- отдельно следить за качеством данных, пропусками и малыми выборками

## Какие фильтры полезны сразу

Для `v1` достаточно:

- фильтр по `DATE`
- фильтр по `PART`

Если устройство позже станет не одно:

- добавить фильтр по `DEV ID`

## Какой экран делать стартовым

Стартовый экран:

- `Overview` на базе `summary_conclusions`

Почему:

- это самый быстрый человеко-читаемый слой
- он уже собирает в одном месте уровень, покрытие и короткий вывод
- он лучше всего подходит под мобильный `AppSheet`

## Точная настройка v1 в AppSheet

Ниже практический минимум, который лучше выставить сразу, чтобы потом не править всё руками.

### Таблица `SummaryConclusions`

Рекомендуемые типы колонок:

- `_RowNumber` -> `Number`, использовать как `Key`
- `DEV ID` -> `Text`
- `DATE` -> `Date`
- `PART` -> `Text`
- `DBA LEQ EST` -> `Decimal`
- `MAIN LEVEL` -> `Text`
- `MAIN SHARE %` -> `Percent` или `Number`
- `VALID WINDOWS` -> `Number`
- `EXPECTED WINDOWS` -> `Number`
- `COVERAGE %` -> `Percent` или `Number`
- `DATA CONFIDENCE` -> `Text`
- `LEVEL DOMINANCE` -> `Text`
- `READING` -> `LongText`

Практика для `v1`:

- `Label` лучше поставить на `READING`
- `DATE`, `PART`, `MAIN LEVEL`, `DATA CONFIDENCE`, `LEVEL DOMINANCE` оставить в основном карточном выводе
- `READING` оставить главным читаемым текстом

### Таблица `SummaryDaypart`

Рекомендуемые типы колонок:

- `_RowNumber` -> `Number`, `Key`
- `DATE` -> `Date`
- `PART` -> `Text`
- `WINDOWS TOTAL` -> `Number`
- `WINDOWS VALID` -> `Number`
- `EXPECTED WINDOWS` -> `Number`
- `COVERAGE %` -> `Percent` или `Number`
- `DBA LEQ EST` -> `Decimal`
- `AVG NOW %` -> `Percent` или `Number`
- `AVG H %` -> `Percent` или `Number`
- `AVG M %` -> `Percent` или `Number`
- `AVG P2P` -> `Number`
- `AVG TEMP C` -> `Decimal`
- `AVG HUM %` -> `Decimal`
- `QUIET %` -> `Percent` или `Number`
- `LOUD %` -> `Percent` или `Number`
- `SILENT WIN` -> `Number`
- `NORMAL WIN` -> `Number`
- `LOUD WIN` -> `Number`
- `PEAK WIN` -> `Number`
- `MISSING WIN` -> `Number`

### Таблица `SummaryLevels`

Рекомендуемые типы колонок:

- `_RowNumber` -> `Number`, `Key`
- `DATE` -> `Date`
- `PART` -> `Text`
- `VALID WINDOWS` -> `Number`
- `SILENT WIN` -> `Number`
- `NORMAL WIN` -> `Number`
- `LOUD WIN` -> `Number`
- `PEAK WIN` -> `Number`
- `SILENT %` -> `Percent` или `Number`
- `NORMAL %` -> `Percent` или `Number`
- `LOUD %` -> `Percent` или `Number`
- `PEAK %` -> `Percent` или `Number`

### Таблица `SummaryHealth`

Рекомендуемые типы колонок:

- `_RowNumber` -> `Number`, `Key`
- `DATE` -> `Date`
- `WINDOWS UNIQUE` -> `Number`
- `WINDOWS VALID` -> `Number`
- `DUP EXTRA ROWS` -> `Number`
- `LOW SAMPLE WIN` -> `Number`
- `MISSING WIN` -> `Number`
- `FIRST TIME` -> `Time`
- `LAST TIME` -> `Time`
- `HAS LOG ROWS` -> `Yes/No` или `Number`
- `COVERAGE %` -> `Percent` или `Number`

## Как лучше отсортировать `PART`

Обычная сортировка по тексту для `DAY / EVE / NGT` неудобна. Для `AppSheet v1` лучше сделать виртуальную колонку `PART_ORDER`.

Формула:

```appsheet
SWITCH(
  [PART],
  "DAY", 1,
  "EVE", 2,
  "NGT", 3,
  99
)
```

Потом сортировать так:

- сначала `DATE` по убыванию
- потом `PART_ORDER` по возрастанию

## Какие format rules полезны сразу

### Для `MAIN LEVEL`

Сделать 4 правила:

- `MAIN LEVEL = "SILENT"` -> мягкий зелёный
- `MAIN LEVEL = "NORMAL"` -> нейтральный жёлто-зелёный
- `MAIN LEVEL = "LOUD"` -> оранжевый
- `MAIN LEVEL = "PEAK"` -> красный

### Для `DATA CONFIDENCE`

Сделать 3 правила:

- `DATA CONFIDENCE = "GOOD"` -> зелёный
- `DATA CONFIDENCE = "PARTIAL"` -> жёлтый
- `DATA CONFIDENCE = "WEAK"` -> красный

Для `LEVEL DOMINANCE` выделить `MIXED` и `WEAK` как требующие осторожного чтения вывода.

### Для `summary_health`

Сделать отдельные предупреждающие правила:

- `MISSING WIN > 0` -> жёлтый/оранжевый
- `LOW SAMPLE WIN > 0` -> оранжевый
- `DUP EXTRA ROWS > 0` -> красный

## Какие view names лучше задать сразу

Чтобы потом не путаться, можно сразу использовать такие имена:

- `Overview`
- `Daypart Detail`
- `Level Mix`
- `Data Health`

Если потом добавятся дополнительные страницы:

- `Latest Day`
- `Health Alerts`
- `Coverage Review`

## Current App Refinement From Existing Screens

This section is for the current app state that already has:

- `Overview`
- `Dayparts`
- `Levels`
- `Health`
- `Noise`

The goal here is not to rebuild everything from zero.

The goal is to take the current app and make it easier to understand with the smallest useful configuration changes.

### 1. Fix `Overview` first

Current problem:

- it behaves like a raw row list
- it repeats `DAY / EVE / NGT`
- it does not surface the actual human conclusion strongly enough

What to change:

- keep `Overview` on `summary_conclusions`
- keep it as `Deck`
- set `READING` as the main label or main body text
- keep `DATE`, `PART`, `MAIN LEVEL`, `DATA CONFIDENCE`, and `LEVEL DOMINANCE` visible
- hide `DEV ID`, `VALID WINDOWS`, `EXPECTED WINDOWS`

What the user should read there:

- the conclusion sentence first
- the period second
- the confidence third

If `Overview` still reads like a table in disguise, it needs more simplification.

### 2. Trim `Dayparts`

Current problem:

- it already helps
- but it still shows more numbers than a beginner needs on the first reading

What to leave visible first:

- `PART`
- `DATE`
- `COVERAGE %`
- `DBA LEQ EST`
- `AVG TEMP C`
- `AVG HUM %`

What to hide at first:

- `DEV ID`
- `WINDOWS TOTAL`
- `AVG NOW %`
- `AVG H %`
- `AVG M %`
- `AVG P2P`
- `QUIET %`
- `LOUD %`
- `SILENT WIN`
- `NORMAL WIN`
- `LOUD WIN`
- `PEAK WIN`

The point of this screen is comparison, not exhaustiveness.

### 3. Trim `Levels`

Current problem:

- this screen is useful
- but the main meaning can get buried under duplicate count-style fields

What to leave visible first:

- `PART`
- `DATE`
- `SILENT %`
- `NORMAL %`
- `LOUD %`
- `PEAK %`

What to hide at first:

- `DEV ID`
- `VALID WINDOWS`
- `SILENT WIN`
- `NORMAL WIN`
- `LOUD WIN`
- `PEAK WIN`

This screen should answer:

- what kind of noise was most typical here

not:

- how many support columns can fit on one mobile table

### 4. Keep `Health` strict and short

Current problem:

- this screen is already close to useful
- but it should feel like a trust screen, not a secondary analytics table

What to leave visible first:

- `DATE`
- `WINDOWS VALID`
- `LOW SAMPLE WIN`
- `MISSING WIN`
- `COVERAGE %`

What to hide at first:

- `DEV ID`
- `WINDOWS UNIQUE`
- `DUP EXTRA ROWS`
- `FIRST TIME`
- `LAST TIME`
- `HAS LOG ROWS`

The user should read this screen as:

- good data
- partial data
- weak data

### 5. Reconsider `Noise`

Current problem:

- the dashboard exists
- but the current `pie + column` combination does not yet provide the clearest user answer

Recommended `v1` rule:

- if `Noise` does not explain more than `Overview + Dayparts + Levels`, demote it from the main navigation

Best immediate options:

- keep `Noise` as a secondary screen only
- or simplify it to one chart instead of two

The current `Noise Pie` is weak for first-time understanding because:

- it looks decorative
- it does not explain trust
- it does not explain dominant level clearly
- it competes with stronger table-based meaning from other screens

### 6. Hide unnecessary system views

For the current app, these should not remain visible to ordinary users:

- `clean_summary_10m_Detail`
- `summary_conclusions_Detail`
- `summary_daypart_Detail`
- `summary_health_Detail`
- `summary_levels_Detail`
- `summary_timeline_Detail`

These are useful as technical scaffolding, but not as part of the product reading flow.

### 7. Best first navigation order

For the current app state, the clean order is:

1. `Overview`
2. `Dayparts`
3. `Levels`
4. `Health`
5. `Noise` only if it still adds value after simplification

This order matches the intended reading flow:

1. understand the day
2. compare parts of the day
3. understand the dominant level mix
4. check whether the data is trustworthy
5. optionally inspect a visual comparison layer

## Самый быстрый сценарий сборки

Если хочется собрать `v1` без лишней возни, порядок такой:

1. Подключить только `summary_conclusions`, `summary_daypart`, `summary_levels`, `summary_health`
2. Для всех поставить `READ_ONLY`
3. Для всех использовать `_RowNumber` как `Key`
4. В `SummaryConclusions` сделать стартовый `Deck`
5. В остальных трёх сделать обычные `Table`
6. Добавить `PART_ORDER` как virtual column там, где есть `PART`
7. Повесить format rules на `MAIN LEVEL`, `DATA CONFIDENCE`, `LEVEL DOMINANCE`, `MISSING WIN`, `LOW SAMPLE WIN`

После обновления структуры листов выполнить в AppSheet `Data -> Columns -> Regenerate structure`
и проверить, что главным числовым полем стал `DBA LEQ EST`, а относительные
`AVG NOW/H/M/P2P` не возвращены в пользовательские экраны.

Такой порядок даст уже полезное мобильное приложение без вмешательства в текущую Google Sheets запись.

## Что делать позже

После `v1` логичный порядок такой:

1. Собрать `read-only` AppSheet только на `summary_*`
2. Проверить, достаточно ли `summary_conclusions` как главного экрана
3. Добавить цветовую логику по `DATA CONFIDENCE`, `LEVEL DOMINANCE` и `MAIN LEVEL`
4. Добавить отдельные `APP_KEY` колонки в `summary_*`, если понадобятся стабильные deep links
5. Только потом думать о подключении `clean_summary_10m`

## Чего специально не делаем сейчас

- не даём AppSheet писать в `log`
- не строим AppSheet на raw-листах
- не лезем в archive rotation
- не меняем `doPost(...)`
- не добавляем лишний промежуточный backend

Это специально совпадает с текущим проектным направлением:

- лёгкая read-only витрина
- без риска сломать рабочую запись устройства в Google Sheets
