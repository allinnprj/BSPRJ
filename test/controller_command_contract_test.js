const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const header = fs.readFileSync(path.join(root, 'include', 'controller_link_service.h'), 'utf8');
const source = fs.readFileSync(path.join(root, 'src', 'controller_link_service.cpp'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src', 'main.cpp'), 'utf8');
const telegram = fs.readFileSync(path.join(root, 'src', 'telegram_alert_service.cpp'), 'utf8');
const protocol = fs.readFileSync(path.join(root, 'CONTROLLER_UART_PROTOCOL.md'), 'utf8');

function functionBody(text, signature, nextSignature) {
  const start = text.indexOf(signature);
  assert.notStrictEqual(start, -1, `Missing function ${signature}`);
  const end = nextSignature ? text.indexOf(nextSignature, start + signature.length) : text.length;
  assert.notStrictEqual(end, -1, `Missing boundary ${nextSignature}`);
  return text.slice(start, end);
}

assert.match(header, /#include <Preferences\.h>/);
assert.match(header, /bool queueStatusCommand\(uint32_t ttlSeconds = 120\)/);
assert.match(header, /static constexpr size_t COMMAND_FRAME_CAPACITY = 48/);
assert.match(header, /static constexpr uint32_t COMMAND_MAX_TTL_SECONDS = 7200/);
assert.match(header, /static constexpr uint32_t STATUS_MAX_TTL_SECONDS = 120/);
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
assert.match(sendBody, /"CMD %lu %lu %lu %lu STATUS 0"/);
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
  'This stage must not expose or automatically enqueue STATUS.');
assert.doesNotMatch(telegram, /queueStatusCommand\s*\(/,
  'Telegram exposure belongs to a later approved stage.');
assert.doesNotMatch(source, /OTA_ON|WIFI_OFF|RESTART/,
  'Only STATUS is executable in the WROOM command sender stage.');

const maxFrames = [
  'CMD 1 4294967295 4294967295 7200 STATUS 0',
  'CMD 1 4294967295 4294967295 7200 OTA_ON 900',
  'CMD 1 4294967295 4294967295 7200 WIFI_OFF 0',
  'CMD 1 4294967295 4294967295 7200 RESTART 0',
];
for (const frame of maxFrames) {
  assert.ok(frame.length <= 47, `Frame exceeds C3 input contract: ${frame}`);
}

assert.match(protocol, /Specification Only/);
assert.match(protocol, /One command may be outstanding at a time/);
assert.match(protocol, /No command frame is sent while WROOM has a valid declared C3 `SLP`/);
assert.match(protocol, /`STATUS`.*`OTA_ON`.*`WIFI_OFF`.*`RESTART`/s);

console.log('controller command contract tests passed');
