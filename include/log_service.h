#pragma once

#include <Arduino.h>

#include "google_sheets_service.h"

class LogService {
 public:
  void begin();
  void update(bool wifiConnected, const String &ipAddress);
  void appendWindowAggregate(const GoogleSheetsWindowRecord &record, const char *versionText,
                             uint32_t buildNumber, int32_t wifiRssiDbm,
                             const char *powerTargetText);

  bool isReady() const;
  bool webServerStarted() const;

 private:
  bool ready_ = false;
  bool serverStarted_ = false;
  bool lastWifiConnected_ = false;
  String lastIpAddress_;
  String lastWindowKey_;
};
