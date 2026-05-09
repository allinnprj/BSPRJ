# Настройка Google Sheets

## Назначение

Этот файл — единый источник для обновления `Google Apps Script`.

Если мы меняем логику `Google Sheets` в прошивке, в этом файле должен лежать актуальный текст `Код.gs`, который можно сразу скопировать и вставить в `Apps Script`, не запрашивая отдельно полный код.

## Как использовать

1. Открой свою Google-таблицу.
2. Перейди в `Расширения` -> `Apps Script`.
3. Открой `Код.gs`.
4. Удали всё содержимое `Код.gs`.
5. Скопируй только код из секции `COPY THIS INTO APPS SCRIPT`.
6. Вставь его в `Код.gs`.
7. Сохрани.
8. Обнови развертывание:
   - `Развертывание`
   - `Управление развертываниями`
   - выбери текущее `Веб-приложение`
   - нажми на карандаш
   - `Развернуть`

## ЧТО КОПИРОВАТЬ

Копируй только блок JavaScript-кода из секции `COPY THIS INTO APPS SCRIPT`.

## ЧТО НЕ КОПИРОВАТЬ

Не копируй:

- заголовок `Настройка Google Sheets`
- текст инструкций
- markdown-ограждения вроде ```javascript и ```

## COPY THIS INTO APPS SCRIPT

```javascript
const HEADERS = [
  'DEV ID',
  'VER',
  'BUILD',
  'DATE',
  'T FROM',
  'T TO',
  'PART',
  'NOW %',
  'H %',
  'M %',
  'RAW MIN',
  'RAW MAX',
  'AVG P2P',
  'SIG',
  'WIN MIN',
  'QUIET',
  'LOUD',
  'SAMPLES'
];

function ensureLogSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('log');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('log');
  }

  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const headersMatch = HEADERS.every((header, index) => currentHeaders[index] === header);
  if (!headersMatch) {
    headerRange.setValues([HEADERS]);
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setBackgrounds([[
      '#d9ead3', '#d9ead3', '#d9ead3',
      '#cfe2f3', '#cfe2f3', '#cfe2f3', '#cfe2f3',
      '#fff2cc', '#fff2cc', '#fff2cc',
      '#f4cccc', '#f4cccc', '#f4cccc', '#f4cccc',
      '#ead1dc',
      '#d9d2e9', '#d9d2e9', '#d9d2e9'
    ]]);

  sheet.autoResizeColumns(1, HEADERS.length);

  if (sheet.getMaxRows() > 1) {
    sheet.getRange(2, 1, sheet.getMaxRows() - 1, HEADERS.length)
      .setHorizontalAlignment('center');
  }

  return sheet;
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, mode: 'GET' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = ensureLogSheet_();
  const data = JSON.parse(e.postData.contents);
  const valueOrBlank = (value) => value === undefined || value === null ? '' : value;

  sheet.appendRow([
    valueOrBlank(data.device_id),
    valueOrBlank(data.fw_version),
    valueOrBlank(data.build),
    valueOrBlank(data.date),
    valueOrBlank(data.time_from),
    valueOrBlank(data.time_to),
    valueOrBlank(data.part),
    valueOrBlank(data.avg_now_pct),
    valueOrBlank(data.avg_hour_pct),
    valueOrBlank(data.avg_total_pct),
    valueOrBlank(data.raw_min),
    valueOrBlank(data.raw_max),
    valueOrBlank(data.avg_peak_to_peak),
    valueOrBlank(data.signal),
    valueOrBlank(data.window_minutes),
    valueOrBlank(data.quiet_count),
    valueOrBlank(data.loud_count),
    valueOrBlank(data.samples)
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Сторона прошивки

In [secrets.h](D:/DEV/BS%20Test%20WPM/include/secrets.h):

```cpp
#define GOOGLE_SHEETS_SCRIPT_URL "https://script.google.com/macros/s/....../exec"
#define DEVICE_ID "bs-esp32-01"
```

## Что означают столбцы

- `DEV ID`: какой именно модуль отправил строку
- `VER`: версия прошивки
- `BUILD`: номер сборки/шага прошивки
- `DATE`: дата агрегированного окна
- `T FROM`: время начала окна
- `T TO`: время конца окна
- `PART`: часть суток, например `DAY` или `EVE`
- `NOW %`: средний текущий относительный уровень звука за окно
- `H %`: средний часовой уровень за окно
- `M %`: средний уровень с начала работы устройства за окно
- `RAW MIN`: минимальное сырое ADC-значение за окно
- `RAW MAX`: максимальное сырое ADC-значение за окно
- `AVG P2P`: среднее peak-to-peak значение за окно
- `SIG`: худшее состояние сигнала за окно, например `OK` или `CLIP`
- `WIN MIN`: длина окна в минутах
- `QUIET`: сколько тихих сэмплов было за окно
- `LOUD`: сколько громких сэмплов было за окно
- `SAMPLES`: сколько сэмплов вошло в агрегат

## Примечания

- Держи локальный `LittleFS` лог включенным как резерв.
- Если `GOOGLE_SHEETS_SCRIPT_URL` пустой, отправка в `Google Sheets` остается выключенной.
- Если позже мы меняем поведение `Apps Script`, этот файл тоже должен обновляться, чтобы ты всегда мог копировать код из одного места.
