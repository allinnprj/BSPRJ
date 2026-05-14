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
const CLEAN_SUMMARY_SHEET_NAME = 'clean_summary_10m';
const DAYPART_SUMMARY_SHEET_NAME = 'summary_daypart';
const LEVEL_SUMMARY_SHEET_NAME = 'summary_levels';
const HEALTH_SUMMARY_SHEET_NAME = 'summary_health';
const CHARTS_SHEET_NAME = 'charts';
const MIN_VALID_SAMPLES = 100;
const PART_ORDER = ['DAY', 'EVE', 'NGT'];
const LEVEL_ORDER = ['SILENT', 'NORMAL', 'LOUD', 'PEAK'];
const EXPECTED_WINDOWS_PER_PART = {
  DAY: 66,
  EVE: 36,
  NGT: 42
};
const CLEAN_SUMMARY_HEADERS = [
  'DEV ID',
  'VER',
  'BUILD',
  'DATE',
  'T FROM',
  'T TO',
  'PART',
  'LEVEL',
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
  'SAMPLES',
  'SOURCE SHEET',
  'DAY STATE',
  'RECORD KEY',
  'DUP COUNT',
  'IS DUPLICATED',
  'IS VALID',
  'GAP BEFORE',
  'QUALITY'
];
const DAYPART_SUMMARY_HEADERS = [
  'DEV ID',
  'DATE',
  'PART',
  'WINDOWS TOTAL',
  'WINDOWS VALID',
  'EXPECTED WINDOWS',
  'COVERAGE %',
  'AVG NOW %',
  'AVG H %',
  'AVG M %',
  'AVG P2P',
  'AVG TEMP C',
  'AVG HUM %',
  'QUIET %',
  'LOUD %',
  'SILENT WIN',
  'NORMAL WIN',
  'LOUD WIN',
  'PEAK WIN',
  'MISSING WIN'
];
const LEVEL_SUMMARY_HEADERS = [
  'DEV ID',
  'DATE',
  'PART',
  'VALID WINDOWS',
  'SILENT WIN',
  'NORMAL WIN',
  'LOUD WIN',
  'PEAK WIN',
  'SILENT %',
  'NORMAL %',
  'LOUD %',
  'PEAK %'
];
const HEALTH_SUMMARY_HEADERS = [
  'DEV ID',
  'DATE',
  'WINDOWS UNIQUE',
  'WINDOWS VALID',
  'DUP EXTRA ROWS',
  'LOW SAMPLE WIN',
  'MISSING WIN',
  'FIRST TIME',
  'LAST TIME',
  'HAS LOG ROWS',
  'COVERAGE %'
];
const SHEET_STYLE_PROFILES = {
  clean: {
    title: 'TECH LAYER · CLEAN 10M WINDOWS',
    titleColor: '#dce6f1',
    titleTextColor: '#2f3b52',
    headerColor: '#e9eff6',
    headerTextColor: '#334155',
    headerColors: [
      '#d9ead3', '#d9ead3', '#d9ead3',
      '#cfe2f3', '#cfe2f3', '#cfe2f3', '#cfe2f3',
      '#ffe599',
      '#ffe599', '#ffe599', '#ffe599',
      '#f9cb9c', '#f9cb9c', '#f9cb9c',
      '#d9b8f0',
      '#b7ead7', '#b7ead7',
      '#d9d2e9', '#ead1dc', '#f4cccc', '#d9d9d9',
      '#e8eaed', '#e8eaed', '#e8eaed',
      '#d0e0e3', '#d0e0e3', '#d0e0e3',
      '#fce5cd', '#f4cccc'
    ],
    bodyOdd: '#f8fafc',
    bodyEven: '#f1f5f9',
    accentCols: [4, 7, 8, 18, 21, 27, 29],
    accentColor: '#eef4ff',
    hideFromCol: 22,
    hideCount: 8,
    freezeCols: 7
  },
  summaryDaypart: {
    title: 'MAIN ANALYTICS · DAYPART SUMMARY',
    titleColor: '#d9ead3',
    titleTextColor: '#274e13',
    headerColor: '#eaf4e3',
    headerTextColor: '#274e13',
    headerColors: [
      '#d9ead3', '#cfe2f3', '#cfe2f3',
      '#d9d2e9', '#d9d2e9', '#d9d2e9', '#d9d2e9',
      '#ffe599', '#ffe599', '#ffe599', '#f9cb9c',
      '#b7ead7', '#b7ead7',
      '#ead1dc', '#f4cccc',
      '#d5f5e3', '#fff2cc', '#f9cb9c', '#ea9999',
      '#f4cccc'
    ],
    bodyOdd: '#fbfdf8',
    bodyEven: '#f3f8ec',
    accentCols: [3, 7, 8, 9, 10, 20],
    accentColor: '#fff7d6',
    freezeCols: 3
  },
  summaryLevels: {
    title: 'MAIN ANALYTICS · NOISE LEVEL MIX',
    titleColor: '#fff2cc',
    titleTextColor: '#7f6000',
    headerColor: '#fff7df',
    headerTextColor: '#7f6000',
    headerColors: [
      '#d9ead3', '#cfe2f3', '#cfe2f3',
      '#d9d2e9',
      '#d5f5e3', '#fff2cc', '#f9cb9c', '#ea9999',
      '#d5f5e3', '#fff2cc', '#f9cb9c', '#ea9999'
    ],
    bodyOdd: '#fffdfa',
    bodyEven: '#fff8ec',
    accentCols: [3, 4, 9, 10, 11, 12],
    accentColor: '#fff0c2',
    freezeCols: 3
  },
  summaryHealth: {
    title: 'QUALITY CONTROL · DATA HEALTH',
    titleColor: '#f4cccc',
    titleTextColor: '#7a1f1f',
    headerColor: '#fde9e7',
    headerTextColor: '#7a1f1f',
    headerColors: [
      '#d9ead3', '#cfe2f3',
      '#d9d2e9', '#d9d2e9',
      '#ead1dc', '#f4cccc', '#f4cccc',
      '#cfe2f3', '#cfe2f3',
      '#d0e0e3', '#f9cb9c'
    ],
    bodyOdd: '#fffafa',
    bodyEven: '#fff3f3',
    accentCols: [4, 5, 6, 7, 11],
    accentColor: '#ffe4e1',
    freezeCols: 2
  }
};
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

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('BS Noise')
    .addItem('Rebuild analytics', 'rebuildAnalytics_')
    .addItem('Rebuild charts only', 'rebuildAnalyticsCharts_')
    .addToUi();
}

function toNumber_(value) {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  const normalized = String(value).replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundValue_(value, digits) {
  const factor = Math.pow(10, digits || 0);
  return Math.round(value * factor) / factor;
}

function normalizePartText_(value) {
  const raw = String(value || '').trim().toUpperCase();
  if (raw === 'DAY' || raw === 'D') {
    return 'DAY';
  }
  if (raw === 'EVE' || raw === 'EVENING') {
    return 'EVE';
  }
  if (raw === 'NGT' || raw === 'NIGHT') {
    return 'NGT';
  }
  return raw || 'NGT';
}

function noiseLevelFromNowPct_(value) {
  const nowPct = toNumber_(value);
  if (nowPct <= 20) {
    return 'SILENT';
  }
  if (nowPct <= 40) {
    return 'NORMAL';
  }
  if (nowPct <= 60) {
    return 'LOUD';
  }
  return 'PEAK';
}

function isRawDaySheetName_(name) {
  return name === ACTIVE_LOG_SHEET_NAME ||
    /^\d{2}-\d{2}-\d{4}$/.test(name) ||
    /^\d{4}-\d{2}-\d{2}$/.test(name);
}

function listRawDataSheets_(spreadsheet) {
  return spreadsheet.getSheets().filter((sheet) => isRawDaySheetName_(sheet.getName()));
}

function timestampKey_(dateText, timeText) {
  return `${normalizeDateText_(dateText)}T${normalizeTimeText_(timeText)}`;
}

function timeToMinutes_(timeText) {
  const normalized = normalizeTimeText_(timeText);
  const match = normalized.match(/^(\d{2}):(\d{2}):\d{2}$/);
  if (!match) {
    return -1;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function buildQualityText_(record, isValid, gapBefore) {
  const flags = [];
  if (record.duplicateCount > 1) {
    flags.push('DUPLICATED');
  }
  if (!isValid) {
    flags.push('LOW_SAMPLES');
  }
  if (gapBefore > 0) {
    flags.push('GAP_BEFORE');
  }
  return flags.length > 0 ? flags.join('+') : 'OK';
}

function sortRecords_(records) {
  records.sort((left, right) => {
    const leftKey = `${left.dateText} ${left.timeFromText} ${left.deviceId} ${left.partText} ${left.sourceSheet}`;
    const rightKey = `${right.dateText} ${right.timeFromText} ${right.deviceId} ${right.partText} ${right.sourceSheet}`;
    if (leftKey < rightKey) {
      return -1;
    }
    if (leftKey > rightKey) {
      return 1;
    }
    return 0;
  });
}

function collectRawRecords_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const records = [];
  const sheets = listRawDataSheets_(spreadsheet);

  sheets.forEach((sheet) => {
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return;
    }

    const rowCount = lastRow - 1;
    const values = sheet.getRange(2, 1, rowCount, HEADERS.length).getValues();
    values.forEach((row) => {
      if (row.every((cell) => cell === '' || cell === null)) {
        return;
      }

      const dateText = normalizeDateText_(row[3]);
      const timeFromText = normalizeTimeText_(row[4]);
      const timeToText = normalizeTimeText_(row[5]);
      const partText = normalizePartText_(row[6]);
      const recordKey = buildRecordKey_(row[0], dateText, timeFromText, timeToText, partText);

      records.push({
        deviceId: String(row[0] || ''),
        versionText: String(row[1] || ''),
        buildText: String(row[2] || ''),
        dateText,
        timeFromText,
        timeToText,
        partText,
        nowPct: toNumber_(row[7]),
        hourPct: toNumber_(row[8]),
        totalPct: toNumber_(row[9]),
        rawMin: toNumber_(row[10]),
        rawMax: toNumber_(row[11]),
        avgPeakToPeak: toNumber_(row[12]),
        signalText: String(row[13] || ''),
        temperatureC: row[14] === '' ? '' : toNumber_(row[14]),
        humidityPct: row[15] === '' ? '' : toNumber_(row[15]),
        windowMinutes: toNumber_(row[16]),
        quietCount: toNumber_(row[17]),
        loudCount: toNumber_(row[18]),
        samples: toNumber_(row[19]),
        sourceSheet: sheet.getName(),
        dayState: sheet.getName() === ACTIVE_LOG_SHEET_NAME ? 'CURRENT' : 'ARCHIVE',
        recordKey
      });
    });
  });

  sortRecords_(records);

  const duplicateCounts = {};
  records.forEach((record) => {
    duplicateCounts[record.recordKey] = (duplicateCounts[record.recordKey] || 0) + 1;
  });

  records.forEach((record) => {
    record.duplicateCount = duplicateCounts[record.recordKey] || 1;
  });

  return records;
}

function buildCleanSummaryData_(records) {
  const uniqueRecords = [];
  const cleanRows = [];
  const seen = {};
  const previousByDeviceDate = {};

  records.forEach((record) => {
    if (seen[record.recordKey]) {
      return;
    }
    seen[record.recordKey] = true;

    const previousKey = `${record.deviceId}|${record.dateText}`;
    const previousRecord = previousByDeviceDate[previousKey];
    const currentMinutes = timeToMinutes_(record.timeFromText);
    let gapBefore = 0;
    if (previousRecord) {
      const previousMinutes = timeToMinutes_(previousRecord.timeFromText);
      if (currentMinutes >= 0 && previousMinutes >= 0) {
        const minuteDelta = currentMinutes - previousMinutes;
        if (minuteDelta > 10) {
          gapBefore = Math.max(Math.floor(minuteDelta / 10) - 1, 0);
        }
      }
    }

    previousByDeviceDate[previousKey] = record;
    record.gapBefore = gapBefore;
    record.levelText = noiseLevelFromNowPct_(record.nowPct);
    record.isDuplicated = record.duplicateCount > 1;
    record.isValid = record.samples >= MIN_VALID_SAMPLES;
    record.qualityText = buildQualityText_(record, record.isValid, gapBefore);

    cleanRows.push([
      record.deviceId,
      record.versionText,
      record.buildText,
      record.dateText,
      record.timeFromText,
      record.timeToText,
      record.partText,
      record.levelText,
      record.nowPct,
      record.hourPct,
      record.totalPct,
      record.rawMin,
      record.rawMax,
      record.avgPeakToPeak,
      record.signalText,
      record.temperatureC,
      record.humidityPct,
      record.windowMinutes,
      record.quietCount,
      record.loudCount,
      record.samples,
      record.sourceSheet,
      record.dayState,
      record.recordKey,
      record.duplicateCount,
      record.isDuplicated ? 1 : 0,
      record.isValid ? 1 : 0,
      gapBefore,
      record.qualityText
    ]);
    uniqueRecords.push(record);
  });

  return { cleanRows, uniqueRecords };
}

function ensureMetricBucket_(map, key, factory) {
  if (!map[key]) {
    map[key] = factory();
  }
  return map[key];
}

function buildDayPartSummaryRows_(records) {
  const buckets = {};

  records.forEach((record) => {
    const key = `${record.deviceId}|${record.dateText}|${record.partText}`;
    const bucket = ensureMetricBucket_(buckets, key, () => ({
      deviceId: record.deviceId,
      dateText: record.dateText,
      partText: record.partText,
      windowsTotal: 0,
      windowsValid: 0,
      sumNow: 0,
      sumHour: 0,
      sumTotal: 0,
      sumP2P: 0,
      sumTemp: 0,
      tempCount: 0,
      sumHum: 0,
      humCount: 0,
      quietSum: 0,
      loudSum: 0,
      sampleSum: 0,
      missingWindows: 0,
      levelCounts: {
        SILENT: 0,
        NORMAL: 0,
        LOUD: 0,
        PEAK: 0
      }
    }));

    bucket.windowsTotal++;
    bucket.missingWindows += record.gapBefore || 0;

    if (!record.isValid) {
      return;
    }

    bucket.windowsValid++;
    bucket.sumNow += record.nowPct;
    bucket.sumHour += record.hourPct;
    bucket.sumTotal += record.totalPct;
    bucket.sumP2P += record.avgPeakToPeak;
    bucket.quietSum += record.quietCount;
    bucket.loudSum += record.loudCount;
    bucket.sampleSum += record.samples;
    bucket.levelCounts[record.levelText] = (bucket.levelCounts[record.levelText] || 0) + 1;
    if (record.temperatureC !== '') {
      bucket.sumTemp += toNumber_(record.temperatureC);
      bucket.tempCount++;
    }
    if (record.humidityPct !== '') {
      bucket.sumHum += toNumber_(record.humidityPct);
      bucket.humCount++;
    }
  });

  const rows = Object.keys(buckets).map((key) => {
    const bucket = buckets[key];
    const expectedWindows = EXPECTED_WINDOWS_PER_PART[bucket.partText] || 0;
    const quietPct = bucket.sampleSum > 0 ? roundValue_(bucket.quietSum * 100 / bucket.sampleSum, 1) : '';
    const loudPct = bucket.sampleSum > 0 ? roundValue_(bucket.loudSum * 100 / bucket.sampleSum, 1) : '';

    return [
      bucket.deviceId,
      bucket.dateText,
      bucket.partText,
      bucket.windowsTotal,
      bucket.windowsValid,
      expectedWindows,
      expectedWindows > 0 ? roundValue_(bucket.windowsValid * 100 / expectedWindows, 1) : '',
      bucket.windowsValid > 0 ? roundValue_(bucket.sumNow / bucket.windowsValid, 1) : '',
      bucket.windowsValid > 0 ? roundValue_(bucket.sumHour / bucket.windowsValid, 1) : '',
      bucket.windowsValid > 0 ? roundValue_(bucket.sumTotal / bucket.windowsValid, 1) : '',
      bucket.windowsValid > 0 ? roundValue_(bucket.sumP2P / bucket.windowsValid, 1) : '',
      bucket.tempCount > 0 ? roundValue_(bucket.sumTemp / bucket.tempCount, 1) : '',
      bucket.humCount > 0 ? roundValue_(bucket.sumHum / bucket.humCount, 1) : '',
      quietPct,
      loudPct,
      bucket.levelCounts.SILENT || 0,
      bucket.levelCounts.NORMAL || 0,
      bucket.levelCounts.LOUD || 0,
      bucket.levelCounts.PEAK || 0,
      bucket.missingWindows
    ];
  });

  rows.sort((left, right) => {
    const leftKey = `${left[0]}|${left[1]}|${PART_ORDER.indexOf(left[2])}`;
    const rightKey = `${right[0]}|${right[1]}|${PART_ORDER.indexOf(right[2])}`;
    return leftKey < rightKey ? -1 : (leftKey > rightKey ? 1 : 0);
  });

  return rows;
}

function buildLevelSummaryRows_(records) {
  const buckets = {};

  records.forEach((record) => {
    if (!record.isValid) {
      return;
    }

    const key = `${record.deviceId}|${record.dateText}|${record.partText}`;
    const bucket = ensureMetricBucket_(buckets, key, () => ({
      deviceId: record.deviceId,
      dateText: record.dateText,
      partText: record.partText,
      validWindows: 0,
      levelCounts: {
        SILENT: 0,
        NORMAL: 0,
        LOUD: 0,
        PEAK: 0
      }
    }));

    bucket.validWindows++;
    bucket.levelCounts[record.levelText] = (bucket.levelCounts[record.levelText] || 0) + 1;
  });

  const rows = Object.keys(buckets).map((key) => {
    const bucket = buckets[key];
    const total = bucket.validWindows || 1;
    return [
      bucket.deviceId,
      bucket.dateText,
      bucket.partText,
      bucket.validWindows,
      bucket.levelCounts.SILENT || 0,
      bucket.levelCounts.NORMAL || 0,
      bucket.levelCounts.LOUD || 0,
      bucket.levelCounts.PEAK || 0,
      roundValue_((bucket.levelCounts.SILENT || 0) * 100 / total, 1),
      roundValue_((bucket.levelCounts.NORMAL || 0) * 100 / total, 1),
      roundValue_((bucket.levelCounts.LOUD || 0) * 100 / total, 1),
      roundValue_((bucket.levelCounts.PEAK || 0) * 100 / total, 1)
    ];
  });

  rows.sort((left, right) => {
    const leftKey = `${left[0]}|${left[1]}|${PART_ORDER.indexOf(left[2])}`;
    const rightKey = `${right[0]}|${right[1]}|${PART_ORDER.indexOf(right[2])}`;
    return leftKey < rightKey ? -1 : (leftKey > rightKey ? 1 : 0);
  });

  return rows;
}

function buildHealthSummaryRows_(records) {
  const buckets = {};

  records.forEach((record) => {
    const key = `${record.deviceId}|${record.dateText}`;
    const bucket = ensureMetricBucket_(buckets, key, () => ({
      deviceId: record.deviceId,
      dateText: record.dateText,
      uniqueWindows: 0,
      validWindows: 0,
      duplicateExtraRows: 0,
      lowSampleWindows: 0,
      missingWindows: 0,
      firstTime: '',
      lastTime: '',
      hasLogRows: 0
    }));

    bucket.uniqueWindows++;
    bucket.duplicateExtraRows += Math.max((record.duplicateCount || 1) - 1, 0);
    bucket.missingWindows += record.gapBefore || 0;
    if (!bucket.firstTime || record.timeFromText < bucket.firstTime) {
      bucket.firstTime = record.timeFromText;
    }
    if (!bucket.lastTime || record.timeToText > bucket.lastTime) {
      bucket.lastTime = record.timeToText;
    }
    if (record.sourceSheet === ACTIVE_LOG_SHEET_NAME) {
      bucket.hasLogRows = 1;
    }
    if (record.isValid) {
      bucket.validWindows++;
    } else {
      bucket.lowSampleWindows++;
    }
  });

  const rows = Object.keys(buckets).map((key) => {
    const bucket = buckets[key];
    return [
      bucket.deviceId,
      bucket.dateText,
      bucket.uniqueWindows,
      bucket.validWindows,
      bucket.duplicateExtraRows,
      bucket.lowSampleWindows,
      bucket.missingWindows,
      bucket.firstTime,
      bucket.lastTime,
      bucket.hasLogRows,
      roundValue_(bucket.validWindows * 100 / 144, 1)
    ];
  });

  rows.sort((left, right) => {
    const leftKey = `${left[0]}|${left[1]}`;
    const rightKey = `${right[0]}|${right[1]}`;
    return leftKey < rightKey ? -1 : (leftKey > rightKey ? 1 : 0);
  });

  return rows;
}

function getOrCreateSheet_(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function ensureMinColumnCount_(sheet, minColumns) {
  const currentColumns = sheet.getMaxColumns();
  if (currentColumns >= minColumns) {
    return;
  }

  sheet.insertColumnsAfter(currentColumns, minColumns - currentColumns);
}

function buildSolidBackgrounds_(rowCount, colCount, color) {
  return Array.from({ length: rowCount }, () => Array(colCount).fill(color));
}

function lightenHexColor_(hexColor, amount) {
  const hex = String(hexColor || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return '#ffffff';
  }

  const mix = Math.max(0, Math.min(1, amount));
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const nr = Math.round(r + (255 - r) * mix);
  const ng = Math.round(g + (255 - g) * mix);
  const nb = Math.round(b + (255 - b) * mix);
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function buildColumnColorBackgrounds_(rowCount, colors, lightenAmount) {
  const lightColors = colors.map((color) => lightenHexColor_(color, lightenAmount));
  return Array.from({ length: rowCount }, () => lightColors.slice());
}

function buildAlternatingBackgrounds_(rowCount, colCount, oddColor, evenColor) {
  const backgrounds = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const fill = rowIndex % 2 === 0 ? oddColor : evenColor;
    backgrounds.push(Array(colCount).fill(fill));
  }
  return backgrounds;
}

function getSheetStyleProfile_(sheetName) {
  if (sheetName === CLEAN_SUMMARY_SHEET_NAME) {
    return SHEET_STYLE_PROFILES.clean;
  }
  if (sheetName === DAYPART_SUMMARY_SHEET_NAME) {
    return SHEET_STYLE_PROFILES.summaryDaypart;
  }
  if (sheetName === LEVEL_SUMMARY_SHEET_NAME) {
    return SHEET_STYLE_PROFILES.summaryLevels;
  }
  if (sheetName === HEALTH_SUMMARY_SHEET_NAME) {
    return SHEET_STYLE_PROFILES.summaryHealth;
  }
  return null;
}

function applySheetRoleFormatting_(sheet, headers, outputLength, profile) {
  if (!profile) {
    return;
  }

  const dataRows = Math.max(outputLength - 1, 1);
  const totalCols = headers.length;
  const hiddenTailEnd = profile.hideFromCol && profile.hideCount
    ? profile.hideFromCol + profile.hideCount - 1
    : 0;
  ensureMinColumnCount_(sheet, Math.max(totalCols, hiddenTailEnd));

  const headerRange = sheet.getRange(1, 1, 1, totalCols);
  headerRange
    .setFontWeight('bold')
    .setFontSize(11)
    .setFontColor(profile.headerTextColor)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true)
    .setBorder(true, true, true, true, true, true, '#b7c4d1', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  if (profile.headerColors && profile.headerColors.length === totalCols) {
    headerRange.setBackgrounds([profile.headerColors]);
  } else {
    headerRange.setBackground(profile.headerColor);
  }

  const dataRange = sheet.getRange(2, 1, dataRows, totalCols);
  dataRange
    .setBackgrounds(
      profile.headerColors && profile.headerColors.length === totalCols
        ? buildColumnColorBackgrounds_(dataRows, profile.headerColors, 0.82)
        : buildAlternatingBackgrounds_(dataRows, totalCols, profile.bodyOdd, profile.bodyEven)
    )
    .setBorder(true, true, true, true, true, true, '#d7dde5', SpreadsheetApp.BorderStyle.SOLID)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(false);

  if (!profile.headerColors || profile.headerColors.length !== totalCols) {
    (profile.accentCols || []).forEach((col) => {
      if (col <= totalCols) {
        sheet.getRange(1, col, dataRows + 1, 1).setBackground(profile.accentColor);
      }
    });
  }

  sheet.setFrozenRows(1);
  if (profile.freezeCols) {
    sheet.setFrozenColumns(profile.freezeCols);
  }

  if (profile.hideFromCol && profile.hideCount) {
    sheet.hideColumns(profile.hideFromCol, profile.hideCount);
  }
}

function writeTableToSheet_(sheetName, headers, rows) {
  const sheet = getOrCreateSheet_(sheetName);
  ensureMinColumnCount_(sheet, headers.length);
  sheet.clearContents();
  sheet.clearFormats();
  sheet.clearConditionalFormatRules();
  sheet.getCharts().forEach((chart) => sheet.removeChart(chart));
  sheet.showColumns(1, sheet.getMaxColumns());
  sheet.setFrozenColumns(0);
  sheet.setHiddenGridlines(false);

  const output = [headers].concat(rows);
  sheet.getRange(1, 1, output.length, headers.length).setValues(output);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#d9eaf7')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
  sheet.getRange(2, 1, Math.max(output.length - 1, 1), headers.length)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(false);
  sheet.setRowHeight(1, 28);
  sheet.autoResizeColumns(1, headers.length);
  if (output.length > 1) {
    sheet.getRange(2, 1, output.length - 1, headers.length)
      .setBorder(true, true, true, true, true, true, '#d9d9d9', SpreadsheetApp.BorderStyle.SOLID);
  }

  if (headers.indexOf('DATE') >= 0) {
    const dateCol = headers.indexOf('DATE') + 1;
    sheet.getRange(2, dateCol, Math.max(output.length - 1, 1), 1).setNumberFormat('dd-mm-yyyy');
  }
  if (headers.indexOf('T FROM') >= 0) {
    const fromCol = headers.indexOf('T FROM') + 1;
    sheet.getRange(2, fromCol, Math.max(output.length - 1, 1), 1).setNumberFormat('hh:mm:ss');
  }
  if (headers.indexOf('T TO') >= 0) {
    const toCol = headers.indexOf('T TO') + 1;
    sheet.getRange(2, toCol, Math.max(output.length - 1, 1), 1).setNumberFormat('hh:mm:ss');
  }
  if (headers.indexOf('FIRST TIME') >= 0) {
    const firstCol = headers.indexOf('FIRST TIME') + 1;
    const lastCol = headers.indexOf('LAST TIME') + 1;
  sheet.getRange(2, firstCol, Math.max(output.length - 1, 1), 1).setNumberFormat('hh:mm:ss');
    sheet.getRange(2, lastCol, Math.max(output.length - 1, 1), 1).setNumberFormat('hh:mm:ss');
  }

  applySheetRoleFormatting_(sheet, headers, output.length, getSheetStyleProfile_(sheetName));
}

function buildChartSourceBlocks_(records) {
  const byDatePart = {};
  const levelMix = {
    SILENT: 0,
    NORMAL: 0,
    LOUD: 0,
    PEAK: 0
  };
  const coverageByDate = {};

  records.forEach((record) => {
    if (!record.isValid) {
      return;
    }

    const dateKey = record.dateText;
    byDatePart[dateKey] = byDatePart[dateKey] || {
      DAY: [],
      EVE: [],
      NGT: []
    };
    byDatePart[dateKey][record.partText].push(record.nowPct);
    levelMix[record.levelText] = (levelMix[record.levelText] || 0) + 1;

    const coverage = coverageByDate[dateKey] || { validWindows: 0, missingWindows: 0 };
    coverage.validWindows++;
    coverage.missingWindows += record.gapBefore || 0;
    coverageByDate[dateKey] = coverage;
  });

  const dayPartRows = Object.keys(byDatePart).sort().map((dateKey) => {
    const bucket = byDatePart[dateKey];
    return [
      dateKey,
      bucket.DAY.length ? roundValue_(bucket.DAY.reduce((sum, value) => sum + value, 0) / bucket.DAY.length, 1) : '',
      bucket.EVE.length ? roundValue_(bucket.EVE.reduce((sum, value) => sum + value, 0) / bucket.EVE.length, 1) : '',
      bucket.NGT.length ? roundValue_(bucket.NGT.reduce((sum, value) => sum + value, 0) / bucket.NGT.length, 1) : ''
    ];
  });

  const totalLevelWindows = LEVEL_ORDER.reduce((sum, level) => sum + (levelMix[level] || 0), 0) || 1;
  const levelMixRows = [[
    'ALL',
    roundValue_((levelMix.SILENT || 0) * 100 / totalLevelWindows, 1),
    roundValue_((levelMix.NORMAL || 0) * 100 / totalLevelWindows, 1),
    roundValue_((levelMix.LOUD || 0) * 100 / totalLevelWindows, 1),
    roundValue_((levelMix.PEAK || 0) * 100 / totalLevelWindows, 1)
  ]];

  const coverageRows = Object.keys(coverageByDate).sort().map((dateKey) => ([
    dateKey,
    coverageByDate[dateKey].validWindows,
    coverageByDate[dateKey].missingWindows
  ]));

  return {
    dayPartRows,
    levelMixRows,
    coverageRows
  };
}

function rebuildAnalyticsCharts_() {
  const cleanSheet = getOrCreateSheet_(CLEAN_SUMMARY_SHEET_NAME);
  const lastRow = cleanSheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getActiveSpreadsheet().toast('No clean summary data yet. Run rebuildAnalytics_ first.', 'BS Noise', 6);
    return;
  }

  const values = cleanSheet.getRange(2, 1, lastRow - 1, CLEAN_SUMMARY_HEADERS.length).getValues();
  const records = values.map((row) => ({
    dateText: normalizeDateText_(row[3]),
    partText: normalizePartText_(row[6]),
    nowPct: toNumber_(row[8]),
    levelText: String(row[7] || ''),
    isValid: toNumber_(row[26]) === 1,
    gapBefore: toNumber_(row[27])
  }));

  const chartBlocks = buildChartSourceBlocks_(records);
  const sheet = getOrCreateSheet_(CHARTS_SHEET_NAME);
  ensureMinColumnCount_(sheet, 8);
  sheet.clearContents();
  sheet.clearFormats();
  sheet.getCharts().forEach((chart) => sheet.removeChart(chart));
  sheet.showColumns(1, sheet.getMaxColumns());
  sheet.setFrozenRows(0);
  sheet.setFrozenColumns(0);
  sheet.setHiddenGridlines(true);

  sheet.getRange(1, 1, 1, 8).merge();
  sheet.getRange(1, 1).setValue('DASHBOARD · QUICK VIEW')
    .setFontWeight('bold')
    .setFontSize(14)
    .setHorizontalAlignment('left')
    .setBackground('#d9ead3')
    .setFontColor('#274e13');
  sheet.getRange(2, 1, 1, 8).merge();
  sheet.getRange(2, 1).setValue('Use charts for quick reading. Use summary_* sheets for exact numbers. Use clean_summary_10m only for technical checks.')
    .setFontSize(10)
    .setHorizontalAlignment('left')
    .setBackground('#eef7ea')
    .setFontColor('#4d5b45');

  const dayPartHeader = ['DATE', 'DAY AVG NOW %', 'EVE AVG NOW %', 'NGT AVG NOW %'];
  const levelHeader = ['SCOPE', 'SILENT %', 'NORMAL %', 'LOUD %', 'PEAK %'];
  const coverageHeader = ['DATE', 'VALID WINDOWS', 'MISSING WINDOWS'];

  sheet.getRange(4, 1, 1, 8).merge();
  sheet.getRange(4, 1).setValue('Chart data blocks below are helper ranges for the dashboard.')
    .setFontSize(9)
    .setBackground('#f3f6fa')
    .setFontColor('#5f6b7a');

  sheet.getRange(6, 1, 1, dayPartHeader.length).setValues([dayPartHeader]);
  if (chartBlocks.dayPartRows.length > 0) {
    sheet.getRange(7, 1, chartBlocks.dayPartRows.length, dayPartHeader.length).setValues(chartBlocks.dayPartRows);
  }

  const levelStartRow = Math.max(chartBlocks.dayPartRows.length + 10, 14);
  sheet.getRange(levelStartRow, 1, 1, levelHeader.length).setValues([levelHeader]);
  if (chartBlocks.levelMixRows.length > 0) {
    sheet.getRange(levelStartRow + 1, 1, chartBlocks.levelMixRows.length, levelHeader.length).setValues(chartBlocks.levelMixRows);
  }

  const coverageStartRow = Math.max(levelStartRow + chartBlocks.levelMixRows.length + 6, 22);
  sheet.getRange(coverageStartRow, 1, 1, coverageHeader.length).setValues([coverageHeader]);
  if (chartBlocks.coverageRows.length > 0) {
    sheet.getRange(coverageStartRow + 1, 1, chartBlocks.coverageRows.length, coverageHeader.length).setValues(chartBlocks.coverageRows);
  }

  sheet.getRange(6, 1, 1, dayPartHeader.length).setBackground('#eaf4e3').setFontWeight('bold');
  sheet.getRange(levelStartRow, 1, 1, levelHeader.length).setBackground('#fff7df').setFontWeight('bold');
  sheet.getRange(coverageStartRow, 1, 1, coverageHeader.length).setBackground('#fde9e7').setFontWeight('bold');
  sheet.getRange(7, 1, Math.max(chartBlocks.dayPartRows.length, 1), dayPartHeader.length).setBackgrounds(
    buildSolidBackgrounds_(Math.max(chartBlocks.dayPartRows.length, 1), dayPartHeader.length, '#fbfdf8')
  );
  sheet.getRange(levelStartRow + 1, 1, Math.max(chartBlocks.levelMixRows.length, 1), levelHeader.length).setBackgrounds(
    buildSolidBackgrounds_(Math.max(chartBlocks.levelMixRows.length, 1), levelHeader.length, '#fffdfa')
  );
  sheet.getRange(coverageStartRow + 1, 1, Math.max(chartBlocks.coverageRows.length, 1), coverageHeader.length).setBackgrounds(
    buildSolidBackgrounds_(Math.max(chartBlocks.coverageRows.length, 1), coverageHeader.length, '#fffafa')
  );
  sheet.autoResizeColumns(1, 5);

  const dayPartChart = sheet.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(sheet.getRange(6, 1, Math.max(chartBlocks.dayPartRows.length + 1, 2), dayPartHeader.length))
    .setNumHeaders(1)
    .setOption('title', 'Average NOW % by day part')
    .setOption('legend', { position: 'top' })
    .setOption('colors', ['#6aa84f', '#f6b26b', '#6d9eeb'])
    .setOption('backgroundColor', '#ffffff')
    .setOption('hAxis', { slantedText: false })
    .setOption('vAxis', { minValue: 0 })
    .setOption('chartArea', { left: 70, top: 55, width: '75%', height: '65%' })
    .setPosition(6, 7, 0, 0)
    .build();
  sheet.insertChart(dayPartChart);

  const levelChart = sheet.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(sheet.getRange(levelStartRow, 1, Math.max(chartBlocks.levelMixRows.length + 1, 2), levelHeader.length))
    .setNumHeaders(1)
    .setOption('title', 'Noise level mix')
    .setOption('isStacked', true)
    .setOption('legend', { position: 'top' })
    .setOption('colors', ['#93c47d', '#ffd966', '#f6b26b', '#e06666'])
    .setOption('backgroundColor', '#ffffff')
    .setOption('hAxis', { slantedText: false })
    .setOption('vAxis', { minValue: 0 })
    .setOption('chartArea', { left: 70, top: 55, width: '75%', height: '65%' })
    .setPosition(22, 7, 0, 0)
    .build();
  sheet.insertChart(levelChart);

  const coverageChart = sheet.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(sheet.getRange(coverageStartRow, 1, Math.max(chartBlocks.coverageRows.length + 1, 2), coverageHeader.length))
    .setNumHeaders(1)
    .setOption('title', 'Valid vs missing windows')
    .setOption('legend', { position: 'top' })
    .setOption('colors', ['#6d9eeb', '#e06666'])
    .setOption('backgroundColor', '#ffffff')
    .setOption('hAxis', { slantedText: false })
    .setOption('vAxis', { minValue: 0 })
    .setOption('chartArea', { left: 70, top: 55, width: '75%', height: '65%' })
    .setPosition(38, 7, 0, 0)
    .build();
  sheet.insertChart(coverageChart);
}

function rebuildAnalytics_() {
  const rawRecords = collectRawRecords_();
  const cleanData = buildCleanSummaryData_(rawRecords);

  writeTableToSheet_(CLEAN_SUMMARY_SHEET_NAME, CLEAN_SUMMARY_HEADERS, cleanData.cleanRows);
  writeTableToSheet_(DAYPART_SUMMARY_SHEET_NAME, DAYPART_SUMMARY_HEADERS, buildDayPartSummaryRows_(cleanData.uniqueRecords));
  writeTableToSheet_(LEVEL_SUMMARY_SHEET_NAME, LEVEL_SUMMARY_HEADERS, buildLevelSummaryRows_(cleanData.uniqueRecords));
  writeTableToSheet_(HEALTH_SUMMARY_SHEET_NAME, HEALTH_SUMMARY_HEADERS, buildHealthSummaryRows_(cleanData.uniqueRecords));
  rebuildAnalyticsCharts_();

  SpreadsheetApp.getActiveSpreadsheet().toast(
    `Analytics rebuilt: ${cleanData.uniqueRecords.length} unique windows from ${rawRecords.length} raw rows.`,
    'BS Noise',
    8
  );
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
