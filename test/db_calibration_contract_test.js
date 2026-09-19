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

assert.match(version, /#define PROJECT_VERSION "0\.1\.103-EXP"/);
assert.match(version, /#define PROJECT_BUILD 157\b/);
assert.match(logSource, /kDbCalibrationDurationMs = 20UL \* 60UL \* 1000UL/);
assert.match(logSource, /kDbCalibrationBucketMs = 1000UL/);
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
assert.doesNotMatch(display, /dB CAL REC|TIME LEFT/);
assert.match(display, /"TL %02lu:%02lu"/);
assert.match(display, /drawCenteredText\(String\(remainingText\), 7, 2\)/);
assert.match(display, /POINT %u/);
assert.match(display, /drawCenteredText\(String\(pointText\), 39, 2\)/);
assert.match(main, /latestSnapshot = audioSampler\.sample\(\);[\s\S]*logService\.updateDbCalibration\(latestSnapshot, millis\(\)\);/);
assert.match(main, /updateGoogleSheetsWindow\(latestSnapshot, timeService\)/,
  'Normal Google Sheets aggregation must remain active.');
assert.match(main, /logService\.dbCalibrationActive\(\)[\s\S]*showDbCalibration/);
assert.doesNotMatch(platformio, /WiFiManager|AsyncWebServer|ESPAsyncWebServer/i,
  'Calibration must not add a library or another web server.');
assert.match(logHeader, /startDbCalibration\(uint32_t nowMs\)/);
assert.match(logHeader, /updateDbCalibration\(const AudioSnapshot &snapshot, uint32_t nowMs\)/);

const dsp = fs.readFileSync(path.join(root, 'include/acoustic_energy.h'), 'utf8');
const sampler = fs.readFileSync(path.join(root, 'src/audio_sampler.cpp'), 'utf8');
assert.equal((sampler.match(/i2s_read\(/g) || []).length, 1, 'Single I2S owner');
assert.match(sampler, /xTaskCreatePinnedToCore\(captureAudio, "bs_audio", 4096/);
assert.match(sampler, /I2S_EVENT_RX_Q_OVF/);
assert.match(sampler, /I2S_EVENT_DMA_ERROR/);
assert.match(sampler, /filter\.reset\(\)/);
assert.match(sampler, /portENTER_CRITICAL[\s\S]*snapshot\.acoustic = latestAcoustic/);
assert.match(logSource, /dbAcousticEnd\.faults == dbAcousticPrevious\.faults/);
assert.match(logSource, /dbAcousticEnd\.clipped == dbAcousticPrevious\.clipped/);
assert.match(logSource, /file\.write\([\s\S]*== static_cast<size_t>\(length\)/);
assert.match(logSource, /if \(!headerOk\) return DbCalibrationStartResult::StorageError/);
assert.match(logSource, /point,capture_elapsed_ms,a_rms_dbfs,a_slow_dbfs,a_slow_dba_est/);
assert.match(logSource, /audio_unavailable/);
assert.match(dsp, /raw >> 8/);
assert.match(dsp, /kAcousticDbaOffset = 114\.2f/);
assert.match(dsp, /return dbfs \+ kAcousticDbaOffset/);
assert.match(logSource, /acousticDbaEstimate\(aSlowDbfs\)/);
assert.match(logSource, /A16_SLOW_CAL_114\.2/);

// Float32 numerical simulation of the coefficients actually shipped in the header.
// Firmware compilation separately checks the C++ implementation.
const coefficientText = dsp.split('coefficients_[3][5] = {')[1].split('};')[0];
const sos = [...coefficientText.matchAll(/\{([^{}]+)\}/g)].map(m =>
  m[1].split(',').map(v => Math.fround(parseFloat(v))));
assert.equal(sos.length, 3);
const fsHz = Number(dsp.match(/kSampleRate = (\d+)/)[1]);
const alpha = Math.fround(Number(dsp.match(/slow_ \+= ([\d.]+)f/)[1]));
assert.ok(Math.abs((1 - (1 - alpha) ** fsHz) - (1 - Math.exp(-1))) < 1e-6);
function measure(hz, amplitude, seconds = 8) {
  const state = sos.map(() => [0, 0]);
  const f = Math.fround;
  let slow = 0, sum = 0, count = 0;
  for (let n = 0; n < fsHz * seconds; n++) {
    let v = f(hz === 0 ? amplitude : amplitude * Math.sin(2 * Math.PI * hz * n / fsHz));
    for (let i = 0; i < sos.length; i++) {
      const c = sos[i], s = state[i];
      const out = f(f(c[0] * v) + s[0]);
      s[0] = f(f(f(c[1] * v) - f(c[3] * out)) + s[1]);
      s[1] = f(f(c[2] * v) - f(c[4] * out));
      v = out;
    }
    const e = f(v * v);
    slow = f(slow + f(alpha * f(e - slow)));
    if (n >= fsHz * (seconds - 1)) { sum += e; count++; }
  }
  return {energy: sum / count, slow};
}
const one = measure(1000, 0.1), two = measure(1000, 0.2);
const db = e => 10 * Math.log10(e);
assert.ok(Math.abs(db(one.energy / (0.1 ** 2 / 2))) < 0.03, '1 kHz unity gain');
assert.ok(Math.abs(db(two.energy / one.energy) - 6.0206) < 0.01, 'Amplitude doubling');
assert.ok(Math.abs(db(one.slow / one.energy)) < 0.04, 'SLOW converges to energy');
assert.ok(db(measure(100, 0.1).energy / one.energy) < -18, 'A low-frequency attenuation');
assert.ok(measure(0, 0.1).energy < 1e-10, 'DC rejected');
assert.equal(measure(1000, 0).energy, 0, 'Silence finite and zero');
console.log('dB calibration contracts and float32 DSP checks passed');
