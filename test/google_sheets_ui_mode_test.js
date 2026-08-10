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
      assert.strictEqual(row, 1);
      assert.strictEqual(rowCount, 1);
      return {
        getValues: () => [this.headers.slice(column - 1, column - 1 + columnCount)]
      };
    },
    hideColumns(column) {
      this.hiddenColumns.add(column);
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
  ['log', ['DEV ID', 'VER', 'BUILD', 'DATE', 'NOW %', 'FREE HEAP']],
  ['08-08-2026', ['DEV ID', 'VER', 'BUILD', 'DATE', 'NOW %', 'FREE HEAP']],
  ['09-08-2026', ['DEV ID', 'VER', 'BUILD', 'DATE', 'NOW %', 'FREE HEAP']],
  ['clean_summary_10m', ['DEV ID', 'VER', 'BUILD', 'DATE', 'NOW %']],
  ['summary_health', ['DEV ID', 'DATE', 'HAS LOG ROWS']],
  ['daily_verdict_table', ['DEV ID', 'DATE', 'VERDICT']],
  ['charts', ['DASHBOARD']],
  ['notes', ['NOTE']]
];
const sheets = sheetDefinitions.map(([name, headers]) => createSheet(name, headers));
const state = {
  activeSheet: '',
  interfaceMode: 'USER',
  renderedMenu: null,
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
  setActiveSheet(sheet) {
    state.activeSheet = sheet.name;
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
        getProperty() {
          return state.interfaceMode;
        },
        setProperty(key, value) {
          state.interfaceMode = value;
        }
      };
    },
    getScriptProperties() {
      return {
        getProperty(key) {
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
  this.__onOpen = onOpen;
  this.__showAutomationStatus = showAutomationStatus_;
  this.__showDiagnosticsStatus = showDiagnosticsStatus_;
`;
vm.runInNewContext(`${source}\n${hooks}`, sandbox, { filename: codePath });

const userResult = sandbox.__applyUserMode(spreadsheet);
assert.ok(userResult.hiddenColumns > 0);
assert.strictEqual(state.activeSheet, 'charts');
assert.strictEqual(spreadsheet.getSheetByName('log').hidden, false);
assert.strictEqual(spreadsheet.getSheetByName('daily_verdict_table').hidden, false);
assert.strictEqual(spreadsheet.getSheetByName('charts').hidden, false);
assert.strictEqual(spreadsheet.getSheetByName('08-08-2026').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('clean_summary_10m').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('summary_health').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('notes').hidden, false);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(sandbox.__getDiagnosticsState(spreadsheet))),
  {
    technicalColumns: 'HIDDEN',
    archiveSheets: 'HIDDEN',
    analyticsSheets: 'MIXED'
  }
);

sandbox.__applyTechnicalMode(spreadsheet);
assert.strictEqual(spreadsheet.getSheetByName('08-08-2026').hidden, false);
assert.strictEqual(spreadsheet.getSheetByName('clean_summary_10m').hidden, false);
assert.strictEqual(spreadsheet.getSheetByName('summary_health').hidden, false);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(sandbox.__getDiagnosticsState(spreadsheet))),
  {
    technicalColumns: 'SHOWN',
    archiveSheets: 'SHOWN',
    analyticsSheets: 'SHOWN'
  }
);

state.interfaceMode = 'USER';
sandbox.__onOpen();
assert.strictEqual(state.renderedMenu.name, '⚙️ BS · USER');
assert.deepStrictEqual(
  state.renderedMenu.entries.filter((entry) => entry.type === 'item').map((entry) => entry.label),
  ['Refresh latest data', '● User mode: ACTIVE', 'Switch to Technical mode']
);

state.interfaceMode = 'TECHNICAL';
state.scriptProperties.BS_AUTO_ANALYTICS_ENABLED = 'true';
state.scriptProperties.BS_AUTO_HIDE_ARCHIVE_SHEETS_ENABLED = 'false';
state.scriptProperties.BS_TELEGRAM_AUTO_DAILY_ENABLED = 'true';
sandbox.__onOpen();
assert.strictEqual(state.renderedMenu.name, '⚙️ BS · TECH');
assert.deepStrictEqual(
  state.renderedMenu.entries.filter((entry) => entry.type === 'item').map((entry) => entry.label),
  ['Refresh latest data', 'Switch to User mode', '● Technical mode: ACTIVE']
);

let diagnosticsMenu = state.renderedMenu.entries
  .find((entry) => entry.type === 'submenu' && entry.menu.name === 'Diagnostics').menu;
assert.deepStrictEqual(
  diagnosticsMenu.entries.filter((entry) => entry.type === 'item').map((entry) => entry.label),
  [
    '● Technical columns: SHOWN',
    'Hide technical columns',
    '● Archive sheets: SHOWN',
    'Hide archive sheets',
    '● Analytics sheets: SHOWN',
    'Hide analytics sheets'
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
spreadsheet.getSheetByName('08-08-2026').hideSheet();
spreadsheet.getSheetByName('clean_summary_10m').hideSheet();
sandbox.__onOpen();
diagnosticsMenu = state.renderedMenu.entries
  .find((entry) => entry.type === 'submenu' && entry.menu.name === 'Diagnostics').menu;
assert.deepStrictEqual(
  diagnosticsMenu.entries.filter((entry) => entry.type === 'item').map((entry) => entry.label),
  [
    '● Technical columns: MIXED',
    'Hide technical columns',
    'Show all columns',
    '● Archive sheets: MIXED',
    'Hide archive sheets',
    'Show archive sheets',
    '● Analytics sheets: MIXED',
    'Hide analytics sheets',
    'Show analytics sheets'
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
assert.match(state.toasts.at(-1), /technical columns MIXED, archive sheets MIXED, analytics sheets MIXED/);

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
