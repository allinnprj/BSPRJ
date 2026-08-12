const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const codePath = path.join(__dirname, '..', 'google_sheets', 'Code.gs');
const chartsPath = path.join(__dirname, '..', 'google_sheets', 'appsheet_charts.gs');
const codeSource = fs.readFileSync(codePath, 'utf8');
const chartsSource = fs.readFileSync(chartsPath, 'utf8');
const warnings = [];
const sandbox = {
  console: {
    warn(message) {
      warnings.push(String(message));
    }
  }
};
const hooks = `
  buildDailyVerdictRows_ = () => [];
  this.__buildChartSourceBlocks = buildChartSourceBlocks_;
`;
vm.runInNewContext(`${codeSource}\n${chartsSource}\n${hooks}`, sandbox, {
  filename: chartsPath
});

const chartBlocks = sandbox.__buildChartSourceBlocks([
  {
    dateText: '2026-08-12',
    partText: 'DAY',
    avgPeakToPeak: 400,
    levelText: 'NORMAL',
    isValid: true
  },
  {
    dateText: '2026-08-12',
    partText: 'DAWN',
    avgPeakToPeak: 999,
    levelText: 'PEAK',
    isValid: true
  },
  {
    dateText: '2026-08-12',
    partText: 'NGT',
    avgPeakToPeak: 200,
    levelText: 'SILENT',
    isValid: true
  }
]);

assert.strictEqual(chartBlocks.latestDate, '2026-08-12');
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(chartBlocks.dayPartRows)),
  [
    ['DAY', 400],
    ['EVE', ''],
    ['NGT', 200]
  ]
);
assert.strictEqual(chartBlocks.coverageRows[0][1], 2);
assert.strictEqual(chartBlocks.coveragePct, 1.4);
assert.deepStrictEqual(warnings, ['Chart row skipped: unsupported PART "DAWN".']);

function getFunctionSource(source, functionName) {
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

const layoutRefreshSource = getFunctionSource(codeSource, 'refreshAllSheetFormatting_');
assert.doesNotMatch(layoutRefreshSource, /rebuildAnalyticsCharts_/);
assert.match(layoutRefreshSource, /refreshRawSheetsFormatting_/);
assert.match(layoutRefreshSource, /refreshExistingTableSheetFormatting_/);

assert.doesNotMatch(codeSource, /[А-Яа-яЁё]/);
assert.doesNotMatch(chartsSource, /[А-Яа-яЁё]/);

console.log('Google Sheets chart resilience regression: PASS');
