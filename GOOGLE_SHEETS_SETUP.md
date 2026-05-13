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
  'TEMP C',
  'HUM %',
  'WIN MIN',
  'QUIET',
  'LOUD',
  'SAMPLES'
];

const ACTIVE_LOG_SHEET_NAME = 'log';
const DAILY_SHEET_NAME_FORMAT = 'DD-MM-YYYY'; // 'DD-MM-YYYY' or 'YYYY-MM-DD'
const HEADER_COLORS = [
  '#b7e1cd', '#b7e1cd', '#b7e1cd',
  '#cfe2f3', '#cfe2f3', '#cfe2f3', '#cfe2f3',
  '#ffe599', '#ffe599', '#ffe599',
  '#f9cb9c', '#f9cb9c', '#f9cb9c',
  '#d9b8f0',
  '#b7ead7', '#b7ead7',
  '#d9d2e9',
  '#ead1dc', '#f4cccc', '#d9d9d9'
];
const DATA_COLORS_ODD = [
  '#eef7f1', '#eef7f1', '#eef7f1',
  '#f2f8fd', '#f2f8fd', '#f2f8fd', '#f2f8fd',
  '#fff9e6', '#fff9e6', '#fff9e6',
  '#fef5ec', '#fef5ec', '#fef5ec',
  '#f8f1fc',
  '#eefaf5', '#eefaf5',
  '#f5f3fb',
  '#fbf3f7', '#fdf1f1', '#f5f5f5'
];
const DATA_COLORS_EVEN = [
  '#f7fbf8', '#f7fbf8', '#f7fbf8',
  '#f8fbfe', '#f8fbfe', '#f8fbfe', '#f8fbfe',
  '#fffdf3', '#fffdf3', '#fffdf3',
  '#fff9f4', '#fff9f4', '#fff9f4',
  '#fbf7fe',
  '#f6fcf9', '#f6fcf9',
  '#faf8fd',
  '#fdf8fb', '#fef7f7', '#fafafa'
];

function buildDataBackgrounds_(rowCount) {
  const backgrounds = [];
  for (let row = 0; row < rowCount; row++) {
    backgrounds.push((row % 2 === 0 ? DATA_COLORS_ODD : DATA_COLORS_EVEN).slice());
  }
  return backgrounds;
}

function ensureHeaderFormatting_(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const headersMatch = HEADERS.every((header, index) => currentHeaders[index] === header);
  if (!headersMatch) {
    headerRange.setValues([HEADERS]);
  }

  sheet.setFrozenRows(1);
  const fullHeaderRange = sheet.getRange(1, 1, 1, HEADERS.length);
  fullHeaderRange
    .setFontWeight('bold')
    .setFontSize(12)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true)
    .setBackgrounds([HEADER_COLORS]);

  fullHeaderRange.setBorder(true, true, true, true, true, true, '#666666', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.setRowHeight(1, 28);
  sheet.setColumnWidths(1, HEADERS.length, 72);
  sheet.setColumnWidth(1, 110);  // DEV ID
  sheet.setColumnWidth(2, 80);   // VER
  sheet.setColumnWidth(3, 60);   // BUILD
  sheet.setColumnWidth(4, 95);   // DATE
  sheet.setColumnWidth(5, 85);   // T FROM
  sheet.setColumnWidth(6, 85);   // T TO
  sheet.setColumnWidth(7, 60);   // PART
  sheet.setColumnWidth(8, 65);   // NOW
  sheet.setColumnWidth(9, 55);   // H
  sheet.setColumnWidth(10, 55);  // M
  sheet.setColumnWidth(11, 85);  // RAW MIN
  sheet.setColumnWidth(12, 85);  // RAW MAX
  sheet.setColumnWidth(13, 85);  // AVG P2P
  sheet.setColumnWidth(14, 75);  // SIG
  sheet.setColumnWidth(15, 75);  // TEMP
  sheet.setColumnWidth(16, 75);  // HUM
  sheet.setColumnWidth(17, 75);  // WIN MIN
  sheet.setColumnWidth(18, 70);  // QUIET
  sheet.setColumnWidth(19, 70);  // LOUD
  sheet.setColumnWidth(20, 80);  // SAMPLES

  const lastRow = Math.max(sheet.getLastRow(), 2);
  const dataRange = sheet.getRange(2, 1, lastRow - 1, HEADERS.length);
  dataRange
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(false)
    .setBorder(true, true, true, true, true, true, '#d9d9d9', SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange(2, 4, Math.max(lastRow - 1, 1), 1).setNumberFormat('dd-mm-yyyy');
  sheet.getRange(2, 5, Math.max(lastRow - 1, 1), 2).setNumberFormat('hh:mm:ss');

  if (lastRow > 1) {
    dataRange.setBackgrounds(buildDataBackgrounds_(lastRow - 1));
  }

  // Thick separators between logical blocks:
  // C|D, G|H, J|K, M|N, N|O, P|Q
  [3, 7, 10, 13, 14, 16].forEach((col) => {
    sheet.getRange(1, col, lastRow, 1)
      .setBorder(null, null, null, true, null, null, '#8a8a8a', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  });
}

function formatSheetDate_(dateText) {
  if (!dateText) {
    return '';
  }

  const normalized = normalizeDateText_(dateText);
  if (!normalized) {
    return '';
  }

  const parsed = new Date(normalized);
  const dd = Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'dd');
  const mm = Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'MM');
  const yy = Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yy');
  const yyyy = Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy');

  if (DAILY_SHEET_NAME_FORMAT === 'YYYY-MM-DD') {
    return `${yyyy}-${mm}-${dd}`;
  }

  if (DAILY_SHEET_NAME_FORMAT === 'DD-MM-YYYY') {
    return `${dd}-${mm}-${yyyy}`;
  }

  return `${dd}-${mm}-${yy}`;
}

function normalizeDateText_(value) {
  if (!value) {
    return '';
  }

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  const raw = String(value).trim();
  if (!raw) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  return raw;
}

function normalizeTimeText_(value) {
  if (!value) {
    return '';
  }

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm:ss');
  }

  const raw = String(value).trim();
  if (!raw) {
    return '';
  }

  const hhmmss = raw.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (hhmmss) {
    return `${hhmmss[1].padStart(2, '0')}:${hhmmss[2]}:${hhmmss[3]}`;
  }

  const hhmm = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    return `${hhmm[1].padStart(2, '0')}:${hhmm[2]}:00`;
  }

  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'HH:mm:ss');
  }

  return raw;
}

function getLastDataDate_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return '';
  }

  return normalizeDateText_(sheet.getRange(lastRow, 4).getValue());
}

function isIncomingDateNewer_(existingDateText, incomingDateText) {
  const existingNormalized = normalizeDateText_(existingDateText);
  const incomingNormalized = normalizeDateText_(incomingDateText);
  if (!existingNormalized || !incomingNormalized) {
    return false;
  }

  return incomingNormalized > existingNormalized;
}

function buildRecordKey_(deviceId, dateText, timeFromText, timeToText, partText) {
  return [
    String(deviceId || ''),
    normalizeDateText_(dateText),
    normalizeTimeText_(timeFromText),
    normalizeTimeText_(timeToText),
    String(partText || '')
  ].join('|');
}

function buildRecordKeyFromPayload_(data) {
  return buildRecordKey_(data.device_id, data.date, data.time_from, data.time_to, data.part);
}

function buildRecordKeyFromRow_(row) {
  return buildRecordKey_(row[0], row[3], row[4], row[5], row[6]);
}

function sheetHasRecordKey_(sheet, recordKey) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2 || !recordKey) {
    return false;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  return values.some((row) => buildRecordKeyFromRow_(row) === recordKey);
}

function appendLogRowsToArchive_(sourceSheet, targetSheet) {
  const sourceLastRow = sourceSheet.getLastRow();
  if (sourceLastRow < 2) {
    return;
  }

  const rowCount = sourceLastRow - 1;
  const sourceRange = sourceSheet.getRange(2, 1, rowCount, HEADERS.length);
  const values = sourceRange.getValues();
  const filteredValues = values.filter((row) => !sheetHasRecordKey_(targetSheet, buildRecordKeyFromRow_(row)));
  if (filteredValues.length === 0) {
    ensureHeaderFormatting_(targetSheet);
    return;
  }

  const targetStartRow = Math.max(targetSheet.getLastRow(), 1) + 1;
  targetSheet.getRange(targetStartRow, 1, filteredValues.length, HEADERS.length).setValues(filteredValues);
  ensureHeaderFormatting_(targetSheet);
}

function ensureWritableLogSheet_(incomingDateText) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(ACTIVE_LOG_SHEET_NAME);
  const normalizedIncomingDateText = normalizeDateText_(incomingDateText);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(ACTIVE_LOG_SHEET_NAME);
    ensureHeaderFormatting_(sheet);
    return sheet;
  }

  ensureHeaderFormatting_(sheet);

  const lastDataDate = getLastDataDate_(sheet);
  if (isIncomingDateNewer_(lastDataDate, normalizedIncomingDateText)) {
    const archivedSheetName = formatSheetDate_(lastDataDate);
    if (archivedSheetName && archivedSheetName !== ACTIVE_LOG_SHEET_NAME) {
      const existingArchive = spreadsheet.getSheetByName(archivedSheetName);
      if (!existingArchive) {
        sheet.setName(archivedSheetName);
        ensureHeaderFormatting_(sheet);
      } else {
        appendLogRowsToArchive_(sheet, existingArchive);
        spreadsheet.deleteSheet(sheet);
      }
    }

    sheet = spreadsheet.getSheetByName(ACTIVE_LOG_SHEET_NAME) || spreadsheet.insertSheet(ACTIVE_LOG_SHEET_NAME);
    ensureHeaderFormatting_(sheet);
  }

  return sheet;
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, mode: 'GET' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const valueOrBlank = (value) => value === undefined || value === null ? '' : value;
  const normalizedDate = normalizeDateText_(valueOrBlank(data.date));
  const normalizedTimeFrom = normalizeTimeText_(valueOrBlank(data.time_from));
  const normalizedTimeTo = normalizeTimeText_(valueOrBlank(data.time_to));
  const sheet = ensureWritableLogSheet_(normalizedDate);
  const recordKey = buildRecordKeyFromPayload_(data);

  if (sheetHasRecordKey_(sheet, recordKey)) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, deduped: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  sheet.appendRow([
    valueOrBlank(data.device_id),
    valueOrBlank(data.fw_version),
    valueOrBlank(data.build),
    normalizedDate,
    normalizedTimeFrom,
    normalizedTimeTo,
    valueOrBlank(data.part),
    valueOrBlank(data.avg_now_pct),
    valueOrBlank(data.avg_hour_pct),
    valueOrBlank(data.avg_total_pct),
    valueOrBlank(data.raw_min),
    valueOrBlank(data.raw_max),
    valueOrBlank(data.avg_peak_to_peak),
    valueOrBlank(data.signal),
    valueOrBlank(data.avg_temperature_c),
    valueOrBlank(data.avg_humidity_pct),
    valueOrBlank(data.window_minutes),
    valueOrBlank(data.quiet_count),
    valueOrBlank(data.loud_count),
    valueOrBlank(data.samples)
  ]);
  ensureHeaderFormatting_(sheet);

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
- `TEMP C`: средняя температура за окно, если `SHT31` был доступен
- `HUM %`: средняя влажность за окно, если `SHT31` был доступен
- `WIN MIN`: длина окна в минутах
- `QUIET`: сколько тихих сэмплов было за окно
- `LOUD`: сколько громких сэмплов было за окно
- `SAMPLES`: сколько сэмплов вошло в агрегат

## Примечания

- Держи локальный `LittleFS` лог включенным как резерв.
- Если `GOOGLE_SHEETS_SCRIPT_URL` пустой, отправка в `Google Sheets` остается выключенной.
- Если позже мы меняем поведение `Apps Script`, этот файл тоже должен обновляться, чтобы ты всегда мог копировать код из одного места.
- Активный лист для записи всегда называется `log`.
- Когда приходит запись уже с новой датой, старый лист `log` переименовывается в дату предыдущего дня, а новый лист снова создаётся под именем `log`.
- Если лист с такой датой уже существует, строки из старого `log` будут дописаны в этот дневной лист, а отдельный `_timestamp` лист больше не создаётся.
- Формат даты листа можно менять в строке:
  - `const DAILY_SHEET_NAME_FORMAT = 'DD-MM-YYYY';`
  - или:
  - `const DAILY_SHEET_NAME_FORMAT = 'YYYY-MM-DD';`
