#pragma once

#include <Arduino.h>
#include <Preferences.h>

#include "controller_link_service.h"

class LogService;

struct BsStatusView {
  const String &ipAddress;
  int wifiRssiDbm;
  uint8_t wifiSignalPercent;
  const String &wifiSsid;
  bool timeSynced;
  const char *versionText;
  uint32_t buildNumber;
  const String &uptimeText;
  uint16_t currentLevel;
  float currentDbaEstimate;
  bool dbaAvailable;
  uint32_t hourAverage;
  uint32_t totalAverage;
  uint32_t hourSamplesCollected;
  const char *dayPartText;
  const char *noiseLevelText;
  const char *signalStateText;
  bool environmentAvailable;
  float temperatureC;
  float humidityPct;
  bool wqttConnected;
  uint8_t googleSheetsQueue;
};

class TelegramAlertService {
 public:
  void begin();
  void update(bool wifiConnected, const String &ipAddress, int wifiRssiDbm,
              uint8_t wifiSignalPercent, const String &wifiSsid,
              bool timeSynced, const char *versionText, uint32_t buildNumber,
              const String &uptimeText);
  void updateControllerStatus(bool wifiConnected, int wifiRssiDbm,
                              uint8_t wifiSignalPercent, const String &wifiSsid,
                              const ControllerLinkService &controllerLink);
  void updateCommands(bool wifiConnected, bool timeSynced, int wifiRssiDbm,
                      uint8_t wifiSignalPercent, const String &wifiSsid,
                      ControllerLinkService &controllerLink,
                      const BsStatusView &bsStatus, LogService &logService);

 private:
  static constexpr unsigned long kOnlineWarmupMs = 20000UL;
  static constexpr unsigned long kRetryIntervalMs = 30000UL;
  static constexpr unsigned long kRestoreThresholdMs = 90000UL;
  static constexpr unsigned long kRestoreWarmupMs = 10000UL;
  static constexpr unsigned long kCommandPollIntervalMs = 30000UL;
  static constexpr unsigned long kSendSpacingMs = 5000UL;
  static constexpr unsigned long kPendingReplyMaxAgeMs = 120000UL;
  static constexpr uint16_t kTelegramHttpTimeoutMs = 4000;
  static constexpr uint32_t kMaxCommandAgeSeconds = 120;

  bool sendDeviceOnline_(const String &ipAddress, int wifiRssiDbm,
                         uint8_t wifiSignalPercent, const String &wifiSsid,
                         bool timeSynced, const char *versionText, uint32_t buildNumber,
                         const String &uptimeText);
  bool sendWifiRestored_(const String &ipAddress, int wifiRssiDbm,
                         uint8_t wifiSignalPercent, const String &wifiSsid,
                         bool timeSynced, const char *versionText, uint32_t buildNumber,
                         const String &uptimeText, unsigned long downtimeMs);
  bool sendControllerStatus_(const ControllerLinkService &controllerLink,
                             uint32_t nowMs, int wifiRssiDbm,
                             uint8_t wifiSignalPercent, const String &wifiSsid,
                             const char *refreshState = nullptr);
  bool sendBsStatus_(const BsStatusView &status,
                     const ControllerLinkService &controllerLink);
  bool sendHelp_();
  bool sendC3WakeReply_(ControllerWakeRequestResult result);
  bool sendDbCalibrationReply_(const LogService &logService,
                               const String &ipAddress);
  bool sendStatusMessage_(const String &message, const char *logLabel);
  bool pollCommands_(ControllerLinkService &controllerLink,
                     LogService &logService);
  void processCommandUpdates_(const String &response,
                              ControllerLinkService &controllerLink,
                              LogService &logService);
  String buildDeviceOnlineMessage_(const String &ipAddress, int wifiRssiDbm,
                                   uint8_t wifiSignalPercent, const String &wifiSsid,
                                   bool timeSynced,
                                   const char *versionText, uint32_t buildNumber,
                                   const String &uptimeText) const;
  String buildWifiRestoredMessage_(const String &ipAddress, int wifiRssiDbm,
                                   uint8_t wifiSignalPercent, const String &wifiSsid,
                                   bool timeSynced,
                                   const char *versionText, uint32_t buildNumber,
                                   const String &uptimeText, unsigned long downtimeMs) const;
  String buildControllerStatusMessage_(
      const ControllerLinkService &controllerLink, uint32_t nowMs,
      int wifiRssiDbm, uint8_t wifiSignalPercent, const String &wifiSsid,
      const char *refreshState) const;
  String buildBsStatusMessage_(const BsStatusView &status,
                               const ControllerLinkService &controllerLink) const;
  String buildHelpMessage_() const;
  static String htmlEscape_(const String &value);
  static String urlEncode_(const String &value);
  static String formatDowntimeText_(unsigned long downtimeMs);

  bool configured_ = false;
  bool onlineSentThisBoot_ = false;
  bool wifiWasConnected_ = false;
  bool restorePending_ = false;
  bool controllerStatusSentThisBoot_ = false;
  bool commandPreferencesReady_ = false;
  bool c3StatusReplyPending_ = false;
  bool c3RefreshCommandPending_ = false;
  bool c3HadTelemetryAtRequest_ = false;
  bool c3WakeReplyPending_ = false;
  ControllerWakeRequestResult c3WakeReplyResult_ =
      ControllerWakeRequestResult::Unavailable;
  bool bsStatusReplyPending_ = false;
  bool helpReplyPending_ = false;
  enum class DbCalibrationReply : uint8_t {
    None,
    Started,
    AlreadyActive,
    Status,
    Stopped,
    NotActive,
    ClockUnavailable,
    StorageError,
    Completed,
    WriteError,
  };
  DbCalibrationReply dbCalibrationReply_ = DbCalibrationReply::None;
  bool dbCalibrationReplyPending_ = false;
  unsigned long wifiConnectedSinceMs_ = 0;
  unsigned long wifiLostAtMs_ = 0;
  unsigned long restoreDowntimeMs_ = 0;
  unsigned long lastAttemptAtMs_ = 0;
  unsigned long lastControllerAttemptAtMs_ = 0;
  unsigned long lastCommandPollAtMs_ = 0;
  unsigned long lastSuccessfulSendAtMs_ = 0;
  unsigned long c3StatusReplyQueuedAtMs_ = 0;
  uint32_t c3TelemetryReceivedAtRequestMs_ = 0;
  unsigned long c3WakeReplyQueuedAtMs_ = 0;
  unsigned long bsStatusReplyQueuedAtMs_ = 0;
  unsigned long helpReplyQueuedAtMs_ = 0;
  unsigned long dbCalibrationReplyQueuedAtMs_ = 0;
  unsigned long lastStatusReplyAttemptAtMs_ = 0;
  uint32_t lastCommandUpdateId_ = 0;
  Preferences commandPreferences_;
};
