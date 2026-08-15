#include "log_service.h"

#include <LittleFS.h>
#include <WebServer.h>

#include "project_version.h"

namespace {

constexpr char kLogPath[] = "/sound_log.csv";
constexpr char kLegacyLogPath[] = "/sound_log_legacy.csv";
constexpr char kDiagnosticLogPath[] = "/diagnostics.log";
constexpr char kPreviousDiagnosticLogPath[] = "/diagnostics-prev.log";
constexpr size_t kDiagnosticLogMaxBytes = 128U * 1024U;
constexpr char kLogHeader[] =
    "event,date,time_from,time_to,part,build,boot_seq,reset_reason,uptime_min,uptime_text,"
    "now_avg_pct,hour_pct,total_pct,p2p_avg,p2p_p95,p2p_min,p2p_max,p2p_stable_max,"
    "session_p2p_min,session_p2p_max,session_p2p_stable_max,raw_min,raw_max,signal,"
    "temp_c,hum_pct,env_ok_count,env_fail_count,samples,quiet_count,loud_count,"
    "free_heap,min_free_heap,wifi_dbm,acoustic_rev";
constexpr char kDiagnosticLogHeader[] = "date\ttime\tuptime_s\tbuild\tevent\tdetails";
WebServer logServer(80);
bool logClearedByWeb = false;
String currentDateText;
String currentTimeText;

String pageStart(const String &title) {
  String body;
  body.reserve(600);
  body += F("<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">");
  body += F("<title>");
  body += title;
  body += F("</title><style>");
  body += F("body{margin:0;padding:22px;font-family:Arial,sans-serif;background:#111827;color:#e5e7eb;line-height:1.45}");
  body += F("main{max-width:760px;margin:0 auto;background:#172033;border:1px solid #2f3b52;border-radius:18px;padding:22px;box-shadow:0 18px 50px #0007}");
  body += F("h3,h4{margin:0 0 14px;color:#f8fafc}p{color:#cbd5e1}.btn,a{color:#93c5fd}.btn{display:inline-block;margin:6px 8px 6px 0;padding:10px 14px;border-radius:12px;background:#1d4ed8;text-decoration:none;color:white;font-weight:700}");
  body += F(".danger{background:#b91c1c}.ghost{background:#334155}.list{padding-left:18px}.muted{color:#94a3b8}.ok{color:#86efac}");
  body += F("</style></head><body><main>");
  return body;
}

void pageEnd(String &body) {
  body += F("</main></body></html>");
}

String compactDateTimeForFile() {
  if (currentDateText.length() >= 10 && currentTimeText.length() >= 5) {
    String date = currentDateText;
    String time = currentTimeText;
    date.replace("-", "");
    time.replace(":", "");
    if (date.length() == 8 && time.length() >= 4) {
      return date.substring(6, 8) + date.substring(4, 6) + date.substring(0, 4) +
             F("_") + time.substring(0, 4);
    }
  }
  return String(F("uptime_")) + String(millis());
}

String archivePathFromMillis() {
  return String(F("/")) + compactDateTimeForFile() + F(".csv");
}

bool isCompactArchivePath(const String &path) {
  if (!path.startsWith("/") || !path.endsWith(F(".csv")) || path.length() < 18) {
    return false;
  }
  if (path.charAt(9) != '_') {
    return false;
  }
  for (uint8_t index = 1; index <= 8; ++index) {
    if (!isDigit(path.charAt(index))) {
      return false;
    }
  }
  for (uint8_t index = 10; index <= 13; ++index) {
    if (!isDigit(path.charAt(index))) {
      return false;
    }
  }
  if (path.length() == 18) {
    return true;
  }
  if (path.charAt(14) != '_') {
    return false;
  }
  for (uint8_t index = 15; index < path.length() - 4; ++index) {
    if (!isDigit(path.charAt(index))) {
      return false;
    }
  }
  return true;
}

bool isDownloadableLogPath(const String &path) {
  return path == kLegacyLogPath || isCompactArchivePath(path) ||
         (path.startsWith(F("/sound_log_archive_")) && path.endsWith(F(".csv")));
}

String uniqueArchivePath() {
  String base = compactDateTimeForFile();
  String path = String(F("/")) + base + F(".csv");
  uint8_t suffix = 2;
  while (LittleFS.exists(path) && suffix < 100) {
    path = String(F("/")) + base + F("_") + String(suffix) + F(".csv");
    suffix++;
  }
  return path;
}

String fileNameFromPath(const String &path) {
  int slashIndex = path.lastIndexOf('/');
  return slashIndex >= 0 ? path.substring(slashIndex + 1) : path;
}

String displayNameForLogPath(const String &path) {
  String fileName = fileNameFromPath(path);
  if (isCompactArchivePath(path)) {
    String day = fileName.substring(0, 2);
    String month = fileName.substring(2, 4);
    String year = fileName.substring(4, 8);
    String hour = fileName.substring(9, 11);
    String minute = fileName.substring(11, 13);
    String suffix;
    int dotIndex = fileName.lastIndexOf('.');
    if (dotIndex > 13) {
      suffix = fileName.substring(13, dotIndex);
    }
    return day + F(".") + month + F(".") + year + F(" ") + hour + F(":") + minute + suffix;
  }
  if (fileName == F("sound_log_legacy.csv")) {
    return F("Legacy log: sound_log_legacy.csv");
  }
  return String(F("Legacy archive: ")) + fileName;
}

String formatBytes(size_t byteCount) {
  if (byteCount >= 1024) {
    const size_t wholeKb = byteCount / 1024;
    const size_t decimalKb = (byteCount % 1024) * 10 / 1024;
    return String(wholeKb) + F(".") + String(decimalKb) + F(" KB");
  }
  return String(byteCount) + F(" B");
}

size_t fileSizeForPath(const String &path) {
  if (!LittleFS.exists(path)) {
    return 0;
  }

  File file = LittleFS.open(path, FILE_READ);
  if (!file) {
    return 0;
  }
  const size_t fileSize = file.size();
  file.close();
  return fileSize;
}

struct LogStorageStats {
  size_t totalBytes = 0;
  size_t usedBytes = 0;
  size_t activeLogBytes = 0;
  size_t archivedLogBytes = 0;
  size_t diagnosticLogBytes = 0;
  uint16_t archivedLogCount = 0;
  uint8_t diagnosticLogCount = 0;
};

LogStorageStats collectLogStorageStats() {
  LogStorageStats stats;
  stats.totalBytes = LittleFS.totalBytes();
  stats.usedBytes = LittleFS.usedBytes();
  stats.activeLogBytes = fileSizeForPath(kLogPath);
  stats.diagnosticLogBytes = fileSizeForPath(kDiagnosticLogPath) +
                             fileSizeForPath(kPreviousDiagnosticLogPath);
  stats.diagnosticLogCount = (LittleFS.exists(kDiagnosticLogPath) ? 1 : 0) +
                             (LittleFS.exists(kPreviousDiagnosticLogPath) ? 1 : 0);

  File root = LittleFS.open("/");
  File file = root.openNextFile();
  while (file) {
    String path = file.name();
    if (!path.startsWith("/")) {
      path = String("/") + path;
    }
    if (isDownloadableLogPath(path)) {
      stats.archivedLogBytes += file.size();
      stats.archivedLogCount++;
    }
    file = root.openNextFile();
  }
  return stats;
}

void appendStorageSummary(String &body) {
  const LogStorageStats stats = collectLogStorageStats();
  const size_t freeBytes = stats.totalBytes > stats.usedBytes
                               ? stats.totalBytes - stats.usedBytes
                               : 0;
  body += F("<h4>Storage</h4><p class=\"muted\">LittleFS: ");
  body += formatBytes(stats.usedBytes);
  body += F(" used / ");
  body += formatBytes(stats.totalBytes);
  body += F(" total / ");
  body += formatBytes(freeBytes);
  body += F(" free<br>Active log: ");
  body += formatBytes(stats.activeLogBytes);
  body += F("<br>Archived logs: ");
  body += String(stats.archivedLogCount);
  body += F(" files, ");
  body += formatBytes(stats.archivedLogBytes);
  body += F("<br>Diagnostic logs: ");
  body += String(stats.diagnosticLogCount);
  body += F(" files, ");
  body += formatBytes(stats.diagnosticLogBytes);
  body += F("</p>");
}

void sendCsvDownloadHeader(const String &fileName) {
  logServer.sendHeader(F("Content-Disposition"),
                       String(F("attachment; filename=\"")) + fileName + F("\""));
  logServer.sendHeader(F("Cache-Control"), F("no-store"));
}

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

bool createFreshDiagnosticLogFile() {
  File file = LittleFS.open(kDiagnosticLogPath, FILE_WRITE);
  if (!file) {
    Serial.println(F("[DLOG] failed to create diagnostic log"));
    return false;
  }
  file.println(kDiagnosticLogHeader);
  file.close();
  return true;
}

void ensureDiagnosticLog() {
  if (!LittleFS.exists(kDiagnosticLogPath)) {
    createFreshDiagnosticLogFile();
    return;
  }

  File existing = LittleFS.open(kDiagnosticLogPath, FILE_READ);
  String header = existing ? existing.readStringUntil('\n') : String();
  if (existing) {
    existing.close();
  }
  header.trim();
  if (header != kDiagnosticLogHeader) {
    LittleFS.remove(kDiagnosticLogPath);
    createFreshDiagnosticLogFile();
  }
}

String sanitizeDiagnosticField(String value) {
  value.replace('\t', ' ');
  value.replace('\r', ' ');
  value.replace('\n', ' ');
  return value;
}

bool rotateDiagnosticLogIfNeeded(size_t incomingBytes) {
  if (fileSizeForPath(kDiagnosticLogPath) + incomingBytes <= kDiagnosticLogMaxBytes) {
    return true;
  }
  if (LittleFS.exists(kPreviousDiagnosticLogPath)) {
    LittleFS.remove(kPreviousDiagnosticLogPath);
  }
  if (LittleFS.exists(kDiagnosticLogPath) &&
      !LittleFS.rename(kDiagnosticLogPath, kPreviousDiagnosticLogPath)) {
    Serial.println(F("[DLOG] rotation failed"));
    return false;
  }
  Serial.println(F("[DLOG] rotated -> /diagnostics-prev.log"));
  return createFreshDiagnosticLogFile();
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
  String body = pageStart(F("BS Noise Log"));
  body += F("<h3>BS Noise Log</h3>");
  body += F("<p class=\"muted\">Active log: <b>/log.csv</b></p>");
  appendStorageSummary(body);
  body += F("<p><a class=\"btn\" href=\"/log.csv\" download>Download active log</a>");
  body += F("<a class=\"btn\" href=\"/diagnostics.log\" download>Download diagnostics</a>");
  if (LittleFS.exists(kPreviousDiagnosticLogPath)) {
    body += F("<a class=\"btn ghost\" href=\"/diagnostics-prev.log\" download>Download previous diagnostics</a>");
  }
  body += F("<a class=\"btn ghost\" href=\"/archive-log\">Archive current log</a>");
  body += F("<a class=\"btn danger\" href=\"/clear-log\">Clear log</a>");
  body += F("<a class=\"btn danger\" href=\"/clear-all-logs\">Clear ALL logs</a></p>");
  body += F("<h4>Archived logs</h4><ul>");
  File root = LittleFS.open("/");
  File file = root.openNextFile();
  bool foundArchive = false;
  while (file) {
    String path = file.name();
    if (!path.startsWith("/")) {
      path = String("/") + path;
    }
    if (isDownloadableLogPath(path)) {
      foundArchive = true;
      String url = String(F("/download-archive?file=")) + path;
      body += F("<li class=\"list\"><a href=\"");
      body += url;
      body += F("\" download>");
      body += displayNameForLogPath(path);
      body += F("</a>");
      body += F(" <span class=\"muted\">");
      body += formatBytes(file.size());
      body += F("</span></li>");
    }
    file = root.openNextFile();
  }
  if (!foundArchive) {
    body += F("<li class=\"muted\">No archived logs yet.</li>");
  }
  body += F("</ul>");
  pageEnd(body);
  logServer.send(200, "text/html", body);
}

void handleArchiveLogConfirm() {
  String body = pageStart(F("Archive BS Noise Log"));
  body += F("<h3>Archive current log?</h3>");
  body += F("<p>This renames the current log.csv to a dated archive file and starts a new active log.</p>");
  body += F("<p><a class=\"btn\" href=\"/archive-log-confirm\">Confirm archive</a>");
  body += F("<a class=\"btn ghost\" href=\"/\">Cancel</a></p>");
  pageEnd(body);
  logServer.send(200, "text/html", body);
}

void handleArchiveLogAction() {
  if (!LittleFS.exists(kLogPath)) {
    if (!createFreshLogFile()) {
      logServer.send(500, "text/plain", "failed to create log\n");
      return;
    }
    logClearedByWeb = true;
    logServer.send(200, "text/plain", "no existing log; new active log created\n");
    return;
  }

  String archivePath = uniqueArchivePath();
  if (!LittleFS.rename(kLogPath, archivePath)) {
    logServer.send(500, "text/plain", "failed to archive log\n");
    return;
  }
  if (!createFreshLogFile()) {
    logServer.send(500, "text/plain", "archived, but failed to create new log\n");
    return;
  }
  logClearedByWeb = true;

  Serial.print(F("[LOG] current log archived -> "));
  Serial.println(archivePath);
  String body = pageStart(F("BS Noise Log Archived"));
  body += F("<h3 class=\"ok\">Current log archived.</h3>");
  body += F("<p>Archive: ");
  body += displayNameForLogPath(archivePath);
  body += F("<br><span class=\"muted\">File: ");
  body += fileNameFromPath(archivePath);
  body += F("</span>");
  body += F("</p>");
  body += F("<p><a class=\"btn\" href=\"/download-archive?file=");
  body += archivePath;
  body += F("\" download>Download archived log</a></p>");
  body += F("<p><a class=\"btn ghost\" href=\"/log.csv\" download>Download new active log</a>");
  body += F("<a class=\"btn ghost\" href=\"/\">Back</a></p>");
  pageEnd(body);
  logServer.send(200, "text/html", body);
}

void handleClearLogConfirm() {
  String body = pageStart(F("Clear BS Noise Log"));
  body += F("<h3>Clear current log?</h3>");
  body += F("<p>This clears only the current compact log.csv. Legacy log is not touched.</p>");
  body += F("<p><a class=\"btn danger\" href=\"/clear-log-confirm\">Confirm clear</a>");
  body += F("<a class=\"btn ghost\" href=\"/\">Cancel</a></p>");
  pageEnd(body);
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
  String body = pageStart(F("BS Noise Log Cleared"));
  body += F("<h3 class=\"ok\">Current log cleared.</h3>");
  body += F("<p><a class=\"btn ghost\" href=\"/log.csv\" download>Download new log.csv</a>");
  body += F("<a class=\"btn ghost\" href=\"/\">Back</a></p>");
  pageEnd(body);
  logServer.send(200, "text/html", body);
}

void handleClearAllLogsConfirm() {
  const LogStorageStats stats = collectLogStorageStats();
  String body = pageStart(F("Clear ALL BS Noise Logs"));
  body += F("<h3>Clear ALL logs?</h3>");
  body += F("<p>This deletes the active log, all archived logs, the legacy log, and diagnostic logs from LittleFS. ");
  body += F("Google Sheets data is not touched.</p>");
  body += F("<p class=\"muted\">Will remove approximately ");
  body += formatBytes(stats.activeLogBytes + stats.archivedLogBytes + stats.diagnosticLogBytes);
  body += F(" from ");
  body += String(stats.archivedLogCount + stats.diagnosticLogCount +
                 (stats.activeLogBytes > 0 ? 1 : 0));
  body += F(" local log files.</p>");
  body += F("<p><a class=\"btn danger\" href=\"/clear-all-logs-confirm\">Confirm clear ALL</a>");
  body += F("<a class=\"btn ghost\" href=\"/\">Cancel</a></p>");
  pageEnd(body);
  logServer.send(200, "text/html", body);
}

void handleClearAllLogsAction() {
  uint16_t deletedCount = 0;
  size_t deletedBytes = 0;

  if (LittleFS.exists(kLogPath)) {
    const size_t fileSize = fileSizeForPath(kLogPath);
    if (LittleFS.remove(kLogPath)) {
      deletedBytes += fileSize;
      deletedCount++;
    }
  }

  const char *diagnosticPaths[] = {kDiagnosticLogPath, kPreviousDiagnosticLogPath};
  for (const char *path : diagnosticPaths) {
    if (LittleFS.exists(path)) {
      const size_t fileSize = fileSizeForPath(path);
      if (LittleFS.remove(path)) {
        deletedBytes += fileSize;
        deletedCount++;
      }
    }
  }

  File root = LittleFS.open("/");
  File file = root.openNextFile();
  while (file) {
    String path = file.name();
    if (!path.startsWith("/")) {
      path = String("/") + path;
    }
    const bool shouldDelete = isDownloadableLogPath(path);
    const size_t fileSize = shouldDelete ? file.size() : 0;
    file = root.openNextFile();
    if (shouldDelete && LittleFS.remove(path)) {
      deletedBytes += fileSize;
      deletedCount++;
    }
  }

  if (!createFreshLogFile()) {
    logServer.send(500, "text/plain", "failed to create new log after clear all\n");
    return;
  }
  if (!createFreshDiagnosticLogFile()) {
    logServer.send(500, "text/plain", "failed to create new diagnostic log after clear all\n");
    return;
  }
  logClearedByWeb = true;

  Serial.print(F("[LOG] all local logs cleared from web UI -> files "));
  Serial.println(deletedCount);
  String body = pageStart(F("All BS Noise Logs Cleared"));
  body += F("<h3 class=\"ok\">All local logs cleared.</h3>");
  body += F("<p>Deleted files: ");
  body += String(deletedCount);
  body += F("<br>Deleted size: ");
  body += formatBytes(deletedBytes);
  body += F("</p>");
  body += F("<p><a class=\"btn ghost\" href=\"/log.csv\" download>Download new log.csv</a>");
  body += F("<a class=\"btn ghost\" href=\"/\">Back</a></p>");
  pageEnd(body);
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

  sendCsvDownloadHeader(compactDateTimeForFile() + F(".csv"));
  logServer.streamFile(file, "text/csv");
  file.close();
}

void handleArchiveDownload() {
  String path = logServer.arg("file");
  if (!path.startsWith("/")) {
    path = String("/") + path;
  }
  if (!isDownloadableLogPath(path)) {
    logServer.send(400, "text/plain", "invalid archive path\n");
    return;
  }
  if (!LittleFS.exists(path)) {
    logServer.send(404, "text/plain", "archive not found\n");
    return;
  }

  File file = LittleFS.open(path, FILE_READ);
  if (!file) {
    logServer.send(500, "text/plain", "failed to open archive\n");
    return;
  }

  sendCsvDownloadHeader(fileNameFromPath(path));
  logServer.streamFile(file, "text/csv");
  file.close();
}

void handleDiagnosticDownload(const char *path) {
  if (!LittleFS.exists(path)) {
    logServer.send(404, "text/plain", "diagnostic log not found\n");
    return;
  }
  File file = LittleFS.open(path, FILE_READ);
  if (!file) {
    logServer.send(500, "text/plain", "failed to open diagnostic log\n");
    return;
  }
  sendCsvDownloadHeader(fileNameFromPath(path));
  logServer.streamFile(file, "text/plain");
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
  ensureDiagnosticLog();
  Serial.println(F("[LOG] LittleFS ready -> /sound_log.csv + /diagnostics.log"));
}

void LogService::update(bool wifiConnected, const String &ipAddress) {
  if (!ready_) {
    return;
  }

  if (wifiConnected && (!serverStarted_ || ipAddress != lastIpAddress_)) {
    logServer.on("/", handleRoot);
    logServer.on("/log.csv", HTTP_GET, handleLogDownload);
    logServer.on("/diagnostics.log", HTTP_GET,
                 []() { handleDiagnosticDownload(kDiagnosticLogPath); });
    logServer.on("/diagnostics-prev.log", HTTP_GET,
                 []() { handleDiagnosticDownload(kPreviousDiagnosticLogPath); });
    logServer.on("/archive-log", HTTP_GET, handleArchiveLogConfirm);
    logServer.on("/archive-log-confirm", HTTP_GET, handleArchiveLogAction);
    logServer.on("/download-archive", HTTP_GET, handleArchiveDownload);
    logServer.on("/clear-log", HTTP_GET, handleClearLogConfirm);
    logServer.on("/clear-log-confirm", HTTP_GET, handleClearLogAction);
    logServer.on("/clear-all-logs", HTTP_GET, handleClearAllLogsConfirm);
    logServer.on("/clear-all-logs-confirm", HTTP_GET, handleClearAllLogsAction);
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

void LogService::setClock(const String &dateText, const String &timeText) {
  if (dateText.length() > 0) {
    currentDateText = dateText;
  }
  if (timeText.length() > 0) {
    currentTimeText = timeText;
  }
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
  file.print(record.peakToPeakP95);
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
  file.print(record.freeHeap);
  file.print(',');
  file.print(record.minFreeHeap);
  file.print(',');
  file.print(wifiRssiDbm);
  file.print(',');
  file.println(PROJECT_ACOUSTIC_REV);
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
  for (uint8_t index = 0; index < 24; ++index) {
    file.print(',');
  }
  file.print(wifiRssiDbm);
  file.print(',');
  file.println(PROJECT_ACOUSTIC_REV);
  file.close();
}

bool LogService::isReady() const {
  return ready_;
}

bool LogService::webServerStarted() const {
  return serverStarted_;
}

void LogService::appendDiagnosticEvent(const String &eventText, const String &details) {
  if (!ready_ || eventText.isEmpty()) {
    return;
  }

  const String safeEvent = sanitizeDiagnosticField(eventText);
  const String safeDetails = sanitizeDiagnosticField(details);
  const size_t estimatedBytes = currentDateText.length() + currentTimeText.length() +
                                safeEvent.length() + safeDetails.length() + 40U;
  if (!rotateDiagnosticLogIfNeeded(estimatedBytes)) {
    return;
  }

  File file = LittleFS.open(kDiagnosticLogPath, FILE_APPEND);
  if (!file) {
    Serial.println(F("[DLOG] append failed"));
    return;
  }
  file.print(currentDateText);
  file.print('\t');
  file.print(currentTimeText);
  file.print('\t');
  file.print(millis() / 1000U);
  file.print('\t');
  file.print(PROJECT_BUILD);
  file.print('\t');
  file.print(safeEvent);
  file.print('\t');
  file.println(safeDetails);
  file.close();
}
