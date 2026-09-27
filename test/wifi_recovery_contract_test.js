const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'wifi_service.cpp'), 'utf8');
const header = fs.readFileSync(path.join(root, 'include', 'wifi_service.h'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src', 'main.cpp'), 'utf8');

function body(signature, nextSignature) {
  const start = source.indexOf(signature);
  assert(start >= 0, 'Missing ' + signature);
  const end = nextSignature ? source.indexOf(nextSignature, start + signature.length) : source.length;
  assert(end >= 0, 'Missing ' + nextSignature);
  return source.slice(start, end);
}

// Execute the actual pure C++ decision expression: its boolean/integer comparisons
// have the same meaning in JS. Elapsed uint32_t ages are computed by the caller.
const decision = body('bool automaticSetupDue(', 'bool probeInternetEndpoint(');
const expression = decision.match(/return\s+([\s\S]*?);/)[1];
function constant(name) {
  const match = source.match(new RegExp(name + ' = (\\d+)(?:UL)?;'));
  assert(match, 'Missing ' + name);
  return Number(match[1]);
}
const due = new Function(
  'setupActive', 'attempted', 'connected', 'wifiOfflineMs', 'failureCount', 'internetOfflineMs',
  'kAutomaticWifiSetupDelayMs', 'kMinimumInternetFailures', 'kAutomaticInternetSetupDelayMs',
  'return ' + expression + ';'
);
function evaluate(active, attempted, connected, wifiAge, failures, internetAge) {
  return due(active, attempted, connected, wifiAge, failures, internetAge,
    constant('kAutomaticWifiSetupDelayMs'), constant('kMinimumInternetFailures'),
    constant('kAutomaticInternetSetupDelayMs'));
}
assert.strictEqual(constant('kAutomaticWifiSetupDelayMs'), 60000);
assert.strictEqual(constant('kAutomaticInternetSetupDelayMs'), 180000);
assert.strictEqual(evaluate(false, false, false, 59999, 0, 0), false);
assert.strictEqual(evaluate(false, false, false, 60000, 0, 0), true);
assert.strictEqual(evaluate(false, false, true, 60000, 0, 600000), false);
assert.strictEqual(evaluate(false, false, true, 0, 1, 600000), false);
assert.strictEqual(evaluate(false, false, true, 0, 2, 600000), false);
assert.strictEqual(evaluate(false, false, true, 0, 3, 179999), false);
assert.strictEqual(evaluate(false, false, true, 0, 3, 180000), true);
assert.strictEqual(evaluate(true, false, false, 600000, 9, 600000), false);
assert.strictEqual(evaluate(false, true, false, 600000, 9, 600000), false);
const wrappedAge = (0x0000ea50 - 0xffffff00) >>> 0;
assert.strictEqual(wrappedAge, 60240);
assert.strictEqual(evaluate(false, false, false, wrappedAge, 0, 0), true);

const worker = body('void WifiService::runInternetProbeTask(', 'void WifiService::updateAutomaticRecovery(');
const recovery = body('void WifiService::updateAutomaticRecovery(', 'void WifiService::rollbackCandidate(');
const update = body('void WifiService::update()', 'bool WifiService::isConnected()');
assert.match(source, /static_assert\(sizeof\(WIFI_SETUP_AP_PASSWORD\) >= 9/);
assert.match(source, /sizeof\(WIFI_SETUP_AP_PASSWORD\) <= 64/);
assert.match(source, /xTaskCreate\(runInternetProbeTask,[\s\S]*4096, this, 1/);
assert.match(worker, /xTaskNotifyWait[\s\S]*portMAX_DELAY/);
assert.match(worker, /gstatic\.com\/generate_204", true\) \|\|/);
assert.match(worker, /msftconnecttest\.com\/connecttest\.txt", false/);
assert.match(worker, /xQueueOverwrite/);
assert.doesNotMatch(update, /probeInternetEndpoint|http\.GET|delay\(/);
assert.doesNotMatch(recovery, /probeInternetEndpoint|http\.GET|delay\(/);
assert.match(source, /setConnectTimeout\(1500\)/);
assert.match(source, /setTimeout\(1500\)/);
assert.match(source, /HTTPC_DISABLE_FOLLOW_REDIRECTS/);
assert.match(source, /response == HTTP_CODE_NO_CONTENT/);
assert.match(source, /response == HTTP_CODE_OK && http\.getSize\(\) == 22/);
assert.match(source, /readBytes\(body, 22\)/);
assert.match(source, /strcmp\(body, "Microsoft Connect Test"\) == 0/);
assert.doesNotMatch(source, /http\.getString|setAuthorization|Authorization:/);
assert.match(recovery, /WifiSetupState::Testing \|\| setupState_ == WifiSetupState::Saved[\s\S]*return;/);
assert.match(recovery, /result\.generation != internetProbeGeneration_[\s\S]*continue;/);
assert.match(recovery, /result\.reachable[\s\S]*internetFailureCount_ = 0[\s\S]*automaticSetupAttempted_ = false/);
assert.match(recovery, /isSetupActive\(\) && setupAutomatic_[\s\S]*stopSetupAccessPoint/);
assert.match(recovery, /internetFailureCount_ == 0[\s\S]*internetFailureSince_ = nowMs/);
assert.match(recovery, /automaticSetupAttempted_ = true;[\s\S]*startSetupAccessPoint/);
assert.match(update, /configured_ && \(!isSetupActive\(\) \|\| setupAutomatic_\)/);
assert.doesNotMatch(update, /!configured_ && !isSetupActive\(\)[\s\S]*return;/);
assert.match(header, /kSetupWindowMs = 600000UL/);
assert.match(main, /!wifiSetupActiveBeforeUpdate && wifiSetupActive &&[\s\S]*wifiSetupPreviousDisplayEnabled = displayView\.isEnabled\(\)/);
assert.match(main, /buttonEvent != ButtonEvent::WifiSetupRequested\) \{[\s\S]*if \(!wifiSetupCountdownVisible\)/,
  'Automatic recovery must preserve the pre-countdown OLED state if a hold is in progress.');
assert.doesNotMatch(source, /preferences_\.(?:clear|remove)|LittleFS|controllerLinkService/);
console.log('wifi recovery timing and safety contract tests passed');
