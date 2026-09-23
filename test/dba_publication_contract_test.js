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
const mqttHeader = read('include/mqtt_service.h');
const mqtt = read('src/mqtt_service.cpp');
const appsheet = read('APPSHEET_SETUP.md');

assert.match(samplerHeader, /float currentDbaEstimate = 0\.0f/);
assert.match(samplerHeader, /bool dbaAvailable = false/);
assert.match(sampler, /acousticDbaEstimate\(acousticDbfs\(snapshot\.acoustic\.slowEnergy\)\)/,
  'The live display/status value must use A16 SLOW energy.');
assert.match(sampler, /snapshot\.acoustic\.warm[\s\S]*detectedSignalState != SignalState::Clip/);

assert.match(sheetsHeader, /float dbaLeqEstimate = 0\.0f/);
assert.match(sheetsHeader, /uint8_t dbaValidPercent = 0/);
assert.match(sheetsHeader, /uint32_t dbaFaultCount = 0/);
assert.match(sheetsHeader, /uint32_t dbaClippedSamples = 0/);
assert.match(sampler, /!fault && filterWasWarm && !blockClipped/,
  'Only warmed, fault-free, non-clipped blocks may enter window dB energy.');
assert.match(sampler, /reading\.validEnergySum \+= blockEnergy/);
assert.match(sampler, /reading\.validSamples \+= count/);
assert.match(main, /validEnergySum - window\.acousticStart\.validEnergySum/);
assert.match(main, /validEnergyDelta \/ static_cast<double>\(validSampleDelta\)/,
  'Window dB must be calculated from mean energy, never by averaging dB values.');
assert.match(main, /acousticDbaEstimate\(acousticDbfs\(meanEnergy\)\)/);
assert.match(main, /DBA_MIN_VALID_COVERAGE_PERCENT = 95/);
assert.match(main, /record\.dbaValidPercent >= DBA_MIN_VALID_COVERAGE_PERCENT/);
assert.doesNotMatch(main, /acousticEnd\.faults == window\.acousticStart\.faults/);
assert.doesNotMatch(main, /acousticEnd\.clipped == window\.acousticStart\.clipped/);
assert.match(main, /record\.levelText = dbaLevelText\(record\.dbaLeqEstimate, record\.dbaAvailable\)/,
  'The ten-minute level must follow valid dB(A), not P2P.');
assert.match(main, /sampleDelta\) \/ \(AcousticEnergy::kSampleRate \* 60\.0f\)/,
  'Measured window duration must follow raw I2S samples, not the main-loop snapshot count.');
assert.match(main, /dbaLevelText\(latestSnapshot\.currentDbaEstimate, latestSnapshot\.dbaAvailable\)/);
assert.match(mqttHeader, /const char \*soundLevelText = "NO DATA"/);
assert.match(mqttHeader, /const char \*micSignalText = "LOW"/);
assert.match(main, /state\.soundLevelText = dbaLevelText\(snapshot\.currentDbaEstimate, snapshot\.dbaAvailable\)/);
assert.match(main, /state\.micSignalText = signalStateText\(snapshot\.signalState\)/);
assert.match(mqtt, /"sound\/dba_est"[\s\S]*state\.snapshot\.currentDbaEstimate/);
assert.match(mqtt, /"sound\/level", state\.soundLevelText/);
assert.match(mqtt, /"sound\/mic_signal", state\.micSignalText/);
assert.match(mqtt, /kFieldSoundDbaEstimate\[\] = "SOUND_DBA_EST"/);
assert.match(mqtt, /kFieldSoundLevel\[\] = "SOUND_LEVEL"/);
assert.match(mqtt, /kFieldMicSignal\[\] = "MIC_SIGNAL"/);
assert.match(mqtt, /kFieldSignalState,[\s\S]*state\.soundLevelText/,
  'The legacy Datacake level alias must remain compatible during migration.');
assert.match(mqtt, /kFieldMicSignal,[\s\S]*state\.micSignalText/,
  'Microphone health must not be populated from the dB(A) level.');
for (const legacyField of ['sound/now_pct', 'sound/hour_pct', 'sound/mean_pct']) {
  assert.ok(mqtt.includes(legacyField), `Missing legacy MQTT compatibility field ${legacyField}`);
}
assert.match(appsheet, /`DBA LEQ EST`/);
assert.match(appsheet, /Regenerate structure/);

assert.match(log, /dba_leq_est,dba_valid_pct,dba_faults,dba_clips/);
assert.match(log, /record\.dbaAvailable[\s\S]*file\.print\(record\.dbaLeqEstimate, 1\)/);
assert.match(sheets, /dba_leq_est/);
assert.match(sheets, /record\.dbaAvailable[\s\S]*record\.dbaLeqEstimate/);
assert.match(sheets, /dba_valid_pct/);
assert.match(sheets, /dba_faults/);
assert.match(sheets, /dba_clips/);
assert.match(codeGs, /'DBA LEQ EST'/);
assert.match(codeGs, /'DBA VALID %'/);
assert.match(codeGs, /'DBA FAULTS'/);
assert.match(codeGs, /'DBA CLIPS'/);
assert.match(codeGs, /valueOrBlank\(data\.dba_leq_est\)/);
assert.match(codeGs, /valueOrBlank\(data\.dba_valid_pct\)/);
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

const acceptedCoverage = (validSamples, totalSamples) =>
  Math.floor(validSamples * 100 / totalSamples) >= 95;
assert.strictEqual(acceptedCoverage(595, 600), true,
  'A short recovered fault must not discard an otherwise useful ten-minute window.');
assert.strictEqual(acceptedCoverage(560, 600), false,
  'A window with more than five percent invalid audio must remain blank.');

console.log('dB publication contracts passed');
