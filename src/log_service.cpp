#include "log_service.h"

#include <LittleFS.h>
#include <WebServer.h>

namespace {

constexpr char kLogPath[] = "/sound_log.csv";
constexpr char kLegacyLogPath[] = "/sound_log_legacy.csv";
constexpr char kLogHeader[] =
    "event,date,time_from,time_to,part,build,boot_seq,reset_reason,uptime_min,uptime_text,"
    "now_avg_pct,hour_pct,total_pct,p2p_avg,p2p_min,p2p_max,p2p_stable_max,"
    "session_p2p_min,session_p2p_max,session_p2p_stable_max,raw_min,raw_max,signal,"
    "temp_c,hum_pct,env_ok_count,env_fail_count,samples,quiet_count,loud_count,wifi_dbm";
WebServer logServer(80);
bool logClearedByWeb = false;

bool createFreshLogFile() {
  File file = LittleFS.open(kLogPath, FILE_WRITE);
  if (!file) {
    Serial.println(F("[LOG] failed to create log file"));
    return false;
  }

  file.println(kLogHeader);
  file.close();
  return true;
}

void ensureHeader() {
  if (LittleFS.exists(kLogPath)) {
    File existing = LittleFS.open(kLogPath, FILE_READ);
    String currentHeader = existing ? existing.readStringUntil('\n') : String();
    if (existing) {
      existing.close();
    }
    currentHeader.trim();
    if (currentHeader == kLogHeader) {
      return;
    }

    if (LittleFS.exists(kLegacyLogPath)) {
      LittleFS.remove(kLegacyLogPath);
    }
    if (LittleFS.rename(kLogPath, kLegacyLogPath)) {
      Serial.println(F("[LOG] old CSV format moved -> /sound_log_legacy.csv"));
    } else {
      LittleFS.remove(kLogPath);
      Serial.println(F("[LOG] old CSV format removed -> new compact log"));
    }
  }

  createFreshLogFile();
}

void handleRoot() {
  String body;
  body.reserve(360);
  body += F("<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">");
  body += F("<title>BS Noise Log</title></head><body>");
  body += F("<h3>BS Noise Log</h3>");
  body += F("<p><a href=\"/log.csv\" download>Download log.csv</a></p>");
  body += F("<p><a href=\"/clear-log\">Clear log</a></p>");
  body += F("</body></html>");
  logServer.send(200, "text/html", body);
}

void handleClearLogConfirm() {
  String body;
  body.reserve(420);
  body += F("<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">");
  body += F("<title>Clear BS Noise Log</title></head><body>");
  body += F("<h3>Clear current log?</h3>");
  body += F("<p>This clears only the current compact log.csv. Legacy log is not touched.</p>");
  body += F("<p><a href=\"/clear-log-confirm\">Confirm clear</a></p>");
  body += F("<p><a href=\"/\">Cancel</a></p>");
  body += F("</body></html>");
  logServer.send(200, "text/html", body);
}

void handleClearLogAction() {
  if (LittleFS.exists(kLogPath)) {
    LittleFS.remove(kLogPath);
  }
  if (!createFreshLogFile()) {
    logServer.send(500, "text/plain", "failed to clear log\n");
    return;
  }
  logClearedByWeb = true;

  Serial.println(F("[LOG] current log cleared from web UI"));
  String body;
  body.reserve(260);
  body += F("<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">");
  body += F("<title>BS Noise Log Cleared</title></head><body>");
  body += F("<h3>Current log cleared.</h3>");
  body += F("<p><a href=\"/log.csv\" download>Download new log.csv</a></p>");
  body += F("<p><a href=\"/\">Back</a></p>");
  body += F("</body></html>");
  logServer.send(200, "text/html", body);
}

void handleLogDownload() {
  if (!LittleFS.exists(kLogPath)) {
    logServer.send(404, "text/plain", "log file not found\n");
    return;
  }

  File file = LittleFS.open(kLogPath, FILE_READ);
  if (!file) {
    logServer.send(500, "text/plain", "failed to open log\n");
    return;
  }

  logServer.streamFile(file, "text/csv");
  file.close();
}

}  // namespace

void LogService::begin() {
  ready_ = LittleFS.begin(true);
  if (!ready_) {
    Serial.println(F("[LOG] LittleFS mount failed"));
    return;
  }

  ensureHeader();
  Serial.println(F("[LOG] LittleFS ready -> /sound_log.csv"));
}

void LogService::update(bool wifiConnected, const String &ipAddress) {
  if (!ready_) {
    return;
  }

  if (wifiConnected && (!serverStarted_ || ipAddress != lastIpAddress_)) {
    logServer.on("/", handleRoot);
    logServer.on("/log.csv", HTTP_GET, handleLogDownload);
    logServer.on("/clear-log", HTTP_GET, handleClearLogConfirm);
    logServer.on("/clear-log-confirm", HTTP_GET, handleClearLogAction);
    logServer.begin();
    serverStarted_ = true;
    lastIpAddress_ = ipAddress;
    Serial.print(F("[LOG] web download ready -> http://"));
    Serial.print(lastIpAddress_);
    Serial.println(F("/log.csv"));
  }

  if (!wifiConnected && lastWifiConnected_) {
    Serial.println(F("[LOG] web access paused -> WiFi disconnected"));
  }

  if (serverStarted_) {
    logServer.handleClient();
  }
  if (logClearedByWeb) {
    lastWindowKey_ = String();
    logClearedByWeb = false;
  }

  lastWifiConnected_ = wifiConnected;
}

void LogService::clearCurrentLog() {
  if (!ready_) {
    return;
  }

  if (LittleFS.exists(kLogPath)) {
    LittleFS.remove(kLogPath);
  }
  if (createFreshLogFile()) {
    lastWindowKey_ = String();
  }
}

void LogService::appendWindowAggregate(const GoogleSheetsWindowRecord &record,
                                       uint32_t buildNumber, int32_t wifiRssiDbm) {
  if (!ready_ || record.windowKey.isEmpty() || record.sampleCount == 0 ||
      record.windowKey == lastWindowKey_) {
    return;
  }

  File file = LittleFS.open(kLogPath, FILE_APPEND);
  if (!file) {
    Serial.println(F("[LOG] append failed"));
    return;
  }

  file.print(F("WINDOW"));
  file.print(',');
  file.print(record.dateText);
  file.print(',');
  file.print(record.timeFromText);
  file.print(',');
  file.print(record.timeToText);
  file.print(',');
  file.print(record.dayPartText);
  file.print(',');
  file.print(buildNumber);
  file.print(',');
  file.print(record.bootSequence);
  file.print(',');
  file.print(record.resetReason);
  file.print(',');
  file.print(record.uptimeMinutes);
  file.print(',');
  file.print(record.uptimeText);
  file.print(',');
  file.print(record.averageNowPercent);
  file.print(',');
  file.print(record.averageHourPercent);
  file.print(',');
  file.print(record.averageTotalPercent);
  file.print(',');
  file.print(record.averagePeakToPeak);
  file.print(',');
  file.print(record.minPeakToPeak);
  file.print(',');
  file.print(record.maxPeakToPeak);
  file.print(',');
  file.print(record.stableMaxPeakToPeak);
  file.print(',');
  file.print(record.sessionMinPeakToPeak);
  file.print(',');
  file.print(record.sessionMaxPeakToPeak);
  file.print(',');
  file.print(record.sessionStableMaxPeakToPeak);
  file.print(',');
  file.print(record.minRaw);
  file.print(',');
  file.print(record.maxRaw);
  file.print(',');
  file.print(record.signalText);
  file.print(',');
  if (record.environmentAvailable) {
    file.print(record.averageTemperatureC, 1);
  }
  file.print(',');
  if (record.environmentAvailable) {
    file.print(record.averageHumidityPct, 2);
  }
  file.print(',');
  file.print(record.environmentOkCount);
  file.print(',');
  file.print(record.environmentFailCount);
  file.print(',');
  file.print(record.sampleCount);
  file.print(',');
  file.print(record.quietCount);
  file.print(',');
  file.print(record.loudCount);
  file.print(',');
  file.println(wifiRssiDbm);
  file.close();

  lastWindowKey_ = record.windowKey;
}

void LogService::appendRuntimeEvent(const String &eventText, const String &dateText,
                                    const String &timeText, uint32_t buildNumber,
                                    uint32_t bootSequence, const String &resetReason,
                                    uint32_t uptimeMinutes, const String &uptimeText,
                                    int32_t wifiRssiDbm) {
  if (!ready_ || eventText.isEmpty()) {
    return;
  }

  File file = LittleFS.open(kLogPath, FILE_APPEND);
  if (!file) {
    Serial.println(F("[LOG] event append failed"));
    return;
  }

  file.print(eventText);
  file.print(',');
  file.print(dateText);
  file.print(',');
  file.print(timeText);
  file.print(',');
  file.print(timeText);
  file.print(',');
  file.print(F("SYS"));
  file.print(',');
  file.print(buildNumber);
  file.print(',');
  file.print(bootSequence);
  file.print(',');
  file.print(resetReason);
  file.print(',');
  file.print(uptimeMinutes);
  file.print(',');
  file.print(uptimeText);
  for (uint8_t index = 0; index < 20; ++index) {
    file.print(',');
  }
  file.println(wifiRssiDbm);
  file.close();
}

bool LogService::isReady() const {
  return ready_;
}

bool LogService::webServerStarted() const {
  return serverStarted_;
}
