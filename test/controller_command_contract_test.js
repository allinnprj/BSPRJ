const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const header = fs.readFileSync(path.join(root, 'include', 'controller_link_service.h'), 'utf8');
const source = fs.readFileSync(path.join(root, 'src', 'controller_link_service.cpp'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src', 'main.cpp'), 'utf8');
const telegram = fs.readFileSync(path.join(root, 'src', 'telegram_alert_service.cpp'), 'utf8');
const telegramHeader = fs.readFileSync(path.join(root, 'include', 'telegram_alert_service.h'), 'utf8');
const mqtt = fs.readFileSync(path.join(root, 'src', 'mqtt_service.cpp'), 'utf8');
const protocol = fs.readFileSync(path.join(root, 'CONTROLLER_UART_PROTOCOL.md'), 'utf8');
const version = fs.readFileSync(path.join(root, 'include', 'project_version.h'), 'utf8');
const cleanupSurface = [
  fs.readFileSync(path.join(root, 'include', 'audio_sampler.h'), 'utf8'),
  fs.readFileSync(path.join(root, 'include', 'button_service.h'), 'utf8'),
  fs.readFileSync(path.join(root, 'include', 'display_view.h'), 'utf8'),
  fs.readFileSync(path.join(root, 'include', 'log_service.h'), 'utf8'),
  fs.readFileSync(path.join(root, 'include', 'mqtt_service.h'), 'utf8'),
  fs.readFileSync(path.join(root, 'include', 'telegram_alert_service.h'), 'utf8'),
  fs.readFileSync(path.join(root, 'include', 'time_service.h'), 'utf8'),
  fs.readFileSync(path.join(root, 'include', 'wifi_service.h'), 'utf8'),
  fs.readFileSync(path.join(root, 'src', 'audio_sampler.cpp'), 'utf8'),
  fs.readFileSync(path.join(root, 'src', 'button_service.cpp'), 'utf8'),
  fs.readFileSync(path.join(root, 'src', 'display_view.cpp'), 'utf8'),
  fs.readFileSync(path.join(root, 'src', 'log_service.cpp'), 'utf8'),
  fs.readFileSync(path.join(root, 'src', 'mqtt_service.cpp'), 'utf8'),
  fs.readFileSync(path.join(root, 'src', 'telegram_alert_service.cpp'), 'utf8'),
  fs.readFileSync(path.join(root, 'src', 'time_service.cpp'), 'utf8'),
  fs.readFileSync(path.join(root, 'src', 'wifi_service.cpp'), 'utf8'),
  fs.readFileSync(path.join(root, 'google_sheets', 'Code.gs'), 'utf8'),
].join('\n');

function functionBody(text, signature, nextSignature) {
  const start = text.indexOf(signature);
  assert.notStrictEqual(start, -1, `Missing function ${signature}`);
  const end = nextSignature ? text.indexOf(nextSignature, start + signature.length) : text.length;
  assert.notStrictEqual(end, -1, `Missing boundary ${nextSignature}`);
  return text.slice(start, end);
}

assert.match(header, /#include <Preferences\.h>/);
assert.match(header, /bool queueStatusCommand\(uint32_t ttlSeconds = 120\)/);
assert.doesNotMatch(header, /queueOtaOnCommand|queueWifiOffCommand|CommandKind::OtaOn|CommandKind::WifiOff/);
assert.match(header, /static constexpr size_t COMMAND_FRAME_CAPACITY = 48/);
assert.match(header, /static constexpr size_t SLEEP_ACK_FRAME_CAPACITY = 40/);
assert.match(header, /static constexpr uint32_t COMMAND_MAX_TTL_SECONDS = 7200/);
assert.match(header, /static constexpr uint32_t STATUS_MAX_TTL_SECONDS = 120/);
assert.match(header, /static constexpr uint8_t RETIRED_OTA_ON_COMMAND_CODE = 2/);
assert.match(header, /static constexpr uint8_t RETIRED_WIFI_OFF_COMMAND_CODE = 3/);
assert.match(header, /static constexpr uint8_t COMMAND_MAX_SEND_ATTEMPTS = 4/);
assert.match(header, /static constexpr uint32_t COMMAND_LATE_RESPONSE_WAIT_MS = 40000/);
assert.match(header, /static constexpr uint32_t COMMAND_RESULT_TIMEOUT_MS = 40000/);
assert.match(header, /static constexpr uint8_t COMMAND_MAX_RESULT_RECOVERY_RETRIES = 2/);
assert.match(header, /PersistedCommandRecord commandRecord_/);
assert.match(header, /bool gpsFixed = false/);
assert.match(header, /int32_t gpsLatitudeMicrodegrees = 0/);
assert.match(header, /uint32_t gpsFixEpoch = 0/);
assert.match(header, /ControllerWakeRequestResult requestWakePulse\(uint32_t nowMs\)/);
assert.match(header, /static constexpr uint32_t WAKE_PULSE_MS = 15/);
assert.match(header, /static constexpr uint32_t WAKE_COOLDOWN_MS = 10000/);

assert.match(main, /CONTROLLER_WAKE_PIN = 23/);
assert.match(
  main,
  /controllerLinkService\.begin\(Serial2,[\s\S]*CONTROLLER_UART_RX_PIN,[\s\S]*CONTROLLER_UART_TX_PIN, CONTROLLER_WAKE_PIN\)/
);

const beginBody = functionBody(
  source,
  'void ControllerLinkService::begin(',
  'void ControllerLinkService::setCommandEventHandler('
);
assert.match(beginBody, /commandPreferences_\.begin\("c3_command", false\)/);
assert.match(beginBody, /loadCommandRecord\(\)/);
assert.match(
  beginBody,
  /digitalWrite\(wakePin_, HIGH\)[\s\S]*pinMode\(wakePin_, OUTPUT_OPEN_DRAIN\)[\s\S]*digitalWrite\(wakePin_, HIGH\)/,
  'The active-LOW wake output must be released before and after open-drain setup.'
);

const linkUpdateBody = functionBody(
  source,
  'void ControllerLinkService::update(',
  'ControllerWakeRequestResult ControllerLinkService::requestWakePulse('
);
assert.match(
  linkUpdateBody,
  /wakePulseActive_[\s\S]*WAKE_PULSE_MS[\s\S]*digitalWrite\(wakePin_, HIGH\)[\s\S]*wakePulseActive_ = false/,
  'The millis-based service loop must release the wake line after the bounded pulse.'
);
assert.doesNotMatch(linkUpdateBody, /delay\s*\(/);

const wakePulseBody = functionBody(
  source,
  'ControllerWakeRequestResult ControllerLinkService::requestWakePulse(',
  'const char* ControllerLinkService::stateText('
);
assert.match(wakePulseBody, /state_ == State::Online[\s\S]*AlreadyAwake/);
assert.match(wakePulseBody, /wakePin_ == UINT8_MAX[\s\S]*Unavailable/);
assert.doesNotMatch(wakePulseBody, /state_ != State::Sleeping/);
assert.match(wakePulseBody, /WAKE_COOLDOWN_MS[\s\S]*Cooldown/);
assert.match(wakePulseBody, /digitalWrite\(wakePin_, LOW\)/);
assert.match(wakePulseBody, /state_ = State::Waiting/);
assert.match(wakePulseBody, /emitCommandEvent\("C3_WAKE_CMD"/);
assert.doesNotMatch(wakePulseBody, /delay\s*\(/);

const queueBody = functionBody(
  source,
  'bool ControllerLinkService::queueStatusCommand(',
  'bool ControllerLinkService::clearTerminalCommand('
);
assert.match(queueBody, /time\(nullptr\)/);
assert.match(queueBody, /ControllerCommandState::Queued/);
assert.match(queueBody, /CommandKind::Status/);
assert.match(queueBody, /saveCommandRecord\(\)/);
assert.match(queueBody, /CMD_QUEUE/);
assert.doesNotMatch(queueBody, /OtaOn|OTA_ON|WifiOff|WIFI_OFF|sourceUpdateId/);

const loadCommandBody = functionBody(
  source,
  'bool ControllerLinkService::loadCommandRecord(',
  'bool ControllerLinkService::saveCommandRecord('
);
assert.match(
  loadCommandBody,
  /retiredControlCommand[\s\S]*RETIRED_OTA_ON_COMMAND_CODE[\s\S]*RETIRED_WIFI_OFF_COMMAND_CODE[\s\S]*retiredControlCommand[\s\S]*initializeCommandRecord\(\)[\s\S]*saveCommandRecord\(\)/,
  'Persisted OTA_ON and WIFI_OFF records must be reset and saved as Idle on build 139.'
);
assert.match(loadCommandBody, /CommandKind::Status[\s\S]*commandRecord_\.argument == 0/);
assert.doesNotMatch(loadCommandBody, /CommandKind::OtaOn|CommandKind::WifiOff/);

const updateBody = functionBody(
  source,
  'void ControllerLinkService::updateCommand(',
  'void ControllerLinkService::sendCommandFrame('
);
assert.match(updateBody, /state_ == State::Online/);
assert.match(updateBody, /ControllerCommandState::Expired/);
assert.match(updateBody, /COMMAND_ACK_TIMEOUT_MS/);
assert.match(
  updateBody,
  /commandSendAttempts_ < COMMAND_MAX_SEND_ATTEMPTS[\s\S]*sendCommandFrame\(nowMs, false\)[\s\S]*COMMAND_LATE_RESPONSE_WAIT_MS[\s\S]*ACK_TIMEOUT/,
  'After the fourth identical CMD transmission, BS must wait passively for a late matching CACK/CRES before ACK_TIMEOUT.'
);
assert.match(updateBody, /COMMAND_RESULT_TIMEOUT_MS/);
assert.match(
  updateBody,
  /commandResultRecoveryRetries_ < COMMAND_MAX_RESULT_RECOVERY_RETRIES &&[\s\S]*commandSendAttempts_ < COMMAND_MAX_SEND_ATTEMPTS/,
  'CRES recovery must never increase total CMD transmissions beyond four.'
);

const sendBody = functionBody(
  source,
  'void ControllerLinkService::sendCommandFrame(',
  'bool ControllerLinkService::processCommandAck('
);
const persistenceIndex = sendBody.indexOf('saveCommandRecord()');
const transmitIndex = sendBody.indexOf('serial_->println(frame)');
assert.ok(persistenceIndex >= 0 && transmitIndex > persistenceIndex,
  'Pending frame state must be persisted before UART transmission.');
assert.match(sendBody, /"CMD %lu %lu %lu %lu %s %lu"/);
assert.match(sendBody, /commandName\(\)/);
assert.match(sendBody, /written.*>= sizeof\(frame\)/s);

assert.match(source, /strncmp\(cursor, "CACK ", 5\)/);
assert.match(source, /strncmp\(cursor, "CRES ", 5\)/);
assert.match(source, /CACK.*processCommandAck/s);
assert.match(source, /CRES.*processCommandResult/s);
assert.match(source, /strcmp\(ackKind, "NEW"\)/);
assert.match(source, /strcmp\(ackKind, "DUP"\)/);
assert.match(source, /isAllowedCommandResult/);
const commandResultBody = functionBody(
  source,
  'bool ControllerLinkService::processCommandResult(',
  'void ControllerLinkService::setCommandTerminal('
);
assert.match(
  commandResultBody,
  /hasCommand\(\)[\s\S]*session != commandRecord_\.session[\s\S]*sequence != commandRecord_\.sequence/
);
assert.doesNotMatch(
  commandResultBody,
  /ControllerCommandState::Accepted/,
  'A matching CRES must remain sufficient even when the separate CACK was lost.'
);
assert.match(
  commandResultBody,
  /strcmp\(result, "OK"\) == 0[\s\S]*ControllerCommandState::Executed/,
  'A late matching CRES OK must terminate as EXECUTED during the passive response window.'
);
assert.match(source, /putBytes\("record"/);
assert.match(source, /getBytes\("record"/);
assert.match(source, /if \(\*cursor != '\\0'\)/);
assert.match(source, /"SACK %lu C3 %lu\\n"/);
assert.match(source, /sendSleepAck\(sleepSeconds, build\)/);
assert.match(source, /ControllerLinkService::sendSleepAck[\s\S]*serial_->write\([\s\S]*serial_->flush\(\)/);
assert.doesNotMatch(source, /processTimeRequest|sendTimeResponse|TREQ |TIME 1/);
assert.match(source, /parseNextUnsigned\(cursor, gpsFixed\)/);
assert.match(source, /gpsLatitudeMicrodegrees < -90000000/);
assert.match(source, /gpsLongitudeMicrodegrees > 180000000/);

assert.match(main, /setCommandEventHandler\(recordControllerCommandEvent\)/);
assert.match(main, /appendControllerDiagnosticRecord\(F\("C3_GPS"\)/);
assert.doesNotMatch(main, /queueStatusCommand\s*\(/,
  'STATUS must only be triggered by the authorized Telegram command path.');
assert.match(telegram, /isC3StatusCommand\(command\)/);
assert.match(telegram, /isC3WakeCommand\(command\)/);
assert.match(telegram, /isBsStatusCommand\(command\)/);
assert.match(telegram, /isHelpCommand\(command\)/);
assert.match(telegram, /controllerLink\.isOnline\(\)/);
assert.match(telegram, /controllerLink\.queueStatusCommand\(\)/);
assert.doesNotMatch(telegram, /c3ota|C3Ota|queueOtaOnCommand|OTA_ON/);
assert.match(telegram, /c3RefreshCommandPending_/);
assert.match(telegram, /controllerLink\.commandTerminal\(\)/);
assert.match(telegram, /c3TelemetryReceivedAtRequestMs_/);
assert.match(telegram, /freshTelemetryReceived/);
assert.match(telegram, /"CACHED"/);
assert.match(telegram, /Data: <b>Fresh<\/b>/);
assert.match(telegram, /command coalesced -> \/c3sts x/);
assert.match(telegram, /command coalesced -> \/c3wkp x/);
assert.match(telegram, /command coalesced -> \/bssts x/);
assert.match(telegram, /command coalesced -> \/help x/);
assert.match(telegram, /controllerLink\.requestWakePulse\(millis\(\)\)/);
assert.doesNotMatch(telegramHeader, /kC3WakeResponseTimeoutMs/);
assert.match(telegram, /Wake pulse sent/);
assert.match(telegram, /C3 already awake/);
assert.doesNotMatch(telegram, /C3 no response|c3WakeReplyState_/);
assert.match(telegram, /BS Controller/);
assert.match(telegram, /BS \+ C3 · Помощь \/ Help/);
assert.match(telegram, /Link \/ Data/);
assert.match(telegram, /Cached — последние сохранённые данные/);
assert.match(telegram, /BS bot · для участников \/ for group members/);
assert.match(telegram, /C3 bot · только админ \/ admin only/);
for (const command of ['/status', '/power', '/slpon', '/slpoff', '/chrgon', '/chrgoff', '/sa']) {
  assert.match(telegram, new RegExp(`<code>\\${command}<\\/code>`),
    `Unified /help must explain the C3 command ${command}.`);
}
assert.match(telegram, /The C3 bot accepts C3 commands from its admin only/);
assert.doesNotMatch(telegram, /\/help_bs|\/help_c3|\/help_link/,
  'All end-user guidance must remain inside one /help command.');
assert.doesNotMatch(telegram, new RegExp(['c3', 'svc'].join('')),
  'The user-facing OTA flow must have one command name only.');
assert.match(telegram, /controllerLink\.remoteBuild\(\)/,
  'C3 build detection must remain available to status output.');
assert.doesNotMatch(telegram + telegramHeader,
  /C3 Update|sendControllerBuildChanged_|buildControllerBuildChangedMessage_|observedControllerBuild_/,
  'BS must not duplicate the C3 bot online/build notification.');
assert.match(telegram, /Google Maps/);
assert.match(telegram, /gpsFixAgeText\(telemetry\.gpsFixEpoch\)/);
assert.match(mqtt, /telemetry\.gpsFixed/);
assert.match(mqtt, /telemetry\.gpsLatitudeMicrodegrees/);
assert.doesNotMatch(source, /queueWifiOffCommand|CommandKind::WifiOff|"WIFI_OFF"/);
assert.doesNotMatch(source, /CommandKind::Restart/,
  'RESTART remains outside this implementation stage.');
assert.doesNotMatch(source, /queueOtaOnCommand|CommandKind::OtaOn|OTA_ON=/);
assert.strictEqual((source.match(/OTA_ON/g) || []).length, 1,
  'OTA_ON may remain only as the retired-code migration reference.');
assert.match(version, /#define PROJECT_VERSION "0\.1\.90-EXP"/);
assert.match(version, /#define PROJECT_BUILD 144\b/);
assert.doesNotMatch(
  cleanupSurface,
  /isPressed\(\) const|toggleEnabled\(|clearCurrentLog\(|webServerStarted\(|archivePathFromMillis\(|publishDatacakeOnlineStatus\(|publishDatacakeNumberField\(|publishDatacakeDecimalField\(|dateTimeString\(|timestampKey_|mqttWifiClient|datacakeClientId_|datacakeWillTopic_|wqttAnnouncedOffline_|datacakeAnnouncedOffline_|mqttSignalText/,
  'Build 140 must not restore source-only APIs and fields removed by the safe cleanup.'
);

const maxFrames = [
  'CMD 1 4294967295 4294967295 7200 STATUS 0',
];
for (const frame of maxFrames) {
  assert.ok(frame.length <= 47, `Frame exceeds C3 input contract: ${frame}`);
}

assert.match(protocol, /Staged Implementation/);
assert.match(protocol, /One command may be outstanding at a time/);
assert.match(protocol, /No command frame is sent while WROOM has a valid declared C3 `SLP`/);
assert.match(protocol, /BS build `139`[\s\S]*STATUS-only command sender/);
assert.doesNotMatch(protocol, new RegExp(['c3', 'svc'].join('')));

console.log('controller command contract tests passed');
