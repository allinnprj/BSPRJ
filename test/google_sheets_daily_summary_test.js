const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const codePath = path.join(__dirname, '..', 'google_sheets', 'Code.gs');
const source = fs.readFileSync(codePath, 'utf8');

function runDailyScenario(options = {}) {
  const state = {
    lockWaitMs: null,
    lockReleased: false,
    rebuildCount: 0,
    sentTexts: [],
    propertyWrites: [],
    warnings: []
  };
  const targets = (options.targets || ['2026-08-08']).slice();
  const sandbox = {
    console: {
      warn(message) {
        state.warnings.push(String(message));
      }
    },
    LockService: {
      getScriptLock() {
        return {
          tryLock(waitMs) {
            state.lockWaitMs = waitMs;
            return options.lockAcquired !== false;
          },
          releaseLock() {
            state.lockReleased = true;
          }
        };
      }
    },
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty() {
            return options.lastSentDate || '2026-08-07';
          },
          setProperty(key, value) {
            state.propertyWrites.push([key, value]);
          }
        };
      }
    }
  };

  const hooks = `
    getTelegramConfig_ = () => ({ enabled: true, autoDailyEnabled: true });
    findLatestAvailableSummaryDateForAutoDaily_ = () => targets.shift() || '';
    getLatestArchivedDateText_ = () => '08-08-2026';
    rebuildAnalyticsCore_ = () => { state.rebuildCount += 1; };
    buildDailyTelegramSummary_ = (dateText) => 'summary:' + dateText;
    sendTelegramMessage_ = (text) => { state.sentTexts.push(text); };
    this.__runAutomaticDailyTelegramSummary = runAutomaticDailyTelegramSummary_;
  `;
  sandbox.targets = targets;
  sandbox.state = state;
  vm.runInNewContext(`${source}\n${hooks}`, sandbox, { filename: codePath });
  sandbox.__runAutomaticDailyTelegramSummary();
  return state;
}

function runTelegramResponseScenario(responseCode, responseText) {
  const sandbox = {
    UrlFetchApp: {
      fetch() {
        return {
          getResponseCode() {
            return responseCode;
          },
          getContentText() {
            return responseText;
          }
        };
      }
    }
  };
  const hooks = `
    ensureTelegramConfigured_ = () => ({ botToken: 'token', chatId: 'chat' });
    this.__sendTelegramMessage = sendTelegramMessage_;
  `;
  vm.runInNewContext(`${source}\n${hooks}`, sandbox, { filename: codePath });
  return () => sandbox.__sendTelegramMessage('test');
}

const readySummary = runDailyScenario();
assert.strictEqual(readySummary.lockWaitMs, 300000);
assert.strictEqual(readySummary.rebuildCount, 0);
assert.deepStrictEqual(readySummary.sentTexts, ['summary:2026-08-08']);
assert.strictEqual(readySummary.propertyWrites.length, 1);
assert.strictEqual(readySummary.propertyWrites[0][1], '2026-08-08');
assert.strictEqual(readySummary.lockReleased, true);

const missingSummary = runDailyScenario({ targets: ['', '2026-08-08'] });
assert.strictEqual(missingSummary.rebuildCount, 1);
assert.deepStrictEqual(missingSummary.sentTexts, ['summary:2026-08-08']);

const busyLock = runDailyScenario({ lockAcquired: false });
assert.strictEqual(busyLock.sentTexts.length, 0);
assert.strictEqual(busyLock.propertyWrites.length, 0);
assert.strictEqual(busyLock.lockReleased, false);
assert.strictEqual(busyLock.warnings.length, 1);

assert.doesNotThrow(runTelegramResponseScenario(200, '{"ok":true,"result":{}}'));
assert.throws(
  runTelegramResponseScenario(200, '{"ok":false,"description":"not delivered"}'),
  /API did not confirm delivery/
);

console.log('Google Sheets automatic daily-summary regression: PASS');
