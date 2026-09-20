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
  this.__noiseLevelFromDba = noiseLevelFromDba_;
  this.__buildConclusionSummaryRows = buildConclusionSummaryRows_;
  this.__buildUserSummaryRows = buildUserSummaryRows_;
  this.__buildUserMeasurementRows = buildUserMeasurementRows_;
  this.__buildCleanSummaryData = buildCleanSummaryData_;
  this.__buildDayPartSummaryRows = buildDayPartSummaryRows_;
  this.__buildDailyVerdictRows = buildDailyVerdictRows_;
  this.__buildDailyVerdictTableRows = buildDailyVerdictTableRows_;
  this.__headers = {
    clean: CLEAN_SUMMARY_HEADERS,
    daypart: DAYPART_SUMMARY_HEADERS,
    conclusions: CONCLUSION_SUMMARY_HEADERS,
    userSummary: USER_SUMMARY_HEADERS,
    userMeasurements: USER_MEASUREMENTS_HEADERS,
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

assert.strictEqual(sandbox.__getCoverageConfidence(85), 'OK');
assert.strictEqual(sandbox.__getCoverageConfidence(60), 'PARTIAL');
assert.strictEqual(sandbox.__getCoverageConfidence(20), 'PARTIAL');
assert.strictEqual(sandbox.__getCoverageConfidence(0), 'NO DATA');
assert.strictEqual(sandbox.__noiseLevelFromDba(55.9), 'SILENT');
assert.strictEqual(sandbox.__noiseLevelFromDba(56.0), 'NORMAL');
assert.strictEqual(sandbox.__noiseLevelFromDba(61.9), 'NORMAL');
assert.strictEqual(sandbox.__noiseLevelFromDba(62.0), 'LOUD');
assert.strictEqual(sandbox.__noiseLevelFromDba(65.9), 'LOUD');
assert.strictEqual(sandbox.__noiseLevelFromDba(66.0), 'PEAK');
assert.strictEqual(sandbox.__noiseLevelFromDba(''), 'NO DATA');

const records = [];
for (let index = 0; index < 11; index++) {
  records.push({
    deviceId: 'bs-esp32-01', dateText: '2026-08-30', partText: 'DAY',
    buildText: '157', timeFromText: '10:00:00', timeToText: '10:09:59',
    isValid: true, dbaLeqEstimate: 59, dbaValidPct: 100,
    windowMinutes: 10, levelText: 'NORMAL'
  });
}
for (let index = 0; index < 9; index++) {
  records.push({
    deviceId: 'bs-esp32-01', dateText: '2026-08-30', partText: 'DAY',
    buildText: '157', timeFromText: '11:00:00', timeToText: '11:09:59',
    isValid: true, dbaLeqEstimate: 63, dbaValidPct: 100,
    windowMinutes: 10, levelText: 'LOUD'
  });
}

const conclusion = sandbox.__buildConclusionSummaryRows(records)[0];
assert.strictEqual(conclusion[4], 'MIXED NORMAL/LOUD');
const expectedDba = 10 * Math.log10((11 * Math.pow(10, 59 / 10) +
  9 * Math.pow(10, 63 / 10)) / 20);
assert.ok(Math.abs(conclusion[3] - expectedDba) < 0.1,
  'Day-part dB must be averaged by energy, not arithmetic dB.');
assert.strictEqual(conclusion[9], 'PARTIAL');
assert.strictEqual(conclusion[10], 'MIXED');
assert.match(conclusion[11], /dB\(A\).*data partial, dominance mixed/);
const userSummary = sandbox.__buildUserSummaryRows(records)[0];
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(userSummary)),
  [
    '157', conclusion[1], conclusion[2], conclusion[3], conclusion[4],
    conclusion[5], 'PARTIAL · 30,3%', conclusion[11]
  ]
);

const verdict = sandbox.__buildDailyVerdictRows(records)[0];
assert.strictEqual(verdict[3], 'MIXED NORMAL/LOUD');
assert.strictEqual(verdict[4], 2.5);
assert.strictEqual(verdict[6], 1);
assert.strictEqual(verdict[7], 1);
assert.strictEqual(verdict[11], 'PARTIAL');
assert.strictEqual(verdict[12], 'MIXED');

const dailyTable = sandbox.__buildDailyVerdictTableRows(records)[0];
assert.strictEqual(dailyTable[2], 'MIXED NORMAL/LOUD');
assert.strictEqual(dailyTable[8], 'PARTIAL');
assert.strictEqual(dailyTable[11], 'MIXED');
assert.strictEqual(dailyTable.length, 15);

const makeWindow = (key, timeFrom, dba, minutes) => ({
  deviceId: 'bs-esp32-01', dateText: '2026-08-31', partText: 'DAY',
  buildText: '157',
  timeFromText: timeFrom, recordKey: key, duplicateCount: 1,
  acousticRevision: 2, dbaLeqEstimate: dba, dbaValidPct: 100,
  windowMinutes: minutes, samples: 10, signalText: 'LOW',
  temperatureC: '', humidityPct: '', nowPct: 0, hourPct: 0,
  totalPct: 0, avgPeakToPeak: 321, rawMin: -123, rawMax: 456,
  dbaClips: 0, quietCount: 0, loudCount: 0
});
const clean = sandbox.__buildCleanSummaryData([
  makeWindow('first', '12:00:00', 50, 5),
  makeWindow('second', '12:10:00', 60, 10),
  makeWindow('missing', '12:20:00', '', 10)
]);
assert.strictEqual(clean.uniqueRecords[0].isValid, true,
  'Low main-loop SAMPLES and relative LOW must not invalidate sound dB.');
assert.strictEqual(clean.uniqueRecords[0].levelText, 'SILENT');
assert.strictEqual(clean.uniqueRecords[1].levelText, 'NORMAL');
assert.strictEqual(clean.uniqueRecords[2].isValid, false);
assert.strictEqual(clean.uniqueRecords[2].levelText, 'NO DATA');
assert.strictEqual(clean.cleanRows[2][29], 'NO DATA');
const userMeasurements = sandbox.__buildUserMeasurementRows(clean.uniqueRecords);
assert.strictEqual(userMeasurements.length, 3);
assert.strictEqual(userMeasurements[0][0], '157');
assert.strictEqual(userMeasurements[0][2], '12:20:00');
assert.strictEqual(userMeasurements[0][5], '');
assert.strictEqual(userMeasurements[0][6], 'NO DATA');
assert.strictEqual(userMeasurements[0][7], 'NO DATA');
assert.strictEqual(userMeasurements[0][10], 'INMP441 · REV 2 · LOW');
assert.strictEqual(userMeasurements[0][11], 321);
assert.strictEqual(userMeasurements[0][12], -123);
assert.strictEqual(userMeasurements[0][13], 456);
assert.strictEqual(userMeasurements[0][14], 0);
assert.strictEqual(userMeasurements[2][5], 50);
assert.strictEqual(userMeasurements[2][6], 'SILENT');
const daypart = sandbox.__buildDayPartSummaryRows(clean.uniqueRecords)[0];
const weightedDba = 10 * Math.log10((5 * Math.pow(10, 50 / 10) +
  10 * Math.pow(10, 60 / 10)) / 15);
assert.ok(Math.abs(daypart[20] - weightedDba) < 0.1);
assert.strictEqual(daypart[4], 2);
assert.strictEqual(daypart[6], 2.3);

assert.strictEqual(sandbox.__headers.clean.length,
  sandbox.__styles.clean.headerColors.length);
assert.strictEqual(sandbox.__headers.daypart.length,
  sandbox.__styles.summaryDaypart.headerColors.length);
assert.strictEqual(sandbox.__headers.conclusions.length,
  sandbox.__styles.summaryConclusions.headerColors.length);
assert.strictEqual(sandbox.__headers.userSummary.length,
  sandbox.__styles.userSummary.headerColors.length);
assert.strictEqual(sandbox.__headers.userMeasurements.length,
  sandbox.__styles.userMeasurements.headerColors.length);
assert.strictEqual(sandbox.__headers.verdict.length,
  sandbox.__styles.dailyVerdict.headerColors.length);
assert.strictEqual(sandbox.__headers.table.length,
  sandbox.__styles.dailyVerdictTable.headerColors.length);

console.log('Google Sheets level semantics regression: PASS');
