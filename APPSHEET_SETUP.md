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
- `AVG NOW %`
- `MAIN LEVEL`
- `MAIN SHARE %`
- `COVERAGE %`
- `CONFIDENCE`
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
- `AVG NOW %`
- `AVG H %`
- `AVG M %`
- `AVG TEMP C`
- `AVG HUM %`
- `QUIET %`
- `LOUD %`
- `MISSING WIN`

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
- `AVG NOW %` -> `Percent` или `Number`
- `MAIN LEVEL` -> `Text`
- `MAIN SHARE %` -> `Percent` или `Number`
- `VALID WINDOWS` -> `Number`
- `EXPECTED WINDOWS` -> `Number`
- `COVERAGE %` -> `Percent` или `Number`
- `CONFIDENCE` -> `Text`
- `READING` -> `LongText`

Практика для `v1`:

- `Label` лучше поставить на `READING`
- `DATE`, `PART`, `MAIN LEVEL`, `CONFIDENCE` оставить в основном карточном выводе
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

### Для `CONFIDENCE`

Сделать 3 правила:

- `CONFIDENCE = "GOOD"` -> зелёный
- `CONFIDENCE = "PARTIAL"` -> жёлтый
- `CONFIDENCE = "WEAK"` -> красный

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

## Самый быстрый сценарий сборки

Если хочется собрать `v1` без лишней возни, порядок такой:

1. Подключить только `summary_conclusions`, `summary_daypart`, `summary_levels`, `summary_health`
2. Для всех поставить `READ_ONLY`
3. Для всех использовать `_RowNumber` как `Key`
4. В `SummaryConclusions` сделать стартовый `Deck`
5. В остальных трёх сделать обычные `Table`
6. Добавить `PART_ORDER` как virtual column там, где есть `PART`
7. Повесить format rules на `MAIN LEVEL`, `CONFIDENCE`, `MISSING WIN`, `LOW SAMPLE WIN`

Такой порядок даст уже полезное мобильное приложение без вмешательства в текущую Google Sheets запись.

## Что делать позже

После `v1` логичный порядок такой:

1. Собрать `read-only` AppSheet только на `summary_*`
2. Проверить, достаточно ли `summary_conclusions` как главного экрана
3. Добавить цветовую логику по `CONFIDENCE` и `MAIN LEVEL`
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
