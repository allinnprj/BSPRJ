#pragma once

#include <Arduino.h>

struct ControllerTelemetrySnapshot {
  uint32_t session = 0;
  uint32_t sequence = 0;
  bool valid = false;
  int32_t solarMillivolts = 0;
  int32_t solarMilliamps = 0;
  int32_t batteryMillivolts = 0;
  int32_t batteryMilliamps = 0;
  int32_t loadMillivolts = 0;
  int32_t loadMilliamps = 0;
  uint8_t batterySocPercent = 0;
  bool chargeOutputOn = false;
  uint8_t solarControlMode = 0;
  uint32_t receivedAtMs = 0;
};

class ControllerLinkService {
 public:
  void begin(HardwareSerial& serial, uint8_t rxPin, uint8_t txPin);
  void update(uint32_t nowMs);

  const char* stateText() const;
  bool isOnline() const;
  bool isSleeping() const;
  uint32_t lastRttMs() const;
  uint32_t remoteBuild() const;
  uint32_t sleepRemainingSeconds(uint32_t nowMs) const;
  bool hasTelemetry() const;
  const ControllerTelemetrySnapshot& telemetry() const;
  uint32_t telemetryAgeSeconds(uint32_t nowMs) const;

 private:
  enum class State : uint8_t {
    Waiting,
    Online,
    Sleeping,
    Offline,
  };

  void sendPing(uint32_t nowMs);
  void sendTelemetryAck(uint32_t session, uint32_t sequence);
  void processInput(uint32_t nowMs);
  void processLine(uint32_t nowMs);

  static constexpr uint32_t BAUD_RATE = 115200;
  static constexpr uint32_t PING_INTERVAL_MS = 5000;
  static constexpr uint32_t RESPONSE_TIMEOUT_MS = 10000;
  static constexpr uint8_t OFFLINE_MISS_THRESHOLD = 3;
  static constexpr uint32_t MAX_EXPECTED_SLEEP_SECONDS = 86400;
  static constexpr size_t RX_LINE_CAPACITY = 160;

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
  uint32_t sleepUntilMs_ = 0;
  uint8_t consecutiveMisses_ = 0;
  ControllerTelemetrySnapshot telemetry_ = {};
  bool hasTelemetry_ = false;
  uint32_t telemetryAcceptedCount_ = 0;
  uint32_t telemetryDuplicateCount_ = 0;
};
