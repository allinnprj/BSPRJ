const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const codePath = path.join(__dirname, '..', 'google_sheets', 'Code.gs');
const source = fs.readFileSync(codePath, 'utf8');

function createSheet(name) {
  return {
    name,
    hidden: false,
    getName() {
      return this.name;
    },
    showSheet() {
      this.hidden = false;
    },
    hideSheet() {
      this.hidden = true;
    }
  };
}

const sheetNames = [
  'log',
  '08-08-2026',
  'clean_summary_10m',
  'summary_health',
  'daily_verdict_table',
  'charts',
  'notes'
];
const sheets = sheetNames.map(createSheet);
const state = {
  activeSheet: '',
  technicalColumnsHidden: false,
  allColumnsShown: false
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
  deleteSheet() {
    throw new Error('UI modes must not delete sheets.');
  }
};
const sandbox = {
  SpreadsheetApp: {
    getActiveSpreadsheet() {
      return spreadsheet;
    }
  },
  state
};
const hooks = `
  hideTechnicalColumnsCore_ = () => {
    state.technicalColumnsHidden = true;
    return 7;
  };
  showAllColumnsCore_ = () => {
    state.allColumnsShown = true;
  };
  this.__applyUserMode = applyUserMode_;
  this.__applyTechnicalMode = applyTechnicalMode_;
`;
vm.runInNewContext(`${source}\n${hooks}`, sandbox, { filename: codePath });

const userResult = sandbox.__applyUserMode(spreadsheet);
assert.strictEqual(userResult.hiddenColumns, 7);
assert.strictEqual(state.technicalColumnsHidden, true);
assert.strictEqual(state.activeSheet, 'charts');
assert.strictEqual(spreadsheet.getSheetByName('log').hidden, false);
assert.strictEqual(spreadsheet.getSheetByName('daily_verdict_table').hidden, false);
assert.strictEqual(spreadsheet.getSheetByName('charts').hidden, false);
assert.strictEqual(spreadsheet.getSheetByName('08-08-2026').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('clean_summary_10m').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('summary_health').hidden, true);
assert.strictEqual(spreadsheet.getSheetByName('notes').hidden, false);

sandbox.__applyTechnicalMode(spreadsheet);
assert.strictEqual(state.allColumnsShown, true);
assert.strictEqual(spreadsheet.getSheetByName('08-08-2026').hidden, false);
assert.strictEqual(spreadsheet.getSheetByName('clean_summary_10m').hidden, false);
assert.strictEqual(spreadsheet.getSheetByName('summary_health').hidden, false);

assert.match(source, /addItem\('User mode', 'enableUserMode_'\)/);
assert.match(source, /addItem\('Technical mode', 'enableTechnicalMode_'\)/);
assert.match(source, /createMenu\('Maintenance'\)/);
assert.match(source, /createMenu\('Diagnostics'\)/);
assert.match(source, /createMenu\('Automation'\)/);
assert.doesNotMatch(source, /[А-Яа-яЁё]/);

console.log('Google Sheets user/technical UI modes regression: PASS');
