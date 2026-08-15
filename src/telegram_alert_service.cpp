#include "telegram_alert_service.h"

#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <time.h>

#include "secrets.h"

namespace {

constexpr char kTelegramApiBase[] = "https://api.telegram.org/bot";
constexpr char kStatisticsUrl[] =
    "https://docs.google.com/spreadsheets/d/1DoGf95IYo3rvIdwAnyHVe2r0lP1txKe3gYVbe3XIMUQ/edit?pli=1&gid=1674242943#gid=1674242943";

String localLogUrl(const String &ipAddress) {
  if (ipAddress.isEmpty() || ipAddress == F("0.0.0.0")) {
    return String();
  }
  return String(F("http://")) + ipAddress + F("/");
}

void appendLinks(String &message, const String &ipAddress) {
  message += F("\n\n🔗 <a href=\"");
  message += kStatisticsUrl;
  message += F("\">Online Statistics</a>");
  const String logUrl = localLogUrl(ipAddress);
  if (!logUrl.isEmpty()) {
    message += F("\n🔗 <a href=\"");
    message += logUrl;
    message += F("\">Local Log</a>");
  }
}

String formatVoltage(int32_t millivolts) {
  return String(millivolts / 1000.0F, 3) + F(" V");
}

const __FlashStringHelper *controllerModeText(uint8_t mode) {
  switch (mode) {
    case 1:
      return F("Smart Auto");
    case 2:
      return F("Legacy Manual");
    case 0:
    default:
      return F("Classic");
  }
}

int findJsonValueStart(const String &source, const char *quotedKey,
                       int start, int end) {
  const int keyAt = source.indexOf(quotedKey, start);
  if (keyAt < 0 || keyAt >= end) {
    return -1;
  }
  int cursor = keyAt + static_cast<int>(strlen(quotedKey));
  while (cursor < end && (source[cursor] == ' ' || source[cursor] == '\t' ||
                          source[cursor] == '\r' || source[cursor] == '\n')) {
    ++cursor;
  }
  if (cursor >= end || source[cursor] != ':') {
    return -1;
  }
  ++cursor;
  while (cursor < end && (source[cursor] == ' ' || source[cursor] == '\t' ||
                          source[cursor] == '\r' || source[cursor] == '\n')) {
    ++cursor;
  }
  return cursor < end ? cursor : -1;
}

bool parseJsonUnsignedField(const String &source, const char *quotedKey,
                            int start, int end, uint32_t &value) {
  int cursor = findJsonValueStart(source, quotedKey, start, end);
  if (cursor < 0 || source[cursor] < '0' || source[cursor] > '9') {
    return false;
  }
  uint32_t parsed = 0;
  do {
    const uint8_t digit = static_cast<uint8_t>(source[cursor] - '0');
    if (parsed > (UINT32_MAX - digit) / 10U) {
      return false;
    }
    parsed = parsed * 10U + digit;
    ++cursor;
  } while (cursor < end && source[cursor] >= '0' && source[cursor] <= '9');
  value = parsed;
  return true;
}

bool parseJsonIntegerTokenField(const String &source, const char *quotedKey,
                                int start, int end, String &token) {
  int cursor = findJsonValueStart(source, quotedKey, start, end);
  if (cursor < 0) {
    return false;
  }
  const int tokenStart = cursor;
  if (source[cursor] == '-') {
    ++cursor;
  }
  const int digitStart = cursor;
  while (cursor < end && source[cursor] >= '0' && source[cursor] <= '9') {
    ++cursor;
  }
  if (cursor == digitStart) {
    return false;
  }
  token = source.substring(tokenStart, cursor);
  return true;
}

bool parseJsonStringField(const String &source, const char *quotedKey,
                          int start, int end, String &value) {
  int cursor = findJsonValueStart(source, quotedKey, start, end);
  if (cursor < 0 || source[cursor] != '"') {
    return false;
  }
  ++cursor;
  value = "";
  while (cursor < end) {
    const char current = source[cursor++];
    if (current == '"') {
      return true;
    }
    if (current != '\\') {
      value += current;
      continue;
    }
    if (cursor >= end) {
      return false;
    }
    const char escaped = source[cursor++];
    switch (escaped) {
      case '"':
      case '\\':
      case '/':
        value += escaped;
        break;
      case 'b':
        value += '\b';
        break;
      case 'f':
        value += '\f';
        break;
      case 'n':
        value += '\n';
        break;
      case 'r':
        value += '\r';
        break;
      case 't':
        value += '\t';
        break;
      default:
        return false;
    }
  }
  return false;
}

bool isStatusCommand(String command) {
  command.trim();
  if (command == F("/c3_status")) {
    return true;
  }
  if (!command.startsWith(F("/c3_status@"))) {
    return false;
  }
  return command.indexOf(' ') < 0 && command.length() > strlen("/c3_status@");
}

}  // namespace

void TelegramAlertService::begin() {
  configured_ = strlen(TELEGRAM_BOT_TOKEN) > 0 && strlen(TELEGRAM_CHAT_ID) > 0;
  onlineSentThisBoot_ = false;
  wifiWasConnected_ = false;
  restorePending_ = false;
  controllerStatusSentThisBoot_ = false;
  wifiConnectedSinceMs_ = 0;
  wifiLostAtMs_ = 0;
  restoreDowntimeMs_ = 0;
  lastAttemptAtMs_ = 0;
  lastControllerAttemptAtMs_ = 0;
  lastCommandPollAtMs_ = millis();
  lastSuccessfulSendAtMs_ = 0;
  statusReplyQueuedAtMs_ = 0;
  lastStatusReplyAttemptAtMs_ = 0;
  lastCommandUpdateId_ = 0;
  commandPreferencesReady_ = false;
  statusReplyPending_ = false;

  if (configured_) {
    Serial.println(F("[TG] ready -> Telegram online alert configured"));
    commandPreferencesReady_ = commandPreferences_.begin("tg_commands", false);
    if (commandPreferencesReady_) {
      lastCommandUpdateId_ = commandPreferences_.getULong("last_update", 0);
      Serial.print(F("[TG] commands ready -> /c3_status poll=60s last_update="));
      Serial.println(lastCommandUpdateId_);
    } else {
      Serial.println(F("[TG] commands OFF -> update_id persistence unavailable"));
    }
  } else {
    Serial.println(F("[TG] OFF -> TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is empty"));
  }
}

void TelegramAlertService::update(bool wifiConnected, const String &ipAddress, int wifiRssiDbm,
                                  uint8_t wifiSignalPercent, bool timeSynced,
                                  const char *versionText, uint32_t buildNumber,
                                  const String &uptimeText) {
  if (!configured_) {
    return;
  }

  unsigned long nowMs = millis();
  if (!wifiConnected) {
    if (wifiWasConnected_) {
      wifiLostAtMs_ = nowMs;
      restorePending_ = true;
      restoreDowntimeMs_ = 0;
      Serial.println(F("[TG] Wi-Fi lost -> restore watch started"));
    }
    wifiWasConnected_ = false;
    wifiConnectedSinceMs_ = 0;
    return;
  }

  if (!wifiWasConnected_) {
    wifiWasConnected_ = true;
    wifiConnectedSinceMs_ = nowMs;
    if (restorePending_ && wifiLostAtMs_ != 0) {
      restoreDowntimeMs_ = nowMs - wifiLostAtMs_;
      if (restoreDowntimeMs_ < kRestoreThresholdMs) {
        restorePending_ = false;
        wifiLostAtMs_ = 0;
        restoreDowntimeMs_ = 0;
        Serial.println(F("[TG] skip -> Wi-Fi outage too short for restored alert"));
      } else {
        Serial.println(F("[TG] waiting -> Wi-Fi restored, restore alert warmup started"));
      }
    }
  }

  if (restorePending_ && onlineSentThisBoot_ && restoreDowntimeMs_ >= kRestoreThresholdMs) {
    if (nowMs - wifiConnectedSinceMs_ >= kRestoreWarmupMs &&
        (lastAttemptAtMs_ == 0 || nowMs - lastAttemptAtMs_ >= kRetryIntervalMs)) {
      lastAttemptAtMs_ = nowMs;
      if (sendWifiRestored_(ipAddress, wifiRssiDbm, wifiSignalPercent, timeSynced, versionText,
                            buildNumber, uptimeText, restoreDowntimeMs_)) {
        restorePending_ = false;
        wifiLostAtMs_ = 0;
        restoreDowntimeMs_ = 0;
        Serial.println(F("[TG] sent -> Wi-Fi Restored"));
      }
    }
  }

  if (onlineSentThisBoot_) {
    return;
  }

  if (wifiConnectedSinceMs_ == 0) {
    wifiConnectedSinceMs_ = nowMs;
    Serial.println(F("[TG] waiting -> Wi-Fi connected, online alert warmup started"));
    return;
  }

  if (nowMs - wifiConnectedSinceMs_ < kOnlineWarmupMs) {
    return;
  }

  if (lastAttemptAtMs_ != 0 && nowMs - lastAttemptAtMs_ < kRetryIntervalMs) {
    return;
  }
  lastAttemptAtMs_ = nowMs;

  if (sendDeviceOnline_(ipAddress, wifiRssiDbm, wifiSignalPercent, timeSynced, versionText,
                        buildNumber, uptimeText)) {
    onlineSentThisBoot_ = true;
    Serial.println(F("[TG] sent -> Device Online"));
  }
}

void TelegramAlertService::updateControllerStatus(
    bool wifiConnected, const ControllerLinkService &controllerLink) {
  const uint32_t currentMs = millis();
  if (!configured_ || !wifiConnected || !onlineSentThisBoot_ ||
      controllerStatusSentThisBoot_ || !controllerLink.hasTelemetry() ||
      (lastSuccessfulSendAtMs_ != 0 &&
       currentMs - lastSuccessfulSendAtMs_ < kSendSpacingMs)) {
    return;
  }
  if (lastControllerAttemptAtMs_ != 0 &&
      currentMs - lastControllerAttemptAtMs_ < kRetryIntervalMs) {
    return;
  }

  lastControllerAttemptAtMs_ = currentMs;
  if (sendControllerStatus_(controllerLink, currentMs)) {
    controllerStatusSentThisBoot_ = true;
    Serial.println(F("[TG] sent -> C3 Controller"));
  }
}

void TelegramAlertService::updateCommands(
    bool wifiConnected, bool timeSynced,
    const ControllerLinkService &controllerLink) {
  const uint32_t currentMs = millis();
  if (!configured_ || !commandPreferencesReady_ || !wifiConnected ||
      !timeSynced || !onlineSentThisBoot_) {
    return;
  }

  if (statusReplyPending_) {
    if (currentMs - statusReplyQueuedAtMs_ > kPendingReplyMaxAgeMs) {
      statusReplyPending_ = false;
      Serial.println(F("[TG] command /c3_status -> expired before reply"));
      return;
    }
    if (currentMs - statusReplyQueuedAtMs_ < kSendSpacingMs ||
        (lastSuccessfulSendAtMs_ != 0 &&
         currentMs - lastSuccessfulSendAtMs_ < kSendSpacingMs) ||
        (lastStatusReplyAttemptAtMs_ != 0 &&
         currentMs - lastStatusReplyAttemptAtMs_ < kRetryIntervalMs)) {
      return;
    }
    lastStatusReplyAttemptAtMs_ = currentMs;
    const bool sent = sendControllerStatus_(controllerLink, currentMs);
    Serial.print(F("[TG] command /c3_status -> "));
    Serial.println(sent ? F("OK") : F("FAIL"));
    if (sent) {
      statusReplyPending_ = false;
    }
    return;
  }

  if (currentMs - lastCommandPollAtMs_ < kCommandPollIntervalMs ||
      (lastSuccessfulSendAtMs_ != 0 &&
       currentMs - lastSuccessfulSendAtMs_ < kSendSpacingMs)) {
    return;
  }
  lastCommandPollAtMs_ = currentMs;
  pollCommands_(controllerLink);
}

bool TelegramAlertService::isConfigured() const {
  return configured_;
}

bool TelegramAlertService::sendDeviceOnline_(const String &ipAddress, int wifiRssiDbm,
                                             uint8_t wifiSignalPercent, bool timeSynced,
                                             const char *versionText, uint32_t buildNumber,
                                             const String &uptimeText) {
  WiFiClientSecure client;
  client.setInsecure();
  client.setHandshakeTimeout(4);
  client.setTimeout(kTelegramHttpTimeoutMs);

  HTTPClient http;
  http.setConnectTimeout(kTelegramHttpTimeoutMs);
  http.setTimeout(kTelegramHttpTimeoutMs);
  String url = String(kTelegramApiBase) + TELEGRAM_BOT_TOKEN + F("/sendMessage");
  if (!http.begin(client, url)) {
    Serial.println(F("[TG] HTTP begin failed"));
    return false;
  }

  String payload = F("chat_id=");
  payload += urlEncode_(String(TELEGRAM_CHAT_ID));
  payload += F("&parse_mode=HTML&disable_web_page_preview=true&text=");
  payload += urlEncode_(buildDeviceOnlineMessage_(ipAddress, wifiRssiDbm, wifiSignalPercent,
                                                  timeSynced, versionText, buildNumber,
                                                  uptimeText));

  http.addHeader(F("Content-Type"), F("application/x-www-form-urlencoded"));
  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.print(F("[TG] POST -> "));
    Serial.println(httpCode);
    if (httpCode >= 200 && httpCode < 300) {
      lastSuccessfulSendAtMs_ = millis();
      http.end();
      return true;
    }
    String response = http.getString();
    if (response.length() > 0) {
      Serial.print(F("[TG] body -> "));
      Serial.println(response);
    }
  } else {
    Serial.print(F("[TG] POST failed -> "));
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
  return false;
}

bool TelegramAlertService::sendWifiRestored_(const String &ipAddress, int wifiRssiDbm,
                                             uint8_t wifiSignalPercent, bool timeSynced,
                                             const char *versionText, uint32_t buildNumber,
                                             const String &uptimeText,
                                             unsigned long downtimeMs) {
  WiFiClientSecure client;
  client.setInsecure();
  client.setHandshakeTimeout(4);
  client.setTimeout(kTelegramHttpTimeoutMs);

  HTTPClient http;
  http.setConnectTimeout(kTelegramHttpTimeoutMs);
  http.setTimeout(kTelegramHttpTimeoutMs);
  String url = String(kTelegramApiBase) + TELEGRAM_BOT_TOKEN + F("/sendMessage");
  if (!http.begin(client, url)) {
    Serial.println(F("[TG] HTTP begin failed"));
    return false;
  }

  String payload = F("chat_id=");
  payload += urlEncode_(String(TELEGRAM_CHAT_ID));
  payload += F("&parse_mode=HTML&disable_web_page_preview=true&text=");
  payload += urlEncode_(buildWifiRestoredMessage_(ipAddress, wifiRssiDbm, wifiSignalPercent,
                                                  timeSynced, versionText, buildNumber,
                                                  uptimeText, downtimeMs));

  http.addHeader(F("Content-Type"), F("application/x-www-form-urlencoded"));
  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.print(F("[TG] POST -> "));
    Serial.println(httpCode);
    if (httpCode >= 200 && httpCode < 300) {
      lastSuccessfulSendAtMs_ = millis();
      http.end();
      return true;
    }
    String response = http.getString();
    if (response.length() > 0) {
      Serial.print(F("[TG] body -> "));
      Serial.println(response);
    }
  } else {
    Serial.print(F("[TG] POST failed -> "));
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
  return false;
}

bool TelegramAlertService::sendControllerStatus_(
    const ControllerLinkService &controllerLink, uint32_t nowMs) {
  WiFiClientSecure client;
  client.setInsecure();
  client.setHandshakeTimeout(4);
  client.setTimeout(kTelegramHttpTimeoutMs);

  HTTPClient http;
  http.setConnectTimeout(kTelegramHttpTimeoutMs);
  http.setTimeout(kTelegramHttpTimeoutMs);
  String url = String(kTelegramApiBase) + TELEGRAM_BOT_TOKEN + F("/sendMessage");
  if (!http.begin(client, url)) {
    Serial.println(F("[TG] C3 HTTP begin failed"));
    return false;
  }

  String payload = F("chat_id=");
  payload += urlEncode_(String(TELEGRAM_CHAT_ID));
  payload += F("&parse_mode=HTML&disable_web_page_preview=true&text=");
  payload += urlEncode_(buildControllerStatusMessage_(controllerLink, nowMs));

  http.addHeader(F("Content-Type"), F("application/x-www-form-urlencoded"));
  const int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.print(F("[TG] C3 POST -> "));
    Serial.println(httpCode);
    if (httpCode >= 200 && httpCode < 300) {
      lastSuccessfulSendAtMs_ = millis();
      http.end();
      return true;
    }
    const String response = http.getString();
    if (response.length() > 0) {
      Serial.print(F("[TG] C3 body -> "));
      Serial.println(response);
    }
  } else {
    Serial.print(F("[TG] C3 POST failed -> "));
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
  return false;
}

bool TelegramAlertService::pollCommands_(
    const ControllerLinkService &controllerLink) {
  WiFiClientSecure client;
  client.setInsecure();
  client.setHandshakeTimeout(4);
  client.setTimeout(kTelegramHttpTimeoutMs);

  String url = String(kTelegramApiBase) + TELEGRAM_BOT_TOKEN + F("/getUpdates?offset=");
  if (lastCommandUpdateId_ == 0) {
    url += F("-10");
  } else {
    url += String(lastCommandUpdateId_ + 1U);
  }
  url += F("&limit=10&timeout=0&allowed_updates=%5B%22message%22%5D");

  HTTPClient http;
  http.setConnectTimeout(kTelegramHttpTimeoutMs);
  http.setTimeout(kTelegramHttpTimeoutMs);
  if (!http.begin(client, url)) {
    Serial.println(F("[TG] commands GET begin failed"));
    return false;
  }

  const int httpCode = http.GET();
  if (httpCode != 200) {
    Serial.print(F("[TG] commands GET -> "));
    Serial.println(httpCode);
    http.end();
    return false;
  }

  const String response = http.getString();
  http.end();
  processCommandUpdates_(response, controllerLink);
  return true;
}

void TelegramAlertService::processCommandUpdates_(
    const String &response, const ControllerLinkService &controllerLink) {
  uint32_t newestUpdateId = lastCommandUpdateId_;
  uint8_t statusRequestCount = 0;
  int searchAt = 0;
  while (true) {
    const int updateAt = response.indexOf(F("\"update_id\""), searchAt);
    if (updateAt < 0) {
      break;
    }
    const int nextUpdateAt = response.indexOf(F("\"update_id\""), updateAt + 1);
    const int updateEnd = nextUpdateAt >= 0 ? nextUpdateAt : response.length();
    searchAt = updateEnd;

    uint32_t updateId = 0;
    if (!parseJsonUnsignedField(response, "\"update_id\"", updateAt,
                                updateEnd, updateId)) {
      continue;
    }
    if (updateId > newestUpdateId) {
      newestUpdateId = updateId;
    }
    if (updateId <= lastCommandUpdateId_) {
      continue;
    }

    const int messageAt = response.indexOf(F("\"message\""), updateAt);
    const int chatAt = messageAt >= 0
                           ? response.indexOf(F("\"chat\""), messageAt)
                           : -1;
    if (messageAt < 0 || messageAt >= updateEnd || chatAt < 0 ||
        chatAt >= updateEnd) {
      continue;
    }

    String chatId;
    String command;
    uint32_t messageDate = 0;
    if (!parseJsonIntegerTokenField(response, "\"id\"", chatAt, updateEnd,
                                    chatId) ||
        !parseJsonUnsignedField(response, "\"date\"", messageAt, updateEnd,
                                messageDate) ||
        !parseJsonStringField(response, "\"text\"", messageAt, updateEnd,
                              command)) {
      continue;
    }

    String configuredChatId = String(TELEGRAM_CHAT_ID);
    configuredChatId.trim();
    if (chatId != configuredChatId) {
      Serial.println(F("[TG] command ignored -> unauthorized chat"));
      continue;
    }

    const time_t currentEpoch = time(nullptr);
    const int64_t commandAgeSeconds =
        static_cast<int64_t>(currentEpoch) - static_cast<int64_t>(messageDate);
    if (currentEpoch < 1700000000 || commandAgeSeconds < -30 ||
        commandAgeSeconds > static_cast<int64_t>(kMaxCommandAgeSeconds)) {
      Serial.println(F("[TG] command ignored -> stale update"));
      continue;
    }

    if (isStatusCommand(command)) {
      if (statusRequestCount < UINT8_MAX) {
        ++statusRequestCount;
      }
    }
  }

  if (newestUpdateId != lastCommandUpdateId_) {
    if (commandPreferences_.putULong("last_update", newestUpdateId) !=
        sizeof(uint32_t)) {
      commandPreferencesReady_ = false;
      Serial.println(F("[TG] commands OFF -> failed to persist update_id"));
      return;
    }
    lastCommandUpdateId_ = newestUpdateId;
  }

  if (statusRequestCount == 0) {
    return;
  }
  if (statusRequestCount > 1) {
    Serial.print(F("[TG] command coalesced -> /c3_status x"));
    Serial.println(statusRequestCount);
  }
  statusReplyPending_ = true;
  statusReplyQueuedAtMs_ = millis();
  lastStatusReplyAttemptAtMs_ = 0;
  Serial.println(F("[TG] command /c3_status -> queued"));
}

String TelegramAlertService::buildDeviceOnlineMessage_(const String &ipAddress, int wifiRssiDbm,
                                                       uint8_t wifiSignalPercent,
                                                       bool timeSynced,
                                                       const char *versionText,
                                                       uint32_t buildNumber,
                                                       const String &uptimeText) const {
  String message;
  message.reserve(384);
  message += F("🟢 <b>Device Online</b>\n");
  message += F("Device: <code>");
  message += htmlEscape_(String(DEVICE_ID));
  message += F("</code>\n");
  message += F("Version: <code>");
  message += htmlEscape_(String(versionText));
  message += F("</code> build <code>");
  message += String(buildNumber);
  message += F("</code>\n");
  message += F("IP: <code>");
  message += htmlEscape_(ipAddress.isEmpty() ? String("0.0.0.0") : ipAddress);
  message += F("</code>\n");
  message += F("Wi-Fi: <b>");
  message += String(wifiSignalPercent);
  message += F("%</b> (");
  message += String(wifiRssiDbm);
  message += F(" dBm)\n");
  message += F("Time: <b>");
  message += timeSynced ? F("Synced") : F("Waiting");
  message += F("</b>\n");
  message += F("Uptime: ");
  message += htmlEscape_(uptimeText);
  appendLinks(message, ipAddress);
  return message;
}

String TelegramAlertService::buildWifiRestoredMessage_(const String &ipAddress, int wifiRssiDbm,
                                                       uint8_t wifiSignalPercent,
                                                       bool timeSynced,
                                                       const char *versionText,
                                                       uint32_t buildNumber,
                                                       const String &uptimeText,
                                                       unsigned long downtimeMs) const {
  String message;
  message.reserve(384);
  message += F("🟢 <b>Wi-Fi Restored</b>\n");
  message += F("Device: <code>");
  message += htmlEscape_(String(DEVICE_ID));
  message += F("</code>\n");
  message += F("Version: <code>");
  message += htmlEscape_(String(versionText));
  message += F("</code> build <code>");
  message += String(buildNumber);
  message += F("</code>\n");
  message += F("IP: <code>");
  message += htmlEscape_(ipAddress.isEmpty() ? String("0.0.0.0") : ipAddress);
  message += F("</code>\n");
  message += F("Wi-Fi: <b>");
  message += String(wifiSignalPercent);
  message += F("%</b> (");
  message += String(wifiRssiDbm);
  message += F(" dBm)\n");
  message += F("Downtime: <b>");
  message += formatDowntimeText_(downtimeMs);
  message += F("</b>\n");
  message += F("Time: <b>");
  message += timeSynced ? F("Synced") : F("Waiting");
  message += F("</b>\n");
  message += F("Uptime: ");
  message += htmlEscape_(uptimeText);
  appendLinks(message, ipAddress);
  return message;
}

String TelegramAlertService::buildControllerStatusMessage_(
    const ControllerLinkService &controllerLink, uint32_t nowMs) const {
  const ControllerTelemetrySnapshot &telemetry = controllerLink.telemetry();
  String message;
  message.reserve(512);
  message += F("🔗 <b>C3 Controller</b>\n");
  message += F("Link: <b>");
  message += htmlEscape_(String(controllerLink.stateText()));
  message += F("</b> · build <code>");
  message += String(controllerLink.remoteBuild());
  message += F("</code>\n");
  if (!controllerLink.hasTelemetry()) {
    message += F("Telemetry: <b>Waiting for C3</b>");
    return message;
  }
  message += F("Telemetry: q=<code>");
  message += String(telemetry.sequence);
  message += F("</code> · age <b>");
  message += String(controllerLink.telemetryAgeSeconds(nowMs));
  message += F(" s</b>\n");
  message += F("INA3221: <b>");
  message += telemetry.valid ? F("OK") : F("ERROR");
  message += F("</b>\n\n");
  message += F("Solar: <b>");
  message += formatVoltage(telemetry.solarMillivolts);
  message += F("</b> / ");
  message += String(telemetry.solarMilliamps);
  message += F(" mA\n");
  message += F("Battery: <b>");
  message += formatVoltage(telemetry.batteryMillivolts);
  message += F("</b> / ");
  message += String(telemetry.batteryMilliamps);
  message += F(" mA · <b>");
  message += String(telemetry.batterySocPercent);
  message += F("%</b>\n");
  message += F("Load: <b>");
  message += formatVoltage(telemetry.loadMillivolts);
  message += F("</b> / ");
  message += String(telemetry.loadMilliamps);
  message += F(" mA\n\n");
  message += F("Charge: <b>");
  message += telemetry.chargeOutputOn ? F("ON") : F("OFF");
  message += F("</b>\nMode: <b>");
  message += controllerModeText(telemetry.solarControlMode);
  message += F("</b>");
  return message;
}

String TelegramAlertService::htmlEscape_(const String &value) {
  String escaped = value;
  escaped.replace("&", "&amp;");
  escaped.replace("<", "&lt;");
  escaped.replace(">", "&gt;");
  return escaped;
}

String TelegramAlertService::urlEncode_(const String &value) {
  String encoded;
  encoded.reserve(value.length() * 3);
  for (size_t index = 0; index < value.length(); index++) {
    const char c = value.charAt(index);
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
        (c >= '0' && c <= '9') || c == '-' || c == '_' || c == '.' || c == '~') {
      encoded += c;
    } else if (c == ' ') {
      encoded += '+';
    } else {
      char buffer[4];
      snprintf(buffer, sizeof(buffer), "%%%02X", static_cast<unsigned char>(c));
      encoded += buffer;
    }
  }
  return encoded;
}

String TelegramAlertService::formatDowntimeText_(unsigned long downtimeMs) {
  unsigned long totalSeconds = downtimeMs / 1000UL;
  unsigned long minutes = totalSeconds / 60UL;
  unsigned long seconds = totalSeconds % 60UL;
  char buffer[24];
  snprintf(buffer, sizeof(buffer), "%lu m %lu s", minutes, seconds);
  return String(buffer);
}
