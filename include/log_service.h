#pragma once

#include <Arduino.h>

#include "google_sheets_service.h"

struct DiagnosticRecord {
  String event;
  String info;
  bool hasPowerContext = false;
  uint32_t powerUptimeMinutes = 0;
  uint32_t bootSequence = 0;
  String resetReason;
  String timeState;
  bool hasWifi = false;
  String wifiState;
  String wifiSsid;
  int16_t wifiSignalPercent = 0;
  int16_t wifiRssiDbm = -127;
  String wifiIp;
  String wqttState;
  bool hasDatacakeCounters = false;
  uint32_t datacakeOkCount = 0;
  uint32_t datacakeFailureCount = 0;
  String uartState;
  bool hasC3 = false;
  uint32_t c3Build = 0;
  uint32_t c3Session = 0;
  uint32_t c3Sequence = 0;
  uint32_t c3AgeSeconds = 0;
  bool hasC3Counters = false;
  uint32_t c3AcceptedCount = 0;
  uint32_t c3DuplicateCount = 0;
  uint32_t c3GapCount = 0;
  uint32_t c3OfflineCount = 0;
  String inaState;
  int32_t solarMillivolts = 0;
  int32_t solarMilliamps = 0;
  int32_t batteryMillivolts = 0;
  int32_t batteryMilliamps = 0;
  uint8_t batterySocPercent = 0;
  int32_t loadMillivolts = 0;
  int32_t loadMilliamps = 0;
  String chargeState;
  String controlMode;
  bool hasSound = false;
  uint32_t soundNow = 0;
  uint32_t soundHour = 0;
  uint32_t soundTotal = 0;
  uint32_t soundPeakToPeak = 0;
  String soundSignal;
  bool hasEnvironment = false;
  float temperatureC = NAN;
  float humidityPct = NAN;
  bool hasHeap = false;
  uint32_t freeHeap = 0;
  uint32_t minFreeHeap = 0;
  bool hasGoogleSheetsCounters = false;
  uint8_t googleSheetsQueue = 0;
  uint32_t googleSheetsOkCount = 0;
  uint32_t googleSheetsFailureCount = 0;
  uint32_t googleSheetsDropCount = 0;
};

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
  void appendDiagnosticRecord(const DiagnosticRecord &record);

  bool isReady() const;
  bool webServerStarted() const;

 private:
  bool ready_ = false;
  bool serverStarted_ = false;
  bool lastWifiConnected_ = false;
  String lastIpAddress_;
  String lastWindowKey_;
};
