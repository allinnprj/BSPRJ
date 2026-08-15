#pragma once

#include <Arduino.h>
#include <Preferences.h>

#include "controller_link_service.h"

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
                      const ControllerLinkService &controllerLink);

  bool isConfigured() const;

 private:
  static constexpr unsigned long kOnlineWarmupMs = 20000UL;
  static constexpr unsigned long kRetryIntervalMs = 30000UL;
  static constexpr unsigned long kRestoreThresholdMs = 90000UL;
  static constexpr unsigned long kRestoreWarmupMs = 10000UL;
  static constexpr unsigned long kCommandPollIntervalMs = 60000UL;
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
                             uint8_t wifiSignalPercent, const String &wifiSsid);
  bool pollCommands_(const ControllerLinkService &controllerLink);
  void processCommandUpdates_(const String &response,
                              const ControllerLinkService &controllerLink);
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
      int wifiRssiDbm, uint8_t wifiSignalPercent, const String &wifiSsid) const;
  static String htmlEscape_(const String &value);
  static String urlEncode_(const String &value);
  static String formatDowntimeText_(unsigned long downtimeMs);

  bool configured_ = false;
  bool onlineSentThisBoot_ = false;
  bool wifiWasConnected_ = false;
  bool restorePending_ = false;
  bool controllerStatusSentThisBoot_ = false;
  bool commandPreferencesReady_ = false;
  bool statusReplyPending_ = false;
  unsigned long wifiConnectedSinceMs_ = 0;
  unsigned long wifiLostAtMs_ = 0;
  unsigned long restoreDowntimeMs_ = 0;
  unsigned long lastAttemptAtMs_ = 0;
  unsigned long lastControllerAttemptAtMs_ = 0;
  unsigned long lastCommandPollAtMs_ = 0;
  unsigned long lastSuccessfulSendAtMs_ = 0;
  unsigned long statusReplyQueuedAtMs_ = 0;
  unsigned long lastStatusReplyAttemptAtMs_ = 0;
  uint32_t lastCommandUpdateId_ = 0;
  Preferences commandPreferences_;
};
