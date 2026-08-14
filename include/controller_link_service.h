#pragma once

#include <Arduino.h>

class ControllerLinkService {
 public:
  void begin(HardwareSerial& serial, uint8_t rxPin, uint8_t txPin);
  void update(uint32_t nowMs);

  const char* stateText() const;
  bool isOnline() const;
  uint32_t lastRttMs() const;
  uint32_t remoteBuild() const;

 private:
  enum class State : uint8_t {
    Waiting,
    Online,
    Offline,
  };

  void sendPing(uint32_t nowMs);
  void processInput(uint32_t nowMs);
  void processLine(uint32_t nowMs);

  static constexpr uint32_t BAUD_RATE = 115200;
  static constexpr uint32_t PING_INTERVAL_MS = 5000;
  static constexpr uint32_t RESPONSE_TIMEOUT_MS = 10000;
  static constexpr uint8_t OFFLINE_MISS_THRESHOLD = 3;
  static constexpr size_t RX_LINE_CAPACITY = 64;

  HardwareSerial* serial_ = nullptr;
  State state_ = State::Waiting;
  char rxLine_[RX_LINE_CAPACITY] = {};
  size_t rxLength_ = 0;
  bool rxOverflow_ = false;
  bool pingPending_ = false;
  bool pingSent_ = false;
  uint32_t nextSequence_ = 1;
  uint32_t pendingSequence_ = 0;
  uint32_t pendingSinceMs_ = 0;
  uint32_t lastPingAtMs_ = 0;
  uint32_t lastRttMs_ = 0;
  uint32_t remoteBuild_ = 0;
  uint8_t consecutiveMisses_ = 0;
};
