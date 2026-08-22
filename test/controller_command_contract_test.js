const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const header = fs.readFileSync(path.join(root, 'include', 'controller_link_service.h'), 'utf8');
const source = fs.readFileSync(path.join(root, 'src', 'controller_link_service.cpp'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src', 'main.cpp'), 'utf8');
const telegram = fs.readFileSync(path.join(root, 'src', 'telegram_alert_service.cpp'), 'utf8');
const protocol = fs.readFileSync(path.join(root, 'CONTROLLER_UART_PROTOCOL.md'), 'utf8');
const version = fs.readFileSync(path.join(root, 'include', 'project_version.h'), 'utf8');

function functionBody(text, signature, nextSignature) {
  const start = text.indexOf(signature);
  assert.notStrictEqual(start, -1, `Missing function ${signature}`);
  const end = nextSignature ? text.indexOf(nextSignature, start + signature.length) : text.length;
  assert.notStrictEqual(end, -1, `Missing boundary ${nextSignature}`);
  return text.slice(start, end);
}

assert.match(header, /#include <Preferences\.h>/);
assert.match(header, /bool queueStatusCommand\(uint32_t ttlSeconds = 120\)/);
assert.match(header, /bool queueOtaOnCommand\(uint32_t windowSeconds = 600,/);
assert.match(header, /static constexpr size_t COMMAND_FRAME_CAPACITY = 48/);
assert.match(header, /static constexpr uint32_t COMMAND_MAX_TTL_SECONDS = 7200/);
assert.match(header, /static constexpr uint32_t STATUS_MAX_TTL_SECONDS = 120/);
assert.match(header, /static constexpr uint32_t OTA_ON_MIN_SECONDS = 300/);
assert.match(header, /static constexpr uint32_t OTA_ON_MAX_SECONDS = 900/);
assert.match(header, /static constexpr uint8_t COMMAND_MAX_SEND_ATTEMPTS = 4/);
assert.match(header, /static constexpr uint8_t COMMAND_MAX_RESULT_RECOVERY_RETRIES = 2/);
assert.match(header, /PersistedCommandRecord commandRecord_/);

const beginBody = functionBody(
  source,
  'void ControllerLinkService::begin(',
  'void ControllerLinkService::setCommandEventHandler('
);
assert.match(beginBody, /commandPreferences_\.begin\("c3_command", false\)/);
assert.match(beginBody, /loadCommandRecord\(\)/);

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

const otaQueueBody = functionBody(
  source,
  'bool ControllerLinkService::queueOtaOnCommand(',
  'bool ControllerLinkService::queueCommand('
);
assert.match(otaQueueBody, /OTA_ON_MIN_SECONDS/);
assert.match(otaQueueBody, /OTA_ON_MAX_SECONDS/);
assert.match(otaQueueBody, /CommandKind::OtaOn/);

const updateBody = functionBody(
  source,
  'void ControllerLinkService::updateCommand(',
  'void ControllerLinkService::sendCommandFrame('
);
assert.match(updateBody, /state_ == State::Online/);
assert.match(updateBody, /ControllerCommandState::Expired/);
assert.match(updateBody, /COMMAND_ACK_TIMEOUT_MS/);
assert.match(updateBody, /COMMAND_RESULT_TIMEOUT_MS/);

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
assert.match(source, /putBytes\("record"/);
assert.match(source, /getBytes\("record"/);

assert.match(main, /setCommandEventHandler\(recordControllerCommandEvent\)/);
assert.doesNotMatch(main, /queueStatusCommand\s*\(/,
  'STATUS must only be triggered by the authorized Telegram command path.');
assert.match(telegram, /isC3StatusCommand\(command\)/);
assert.match(telegram, /isBsStatusCommand\(command\)/);
assert.match(telegram, /isC3OtaCommand\(command\)/);
assert.match(telegram, /controllerLink\.isOnline\(\)/);
assert.match(telegram, /controllerLink\.queueStatusCommand\(\)/);
assert.match(telegram, /controllerLink\.queueOtaOnCommand\(600, ttlSeconds\)/);
assert.match(telegram, /c3RefreshCommandPending_/);
assert.match(telegram, /controllerLink\.commandTerminal\(\)/);
assert.match(telegram, /c3TelemetryReceivedAtRequestMs_/);
assert.match(telegram, /freshTelemetryReceived/);
assert.match(telegram, /"CACHED"/);
assert.match(telegram, /Data: <b>Fresh<\/b>/);
assert.match(telegram, /command coalesced -> \/c3sts x/);
assert.match(telegram, /command coalesced -> \/bssts x/);
assert.match(telegram, /command coalesced -> \/c3ota x/);
assert.match(telegram, /BS Controller/);
assert.match(telegram, /C3OtaReplyStage::QueuedNotice/);
assert.match(telegram, /C3OtaReplyStage::AwaitResult/);
assert.match(telegram, /controllerLink\.isSleeping\(\)/);
assert.match(telegram, /sleepRemainingSeconds\(millis\(\)\)/);
assert.match(telegram, /Upload from the C3 project/);
assert.match(telegram, /controllerLink\.remoteBuild\(\) == observedControllerBuild_/);
assert.match(telegram, /sendControllerBuildChanged_\(controllerLink\.remoteBuild\(\)\)/);
assert.match(telegram, /C3 Update/);
assert.match(telegram, /Online · build/);
assert.doesNotMatch(source, /WIFI_OFF|RESTART/,
  'WIFI_OFF and RESTART remain outside this implementation stage.');
assert.match(version, /#define PROJECT_VERSION "0\.1\.79-EXP"/);
assert.match(version, /#define PROJECT_BUILD 133\b/);

const maxFrames = [
  'CMD 1 4294967295 4294967295 7200 STATUS 0',
  'CMD 1 4294967295 4294967295 7200 OTA_ON 900',
  'CMD 1 4294967295 4294967295 7200 WIFI_OFF 0',
  'CMD 1 4294967295 4294967295 7200 RESTART 0',
];
for (const frame of maxFrames) {
  assert.ok(frame.length <= 47, `Frame exceeds C3 input contract: ${frame}`);
}

assert.match(protocol, /Staged Implementation/);
assert.match(protocol, /One command may be outstanding at a time/);
assert.match(protocol, /No command frame is sent while WROOM has a valid declared C3 `SLP`/);
assert.match(protocol, /`STATUS`.*`OTA_ON`.*`WIFI_OFF`.*`RESTART`/s);

console.log('controller command contract tests passed');
