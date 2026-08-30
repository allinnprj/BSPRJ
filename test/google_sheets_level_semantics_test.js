const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const codePath = path.join(__dirname, '..', 'google_sheets', 'Code.gs');
const source = fs.readFileSync(codePath, 'utf8');
const sandbox = {};
const hooks = `
  this.__getMainLevelStats = getMainLevelStats_;
  this.__getCoverageConfidence = getCoverageConfidence_;
  this.__buildConclusionSummaryRows = buildConclusionSummaryRows_;
  this.__buildDailyVerdictRows = buildDailyVerdictRows_;
  this.__buildDailyVerdictTableRows = buildDailyVerdictTableRows_;
  this.__headers = {
    conclusions: CONCLUSION_SUMMARY_HEADERS,
    verdict: DAILY_VERDICT_HEADERS,
    table: DAILY_VERDICT_TABLE_HEADERS
  };
  this.__styles = SHEET_STYLE_PROFILES;
`;
vm.runInNewContext(`${source}\n${hooks}`, sandbox, { filename: codePath });

const mixed = sandbox.__getMainLevelStats({ SILENT: 0, NORMAL: 11, LOUD: 9, PEAK: 0 });
assert.strictEqual(mixed.level, 'MIXED NORMAL/LOUD');
assert.strictEqual(mixed.sharePct, 55);
assert.strictEqual(mixed.leadPct, 10);
assert.strictEqual(mixed.dominance, 'MIXED');

const strong = sandbox.__getMainLevelStats({ SILENT: 1, NORMAL: 7, LOUD: 2, PEAK: 0 });
assert.strictEqual(strong.level, 'NORMAL');
assert.strictEqual(strong.dominance, 'STRONG');

const weak = sandbox.__getMainLevelStats({ SILENT: 3, NORMAL: 4, LOUD: 3, PEAK: 0 });
assert.strictEqual(weak.level, 'NORMAL');
assert.strictEqual(weak.dominance, 'WEAK');

assert.strictEqual(sandbox.__getCoverageConfidence(85), 'GOOD');
assert.strictEqual(sandbox.__getCoverageConfidence(60), 'PARTIAL');
assert.strictEqual(sandbox.__getCoverageConfidence(20), 'WEAK');

const records = [];
for (let index = 0; index < 11; index++) {
  records.push({
    deviceId: 'bs-esp32-01', dateText: '2026-08-30', partText: 'DAY',
    isValid: true, avgPeakToPeak: 500, levelText: 'NORMAL'
  });
}
for (let index = 0; index < 9; index++) {
  records.push({
    deviceId: 'bs-esp32-01', dateText: '2026-08-30', partText: 'DAY',
    isValid: true, avgPeakToPeak: 700, levelText: 'LOUD'
  });
}

const conclusion = sandbox.__buildConclusionSummaryRows(records)[0];
assert.strictEqual(conclusion[4], 'MIXED NORMAL/LOUD');
assert.strictEqual(conclusion[9], 'WEAK');
assert.strictEqual(conclusion[10], 'MIXED');
assert.match(conclusion[11], /data weak, dominance mixed/);

const verdict = sandbox.__buildDailyVerdictRows(records)[0];
assert.strictEqual(verdict[3], 'MIXED NORMAL/LOUD');
assert.strictEqual(verdict[4], 2.5);
assert.strictEqual(verdict[6], 1);
assert.strictEqual(verdict[7], 1);
assert.strictEqual(verdict[11], 'WEAK');
assert.strictEqual(verdict[12], 'MIXED');

const dailyTable = sandbox.__buildDailyVerdictTableRows(records)[0];
assert.strictEqual(dailyTable[2], 'MIXED NORMAL/LOUD');
assert.strictEqual(dailyTable[8], 'WEAK');
assert.strictEqual(dailyTable[11], 'MIXED');
assert.strictEqual(dailyTable.length, 15);

assert.strictEqual(sandbox.__headers.conclusions.length,
  sandbox.__styles.summaryConclusions.headerColors.length);
assert.strictEqual(sandbox.__headers.verdict.length,
  sandbox.__styles.dailyVerdict.headerColors.length);
assert.strictEqual(sandbox.__headers.table.length,
  sandbox.__styles.dailyVerdictTable.headerColors.length);

console.log('Google Sheets level semantics regression: PASS');
