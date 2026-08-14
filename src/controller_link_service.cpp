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

  if (pingPending_ && nowMs - pendingSinceMs_ >= RESPONSE_TIMEOUT_MS) {
    pingPending_ = false;
    if (state_ != State::Offline) {
      state_ = State::Offline;
      Serial.println(F("[UART] OFFLINE -> no valid C3 PONG"));
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

uint32_t ControllerLinkService::lastRttMs() const {
  return lastRttMs_;
}

uint32_t ControllerLinkService::remoteBuild() const {
  return remoteBuild_;
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
  lastRttMs_ = nowMs - pendingSinceMs_;
  remoteBuild_ = build;
  if (state_ != State::Online) {
    Serial.print(F("[UART] ONLINE -> C3 build "));
    Serial.print(remoteBuild_);
    Serial.print(F(" rtt="));
    Serial.print(lastRttMs_);
    Serial.println(F(" ms"));
  }
  state_ = State::Online;
}
