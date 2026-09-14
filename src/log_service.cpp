#include "log_service.h"

#include <LittleFS.h>
#include <WebServer.h>
#include <time.h>

#include "project_version.h"
#include "wifi_service.h"

namespace {

constexpr char kLogPath[] = "/sound_log.csv";
constexpr char kLegacyLogPath[] = "/sound_log_legacy.csv";
constexpr char kDiagnosticLogPath[] = "/diagnostics.log";
constexpr char kPreviousDiagnosticLogPath[] = "/diagnostics-prev.log";
constexpr char kDbCalibrationPath[] = "/dbcal.csv";
constexpr size_t kDiagnosticLogMaxBytes = 128U * 1024U;
constexpr uint32_t kDbCalibrationDurationMs = 20UL * 60UL * 1000UL;
constexpr uint32_t kDbCalibrationBucketMs = 1000UL;
constexpr char kLogHeader[] =
    "event,date,time_from,time_to,part,build,boot_seq,reset_reason,uptime_min,uptime_text,"
    "now_avg_pct,hour_pct,total_pct,p2p_avg,p2p_p95,p2p_min,p2p_max,p2p_stable_max,"
    "session_p2p_min,session_p2p_max,session_p2p_stable_max,raw_min,raw_max,signal,"
    "temp_c,hum_pct,env_ok_count,env_fail_count,samples,quiet_count,loud_count,"
    "free_heap,min_free_heap,wifi_dbm,acoustic_rev,dba_leq_est,dba_valid_pct,dba_faults,dba_clips";
constexpr char kDiagnosticLogHeader[] =
    "date\ttime\tuptime_s\tpower_uptime_min\tbuild\tboot_seq\treset\tevent\ttime_state\t"
    "wifi\tssid\twifi_pct\trssi_dbm\tip\twqtt\tdc_ok\tdc_fail\tuart\tc3_build\t"
    "c3_session\tc3_q\tc3_age_s\tc3_ok\tc3_dup\tc3_gap\tuart_off\tina\tsolar_mv\tsolar_ma\t"
    "battery_mv\tbattery_ma\tsoc\tload_mv\tload_ma\tcharge\tmode\tnow\thour\ttotal\t"
    "p2p\tsignal\ttemp_c\thum_pct\theap\tmin_heap\tgs_queue\tgs_ok\tgs_fail\tgs_drop\tinfo";
constexpr char kDbCalibrationHeader[] =
    "date,time,elapsed_s,p2p_avg,p2p_min,p2p_max,raw_min,raw_max,samples,signal,build,acoustic_rev,"
    "point,capture_elapsed_ms,a_rms_dbfs,a_slow_dbfs,a_slow_dba_est,audio_samples,coverage_pct,audio_faults,valid,sample_rate_hz";
WebServer logServer(80);
WifiService *wifiSetupService = nullptr;
bool logClearedByWeb = false;
String currentDateText;
String currentTimeText;
bool dbCalibrationRecording = false;
uint32_t dbCalibrationStartMs = 0;
time_t dbCalibrationStartEpoch = 0;
uint32_t dbCalibrationBucketStartedAtMs = 0;
uint32_t dbCalibrationP2pSum = 0;
uint16_t dbCalibrationP2pMin = UINT16_MAX;
uint16_t dbCalibrationP2pMax = 0;
int32_t dbCalibrationRawMin = INT32_MAX;
int32_t dbCalibrationRawMax = INT32_MIN;
uint16_t dbCalibrationBucketSamples = 0;
SignalState dbCalibrationWorstSignal = SignalState::Low;
uint16_t dbCalibrationPoints = 0;
String dbCalibrationDownloadFileName;
DbCalibrationTerminalState dbCalibrationTerminal = DbCalibrationTerminalState::None;
bool dbCalibrationTerminalPending = false;
AcousticReading dbAcousticEnd;
AcousticReading dbAcousticPrevious;
bool dbAcousticBaseline = false;

uint8_t signalRank(SignalState state) {
  switch (state) {
    case SignalState::Clip:
      return 2;
    case SignalState::Low:
      return 1;
    case SignalState::Ok:
    default:
      return 0;
  }
}

const __FlashStringHelper *signalText(SignalState state) {
  switch (state) {
    case SignalState::Clip:
      return F("CLIP");
    case SignalState::Low:
      return F("LOW");
    case SignalState::Ok:
    default:
      return F("OK");
  }
}

String formatLocalDateTime(time_t epoch) {
  struct tm localTime {};
  if (epoch < 1700000000 || localtime_r(&epoch, &localTime) == nullptr) {
    return F("unknown");
  }
  char text[20];
  strftime(text, sizeof(text), "%d-%m-%Y %H:%M:%S", &localTime);
  return String(text);
}

String calibrationDownloadName(time_t epoch) {
  struct tm localTime {};
  if (epoch < 1700000000 || localtime_r(&epoch, &localTime) == nullptr) {
    return F("dbcal.csv");
  }
  char text[32];
  strftime(text, sizeof(text), "dbcal-%Y%m%d-%H%M%S.csv", &localTime);
  return String(text);
}

void resetDbCalibrationBucket(uint32_t nowMs) {
  dbCalibrationBucketStartedAtMs = nowMs;
  dbCalibrationP2pSum = 0;
  dbCalibrationP2pMin = UINT16_MAX;
  dbCalibrationP2pMax = 0;
  dbCalibrationRawMin = INT32_MAX;
  dbCalibrationRawMax = INT32_MIN;
  dbCalibrationBucketSamples = 0;
  dbCalibrationWorstSignal = SignalState::Ok;
}

String pageStart(const String &title) {
  String body;
  body.reserve(768);
  body += F("<!doctype html><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>");
  body += title;
  body += F("</title><h3>");
  body += title;
  body += F("</h3>");
  return body;
}

void pageEnd(String &body) {
  body += F("<p><a href=\"/\">Back</a></p>");
}

void redirectToRoot() {
  logServer.sendHeader(F("Location"), F("/"));
  logServer.send(303, "text/plain", "done\n");
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
  size_t calibrationLogBytes = 0;
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
  stats.calibrationLogBytes = fileSizeForPath(kDbCalibrationPath);
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
  body += F("<p>LittleFS: ");
  body += formatBytes(stats.usedBytes);
  body += F(" used, ");
  body += formatBytes(stats.totalBytes);
  body += F(" total, ");
  body += formatBytes(freeBytes);
  body += F(" free<br>Sound log: ");
  body += formatBytes(stats.activeLogBytes);
  body += F("; archives: ");
  body += String(stats.archivedLogCount);
  body += F(" / ");
  body += formatBytes(stats.archivedLogBytes);
  body += F("<br>Diagnostics: ");
  body += String(stats.diagnosticLogCount);
  body += F(" / ");
  body += formatBytes(stats.diagnosticLogBytes);
  body += F("<br>dB calibration: ");
  body += formatBytes(stats.calibrationLogBytes);
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

void printDiagnosticTextField(File &file, const String &value) {
  for (size_t index = 0; index < value.length(); ++index) {
    const char character = value.charAt(index);
    file.print(character == '\t' || character == '\r' || character == '\n' ? ' '
                                                                            : character);
  }
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

void handleWifiSetupRoot() {
  String body = pageStart(F("BS Wi-Fi Setup"));
  body += F("<p>Temporary setup AP: <b>");
  body += wifiSetupService->setupApSsid();
  body += F("</b><br>Window: 10 min</p>");

  switch (wifiSetupService->setupState()) {
    case WifiSetupState::Testing:
      body += F("<meta http-equiv=\"refresh\" content=\"3\"><p>Testing connection...</p>");
      break;
    case WifiSetupState::Invalid:
      body += F("<p>Invalid SSID or password length.</p>");
      break;
    case WifiSetupState::Failed:
      body += F("<p>Connection failed. Previous profile was kept.</p>");
      break;
    case WifiSetupState::SaveFailed:
      body += F("<p>Connection worked, but saving failed. Previous profile was kept.</p>");
      break;
    case WifiSetupState::Saved:
      body += F("<p>Connected and saved. BS is restarting...</p>");
      break;
    default:
      break;
  }

  if (wifiSetupService->setupState() != WifiSetupState::Testing &&
      wifiSetupService->setupState() != WifiSetupState::Saved) {
    body += F("<form method=\"post\" action=\"/wifi-setup\">"
              "<p><label>SSID<br><input name=\"ssid\" maxlength=\"32\" required></label></p>"
              "<p><label>Password<br><input name=\"password\" type=\"password\" "
              "maxlength=\"63\" autocomplete=\"new-password\"></label></p>"
              "<button type=\"submit\">Test and save</button></form>"
              "<p>The password is never displayed or logged.</p>");
  }
  logServer.sendHeader(F("Cache-Control"), F("no-store"));
  logServer.send(200, "text/html", body);
}

void handleRoot() {
  if (wifiSetupService != nullptr && wifiSetupService->isSetupActive()) {
    handleWifiSetupRoot();
    return;
  }

  String body = pageStart(F("BS Noise Log"));
  body += F("<p>WROOM ");
  body += F(PROJECT_VERSION);
  body += F(" build ");
  body += PROJECT_BUILD;
  body += F("; uptime ");
  body += millis() / 60000UL;
  body += F(" min</p>");
  appendStorageSummary(body);
  body += F("<p><a href=\"/log.csv\" download>sound_log.csv</a><br>");
  body += F("<a href=\"/diagnostics.log\" download>diagnostics.log</a> (");
  body += formatBytes(fileSizeForPath(kDiagnosticLogPath));
  body += ')';
  if (LittleFS.exists(kPreviousDiagnosticLogPath)) {
    body += F("<br><a href=\"/diagnostics-prev.log\" download>diagnostics-prev.log</a> (");
    body += formatBytes(fileSizeForPath(kPreviousDiagnosticLogPath));
    body += ')';
  }
  if (LittleFS.exists(kDbCalibrationPath)) {
    body += F("<br><a href=\"/dbcal.csv\" download>");
    body += dbCalibrationDownloadFileName.isEmpty()
                ? String(F("dbcal.csv"))
                : dbCalibrationDownloadFileName;
    body += F("</a> (");
    body += formatBytes(fileSizeForPath(kDbCalibrationPath));
    body += ')';
  }
  body += F("</p><p>For complete analysis download all files shown above.</p>");
  body += F("<p><a href=\"/archive-log\">Archive sound log</a> | ");
  body += F("<a href=\"/clear-log\">Clear sound log</a> | ");
  body += F("<a href=\"/clear-all-logs\">Clear ALL logs</a></p>");
  body += F("<p>Archives:</p><ul>");
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
      body += F("<li><a href=\"");
      body += url;
      body += F("\" download>");
      body += fileNameFromPath(path);
      body += F("</a>");
      body += F(" (");
      body += formatBytes(file.size());
      body += F(")</li>");
    }
    file = root.openNextFile();
  }
  if (!foundArchive) {
    body += F("<li>None</li>");
  }
  body += F("</ul>");
  logServer.send(200, "text/html", body);
}

void handleWifiSetupPost() {
  if (wifiSetupService == nullptr || !wifiSetupService->isSetupActive()) {
    logServer.send(404, "text/plain", "not found\n");
    return;
  }

  const String ssid = logServer.arg("ssid");
  const String password = logServer.arg("password");
  wifiSetupService->submitSetupCredentials(ssid, password);
  redirectToRoot();
}

void handleArchiveLogConfirm() {
  String body = pageStart(F("Archive BS Noise Log"));
  body += F("<p>Archive current sound log and start a new one?</p>");
  body += F("<p><a href=\"/archive-log-confirm\">Confirm archive</a></p>");
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

  const String archivePath = uniqueArchivePath();
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
  redirectToRoot();
}

void handleClearLogConfirm() {
  String body = pageStart(F("Clear BS Noise Log"));
  body += F("<p>Clear only the current sound log?</p>");
  body += F("<p><a href=\"/clear-log-confirm\">Confirm clear</a></p>");
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
  redirectToRoot();
}

void handleClearAllLogsConfirm() {
  const LogStorageStats stats = collectLogStorageStats();
  String body = pageStart(F("Clear ALL BS Noise Logs"));
  body += F("<p>Delete the active log, archives, legacy log, and diagnostics? ");
  body += F("Google Sheets data is not touched.</p>");
  body += F("<p>About ");
  body += formatBytes(stats.activeLogBytes + stats.archivedLogBytes +
                      stats.diagnosticLogBytes + stats.calibrationLogBytes);
  body += F(" in ");
  body += String(stats.archivedLogCount + stats.diagnosticLogCount +
                 (stats.activeLogBytes > 0 ? 1 : 0) +
                 (stats.calibrationLogBytes > 0 ? 1 : 0));
  body += F(" files.</p><p><a href=\"/clear-all-logs-confirm\">Confirm clear ALL</a></p>");
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

  if (LittleFS.exists(kDbCalibrationPath)) {
    const size_t fileSize = fileSizeForPath(kDbCalibrationPath);
    if (LittleFS.remove(kDbCalibrationPath)) {
      deletedBytes += fileSize;
      deletedCount++;
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
  Serial.print(F("[LOG] all local logs cleared from web UI -> bytes "));
  Serial.println(deletedBytes);
  redirectToRoot();
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

void handleDbCalibrationDownload() {
  if (!LittleFS.exists(kDbCalibrationPath)) {
    logServer.send(404, "text/plain", "calibration log not found\n");
    return;
  }
  File file = LittleFS.open(kDbCalibrationPath, FILE_READ);
  if (!file) {
    logServer.send(500, "text/plain", "failed to open calibration log\n");
    return;
  }
  sendCsvDownloadHeader(dbCalibrationDownloadFileName.isEmpty()
                            ? String(F("dbcal.csv"))
                            : dbCalibrationDownloadFileName);
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

bool appendDbCalibrationBucket(uint32_t nowMs) {
  if (dbCalibrationBucketSamples == 0) {
    resetDbCalibrationBucket(nowMs);
    return true;
  }

  File file = LittleFS.open(kDbCalibrationPath, FILE_APPEND);
  if (!file) {
    return false;
  }

  const uint32_t capturedElapsedMs = dbAcousticEnd.capturedAtMs - dbCalibrationStartMs;
  const uint32_t elapsedSeconds = capturedElapsedMs / 1000UL;
  const time_t pointEpoch = dbCalibrationStartEpoch + elapsedSeconds;
  struct tm localTime {};
  char dateText[11] = "";
  char timeText[9] = "";
  if (localtime_r(&pointEpoch, &localTime) != nullptr) {
    strftime(dateText, sizeof(dateText), "%d-%m-%Y", &localTime);
    strftime(timeText, sizeof(timeText), "%H:%M:%S", &localTime);
  }

  const uint64_t audioSamples = dbAcousticEnd.samples - dbAcousticPrevious.samples;
  const uint32_t spanMs = dbAcousticEnd.capturedAtMs - dbAcousticPrevious.capturedAtMs;
  const double energy = dbAcousticEnd.energySum - dbAcousticPrevious.energySum;
  const float coverage = spanMs == 0 ? 0 :
      static_cast<float>(audioSamples * 100000.0 / (AcousticEnergy::kSampleRate * double(spanMs)));
  const bool valid = dbAcousticBaseline && dbAcousticEnd.warm &&
      nowMs - dbAcousticEnd.capturedAtMs <= 100 &&
      dbAcousticEnd.faults == dbAcousticPrevious.faults &&
      dbAcousticEnd.clipped == dbAcousticPrevious.clipped &&
      coverage >= 95.0f && coverage <= 105.0f && audioSamples > 0 && energy > 0;
  const float aRmsDbfs = acousticDbfs(audioSamples ? energy / audioSamples : 0);
  const float aSlowDbfs = acousticDbfs(dbAcousticEnd.slowEnergy);
  char row[384];
  const int length = snprintf(row, sizeof(row),
      "%s,%s,%lu,%lu,%u,%u,%ld,%ld,%u,%s,%u,%u,%u,%lu,%.3f,%.3f,%.1f,%llu,%.1f,%lu,%u,%lu\n",
      dateText, timeText, static_cast<unsigned long>(elapsedSeconds),
      static_cast<unsigned long>(dbCalibrationP2pSum / dbCalibrationBucketSamples),
      dbCalibrationP2pMin == UINT16_MAX ? 0 : dbCalibrationP2pMin,
      dbCalibrationP2pMax,
      static_cast<long>(dbCalibrationRawMin == INT32_MAX ? 0 : dbCalibrationRawMin),
      static_cast<long>(dbCalibrationRawMax == INT32_MIN ? 0 : dbCalibrationRawMax),
      dbCalibrationBucketSamples, reinterpret_cast<const char *>(signalText(dbCalibrationWorstSignal)),
      PROJECT_BUILD, PROJECT_ACOUSTIC_REV, dbCalibrationPoints + 1,
      static_cast<unsigned long>(capturedElapsedMs), aRmsDbfs, aSlowDbfs,
      acousticDbaEstimate(aSlowDbfs), static_cast<unsigned long long>(audioSamples),
      coverage, static_cast<unsigned long>(dbAcousticEnd.faults), valid ? 1 : 0,
      static_cast<unsigned long>(AcousticEnergy::kSampleRate));
  // File::write does not reliably set Print::getWriteError on short writes.
  const bool writeOk = length > 0 && static_cast<size_t>(length) < sizeof(row) &&
      file.write(reinterpret_cast<const uint8_t *>(row), length) == static_cast<size_t>(length);
  file.flush();
  file.close();
  if (!writeOk) return false;

  dbAcousticPrevious = dbAcousticEnd;
  dbAcousticBaseline = true;

  dbCalibrationPoints++;
  resetDbCalibrationBucket(nowMs);
  return true;
}

void finishDbCalibration(uint32_t nowMs, DbCalibrationTerminalState state) {
  if (!dbCalibrationRecording) {
    return;
  }
  dbCalibrationRecording = false;
  dbCalibrationTerminal = state;
  dbCalibrationTerminalPending = true;
  dbCalibrationBucketStartedAtMs = nowMs;
}

}  // namespace

void LogService::begin(WifiService &wifiService) {
  wifiSetupService = &wifiService;
  ready_ = LittleFS.begin(true);
  if (!ready_) {
    Serial.println(F("[LOG] LittleFS mount failed"));
    return;
  }

  ensureHeader();
  ensureDiagnosticLog();
  Serial.println(F("[LOG] LittleFS ready -> /sound_log.csv + /diagnostics.log"));
}

DbCalibrationStartResult LogService::startDbCalibration(uint32_t nowMs) {
  if (!ready_) {
    return DbCalibrationStartResult::StorageError;
  }
  if (dbCalibrationRecording) {
    return DbCalibrationStartResult::AlreadyActive;
  }

  const time_t currentEpoch = time(nullptr);
  if (currentEpoch < 1700000000) {
    return DbCalibrationStartResult::ClockUnavailable;
  }

  File file = LittleFS.open(kDbCalibrationPath, FILE_WRITE);
  if (!file) {
    return DbCalibrationStartResult::StorageError;
  }
  const bool headerOk = file.println(kDbCalibrationHeader) == strlen(kDbCalibrationHeader) + 2;
  file.close();
  if (!headerOk) return DbCalibrationStartResult::StorageError;

  dbCalibrationStartMs = nowMs;
  dbCalibrationStartEpoch = currentEpoch;
  dbCalibrationPoints = 0;
  dbCalibrationDownloadFileName = calibrationDownloadName(currentEpoch);
  dbCalibrationTerminal = DbCalibrationTerminalState::None;
  dbCalibrationTerminalPending = false;
  dbAcousticBaseline = false;
  dbAcousticPrevious = AcousticReading{};
  dbAcousticEnd = AcousticReading{};
  resetDbCalibrationBucket(nowMs);
  dbCalibrationRecording = true;
  appendDiagnosticEvent(F("DB_CAL_START"), F("duration_s=1200 interval_s=1 A16_SLOW_CAL_114.2"));
  Serial.println(F("[DBCAL] started -> duration=1200s interval=1s A16_SLOW_CAL_114.2"));
  return DbCalibrationStartResult::Started;
}

DbCalibrationStopResult LogService::stopDbCalibration(uint32_t nowMs) {
  if (!dbCalibrationRecording) {
    return DbCalibrationStopResult::NotActive;
  }
  const bool writeOk = appendDbCalibrationBucket(nowMs);
  finishDbCalibration(nowMs, writeOk ? DbCalibrationTerminalState::Stopped
                                    : DbCalibrationTerminalState::WriteError);
  appendDiagnosticEvent(writeOk ? F("DB_CAL_STOP") : F("DB_CAL_FAIL"),
                        String(F("points=")) + dbCalibrationPoints);
  Serial.print(F("[DBCAL] stopped -> points="));
  Serial.println(dbCalibrationPoints);
  return DbCalibrationStopResult::Stopped;
}

void LogService::updateDbCalibration(const AudioSnapshot &snapshot, uint32_t nowMs) {
  if (!dbCalibrationRecording) {
    return;
  }

  // Never timestamp an old pre-start capture as part of the new session.
  if (static_cast<int32_t>(snapshot.acoustic.capturedAtMs - dbCalibrationStartMs) < 0 ||
      snapshot.acoustic.samples == 0) {
    if (nowMs - dbCalibrationStartMs >= kDbCalibrationDurationMs) {
      finishDbCalibration(nowMs, DbCalibrationTerminalState::WriteError);
      appendDiagnosticEvent(F("DB_CAL_FAIL"), F("audio_unavailable"));
    }
    return;
  }
  dbAcousticEnd = snapshot.acoustic;
  if (snapshot.statsUpdated) {
    dbCalibrationP2pSum += snapshot.statsLevel;
    if (snapshot.statsLevel < dbCalibrationP2pMin) {
      dbCalibrationP2pMin = snapshot.statsLevel;
    }
    if (snapshot.statsLevel > dbCalibrationP2pMax) {
      dbCalibrationP2pMax = snapshot.statsLevel;
    }
    if (snapshot.rawMin < dbCalibrationRawMin) {
      dbCalibrationRawMin = snapshot.rawMin;
    }
    if (snapshot.rawMax > dbCalibrationRawMax) {
      dbCalibrationRawMax = snapshot.rawMax;
    }
    if (signalRank(snapshot.signalState) > signalRank(dbCalibrationWorstSignal)) {
      dbCalibrationWorstSignal = snapshot.signalState;
    }
    dbCalibrationBucketSamples++;
  }

  if (nowMs - dbCalibrationBucketStartedAtMs >= kDbCalibrationBucketMs) {
    if (!appendDbCalibrationBucket(nowMs)) {
      finishDbCalibration(nowMs, DbCalibrationTerminalState::WriteError);
      appendDiagnosticEvent(F("DB_CAL_FAIL"),
                            String(F("points=")) + dbCalibrationPoints);
      Serial.println(F("[DBCAL] stopped -> write failed"));
      return;
    }
  }

  if (nowMs - dbCalibrationStartMs >= kDbCalibrationDurationMs) {
    if (dbCalibrationBucketSamples > 0 && !appendDbCalibrationBucket(nowMs)) {
      finishDbCalibration(nowMs, DbCalibrationTerminalState::WriteError);
      appendDiagnosticEvent(F("DB_CAL_FAIL"),
                            String(F("points=")) + dbCalibrationPoints);
      Serial.println(F("[DBCAL] stopped -> final write failed"));
      return;
    }
    finishDbCalibration(nowMs, DbCalibrationTerminalState::Completed);
    appendDiagnosticEvent(F("DB_CAL_COMPLETE"),
                          String(F("points=")) + dbCalibrationPoints);
    Serial.print(F("[DBCAL] complete -> points="));
    Serial.println(dbCalibrationPoints);
  }
}

bool LogService::dbCalibrationActive() const {
  return dbCalibrationRecording;
}

uint32_t LogService::dbCalibrationElapsedSeconds(uint32_t nowMs) const {
  if (dbCalibrationStartEpoch == 0) {
    return 0;
  }
  const uint32_t elapsedMs = nowMs - dbCalibrationStartMs;
  return min(elapsedMs, kDbCalibrationDurationMs) / 1000UL;
}

uint32_t LogService::dbCalibrationRemainingSeconds(uint32_t nowMs) const {
  if (!dbCalibrationRecording) {
    return 0;
  }
  const uint32_t elapsedMs = nowMs - dbCalibrationStartMs;
  return elapsedMs >= kDbCalibrationDurationMs
             ? 0
             : (kDbCalibrationDurationMs - elapsedMs + 999UL) / 1000UL;
}

uint16_t LogService::dbCalibrationPointCount() const {
  return dbCalibrationPoints;
}

String LogService::dbCalibrationStartText() const {
  return formatLocalDateTime(dbCalibrationStartEpoch);
}

String LogService::dbCalibrationFinishText() const {
  return formatLocalDateTime(dbCalibrationStartEpoch + kDbCalibrationDurationMs / 1000UL);
}

String LogService::dbCalibrationDownloadName() const {
  return dbCalibrationDownloadFileName;
}

DbCalibrationTerminalState LogService::dbCalibrationTerminalState() const {
  return dbCalibrationTerminal;
}

bool LogService::dbCalibrationTerminalNotificationPending() const {
  return dbCalibrationTerminalPending;
}

void LogService::markDbCalibrationTerminalNotificationSent() {
  dbCalibrationTerminalPending = false;
}

void LogService::update(bool wifiConnected, const String &ipAddress) {
  if (!ready_) {
    return;
  }

  const bool webAvailable = wifiConnected ||
                            (wifiSetupService != nullptr && wifiSetupService->isSetupActive());
  if (webAvailable && !serverStarted_) {
    logServer.on("/", handleRoot);
    logServer.on("/wifi-setup", HTTP_POST, handleWifiSetupPost);
    logServer.on("/log.csv", HTTP_GET, handleLogDownload);
    logServer.on("/dbcal.csv", HTTP_GET, handleDbCalibrationDownload);
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
  }

  if (wifiConnected && ipAddress != lastIpAddress_) {
    lastIpAddress_ = ipAddress;
    Serial.print(F("[LOG] web download ready -> http://"));
    Serial.print(lastIpAddress_);
    Serial.println(F("/log.csv"));
    Serial.print(F("[DLOG] web download ready -> http://"));
    Serial.print(lastIpAddress_);
    Serial.println(F("/diagnostics.log"));
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
  file.print(PROJECT_ACOUSTIC_REV);
  file.print(',');
  if (record.dbaAvailable) {
    file.print(record.dbaLeqEstimate, 1);
  }
  file.print(',');
  file.print(record.dbaValidPercent);
  file.print(',');
  file.print(record.dbaFaultCount);
  file.print(',');
  file.print(record.dbaClippedSamples);
  file.println();
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
  file.print(PROJECT_ACOUSTIC_REV);
  file.println(',');
  file.close();
}

void LogService::appendDiagnosticEvent(const String &eventText, const String &details) {
  DiagnosticRecord record;
  record.event = eventText;
  record.info = details;
  appendDiagnosticRecord(record);
}

void LogService::appendDiagnosticRecord(const DiagnosticRecord &record) {
  if (!ready_ || record.event.isEmpty()) {
    return;
  }

  const size_t estimatedBytes = currentDateText.length() + currentTimeText.length() +
                                record.event.length() + record.info.length() +
                                record.wifiSsid.length() + record.wifiIp.length() + 260U;
  if (!rotateDiagnosticLogIfNeeded(estimatedBytes)) {
    return;
  }
  File file = LittleFS.open(kDiagnosticLogPath, FILE_APPEND);
  if (!file) {
    Serial.println(F("[DLOG] append failed"));
    return;
  }

  auto blankField = [&file]() { file.print('\t'); };
  auto textField = [&file](const String &value) {
    file.print('\t');
    printDiagnosticTextField(file, value);
  };
  auto unsignedField = [&file](uint32_t value) {
    file.print('\t');
    file.print(value);
  };
  auto signedField = [&file](int32_t value) {
    file.print('\t');
    file.print(value);
  };

  printDiagnosticTextField(file, currentDateText);
  textField(currentTimeText);
  unsignedField(millis() / 1000U);
  record.hasPowerContext ? unsignedField(record.powerUptimeMinutes) : blankField();
  unsignedField(PROJECT_BUILD);
  record.hasPowerContext ? unsignedField(record.bootSequence) : blankField();
  record.hasPowerContext ? textField(record.resetReason) : blankField();
  textField(record.event);
  textField(record.timeState);
  if (record.hasWifi) {
    textField(record.wifiState);
    textField(record.wifiSsid);
    signedField(record.wifiSignalPercent);
    signedField(record.wifiRssiDbm);
    textField(record.wifiIp);
  } else {
    for (uint8_t index = 0; index < 5; ++index) blankField();
  }
  textField(record.wqttState);
  if (record.hasDatacakeCounters) {
    unsignedField(record.datacakeOkCount);
    unsignedField(record.datacakeFailureCount);
  } else {
    blankField();
    blankField();
  }
  textField(record.uartState);
  if (record.hasC3) {
    unsignedField(record.c3Build);
    unsignedField(record.c3Session);
    unsignedField(record.c3Sequence);
    unsignedField(record.c3AgeSeconds);
  } else {
    for (uint8_t index = 0; index < 4; ++index) blankField();
  }
  if (record.hasC3Counters) {
    unsignedField(record.c3AcceptedCount);
    unsignedField(record.c3DuplicateCount);
    unsignedField(record.c3GapCount);
    unsignedField(record.c3OfflineCount);
  } else {
    for (uint8_t index = 0; index < 4; ++index) blankField();
  }
  if (record.hasC3) {
    textField(record.inaState);
    signedField(record.solarMillivolts);
    signedField(record.solarMilliamps);
    signedField(record.batteryMillivolts);
    signedField(record.batteryMilliamps);
    unsignedField(record.batterySocPercent);
    signedField(record.loadMillivolts);
    signedField(record.loadMilliamps);
    textField(record.chargeState);
    textField(record.controlMode);
  } else {
    for (uint8_t index = 0; index < 10; ++index) blankField();
  }
  if (record.hasSound) {
    unsignedField(record.soundNow);
    unsignedField(record.soundHour);
    unsignedField(record.soundTotal);
    unsignedField(record.soundPeakToPeak);
    textField(record.soundSignal);
  } else {
    for (uint8_t index = 0; index < 5; ++index) blankField();
  }
  if (record.hasEnvironment) {
    file.print('\t');
    file.print(record.temperatureC, 1);
    file.print('\t');
    file.print(record.humidityPct, 1);
  } else {
    blankField();
    blankField();
  }
  if (record.hasHeap) {
    unsignedField(record.freeHeap);
    unsignedField(record.minFreeHeap);
  } else {
    blankField();
    blankField();
  }
  if (record.hasGoogleSheetsCounters) {
    unsignedField(record.googleSheetsQueue);
    unsignedField(record.googleSheetsOkCount);
    unsignedField(record.googleSheetsFailureCount);
    unsignedField(record.googleSheetsDropCount);
  } else {
    for (uint8_t index = 0; index < 4; ++index) blankField();
  }
  textField(record.info);
  file.println();
  file.close();
}
