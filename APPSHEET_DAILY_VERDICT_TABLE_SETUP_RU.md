# AppSheet Daily Verdict Table Setup

## Назначение

Этот файл нужен как понятная инструкция для команды:

- объяснение идет на русском
- все пункты меню, названия экранов, колонок и настройки оставлены на английском

Такой формат удобен, потому что:

- человеку проще понять смысл на русском
- в `AppSheet` он кликает точно по английским названиям без догадок

Инструкция описывает только настройку таблицы:

- `daily_verdict_table`

Цель этой настройки:

- одна строка на один день
- быстрый просмотр итогов по `DAY / EVE / NGT`
- единый вид у всех, кто будет собирать приложение

## Что должно уже быть

В `Google Sheets` должен существовать лист:

- `daily_verdict_table`

Ожидаемые колонки:

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

## Порядок настройки

Делать лучше именно в таком порядке:

1. `Data > Tables`
2. `Data > Columns`
3. `UX > Views`
4. `UX > Format Rules`

## 1. Data > Tables

Откройте:

- `Data > Tables`

Проверьте, что таблица добавлена:

- `daily_verdict_table`

Если таблицы нет:

- добавьте новую таблицу
- источником должен быть лист `daily_verdict_table`

Если таблица уже есть:

- убедитесь, что AppSheet подтянул все колонки из листа

## 2. Data > Columns

Откройте:

- `Data > Columns`
- выберите таблицу `daily_verdict_table`

Ниже точные настройки по каждой колонке.

### `_RowNumber`

- `Type`: `Number`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: пусто

Это служебное поле. Его пользователю показывать не нужно.

### `DEV ID`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: пусто

Сейчас лучше скрыть, потому что проект пока ориентирован на один активный
источник.

Если позже устройств станет несколько, это поле можно будет включить.

### `DATE`

- `Type`: `Date`
- `Key?`: `ON`
- `Label?`: `ON`
- `Show?`: `ON`
- `App formula`: пусто

Это текущий рабочий вариант для проекта.

Важно:

- пока устройство одно, `DATE` можно использовать как `Key`
- если потом на одну и ту же дату появятся строки от нескольких устройств,
  такой ключ уже станет небезопасным

### `DAY LEVEL`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `ON`
- `App formula`: пусто

### `EVE LEVEL`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `ON`
- `App formula`: пусто

### `NGT LEVEL`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `ON`
- `App formula`: пусто

### `DAY SHARE %`

- `Type`: `Percent`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: пусто

### `EVE SHARE %`

- `Type`: `Percent`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: пусто

### `NGT SHARE %`

- `Type`: `Percent`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: пусто

Эти поля полезны, но на первом экране пока не нужны. Они только перегружают
таблицу.

### `DAY CONF`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: пусто

### `EVE CONF`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: пусто

### `NGT CONF`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: пусто

### `DAY DOM`, `EVE DOM`, `NGT DOM`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `OFF`
- `App formula`: пусто

Эти поля показывают преобладание уровня отдельно от полноты данных `DAY/EVE/NGT CONF`.

Эти поля тоже лучше скрыть в `v1`.

### `VERDICT`

- `Type`: `Text`
- `Key?`: `OFF`
- `Label?`: `OFF`
- `Show?`: `ON`
- `App formula`: пусто

Это человеко-читаемое итоговое поле.

## Что должно остаться видимым

Оставьте `Show? = ON` только для:

- `DATE`
- `DAY LEVEL`
- `EVE LEVEL`
- `NGT LEVEL`
- `VERDICT`

Скрыть:

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

Откройте:

- `UX > Views`
- `New View`

Создайте основной экран с такими настройками.

### Основные параметры

- `View name`: `Daily Verdict`
- `For this data`: `daily_verdict_table`
- `View type`: `Table`
- `Position`: `Menu`
- `Display name`: `Daily Verdict`
- `Icon`: `assessment`
- `Prominence`: `Normal`

### Какие колонки показывать

Используйте именно такой порядок:

1. `DATE`
2. `DAY LEVEL`
3. `EVE LEVEL`
4. `NGT LEVEL`
5. `VERDICT`

Так экран будет коротким и читаемым.

### Сортировка

- `Sort by`: `DATE`
- `Order`: `Descending`

Это нужно для того, чтобы сверху всегда был самый свежий день.

### Группировка

- `Group by`: `None`

Группировку здесь лучше не включать, иначе экран станет тяжелее читать.

### Действия по строке

Оставить как есть.
Для `v1` никаких дополнительных `Event Actions` не нужно.

## 4. UX > Format Rules

Откройте:

- `UX > Format Rules`

Здесь важно понять главный принцип:

- одну строку нельзя красить как одно состояние
- потому что в одной строке могут быть разные значения:
  - `DAY = NORMAL`
  - `EVE = LOUD`
  - `NGT = SILENT`

Поэтому правильный вариант:

- не 4 правила на всю строку
- а 12 правил по отдельным колонкам

То есть:

- 4 правила для `DAY LEVEL`
- 4 правила для `EVE LEVEL`
- 4 правила для `NGT LEVEL`

## Цветовой стандарт

Используйте только эти цвета:

- `SILENT` -> `#d9ead3`
- `NORMAL` -> `#fff2cc`
- `LOUD` -> `#f9cb9c`
- `PEAK` -> `#f4cccc`

## 12 правил

Ниже готовый список правил, который надо создать.

### DAY LEVEL

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

### EVE LEVEL

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

### NGT LEVEL

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

## Какой результат должен получиться

После настройки экран `Daily Verdict` должен:

- показывать один день в одной строке
- сразу показывать `DAY / EVE / NGT`
- быть коротким и понятным
- использовать одинаковые цвета у всех участников команды

Экран должен ощущаться как:

- короткий дневной отчет по шуму

а не как:

- копия Google Sheets
- технический дебаг-экран
- склад аналитических колонок

## Важное допущение текущей версии

Эта инструкция исходит из того, что сейчас:

- активное устройство одно
- `DATE` можно использовать как `Key`

Если позже проект станет multi-device, нужно будет менять ключевую схему,
например:

- `DEV ID + DATE`

или

- отдельный `ROW KEY` из `Google Sheets`

Это уже следующий этап, не `v1`.
