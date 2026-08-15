#include "controller_link_service.h"

#include <string.h>

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

}  // namespace

void ControllerLinkService::begin(HardwareSerial& serial, uint8_t rxPin, uint8_t txPin) {
  serial_ = &serial;
  serial_->begin(BAUD_RATE, SERIAL_8N1, rxPin, txPin);
  Serial.print(F("[UART] link ready -> RX="));
  Serial.print(rxPin);
  Serial.print(F(" TX="));
  Serial.print(txPin);
  Serial.print(F(" baud="));
  Serial.println(BAUD_RATE);
}

void ControllerLinkService::update(uint32_t nowMs) {
  if (serial_ == nullptr) {
    return;
  }

  processInput(nowMs);

  if (state_ == State::Sleeping) {
    if (static_cast<int32_t>(nowMs - sleepUntilMs_) < 0) {
      return;
    }
    state_ = State::Waiting;
    pingPending_ = false;
    pingSent_ = false;
    consecutiveMisses_ = 0;
    Serial.println(F("[UART] WAKE WAIT -> expected C3 wake window"));
  }

  if (pingPending_ && nowMs - pendingSinceMs_ >= RESPONSE_TIMEOUT_MS) {
    pingPending_ = false;
    if (consecutiveMisses_ < OFFLINE_MISS_THRESHOLD) {
      ++consecutiveMisses_;
    }
    const bool validTrafficRecentlySeen =
        hasValidActivity_ && nowMs - lastValidActivityAtMs_ < OFFLINE_SILENCE_TIMEOUT_MS;
    if (consecutiveMisses_ >= OFFLINE_MISS_THRESHOLD &&
        !validTrafficRecentlySeen && state_ != State::Offline) {
      state_ = State::Offline;
      ++offlineTransitionCount_;
      Serial.println(F("[UART] OFFLINE -> PONG timeouts and 90 s without valid C3 traffic"));
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

uint32_t ControllerLinkService::offlineTransitionCount() const {
  return offlineTransitionCount_;
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

void ControllerLinkService::recordValidActivity(uint32_t nowMs) {
  lastValidActivityAtMs_ = nowMs;
  hasValidActivity_ = true;
  consecutiveMisses_ = 0;
  if (state_ == State::Offline) {
    state_ = State::Online;
    Serial.print(F("[UART] ONLINE -> valid C3 traffic build "));
    Serial.println(remoteBuild_);
  }
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
  if (strncmp(cursor, "TEL ", 4) == 0) {
    cursor += 4;
    ControllerTelemetrySnapshot incoming = {};
    uint32_t valid = 0;
    uint32_t soc = 0;
    uint32_t charge = 0;
    uint32_t mode = 0;
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
        !parseNextUnsigned(cursor, mode) || *cursor != '\0' ||
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

    recordValidActivity(nowMs);
    sendTelemetryAck(incoming.session, incoming.sequence);
    if (hasTelemetry_ && telemetry_.session == incoming.session &&
        telemetry_.sequence == incoming.sequence) {
      ++telemetryDuplicateCount_;
      Serial.print(F("[UART] TEL DUP -> q="));
      Serial.print(incoming.sequence);
      Serial.println(F(" re-acked"));
      return;
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
    Serial.println(telemetry_.solarControlMode == 1
                       ? F("AUTO")
                       : (telemetry_.solarControlMode == 2 ? F("MANUAL")
                                                           : F("CLASSIC")));
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
  recordValidActivity(nowMs);
  if (state_ != State::Online) {
    Serial.print(F("[UART] ONLINE -> C3 build "));
    Serial.print(remoteBuild_);
    Serial.print(F(" rtt="));
    Serial.print(lastRttMs_);
    Serial.println(F(" ms"));
  }
  state_ = State::Online;
}
