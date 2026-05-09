#include "log_service.h"

#include <LittleFS.h>
#include <WebServer.h>

namespace {

constexpr char kLogPath[] = "/sound_log.csv";
WebServer logServer(80);

void ensureHeader() {
  if (LittleFS.exists(kLogPath)) {
    return;
  }

  File file = LittleFS.open(kLogPath, FILE_WRITE);
  if (!file) {
    Serial.println(F("[LOG] failed to create log file"));
    return;
  }

  file.println(F("date,time,part,now_pct,hour_pct,total_pct,raw_min,raw_max,peak_to_peak,signal,part_avg,quiet_count,loud_count"));
  file.close();
}

void handleRoot() {
  String body;
  body += F("ESP32 sound log ready\n");
  body += F("Download: /log.csv\n");
  logServer.send(200, "text/plain", body);
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

void LogService::appendMinuteSample(const String &minuteKey, const String &dateText,
                                    const String &timeText, const char *dayPart,
                                    const AudioSnapshot &snapshot, uint32_t partAverage,
                                    uint32_t quietCount, uint32_t loudCount) {
  if (!ready_ || minuteKey.isEmpty() || minuteKey == lastMinuteKey_) {
    return;
  }

  File file = LittleFS.open(kLogPath, FILE_APPEND);
  if (!file) {
    Serial.println(F("[LOG] append failed"));
    return;
  }

  file.print(dateText);
  file.print(',');
  file.print(timeText);
  file.print(',');
  file.print(dayPart);
  file.print(',');
  file.print(snapshot.currentPercent);
  file.print(',');
  file.print(snapshot.hourPercent);
  file.print(',');
  file.print(snapshot.totalPercent);
  file.print(',');
  file.print(snapshot.rawMin);
  file.print(',');
  file.print(snapshot.rawMax);
  file.print(',');
  file.print(snapshot.peakToPeak);
  file.print(',');
  file.print(signalStateText(snapshot.signalState));
  file.print(',');
  file.print(partAverage);
  file.print(',');
  file.print(quietCount);
  file.print(',');
  file.println(loudCount);
  file.close();

  lastMinuteKey_ = minuteKey;
}

bool LogService::isReady() const {
  return ready_;
}

bool LogService::webServerStarted() const {
  return serverStarted_;
}
