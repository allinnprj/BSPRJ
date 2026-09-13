const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const samplerHeader = read('include/audio_sampler.h');
const sampler = read('src/audio_sampler.cpp');
const sheetsHeader = read('include/google_sheets_service.h');
const sheets = read('src/google_sheets_service.cpp');
const main = read('src/main.cpp');
const log = read('src/log_service.cpp');
const telegramHeader = read('include/telegram_alert_service.h');
const telegram = read('src/telegram_alert_service.cpp');
const display = read('src/display_view.cpp');
const codeGs = read('google_sheets/Code.gs');

assert.match(samplerHeader, /float currentDbaEstimate = 0\.0f/);
assert.match(samplerHeader, /bool dbaAvailable = false/);
assert.match(sampler, /acousticDbaEstimate\(acousticDbfs\(snapshot\.acoustic\.slowEnergy\)\)/,
  'The live display/status value must use A16 SLOW energy.');
assert.match(sampler, /snapshot\.acoustic\.warm[\s\S]*detectedSignalState != SignalState::Clip/);

assert.match(sheetsHeader, /float dbaLeqEstimate = 0\.0f/);
assert.match(main, /energySum - window\.acousticStart\.energySum/);
assert.match(main, /energyDelta \/ static_cast<double>\(sampleDelta\)/,
  'Window dB must be calculated from mean energy, never by averaging dB values.');
assert.match(main, /acousticDbaEstimate\(acousticDbfs\(meanEnergy\)\)/);
assert.match(main, /acousticStart\.warm[\s\S]*acousticEnd\.warm/);
assert.match(main, /acousticEnd\.faults == window\.acousticStart\.faults/);
assert.match(main, /acousticEnd\.clipped == window\.acousticStart\.clipped/);
assert.match(main, /record\.levelText = noiseLevelText\(record\.averagePeakToPeak\)/,
  'Existing P2P classification remains authoritative.');

assert.match(log, /wifi_dbm,acoustic_rev,dba_leq_est/);
assert.match(log, /record\.dbaAvailable[\s\S]*file\.print\(record\.dbaLeqEstimate, 1\)/);
assert.match(sheets, /dba_leq_est/);
assert.match(sheets, /record\.dbaAvailable[\s\S]*record\.dbaLeqEstimate/);
assert.match(codeGs, /'DBA LEQ EST'/);
assert.match(codeGs, /valueOrBlank\(data\.dba_leq_est\)/);
assert.match(codeGs, /ensureMinColumnCount_\(sheet, HEADERS\.length\)/);

assert.match(telegramHeader, /float currentDbaEstimate/);
assert.match(telegram, /dB\(A\) A16 est/);
assert.match(telegram, /Relative P2P: Now/);
assert.match(display, /"A16 EST  W%u %s"/);
assert.match(display, /"%\.1f dBA"/);
assert.match(display, /"P2P %u"/,
  'The separate P2P debug surface must remain available.');

const energeticLeq = energies => 10 * Math.log10(energies.reduce((a, b) => a + b, 0) / energies.length);
const arithmeticDb = dbValues => dbValues.reduce((a, b) => a + b, 0) / dbValues.length;
const leq = energeticLeq([1, 100]);
assert.ok(Math.abs(leq - 17.0329) < 0.001);
assert.ok(Math.abs(leq - arithmeticDb([0, 20])) > 7,
  'Energetic Leq must differ from an invalid arithmetic dB average.');

console.log('dB publication contracts passed');
