/**
 * BS Noise Google Sheets automation.
 *
 * Main sections:
 * 1. Configuration and schemas
 * 2. Sheet user interface
 * 3. Raw data and archive handling
 * 4. Telegram reports
 * 5. Automatic triggers
 * 6. Analytics
 * 7. Formatting and charts
 * 8. Web app entry points
 */

// === Configuration and schemas ===

const HEADERS = [
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
  'SIG IN',
  'TEMP C',
  'HUM %',
  'WIN MIN',
  'QUIET',
  'LOUD',
  'SAMPLES',
  'UPTIME',
  'P2P P95',
  'P2P MIN',
  'P2P MAX',
  'P2P STB MAX',
  'SESSION P2P MIN',
  'SESSION P2P MAX',
  'SESSION P2P STB MAX',
  'ENV OK',
  'ENV FAIL',
  'FREE HEAP',
  'MIN FREE HEAP',
  'BOOT SEQ',
  'RESET REASON',
  'ACOUSTIC REV',
  'DBA LEQ EST',
  'DBA VALID %',
  'DBA FAULTS',
  'DBA CLIPS'
];

const RAW_LOG_USER_HEADERS = [
  'DEV ID',
  'DATE',
  'T FROM',
  'T TO',
  'PART',
  'LEVEL',
  'NOW %',
  'H %',
  'M %',
  'AVG P2P',
  'DBA LEQ EST',
  'SIG IN',
  'TEMP C',
  'HUM %'
];
const RAW_LOG_TECHNICAL_HEADERS = HEADERS.filter((header) =>
  !RAW_LOG_USER_HEADERS.includes(header)
);

const ACTIVE_LOG_SHEET_NAME = 'log';
const DAILY_SHEET_NAME_FORMAT = 'DD-MM-YYYY'; // 'DD-MM-YYYY' or 'YYYY-MM-DD'
const CLEAN_SUMMARY_SHEET_NAME = 'clean_summary_10m';
const TIMELINE_SUMMARY_SHEET_NAME = 'summary_timeline';
const DAYPART_SUMMARY_SHEET_NAME = 'summary_daypart';
const LEVEL_SUMMARY_SHEET_NAME = 'summary_levels';
const HEALTH_SUMMARY_SHEET_NAME = 'summary_health';
const CONCLUSION_SUMMARY_SHEET_NAME = 'summary_conclusions';
const DAILY_VERDICT_SHEET_NAME = 'daily_verdict';
const DAILY_VERDICT_TABLE_SHEET_NAME = 'daily_verdict_table';
const CHARTS_SHEET_NAME = 'charts';
const TELEGRAM_STATS_URL = 'https://docs.google.com/spreadsheets/d/1DoGf95IYo3rvIdwAnyHVe2r0lP1txKe3gYVbe3XIMUQ/edit?pli=1&gid=1674242943#gid=1674242943';
const TELEGRAM_LOCAL_LOG_URL = 'http://192.168.11.124/';
const ANALYTICS_SHEET_NAMES = [
  CLEAN_SUMMARY_SHEET_NAME,
  TIMELINE_SUMMARY_SHEET_NAME,
  DAYPART_SUMMARY_SHEET_NAME,
  LEVEL_SUMMARY_SHEET_NAME,
  HEALTH_SUMMARY_SHEET_NAME,
  CONCLUSION_SUMMARY_SHEET_NAME,
  DAILY_VERDICT_SHEET_NAME,
  DAILY_VERDICT_TABLE_SHEET_NAME,
  CHARTS_SHEET_NAME
];
const USER_MODE_VISIBLE_SHEET_NAMES = [
  ACTIVE_LOG_SHEET_NAME,
  DAILY_VERDICT_TABLE_SHEET_NAME,
  CHARTS_SHEET_NAME
];
const TELEGRAM_ENABLED_PROPERTY = 'BS_TELEGRAM_ENABLED';
const TELEGRAM_BOT_TOKEN_PROPERTY = 'BS_TELEGRAM_BOT_TOKEN';
const TELEGRAM_CHAT_ID_PROPERTY = 'BS_TELEGRAM_CHAT_ID';
const AUTO_ANALYTICS_ENABLED_PROPERTY = 'BS_AUTO_ANALYTICS_ENABLED';
const AUTO_ANALYTICS_INTERVAL_MINUTES = 10;
const AUTO_HIDE_ARCHIVE_SHEETS_ENABLED_PROPERTY = 'BS_AUTO_HIDE_ARCHIVE_SHEETS_ENABLED';
const AUTO_HIDE_ARCHIVE_SHEETS_HOUR = 3;
const TELEGRAM_AUTO_DAILY_ENABLED_PROPERTY = 'BS_TELEGRAM_AUTO_DAILY_ENABLED';
const TELEGRAM_AUTO_DAILY_LAST_SENT_DATE_PROPERTY = 'BS_TELEGRAM_AUTO_DAILY_LAST_SENT_DATE';
const AUTO_DAILY_LOCK_WAIT_MILLISECONDS = 300000;
const USER_INTERFACE_MODE_PROPERTY = 'BS_USER_INTERFACE_MODE';
const USER_INTERFACE_MODE_USER = 'USER';
const USER_INTERFACE_MODE_TECHNICAL = 'TECHNICAL';
const DIAGNOSTICS_STATE_CACHE_PROPERTY = 'BS_DIAGNOSTICS_STATE_CACHE';
const DIAGNOSTICS_STATE_UNKNOWN = 'CHECK';
const MIN_VALID_SAMPLES = 100;
const DBA_MIN_VALID_COVERAGE_PERCENT = 95;
const DBA_LEVEL_SILENT_MAX = 56;
const DBA_LEVEL_NORMAL_MAX = 62;
const DBA_LEVEL_LOUD_MAX = 66;
const PART_ORDER = ['DAY', 'EVE', 'NGT'];
const LEVEL_ORDER = ['SILENT', 'NORMAL', 'LOUD', 'PEAK'];
const MIXED_NORMAL_LOUD_MAX_GAP_PCT = 10;
const STRONG_LEVEL_SHARE_PCT = 60;
const STRONG_LEVEL_LEAD_PCT = 20;
const CLEAR_LEVEL_SHARE_PCT = 50;
const CLEAR_LEVEL_LEAD_PCT = 10;
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
  'SIG IN',
  'TEMP C',
  'HUM %',
  'WIN MIN',
  'QUIET',
  'LOUD',
  'SAMPLES',
  'UPTIME',
  'SOURCE SHEET',
  'DAY STATE',
  'RECORD KEY',
  'DUP COUNT',
  'IS DUPLICATED',
  'IS VALID',
  'GAP BEFORE',
  'QUALITY',
  'DBA LEQ EST'
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
  'MISSING WIN',
  'DBA LEQ EST'
];
const TIMELINE_SUMMARY_HEADERS = [
  'DEV ID',
  'DATE',
  'TS',
  'T FROM',
  'T TO',
  'PART',
  'LEVEL',
  'NOW %',
  'SILENT FLAG',
  'NORMAL FLAG',
  'LOUD FLAG',
  'PEAK FLAG'
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
  'COVERAGE %',
  'SIGNAL ISSUE WIN',
  'ENV FAIL WIN',
  'ENV FAIL SAMPLES',
  'MIN FREE HEAP',
  'RESET ISSUE WIN'
];
const CONCLUSION_SUMMARY_HEADERS = [
  'DEV ID',
  'DATE',
  'PART',
  'DBA LEQ EST',
  'MAIN LEVEL',
  'MAIN SHARE %',
  'VALID WINDOWS',
  'EXPECTED WINDOWS',
  'COVERAGE %',
  'DATA CONFIDENCE',
  'LEVEL DOMINANCE',
  'READING'
];
const DAILY_VERDICT_HEADERS = [
  'DEV ID',
  'DATE',
  'PART',
  'MAIN LEVEL',
  'VERDICT SCORE',
  'SILENT FLAG',
  'NORMAL FLAG',
  'LOUD FLAG',
  'PEAK FLAG',
  'MAIN SHARE %',
  'COVERAGE %',
  'DATA CONFIDENCE',
  'LEVEL DOMINANCE',
  'READING'
];
const DAILY_VERDICT_TABLE_HEADERS = [
  'DEV ID',
  'DATE',
  'DAY LEVEL',
  'EVE LEVEL',
  'NGT LEVEL',
  'DAY SHARE %',
  'EVE SHARE %',
  'NGT SHARE %',
  'DAY CONF',
  'EVE CONF',
  'NGT CONF',
  'DAY DOM',
  'EVE DOM',
  'NGT DOM',
  'VERDICT'
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
      '#d9d2e9', '#ead1dc', '#f4cccc', '#d9d9d9', '#d9d9d9',
      '#e8eaed', '#e8eaed', '#e8eaed',
      '#d0e0e3', '#d0e0e3', '#d0e0e3',
      '#fce5cd', '#f4cccc', '#cfe2f3'
    ],
    bodyOdd: '#f8fafc',
    bodyEven: '#f1f5f9',
    accentCols: [4, 7, 8, 18, 21, 27, 29],
    accentColor: '#eef4ff',
    hideFromCol: 23,
    hideCount: 9,
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
      '#f4cccc', '#cfe2f3'
    ],
    bodyOdd: '#fbfdf8',
    bodyEven: '#f3f8ec',
    accentCols: [3, 7, 8, 9, 10, 20, 21],
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
  summaryTimeline: {
    title: 'MAIN ANALYTICS · TIMELINE',
    titleColor: '#cfe2f3',
    titleTextColor: '#134f5c',
    headerColor: '#eaf4fb',
    headerTextColor: '#134f5c',
    headerColors: [
      '#d9ead3', '#cfe2f3', '#cfe2f3', '#cfe2f3', '#d9d2e9', '#ffe599', '#ffe599',
      '#d5f5e3', '#fff2cc', '#f9cb9c', '#ea9999'
    ],
    bodyOdd: '#f8fbfe',
    bodyEven: '#f1f7fb',
    accentCols: [5, 6, 7, 8, 9, 10, 11],
    accentColor: '#e7f1f8',
    freezeCols: 5
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
      '#d0e0e3', '#f9cb9c',
      '#f4cccc', '#f4cccc', '#f4cccc', '#d9d2e9', '#f4cccc'
    ],
    bodyOdd: '#fffafa',
    bodyEven: '#fff3f3',
    accentCols: [4, 5, 6, 7, 11],
    accentColor: '#ffe4e1',
    freezeCols: 2
  },
  summaryConclusions: {
    title: 'MAIN ANALYTICS · HUMAN SUMMARY',
    titleColor: '#d0e0e3',
    titleTextColor: '#134f5c',
    headerColor: '#eaf4f6',
    headerTextColor: '#134f5c',
    headerColors: [
      '#d9ead3', '#cfe2f3', '#cfe2f3',
      '#ffe599', '#ffe599', '#fff2cc',
      '#d9d2e9', '#d9d2e9', '#d9d2e9',
      '#d0e0e3', '#ead1dc', '#d0e0e3'
    ],
    bodyOdd: '#f8fcfd',
    bodyEven: '#f1f8fa',
    accentCols: [4, 5, 6, 9, 10, 11, 12],
    accentColor: '#e7f4f7',
    freezeCols: 3
  },
  dailyVerdict: {
    title: 'MAIN ANALYTICS · DAILY VERDICT',
    titleColor: '#fce5cd',
    titleTextColor: '#7f6000',
    headerColor: '#fff3df',
    headerTextColor: '#7f6000',
    headerColors: [
      '#d9ead3', '#cfe2f3', '#cfe2f3',
      '#ffe599', '#ffe599',
      '#d5f5e3', '#fff2cc', '#f9cb9c', '#ea9999',
      '#fff2cc', '#d9d2e9', '#d0e0e3', '#ead1dc', '#d0e0e3'
    ],
    bodyOdd: '#fffdf8',
    bodyEven: '#fff8ee',
    accentCols: [3, 4, 5, 10, 11, 12, 13, 14],
    accentColor: '#fff4d8',
    freezeCols: 3
  },
  dailyVerdictTable: {
    title: 'MAIN ANALYTICS · DAILY VERDICT TABLE',
    titleColor: '#d9ead3',
    titleTextColor: '#274e13',
    headerColor: '#eef7ea',
    headerTextColor: '#274e13',
    headerColors: [
      '#d9ead3', '#cfe2f3',
      '#fff2cc', '#f9cb9c', '#d5f5e3',
      '#fff2cc', '#f9cb9c', '#d5f5e3',
      '#d0e0e3', '#d0e0e3', '#d0e0e3',
      '#ead1dc', '#ead1dc', '#ead1dc',
      '#fce5cd'
    ],
    bodyOdd: '#fbfdf8',
    bodyEven: '#f4f9ef',
    accentCols: [3, 4, 5, 12, 13, 14, 15],
    accentColor: '#fff7d6',
    freezeCols: 2
  }
};
const HEADER_WIDTH_OVERRIDES = {
  'DEV ID': 110,
  'VER': 80,
  'BUILD': 70,
  'DATE': 95,
  'T FROM': 85,
  'T TO': 85,
  'PART': 70,
  'LEVEL': 85,
  'NOW %': 75,
  'H %': 60,
  'M %': 60,
  'RAW MIN': 90,
  'RAW MAX': 90,
  'AVG P2P': 95,
  'SIG IN': 80,
  'TEMP C': 80,
  'HUM %': 80,
  'WIN MIN': 85,
  'QUIET': 70,
  'LOUD': 70,
  'SAMPLES': 85,
  'UPTIME': 100,
  'AVG NOW %': 105,
  'MAIN LEVEL': 115,
  'VERDICT SCORE': 105,
  'DAY LEVEL': 105,
  'EVE LEVEL': 105,
  'NGT LEVEL': 105,
  'DAY SHARE %': 105,
  'EVE SHARE %': 105,
  'NGT SHARE %': 105,
  'DAY CONF': 95,
  'EVE CONF': 95,
  'NGT CONF': 95,
  'DAY DOM': 95,
  'EVE DOM': 95,
  'NGT DOM': 95,
  'MAIN SHARE %': 110,
  'VALID WINDOWS': 100,
  'EXPECTED WINDOWS': 120,
  'COVERAGE %': 115,
  'DATA CONFIDENCE': 125,
  'LEVEL DOMINANCE': 130,
  'READING': 260,
  'WINDOWS TOTAL': 105,
  'WINDOWS VALID': 105,
  'EXPECTED WINDOWS': 120,
  'AVG TEMP C': 95,
  'AVG HUM %': 95,
  'SILENT WIN': 90,
  'NORMAL WIN': 95,
  'PEAK WIN': 85,
  'MISSING WIN': 95,
  'VALID WINDOWS': 100,
  'SILENT %': 85,
  'NORMAL %': 90,
  'LOUD %': 80,
  'PEAK %': 80,
  'WINDOWS UNIQUE': 110,
  'DUP EXTRA ROWS': 110,
  'LOW SAMPLE WIN': 110,
  'FIRST TIME': 90,
  'LAST TIME': 90,
  'HAS LOG ROWS': 105,
  'SOURCE SHEET': 110,
  'DAY STATE': 95,
  'RECORD KEY': 130,
  'DUP COUNT': 85,
  'IS DUPLICATED': 105,
  'IS VALID': 80,
  'GAP BEFORE': 90,
  'QUALITY': 95,
  'P2P P95': 90,
  'P2P MIN': 90,
  'P2P MAX': 90,
  'P2P STB MAX': 105,
  'SESSION P2P MIN': 120,
  'SESSION P2P MAX': 120,
  'SESSION P2P STB MAX': 145,
  'ENV OK': 80,
  'ENV FAIL': 85,
  'FREE HEAP': 100,
  'MIN FREE HEAP': 115,
  'BOOT SEQ': 90,
  'RESET REASON': 115,
  'ACOUSTIC REV': 115,
  'DBA LEQ EST': 110,
  'DBA VALID %': 105,
  'DBA FAULTS': 100,
  'DBA CLIPS': 95,
  'MAIN LEVEL': 115,
  'MAIN SHARE %': 110,
  'READING': 260
};
const HEADER_COLORS = [
  '#b7e1cd', '#b7e1cd', '#b7e1cd',
  '#cfe2f3', '#cfe2f3', '#cfe2f3', '#cfe2f3',
  '#ffe599',
  '#ffe599', '#ffe599', '#ffe599',
  '#f9cb9c', '#f9cb9c', '#f9cb9c',
  '#d9b8f0',
  '#b7ead7', '#b7ead7',
  '#d9d2e9',
  '#ead1dc', '#f4cccc', '#d9d9d9', '#d9d9d9',
  '#f9cb9c', '#f9cb9c', '#f9cb9c', '#f9cb9c',
  '#f9cb9c', '#f9cb9c', '#f9cb9c',
  '#b7ead7', '#b7ead7',
  '#d9d9d9', '#d9d9d9',
  '#d9d2e9', '#d9d2e9', '#d9ead3', '#cfe2f3',
  '#d9d9d9', '#d9d9d9', '#d9d9d9'
];
const DATA_COLORS_ODD = [
  '#eef7f1', '#eef7f1', '#eef7f1',
  '#f2f8fd', '#f2f8fd', '#f2f8fd', '#f2f8fd',
  '#fff9e6',
  '#fff9e6', '#fff9e6', '#fff9e6',
  '#fef5ec', '#fef5ec', '#fef5ec',
  '#f8f1fc',
  '#eefaf5', '#eefaf5',
  '#f5f3fb',
  '#fbf3f7', '#fdf1f1', '#f5f5f5', '#f5f5f5',
  '#fef5ec', '#fef5ec', '#fef5ec', '#fef5ec',
  '#fef5ec', '#fef5ec', '#fef5ec',
  '#eefaf5', '#eefaf5',
  '#f5f5f5', '#f5f5f5',
  '#f5f3fb', '#f5f3fb', '#eef7f1', '#f2f8fd',
  '#f5f5f5', '#f5f5f5', '#f5f5f5'
];
const DATA_COLORS_EVEN = [
  '#f7fbf8', '#f7fbf8', '#f7fbf8',
  '#f8fbfe', '#f8fbfe', '#f8fbfe', '#f8fbfe',
  '#fffdf3',
  '#fffdf3', '#fffdf3', '#fffdf3',
  '#fff9f4', '#fff9f4', '#fff9f4',
  '#fbf7fe',
  '#f6fcf9', '#f6fcf9',
  '#faf8fd',
  '#fdf8fb', '#fef7f7', '#fafafa', '#fafafa',
  '#fff9f4', '#fff9f4', '#fff9f4', '#fff9f4',
  '#fff9f4', '#fff9f4', '#fff9f4',
  '#f6fcf9', '#f6fcf9',
  '#fafafa', '#fafafa',
  '#faf8fd', '#faf8fd', '#f7fbf8', '#f8fbfe',
  '#fafafa', '#fafafa', '#fafafa'
];

function buildDataBackgrounds_(rowCount) {
  const backgrounds = [];
  for (let row = 0; row < rowCount; row++) {
    backgrounds.push((row % 2 === 0 ? DATA_COLORS_ODD : DATA_COLORS_EVEN).slice());
  }
  return backgrounds;
}

function buildDataBackgroundsForSheetRows_(startRow, rowCount) {
  const backgrounds = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const dataRowIndex = startRow + rowIndex - 2;
    backgrounds.push((dataRowIndex % 2 === 0 ? DATA_COLORS_ODD : DATA_COLORS_EVEN).slice());
  }
  return backgrounds;
}

function noiseLevelFromMaybeP2p_(value) {
  if (!hasDisplayValue_(value)) {
    return '';
  }
  return noiseLevelFromP2p_(value);
}

function migrateRawSheetLevelColumnIfNeeded_(sheet) {
  if (!sheet || sheet.getLastColumn() < 8) {
    return;
  }

  const headerWidth = Math.min(sheet.getLastColumn(), HEADERS.length);
  const currentHeaders = sheet.getRange(1, 1, 1, headerWidth).getValues()[0];
  const looksLikeOldRawHeader = currentHeaders[6] === 'PART' &&
    currentHeaders[7] === 'NOW %' &&
    currentHeaders[8] === 'H %';
  if (!looksLikeOldRawHeader) {
    return;
  }

  sheet.insertColumnAfter(7);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const rowCount = lastRow - 1;
    const levelValues = Array.from({ length: rowCount }, () => ['NO DATA']);
    sheet.getRange(2, 8, rowCount, 1).setValues(levelValues);
  }
}

function ensureHeaderRowValues_(sheet) {
  migrateRawSheetLevelColumnIfNeeded_(sheet);
  ensureMinColumnCount_(sheet, HEADERS.length);
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const headersMatch = HEADERS.every((header, index) => currentHeaders[index] === header);
  if (!headersMatch) {
    headerRange.setValues([HEADERS]);
  }
}

function ensureRawHeaderFormatting_(sheet) {
  ensureHeaderRowValues_(sheet);

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(0);
  sheet.setHiddenGridlines(false);
  const fullHeaderRange = sheet.getRange(1, 1, 1, HEADERS.length);
  fullHeaderRange
    .setFontWeight('bold')
    .setFontSize(11)
    .setFontColor('#274e13')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true)
    .setBackgrounds([HEADER_COLORS]);

  fullHeaderRange.setBorder(true, true, true, true, true, true, '#666666', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}

function ensureHeaderFormatting_(sheet) {
  ensureRawHeaderFormatting_(sheet);

  sheet.setColumnWidths(1, HEADERS.length, 72);
  sheet.setColumnWidth(1, 110);  // DEV ID
  sheet.setColumnWidth(2, 80);   // VER
  sheet.setColumnWidth(3, 60);   // BUILD
  sheet.setColumnWidth(4, 95);   // DATE
  sheet.setColumnWidth(5, 85);   // T FROM
  sheet.setColumnWidth(6, 85);   // T TO
  sheet.setColumnWidth(7, 60);   // PART
  sheet.setColumnWidth(8, 85);   // LEVEL
  sheet.setColumnWidth(9, 65);   // NOW
  sheet.setColumnWidth(10, 55);  // H
  sheet.setColumnWidth(11, 55);  // M
  sheet.setColumnWidth(12, 85);  // RAW MIN
  sheet.setColumnWidth(13, 85);  // RAW MAX
  sheet.setColumnWidth(14, 85);  // AVG P2P
  sheet.setColumnWidth(15, 75);  // SIG IN
  sheet.setColumnWidth(16, 75);  // TEMP
  sheet.setColumnWidth(17, 75);  // HUM
  sheet.setColumnWidth(18, 75);  // WIN MIN
  sheet.setColumnWidth(19, 70);  // QUIET
  sheet.setColumnWidth(20, 70);  // LOUD
  sheet.setColumnWidth(21, 80);  // SAMPLES
  sheet.setColumnWidth(37, 110); // DBA LEQ EST
  sheet.setColumnWidth(38, 105); // DBA VALID %
  sheet.setColumnWidth(39, 100); // DBA FAULTS
  sheet.setColumnWidth(40, 95);  // DBA CLIPS
  applyAdaptiveHeaderLayout_(sheet, HEADERS);

  const lastRow = Math.max(sheet.getLastRow(), 2);
  const dataRange = sheet.getRange(2, 1, lastRow - 1, HEADERS.length);
  dataRange
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(false)
    .setBorder(true, true, true, true, true, true, '#d9d9d9', SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange(2, 4, Math.max(lastRow - 1, 1), 1).setNumberFormat('dd-mm-yyyy');
  sheet.getRange(2, 5, Math.max(lastRow - 1, 1), 2).setNumberFormat('hh:mm:ss');
  sheet.getRange(2, 37, Math.max(lastRow - 1, 1), 1).setNumberFormat('0.0');

  if (lastRow > 1) {
    sheet.setRowHeights(2, lastRow - 1, 28);
    dataRange.setBackgrounds(buildDataBackgrounds_(lastRow - 1));
  }

  // Thick separators between logical blocks:
  // C|D, G|H, J|K, M|N, N|O, P|Q
  [3, 7, 11, 14, 15, 17].forEach((col) => {
    sheet.getRange(1, col, lastRow, 1)
      .setBorder(null, null, null, true, null, null, '#8a8a8a', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  });

  applyTechnicalColumnVisibilityForSheet_(sheet);
}

function applyLogRowFormatting_(sheet, startRow, rowCount) {
  if (!sheet || startRow < 2 || rowCount < 1) {
    return;
  }

  const dataRange = sheet.getRange(startRow, 1, rowCount, HEADERS.length);
  sheet.setRowHeights(startRow, rowCount, 28);
  dataRange
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(false)
    .setBorder(true, true, true, true, true, true, '#d9d9d9', SpreadsheetApp.BorderStyle.SOLID)
    .setBackgrounds(buildDataBackgroundsForSheetRows_(startRow, rowCount));

  sheet.getRange(startRow, 4, rowCount, 1).setNumberFormat('dd-mm-yyyy');
  sheet.getRange(startRow, 5, rowCount, 2).setNumberFormat('hh:mm:ss');
  sheet.getRange(startRow, 37, rowCount, 1).setNumberFormat('0.0');

  [3, 7, 11, 14, 15, 17].forEach((col) => {
    sheet.getRange(startRow, col, rowCount, 1)
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

  const ddmmyyyy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  }

  const ddmmyy = raw.match(/^(\d{2})-(\d{2})-(\d{2})$/);
  if (ddmmyy) {
    return `20${ddmmyy[3]}-${ddmmyy[2]}-${ddmmyy[1]}`;
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

function getNewestDataDate_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return '';
  }

  const dates = sheet.getRange(2, 4, lastRow - 1, 1).getValues()
    .flat()
    .map((value) => normalizeDateText_(value))
    .filter((value) => value)
    .sort();
  return dates.length ? dates[dates.length - 1] : '';
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

function rawSheetIsNewestFirst_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 3) {
    return true;
  }

  const keys = sheet.getRange(2, 4, lastRow - 1, 2).getValues().map((row) => (
    `${normalizeDateText_(row[0])}T${normalizeTimeText_(row[1])}`
  ));
  for (let index = 1; index < keys.length; index++) {
    if (compareTextDescending_(keys[index - 1], keys[index]) > 0) {
      return false;
    }
  }
  return true;
}

function sortRawSheetNewestFirst_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 3) {
    return 0;
  }

  const rowCount = lastRow - 1;
  const range = sheet.getRange(2, 1, rowCount, HEADERS.length);
  const rows = range.getValues();
  sortRowsNewestFirst_(rows, 3, 4, 6, 0);
  range.setValues(rows);
  applyLogRowFormatting_(sheet, 2, rowCount);
  return rowCount;
}

function ensureRawSheetNewestFirst_(sheet) {
  return rawSheetIsNewestFirst_(sheet) ? 0 : sortRawSheetNewestFirst_(sheet);
}

function prependLogRow_(sheet, rowValues) {
  const previousMaxRows = sheet.getMaxRows();
  const hadSpareRow = sheet.getLastRow() < previousMaxRows;
  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, HEADERS.length).setValues([rowValues]);

  if (hadSpareRow && sheet.getMaxRows() > previousMaxRows) {
    sheet.deleteRow(sheet.getMaxRows());
  }

  ensureRawHeaderFormatting_(sheet);
  applyLogRowFormatting_(sheet, 2, 1);
  if (sheet.getLastRow() >= 3) {
    const followingColor = String(sheet.getRange(3, 1, 1, 1).getBackground()).toLowerCase();
    const newRowColors = followingColor === String(DATA_COLORS_ODD[0]).toLowerCase()
      ? DATA_COLORS_EVEN
      : DATA_COLORS_ODD;
    sheet.getRange(2, 1, 1, HEADERS.length).setBackgrounds([newRowColors.slice()]);
  }
  return 2;
}

function appendLogRowsToArchive_(sourceSheet, targetSheet) {
  const sourceLastRow = sourceSheet.getLastRow();
  if (sourceLastRow < 2) {
    return;
  }
  ensureHeaderRowValues_(targetSheet);

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
  if (sortRawSheetNewestFirst_(targetSheet) === 0) {
    applyLogRowFormatting_(targetSheet, targetStartRow, filteredValues.length);
  }
}

function ensureWritableLogSheet_(incomingDateText) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(ACTIVE_LOG_SHEET_NAME);
  let archivedSheet = null;
  const normalizedIncomingDateText = normalizeDateText_(incomingDateText);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(ACTIVE_LOG_SHEET_NAME);
    ensureHeaderFormatting_(sheet);
    return sheet;
  }

  ensureHeaderRowValues_(sheet);

  const lastDataDate = getNewestDataDate_(sheet);
  if (isIncomingDateNewer_(lastDataDate, normalizedIncomingDateText)) {
    const archivedSheetName = formatSheetDate_(lastDataDate);
    if (archivedSheetName && archivedSheetName !== ACTIVE_LOG_SHEET_NAME) {
      const existingArchive = spreadsheet.getSheetByName(archivedSheetName);
      if (!existingArchive) {
        sheet.setName(archivedSheetName);
        ensureHeaderFormatting_(sheet);
        sortRawSheetNewestFirst_(sheet);
        archivedSheet = sheet;
      } else {
        appendLogRowsToArchive_(sheet, existingArchive);
        spreadsheet.deleteSheet(sheet);
        archivedSheet = existingArchive;
      }
    }

    sheet = spreadsheet.getSheetByName(ACTIVE_LOG_SHEET_NAME) || spreadsheet.insertSheet(ACTIVE_LOG_SHEET_NAME);
    ensureHeaderFormatting_(sheet);
    if (archivedSheet && !archivedSheet.isSheetHidden()) {
      archivedSheet.hideSheet();
    }
  }

  ensureRawSheetNewestFirst_(sheet);
  return sheet;
}

// === Sheet user interface ===

function getUserInterfaceMode_() {
  const value = String(
    PropertiesService.getUserProperties().getProperty(USER_INTERFACE_MODE_PROPERTY) || ''
  ).trim().toUpperCase();
  return value === USER_INTERFACE_MODE_TECHNICAL
    ? USER_INTERFACE_MODE_TECHNICAL
    : USER_INTERFACE_MODE_USER;
}

function setUserInterfaceMode_(mode) {
  PropertiesService.getUserProperties().setProperty(USER_INTERFACE_MODE_PROPERTY, mode);
}

function isScriptPropertyEnabled_(propertyName) {
  return String(
    PropertiesService.getScriptProperties().getProperty(propertyName) || ''
  ).trim().toLowerCase() === 'true';
}

function getAutomationState_() {
  return {
    analyticsRefresh: isScriptPropertyEnabled_(AUTO_ANALYTICS_ENABLED_PROPERTY),
    archiveHiding: isScriptPropertyEnabled_(AUTO_HIDE_ARCHIVE_SHEETS_ENABLED_PROPERTY),
    dailySummary: isScriptPropertyEnabled_(TELEGRAM_AUTO_DAILY_ENABLED_PROPERTY)
  };
}

function addAutomationToggle_(menu, label, enabled, enableFunction, disableFunction) {
  const actionLabel = `${enabled ? 'Turn OFF' : 'Turn ON'} ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
  return menu
    .addItem(`● ${label}: ${enabled ? 'ON' : 'OFF'}`, 'showAutomationStatus_')
    .addItem(actionLabel, enabled ? disableFunction : enableFunction);
}

function visibilityStateFromCounts_(shownCount, totalCount) {
  if (totalCount === 0) {
    return 'NONE';
  }
  if (shownCount === 0) {
    return 'HIDDEN';
  }
  if (shownCount === totalCount) {
    return 'SHOWN';
  }
  return 'MIXED';
}

function getSheetVisibilityState_(spreadsheet, predicate) {
  const matchingSheets = spreadsheet.getSheets().filter((sheet) => predicate(sheet.getName()));
  const shownCount = matchingSheets.filter((sheet) => !sheet.isSheetHidden()).length;
  return visibilityStateFromCounts_(shownCount, matchingSheets.length);
}

function getTechnicalColumnsVisibilityState_(spreadsheet) {
  let totalCount = 0;
  let shownCount = 0;
  spreadsheet.getSheets().forEach((sheet) => {
    const lastColumn = sheet.getLastColumn();
    const technicalHeaders = getTechnicalColumnsForSheet_(sheet.getName());
    if (lastColumn < 1 || technicalHeaders.length === 0) {
      return;
    }

    const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    technicalHeaders.forEach((headerName) => {
      const columnIndex = headers.indexOf(headerName) + 1;
      if (columnIndex > 0) {
        totalCount++;
        if (!sheet.isColumnHiddenByUser(columnIndex)) {
          shownCount++;
        }
      }
    });
  });
  return visibilityStateFromCounts_(shownCount, totalCount);
}

function getDiagnosticsState_(spreadsheet) {
  const targetSpreadsheet = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  return {
    technicalColumns: getTechnicalColumnsVisibilityState_(targetSpreadsheet),
    archiveSheets: getSheetVisibilityState_(targetSpreadsheet, (sheetName) =>
      sheetName !== ACTIVE_LOG_SHEET_NAME && isRawDaySheetName_(sheetName)),
    analyticsSheets: getSheetVisibilityState_(targetSpreadsheet, (sheetName) =>
      isAnalyticsSheetName_(sheetName))
  };
}

function normalizeDiagnosticsState_(state) {
  const allowedStates = ['SHOWN', 'HIDDEN', 'MIXED', 'NONE'];
  const normalized = state || {};
  return {
    technicalColumns: allowedStates.includes(normalized.technicalColumns)
      ? normalized.technicalColumns
      : DIAGNOSTICS_STATE_UNKNOWN,
    archiveSheets: allowedStates.includes(normalized.archiveSheets)
      ? normalized.archiveSheets
      : DIAGNOSTICS_STATE_UNKNOWN,
    analyticsSheets: allowedStates.includes(normalized.analyticsSheets)
      ? normalized.analyticsSheets
      : DIAGNOSTICS_STATE_UNKNOWN
  };
}

function getCachedDiagnosticsState_() {
  const raw = String(
    PropertiesService.getDocumentProperties().getProperty(DIAGNOSTICS_STATE_CACHE_PROPERTY) || ''
  ).trim();
  if (!raw) {
    return normalizeDiagnosticsState_(null);
  }

  try {
    return normalizeDiagnosticsState_(JSON.parse(raw));
  } catch (error) {
    return normalizeDiagnosticsState_(null);
  }
}

function cacheDiagnosticsState_(state) {
  const normalized = normalizeDiagnosticsState_(state);
  PropertiesService.getDocumentProperties().setProperty(
    DIAGNOSTICS_STATE_CACHE_PROPERTY,
    JSON.stringify(normalized)
  );
  return normalized;
}

function refreshDiagnosticsStateCache_(spreadsheet) {
  return cacheDiagnosticsState_(getDiagnosticsState_(spreadsheet));
}

function addVisibilityToggle_(menu, label, state, hideLabel, hideFunction, showLabel, showFunction) {
  menu.addItem(`● ${label}: ${state}`, 'showDiagnosticsStatus_');
  if (state === 'SHOWN') {
    menu.addItem(hideLabel, hideFunction);
  } else if (state === 'HIDDEN') {
    menu.addItem(showLabel, showFunction);
  } else if (state === 'MIXED') {
    menu.addItem(hideLabel, hideFunction).addItem(showLabel, showFunction);
  }
  return menu;
}

function showCurrentInterfaceMode_() {
  const mode = getUserInterfaceMode_() === USER_INTERFACE_MODE_TECHNICAL ? 'TECH' : 'USER';
  SpreadsheetApp.getActiveSpreadsheet().toast(`Current interface mode: ${mode}.`, 'BS Noise', 5);
}

function showAutomationStatus_() {
  const state = getAutomationState_();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `Automation status: analytics refresh ${state.analyticsRefresh ? 'ON' : 'OFF'}, ` +
      `archive hiding ${state.archiveHiding ? 'ON' : 'OFF'}, ` +
      `daily summary ${state.dailySummary ? 'ON' : 'OFF'}.`,
    'BS Noise',
    8
  );
}

function showDiagnosticsStatus_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const state = refreshDiagnosticsStateCache_(spreadsheet);
  onOpen();
  spreadsheet.toast(
    `Diagnostics status: technical columns ${state.technicalColumns}, ` +
      `archive sheets ${state.archiveSheets}, analytics sheets ${state.analyticsSheets}.`,
    'BS Noise',
    8
  );
}

function addBsMenuToUi_() {
  const ui = SpreadsheetApp.getUi();
  const interfaceMode = getUserInterfaceMode_();
  const isTechnicalMode = interfaceMode === USER_INTERFACE_MODE_TECHNICAL;
  const menu = ui.createMenu('⚙️ BS')
    .addItem('Refresh latest data', 'rebuildAnalytics_');

  if (isTechnicalMode) {
    menu
      .addItem('● Interface mode: TECH', 'showCurrentInterfaceMode_')
      .addItem('Switch to User mode', 'enableUserMode_');
  } else {
    menu
      .addItem('● Interface mode: USER', 'showCurrentInterfaceMode_')
      .addItem('Switch to Technical mode', 'enableTechnicalMode_');
  }

  menu
    .addSeparator()
    .addSubMenu(ui.createMenu('Reports')
      .addItem('Send latest Telegram status', 'sendLatestTelegramStatus_')
      .addItem('Send daily Telegram summary', 'sendDailyTelegramSummary_'));

  if (isTechnicalMode) {
    const automationState = getAutomationState_();
    const diagnosticsState = getCachedDiagnosticsState_();
    const automationMenu = ui.createMenu('Automation');
    const diagnosticsMenu = ui.createMenu('Diagnostics');

    addVisibilityToggle_(
      diagnosticsMenu,
      'Technical columns',
      diagnosticsState.technicalColumns,
      'Hide technical columns',
      'hideTechnicalColumns_',
      'Show all columns',
      'showAllColumns_'
    ).addSeparator();
    addVisibilityToggle_(
      diagnosticsMenu,
      'Archive sheets',
      diagnosticsState.archiveSheets,
      'Hide archive sheets',
      'hideArchiveSheetsFromMenu_',
      'Show archive sheets',
      'showArchiveSheetsFromMenu_'
    ).addSeparator();
    addVisibilityToggle_(
      diagnosticsMenu,
      'Analytics sheets',
      diagnosticsState.analyticsSheets,
      'Hide analytics sheets',
      'hideAnalyticsSheetsFromMenu_',
      'Show analytics sheets',
      'showAnalyticsSheetsFromMenu_'
    ).addSeparator();
    diagnosticsMenu.addItem('Refresh status indicators', 'refreshBsMenuStatus_');

    addAutomationToggle_(
      automationMenu,
      'Auto analytics refresh',
      automationState.analyticsRefresh,
      'enableAutomaticAnalyticsRefresh_',
      'disableAutomaticAnalyticsRefresh_'
    ).addSeparator();
    addAutomationToggle_(
      automationMenu,
      'Auto archive hiding',
      automationState.archiveHiding,
      'enableAutomaticArchiveSheetHiding_',
      'disableAutomaticArchiveSheetHiding_'
    ).addSeparator();
    addAutomationToggle_(
      automationMenu,
      'Auto daily summary',
      automationState.dailySummary,
      'enableAutomaticDailySummary_',
      'disableAutomaticDailySummary_'
    );

    menu
      .addSubMenu(ui.createMenu('Maintenance')
        .addItem('Rebuild charts only', 'rebuildAnalyticsCharts_')
        .addItem('Repair table layout/order', 'refreshAllSheetFormatting_'))
      .addSubMenu(diagnosticsMenu)
      .addSubMenu(automationMenu);
  }

  menu
    .addSubMenu(ui.createMenu('Danger zone')
      .addItem('Reset for clean run', 'resetForCleanRun_'))
    .addToUi();
}

function addFallbackBsMenuToUi_() {
  SpreadsheetApp.getUi()
    .createMenu('⚙️ BS')
    .addItem('Refresh latest data', 'rebuildAnalytics_')
    .addToUi();
}

function onOpen() {
  try {
    addBsMenuToUi_();
  } catch (error) {
    addFallbackBsMenuToUi_();
  }
}

function refreshBsMenuStatus_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const diagnosticsState = refreshDiagnosticsStateCache_(spreadsheet);
  onOpen();
  spreadsheet.toast(
    `Status indicators refreshed: technical columns ${diagnosticsState.technicalColumns}, ` +
      `archive sheets ${diagnosticsState.archiveSheets}, analytics sheets ${diagnosticsState.analyticsSheets}.`,
    'BS Noise',
    8
  );
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

function formatPct_(value) {
  return `${roundValue_(toNumber_(value), 1)}%`;
}

function hasDisplayValue_(value) {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim() !== '';
  }
  return true;
}

function formatMaybePct_(value) {
  if (!hasDisplayValue_(value)) {
    return 'no data';
  }
  return formatPct_(value);
}

function formatMaybeNumber_(value, suffix) {
  if (!hasDisplayValue_(value)) {
    return 'no data';
  }
  return `${roundValue_(toNumber_(value), 1)}${suffix || ''}`;
}

function formatMaybeCount_(value) {
  if (!hasDisplayValue_(value)) {
    return 'no data';
  }
  return `${Math.round(toNumber_(value))}`;
}

function formatMaybeFraction_(leftValue, rightValue) {
  if (!hasDisplayValue_(leftValue) || !hasDisplayValue_(rightValue)) {
    return 'no data';
  }
  return `${Math.round(toNumber_(leftValue))}/${Math.round(toNumber_(rightValue))}`;
}

function htmlEscape_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

function noiseLevelFromP2p_(value) {
  const p2p = toNumber_(value);
  if (p2p <= 350) {
    return 'SILENT';
  }
  if (p2p <= 650) {
    return 'NORMAL';
  }
  if (p2p <= 850) {
    return 'LOUD';
  }
  return 'PEAK';
}

function numericDbaOrBlank_(value) {
  if (!hasDisplayValue_(value)) {
    return '';
  }
  const parsed = Number(String(value).replace(',', '.').trim());
  return Number.isFinite(parsed) && parsed > 0 ? roundValue_(parsed, 1) : '';
}

function noiseLevelFromDba_(value) {
  const dba = numericDbaOrBlank_(value);
  if (dba === '') return 'NO DATA';
  if (dba < DBA_LEVEL_SILENT_MAX) return 'SILENT';
  if (dba < DBA_LEVEL_NORMAL_MAX) return 'NORMAL';
  if (dba < DBA_LEVEL_LOUD_MAX) return 'LOUD';
  return 'PEAK';
}

function validDbaWindow_(dba, validPct, acousticRevision, windowMinutes) {
  return numericDbaOrBlank_(dba) !== '' &&
    toNumber_(validPct) >= DBA_MIN_VALID_COVERAGE_PERCENT &&
    toNumber_(acousticRevision) === 2 &&
    toNumber_(windowMinutes) > 0;
}

function dbaWeightMinutes_(record) {
  const measuredMinutes = Math.min(10, Math.max(0, toNumber_(record.windowMinutes)));
  const validFraction = Math.min(1, Math.max(0, toNumber_(record.dbaValidPct) / 100));
  return measuredMinutes * validFraction;
}

function energeticDbaAverage_(energyMinutes, validMinutes) {
  return validMinutes > 0 ? roundValue_(10 * Math.log10(energyMinutes / validMinutes), 1) : '';
}

function compareTextDescending_(leftValue, rightValue) {
  const left = String(leftValue || '');
  const right = String(rightValue || '');
  if (left > right) {
    return -1;
  }
  if (left < right) {
    return 1;
  }
  return 0;
}

function sortRowsNewestFirst_(rows, dateIndex, timeIndex, partIndex, deviceIndex) {
  rows.sort((left, right) => {
    const dateResult = compareTextDescending_(
      normalizeDateText_(left[dateIndex]),
      normalizeDateText_(right[dateIndex])
    );
    if (dateResult !== 0) {
      return dateResult;
    }

    if (timeIndex !== null && timeIndex !== undefined) {
      const timeResult = compareTextDescending_(
        normalizeTimeText_(left[timeIndex]),
        normalizeTimeText_(right[timeIndex])
      );
      if (timeResult !== 0) {
        return timeResult;
      }
    }

    if (partIndex !== null && partIndex !== undefined) {
      const leftPartOrder = PART_ORDER.indexOf(normalizePartText_(left[partIndex]));
      const rightPartOrder = PART_ORDER.indexOf(normalizePartText_(right[partIndex]));
      if (leftPartOrder !== rightPartOrder) {
        return rightPartOrder - leftPartOrder;
      }
    }

    if (deviceIndex !== null && deviceIndex !== undefined) {
      return String(left[deviceIndex] || '').localeCompare(String(right[deviceIndex] || ''));
    }
    return 0;
  });
  return rows;
}

// === Raw data and archive handling ===

function isRawDaySheetName_(name) {
  return name === ACTIVE_LOG_SHEET_NAME ||
    /^\d{2}-\d{2}-\d{4}$/.test(name) ||
    /^\d{4}-\d{2}-\d{2}$/.test(name);
}

function listRawDataSheets_(spreadsheet) {
  return spreadsheet.getSheets().filter((sheet) => isRawDaySheetName_(sheet.getName()));
}

function isAnalyticsSheetName_(name) {
  return ANALYTICS_SHEET_NAMES.includes(name);
}

function refreshRawSheetsFormatting_(spreadsheet) {
  listRawDataSheets_(spreadsheet).forEach((sheet) => {
    ensureHeaderFormatting_(sheet);
    ensureRawSheetNewestFirst_(sheet);
  });
}

function refreshExistingTableSheetFormatting_(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    return false;
  }

  ensureMinColumnCount_(sheet, headers.length);
  sheet.showColumns(1, sheet.getMaxColumns());
  sheet.setFrozenColumns(0);
  sheet.setHiddenGridlines(false);

  const lastRow = Math.max(sheet.getLastRow(), 1);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const currentHeaders = headerRange.getValues()[0];
  const headersMatch = headers.every((header, index) => currentHeaders[index] === header);
  if (!headersMatch) {
    headerRange.setValues([headers]);
  }

  if (lastRow > 2 && headers.indexOf('DATE') >= 0) {
    const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    const timeIndex = headers.indexOf('T FROM');
    const partIndex = headers.indexOf('PART');
    const deviceIndex = headers.indexOf('DEV ID');
    sortRowsNewestFirst_(
      rows,
      headers.indexOf('DATE'),
      timeIndex >= 0 ? timeIndex : null,
      partIndex >= 0 ? partIndex : null,
      deviceIndex >= 0 ? deviceIndex : null
    );
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  sheet.setFrozenRows(1);
  headerRange
    .setFontWeight('bold')
    .setBackground('#d9eaf7')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, headers.length)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setWrap(false)
      .setBorder(true, true, true, true, true, true, '#d9d9d9', SpreadsheetApp.BorderStyle.SOLID);
  }

  sheet.autoResizeColumns(1, headers.length);
  applyAdaptiveHeaderLayout_(sheet, headers);

  if (headers.indexOf('DATE') >= 0) {
    const dateCol = headers.indexOf('DATE') + 1;
    sheet.getRange(2, dateCol, Math.max(lastRow - 1, 1), 1).setNumberFormat('dd-mm-yyyy');
  }
  if (headers.indexOf('T FROM') >= 0) {
    const fromCol = headers.indexOf('T FROM') + 1;
    sheet.getRange(2, fromCol, Math.max(lastRow - 1, 1), 1).setNumberFormat('hh:mm:ss');
  }
  if (headers.indexOf('T TO') >= 0) {
    const toCol = headers.indexOf('T TO') + 1;
    sheet.getRange(2, toCol, Math.max(lastRow - 1, 1), 1).setNumberFormat('hh:mm:ss');
  }
  if (headers.indexOf('FIRST TIME') >= 0) {
    const firstCol = headers.indexOf('FIRST TIME') + 1;
    const lastCol = headers.indexOf('LAST TIME') + 1;
    sheet.getRange(2, firstCol, Math.max(lastRow - 1, 1), 1).setNumberFormat('hh:mm:ss');
    sheet.getRange(2, lastCol, Math.max(lastRow - 1, 1), 1).setNumberFormat('hh:mm:ss');
  }

  applySheetRoleFormatting_(sheet, headers, lastRow, getSheetStyleProfile_(sheetName));
  return true;
}

function refreshAllSheetFormatting_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  refreshRawSheetsFormatting_(spreadsheet);

  refreshExistingTableSheetFormatting_(CLEAN_SUMMARY_SHEET_NAME, CLEAN_SUMMARY_HEADERS);
  refreshExistingTableSheetFormatting_(TIMELINE_SUMMARY_SHEET_NAME, TIMELINE_SUMMARY_HEADERS);
  refreshExistingTableSheetFormatting_(DAYPART_SUMMARY_SHEET_NAME, DAYPART_SUMMARY_HEADERS);
  refreshExistingTableSheetFormatting_(LEVEL_SUMMARY_SHEET_NAME, LEVEL_SUMMARY_HEADERS);
  refreshExistingTableSheetFormatting_(HEALTH_SUMMARY_SHEET_NAME, HEALTH_SUMMARY_HEADERS);
  refreshExistingTableSheetFormatting_(CONCLUSION_SUMMARY_SHEET_NAME, CONCLUSION_SUMMARY_HEADERS);
  refreshExistingTableSheetFormatting_(DAILY_VERDICT_SHEET_NAME, DAILY_VERDICT_HEADERS);
  refreshExistingTableSheetFormatting_(DAILY_VERDICT_TABLE_SHEET_NAME, DAILY_VERDICT_TABLE_HEADERS);

  if (getUserInterfaceMode_() === USER_INTERFACE_MODE_TECHNICAL) {
    applyTechnicalMode_(spreadsheet, { preserveActiveSheet: true });
  } else {
    applyUserMode_(spreadsheet, { preserveActiveSheet: true });
  }

  refreshDiagnosticsStateCache_(spreadsheet);
  onOpen();
  spreadsheet.toast('All table layout and newest-first order repaired.', 'BS Noise', 6);
}

function hideArchiveSheets_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  spreadsheet.getSheets().forEach((sheet) => {
    const name = sheet.getName();
    if (name !== ACTIVE_LOG_SHEET_NAME && isRawDaySheetName_(name) && !sheet.isSheetHidden()) {
      sheet.hideSheet();
    }
  });
}

function showArchiveSheets_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  spreadsheet.getSheets().forEach((sheet) => {
    const name = sheet.getName();
    if (name !== ACTIVE_LOG_SHEET_NAME && isRawDaySheetName_(name) && sheet.isSheetHidden()) {
      sheet.showSheet();
    }
  });
}

function hideArchiveSheetsFromMenu_() {
  hideArchiveSheets_();
  refreshDiagnosticsStateCache_(SpreadsheetApp.getActiveSpreadsheet());
  onOpen();
  SpreadsheetApp.getActiveSpreadsheet().toast('Archive sheets hidden.', 'BS Noise', 5);
}

function showArchiveSheetsFromMenu_() {
  showArchiveSheets_();
  refreshDiagnosticsStateCache_(SpreadsheetApp.getActiveSpreadsheet());
  onOpen();
  SpreadsheetApp.getActiveSpreadsheet().toast('Archive sheets shown.', 'BS Noise', 5);
}

function hideAnalyticsSheets_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  spreadsheet.getSheets().forEach((sheet) => {
    if (isAnalyticsSheetName_(sheet.getName()) && !sheet.isSheetHidden()) {
      sheet.hideSheet();
    }
  });
}

function showAnalyticsSheets_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  spreadsheet.getSheets().forEach((sheet) => {
    if (isAnalyticsSheetName_(sheet.getName()) && sheet.isSheetHidden()) {
      sheet.showSheet();
    }
  });
}

function hideAnalyticsSheetsFromMenu_() {
  hideAnalyticsSheets_();
  refreshDiagnosticsStateCache_(SpreadsheetApp.getActiveSpreadsheet());
  onOpen();
  SpreadsheetApp.getActiveSpreadsheet().toast('Analytics sheets hidden.', 'BS Noise', 5);
}

function showAnalyticsSheetsFromMenu_() {
  showAnalyticsSheets_();
  refreshDiagnosticsStateCache_(SpreadsheetApp.getActiveSpreadsheet());
  onOpen();
  SpreadsheetApp.getActiveSpreadsheet().toast('Analytics sheets shown.', 'BS Noise', 5);
}

function applyUserMode_(spreadsheet, options) {
  const targetSpreadsheet = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  const opts = options || {};
  let shownSheets = 0;
  let hiddenSheets = 0;

  USER_MODE_VISIBLE_SHEET_NAMES.forEach((sheetName) => {
    const sheet = targetSpreadsheet.getSheetByName(sheetName);
    if (sheet) {
      if (sheet.isSheetHidden()) {
        sheet.showSheet();
      }
      shownSheets++;
    }
  });

  const preferredSheet = targetSpreadsheet.getSheetByName(CHARTS_SHEET_NAME) ||
    targetSpreadsheet.getSheetByName(DAILY_VERDICT_TABLE_SHEET_NAME) ||
    targetSpreadsheet.getSheetByName(ACTIVE_LOG_SHEET_NAME);
  if (preferredSheet && !opts.preserveActiveSheet) {
    targetSpreadsheet.setActiveSheet(preferredSheet);
  }

  targetSpreadsheet.getSheets().forEach((sheet) => {
    const sheetName = sheet.getName();
    const isInternalAnalytics = isAnalyticsSheetName_(sheetName) &&
      !USER_MODE_VISIBLE_SHEET_NAMES.includes(sheetName);
    const isArchive = sheetName !== ACTIVE_LOG_SHEET_NAME && isRawDaySheetName_(sheetName);
    if ((isInternalAnalytics || isArchive) && !sheet.isSheetHidden()) {
      sheet.hideSheet();
      hiddenSheets++;
    }
  });

  const hiddenColumns = hideTechnicalColumnsCore_(targetSpreadsheet);
  return { shownSheets, hiddenSheets, hiddenColumns };
}

function applyTechnicalMode_(spreadsheet, options) {
  const targetSpreadsheet = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  const opts = options || {};
  let shownAnalyticsSheets = 0;
  let hiddenArchiveSheets = 0;

  targetSpreadsheet.getSheets().forEach((sheet) => {
    if (isAnalyticsSheetName_(sheet.getName())) {
      if (sheet.isSheetHidden()) {
        sheet.showSheet();
        shownAnalyticsSheets++;
      }
    }
  });

  const preferredSheet = targetSpreadsheet.getSheetByName(CHARTS_SHEET_NAME) ||
    targetSpreadsheet.getSheetByName(DAILY_VERDICT_TABLE_SHEET_NAME) ||
    targetSpreadsheet.getSheetByName(ACTIVE_LOG_SHEET_NAME);
  if (preferredSheet && !opts.preserveActiveSheet) {
    targetSpreadsheet.setActiveSheet(preferredSheet);
  }

  targetSpreadsheet.getSheets().forEach((sheet) => {
    const sheetName = sheet.getName();
    const isArchive = sheetName !== ACTIVE_LOG_SHEET_NAME && isRawDaySheetName_(sheetName);
    if (isArchive && !sheet.isSheetHidden()) {
      sheet.hideSheet();
      hiddenArchiveSheets++;
    }
  });
  showAllColumnsCore_(targetSpreadsheet);
  return { shownAnalyticsSheets, hiddenArchiveSheets };
}

function enableUserMode_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  applyUserMode_(spreadsheet);
  setUserInterfaceMode_(USER_INTERFACE_MODE_USER);
  refreshDiagnosticsStateCache_(spreadsheet);
  onOpen();
  spreadsheet.toast(
    `USER MODE ENABLED: primary sheets shown; archives, internal analytics, ` +
      `and technical columns hidden.`,
    'BS Noise',
    8
  );
}

function enableTechnicalMode_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  applyTechnicalMode_(spreadsheet);
  setUserInterfaceMode_(USER_INTERFACE_MODE_TECHNICAL);
  refreshDiagnosticsStateCache_(spreadsheet);
  onOpen();
  spreadsheet.toast(
    'TECHNICAL MODE ENABLED: analytics and all columns shown; archives remain hidden.',
    'BS Noise',
    8
  );
}

const TECHNICAL_COLUMNS_BY_SHEET_NAME = {};
TECHNICAL_COLUMNS_BY_SHEET_NAME[ACTIVE_LOG_SHEET_NAME] = RAW_LOG_TECHNICAL_HEADERS;
TECHNICAL_COLUMNS_BY_SHEET_NAME[CLEAN_SUMMARY_SHEET_NAME] = [
  'VER', 'BUILD', 'NOW %', 'H %', 'M %', 'RAW MIN', 'RAW MAX',
  'WIN MIN', 'QUIET', 'LOUD', 'SAMPLES', 'SOURCE SHEET', 'DAY STATE',
  'RECORD KEY', 'DUP COUNT', 'IS DUPLICATED', 'IS VALID', 'GAP BEFORE'
];
TECHNICAL_COLUMNS_BY_SHEET_NAME[DAYPART_SUMMARY_SHEET_NAME] = [
  'WINDOWS TOTAL', 'EXPECTED WINDOWS', 'AVG NOW %', 'AVG H %', 'AVG M %',
  'QUIET %', 'LOUD %'
];
TECHNICAL_COLUMNS_BY_SHEET_NAME[TIMELINE_SUMMARY_SHEET_NAME] = [
  'TS', 'NOW %', 'SILENT FLAG', 'NORMAL FLAG', 'LOUD FLAG', 'PEAK FLAG'
];
TECHNICAL_COLUMNS_BY_SHEET_NAME[LEVEL_SUMMARY_SHEET_NAME] = [
  'SILENT %', 'NORMAL %', 'LOUD %', 'PEAK %'
];
TECHNICAL_COLUMNS_BY_SHEET_NAME[HEALTH_SUMMARY_SHEET_NAME] = [
  'DUP EXTRA ROWS', 'LOW SAMPLE WIN', 'HAS LOG ROWS'
];
TECHNICAL_COLUMNS_BY_SHEET_NAME[DAILY_VERDICT_SHEET_NAME] = [
  'VERDICT SCORE', 'SILENT FLAG', 'NORMAL FLAG', 'LOUD FLAG', 'PEAK FLAG'
];
TECHNICAL_COLUMNS_BY_SHEET_NAME[DAILY_VERDICT_TABLE_SHEET_NAME] = [];

function getTechnicalColumnsForSheet_(sheetName) {
  if (TECHNICAL_COLUMNS_BY_SHEET_NAME[sheetName]) {
    return TECHNICAL_COLUMNS_BY_SHEET_NAME[sheetName];
  }
  if (isRawDaySheetName_(sheetName) && sheetName !== ACTIVE_LOG_SHEET_NAME) {
    return TECHNICAL_COLUMNS_BY_SHEET_NAME[ACTIVE_LOG_SHEET_NAME];
  }
  return [];
}

function hideColumnsByHeaderNames_(sheet, headerNames) {
  if (!sheet || !headerNames.length || sheet.getLastColumn() < 1) {
    return 0;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const targetColumns = headerNames
    .map((headerName) => headers.indexOf(headerName) + 1)
    .filter((columnIndex) => columnIndex > 0)
    .sort((left, right) => left - right);
  const hiddenCount = targetColumns.filter((columnIndex) =>
    !sheet.isColumnHiddenByUser(columnIndex)
  ).length;

  for (let index = 0; index < targetColumns.length;) {
    const startColumn = targetColumns[index];
    let endColumn = startColumn;
    while (index + 1 < targetColumns.length && targetColumns[index + 1] === endColumn + 1) {
      index++;
      endColumn = targetColumns[index];
    }
    const columnCount = endColumn - startColumn + 1;
    const needsHide = targetColumns
      .slice(index - columnCount + 1, index + 1)
      .some((columnIndex) => !sheet.isColumnHiddenByUser(columnIndex));
    if (needsHide) {
      sheet.hideColumns(startColumn, columnCount);
    }
    index++;
  }
  return hiddenCount;
}

function hideTechnicalColumnsCore_(spreadsheet) {
  let hiddenCount = 0;
  spreadsheet.getSheets().forEach((sheet) => {
    hiddenCount += hideColumnsByHeaderNames_(sheet, getTechnicalColumnsForSheet_(sheet.getName()));
  });
  return hiddenCount;
}

function applyTechnicalColumnVisibilityForSheet_(sheet) {
  if (!sheet || getUserInterfaceMode_() !== USER_INTERFACE_MODE_USER) {
    return 0;
  }
  return hideColumnsByHeaderNames_(sheet, getTechnicalColumnsForSheet_(sheet.getName()));
}

function hideTechnicalColumns_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const hiddenCount = hideTechnicalColumnsCore_(spreadsheet);
  refreshDiagnosticsStateCache_(spreadsheet);
  onOpen();
  spreadsheet.toast(`Technical columns hidden: ${hiddenCount}. Use Show all columns to restore them.`, 'BS Noise', 6);
}

function showAllColumnsCore_(spreadsheet) {
  spreadsheet.getSheets().forEach((sheet) => {
    const maxColumns = sheet.getMaxColumns();
    let hasHiddenColumns = false;
    for (let columnIndex = 1; columnIndex <= maxColumns; columnIndex++) {
      if (sheet.isColumnHiddenByUser(columnIndex)) {
        hasHiddenColumns = true;
        break;
      }
    }
    if (hasHiddenColumns) {
      sheet.showColumns(1, maxColumns);
    }
  });
}

function showAllColumns_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  showAllColumnsCore_(spreadsheet);
  refreshDiagnosticsStateCache_(spreadsheet);
  onOpen();
  spreadsheet.toast('All columns shown.', 'BS Noise', 5);
}

function clearSheetBodyAndFormatting_(sheet, headers) {
  ensureMinColumnCount_(sheet, headers.length);
  sheet.clearContents();
  sheet.clearFormats();
  sheet.clearConditionalFormatRules();
  sheet.getCharts().forEach((chart) => sheet.removeChart(chart));
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).breakApart();
  sheet.showColumns(1, sheet.getMaxColumns());
  sheet.setFrozenRows(0);
  sheet.setFrozenColumns(0);
  sheet.setHiddenGridlines(false);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function clearChartsSheetForCleanRun_(spreadsheet) {
  const sheet = getOrCreateSheet_(CHARTS_SHEET_NAME);
  ensureMinColumnCount_(sheet, 6);
  sheet.clearContents();
  sheet.clearFormats();
  sheet.clearConditionalFormatRules();
  sheet.getCharts().forEach((chart) => sheet.removeChart(chart));
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).breakApart();
  sheet.showColumns(1, sheet.getMaxColumns());
  sheet.setFrozenRows(0);
  sheet.setFrozenColumns(0);
  sheet.setHiddenGridlines(true);
  sheet.getRange(1, 1, 1, 6).merge();
  sheet.getRange(1, 1).setValue('DASHBOARD · QUICK VIEW');
  sheet.getRange(2, 1, 1, 6).merge();
  sheet.getRange(2, 1).setValue('No clean-run data yet.');
}

function clearAnalyticsForCleanRun_(spreadsheet) {
  writeTableToSheet_(CLEAN_SUMMARY_SHEET_NAME, CLEAN_SUMMARY_HEADERS, [], { applyFormatting: true });
  writeTableToSheet_(TIMELINE_SUMMARY_SHEET_NAME, TIMELINE_SUMMARY_HEADERS, [], { applyFormatting: true });
  writeTableToSheet_(DAYPART_SUMMARY_SHEET_NAME, DAYPART_SUMMARY_HEADERS, [], { applyFormatting: true });
  writeTableToSheet_(LEVEL_SUMMARY_SHEET_NAME, LEVEL_SUMMARY_HEADERS, [], { applyFormatting: true });
  writeTableToSheet_(HEALTH_SUMMARY_SHEET_NAME, HEALTH_SUMMARY_HEADERS, [], { applyFormatting: true });
  writeTableToSheet_(CONCLUSION_SUMMARY_SHEET_NAME, CONCLUSION_SUMMARY_HEADERS, [], { applyFormatting: true });
  writeTableToSheet_(DAILY_VERDICT_SHEET_NAME, DAILY_VERDICT_HEADERS, [], { applyFormatting: true });
  writeTableToSheet_(DAILY_VERDICT_TABLE_SHEET_NAME, DAILY_VERDICT_TABLE_HEADERS, [], { applyFormatting: true });
  clearChartsSheetForCleanRun_(spreadsheet);
}

function clearAllSheetsForCleanRun_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = spreadsheet.getSheetByName(ACTIVE_LOG_SHEET_NAME) || spreadsheet.insertSheet(ACTIVE_LOG_SHEET_NAME);
  activeSheet.showSheet();
  clearSheetBodyAndFormatting_(activeSheet, HEADERS);
  ensureHeaderFormatting_(activeSheet);

  let deletedArchives = 0;
  spreadsheet.getSheets().slice().forEach((sheet) => {
    const name = sheet.getName();
    if (name !== ACTIVE_LOG_SHEET_NAME && isRawDaySheetName_(name)) {
      spreadsheet.deleteSheet(sheet);
      deletedArchives++;
    }
  });

  clearAnalyticsForCleanRun_(spreadsheet);
  spreadsheet.setActiveSheet(activeSheet);
  return {
    deletedArchives,
    analyticsSheetsReset: ANALYTICS_SHEET_NAMES.length,
    activeSheetName: ACTIVE_LOG_SHEET_NAME
  };
}

function resetForCleanRun_() {
  const ui = SpreadsheetApp.getUi();
  const firstResponse = ui.alert(
    'Reset for clean run',
    'This will clear the active log, delete all dated archive sheets, and reset all analytics sheets. Telegram/script properties will stay unchanged. Continue?',
    ui.ButtonSet.YES_NO
  );
  if (firstResponse !== ui.Button.YES) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Clean-run reset cancelled.', 'BS Noise', 5);
    return;
  }

  const result = clearAllSheetsForCleanRun_();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  refreshDiagnosticsStateCache_(spreadsheet);
  onOpen();
  spreadsheet.toast(
    `Clean-run reset complete: ${result.activeSheetName} cleared, ${result.deletedArchives} archives deleted, analytics reset.`,
    'BS Noise',
    10
  );
  ui.alert(
    'Clean-run reset complete',
    `${result.activeSheetName} is empty and ready for new incoming rows.\nDeleted archive sheets: ${result.deletedArchives}\nAnalytics sheets reset: ${result.analyticsSheetsReset}`,
    ui.ButtonSet.OK
  );
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
  return isValid ? 'OK' : 'NO DATA';
}

// === Telegram reports ===

function getTelegramConfig_() {
  const properties = PropertiesService.getScriptProperties();
  return {
    enabled: String(properties.getProperty(TELEGRAM_ENABLED_PROPERTY) || '').trim().toLowerCase() === 'true',
    botToken: String(properties.getProperty(TELEGRAM_BOT_TOKEN_PROPERTY) || '').trim(),
    chatId: String(properties.getProperty(TELEGRAM_CHAT_ID_PROPERTY) || '').trim(),
    autoDailyEnabled: String(properties.getProperty(TELEGRAM_AUTO_DAILY_ENABLED_PROPERTY) || '').trim().toLowerCase() === 'true'
  };
}

function ensureTelegramConfigured_() {
  const config = getTelegramConfig_();
  if (!config.enabled || !config.botToken || !config.chatId) {
    throw new Error(
      'Telegram is not configured. Set Script Properties: ' +
      `${TELEGRAM_ENABLED_PROPERTY}=true, ` +
      `${TELEGRAM_BOT_TOKEN_PROPERTY}=your_bot_token, ` +
      `${TELEGRAM_CHAT_ID_PROPERTY}=your_chat_id`
    );
  }
  return config;
}

function sendTelegramMessage_(text) {
  const config = ensureTelegramConfigured_();
  const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
    method: 'post',
    payload: {
      chat_id: config.chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: 'true'
    },
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`Telegram send failed: HTTP ${statusCode} ${responseText}`);
  }

  let responsePayload;
  try {
    responsePayload = JSON.parse(responseText);
  } catch (error) {
    throw new Error(`Telegram send failed: invalid JSON response (${responseText})`);
  }
  if (!responsePayload || responsePayload.ok !== true) {
    throw new Error(`Telegram send failed: API did not confirm delivery (${responseText})`);
  }

  return response;
}

function buildTelegramStatsLinkLine_() {
  return [
    `🔗 <a href="${TELEGRAM_STATS_URL}">Online Statistics</a>`,
    `🔗 <a href="${TELEGRAM_LOCAL_LOG_URL}">Local Log</a>`
  ].join('\n');
}

function buildTelegramNoDataMessage_(title, body) {
  return [
    title,
    '',
    body,
    '',
    buildTelegramStatsLinkLine_()
  ].join('\n');
}

function getLatestValidCleanRecord_() {
  const sheet = getOrCreateSheet_(CLEAN_SUMMARY_SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return null;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, CLEAN_SUMMARY_HEADERS.length).getValues();
  const validRows = values.filter((row) => toNumber_(row[27]) === 1);
  const sourceRows = validRows.length ? validRows : values;
  if (!sourceRows.length) {
    return null;
  }

  sourceRows.sort((left, right) => {
    const leftKey = `${normalizeDateText_(left[3])}T${normalizeTimeText_(left[5])}`;
    const rightKey = `${normalizeDateText_(right[3])}T${normalizeTimeText_(right[5])}`;
    return leftKey < rightKey ? -1 : (leftKey > rightKey ? 1 : 0);
  });

  const row = sourceRows[sourceRows.length - 1];
  return {
    deviceId: row[0],
    version: row[1],
    build: row[2],
    dateText: normalizeDateText_(row[3]),
    timeFrom: normalizeTimeText_(row[4]),
    timeTo: normalizeTimeText_(row[5]),
    partText: normalizePartText_(row[6]),
    levelText: row[7],
    nowPct: row[8],
    hourPct: row[9],
    totalPct: row[10],
    avgPeakToPeak: row[13],
    temperatureC: row[15],
    humidityPct: row[16],
    samples: row[20],
    uptimeText: row[21],
    qualityText: row[29],
    isValid: toNumber_(row[27]) === 1,
    dbaLeqEstimate: row[30]
  };
}

function getLatestCleanUptimeForDate_(dateText) {
  const targetDate = normalizeDateText_(dateText);
  if (!targetDate) {
    return '';
  }

  const sheet = getOrCreateSheet_(CLEAN_SUMMARY_SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return '';
  }

  const values = sheet.getRange(2, 1, lastRow - 1, CLEAN_SUMMARY_HEADERS.length).getValues();
  const dateRows = values.filter((row) => normalizeDateText_(row[3]) === targetDate);
  if (!dateRows.length) {
    return '';
  }

  const validRows = dateRows.filter((row) => toNumber_(row[27]) === 1);
  const sourceRows = validRows.length ? validRows : dateRows;
  sourceRows.sort((left, right) => {
    const leftKey = `${normalizeDateText_(left[3])}T${normalizeTimeText_(left[5])}`;
    const rightKey = `${normalizeDateText_(right[3])}T${normalizeTimeText_(right[5])}`;
    return leftKey < rightKey ? -1 : (leftKey > rightKey ? 1 : 0);
  });

  const latestRow = sourceRows[sourceRows.length - 1];
  return String(latestRow[21] || '').trim();
}

function getLatestSummaryDateText_() {
  return getLatestDateTextFromSheet_(DAYPART_SUMMARY_SHEET_NAME, 2);
}

function getLatestDateTextFromSheet_(sheetName, dateColumnIndex) {
  const sheet = getOrCreateSheet_(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return '';
  }

  const values = sheet.getRange(2, dateColumnIndex, lastRow - 1, 1).getValues().flat();
  const dates = values
    .map((value) => normalizeDateText_(value))
    .filter((value) => value);
  if (!dates.length) {
    return '';
  }

  dates.sort();
  return dates[dates.length - 1];
}

function findRowByDateAndPart_(sheetName, dateText, partText) {
  const sheet = getOrCreateSheet_(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return null;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const wantedPart = normalizePartText_(partText);

  for (let index = 0; index < values.length; index++) {
    const row = values[index];
    const rowDate = normalizeDateText_(row[1]);
    const rowPart = normalizePartText_(row[2]);
    if (rowDate === dateText && rowPart === wantedPart) {
      return row;
    }
  }

  return null;
}

function findHealthRowByDate_(dateText) {
  const sheet = getOrCreateSheet_(HEALTH_SUMMARY_SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return null;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, HEALTH_SUMMARY_HEADERS.length).getValues();
  for (let index = 0; index < values.length; index++) {
    const row = values[index];
    if (normalizeDateText_(row[1]) === dateText) {
      return row;
    }
  }

  return null;
}

function hasSummaryDataForDate_(dateText) {
  const normalizedDateText = normalizeDateText_(dateText);
  if (!normalizedDateText) {
    return false;
  }

  if (findHealthRowByDate_(normalizedDateText)) {
    return true;
  }

  return PART_ORDER.some((partText) => findRowByDateAndPart_(DAYPART_SUMMARY_SHEET_NAME, normalizedDateText, partText));
}

function getCoverageQualityLabel_(coveragePct) {
  if (!hasDisplayValue_(coveragePct)) {
    return 'no data';
  }
  return getCoverageConfidence_(toNumber_(coveragePct)).toLowerCase();
}

function getMainLevelForPart_(dateText, partText) {
  const row = findRowByDateAndPart_(LEVEL_SUMMARY_SHEET_NAME, dateText, partText);
  if (!row) {
    return 'no data';
  }

  const stats = getMainLevelStats_({
    SILENT: toNumber_(row[4]),
    NORMAL: toNumber_(row[5]),
    LOUD: toNumber_(row[6]),
    PEAK: toNumber_(row[7])
  });
  return stats.count > 0 ? stats.level : 'no data';
}

function partIcon_(partText) {
  const normalized = normalizePartText_(partText);
  if (normalized === 'DAY') {
    return '☀️';
  }
  if (normalized === 'EVE') {
    return '🌆';
  }
  if (normalized === 'NGT') {
    return '🌙';
  }
  return '🌗';
}

function buildDayPartTelegramBlock_(targetDate, partText) {
  const row = findRowByDateAndPart_(DAYPART_SUMMARY_SHEET_NAME, targetDate, partText);
  if (!row) {
    return [
      `${partIcon_(partText)} <b>${partText}</b>`,
      'Avg: no data',
      'Main: no data',
      'Valid windows: no data'
    ].join('\n');
  }

  return [
    `${partIcon_(partText)} <b>${partText}</b>`,
    `Avg: ${formatMaybeNumber_(row[20], ' dB(A)')}`,
    `Main: ${getMainLevelForPart_(targetDate, partText)}`,
    `Valid windows: ${formatMaybeFraction_(row[4], row[5])}`
  ].join('\n');
}

function buildLatestTelegramStatus_() {
  const record = getLatestValidCleanRecord_();
  if (!record) {
    return buildTelegramNoDataMessage_('BS Noise Latest', 'No clean summary data yet. Run Refresh latest data first.');
  }

  const qualityLabel = String(record.qualityText || (record.isValid ? 'OK' : 'NO DATA'));
  return [
    '📟 <b>BS Noise Latest</b>',
    `Device: <code>${htmlEscape_(record.deviceId || 'n/a')}</code>`,
    `Version: <code>${htmlEscape_(record.version || 'n/a')}</code> build <code>${htmlEscape_(record.build || 'n/a')}</code>`,
    '',
    `📅 Date: <b>${htmlEscape_(record.dateText || 'n/a')}</b>`,
    `🕒 Window: <b>${htmlEscape_(record.timeFrom || 'n/a')}-${htmlEscape_(record.timeTo || 'n/a')}</b>`,
    `🌗 Part: <b>${htmlEscape_(record.partText || 'n/a')}</b>`,
    '',
    `🔊 Now: <b>${formatMaybePct_(record.nowPct)}</b>`,
    `🟡 H: ${formatMaybePct_(record.hourPct)}`,
    `🔵 M: ${formatMaybePct_(record.totalPct)}`,
    `📏 Sound: <b>${formatMaybeNumber_(record.dbaLeqEstimate, ' dB(A)')}</b>`,
    `🏷️ Level: <b>${htmlEscape_(record.levelText || 'n/a')}</b>`,
    '',
    `🌡️ Temp: ${formatMaybeNumber_(record.temperatureC, ' C')}`,
    `💧 Hum: ${formatMaybeNumber_(record.humidityPct, ' %')}`,
    `⏱️ Uptime: ${htmlEscape_(record.uptimeText || 'n/a')}`,
    `📦 Samples: ${formatMaybeCount_(record.samples)}`,
    `✅ Quality: ${htmlEscape_(qualityLabel)}`,
    '',
    buildTelegramStatsLinkLine_()
  ].join('\n');
}

function buildDailyTelegramSummary_(dateText) {
  const targetDate = dateText || getLatestSummaryDateText_();
  if (!targetDate) {
    return buildTelegramNoDataMessage_('BS Noise Summary', 'No summary data yet. Run Refresh latest data first.');
  }

  const uptimeText = getLatestCleanUptimeForDate_(targetDate);
  const partLines = PART_ORDER.map((partText) => buildDayPartTelegramBlock_(targetDate, partText));

  const healthRow = findHealthRowByDate_(targetDate);
  const validTotal = healthRow ? healthRow[3] : '';
  const missingWindows = healthRow ? healthRow[6] : '';
  const coveragePct = healthRow ? healthRow[10] : '';
  const signalIssueWindows = healthRow ? healthRow[11] : '';
  const environmentFailWindows = healthRow ? healthRow[12] : '';
  const environmentFailSamples = healthRow ? healthRow[13] : '';
  const minimumFreeHeap = healthRow ? healthRow[14] : '';
  const resetIssueWindows = healthRow ? healthRow[15] : '';
  const qualityLabel = getCoverageQualityLabel_(coveragePct);

  const overallDayRow = findRowByDateAndPart_(DAYPART_SUMMARY_SHEET_NAME, targetDate, 'DAY');
  const overallNightRow = findRowByDateAndPart_(DAYPART_SUMMARY_SHEET_NAME, targetDate, 'NGT');
  const resultLines = [];
  if (overallDayRow && hasDisplayValue_(overallDayRow[20])) {
    resultLines.push(`Day looks mostly ${getMainLevelForPart_(targetDate, 'DAY').toLowerCase()}.`);
  }
  if (overallNightRow && hasDisplayValue_(overallNightRow[20])) {
    resultLines.push(`Night looks mostly ${getMainLevelForPart_(targetDate, 'NGT').toLowerCase()}.`);
  }
  resultLines.push(`Data quality is ${qualityLabel}.`);

  return [
    '📘 <b>BS Noise Summary</b>',
    `📅 Date: <b>${htmlEscape_(targetDate)}</b>`,
    `⏱️ Uptime: <b>${htmlEscape_(uptimeText || 'no data')}</b>`,
    '',
    partLines.join('\n\n'),
    '',
    '📈 <b>Coverage</b>',
    `Valid total: ${formatMaybeCount_(validTotal)}`,
    `Missing windows: ${formatMaybeCount_(missingWindows)}`,
    `Coverage: ${formatMaybePct_(coveragePct)}`,
    `Quality: ${htmlEscape_(qualityLabel)}`,
    `Signal issue windows: ${formatMaybeCount_(signalIssueWindows)}`,
    `Environment fail windows: ${formatMaybeCount_(environmentFailWindows)} (${formatMaybeCount_(environmentFailSamples)} samples)`,
    `Minimum free heap: ${formatMaybeCount_(minimumFreeHeap)}`,
    `Reset issue windows: ${formatMaybeCount_(resetIssueWindows)}`,
    '',
    '🧾 <b>Result</b>',
    resultLines.join('\n'),
    '',
    buildTelegramStatsLinkLine_()
  ].join('\n');
}

function sendLatestTelegramStatus_() {
  const text = buildLatestTelegramStatus_();
  sendTelegramMessage_(text);
  SpreadsheetApp.getActiveSpreadsheet().toast('Latest Telegram status sent.', 'BS Noise', 5);
}

function sendDailyTelegramSummary_() {
  const text = buildDailyTelegramSummary_('');
  sendTelegramMessage_(text);
  SpreadsheetApp.getActiveSpreadsheet().toast('Daily Telegram summary sent.', 'BS Noise', 5);
}

function getLatestArchivedDateText_() {
  const dates = getArchivedDateTexts_();
  return dates.length ? dates[dates.length - 1] : '';
}

function getArchivedDateTexts_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const dates = listRawDataSheets_(spreadsheet)
    .map((sheet) => sheet.getName())
    .filter((name) => name !== ACTIVE_LOG_SHEET_NAME)
    .map((name) => normalizeDateText_(name))
    .filter((value) => value);
  if (!dates.length) {
    return [];
  }
  dates.sort();
  return dates;
}

function findLatestAvailableSummaryDateForAutoDaily_(lastSentDate) {
  const latestArchivedDate = normalizeDateText_(getLatestArchivedDateText_());
  const normalizedLastSentDate = normalizeDateText_(lastSentDate);
  if (!latestArchivedDate) {
    return '';
  }

  if (normalizedLastSentDate && latestArchivedDate <= normalizedLastSentDate) {
    return '';
  }

  return hasSummaryDataForDate_(latestArchivedDate) ? latestArchivedDate : '';
}

// === Automatic triggers ===

function removeAutomaticAnalyticsRefreshTriggers_() {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (trigger.getHandlerFunction() === 'runAutomaticAnalyticsRefresh_') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function enableAutomaticAnalyticsRefresh_() {
  const properties = PropertiesService.getScriptProperties();
  removeAutomaticAnalyticsRefreshTriggers_();
  ScriptApp.newTrigger('runAutomaticAnalyticsRefresh_').timeBased().everyMinutes(AUTO_ANALYTICS_INTERVAL_MINUTES).create();
  properties.setProperty(AUTO_ANALYTICS_ENABLED_PROPERTY, 'true');
  onOpen();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `Auto analytics refresh enabled every ${AUTO_ANALYTICS_INTERVAL_MINUTES} minutes.`,
    'BS Noise',
    6
  );
}

function disableAutomaticAnalyticsRefresh_() {
  const properties = PropertiesService.getScriptProperties();
  removeAutomaticAnalyticsRefreshTriggers_();
  properties.setProperty(AUTO_ANALYTICS_ENABLED_PROPERTY, 'false');
  onOpen();
  SpreadsheetApp.getActiveSpreadsheet().toast('Auto analytics refresh disabled.', 'BS Noise', 5);
}

function runAutomaticAnalyticsRefresh_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    return;
  }

  try {
    const properties = PropertiesService.getScriptProperties();
    const enabled = String(properties.getProperty(AUTO_ANALYTICS_ENABLED_PROPERTY) || '').trim().toLowerCase() === 'true';
    if (!enabled) {
      return;
    }

    rebuildAnalyticsCore_({
      silent: true,
      formatCharts: false
    });
  } finally {
    lock.releaseLock();
  }
}

function removeAutomaticArchiveSheetHidingTriggers_() {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (trigger.getHandlerFunction() === 'runAutomaticArchiveSheetHiding_') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function enableAutomaticArchiveSheetHiding_() {
  const properties = PropertiesService.getScriptProperties();
  removeAutomaticArchiveSheetHidingTriggers_();
  ScriptApp.newTrigger('runAutomaticArchiveSheetHiding_')
    .timeBased()
    .everyDays(1)
    .atHour(AUTO_HIDE_ARCHIVE_SHEETS_HOUR)
    .create();
  properties.setProperty(AUTO_HIDE_ARCHIVE_SHEETS_ENABLED_PROPERTY, 'true');
  onOpen();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `Auto archive-sheet hiding enabled daily around ${AUTO_HIDE_ARCHIVE_SHEETS_HOUR}:00.`,
    'BS Noise',
    6
  );
}

function disableAutomaticArchiveSheetHiding_() {
  const properties = PropertiesService.getScriptProperties();
  removeAutomaticArchiveSheetHidingTriggers_();
  properties.setProperty(AUTO_HIDE_ARCHIVE_SHEETS_ENABLED_PROPERTY, 'false');
  onOpen();
  SpreadsheetApp.getActiveSpreadsheet().toast('Auto archive-sheet hiding disabled.', 'BS Noise', 5);
}

function runAutomaticArchiveSheetHiding_() {
  const properties = PropertiesService.getScriptProperties();
  const enabled = String(properties.getProperty(AUTO_HIDE_ARCHIVE_SHEETS_ENABLED_PROPERTY) || '').trim().toLowerCase() === 'true';
  if (!enabled) {
    return;
  }

  hideArchiveSheets_();
  refreshDiagnosticsStateCache_(SpreadsheetApp.getActiveSpreadsheet());
}

function removeAutomaticDailySummaryTriggers_() {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (trigger.getHandlerFunction() === 'runAutomaticDailyTelegramSummary_') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function enableAutomaticDailySummary_() {
  const properties = PropertiesService.getScriptProperties();
  removeAutomaticDailySummaryTriggers_();
  ScriptApp.newTrigger('runAutomaticDailyTelegramSummary_').timeBased().everyHours(1).create();
  properties.setProperty(TELEGRAM_AUTO_DAILY_ENABLED_PROPERTY, 'true');
  onOpen();
  SpreadsheetApp.getActiveSpreadsheet().toast('Auto daily summary enabled with an hourly background check.', 'BS Noise', 6);
}

function disableAutomaticDailySummary_() {
  const properties = PropertiesService.getScriptProperties();
  removeAutomaticDailySummaryTriggers_();
  properties.setProperty(TELEGRAM_AUTO_DAILY_ENABLED_PROPERTY, 'false');
  onOpen();
  SpreadsheetApp.getActiveSpreadsheet().toast('Auto daily summary disabled.', 'BS Noise', 5);
}

function runAutomaticDailyTelegramSummary_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(AUTO_DAILY_LOCK_WAIT_MILLISECONDS)) {
    console.warn(
      `Auto daily summary skipped: script lock stayed busy for ${AUTO_DAILY_LOCK_WAIT_MILLISECONDS} ms.`
    );
    return;
  }

  try {
    const config = getTelegramConfig_();
    if (!config.enabled || !config.autoDailyEnabled) {
      return;
    }

    const properties = PropertiesService.getScriptProperties();
    const lastSentDate = String(properties.getProperty(TELEGRAM_AUTO_DAILY_LAST_SENT_DATE_PROPERTY) || '').trim();
    let targetDate = findLatestAvailableSummaryDateForAutoDaily_(lastSentDate);
    if (!targetDate) {
      const latestArchivedDate = normalizeDateText_(getLatestArchivedDateText_());
      const normalizedLastSentDate = normalizeDateText_(lastSentDate);
      const hasUnsentArchive = latestArchivedDate &&
        (!normalizedLastSentDate || latestArchivedDate > normalizedLastSentDate);
      if (!hasUnsentArchive) {
        return;
      }

      rebuildAnalyticsCore_({ silent: true });
      targetDate = findLatestAvailableSummaryDateForAutoDaily_(lastSentDate);
    }
    if (!targetDate) {
      return;
    }

    const text = buildDailyTelegramSummary_(targetDate);
    sendTelegramMessage_(text);
    properties.setProperty(TELEGRAM_AUTO_DAILY_LAST_SENT_DATE_PROPERTY, targetDate);
  } finally {
    lock.releaseLock();
  }
}

// === Analytics ===

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
        nowPct: toNumber_(row[8]),
        hourPct: toNumber_(row[9]),
        totalPct: toNumber_(row[10]),
        rawMin: toNumber_(row[11]),
        rawMax: toNumber_(row[12]),
        avgPeakToPeak: toNumber_(row[13]),
        signalText: String(row[14] || ''),
        temperatureC: row[15] === '' ? '' : toNumber_(row[15]),
        humidityPct: row[16] === '' ? '' : toNumber_(row[16]),
        windowMinutes: toNumber_(row[17]),
        quietCount: toNumber_(row[18]),
        loudCount: toNumber_(row[19]),
        samples: toNumber_(row[20]),
        uptimeText: String(row[21] || ''),
        peakToPeakP95: toNumber_(row[22]),
        minPeakToPeak: toNumber_(row[23]),
        maxPeakToPeak: toNumber_(row[24]),
        stableMaxPeakToPeak: toNumber_(row[25]),
        sessionMinPeakToPeak: toNumber_(row[26]),
        sessionMaxPeakToPeak: toNumber_(row[27]),
        sessionStableMaxPeakToPeak: toNumber_(row[28]),
        environmentOkCount: toNumber_(row[29]),
        environmentFailCount: toNumber_(row[30]),
        freeHeap: toNumber_(row[31]),
        minFreeHeap: toNumber_(row[32]),
        bootSequence: toNumber_(row[33]),
        resetReason: String(row[34] || ''),
        acousticRevision: toNumber_(row[35]),
        dbaLeqEstimate: numericDbaOrBlank_(row[36]),
        dbaValidPct: toNumber_(row[37]),
        dbaFaults: toNumber_(row[38]),
        dbaClips: toNumber_(row[39]),
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
    } else if (currentMinutes > 0) {
      gapBefore = Math.floor(currentMinutes / 10);
    }

    previousByDeviceDate[previousKey] = record;
    record.gapBefore = gapBefore;
    record.isDuplicated = record.duplicateCount > 1;
    record.isValid = validDbaWindow_(record.dbaLeqEstimate, record.dbaValidPct,
                                     record.acousticRevision, record.windowMinutes);
    record.levelText = record.isValid ? noiseLevelFromDba_(record.dbaLeqEstimate) : 'NO DATA';
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
      record.uptimeText,
      record.sourceSheet,
      record.dayState,
      record.recordKey,
      record.duplicateCount,
      record.isDuplicated ? 1 : 0,
      record.isValid ? 1 : 0,
      gapBefore,
      record.qualityText,
      record.dbaLeqEstimate
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
      dbaEnergyMinutes: 0,
      dbaValidMinutes: 0,
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
    const dbaMinutes = dbaWeightMinutes_(record);
    bucket.dbaEnergyMinutes += Math.pow(10, record.dbaLeqEstimate / 10) * dbaMinutes;
    bucket.dbaValidMinutes += dbaMinutes;
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
      expectedWindows > 0
        ? roundValue_(Math.min(100, bucket.dbaValidMinutes * 100 / (expectedWindows * 10)), 1)
        : '',
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
      Math.max(expectedWindows - bucket.windowsTotal, 0),
      energeticDbaAverage_(bucket.dbaEnergyMinutes, bucket.dbaValidMinutes)
    ];
  });

  sortRowsNewestFirst_(rows, 1, null, 2, 0);

  return rows;
}

function buildTimelineTimestamp_(dateText, timeText) {
  const normalizedDate = normalizeDateText_(dateText);
  const normalizedTime = normalizeTimeText_(timeText);
  if (!normalizedDate || !normalizedTime) {
    return '';
  }

  const timestamp = new Date(`${normalizedDate}T${normalizedTime}`);
  return isNaN(timestamp.getTime()) ? '' : timestamp;
}

function buildTimelineSummaryRows_(records) {
  const rows = records
    .filter((record) => record.isValid)
    .map((record) => ([
      record.deviceId,
      record.dateText,
      buildTimelineTimestamp_(record.dateText, record.timeFromText),
      record.timeFromText,
      record.timeToText,
      record.partText,
      record.levelText,
      record.nowPct,
      record.levelText === 'SILENT' ? 1 : 0,
      record.levelText === 'NORMAL' ? 1 : 0,
      record.levelText === 'LOUD' ? 1 : 0,
      record.levelText === 'PEAK' ? 1 : 0
    ]));

  sortRowsNewestFirst_(rows, 1, 3, 5, 0);

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

  sortRowsNewestFirst_(rows, 1, null, 2, 0);

  return rows;
}

function getMainLevelStats_(levelCounts) {
  const pairs = LEVEL_ORDER.map((level) => [level, levelCounts[level] || 0]);
  pairs.sort((left, right) => {
    const countDifference = right[1] - left[1];
    return countDifference !== 0
      ? countDifference
      : LEVEL_ORDER.indexOf(left[0]) - LEVEL_ORDER.indexOf(right[0]);
  });
  const total = pairs.reduce((sum, pair) => sum + pair[1], 0);
  const top = pairs[0];
  const second = pairs[1];
  const sharePct = total > 0 ? roundValue_(top[1] * 100 / total, 1) : 0;
  const secondSharePct = total > 0 ? roundValue_(second[1] * 100 / total, 1) : 0;
  const leadPct = roundValue_(sharePct - secondSharePct, 1);
  const topPair = [top[0], second[0]].sort().join('/');
  const mixedNormalLoud = second[1] > 0 && topPair === 'LOUD/NORMAL' &&
    leadPct <= MIXED_NORMAL_LOUD_MAX_GAP_PCT;

  let dominance = 'WEAK';
  if (total === 0) {
    dominance = 'NO DATA';
  } else if (mixedNormalLoud) {
    dominance = 'MIXED';
  } else if (sharePct >= STRONG_LEVEL_SHARE_PCT && leadPct >= STRONG_LEVEL_LEAD_PCT) {
    dominance = 'STRONG';
  } else if (sharePct >= CLEAR_LEVEL_SHARE_PCT && leadPct >= CLEAR_LEVEL_LEAD_PCT) {
    dominance = 'CLEAR';
  }

  return {
    level: mixedNormalLoud ? 'MIXED NORMAL/LOUD' : top[0],
    count: top[1],
    sharePct,
    secondLevel: second[0],
    secondSharePct,
    leadPct,
    dominance
  };
}

function getCoverageConfidence_(coveragePct) {
  if (coveragePct >= 80) {
    return 'OK';
  }
  if (coveragePct > 0) {
    return 'PARTIAL';
  }
  return 'NO DATA';
}

function levelToVerdictScore_(levelText) {
  if (String(levelText || '').toUpperCase() === 'MIXED NORMAL/LOUD') {
    return 2.5;
  }
  const index = LEVEL_ORDER.indexOf(String(levelText || '').toUpperCase());
  return index >= 0 ? index + 1 : '';
}

function buildConclusionReading_(partText, dbaLeqEstimate, mainLevel, mainSharePct,
                                 dataConfidence, levelDominance) {
  const avgText = dbaLeqEstimate === '' ? 'n/a' : `${dbaLeqEstimate} dB(A)`;
  const shareText = mainSharePct === '' ? 'n/a' : `${mainSharePct}%`;
  return `${partText}: typical ${mainLevel}, avg ${avgText}, top share ${shareText}, ` +
    `data ${dataConfidence.toLowerCase()}, dominance ${levelDominance.toLowerCase()}`;
}

function buildConclusionSummaryRows_(records) {
  const buckets = {};

  records.forEach((record) => {
    const key = `${record.deviceId}|${record.dateText}|${record.partText}`;
    const bucket = ensureMetricBucket_(buckets, key, () => ({
      deviceId: record.deviceId,
      dateText: record.dateText,
      partText: record.partText,
      validWindows: 0,
      dbaEnergyMinutes: 0,
      dbaValidMinutes: 0,
      levelCounts: {
        SILENT: 0,
        NORMAL: 0,
        LOUD: 0,
        PEAK: 0
      }
    }));

    if (!record.isValid) {
      return;
    }

    bucket.validWindows++;
    const dbaMinutes = dbaWeightMinutes_(record);
    bucket.dbaEnergyMinutes += Math.pow(10, record.dbaLeqEstimate / 10) * dbaMinutes;
    bucket.dbaValidMinutes += dbaMinutes;
    bucket.levelCounts[record.levelText] = (bucket.levelCounts[record.levelText] || 0) + 1;
  });

  const rows = Object.keys(buckets).map((key) => {
    const bucket = buckets[key];
    const expectedWindows = EXPECTED_WINDOWS_PER_PART[bucket.partText] || 0;
    const coveragePct = expectedWindows > 0
      ? roundValue_(Math.min(100, bucket.dbaValidMinutes * 100 / (expectedWindows * 10)), 1)
      : '';
    const mainLevelStats = getMainLevelStats_(bucket.levelCounts);
    const dbaLeqEstimate = energeticDbaAverage_(bucket.dbaEnergyMinutes,
                                                bucket.dbaValidMinutes);
    const mainSharePct = bucket.validWindows > 0 ? mainLevelStats.sharePct : '';
    const dataConfidence = getCoverageConfidence_(toNumber_(coveragePct));
    const levelDominance = bucket.validWindows > 0 ? mainLevelStats.dominance : 'NO DATA';

    return [
      bucket.deviceId,
      bucket.dateText,
      bucket.partText,
      dbaLeqEstimate,
      bucket.validWindows > 0 ? mainLevelStats.level : 'NO DATA',
      mainSharePct,
      bucket.validWindows,
      expectedWindows,
      coveragePct,
      dataConfidence,
      levelDominance,
      bucket.validWindows > 0
        ? buildConclusionReading_(bucket.partText, dbaLeqEstimate, mainLevelStats.level,
                                  mainSharePct, dataConfidence, levelDominance)
        : `${bucket.partText}: no valid windows yet`
    ];
  });

  sortRowsNewestFirst_(rows, 1, null, 2, 0);

  return rows;
}

function buildDailyVerdictRows_(records) {
  const conclusionRows = buildConclusionSummaryRows_(records);
  return conclusionRows.map((row) => {
    const mainLevel = String(row[4] || 'NO DATA');
    const mixedNormalLoud = mainLevel === 'MIXED NORMAL/LOUD';
    const verdictScore = levelToVerdictScore_(mainLevel);
    return [
      row[0],
      row[1],
      row[2],
      mainLevel,
      verdictScore,
      mainLevel === 'SILENT' ? 1 : 0,
      mainLevel === 'NORMAL' || mixedNormalLoud ? 1 : 0,
      mainLevel === 'LOUD' || mixedNormalLoud ? 1 : 0,
      mainLevel === 'PEAK' ? 1 : 0,
      row[5],
      row[8],
      row[9],
      row[10],
      row[11]
    ];
  });
}

function buildDailyVerdictTableRows_(records) {
  const verdictRows = buildDailyVerdictRows_(records);
  const buckets = {};

  verdictRows.forEach((row) => {
    const key = `${row[0]}|${row[1]}`;
    const bucket = ensureMetricBucket_(buckets, key, () => ({
      deviceId: row[0],
      dateText: row[1],
      byPart: {
        DAY: null,
        EVE: null,
        NGT: null
      }
    }));

    bucket.byPart[normalizePartText_(row[2])] = {
      level: row[3],
      sharePct: row[9],
      confidence: row[11],
      dominance: row[12]
    };
  });

  const rows = Object.keys(buckets).map((key) => {
    const bucket = buckets[key];
    const day = bucket.byPart.DAY || {};
    const eve = bucket.byPart.EVE || {};
    const ngt = bucket.byPart.NGT || {};
    const verdictText = [
      `${bucket.dateText}:`,
      `DAY ${day.level || 'NO DATA'},`,
      `EVE ${eve.level || 'NO DATA'},`,
      `NGT ${ngt.level || 'NO DATA'}`
    ].join(' ');

    return [
      bucket.deviceId,
      bucket.dateText,
      day.level || 'NO DATA',
      eve.level || 'NO DATA',
      ngt.level || 'NO DATA',
      hasDisplayValue_(day.sharePct) ? day.sharePct : '',
      hasDisplayValue_(eve.sharePct) ? eve.sharePct : '',
      hasDisplayValue_(ngt.sharePct) ? ngt.sharePct : '',
      day.confidence || 'NO DATA',
      eve.confidence || 'NO DATA',
      ngt.confidence || 'NO DATA',
      day.dominance || 'NO DATA',
      eve.dominance || 'NO DATA',
      ngt.dominance || 'NO DATA',
      verdictText
    ];
  });

  sortRowsNewestFirst_(rows, 1, null, null, 0);

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
      validMinutes: 0,
      duplicateExtraRows: 0,
      lowSampleWindows: 0,
      firstTime: '',
      lastTime: '',
      hasLogRows: 0,
      signalIssueWindows: 0,
      environmentFailWindows: 0,
      environmentFailSamples: 0,
      minFreeHeap: 0,
      resetIssueWindows: 0
    }));

    bucket.uniqueWindows++;
    bucket.duplicateExtraRows += Math.max((record.duplicateCount || 1) - 1, 0);
    if (!bucket.firstTime || record.timeFromText < bucket.firstTime) {
      bucket.firstTime = record.timeFromText;
    }
    if (!bucket.lastTime || record.timeToText > bucket.lastTime) {
      bucket.lastTime = record.timeToText;
    }
    if (record.sourceSheet === ACTIVE_LOG_SHEET_NAME) {
      bucket.hasLogRows = 1;
    }
    if (record.samples < MIN_VALID_SAMPLES) {
      bucket.lowSampleWindows++;
    }
    const signalText = String(record.signalText || '').trim().toUpperCase();
    if (signalText && signalText !== 'OK') {
      bucket.signalIssueWindows++;
    }
    if (toNumber_(record.environmentFailCount) > 0) {
      bucket.environmentFailWindows++;
      bucket.environmentFailSamples += toNumber_(record.environmentFailCount);
    }
    const minFreeHeap = toNumber_(record.minFreeHeap);
    if (minFreeHeap > 0 && (bucket.minFreeHeap === 0 || minFreeHeap < bucket.minFreeHeap)) {
      bucket.minFreeHeap = minFreeHeap;
    }
    const resetReason = String(record.resetReason || '').trim().toUpperCase();
    if (resetReason && resetReason !== 'POWERON' && resetReason !== 'SOFT') {
      bucket.resetIssueWindows++;
    }
    if (record.isValid) {
      bucket.validWindows++;
      bucket.validMinutes += dbaWeightMinutes_(record);
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
      Math.max(144 - bucket.uniqueWindows, 0),
      bucket.firstTime,
      bucket.lastTime,
      bucket.hasLogRows,
      roundValue_(Math.min(100, bucket.validMinutes * 100 / 1440), 1),
      bucket.signalIssueWindows,
      bucket.environmentFailWindows,
      bucket.environmentFailSamples,
      bucket.minFreeHeap || '',
      bucket.resetIssueWindows
    ];
  });

  sortRowsNewestFirst_(rows, 1, null, null, 0);

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

function buildAlternatingColumnColorBackgrounds_(rowCount, colors, oddLightenAmount, evenLightenAmount) {
  const oddColors = colors.map((color) => lightenHexColor_(color, oddLightenAmount));
  const evenColors = colors.map((color) => lightenHexColor_(color, evenLightenAmount));
  const backgrounds = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    backgrounds.push((rowIndex % 2 === 0 ? oddColors : evenColors).slice());
  }
  return backgrounds;
}

function buildAlternatingBackgrounds_(rowCount, colCount, oddColor, evenColor) {
  const backgrounds = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const fill = rowIndex % 2 === 0 ? oddColor : evenColor;
    backgrounds.push(Array(colCount).fill(fill));
  }
  return backgrounds;
}

function estimateHeaderMinWidth_(headerText) {
  const text = String(headerText || '').trim();
  if (!text) {
    return 70;
  }

  if (HEADER_WIDTH_OVERRIDES[text]) {
    return HEADER_WIDTH_OVERRIDES[text];
  }

  const words = text.split(/\s+/).filter((word) => word);
  const longestWord = words.reduce((maxLen, word) => Math.max(maxLen, word.length), 0);
  if (words.length > 1) {
    return Math.max(80, Math.min(140, longestWord * 12 + 20));
  }
  return Math.max(70, Math.min(130, text.length * 10 + 18));
}

function applyAdaptiveHeaderLayout_(sheet, headers) {
  const totalCols = headers.length;
  const headerHeight = headers.some((header) => String(header || '').trim().split(/\s+/).length > 1)
    ? 42
    : 32;

  for (let index = 0; index < totalCols; index++) {
    const wantedWidth = estimateHeaderMinWidth_(headers[index]);
    if (sheet.getColumnWidth(index + 1) < wantedWidth) {
      sheet.setColumnWidth(index + 1, wantedWidth);
    }
  }

  sheet.setRowHeight(1, headerHeight);
}

function findGroupBoundaryCols_(colors) {
  const boundaries = [];
  for (let index = 1; index < colors.length; index++) {
    if (colors[index] !== colors[index - 1]) {
      boundaries.push(index);
    }
  }
  return boundaries;
}

function getSheetStyleProfile_(sheetName) {
  if (sheetName === CLEAN_SUMMARY_SHEET_NAME) {
    return SHEET_STYLE_PROFILES.clean;
  }
  if (sheetName === TIMELINE_SUMMARY_SHEET_NAME) {
    return SHEET_STYLE_PROFILES.summaryTimeline;
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
  if (sheetName === CONCLUSION_SUMMARY_SHEET_NAME) {
    return SHEET_STYLE_PROFILES.summaryConclusions;
  }
  if (sheetName === DAILY_VERDICT_SHEET_NAME) {
    return SHEET_STYLE_PROFILES.dailyVerdict;
  }
  if (sheetName === DAILY_VERDICT_TABLE_SHEET_NAME) {
    return SHEET_STYLE_PROFILES.dailyVerdictTable;
  }
  return null;
}

// === Formatting and charts ===

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
        ? buildAlternatingColumnColorBackgrounds_(dataRows, profile.headerColors, 0.82, 0.87)
        : buildAlternatingBackgrounds_(dataRows, totalCols, profile.bodyOdd, profile.bodyEven)
    )
    .setBorder(true, true, true, true, true, true, '#d7dde5', SpreadsheetApp.BorderStyle.SOLID)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(false);

  const boundaryCols = profile.headerColors && profile.headerColors.length === totalCols
    ? findGroupBoundaryCols_(profile.headerColors)
    : [];
  boundaryCols.forEach((colIndex) => {
    sheet.getRange(1, colIndex, dataRows + 1, 1)
      .setBorder(null, null, null, true, null, null, '#8a8a8a', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  });

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

function writeTableToSheet_(sheetName, headers, rows, options) {
  const opts = options || {};
  const applyFormatting = opts.applyFormatting === true;
  const sheet = getOrCreateSheet_(sheetName);
  ensureMinColumnCount_(sheet, headers.length);
  sheet.clearContents();
  if (applyFormatting) {
    sheet.clearFormats();
    sheet.clearConditionalFormatRules();
    sheet.getCharts().forEach((chart) => sheet.removeChart(chart));
    sheet.showColumns(1, sheet.getMaxColumns());
    sheet.setFrozenColumns(0);
    sheet.setHiddenGridlines(false);
  }

  const output = [headers].concat(rows);
  sheet.getRange(1, 1, output.length, headers.length).setValues(output);
  if (applyFormatting) {
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
    sheet.autoResizeColumns(1, headers.length);
    applyAdaptiveHeaderLayout_(sheet, headers);
    if (output.length > 1) {
      sheet.getRange(2, 1, output.length - 1, headers.length)
        .setBorder(true, true, true, true, true, true, '#d9d9d9', SpreadsheetApp.BorderStyle.SOLID);
    }

    if (headers.indexOf('DATE') >= 0) {
      const dateCol = headers.indexOf('DATE') + 1;
      sheet.getRange(2, dateCol, Math.max(output.length - 1, 1), 1).setNumberFormat('dd-mm-yyyy');
    }
    if (headers.indexOf('TS') >= 0) {
      const tsCol = headers.indexOf('TS') + 1;
      sheet.getRange(2, tsCol, Math.max(output.length - 1, 1), 1).setNumberFormat('dd-mm-yyyy hh:mm:ss');
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
    applyTechnicalColumnVisibilityForSheet_(sheet);
  }
}

function rebuildAnalyticsCore_(options) {
  const opts = options || {};
  const rawRecords = collectRawRecords_();
  const cleanData = buildCleanSummaryData_(rawRecords);
  const cleanRowsNewestFirst = sortRowsNewestFirst_(cleanData.cleanRows.slice(), 3, 4, 6, 0);
  const tableWriteOptions = { applyFormatting: true };

  writeTableToSheet_(CLEAN_SUMMARY_SHEET_NAME, CLEAN_SUMMARY_HEADERS, cleanRowsNewestFirst, tableWriteOptions);
  writeTableToSheet_(TIMELINE_SUMMARY_SHEET_NAME, TIMELINE_SUMMARY_HEADERS, buildTimelineSummaryRows_(cleanData.uniqueRecords), tableWriteOptions);
  writeTableToSheet_(DAYPART_SUMMARY_SHEET_NAME, DAYPART_SUMMARY_HEADERS, buildDayPartSummaryRows_(cleanData.uniqueRecords), tableWriteOptions);
  writeTableToSheet_(LEVEL_SUMMARY_SHEET_NAME, LEVEL_SUMMARY_HEADERS, buildLevelSummaryRows_(cleanData.uniqueRecords), tableWriteOptions);
  writeTableToSheet_(HEALTH_SUMMARY_SHEET_NAME, HEALTH_SUMMARY_HEADERS, buildHealthSummaryRows_(cleanData.uniqueRecords), tableWriteOptions);
  writeTableToSheet_(CONCLUSION_SUMMARY_SHEET_NAME, CONCLUSION_SUMMARY_HEADERS, buildConclusionSummaryRows_(cleanData.uniqueRecords), tableWriteOptions);
  writeTableToSheet_(DAILY_VERDICT_SHEET_NAME, DAILY_VERDICT_HEADERS, buildDailyVerdictRows_(cleanData.uniqueRecords), tableWriteOptions);
  writeTableToSheet_(DAILY_VERDICT_TABLE_SHEET_NAME, DAILY_VERDICT_TABLE_HEADERS, buildDailyVerdictTableRows_(cleanData.uniqueRecords), tableWriteOptions);
  rebuildAnalyticsCharts_({
    applyFormatting: true,
    silent: opts.silent === true
  });

  if (!opts.silent) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Analytics rebuilt: ${cleanData.uniqueRecords.length} unique windows from ${rawRecords.length} raw rows.`,
      'BS Noise',
      8
    );
  }
}

function rebuildAnalytics_() {
  rebuildAnalyticsCore_({
    formatCharts: true
  });
}

// === Web app entry points ===

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      mode: 'GET',
      schema: HEADERS.length,
      dba: true
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPostUnlocked_(e) {
  const data = JSON.parse(e.postData.contents);
  const valueOrBlank = (value) => value === undefined || value === null ? '' : value;
  const normalizedDate = normalizeDateText_(valueOrBlank(data.date));
  const normalizedTimeFrom = normalizeTimeText_(valueOrBlank(data.time_from));
  const normalizedTimeTo = normalizeTimeText_(valueOrBlank(data.time_to));
  const levelText = validDbaWindow_(data.dba_leq_est, data.dba_valid_pct,
                                    data.acoustic_rev, data.window_minutes)
    ? noiseLevelFromDba_(data.dba_leq_est)
    : 'NO DATA';
  const sheet = ensureWritableLogSheet_(normalizedDate);
  const recordKey = buildRecordKeyFromPayload_(data);

  if (sheetHasRecordKey_(sheet, recordKey)) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, deduped: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const rowValues = [
    valueOrBlank(data.device_id),
    valueOrBlank(data.fw_version),
    valueOrBlank(data.build),
    normalizedDate,
    normalizedTimeFrom,
    normalizedTimeTo,
    valueOrBlank(data.part),
    levelText,
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
    valueOrBlank(data.samples),
    valueOrBlank(data.uptime),
    valueOrBlank(data.p2p_p95),
    valueOrBlank(data.p2p_min),
    valueOrBlank(data.p2p_max),
    valueOrBlank(data.p2p_stable_max),
    valueOrBlank(data.session_p2p_min),
    valueOrBlank(data.session_p2p_max),
    valueOrBlank(data.session_p2p_stable_max),
    valueOrBlank(data.env_ok_count),
    valueOrBlank(data.env_fail_count),
    valueOrBlank(data.free_heap),
    valueOrBlank(data.min_free_heap),
    valueOrBlank(data.boot_seq),
    valueOrBlank(data.reset_reason),
    valueOrBlank(data.acoustic_rev),
    valueOrBlank(data.dba_leq_est),
    valueOrBlank(data.dba_valid_pct),
    valueOrBlank(data.dba_faults),
    valueOrBlank(data.dba_clips)
  ];
  prependLogRow_(sheet, rowValues);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    throw new Error('BS Noise log writer is busy; retry the window upload.');
  }

  try {
    return doPostUnlocked_(e);
  } finally {
    lock.releaseLock();
  }
}
