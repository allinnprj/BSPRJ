#include "controller_link_service.h"

#include <esp_system.h>
#include <stdio.h>
#include <string.h>
#include <time.h>

namespace {

bool parseUnsigned(const char*& cursor, uint32_t& value) {
  if (*cursor < '0' || *cursor > '9') {
    return false;
  }
  uint32_t parsed = 0;
  do {
    const uint8_t digit = static_cast<uint8_t>(*cursor - '0');
    if (parsed > (UINT32_MAX - digit) / 10U) {
      return false;
    }
    parsed = parsed * 10U + digit;
    ++cursor;
  } while (*cursor >= '0' && *cursor <= '9');
  value = parsed;
  return true;
}

bool parseSigned(const char*& cursor, int32_t& value) {
  const bool negative = *cursor == '-';
  if (negative) {
    ++cursor;
  }
  uint32_t magnitude = 0;
  if (!parseUnsigned(cursor, magnitude)) {
    return false;
  }
  if ((!negative && magnitude > static_cast<uint32_t>(INT32_MAX)) ||
      (negative && magnitude > static_cast<uint32_t>(INT32_MAX) + 1U)) {
    return false;
  }
  if (negative && magnitude == static_cast<uint32_t>(INT32_MAX) + 1U) {
    value = INT32_MIN;
  } else {
    value = negative ? -static_cast<int32_t>(magnitude)
                     : static_cast<int32_t>(magnitude);
  }
  return true;
}

bool parseNextUnsigned(const char*& cursor, uint32_t& value) {
  if (*cursor != ' ') {
    return false;
  }
  ++cursor;
  return parseUnsigned(cursor, value);
}

bool parseNextSigned(const char*& cursor, int32_t& value) {
  if (*cursor != ' ') {
    return false;
  }
  ++cursor;
  return parseSigned(cursor, value);
}

bool parseCanonicalUnsigned(const char*& cursor, uint32_t& value) {
  const char* const start = cursor;
  if (!parseUnsigned(cursor, value)) {
    return false;
  }
  return cursor - start == 1 || *start != '0';
}

bool parseNextCanonicalUnsigned(const char*& cursor, uint32_t& value) {
  if (*cursor != ' ') {
    return false;
  }
  ++cursor;
  return parseCanonicalUnsigned(cursor, value);
}

bool parseNextToken(const char*& cursor, char* output, size_t capacity) {
  if (*cursor != ' ' || capacity < 2) {
    return false;
  }
  ++cursor;
  size_t length = 0;
  while (*cursor != '\0' && *cursor != ' ') {
    if (length + 1 >= capacity) {
      return false;
    }
    output[length++] = *cursor++;
  }
  if (length == 0) {
    return false;
  }
  output[length] = '\0';
  return true;
}

bool isTerminalCommandState(ControllerCommandState state) {
  return state == ControllerCommandState::Executed ||
         state == ControllerCommandState::Failed ||
         state == ControllerCommandState::Expired;
}

bool isAllowedCommandResult(const char* result) {
  return strcmp(result, "OK") == 0 || strcmp(result, "EXPIRED") == 0 ||
         strcmp(result, "REJECTED") == 0 || strcmp(result, "BUSY") == 0 ||
         strcmp(result, "FAILED") == 0 || strcmp(result, "STALE") == 0;
}

}  // namespace

void ControllerLinkService::begin(HardwareSerial& serial, uint8_t rxPin, uint8_t txPin) {
  serial_ = &serial;
  startedAtMs_ = millis();
  serial_->begin(BAUD_RATE, SERIAL_8N1, rxPin, txPin);
  Serial.print(F("[UART] link ready -> RX="));
  Serial.print(rxPin);
  Serial.print(F(" TX="));
  Serial.print(txPin);
  Serial.print(F(" baud="));
  Serial.println(BAUD_RATE);

  commandPreferencesReady_ = commandPreferences_.begin("c3_command", false);
  if (commandPreferencesReady_ && loadCommandRecord()) {
    Serial.print(F("[UART] CMD persistence ready -> session="));
    Serial.print(commandRecord_.session);
    Serial.print(F(" state="));
    Serial.println(commandStateText());
  } else {
    commandPreferencesReady_ = false;
    Serial.println(F("[UART] CMD OFF -> persistence unavailable"));
  }
}

void ControllerLinkService::setCommandEventHandler(CommandEventHandler handler) {
  commandEventHandler_ = handler;
}

bool ControllerLinkService::restoreExpectedSleep(uint32_t remainingSeconds,
                                                 uint32_t build,
                                                 uint32_t nowMs) {
  if (remainingSeconds == 0 || remainingSeconds > MAX_EXPECTED_SLEEP_SECONDS || build == 0) {
    return false;
  }

  pingPending_ = false;
  pingSent_ = false;
  consecutiveMisses_ = 0;
  lastValidActivityAtMs_ = nowMs;
  hasValidActivity_ = true;
  remoteBuild_ = build;
  sleepUntilMs_ = nowMs + remainingSeconds * 1000U;
  state_ = State::Sleeping;
  Serial.print(F("[UART] SLEEP RESTORED -> C3 build "));
  Serial.print(remoteBuild_);
  Serial.print(F(" for "));
  Serial.print(remainingSeconds);
  Serial.println(F(" s"));
  return true;
}

void ControllerLinkService::update(uint32_t nowMs) {
  if (serial_ == nullptr) {
    return;
  }

  processInput(nowMs);
  updateCommand(nowMs);

  if (state_ == State::Sleeping) {
    if (static_cast<int32_t>(nowMs - sleepUntilMs_) < 0) {
      return;
    }
    state_ = State::Waiting;
    pingPending_ = false;
    pingSent_ = false;
    consecutiveMisses_ = 0;
    startedAtMs_ = nowMs;
    hasValidActivity_ = false;
    Serial.println(F("[UART] WAKE WAIT -> expected C3 wake window"));
  }

  if (pingPending_ && nowMs - pendingSinceMs_ >= RESPONSE_TIMEOUT_MS) {
    pingPending_ = false;
    if (consecutiveMisses_ < OFFLINE_MISS_THRESHOLD) {
      ++consecutiveMisses_;
    }
    const uint32_t silenceMs =
        nowMs - (hasValidActivity_ ? lastValidActivityAtMs_ : startedAtMs_);
    if (consecutiveMisses_ >= OFFLINE_MISS_THRESHOLD) {
      if (silenceMs >= OFFLINE_SILENCE_TIMEOUT_MS && state_ != State::Offline) {
        state_ = State::Offline;
        ++offlineTransitionCount_;
        Serial.println(F("[UART] OFFLINE -> PONG timeouts and 240 s without valid C3 traffic"));
      } else if (silenceMs >= WAIT_SILENCE_TIMEOUT_MS && state_ == State::Online) {
        state_ = State::Waiting;
        Serial.println(F("[UART] WAIT -> PONG timeouts and 90 s without valid C3 traffic"));
      }
    }
  }

  if (!pingPending_ && (!pingSent_ || nowMs - lastPingAtMs_ >= PING_INTERVAL_MS)) {
    sendPing(nowMs);
  }
}

const char* ControllerLinkService::stateText() const {
  switch (state_) {
    case State::Online:
      return "OK";
    case State::Sleeping:
      return "SLP";
    case State::Offline:
      return "OFF";
    case State::Waiting:
    default:
      return "WAIT";
  }
}

bool ControllerLinkService::isOnline() const {
  return state_ == State::Online;
}

bool ControllerLinkService::isSleeping() const {
  return state_ == State::Sleeping;
}

uint32_t ControllerLinkService::lastRttMs() const {
  return lastRttMs_;
}

uint32_t ControllerLinkService::remoteBuild() const {
  return remoteBuild_;
}

uint32_t ControllerLinkService::sleepRemainingSeconds(uint32_t nowMs) const {
  if (state_ != State::Sleeping || static_cast<int32_t>(nowMs - sleepUntilMs_) >= 0) {
    return 0;
  }
  return (sleepUntilMs_ - nowMs + 999U) / 1000U;
}

bool ControllerLinkService::hasTelemetry() const {
  return hasTelemetry_;
}

const ControllerTelemetrySnapshot& ControllerLinkService::telemetry() const {
  return telemetry_;
}

uint32_t ControllerLinkService::telemetryAgeSeconds(uint32_t nowMs) const {
  return hasTelemetry_ ? (nowMs - telemetry_.receivedAtMs) / 1000U : 0;
}

uint32_t ControllerLinkService::telemetryAcceptedCount() const {
  return telemetryAcceptedCount_;
}

uint32_t ControllerLinkService::telemetryDuplicateCount() const {
  return telemetryDuplicateCount_;
}

uint32_t ControllerLinkService::telemetrySequenceGapCount() const {
  return telemetrySequenceGapCount_;
}

uint32_t ControllerLinkService::offlineTransitionCount() const {
  return offlineTransitionCount_;
}

bool ControllerLinkService::queueStatusCommand(uint32_t ttlSeconds) {
  return queueCommand(CommandKind::Status, 0, ttlSeconds,
                      STATUS_MAX_TTL_SECONDS);
}

bool ControllerLinkService::queueWifiOffCommand(uint32_t ttlSeconds) {
  return queueCommand(CommandKind::WifiOff, 0, ttlSeconds,
                      WIFI_OFF_MAX_TTL_SECONDS);
}

bool ControllerLinkService::queueCommand(CommandKind command,
                                         uint32_t argument,
                                         uint32_t ttlSeconds,
                                         uint32_t maxTtlSeconds) {
  if (!commandPreferencesReady_ || hasCommand() ||
      command == CommandKind::None ||
      ttlSeconds < COMMAND_MIN_TTL_SECONDS || ttlSeconds > maxTtlSeconds) {
    return false;
  }

  const time_t nowEpoch = time(nullptr);
  if (nowEpoch < MIN_VALID_COMMAND_EPOCH) {
    String details = F("command=");
    details += commandName(command);
    details += F(" reason=TIME_UNSYNCED");
    emitCommandEvent("CMD_REJECT", details);
    return false;
  }

  const PersistedCommandRecord previous = commandRecord_;
  if (commandRecord_.nextSequence == UINT32_MAX) {
    commandRecord_.session = esp_random();
    if (commandRecord_.session == 0) {
      commandRecord_.session = 1;
    }
    commandRecord_.nextSequence = 1;
  }

  commandRecord_.magic = COMMAND_RECORD_MAGIC;
  commandRecord_.schema = COMMAND_RECORD_SCHEMA;
  commandRecord_.state = static_cast<uint8_t>(ControllerCommandState::Queued);
  commandRecord_.command = static_cast<uint8_t>(command);
  commandRecord_.sequence = commandRecord_.nextSequence++;
  commandRecord_.expiresAtEpoch = static_cast<uint64_t>(nowEpoch) + ttlSeconds;
  commandRecord_.ttlSeconds = 0;
  commandRecord_.argument = argument;
  commandRecord_.result[0] = '\0';
  commandRecord_.actual[0] = '\0';

  if (!saveCommandRecord()) {
    commandRecord_ = previous;
    commandPreferencesReady_ = false;
    String details = F("command=");
    details += commandName(command);
    details += F(" reason=PERSISTENCE");
    emitCommandEvent("CMD_REJECT", details);
    return false;
  }

  commandSendAttempts_ = 0;
  commandResultRecoveryRetries_ = 0;
  lastCommandTxAtMs_ = 0;
  commandAcceptedAtMs_ = 0;
  lastCommandResultRetryAtMs_ = 0;

  String details = F("session=");
  details += commandRecord_.session;
  details += F(" sequence=");
  details += commandRecord_.sequence;
  details += F(" command=");
  details += commandName(command);
  details += F(" ttl_s=");
  details += ttlSeconds;
  details += F(" argument=");
  details += argument;
  emitCommandEvent("CMD_QUEUE", details);
  return true;
}

bool ControllerLinkService::clearTerminalCommand() {
  if (!commandPreferencesReady_ || !commandTerminal()) {
    return false;
  }

  const PersistedCommandRecord previous = commandRecord_;
  commandRecord_.state = static_cast<uint8_t>(ControllerCommandState::Idle);
  commandRecord_.command = static_cast<uint8_t>(CommandKind::None);
  commandRecord_.sequence = 0;
  commandRecord_.expiresAtEpoch = 0;
  commandRecord_.ttlSeconds = 0;
  commandRecord_.argument = 0;
  commandRecord_.result[0] = '\0';
  commandRecord_.actual[0] = '\0';
  if (!saveCommandRecord()) {
    commandRecord_ = previous;
    commandPreferencesReady_ = false;
    return false;
  }
  return true;
}

bool ControllerLinkService::commandPersistenceReady() const {
  return commandPreferencesReady_;
}

bool ControllerLinkService::hasCommand() const {
  return static_cast<ControllerCommandState>(commandRecord_.state) !=
         ControllerCommandState::Idle;
}

bool ControllerLinkService::commandTerminal() const {
  return isTerminalCommandState(
      static_cast<ControllerCommandState>(commandRecord_.state));
}

const char* ControllerLinkService::commandStateText() const {
  switch (static_cast<ControllerCommandState>(commandRecord_.state)) {
    case ControllerCommandState::Queued:
      return state_ == State::Online ? "QUEUED" : "WAITING";
    case ControllerCommandState::Sent:
      return "SENT";
    case ControllerCommandState::Accepted:
      return "ACCEPTED";
    case ControllerCommandState::Executed:
      return "EXECUTED";
    case ControllerCommandState::Failed:
      return "FAILED";
    case ControllerCommandState::Expired:
      return "EXPIRED";
    case ControllerCommandState::Idle:
    default:
      return "IDLE";
  }
}

ControllerCommandSnapshot ControllerLinkService::commandSnapshot() const {
  ControllerCommandSnapshot snapshot;
  snapshot.state = static_cast<ControllerCommandState>(commandRecord_.state);
  snapshot.session = commandRecord_.session;
  snapshot.sequence = commandRecord_.sequence;
  snapshot.ttlSeconds = commandRecord_.ttlSeconds;
  snapshot.argument = commandRecord_.argument;
  if (static_cast<CommandKind>(commandRecord_.command) == CommandKind::Status) {
    strncpy(snapshot.command, "STATUS", sizeof(snapshot.command) - 1);
  } else if (static_cast<CommandKind>(commandRecord_.command) == CommandKind::WifiOff) {
    strncpy(snapshot.command, "WIFI_OFF", sizeof(snapshot.command) - 1);
  }
  strncpy(snapshot.result, commandRecord_.result, sizeof(snapshot.result) - 1);
  strncpy(snapshot.actual, commandRecord_.actual, sizeof(snapshot.actual) - 1);
  return snapshot;
}

bool ControllerLinkService::loadCommandRecord() {
  const size_t storedSize = commandPreferences_.getBytesLength("record");
  if (storedSize != sizeof(commandRecord_) ||
      commandPreferences_.getBytes("record", &commandRecord_, sizeof(commandRecord_)) !=
          sizeof(commandRecord_)) {
    initializeCommandRecord();
    return saveCommandRecord();
  }

  const ControllerCommandState state =
      static_cast<ControllerCommandState>(commandRecord_.state);
  const CommandKind command = static_cast<CommandKind>(commandRecord_.command);
  const bool stateValid = commandRecord_.state <=
                          static_cast<uint8_t>(ControllerCommandState::Expired);
  const bool idleValid = state == ControllerCommandState::Idle &&
                         command == CommandKind::None && commandRecord_.sequence == 0;
  const bool retiredOtaOn =
      commandRecord_.command == RETIRED_OTA_ON_COMMAND_CODE;
  const bool activeCommandValid =
      (command == CommandKind::Status && commandRecord_.argument == 0) ||
      (command == CommandKind::WifiOff && commandRecord_.argument == 0);
  const bool activeValid = state != ControllerCommandState::Idle &&
                           activeCommandValid && commandRecord_.sequence != 0 &&
                           commandRecord_.expiresAtEpoch >=
                               static_cast<uint64_t>(MIN_VALID_COMMAND_EPOCH);
  if (commandRecord_.magic != COMMAND_RECORD_MAGIC ||
      commandRecord_.schema != COMMAND_RECORD_SCHEMA ||
      commandRecord_.session == 0 || commandRecord_.nextSequence == 0 ||
      !stateValid || retiredOtaOn || (!idleValid && !activeValid)) {
    if (retiredOtaOn) {
      Serial.println(F("[UART] CMD retired OTA_ON record cleared"));
    }
    initializeCommandRecord();
    return saveCommandRecord();
  }

  commandSendAttempts_ = 0;
  commandResultRecoveryRetries_ = 0;
  lastCommandTxAtMs_ = 0;
  commandAcceptedAtMs_ = state == ControllerCommandState::Accepted ? millis() : 0;
  lastCommandResultRetryAtMs_ = commandAcceptedAtMs_;
  return true;
}

bool ControllerLinkService::saveCommandRecord() {
  return commandPreferencesReady_ &&
         commandPreferences_.putBytes("record", &commandRecord_, sizeof(commandRecord_)) ==
             sizeof(commandRecord_);
}

void ControllerLinkService::initializeCommandRecord() {
  memset(&commandRecord_, 0, sizeof(commandRecord_));
  commandRecord_.magic = COMMAND_RECORD_MAGIC;
  commandRecord_.schema = COMMAND_RECORD_SCHEMA;
  commandRecord_.state = static_cast<uint8_t>(ControllerCommandState::Idle);
  commandRecord_.command = static_cast<uint8_t>(CommandKind::None);
  commandRecord_.session = esp_random();
  if (commandRecord_.session == 0) {
    commandRecord_.session = 1;
  }
  commandRecord_.nextSequence = 1;
}

const char* ControllerLinkService::commandName(CommandKind command) const {
  switch (command) {
    case CommandKind::Status:
      return "STATUS";
    case CommandKind::WifiOff:
      return "WIFI_OFF";
    case CommandKind::None:
    default:
      return "NONE";
  }
}

const char* ControllerLinkService::commandName() const {
  return commandName(static_cast<CommandKind>(commandRecord_.command));
}

void ControllerLinkService::emitCommandEvent(const char* eventText,
                                             const String& details) const {
  if (commandEventHandler_ != nullptr) {
    commandEventHandler_(eventText, details);
  }
  Serial.print(F("[UART] "));
  Serial.print(eventText);
  Serial.print(F(" -> "));
  Serial.println(details);
}

void ControllerLinkService::updateCommand(uint32_t nowMs) {
  if (!commandPreferencesReady_ || !hasCommand() || commandTerminal()) {
    return;
  }

  const time_t nowEpoch = time(nullptr);
  if (nowEpoch < MIN_VALID_COMMAND_EPOCH) {
    return;
  }

  const ControllerCommandState commandState =
      static_cast<ControllerCommandState>(commandRecord_.state);
  if ((commandState == ControllerCommandState::Queued ||
       commandState == ControllerCommandState::Sent) &&
      static_cast<uint64_t>(nowEpoch) >= commandRecord_.expiresAtEpoch) {
    setCommandTerminal(ControllerCommandState::Expired, "EXPIRED", "NONE", nowMs);
    return;
  }

  if (commandState == ControllerCommandState::Queued) {
    if (state_ == State::Online) {
      sendCommandFrame(nowMs, false);
    }
    return;
  }

  if (commandState == ControllerCommandState::Sent) {
    if (state_ != State::Online) {
      return;
    }
    if (lastCommandTxAtMs_ == 0) {
      sendCommandFrame(nowMs, false);
      return;
    }
    if (nowMs - lastCommandTxAtMs_ < COMMAND_ACK_TIMEOUT_MS) {
      return;
    }
    if (commandSendAttempts_ < COMMAND_MAX_SEND_ATTEMPTS) {
      sendCommandFrame(nowMs, false);
      return;
    }
    if (nowMs - lastCommandTxAtMs_ < COMMAND_LATE_RESPONSE_WAIT_MS) {
      return;
    }
    setCommandTerminal(ControllerCommandState::Failed, "FAILED", "ACK_TIMEOUT", nowMs);
    return;
  }

  if (commandState != ControllerCommandState::Accepted) {
    return;
  }
  if (commandAcceptedAtMs_ == 0) {
    commandAcceptedAtMs_ = nowMs;
    lastCommandResultRetryAtMs_ = nowMs;
  }
  if (nowMs - commandAcceptedAtMs_ >= COMMAND_RESULT_TIMEOUT_MS) {
    setCommandTerminal(ControllerCommandState::Failed, "FAILED", "RESULT_TIMEOUT", nowMs);
    return;
  }
  if (state_ == State::Online &&
      commandResultRecoveryRetries_ < COMMAND_MAX_RESULT_RECOVERY_RETRIES &&
      commandSendAttempts_ < COMMAND_MAX_SEND_ATTEMPTS &&
      nowMs - lastCommandResultRetryAtMs_ >= COMMAND_RESULT_RETRY_MS) {
    sendCommandFrame(nowMs, true);
  }
}

void ControllerLinkService::sendCommandFrame(uint32_t nowMs, bool resultRecovery) {
  if (serial_ == nullptr || !commandPreferencesReady_) {
    return;
  }

  if (!resultRecovery &&
      static_cast<ControllerCommandState>(commandRecord_.state) ==
          ControllerCommandState::Queued) {
    const time_t nowEpoch = time(nullptr);
    if (nowEpoch < MIN_VALID_COMMAND_EPOCH ||
        static_cast<uint64_t>(nowEpoch) >= commandRecord_.expiresAtEpoch) {
      setCommandTerminal(ControllerCommandState::Expired, "EXPIRED", "NONE", nowMs);
      return;
    }
    const uint64_t remainingSeconds =
        commandRecord_.expiresAtEpoch - static_cast<uint64_t>(nowEpoch);
    commandRecord_.ttlSeconds = static_cast<uint32_t>(remainingSeconds);
    commandRecord_.state = static_cast<uint8_t>(ControllerCommandState::Sent);
    if (!saveCommandRecord()) {
      commandPreferencesReady_ = false;
      commandRecord_.state = static_cast<uint8_t>(ControllerCommandState::Failed);
      String details = F("command=");
      details += commandName();
      details += F(" reason=PERSISTENCE");
      emitCommandEvent("CMD_REJECT", details);
      return;
    }
  }

  const CommandKind command = static_cast<CommandKind>(commandRecord_.command);
  const bool argumentValid =
      (command == CommandKind::Status && commandRecord_.argument == 0) ||
      (command == CommandKind::WifiOff && commandRecord_.argument == 0);
  if (commandRecord_.ttlSeconds < COMMAND_MIN_TTL_SECONDS ||
      commandRecord_.ttlSeconds > COMMAND_MAX_TTL_SECONDS || !argumentValid) {
    setCommandTerminal(ControllerCommandState::Failed, "FAILED", "FRAME_INVALID", nowMs);
    return;
  }

  char frame[COMMAND_FRAME_CAPACITY] = {};
  const int written = snprintf(frame, sizeof(frame), "CMD %lu %lu %lu %lu %s %lu",
                               static_cast<unsigned long>(COMMAND_PROTOCOL_VERSION),
                               static_cast<unsigned long>(commandRecord_.session),
                               static_cast<unsigned long>(commandRecord_.sequence),
                               static_cast<unsigned long>(commandRecord_.ttlSeconds),
                               commandName(),
                               static_cast<unsigned long>(commandRecord_.argument));
  if (written <= 0 || static_cast<size_t>(written) >= sizeof(frame)) {
    setCommandTerminal(ControllerCommandState::Failed, "FAILED", "FRAME_OVERFLOW", nowMs);
    return;
  }

  serial_->println(frame);
  lastCommandTxAtMs_ = nowMs;
  String details = F("session=");
  details += commandRecord_.session;
  details += F(" sequence=");
  details += commandRecord_.sequence;
  details += F(" command=");
  details += commandName();
  details += F(" attempt=");
  if (resultRecovery) {
    ++commandResultRecoveryRetries_;
    ++commandSendAttempts_;
    lastCommandResultRetryAtMs_ = nowMs;
    details += commandResultRecoveryRetries_;
    details += F(" phase=RESULT");
    emitCommandEvent("CMD_RETRY", details);
  } else {
    ++commandSendAttempts_;
    details += commandSendAttempts_;
    details += F(" phase=ACK");
    emitCommandEvent(commandSendAttempts_ == 1 ? "CMD_TX" : "CMD_RETRY", details);
  }
}

bool ControllerLinkService::processCommandAck(uint32_t nowMs, const char* line) {
  const char* cursor = line + 5;
  uint32_t version = 0;
  uint32_t session = 0;
  uint32_t sequence = 0;
  char ackKind[4] = {};
  if (!parseCanonicalUnsigned(cursor, version) ||
      !parseNextCanonicalUnsigned(cursor, session) ||
      !parseNextCanonicalUnsigned(cursor, sequence) ||
      !parseNextToken(cursor, ackKind, sizeof(ackKind)) || *cursor != '\0' ||
      version != COMMAND_PROTOCOL_VERSION || session == 0 || sequence == 0 ||
      (strcmp(ackKind, "NEW") != 0 && strcmp(ackKind, "DUP") != 0)) {
    return false;
  }

  const ControllerCommandState state =
      static_cast<ControllerCommandState>(commandRecord_.state);
  if (!hasCommand() || commandTerminal() ||
      (state != ControllerCommandState::Sent &&
       state != ControllerCommandState::Accepted) ||
      session != commandRecord_.session || sequence != commandRecord_.sequence) {
    return false;
  }

  recordValidActivity(nowMs);
  if (state == ControllerCommandState::Sent) {
    commandRecord_.state = static_cast<uint8_t>(ControllerCommandState::Accepted);
    if (!saveCommandRecord()) {
      commandPreferencesReady_ = false;
      commandRecord_.state = static_cast<uint8_t>(ControllerCommandState::Failed);
      String details = F("command=");
      details += commandName();
      details += F(" reason=PERSISTENCE");
      emitCommandEvent("CMD_REJECT", details);
      return false;
    }
    commandAcceptedAtMs_ = nowMs;
    lastCommandResultRetryAtMs_ = nowMs;
    commandResultRecoveryRetries_ = 0;
  }

  String details = F("session=");
  details += session;
  details += F(" sequence=");
  details += sequence;
  details += F(" kind=");
  details += ackKind;
  emitCommandEvent(strcmp(ackKind, "DUP") == 0 ? "CMD_DUP" : "CMD_ACK", details);
  return true;
}

bool ControllerLinkService::processCommandResult(uint32_t nowMs, const char* line) {
  const char* cursor = line + 5;
  uint32_t version = 0;
  uint32_t session = 0;
  uint32_t sequence = 0;
  char result[12] = {};
  char actual[49] = {};
  if (!parseCanonicalUnsigned(cursor, version) ||
      !parseNextCanonicalUnsigned(cursor, session) ||
      !parseNextCanonicalUnsigned(cursor, sequence) ||
      !parseNextToken(cursor, result, sizeof(result)) ||
      !parseNextToken(cursor, actual, sizeof(actual)) || *cursor != '\0' ||
      version != COMMAND_PROTOCOL_VERSION || session == 0 || sequence == 0 ||
      !isAllowedCommandResult(result)) {
    return false;
  }

  if (!hasCommand() || session != commandRecord_.session ||
      sequence != commandRecord_.sequence) {
    return false;
  }

  char expectedActual[24] = {};
  if (static_cast<CommandKind>(commandRecord_.command) == CommandKind::Status) {
    strncpy(expectedActual, "STATUS", sizeof(expectedActual) - 1);
  } else if (static_cast<CommandKind>(commandRecord_.command) == CommandKind::WifiOff) {
    strncpy(expectedActual, "WIFI_OFF", sizeof(expectedActual) - 1);
  } else {
    return false;
  }
  if ((strcmp(result, "OK") == 0 && strcmp(actual, expectedActual) != 0) ||
      (strcmp(result, "OK") != 0 && strcmp(actual, "NONE") != 0)) {
    return false;
  }

  recordValidActivity(nowMs);
  if (commandTerminal()) {
    return true;
  }
  if (strcmp(result, "OK") == 0) {
    setCommandTerminal(ControllerCommandState::Executed, result, actual, nowMs);
  } else if (strcmp(result, "EXPIRED") == 0) {
    setCommandTerminal(ControllerCommandState::Expired, result, actual, nowMs);
  } else {
    setCommandTerminal(ControllerCommandState::Failed, result, actual, nowMs);
  }
  return true;
}

void ControllerLinkService::setCommandTerminal(ControllerCommandState state,
                                               const char* result,
                                               const char* actual,
                                               uint32_t nowMs) {
  commandRecord_.state = static_cast<uint8_t>(state);
  strncpy(commandRecord_.result, result, sizeof(commandRecord_.result) - 1);
  commandRecord_.result[sizeof(commandRecord_.result) - 1] = '\0';
  strncpy(commandRecord_.actual, actual, sizeof(commandRecord_.actual) - 1);
  commandRecord_.actual[sizeof(commandRecord_.actual) - 1] = '\0';
  if (!saveCommandRecord()) {
    commandPreferencesReady_ = false;
  }

  String details = F("session=");
  details += commandRecord_.session;
  details += F(" sequence=");
  details += commandRecord_.sequence;
  details += F(" result=");
  details += commandRecord_.result;
  details += F(" actual=");
  details += commandRecord_.actual;
  details += F(" elapsed_ms=");
  details += commandAcceptedAtMs_ == 0 ? 0 : nowMs - commandAcceptedAtMs_;
  emitCommandEvent(state == ControllerCommandState::Expired ? "CMD_EXPIRE"
                                                            : "CMD_RESULT",
                   details);
}

void ControllerLinkService::sendPing(uint32_t nowMs) {
  pendingSequence_ = nextSequence_++;
  pendingSinceMs_ = nowMs;
  lastPingAtMs_ = nowMs;
  pingPending_ = true;
  pingSent_ = true;
  serial_->print(F("PING "));
  serial_->println(pendingSequence_);
}

void ControllerLinkService::sendTelemetryAck(uint32_t session, uint32_t sequence) {
  serial_->print(F("ACK "));
  serial_->print(session);
  serial_->print(' ');
  serial_->println(sequence);
}

void ControllerLinkService::sendSleepAck(uint32_t sleepSeconds, uint32_t build) {
  char frame[SLEEP_ACK_FRAME_CAPACITY] = {};
  const int written = snprintf(frame,
                               sizeof(frame),
                               "SACK %lu C3 %lu\n",
                               static_cast<unsigned long>(sleepSeconds),
                               static_cast<unsigned long>(build));
  if (written <= 0 || static_cast<size_t>(written) >= sizeof(frame)) {
    return;
  }
  serial_->write(reinterpret_cast<const uint8_t*>(frame),
                 static_cast<size_t>(written));
  serial_->flush();
}

bool ControllerLinkService::processTimeRequest(uint32_t nowMs,
                                               const char* line) {
  const char* cursor = line + 5;
  uint32_t version = 0;
  uint32_t requestNonce = 0;
  if (!parseCanonicalUnsigned(cursor, version) ||
      !parseNextCanonicalUnsigned(cursor, requestNonce) || *cursor != '\0' ||
      version != 1 || requestNonce == 0) {
    return false;
  }

  const time_t nowEpoch = time(nullptr);
  sendTimeResponse(requestNonce,
                   nowEpoch >= MIN_VALID_COMMAND_EPOCH ? nowEpoch : 0);
  recordValidActivity(nowMs);
  Serial.print(F("[UART] TIME -> nonce="));
  Serial.print(requestNonce);
  Serial.print(F(" state="));
  Serial.println(nowEpoch >= MIN_VALID_COMMAND_EPOCH ? F("SYNC") : F("WAIT"));
  return true;
}

void ControllerLinkService::sendTimeResponse(uint32_t requestNonce,
                                             time_t epoch) {
  if (serial_ == nullptr) {
    return;
  }
  char frame[TIME_RESPONSE_FRAME_CAPACITY] = {};
  const int written = snprintf(frame,
                               sizeof(frame),
                               "TIME 1 %lu %lld\n",
                               static_cast<unsigned long>(requestNonce),
                               static_cast<long long>(epoch));
  if (written <= 0 || static_cast<size_t>(written) >= sizeof(frame)) {
    return;
  }
  serial_->write(reinterpret_cast<const uint8_t*>(frame),
                 static_cast<size_t>(written));
  serial_->flush();
}

bool ControllerLinkService::recordValidActivity(uint32_t nowMs) {
  const bool restoredOnline = state_ != State::Online;
  lastValidActivityAtMs_ = nowMs;
  hasValidActivity_ = true;
  consecutiveMisses_ = 0;
  sleepUntilMs_ = 0;
  state_ = State::Online;
  return restoredOnline;
}

void ControllerLinkService::processInput(uint32_t nowMs) {
  while (serial_->available() > 0) {
    const char value = static_cast<char>(serial_->read());
    if (value == '\r') {
      continue;
    }
    if (value == '\n') {
      if (!rxOverflow_ && rxLength_ > 0) {
        rxLine_[rxLength_] = '\0';
        processLine(nowMs);
      }
      rxLength_ = 0;
      rxOverflow_ = false;
      continue;
    }
    if (rxOverflow_) {
      continue;
    }
    if (value < 0x20 || value > 0x7E || rxLength_ + 1 >= RX_LINE_CAPACITY) {
      rxLength_ = 0;
      rxOverflow_ = true;
      continue;
    }
    rxLine_[rxLength_++] = value;
  }
}

void ControllerLinkService::processLine(uint32_t nowMs) {
  const char* cursor = rxLine_;
  uint32_t sequence = 0;
  uint32_t build = 0;
  if (strncmp(cursor, "CACK ", 5) == 0) {
    processCommandAck(nowMs, cursor);
    return;
  }
  if (strncmp(cursor, "CRES ", 5) == 0) {
    processCommandResult(nowMs, cursor);
    return;
  }
  if (strncmp(cursor, "TREQ ", 5) == 0) {
    processTimeRequest(nowMs, cursor);
    return;
  }
  if (strncmp(cursor, "TEL ", 4) == 0) {
    cursor += 4;
    ControllerTelemetrySnapshot incoming = {};
    uint32_t valid = 0;
    uint32_t soc = 0;
    uint32_t charge = 0;
    uint32_t mode = 0;
    uint32_t gpsFixed = 0;
    uint32_t gpsSatellites = 0;
    uint32_t gpsHdopTenths = 0;
    uint32_t gpsFixEpoch = 0;
    if (!parseUnsigned(cursor, incoming.session) ||
        !parseNextUnsigned(cursor, incoming.sequence) ||
        !parseNextUnsigned(cursor, valid) ||
        !parseNextSigned(cursor, incoming.solarMillivolts) ||
        !parseNextSigned(cursor, incoming.solarMilliamps) ||
        !parseNextSigned(cursor, incoming.batteryMillivolts) ||
        !parseNextSigned(cursor, incoming.batteryMilliamps) ||
        !parseNextSigned(cursor, incoming.loadMillivolts) ||
        !parseNextSigned(cursor, incoming.loadMilliamps) ||
        !parseNextUnsigned(cursor, soc) ||
        !parseNextUnsigned(cursor, charge) ||
        !parseNextUnsigned(cursor, mode) ||
        incoming.session == 0 || incoming.sequence == 0 || valid > 1 ||
        soc > 100 || charge > 1 || mode > 2 ||
        incoming.solarMillivolts < -5000 || incoming.solarMillivolts > 100000 ||
        incoming.batteryMillivolts < -5000 || incoming.batteryMillivolts > 100000 ||
        incoming.loadMillivolts < -5000 || incoming.loadMillivolts > 100000 ||
        incoming.solarMilliamps < -100000 || incoming.solarMilliamps > 100000 ||
        incoming.batteryMilliamps < -100000 || incoming.batteryMilliamps > 100000 ||
        incoming.loadMilliamps < -100000 || incoming.loadMilliamps > 100000) {
      return;
    }

    if (*cursor != '\0') {
      if (!parseNextUnsigned(cursor, gpsFixed) ||
          !parseNextSigned(cursor, incoming.gpsLatitudeMicrodegrees) ||
          !parseNextSigned(cursor, incoming.gpsLongitudeMicrodegrees) ||
          !parseNextUnsigned(cursor, gpsSatellites) ||
          !parseNextUnsigned(cursor, gpsHdopTenths) ||
          !parseNextUnsigned(cursor, gpsFixEpoch) || *cursor != '\0' ||
          gpsFixed > 1 || gpsSatellites > 99 || gpsHdopTenths > 9999 ||
          incoming.gpsLatitudeMicrodegrees < -90000000 ||
          incoming.gpsLatitudeMicrodegrees > 90000000 ||
          incoming.gpsLongitudeMicrodegrees < -180000000 ||
          incoming.gpsLongitudeMicrodegrees > 180000000 ||
          (gpsFixed != 0 && gpsFixEpoch < 1700000000UL) ||
          (gpsFixed == 0 &&
           (incoming.gpsLatitudeMicrodegrees != 0 ||
            incoming.gpsLongitudeMicrodegrees != 0 || gpsSatellites != 0 ||
            gpsHdopTenths != 0 || gpsFixEpoch != 0))) {
        return;
      }
      incoming.gpsFixed = gpsFixed != 0;
      incoming.gpsSatellites = static_cast<uint8_t>(gpsSatellites);
      incoming.gpsHdopTenths = static_cast<uint16_t>(gpsHdopTenths);
      incoming.gpsFixEpoch = gpsFixEpoch;
    }

    if (recordValidActivity(nowMs)) {
      Serial.print(F("[UART] ONLINE -> valid C3 traffic build "));
      Serial.println(remoteBuild_);
    }
    sendTelemetryAck(incoming.session, incoming.sequence);
    if (hasTelemetry_ && telemetry_.session == incoming.session &&
        telemetry_.sequence == incoming.sequence) {
      ++telemetryDuplicateCount_;
      Serial.print(F("[UART] TEL DUP -> q="));
      Serial.print(incoming.sequence);
      Serial.println(F(" re-acked"));
      return;
    }

    if (hasTelemetry_ && telemetry_.session == incoming.session &&
        incoming.sequence > telemetry_.sequence &&
        incoming.sequence - telemetry_.sequence > 1U) {
      telemetrySequenceGapCount_ += incoming.sequence - telemetry_.sequence - 1U;
      Serial.print(F("[UART] TEL GAP -> q="));
      Serial.print(telemetry_.sequence);
      Serial.print(F(".."));
      Serial.println(incoming.sequence);
    }

    incoming.valid = valid != 0;
    incoming.batterySocPercent = static_cast<uint8_t>(soc);
    incoming.chargeOutputOn = charge != 0;
    incoming.solarControlMode = static_cast<uint8_t>(mode);
    incoming.receivedAtMs = nowMs;
    telemetry_ = incoming;
    hasTelemetry_ = true;
    ++telemetryAcceptedCount_;
    Serial.print(F("[UART] TEL ACK -> q="));
    Serial.print(telemetry_.sequence);
    Serial.print(F(" ina="));
    Serial.print(telemetry_.valid ? F("OK") : F("ERR"));
    Serial.print(F(" solar="));
    Serial.print(telemetry_.solarMillivolts);
    Serial.print(F("mV/"));
    Serial.print(telemetry_.solarMilliamps);
    Serial.print(F("mA battery="));
    Serial.print(telemetry_.batteryMillivolts);
    Serial.print(F("mV/"));
    Serial.print(telemetry_.batteryMilliamps);
    Serial.print(F("mA load="));
    Serial.print(telemetry_.loadMillivolts);
    Serial.print(F("mV/"));
    Serial.print(telemetry_.loadMilliamps);
    Serial.print(F("mA soc="));
    Serial.print(telemetry_.batterySocPercent);
    Serial.print(F("% charge="));
    Serial.print(telemetry_.chargeOutputOn ? F("ON") : F("OFF"));
    Serial.print(F(" mode="));
    Serial.print(telemetry_.solarControlMode == 1
                     ? F("AUTO")
                     : (telemetry_.solarControlMode == 2 ? F("MANUAL")
                                                         : F("CLASSIC")));
    Serial.print(F(" gps="));
    Serial.println(telemetry_.gpsFixed ? F("FIX") : F("NONE"));
    return;
  }

  if (strncmp(cursor, "SLEEP ", 6) == 0) {
    cursor += 6;
    uint32_t sleepSeconds = 0;
    if (!parseUnsigned(cursor, sleepSeconds) ||
        strncmp(cursor, " C3 ", 4) != 0) {
      return;
    }
    cursor += 4;
    if (!parseUnsigned(cursor, build) || *cursor != '\0' ||
        sleepSeconds == 0 || sleepSeconds > MAX_EXPECTED_SLEEP_SECONDS) {
      return;
    }

    pingPending_ = false;
    consecutiveMisses_ = 0;
    lastValidActivityAtMs_ = nowMs;
    hasValidActivity_ = true;
    remoteBuild_ = build;
    sleepUntilMs_ = nowMs + sleepSeconds * 1000U;
    state_ = State::Sleeping;
    sendSleepAck(sleepSeconds, build);
    Serial.print(F("[UART] SLEEP -> C3 build "));
    Serial.print(remoteBuild_);
    Serial.print(F(" for "));
    Serial.print(sleepSeconds);
    Serial.println(F(" s"));
    return;
  }

  if (strncmp(cursor, "PONG ", 5) != 0) {
    return;
  }
  cursor += 5;
  if (!parseUnsigned(cursor, sequence) || strncmp(cursor, " C3 ", 4) != 0) {
    return;
  }
  cursor += 4;
  if (!parseUnsigned(cursor, build) || *cursor != '\0' ||
      !pingPending_ || sequence != pendingSequence_) {
    return;
  }

  pingPending_ = false;
  consecutiveMisses_ = 0;
  lastRttMs_ = nowMs - pendingSinceMs_;
  remoteBuild_ = build;
  if (recordValidActivity(nowMs)) {
    Serial.print(F("[UART] ONLINE -> C3 build "));
    Serial.print(remoteBuild_);
    Serial.print(F(" rtt="));
    Serial.print(lastRttMs_);
    Serial.println(F(" ms"));
  }
}
