const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const codePath = path.join(__dirname, '..', 'google_sheets', 'Code.gs');
const source = fs.readFileSync(codePath, 'utf8');
const chartsPath = path.join(__dirname, '..', 'google_sheets', 'appsheet_charts.gs');
const chartsSource = fs.readFileSync(chartsPath, 'utf8');

const state = {
  formattedRows: [],
  headerChecks: 0,
  writtenTables: {}
};
const sandbox = { state };
const hooks = `
  ensureRawHeaderFormatting_ = () => { state.headerChecks += 1; };
  applyLogRowFormatting_ = (sheet, startRow, rowCount) => {
    state.formattedRows.push([startRow, rowCount]);
  };
  this.__sortRowsNewestFirst = sortRowsNewestFirst_;
  this.__sortRecords = sortRecords_;
  this.__prependLogRow = prependLogRow_;
  this.__getNewestDataDate = getNewestDataDate_;
  this.__buildDataBackgrounds = buildDataBackgrounds_;
  this.__buildDataBackgroundsForSheetRows = buildDataBackgroundsForSheetRows_;
  this.__headerColors = HEADER_COLORS;
  this.__dataColorsOdd = DATA_COLORS_ODD;
  this.__dataColorsEven = DATA_COLORS_EVEN;
`;
vm.runInNewContext(`${source}\n${hooks}`, sandbox, { filename: codePath });

const rawRows = [
  ['device', '', '', '2026-08-11', '23:50:00', '', 'NGT'],
  ['device', '', '', '2026-08-12', '00:10:00', '', 'NGT'],
  ['device', '', '', '2026-08-12', '00:20:00', '', 'NGT']
];
sandbox.__sortRowsNewestFirst(rawRows, 3, 4, 6, 0);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(rawRows.map((row) => [row[3], row[4]]))),
  [
    ['2026-08-12', '00:20:00'],
    ['2026-08-12', '00:10:00'],
    ['2026-08-11', '23:50:00']
  ]
);

const partRows = [
  ['device', '2026-08-12', 'DAY'],
  ['device', '2026-08-12', 'NGT'],
  ['device', '2026-08-12', 'EVE']
];
sandbox.__sortRowsNewestFirst(partRows, 1, null, 2, 0);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(partRows.map((row) => row[2]))),
  ['NGT', 'EVE', 'DAY']
);

const records = [
  { dateText: '2026-08-12', timeFromText: '00:10:00', deviceId: 'device', partText: 'NGT', sourceSheet: 'log' },
  { dateText: '2026-08-11', timeFromText: '23:50:00', deviceId: 'device', partText: 'NGT', sourceSheet: '11-08-2026' }
];
sandbox.__sortRecords(records);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(records.map((record) => record.dateText))),
  ['2026-08-11', '2026-08-12'],
  'Internal analytics chronology must remain oldest-first.'
);

const prependState = {
  maxRows: 10,
  lastRow: 3,
  insertedBefore: null,
  deletedRow: null,
  values: null,
  backgrounds: null
};
const prependSheet = {
  getMaxRows() {
    return prependState.maxRows;
  },
  getLastRow() {
    return prependState.lastRow;
  },
  insertRowBefore(row) {
    prependState.insertedBefore = row;
    prependState.maxRows++;
    prependState.lastRow++;
  },
  getRange(row, column, rowCount, columnCount) {
    if (row === 3 && column === 1 && rowCount === 1 && columnCount === 1) {
      return {
        getBackground() {
          return sandbox.__dataColorsOdd[0];
        }
      };
    }
    assert.deepStrictEqual([row, column, rowCount, columnCount], [2, 1, 1, 40]);
    return {
      setValues(values) {
        prependState.values = values;
      },
      setBackgrounds(backgrounds) {
        prependState.backgrounds = backgrounds;
      }
    };
  },
  deleteRow(row) {
    prependState.deletedRow = row;
    prependState.maxRows--;
  }
};
const newRow = Array.from({ length: 40 }, (_, index) => `value-${index}`);
assert.strictEqual(sandbox.__prependLogRow(prependSheet, newRow), 2);
assert.strictEqual(prependState.insertedBefore, 2);
assert.strictEqual(prependState.deletedRow, 11);
assert.strictEqual(prependState.maxRows, 10, 'Prepending must not consume blank-sheet capacity.');
assert.deepStrictEqual(JSON.parse(JSON.stringify(prependState.values)), [newRow]);
assert.strictEqual(state.headerChecks, 1, 'Every accepted raw row must self-heal the header formatting.');
assert.deepStrictEqual(JSON.parse(JSON.stringify(state.formattedRows.at(-1))), [2, 1]);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(prependState.backgrounds)),
  [JSON.parse(JSON.stringify(sandbox.__dataColorsEven))],
  'The new first row must be formatted opposite the shifted former first row.'
);

const dateSheet = {
  getLastRow() {
    return 4;
  },
  getRange(row, column, rowCount, columnCount) {
    assert.deepStrictEqual([row, column, rowCount, columnCount], [2, 4, 3, 1]);
    return {
      getValues() {
        return [['2026-08-10'], ['12-08-2026'], ['2026-08-11']];
      }
    };
  }
};
assert.strictEqual(sandbox.__getNewestDataDate(dateSheet), '2026-08-12');

sandbox.ContentService = {
  MimeType: { JSON: 'JSON' },
  createTextOutput(text) {
    return {
      text,
      setMimeType() {
        return this;
      }
    };
  }
};
vm.runInNewContext(`
  ensureWritableLogSheet_ = () => ({ name: 'log' });
  sheetHasRecordKey_ = () => false;
  prependLogRow_ = (sheet, rowValues) => { state.postedRow = rowValues; };
  this.__doGet = doGet;
  this.__doPostUnlocked = doPostUnlocked_;
`, sandbox);
const getResult = JSON.parse(sandbox.__doGet().text);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(getResult)),
  { ok: true, mode: 'GET', schema: 40, dba: true }
);
const postResult = sandbox.__doPostUnlocked({
  postData: {
    contents: JSON.stringify({
      device_id: 'device',
      date: '2026-08-12',
      time_from: '12:00:00',
      time_to: '12:09:59',
      part: 'DAY',
      avg_peak_to_peak: 400,
      acoustic_rev: 2,
      window_minutes: 10,
      dba_leq_est: 58.7,
      dba_valid_pct: 99,
      dba_faults: 1,
      dba_clips: 2
    })
  }
});
assert.strictEqual(JSON.parse(postResult.text).ok, true);
assert.strictEqual(state.postedRow.length, 40);
assert.strictEqual(state.postedRow[0], 'device');
assert.strictEqual(state.postedRow[3], '2026-08-12');
assert.strictEqual(state.postedRow[36], 58.7);
assert.strictEqual(state.postedRow[7], 'NORMAL');
assert.strictEqual(state.postedRow[37], 99);
assert.strictEqual(state.postedRow[38], 1);
assert.strictEqual(state.postedRow[39], 2);

const doPostStart = source.indexOf('function doPostUnlocked_(');
const doPostEnd = source.indexOf('\nfunction doPost(', doPostStart);
const doPostSource = source.slice(doPostStart, doPostEnd);
assert.match(doPostSource, /prependLogRow_\(sheet, rowValues\)/);
assert.doesNotMatch(doPostSource, /getLastRow\(\).*\+\s*1/);

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
  'buildDayPartSummaryRows_',
  'buildTimelineSummaryRows_',
  'buildLevelSummaryRows_',
  'buildConclusionSummaryRows_',
  'buildDailyVerdictTableRows_',
  'buildHealthSummaryRows_'
].forEach((functionName) => {
  assert.match(getFunctionSource(functionName), /sortRowsNewestFirst_/);
});
assert.match(getFunctionSource('rebuildAnalyticsCore_'), /cleanRowsNewestFirst/);
assert.match(getFunctionSource('ensureRawHeaderFormatting_'), /ensureHeaderRowValues_/);
assert.match(getFunctionSource('ensureRawHeaderFormatting_'), /setFontColor\('#274e13'\)/);
assert.match(getFunctionSource('ensureRawHeaderFormatting_'), /setBackgrounds\(\[HEADER_COLORS\]\)/);
assert.match(getFunctionSource('ensureRawHeaderFormatting_'), /setFrozenRows\(1\)/);
assert.match(getFunctionSource('ensureRawHeaderFormatting_'), /setFrozenColumns\(0\)/);
assert.match(getFunctionSource('ensureHeaderFormatting_'), /ensureRawHeaderFormatting_/);
assert.match(getFunctionSource('prependLogRow_'), /ensureRawHeaderFormatting_/);
assert.match(getFunctionSource('prependLogRow_'), /applyLogRowFormatting_\(sheet, 2, 1\)/);
assert.doesNotMatch(getFunctionSource('prependLogRow_'), /applyLogRowFormatting_\(sheet, 2, Math\.max/);
const rawBodyBackgrounds = JSON.parse(JSON.stringify(sandbox.__buildDataBackgrounds(3)));
assert.notDeepStrictEqual(rawBodyBackgrounds[0], rawBodyBackgrounds[1]);
assert.deepStrictEqual(rawBodyBackgrounds[0], rawBodyBackgrounds[2]);
const appendedBodyBackgrounds = JSON.parse(JSON.stringify(sandbox.__buildDataBackgroundsForSheetRows(7, 2)));
assert.notDeepStrictEqual(appendedBodyBackgrounds[0], appendedBodyBackgrounds[1]);
assert.deepStrictEqual(appendedBodyBackgrounds[0], rawBodyBackgrounds[1]);
assert.deepStrictEqual(appendedBodyBackgrounds[1], rawBodyBackgrounds[0]);
assert.notDeepStrictEqual(
  JSON.parse(JSON.stringify(sandbox.__headerColors)),
  JSON.parse(JSON.stringify(sandbox.__dataColorsOdd))
);
assert.notDeepStrictEqual(
  JSON.parse(JSON.stringify(sandbox.__headerColors)),
  JSON.parse(JSON.stringify(sandbox.__dataColorsEven))
);
assert.match(getFunctionSource('buildDataBackgrounds_'), /%\s*2/);
assert.match(getFunctionSource('buildDataBackgroundsForSheetRows_'), /%\s*2/);
assert.match(chartsSource, /const verdictDisplayRows = verdictChartRows\.slice\(\)\.reverse\(\)/);
assert.match(chartsSource, /setValues\(verdictDisplayRows\)/);
assert.match(chartsSource, /setValues\(verdictChartRows\)/);

assert.doesNotMatch(source, /[А-Яа-яЁё]/);
assert.doesNotMatch(chartsSource, /[А-Яа-яЁё]/);

console.log('Google Sheets newest-first table order regression: PASS');
