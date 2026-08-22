#pragma once

#include <Arduino.h>
#include <Preferences.h>
#include <time.h>

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
  bool gpsFixed = false;
  int32_t gpsLatitudeMicrodegrees = 0;
  int32_t gpsLongitudeMicrodegrees = 0;
  uint8_t gpsSatellites = 0;
  uint16_t gpsHdopTenths = 0;
  uint32_t gpsFixEpoch = 0;
  uint32_t receivedAtMs = 0;
};

enum class ControllerCommandState : uint8_t {
  Idle = 0,
  Queued = 1,
  Sent = 2,
  Accepted = 3,
  Executed = 4,
  Failed = 5,
  Expired = 6,
};

struct ControllerCommandSnapshot {
  ControllerCommandState state = ControllerCommandState::Idle;
  uint32_t session = 0;
  uint32_t sequence = 0;
  uint32_t ttlSeconds = 0;
  uint32_t argument = 0;
  char command[9] = {};
  char result[12] = {};
  char actual[49] = {};
};

class ControllerLinkService {
 public:
  using CommandEventHandler = void (*)(const char* eventText, const String& details);

  void begin(HardwareSerial& serial, uint8_t rxPin, uint8_t txPin);
  void setCommandEventHandler(CommandEventHandler handler);
  bool restoreExpectedSleep(uint32_t remainingSeconds, uint32_t build, uint32_t nowMs);
  void update(uint32_t nowMs);

  bool queueStatusCommand(uint32_t ttlSeconds = 120);
  bool queueOtaOnCommand(uint32_t windowSeconds = 600,
                         uint32_t ttlSeconds = 180);
  bool clearTerminalCommand();
  bool commandPersistenceReady() const;
  bool hasCommand() const;
  bool commandTerminal() const;
  const char* commandStateText() const;
  ControllerCommandSnapshot commandSnapshot() const;

  const char* stateText() const;
  bool isOnline() const;
  bool isSleeping() const;
  uint32_t lastRttMs() const;
  uint32_t remoteBuild() const;
  uint32_t sleepRemainingSeconds(uint32_t nowMs) const;
  bool hasTelemetry() const;
  const ControllerTelemetrySnapshot& telemetry() const;
  uint32_t telemetryAgeSeconds(uint32_t nowMs) const;
  uint32_t telemetryAcceptedCount() const;
  uint32_t telemetryDuplicateCount() const;
  uint32_t telemetrySequenceGapCount() const;
  uint32_t offlineTransitionCount() const;

 private:
  enum class State : uint8_t {
    Waiting,
    Online,
    Sleeping,
    Offline,
  };

  void sendPing(uint32_t nowMs);
  void sendTelemetryAck(uint32_t session, uint32_t sequence);
  void sendSleepAck(uint32_t sleepSeconds, uint32_t build);
  void updateCommand(uint32_t nowMs);
  void sendCommandFrame(uint32_t nowMs, bool resultRecovery);
  bool processCommandAck(uint32_t nowMs, const char* line);
  bool processCommandResult(uint32_t nowMs, const char* line);
  bool loadCommandRecord();
  bool saveCommandRecord();
  void initializeCommandRecord();
  void setCommandTerminal(ControllerCommandState state,
                          const char* result,
                          const char* actual,
                          uint32_t nowMs);
  void emitCommandEvent(const char* eventText, const String& details) const;
  bool recordValidActivity(uint32_t nowMs);
  void processInput(uint32_t nowMs);
  void processLine(uint32_t nowMs);

  enum class CommandKind : uint8_t {
    None = 0,
    Status = 1,
    OtaOn = 2,
  };

  bool queueCommand(CommandKind command,
                    uint32_t argument,
                    uint32_t ttlSeconds,
                    uint32_t maxTtlSeconds);
  const char* commandName() const;

  struct PersistedCommandRecord {
    uint32_t magic = 0;
    uint16_t schema = 0;
    uint8_t state = 0;
    uint8_t command = 0;
    uint32_t session = 0;
    uint32_t sequence = 0;
    uint32_t nextSequence = 1;
    uint64_t expiresAtEpoch = 0;
    uint32_t ttlSeconds = 0;
    uint32_t argument = 0;
    char result[12] = {};
    char actual[49] = {};
  };

  static constexpr uint32_t BAUD_RATE = 115200;
  static constexpr uint32_t PING_INTERVAL_MS = 5000;
  static constexpr uint32_t RESPONSE_TIMEOUT_MS = 10000;
  static constexpr uint8_t OFFLINE_MISS_THRESHOLD = 3;
  static constexpr uint32_t WAIT_SILENCE_TIMEOUT_MS = 90000;
  static constexpr uint32_t OFFLINE_SILENCE_TIMEOUT_MS = 240000;
  static constexpr uint32_t MAX_EXPECTED_SLEEP_SECONDS = 86400;
  static constexpr size_t RX_LINE_CAPACITY = 160;
  static constexpr size_t COMMAND_FRAME_CAPACITY = 48;
  static constexpr size_t SLEEP_ACK_FRAME_CAPACITY = 40;
  static constexpr uint32_t COMMAND_RECORD_MAGIC = 0x4333434DU;
  static constexpr uint16_t COMMAND_RECORD_SCHEMA = 1;
  static constexpr uint32_t COMMAND_PROTOCOL_VERSION = 1;
  static constexpr uint32_t COMMAND_MIN_TTL_SECONDS = 1;
  static constexpr uint32_t COMMAND_MAX_TTL_SECONDS = 7200;
  static constexpr uint32_t STATUS_MAX_TTL_SECONDS = 120;
  static constexpr uint32_t OTA_ON_MIN_SECONDS = 300;
  static constexpr uint32_t OTA_ON_MAX_SECONDS = 900;
  static constexpr uint32_t COMMAND_ACK_TIMEOUT_MS = 2000;
  static constexpr uint8_t COMMAND_MAX_SEND_ATTEMPTS = 4;
  static constexpr uint32_t COMMAND_RESULT_RETRY_MS = 5000;
  static constexpr uint32_t COMMAND_RESULT_TIMEOUT_MS = 15000;
  static constexpr uint8_t COMMAND_MAX_RESULT_RECOVERY_RETRIES = 2;
  static constexpr time_t MIN_VALID_COMMAND_EPOCH = 1700000000;

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
  uint32_t startedAtMs_ = 0;
  uint32_t lastValidActivityAtMs_ = 0;
  bool hasValidActivity_ = false;
  ControllerTelemetrySnapshot telemetry_ = {};
  bool hasTelemetry_ = false;
  uint32_t telemetryAcceptedCount_ = 0;
  uint32_t telemetryDuplicateCount_ = 0;
  uint32_t telemetrySequenceGapCount_ = 0;
  uint32_t offlineTransitionCount_ = 0;

  Preferences commandPreferences_;
  PersistedCommandRecord commandRecord_ = {};
  bool commandPreferencesReady_ = false;
  uint8_t commandSendAttempts_ = 0;
  uint8_t commandResultRecoveryRetries_ = 0;
  uint32_t lastCommandTxAtMs_ = 0;
  uint32_t commandAcceptedAtMs_ = 0;
  uint32_t lastCommandResultRetryAtMs_ = 0;
  CommandEventHandler commandEventHandler_ = nullptr;
};
