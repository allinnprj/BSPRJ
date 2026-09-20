const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const codePath = path.join(__dirname, '..', 'google_sheets', 'Code.gs');
const source = fs.readFileSync(codePath, 'utf8');

function createSheet(name, headers) {
  return {
    name,
    headers: headers || [],
    hidden: false,
    hiddenColumns: new Set(),
    hideColumnCalls: 0,
    getName() {
      return this.name;
    },
    isSheetHidden() {
      return this.hidden;
    },
    showSheet() {
      this.hidden = false;
    },
    hideSheet() {
      this.hidden = true;
    },
    getLastColumn() {
      return this.headers.length;
    },
    getMaxColumns() {
      return Math.max(this.headers.length, 1);
    },
    getRange(row, column, rowCount, columnCount) {
      state.rangeReadCount++;
      assert.strictEqual(row, 1);
      assert.strictEqual(rowCount, 1);
      return {
        getValues: () => [this.headers.slice(column - 1, column - 1 + columnCount)]
      };
    },
    hideColumns(column, count) {
      this.hideColumnCalls++;
      const columnCount = count || 1;
      for (let index = column; index < column + columnCount; index++) {
        this.hiddenColumns.add(index);
      }
    },
    showColumns(column, count) {
      for (let index = column; index < column + count; index++) {
        this.hiddenColumns.delete(index);
      }
    },
    isColumnHiddenByUser(column) {
      return this.hiddenColumns.has(column);
    }
  };
}

const sheetDefinitions = [
  ['log', ['DEV ID', 'VER', 'BUILD', 'DATE', 'T FROM', 'T TO', 'PART', 'LEVEL', 'NOW %', 'H %', 'M %', 'RAW MIN', 'RAW MAX', 'AVG P2P', 'SIG IN', 'TEMP C', 'HUM %', 'WIN MIN', 'UPTIME', 'FREE HEAP', 'DBA LEQ EST']],
  ['08-08-2026', ['DEV ID', 'VER', 'BUILD', 'DATE', 'T FROM', 'T TO', 'PART', 'LEVEL', 'NOW %', 'H %', 'M %', 'RAW MIN', 'RAW MAX', 'AVG P2P', 'SIG IN', 'TEMP C', 'HUM %', 'WIN MIN', 'UPTIME', 'FREE HEAP', 'DBA LEQ EST']],
  ['09-08-2026', ['DEV ID', 'VER', 'BUILD', 'DATE', 'T FROM', 'T TO', 'PART', 'LEVEL', 'NOW %', 'H %', 'M %', 'RAW MIN', 'RAW MAX', 'AVG P2P', 'SIG IN', 'TEMP C', 'HUM %', 'WIN MIN', 'UPTIME', 'FREE HEAP', 'DBA LEQ EST']],
  ['clean_summary_10m', ['DEV ID', 'VER', 'BUILD', 'DATE', 'NOW %']],
  ['summary_health', ['DEV ID', 'DATE', 'HAS LOG ROWS']],
  ['daily_verdict_table', ['DEV ID', 'DATE', 'VERDICT']],
  ['Summary', ['BUILD', 'DATE', 'PART', 'DBA LEQ EST', 'MAIN LEVEL']],
  ['Measurements', ['BUILD', 'DATE', 'T FROM', 'T TO', 'PART', 'DBA LEQ EST', 'LEVEL', 'DATA QUALITY', 'TEMP C', 'HUM %', 'MICROPHONE', 'MIC RANGE AVG', 'MIC RAW MIN', 'MIC RAW MAX', 'MIC OVERLOADS']],
  ['Charts', ['NOISE OVERVIEW']],
  ['Technical Log', ['BUILD', 'DATE', 'START', 'END', 'PERIOD', 'AVG SOUND DB(A)', 'SOUND LEVEL', 'MEASURED MIN', 'VALID AUDIO %', 'AUDIO ERRORS', 'MIC OVERLOADS', 'MIC SIGNAL', 'RUN TIME', 'START COUNT', 'RESTART REASON']],
  ['notes', ['NOTE']]
];
const sheets = sheetDefinitions.map(([name, headers]) => createSheet(name, headers));
const state = {
  activeSheet: '',
  userProperties: {
    BS_USER_INTERFACE_MODE: 'USER'
  },
  documentProperties: {},
  renderedMenu: null,
  renderedMenuNames: [],
  rangeReadCount: 0,
  throwScriptProperties: false,
  scriptProperties: {
    BS_AUTO_ANALYTICS_ENABLED: 'false',
    BS_AUTO_HIDE_ARCHIVE_SHEETS_ENABLED: 'false',
    BS_TELEGRAM_AUTO_DAILY_ENABLED: 'false'
  },
  toasts: []
};
const spreadsheet = {
  getSheets() {
    return sheets;
  },
  getSheetByName(name) {
    return sheets.find((sheet) => sheet.name === name) || null;
  },
  getActiveSheet() {
    return this.getSheetByName(state.activeSheet) || this.getSheetByName('log');
  },
  setActiveSheet(sheet) {
    state.activeSheet = sheet.name;
  },
  moveActiveSheet(position) {
    const index = sheets.findIndex((sheet) => sheet.name === state.activeSheet);
    const [sheet] = sheets.splice(index, 1);
    sheets.splice(position - 1, 0, sheet);
  },
  toast(message) {
    state.toasts.push(String(message));
  },
  deleteSheet() {
    throw new Error('UI modes must not delete sheets.');
  }
};

function createMenu(name) {
  return {
    name,
    entries: [],
    addItem(label, functionName) {
      this.entries.push({ type: 'item', label, functionName });
      return this;
    },
    addSeparator() {
      this.entries.push({ type: 'separator' });
      return this;
    },
    addSubMenu(menu) {
      this.entries.push({ type: 'submenu', menu });
      return this;
    },
    addToUi() {
      state.renderedMenu = this;
      state.renderedMenuNames.push(this.name);
      return this;
    }
  };
}

const ui = {
  createMenu
};
const sandbox = {
  SpreadsheetApp: {
    getActiveSpreadsheet() {
      return spreadsheet;
    },
    getUi() {
      return ui;
    }
  },
  PropertiesService: {
    getUserProperties() {
      return {
        getProperty(key) {
          return state.userProperties[key] || '';
        },
        setProperty(key, value) {
          state.userProperties[key] = value;
        }
      };
    },
    getDocumentProperties() {
      return {
        getProperty(key) {
          return state.documentProperties[key] || '';
        },
        setProperty(key, value) {
          state.documentProperties[key] = value;
        }
      };
    },
    getScriptProperties() {
      return {
        getProperty(key) {
          if (state.throwScriptProperties) {
            throw new Error('Simulated property read failure.');
          }
          return state.scriptProperties[key] || '';
        }
      };
    }
  },
  state
};
const hooks = `
  this.__applyUserMode = applyUserMode_;
  this.__applyTechnicalMode = applyTechnicalMode_;
  this.__getDiagnosticsState = getDiagnosticsState_;
  this.__refreshDiagnosticsStateCache = refreshDiagnosticsStateCache_;
  this.__refreshBsMenuStatus = refreshBsMenuStatus_;
  this.__onOpen = onOpen;
  this.__showAutomationStatus = showAutomationStatus_;
  this.__showDiagnosticsStatus = showDiagnosticsStatus_;
  this.__headers = HEADERS;
  this.__rawLogUserHeaders = RAW_LOG_USER_HEADERS;
  this.__rawLogTechnicalHeaders = RAW_LOG_TECHNICAL_HEADERS;
  this.__technicalLogHeaders = TECHNICAL_LOG_HEADERS;
  this.__buildTechnicalLogRows = buildTechnicalLogRows_;
`;
vm.runInNewContext(`${source}\n${hooks}`, sandbox, { filename: codePath });

const userResult = sandbox.__applyUserMode(spreadsheet);
assert.ok(userResult.hiddenColumns > 0);
assert.strictEqual(userResult.userViewsReady, true);
assert.strictEqual(state.activeSheet, 'Summary');
assert.deepStrictEqual(sheets.slice(0, 3).map((sheet) => sheet.name), ['Summary', 'Measurements', 'Charts']);
assert.strictEqual(spreadsheet.getSheetByName('log').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('daily_verdict_table').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('Summary').hidden, false);
assert.strictEqual(spreadsheet.getSheetByName('Measurements').hidden, false);
assert.strictEqual(spreadsheet.getSheetByName('Charts').hidden, false);
assert.strictEqual(spreadsheet.getSheetByName('Technical Log').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('08-08-2026').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('clean_summary_10m').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('summary_health').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('notes').hidden, false);
const logSheet = spreadsheet.getSheetByName('log');
const measurementsSheet = spreadsheet.getSheetByName('Measurements');
['DEV ID', 'DATE', 'T FROM', 'T TO', 'PART', 'LEVEL', 'NOW %', 'H %', 'M %', 'AVG P2P', 'DBA LEQ EST', 'SIG IN', 'TEMP C', 'HUM %']
  .forEach((header) => assert.strictEqual(logSheet.hiddenColumns.has(logSheet.headers.indexOf(header) + 1), false, `${header} must stay visible in User mode.`));
['VER', 'BUILD', 'RAW MIN', 'RAW MAX', 'WIN MIN', 'UPTIME', 'FREE HEAP']
  .forEach((header) => assert.strictEqual(logSheet.hiddenColumns.has(logSheet.headers.indexOf(header) + 1), true, `${header} must be hidden in User mode.`));
assert.strictEqual(logSheet.hideColumnCalls, 3, 'Contiguous raw technical columns must be hidden in three batched calls.');
['MICROPHONE', 'MIC RANGE AVG', 'MIC RAW MIN', 'MIC RAW MAX', 'MIC OVERLOADS']
  .forEach((header) => assert.strictEqual(measurementsSheet.hiddenColumns.has(measurementsSheet.headers.indexOf(header) + 1), true, `${header} must be hidden from Measurements in User mode.`));
assert.deepStrictEqual(
  Array.from(sandbox.__rawLogUserHeaders).concat(Array.from(sandbox.__rawLogTechnicalHeaders)).sort(),
  Array.from(sandbox.__headers).sort()
);
assert.strictEqual(new Set(Array.from(sandbox.__rawLogUserHeaders).concat(Array.from(sandbox.__rawLogTechnicalHeaders))).size, sandbox.__headers.length);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(sandbox.__getDiagnosticsState(spreadsheet))),
  {
    technicalColumns: 'HIDDEN',
    archiveSheets: 'HIDDEN',
    analyticsSheets: 'HIDDEN'
  }
);

sandbox.__applyTechnicalMode(spreadsheet);
assert.strictEqual(spreadsheet.getSheetByName('08-08-2026').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('09-08-2026').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('clean_summary_10m').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('summary_health').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('log').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('Technical Log').hidden, false);
assert.strictEqual(spreadsheet.getSheetByName('log').hiddenColumns.size, 0);
assert.strictEqual(spreadsheet.getSheetByName('Measurements').hiddenColumns.size, 0);
assert.deepStrictEqual(sheets.slice(0, 4).map((sheet) => sheet.name), ['Summary', 'Measurements', 'Charts', 'Technical Log']);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(sandbox.__getDiagnosticsState(spreadsheet))),
  {
    technicalColumns: 'SHOWN',
    archiveSheets: 'HIDDEN',
    analyticsSheets: 'HIDDEN'
  }
);

sandbox.__applyTechnicalMode(spreadsheet);
assert.strictEqual(spreadsheet.getSheetByName('08-08-2026').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('09-08-2026').hidden, true);

state.userProperties.BS_USER_INTERFACE_MODE = 'USER';
state.rangeReadCount = 0;
sandbox.__onOpen();
assert.strictEqual(state.rangeReadCount, 0, 'User onOpen must not scan sheet ranges.');
assert.strictEqual(state.renderedMenu.name, '⚙️ BS');
assert.deepStrictEqual(
  state.renderedMenu.entries.filter((entry) => entry.type === 'item').map((entry) => entry.label),
  ['Refresh latest data', '● Interface mode: USER', 'Switch to Technical mode']
);

state.userProperties.BS_USER_INTERFACE_MODE = 'TECHNICAL';
state.scriptProperties.BS_AUTO_ANALYTICS_ENABLED = 'true';
state.scriptProperties.BS_AUTO_HIDE_ARCHIVE_SHEETS_ENABLED = 'false';
state.scriptProperties.BS_TELEGRAM_AUTO_DAILY_ENABLED = 'true';
sandbox.__refreshDiagnosticsStateCache(spreadsheet);
state.rangeReadCount = 0;
sandbox.__onOpen();
assert.strictEqual(state.rangeReadCount, 0, 'Technical onOpen must use cached diagnostics.');
assert.strictEqual(state.renderedMenu.name, '⚙️ BS');
assert.deepStrictEqual(
  state.renderedMenu.entries.filter((entry) => entry.type === 'item').map((entry) => entry.label),
  ['Refresh latest data', '● Interface mode: TECH', 'Switch to User mode']
);
const maintenanceMenu = state.renderedMenu.entries
  .find((entry) => entry.type === 'submenu' && entry.menu.name === 'Maintenance').menu;
assert.deepStrictEqual(
  maintenanceMenu.entries.filter((entry) => entry.type === 'item').map((entry) => entry.label),
  ['Rebuild charts only', 'Repair table layout/order']
);

let diagnosticsMenu = state.renderedMenu.entries
  .find((entry) => entry.type === 'submenu' && entry.menu.name === 'Diagnostics').menu;
assert.deepStrictEqual(
  diagnosticsMenu.entries.filter((entry) => entry.type === 'item').map((entry) => entry.label),
  [
    '● Diagnostic columns: SHOWN',
    'Hide technical columns',
    '● Archive sheets: HIDDEN',
    'Show archive sheets',
    '● Internal sheets: HIDDEN',
    'Show internal sheets',
    'Refresh status indicators'
  ]
);

const automationMenu = state.renderedMenu.entries
  .find((entry) => entry.type === 'submenu' && entry.menu.name === 'Automation').menu;
const automationItems = automationMenu.entries.filter((entry) => entry.type === 'item');
assert.deepStrictEqual(
  automationItems.map((entry) => entry.label),
  [
    '● Auto analytics refresh: ON',
    'Turn OFF auto analytics refresh',
    '● Auto archive hiding: OFF',
    'Turn ON auto archive hiding',
    '● Auto daily summary: ON',
    'Turn OFF auto daily summary'
  ]
);
assert.deepStrictEqual(
  automationItems.map((entry) => entry.functionName),
  [
    'showAutomationStatus_',
    'disableAutomaticAnalyticsRefresh_',
    'showAutomationStatus_',
    'enableAutomaticArchiveSheetHiding_',
    'showAutomationStatus_',
    'disableAutomaticDailySummary_'
  ]
);

const propertiesBeforeStatusClick = JSON.stringify(state.scriptProperties);
sandbox.__showAutomationStatus();
assert.strictEqual(JSON.stringify(state.scriptProperties), propertiesBeforeStatusClick);
assert.match(state.toasts.at(-1), /analytics refresh ON, archive hiding OFF, daily summary ON/);

spreadsheet.getSheetByName('log').hideColumns(2);
spreadsheet.getSheetByName('08-08-2026').showSheet();
spreadsheet.getSheetByName('log').showSheet();
sandbox.__refreshBsMenuStatus();
assert.ok(state.rangeReadCount > 0, 'Explicit status refresh must scan actual sheet state.');
sandbox.__onOpen();
diagnosticsMenu = state.renderedMenu.entries
  .find((entry) => entry.type === 'submenu' && entry.menu.name === 'Diagnostics').menu;
assert.deepStrictEqual(
  diagnosticsMenu.entries.filter((entry) => entry.type === 'item').map((entry) => entry.label),
  [
    '● Diagnostic columns: MIXED',
    'Hide technical columns',
    'Show all columns',
    '● Archive sheets: MIXED',
    'Hide archive sheets',
    'Show archive sheets',
    '● Internal sheets: MIXED',
    'Hide internal sheets',
    'Show internal sheets',
    'Refresh status indicators'
  ]
);

const visibilityBeforeStatusClick = sheets.map((sheet) => ({
  name: sheet.name,
  hidden: sheet.hidden,
  hiddenColumns: Array.from(sheet.hiddenColumns)
}));
sandbox.__showDiagnosticsStatus();
assert.deepStrictEqual(
  sheets.map((sheet) => ({
    name: sheet.name,
    hidden: sheet.hidden,
    hiddenColumns: Array.from(sheet.hiddenColumns)
  })),
  visibilityBeforeStatusClick
);
assert.match(state.toasts.at(-1), /technical columns MIXED, archive sheets MIXED, internal sheets MIXED/);

assert.deepStrictEqual(
  Array.from(sandbox.__technicalLogHeaders),
  ['BUILD', 'DATE', 'START', 'END', 'PERIOD', 'AVG SOUND DB(A)', 'SOUND LEVEL', 'MEASURED MIN', 'VALID AUDIO %', 'AUDIO ERRORS', 'MIC OVERLOADS', 'MIC SIGNAL', 'RUN TIME', 'START COUNT', 'RESTART REASON']
);
const technicalRows = sandbox.__buildTechnicalLogRows([
  {
    buildText: '157', dateText: '2026-09-20', timeFromText: '12:00:00', timeToText: '12:09:59',
    partText: 'DAY', isValid: true, dbaLeqEstimate: 59.3, levelText: 'NORMAL', windowMinutes: 10,
    dbaValidPct: 100, dbaFaults: 0, dbaClips: 0, signalText: 'OK', uptimeText: '6 d 0 h',
    bootSequence: 7, resetReason: 'SOFT'
  },
  {
    buildText: '157', dateText: '2026-09-20', timeFromText: '12:10:00', timeToText: '12:19:59',
    partText: 'DAY', isValid: false, dbaLeqEstimate: 60.1, levelText: 'NO DATA', windowMinutes: 10,
    dbaValidPct: 90, dbaFaults: 2, dbaClips: 1, signalText: 'CHECK', uptimeText: '6 d 0 h',
    bootSequence: 7, resetReason: 'SOFT'
  }
]);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(technicalRows)),
  [
    ['157', '2026-09-20', '12:10:00', '12:19:59', 'DAY', '', 'NO DATA', 10, 90, 2, 1, 'CHECK', '6 d 0 h', 7, 'SOFT'],
    ['157', '2026-09-20', '12:00:00', '12:09:59', 'DAY', 59.3, 'NORMAL', 10, 100, 0, 0, 'OK', '6 d 0 h', 7, 'SOFT']
  ]
);

state.throwScriptProperties = true;
sandbox.__onOpen();
assert.strictEqual(state.renderedMenu.name, '⚙️ BS');
assert.deepStrictEqual(
  state.renderedMenu.entries.filter((entry) => entry.type === 'item').map((entry) => entry.label),
  ['Refresh latest data']
);
state.throwScriptProperties = false;
assert.deepStrictEqual(Array.from(new Set(state.renderedMenuNames)), ['⚙️ BS']);

function getFunctionSource(functionName) {
  const start = source.indexOf(`function ${functionName}(`);
  assert.notStrictEqual(start, -1, `Missing function ${functionName}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index++) {
    if (source[index] === '{') depth++;
    if (source[index] === '}') depth--;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Unclosed function ${functionName}`);
}

assert.match(getFunctionSource('ensureHeaderFormatting_'), /applyTechnicalColumnVisibilityForSheet_/);
assert.match(getFunctionSource('writeTableToSheet_'), /applyTechnicalColumnVisibilityForSheet_/);
assert.match(getFunctionSource('ensureWritableLogSheet_'), /archivedSheet\.hideSheet\(\)/);
assert.match(getFunctionSource('hideColumnsByHeaderNames_'), /sheet\.hideColumns\(startColumn, columnCount\)/);

[
  'enableAutomaticAnalyticsRefresh_',
  'disableAutomaticAnalyticsRefresh_',
  'enableAutomaticArchiveSheetHiding_',
  'disableAutomaticArchiveSheetHiding_',
  'enableAutomaticDailySummary_',
  'disableAutomaticDailySummary_',
  'hideTechnicalColumns_',
  'showAllColumns_',
  'hideArchiveSheetsFromMenu_',
  'showArchiveSheetsFromMenu_',
  'hideAnalyticsSheetsFromMenu_',
  'showAnalyticsSheetsFromMenu_'
].forEach((functionName) => {
  assert.match(getFunctionSource(functionName), /onOpen\(\);/);
});

assert.doesNotMatch(source, /[А-Яа-яЁё]/);

console.log('Google Sheets user/technical UI modes regression: PASS');
