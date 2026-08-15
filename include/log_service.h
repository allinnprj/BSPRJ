#pragma once

#include <Arduino.h>

#include "google_sheets_service.h"

class LogService {
 public:
  void begin();
  void update(bool wifiConnected, const String &ipAddress);
  void setClock(const String &dateText, const String &timeText);
  void clearCurrentLog();
  void appendWindowAggregate(const GoogleSheetsWindowRecord &record, uint32_t buildNumber,
                             int32_t wifiRssiDbm);
  void appendRuntimeEvent(const String &eventText, const String &dateText, const String &timeText,
                          uint32_t buildNumber, uint32_t bootSequence,
                          const String &resetReason, uint32_t uptimeMinutes,
                          const String &uptimeText, int32_t wifiRssiDbm);
  void appendDiagnosticEvent(const String &eventText, const String &details);

  bool isReady() const;
  bool webServerStarted() const;

 private:
  bool ready_ = false;
  bool serverStarted_ = false;
  bool lastWifiConnected_ = false;
  String lastIpAddress_;
  String lastWindowKey_;
};
