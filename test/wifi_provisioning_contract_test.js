const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const wifiHeader = fs.readFileSync(path.join(root, 'include', 'wifi_service.h'), 'utf8');
const wifiSource = fs.readFileSync(path.join(root, 'src', 'wifi_service.cpp'), 'utf8');
const buttonHeader = fs.readFileSync(path.join(root, 'include', 'button_service.h'), 'utf8');
const buttonSource = fs.readFileSync(path.join(root, 'src', 'button_service.cpp'), 'utf8');
const displaySource = fs.readFileSync(path.join(root, 'src', 'display_view.cpp'), 'utf8');
const logSource = fs.readFileSync(path.join(root, 'src', 'log_service.cpp'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src', 'main.cpp'), 'utf8');
const version = fs.readFileSync(path.join(root, 'include', 'project_version.h'), 'utf8');
const platformio = fs.readFileSync(path.join(root, 'platformio.ini'), 'utf8');
const allSources = fs.readdirSync(path.join(root, 'src'))
  .filter((name) => name.endsWith('.cpp'))
  .map((name) => fs.readFileSync(path.join(root, 'src', name), 'utf8'))
  .join('\n');

function functionBody(text, signature, nextSignature) {
  const start = text.indexOf(signature);
  assert.notStrictEqual(start, -1, `Missing function ${signature}`);
  const end = nextSignature ? text.indexOf(nextSignature, start + signature.length) : text.length;
  assert.notStrictEqual(end, -1, `Missing boundary ${nextSignature}`);
  return text.slice(start, end);
}

assert.match(version, /#define PROJECT_VERSION "0\.1\.98-EXP"/);
assert.match(version, /#define PROJECT_BUILD 152\b/);
assert.match(buttonHeader, /kWifiSetupCountdownStartMs = 2000UL/);
assert.match(buttonHeader, /kWifiSetupHoldMs = 5000UL/);
assert.match(wifiHeader, /kSetupWindowMs = 600000UL/);
assert.match(wifiHeader, /kSetupConnectionTimeoutMs = 30000UL/);
assert.match(wifiHeader, /Preferences preferences_/);
assert.match(wifiSource, /preferences_\.begin\(kWifiPreferencesNamespace, false\)/);
assert.match(wifiSource, /getBytes\(kWifiProfileKey/);
assert.match(wifiSource, /putBytes\(kWifiProfileKey/);
assert.match(wifiSource, /WiFi\.mode\(WIFI_AP_STA\)/);
assert.match(wifiSource, /#error "Define WIFI_SETUP_AP_PASSWORD in include\/secrets\.h"/);
assert.match(wifiSource, /WiFi\.softAP\(setupApSsid_\.c_str\(\), WIFI_SETUP_AP_PASSWORD\)/);
assert.doesNotMatch(wifiSource, /setupRequestedAtBoot|setupButtonPin/);
assert.match(main, /wifiService\.begin\(\)/);
assert.match(main, /wifiService\.startSetup\(\)/);
assert.match(main, /logService\.begin\(wifiService\)/);
assert.match(buttonSource, /heldMs >= kWifiSetupHoldMs[\s\S]*ButtonEvent::WifiSetupRequested/);
assert.match(buttonSource, /lastWifiSetupCountdown_ != 0[\s\S]*ButtonEvent::WifiSetupCancelled/);
assert.match(buttonSource, /heldMs >= kLongPressMs \? ButtonEvent::LongPress[\s\S]*ButtonEvent::ShortPress/);
assert.match(main, /WifiSetupCountdown3[\s\S]*showWifiSetupCountdown/);
assert.match(main, /WifiSetupCancelled[\s\S]*Wi-Fi setup cancelled/);
assert.match(main, /WifiSetupRequested[\s\S]*wifiService\.startSetup\(\)/);
assert.match(displaySource, /WI-FI SETUP[\s\S]*Release: cancel/);
assert.match(displaySource, /WI-FI SETUP[\s\S]*192\.168\.4\.1/);

const updateBody = functionBody(
  wifiSource,
  'void WifiService::update()',
  'bool WifiService::isConnected() const'
);
assert.match(
  updateBody,
  /status == WL_CONNECTED && WiFi\.SSID\(\) == candidateSsid_[\s\S]*saveCandidateProfile\(\)/,
  'A candidate profile must be saved only after the requested network connects.'
);
assert.match(updateBody, /kSetupConnectionTimeoutMs[\s\S]*rollbackCandidate\(\)/);
assert.match(updateBody, /setupState_ != WifiSetupState::Saved[\s\S]*kSetupWindowMs[\s\S]*stopSetupAccessPoint\(\)/,
  'The physical setup AP must remain bounded even when a connection test starts late.');
assert.match(updateBody, /kSavedProfileFallbackMs[\s\S]*WIFI_SSID/);

const submitBody = functionBody(
  wifiSource,
  'bool WifiService::submitSetupCredentials(',
  'bool WifiService::loadSavedProfile('
);
assert.doesNotMatch(submitBody, /putBytes|putString|preferences_\./,
  'Submitting credentials must not persist them before validation.');
assert.match(submitBody, /password\.length\(\) > 63/);
assert.match(submitBody, /WiFi\.disconnect\(false, false\)/);

assert.strictEqual((allSources.match(/WebServer\s+\w+\s*\(80\)/g) || []).length, 1,
  'The firmware must keep one shared port-80 WebServer.');
assert.match(logSource, /logServer\.on\("\/wifi-setup", HTTP_POST, handleWifiSetupPost\)/);
assert.doesNotMatch(logSource, /logServer\.on\("\/wifi-setup", HTTP_GET/);
assert.match(logSource, /type=\\\"password\\\"/);
assert.match(logSource, /!wifiSetupService->isSetupActive\(\)[\s\S]*send\(404/);
assert.doesNotMatch(logSource, /Serial\.(?:print|println)\s*\(\s*(?:password|candidatePassword_|activePassword_)/i);
assert.doesNotMatch(wifiSource, /Serial\.(?:print|println)\s*\(\s*(?:password|candidatePassword_|activePassword_)/i);
assert.doesNotMatch(platformio, /WiFiManager|AsyncWebServer|ESPAsyncWebServer/i,
  'Provisioning must not add a new web or captive-portal dependency.');

console.log('wifi provisioning contract tests passed');
