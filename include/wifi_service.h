#pragma once

#include <Arduino.h>
#include <Preferences.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <freertos/task.h>

enum class WifiSetupState : uint8_t {
  Inactive,
  Ready,
  Testing,
  Invalid,
  Failed,
  SaveFailed,
  Saved,
};

class WifiService {
 public:
  void begin();
  void update();

  bool isConnected() const;
  const char *statusTextCStr() const;
  String ipAddressString() const;
  String ssidString() const;
  int rssiDbm() const;
  uint8_t signalPercent() const;

  bool startSetup();
  bool isSetupActive() const;
  WifiSetupState setupState() const;
  const String &setupApSsid() const;
  uint32_t setupRemainingSeconds() const;
  bool submitSetupCredentials(const String &ssid, const String &password);

 private:
  static constexpr unsigned long kReconnectIntervalMs = 15000UL;
  static constexpr unsigned long kSignalRefreshIntervalMs = 120000UL;
  static constexpr unsigned long kSavedProfileFallbackMs = 30000UL;
  static constexpr unsigned long kSetupWindowMs = 600000UL;
  static constexpr unsigned long kSetupConnectionTimeoutMs = 30000UL;
  static constexpr unsigned long kSetupRestartDelayMs = 4000UL;
  static constexpr unsigned long kInternetProbeIntervalMs = 30000UL;

  struct InternetProbeResult {
    uint32_t generation = 0;
    bool reachable = false;
  };

  bool configured_ = false;
  bool preferencesReady_ = false;
  bool usingSavedProfile_ = false;
  bool defaultFallbackTried_ = false;
  int lastStatusCode_ = -1;
  bool announcedIp_ = false;
  unsigned long lastReconnectAttemptAt_ = 0;
  unsigned long lastSignalRefreshAt_ = 0;
  unsigned long stationConnectionStartedAt_ = 0;
  unsigned long setupStartedAt_ = 0;
  unsigned long setupConnectionStartedAt_ = 0;
  unsigned long setupRestartAt_ = 0;
  int cachedRssiDbm_ = -127;
  uint8_t cachedSignalPercent_ = 0;
  WifiSetupState setupState_ = WifiSetupState::Inactive;
  Preferences preferences_;
  String activeSsid_;
  String activePassword_;
  String candidateSsid_;
  String candidatePassword_;
  String setupApSsid_;
  bool setupAutomatic_ = false;
  bool automaticSetupAttempted_ = false;
  bool stationWasConnected_ = false;
  unsigned long wifiDisconnectedSince_ = 0;
  unsigned long lastInternetProbeAt_ = 0;
  unsigned long internetFailureSince_ = 0;
  uint8_t internetFailureCount_ = 0;
  bool internetProbePending_ = false;
  uint32_t internetProbeGeneration_ = 0;
  QueueHandle_t internetProbeResults_ = nullptr;
  TaskHandle_t internetProbeTask_ = nullptr;

  bool loadSavedProfile();
  bool saveCandidateProfile();
  void beginStationConnection(const String &ssid, const String &password);
  void startSetupAccessPoint();
  void stopSetupAccessPoint();
  void rollbackCandidate();
  void refreshSignalCache(bool connected, bool force);
  void resetInternetMonitoring(unsigned long nowMs);
  void updateAutomaticRecovery(unsigned long nowMs, bool connected);
  static void runInternetProbeTask(void *context);
};
