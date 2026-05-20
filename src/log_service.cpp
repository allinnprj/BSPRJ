#include "log_service.h"

#include <LittleFS.h>
#include <WebServer.h>

namespace {

constexpr char kLogPath[] = "/sound_log.csv";
constexpr char kLegacyLogPath[] = "/sound_log_legacy.csv";
constexpr char kLogHeader[] =
    "date,time_from,time_to,part,ver,build,now_avg_pct,hour_pct,total_pct,"
    "p2p_avg,p2p_min,p2p_max,session_p2p_min,session_p2p_max,raw_min,raw_max,"
    "signal,temp_c,hum_pct,samples,quiet_count,loud_count,wifi_dbm,power_target,"
    "uptime_min";
WebServer logServer(80);

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

  File file = LittleFS.open(kLogPath, FILE_WRITE);
  if (!file) {
    Serial.println(F("[LOG] failed to create log file"));
    return;
  }

  file.println(kLogHeader);
  file.close();
}

void handleRoot() {
  String body;
  body.reserve(220);
  body += F("<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">");
  body += F("<title>BS Noise Log</title></head><body>");
  body += F("<h3>BS Noise Log</h3>");
  body += F("<p><a href=\"/log.csv\" download>Download log.csv</a></p>");
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

const char *signalStateText(SignalState state) {
  switch (state) {
    case SignalState::Clip:
      return "CLIP";
    case SignalState::Ok:
      return "OK";
    case SignalState::Low:
    default:
      return "LOW";
  }
}

String signalQualityText(const AudioSnapshot &snapshot) {
  if (snapshot.clipSignalWarning) {
    return String(F("CLIP_HOLD"));
  }
  if (snapshot.lowSignalWarning) {
    return String(F("LOW_HOLD"));
  }
  return String(signalStateText(snapshot.signalState));
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

  lastWifiConnected_ = wifiConnected;
}

void LogService::appendWindowAggregate(const GoogleSheetsWindowRecord &record,
                                       const char *versionText, uint32_t buildNumber,
                                       int32_t wifiRssiDbm,
                                       const char *powerTargetText) {
  if (!ready_ || record.windowKey.isEmpty() || record.sampleCount == 0 ||
      record.windowKey == lastWindowKey_) {
    return;
  }

  File file = LittleFS.open(kLogPath, FILE_APPEND);
  if (!file) {
    Serial.println(F("[LOG] append failed"));
    return;
  }

  file.print(record.dateText);
  file.print(',');
  file.print(record.timeFromText);
  file.print(',');
  file.print(record.timeToText);
  file.print(',');
  file.print(record.dayPartText);
  file.print(',');
  file.print(versionText);
  file.print(',');
  file.print(buildNumber);
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
  file.print(record.sessionMinPeakToPeak);
  file.print(',');
  file.print(record.sessionMaxPeakToPeak);
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
  file.print(record.sampleCount);
  file.print(',');
  file.print(record.quietCount);
  file.print(',');
  file.print(record.loudCount);
  file.print(',');
  file.print(wifiRssiDbm);
  file.print(',');
  file.print(powerTargetText);
  file.print(',');
  file.println(record.uptimeMinutes);
  file.close();

  lastWindowKey_ = record.windowKey;
}

bool LogService::isReady() const {
  return ready_;
}

bool LogService::webServerStarted() const {
  return serverStarted_;
}
