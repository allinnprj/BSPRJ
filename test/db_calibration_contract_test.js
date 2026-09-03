const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const logHeader = fs.readFileSync(path.join(root, 'include', 'log_service.h'), 'utf8');
const logSource = fs.readFileSync(path.join(root, 'src', 'log_service.cpp'), 'utf8');
const telegram = fs.readFileSync(path.join(root, 'src', 'telegram_alert_service.cpp'), 'utf8');
const display = fs.readFileSync(path.join(root, 'src', 'display_view.cpp'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src', 'main.cpp'), 'utf8');
const version = fs.readFileSync(path.join(root, 'include', 'project_version.h'), 'utf8');
const platformio = fs.readFileSync(path.join(root, 'platformio.ini'), 'utf8');

function functionBody(text, signature, nextSignature) {
  const start = text.indexOf(signature);
  assert.notStrictEqual(start, -1, `Missing function ${signature}`);
  const end = nextSignature ? text.indexOf(nextSignature, start + signature.length) : text.length;
  assert.notStrictEqual(end, -1, `Missing boundary ${nextSignature}`);
  return text.slice(start, end);
}

assert.match(version, /#define PROJECT_VERSION "0\.1\.94-EXP"/);
assert.match(version, /#define PROJECT_BUILD 148\b/);
assert.match(logSource, /kDbCalibrationDurationMs = 20UL \* 60UL \* 1000UL/);
assert.match(logSource, /kDbCalibrationBucketMs = 10000UL/);
assert.match(logSource, /kDbCalibrationPath\[\] = "\/dbcal\.csv"/);
assert.match(logSource, /elapsed_s,p2p_avg,p2p_min,p2p_max,raw_min,raw_max,samples,signal,build,acoustic_rev/);
assert.match(logSource, /dbcal-%Y%m%d-%H%M%S\.csv/);
assert.match(logSource, /logServer\.on\("\/dbcal\.csv", HTTP_GET, handleDbCalibrationDownload\)/);

const startBody = functionBody(
  logSource,
  'DbCalibrationStartResult LogService::startDbCalibration(',
  'DbCalibrationStopResult LogService::stopDbCalibration('
);
assert.match(startBody, /time\(nullptr\)[\s\S]*currentEpoch < 1700000000/);
assert.match(startBody, /LittleFS\.open\(kDbCalibrationPath, FILE_WRITE\)/);
assert.match(startBody, /file\.println\(kDbCalibrationHeader\)/);
assert.doesNotMatch(startBody, /kLogPath|kLegacyLogPath|remove\(/,
  'Starting calibration must replace only its dedicated file.');

const updateBody = functionBody(
  logSource,
  'void LogService::updateDbCalibration(',
  'bool LogService::dbCalibrationActive() const'
);
assert.match(updateBody, /if \(snapshot\.statsUpdated\)/);
assert.match(updateBody, /dbCalibrationP2pSum \+= snapshot\.statsLevel/);
assert.match(updateBody, /kDbCalibrationBucketMs[\s\S]*appendDbCalibrationBucket/);
assert.match(updateBody, /kDbCalibrationDurationMs[\s\S]*DbCalibrationTerminalState::Completed/);
assert.doesNotMatch(updateBody, /delay\s*\(/);

for (const command of ['dbstart', 'dbsts', 'dbstop']) {
  assert.match(telegram, new RegExp(`isDbCommand\\(command, "${command}"\\)`));
  assert.match(telegram, new RegExp(`<code>/${command}</code>`));
}
assert.match(telegram, /State: <b>Started<\/b>/);
assert.match(telegram, /State: <b>Complete<\/b>/);
assert.ok(telegram.includes('dbcal.csv\\">Download '),
  'Completion replies must include the dedicated CSV download link.');
assert.match(display, /dB CAL REC/);
assert.match(display, /POINTS %u/);
assert.match(main, /latestSnapshot = audioSampler\.sample\(\);[\s\S]*logService\.updateDbCalibration\(latestSnapshot, nowMs\);/);
assert.match(main, /updateGoogleSheetsWindow\(latestSnapshot, timeService\)/,
  'Normal Google Sheets aggregation must remain active.');
assert.match(main, /logService\.dbCalibrationActive\(\)[\s\S]*showDbCalibration/);
assert.doesNotMatch(platformio, /WiFiManager|AsyncWebServer|ESPAsyncWebServer/i,
  'Calibration must not add a library or another web server.');
assert.match(logHeader, /startDbCalibration\(uint32_t nowMs\)/);
assert.match(logHeader, /updateDbCalibration\(const AudioSnapshot &snapshot, uint32_t nowMs\)/);

console.log('dB calibration contract tests passed');
