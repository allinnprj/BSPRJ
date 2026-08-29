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

String formatGpsCoordinate(int32_t microdegrees) {
  return String(microdegrees / 1000000.0, 6);
}

String gpsFixAgeText(uint32_t fixEpoch) {
  const time_t currentEpoch = time(nullptr);
  if (fixEpoch < 1700000000UL || currentEpoch < static_cast<time_t>(fixEpoch)) {
    return F("unknown");
  }
  const uint32_t seconds = static_cast<uint32_t>(currentEpoch - fixEpoch);
  if (seconds >= 86400UL) {
    return String(seconds / 86400UL) + F(" d ") +
           String((seconds % 86400UL) / 3600UL) + F(" h");
  }
  if (seconds >= 3600UL) {
    return String(seconds / 3600UL) + F(" h ") +
           String((seconds % 3600UL) / 60UL) + F(" min");
  }
  return String(seconds / 60UL) + F(" min");
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

bool isC3StatusCommand(String command) {
  command.trim();
  if (command == F("/c3sts")) {
    return true;
  }
  if (!command.startsWith(F("/c3sts@"))) {
    return false;
  }
  return command.indexOf(' ') < 0 && command.length() > strlen("/c3sts@");
}

bool isC3WakeCommand(String command) {
  command.trim();
  if (command == F("/c3wkp")) {
    return true;
  }
  if (!command.startsWith(F("/c3wkp@"))) {
    return false;
  }
  return command.indexOf(' ') < 0 && command.length() > strlen("/c3wkp@");
}

bool isBsStatusCommand(String command) {
  command.trim();
  if (command == F("/bssts")) {
    return true;
  }
  if (!command.startsWith(F("/bssts@"))) {
    return false;
  }
  return command.indexOf(' ') < 0 && command.length() > strlen("/bssts@");
}

bool isHelpCommand(String command) {
  command.trim();
  if (command == F("/help")) {
    return true;
  }
  if (!command.startsWith(F("/help@"))) {
    return false;
  }
  return command.indexOf(' ') < 0 && command.length() > strlen("/help@");
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
  c3StatusReplyQueuedAtMs_ = 0;
  bsStatusReplyQueuedAtMs_ = 0;
  lastStatusReplyAttemptAtMs_ = 0;
  lastCommandUpdateId_ = 0;
  commandPreferencesReady_ = false;
  c3StatusReplyPending_ = false;
  c3RefreshCommandPending_ = false;
  c3HadTelemetryAtRequest_ = false;
  c3WakeReplyPending_ = false;
  c3WakeReplyResult_ = ControllerWakeRequestResult::Unavailable;
  c3WakeReplyQueuedAtMs_ = 0;
  bsStatusReplyPending_ = false;
  helpReplyPending_ = false;
  helpReplyQueuedAtMs_ = 0;

  if (configured_) {
    Serial.println(F("[TG] ready -> Telegram online alert configured"));
    commandPreferencesReady_ = commandPreferences_.begin("tg_commands", false);
    if (commandPreferencesReady_) {
      lastCommandUpdateId_ = commandPreferences_.getULong("last_update", 0);
      Serial.print(F("[TG] commands ready -> /help /c3sts /c3wkp /bssts poll=60s last_update="));
      Serial.println(lastCommandUpdateId_);
    } else {
      Serial.println(F("[TG] commands OFF -> update_id persistence unavailable"));
    }
  } else {
    Serial.println(F("[TG] OFF -> TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is empty"));
  }
}

void TelegramAlertService::update(bool wifiConnected, const String &ipAddress, int wifiRssiDbm,
                                  uint8_t wifiSignalPercent, const String &wifiSsid,
                                  bool timeSynced,
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
      if (sendWifiRestored_(ipAddress, wifiRssiDbm, wifiSignalPercent, wifiSsid,
                            timeSynced, versionText, buildNumber, uptimeText,
                            restoreDowntimeMs_)) {
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

  if (sendDeviceOnline_(ipAddress, wifiRssiDbm, wifiSignalPercent, wifiSsid,
                        timeSynced, versionText, buildNumber, uptimeText)) {
    onlineSentThisBoot_ = true;
    Serial.println(F("[TG] sent -> Device Online"));
  }
}

void TelegramAlertService::updateControllerStatus(
    bool wifiConnected, int wifiRssiDbm, uint8_t wifiSignalPercent,
    const String &wifiSsid, const ControllerLinkService &controllerLink) {
  const uint32_t currentMs = millis();
  if (!configured_ || !wifiConnected || !onlineSentThisBoot_ ||
      !controllerLink.hasTelemetry() || controllerLink.remoteBuild() == 0 ||
      (lastSuccessfulSendAtMs_ != 0 &&
       currentMs - lastSuccessfulSendAtMs_ < kSendSpacingMs)) {
    return;
  }

  if (controllerStatusSentThisBoot_) {
    return;
  }
  if (lastControllerAttemptAtMs_ != 0 &&
      currentMs - lastControllerAttemptAtMs_ < kRetryIntervalMs) {
    return;
  }

  lastControllerAttemptAtMs_ = currentMs;
  if (sendControllerStatus_(controllerLink, currentMs, wifiRssiDbm,
                            wifiSignalPercent, wifiSsid)) {
    controllerStatusSentThisBoot_ = true;
    Serial.println(F("[TG] sent -> C3 Controller"));
  }
}

void TelegramAlertService::updateCommands(
    bool wifiConnected, bool timeSynced, int wifiRssiDbm,
    uint8_t wifiSignalPercent, const String &wifiSsid,
    ControllerLinkService &controllerLink, const BsStatusView &bsStatus) {
  const uint32_t currentMs = millis();
  if (!configured_ || !commandPreferencesReady_ || !wifiConnected ||
      !timeSynced || !onlineSentThisBoot_) {
    return;
  }

  if (helpReplyPending_) {
    if (currentMs - helpReplyQueuedAtMs_ > kPendingReplyMaxAgeMs) {
      helpReplyPending_ = false;
      Serial.println(F("[TG] command /help -> expired before reply"));
      return;
    }
    if (currentMs - helpReplyQueuedAtMs_ < kSendSpacingMs ||
        (lastSuccessfulSendAtMs_ != 0 &&
         currentMs - lastSuccessfulSendAtMs_ < kSendSpacingMs) ||
        (lastStatusReplyAttemptAtMs_ != 0 &&
         currentMs - lastStatusReplyAttemptAtMs_ < kRetryIntervalMs)) {
      return;
    }
    lastStatusReplyAttemptAtMs_ = currentMs;
    const bool sent = sendHelp_();
    Serial.print(F("[TG] command /help -> "));
    Serial.println(sent ? F("OK") : F("FAIL"));
    if (sent) {
      helpReplyPending_ = false;
      lastStatusReplyAttemptAtMs_ = 0;
    }
    return;
  }

  if (c3WakeReplyPending_) {
    if (currentMs - c3WakeReplyQueuedAtMs_ > kPendingReplyMaxAgeMs) {
      c3WakeReplyPending_ = false;
      Serial.println(F("[TG] command /c3wkp -> expired before reply"));
      return;
    }
    if (currentMs - c3WakeReplyQueuedAtMs_ < kSendSpacingMs ||
        (lastSuccessfulSendAtMs_ != 0 &&
         currentMs - lastSuccessfulSendAtMs_ < kSendSpacingMs) ||
        (lastStatusReplyAttemptAtMs_ != 0 &&
         currentMs - lastStatusReplyAttemptAtMs_ < kRetryIntervalMs)) {
      return;
    }
    lastStatusReplyAttemptAtMs_ = currentMs;
    const bool sent = sendC3WakeReply_(c3WakeReplyResult_);
    Serial.print(F("[TG] command /c3wkp -> "));
    Serial.println(sent ? F("OK") : F("FAIL"));
    if (sent) {
      c3WakeReplyPending_ = false;
      lastStatusReplyAttemptAtMs_ = 0;
    }
    return;
  }

  if (bsStatusReplyPending_) {
    if (currentMs - bsStatusReplyQueuedAtMs_ > kPendingReplyMaxAgeMs) {
      bsStatusReplyPending_ = false;
      Serial.println(F("[TG] command /bssts -> expired before reply"));
      return;
    }
    if (currentMs - bsStatusReplyQueuedAtMs_ < kSendSpacingMs ||
        (lastSuccessfulSendAtMs_ != 0 &&
         currentMs - lastSuccessfulSendAtMs_ < kSendSpacingMs) ||
        (lastStatusReplyAttemptAtMs_ != 0 &&
         currentMs - lastStatusReplyAttemptAtMs_ < kRetryIntervalMs)) {
      return;
    }
    lastStatusReplyAttemptAtMs_ = currentMs;
    const bool sent = sendBsStatus_(bsStatus, controllerLink);
    Serial.print(F("[TG] command /bssts -> "));
    Serial.println(sent ? F("OK") : F("FAIL"));
    if (sent) {
      bsStatusReplyPending_ = false;
      lastStatusReplyAttemptAtMs_ = 0;
    }
    return;
  }

  if (c3StatusReplyPending_) {
    const bool commandFinished =
        c3RefreshCommandPending_ && controllerLink.commandTerminal() &&
        strcmp(controllerLink.commandSnapshot().command, "STATUS") == 0;
    if (currentMs - c3StatusReplyQueuedAtMs_ > kPendingReplyMaxAgeMs &&
        !commandFinished) {
      c3StatusReplyPending_ = false;
      c3RefreshCommandPending_ = false;
      Serial.println(F("[TG] command /c3sts -> expired before reply"));
      return;
    }
    if (c3RefreshCommandPending_ && !commandFinished) {
      return;
    }
    if (currentMs - c3StatusReplyQueuedAtMs_ < kSendSpacingMs ||
        (lastSuccessfulSendAtMs_ != 0 &&
         currentMs - lastSuccessfulSendAtMs_ < kSendSpacingMs) ||
        (lastStatusReplyAttemptAtMs_ != 0 &&
         currentMs - lastStatusReplyAttemptAtMs_ < kRetryIntervalMs)) {
      return;
    }

    const bool freshTelemetryReceived =
        commandFinished &&
        controllerLink.commandSnapshot().state == ControllerCommandState::Executed &&
        controllerLink.hasTelemetry() &&
        (!c3HadTelemetryAtRequest_ ||
         controllerLink.telemetry().receivedAtMs != c3TelemetryReceivedAtRequestMs_);
    const char *refreshState = freshTelemetryReceived
                                   ? "FRESH"
                                   : (commandFinished
                                          ? controllerLink.commandStateText()
                                          : "CACHED");
    lastStatusReplyAttemptAtMs_ = currentMs;
    const bool sent = sendControllerStatus_(controllerLink, currentMs, wifiRssiDbm,
                                            wifiSignalPercent, wifiSsid,
                                            refreshState);
    Serial.print(F("[TG] command /c3sts -> "));
    Serial.println(sent ? F("OK") : F("FAIL"));
    if (sent) {
      c3StatusReplyPending_ = false;
      lastStatusReplyAttemptAtMs_ = 0;
      if (commandFinished && !controllerLink.clearTerminalCommand()) {
        Serial.println(F("[TG] command /c3sts -> terminal clear failed"));
      }
      c3RefreshCommandPending_ = false;
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

bool TelegramAlertService::sendDeviceOnline_(const String &ipAddress, int wifiRssiDbm,
                                             uint8_t wifiSignalPercent,
                                             const String &wifiSsid, bool timeSynced,
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
                                                  wifiSsid, timeSynced, versionText,
                                                  buildNumber, uptimeText));

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
                                             uint8_t wifiSignalPercent,
                                             const String &wifiSsid, bool timeSynced,
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
                                                  wifiSsid, timeSynced, versionText,
                                                  buildNumber, uptimeText, downtimeMs));

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
    const ControllerLinkService &controllerLink, uint32_t nowMs,
    int wifiRssiDbm, uint8_t wifiSignalPercent, const String &wifiSsid,
    const char *refreshState) {
  return sendStatusMessage_(buildControllerStatusMessage_(
                                controllerLink, nowMs, wifiRssiDbm,
                                wifiSignalPercent, wifiSsid, refreshState),
                            "C3");
}

bool TelegramAlertService::sendBsStatus_(
    const BsStatusView &status, const ControllerLinkService &controllerLink) {
  return sendStatusMessage_(buildBsStatusMessage_(status, controllerLink), "BS");
}

bool TelegramAlertService::sendHelp_() {
  return sendStatusMessage_(buildHelpMessage_(), "Help");
}

bool TelegramAlertService::sendC3WakeReply_(
    ControllerWakeRequestResult result) {
  String message;
  message.reserve(80);
  message += F("🔔 <b>C3 Wake</b>\n");
  switch (result) {
    case ControllerWakeRequestResult::Sent:
      message += F("Wake pulse sent");
      break;
    case ControllerWakeRequestResult::AlreadyAwake:
      message += F("C3 already awake");
      break;
    case ControllerWakeRequestResult::Cooldown:
      message += F("Wake not sent · cooldown <b>10 s</b>");
      break;
    case ControllerWakeRequestResult::Unavailable:
    default:
      message += F("Wake unavailable");
      break;
  }
  return sendStatusMessage_(message, "C3 wake");
}

bool TelegramAlertService::sendStatusMessage_(const String &message,
                                              const char *logLabel) {
  WiFiClientSecure client;
  client.setInsecure();
  client.setHandshakeTimeout(4);
  client.setTimeout(kTelegramHttpTimeoutMs);

  HTTPClient http;
  http.setConnectTimeout(kTelegramHttpTimeoutMs);
  http.setTimeout(kTelegramHttpTimeoutMs);
  String url = String(kTelegramApiBase) + TELEGRAM_BOT_TOKEN + F("/sendMessage");
  if (!http.begin(client, url)) {
    Serial.print(F("[TG] "));
    Serial.print(logLabel);
    Serial.println(F(" HTTP begin failed"));
    return false;
  }

  String payload = F("chat_id=");
  payload += urlEncode_(String(TELEGRAM_CHAT_ID));
  payload += F("&parse_mode=HTML&disable_web_page_preview=true&text=");
  payload += urlEncode_(message);

  http.addHeader(F("Content-Type"), F("application/x-www-form-urlencoded"));
  const int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.print(F("[TG] "));
    Serial.print(logLabel);
    Serial.print(F(" POST -> "));
    Serial.println(httpCode);
    if (httpCode >= 200 && httpCode < 300) {
      lastSuccessfulSendAtMs_ = millis();
      http.end();
      return true;
    }
    const String response = http.getString();
    if (response.length() > 0) {
      Serial.print(F("[TG] "));
      Serial.print(logLabel);
      Serial.print(F(" body -> "));
      Serial.println(response);
    }
  } else {
    Serial.print(F("[TG] "));
    Serial.print(logLabel);
    Serial.print(F(" POST failed -> "));
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
  return false;
}

bool TelegramAlertService::pollCommands_(
    ControllerLinkService &controllerLink) {
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
    const String &response, ControllerLinkService &controllerLink) {
  uint32_t newestUpdateId = lastCommandUpdateId_;
  uint8_t c3StatusRequestCount = 0;
  uint8_t c3WakeRequestCount = 0;
  uint8_t bsStatusRequestCount = 0;
  uint8_t helpRequestCount = 0;
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

    if (isC3StatusCommand(command)) {
      if (c3StatusRequestCount < UINT8_MAX) {
        ++c3StatusRequestCount;
      }
    } else if (isC3WakeCommand(command)) {
      if (c3WakeRequestCount < UINT8_MAX) {
        ++c3WakeRequestCount;
      }
    } else if (isBsStatusCommand(command)) {
      if (bsStatusRequestCount < UINT8_MAX) {
        ++bsStatusRequestCount;
      }
    } else if (isHelpCommand(command)) {
      if (helpRequestCount < UINT8_MAX) {
        ++helpRequestCount;
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

  if (helpRequestCount > 1) {
    Serial.print(F("[TG] command coalesced -> /help x"));
    Serial.println(helpRequestCount);
  }
  if (helpRequestCount > 0) {
    helpReplyPending_ = true;
    helpReplyQueuedAtMs_ = millis();
    Serial.println(F("[TG] command /help -> queued"));
  }

  if (bsStatusRequestCount > 1) {
    Serial.print(F("[TG] command coalesced -> /bssts x"));
    Serial.println(bsStatusRequestCount);
  }
  if (bsStatusRequestCount > 0) {
    bsStatusReplyPending_ = true;
    bsStatusReplyQueuedAtMs_ = millis();
    Serial.println(F("[TG] command /bssts -> queued"));
  }

  if (c3WakeRequestCount > 1) {
    Serial.print(F("[TG] command coalesced -> /c3wkp x"));
    Serial.println(c3WakeRequestCount);
  }
  if (c3WakeRequestCount > 0) {
    const ControllerWakeRequestResult wakeResult =
        controllerLink.requestWakePulse(millis());
    c3WakeReplyResult_ = wakeResult;
    c3WakeReplyPending_ = true;
    c3WakeReplyQueuedAtMs_ = millis();
    lastStatusReplyAttemptAtMs_ = 0;
    Serial.print(F("[TG] command /c3wkp -> queued "));
    Serial.println(wakeResult == ControllerWakeRequestResult::Sent
                       ? F("wake")
                       : F("reply"));
  }

  if (c3StatusRequestCount > 1) {
    Serial.print(F("[TG] command coalesced -> /c3sts x"));
    Serial.println(c3StatusRequestCount);
  }
  if (c3StatusRequestCount == 0) {
    return;
  }

  c3RefreshCommandPending_ = false;
  c3HadTelemetryAtRequest_ = controllerLink.hasTelemetry();
  c3TelemetryReceivedAtRequestMs_ = c3HadTelemetryAtRequest_
                                        ? controllerLink.telemetry().receivedAtMs
                                        : 0;
  if (controllerLink.isOnline() && controllerLink.commandPersistenceReady()) {
    if (controllerLink.commandTerminal() && !controllerLink.clearTerminalCommand()) {
      Serial.println(F("[TG] command /c3sts -> terminal clear failed, cached reply"));
    }
    if (!controllerLink.hasCommand()) {
      c3RefreshCommandPending_ = controllerLink.queueStatusCommand();
    } else if (!controllerLink.commandTerminal() &&
               strcmp(controllerLink.commandSnapshot().command, "STATUS") == 0) {
      c3RefreshCommandPending_ = true;
    }
  }
  c3StatusReplyPending_ = true;
  c3StatusReplyQueuedAtMs_ = millis();
  lastStatusReplyAttemptAtMs_ = 0;
  Serial.print(F("[TG] command /c3sts -> queued "));
  Serial.println(c3RefreshCommandPending_ ? F("fresh") : F("cached"));
}

String TelegramAlertService::buildDeviceOnlineMessage_(const String &ipAddress, int wifiRssiDbm,
                                                       uint8_t wifiSignalPercent,
                                                       const String &wifiSsid,
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
  message += F(" dBm) ");
  message += htmlEscape_(wifiSsid.isEmpty() ? String("unknown") : wifiSsid);
  message += '\n';
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
                                                       const String &wifiSsid,
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
  message += F(" dBm) ");
  message += htmlEscape_(wifiSsid.isEmpty() ? String("unknown") : wifiSsid);
  message += '\n';
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
    const ControllerLinkService &controllerLink, uint32_t nowMs,
    int wifiRssiDbm, uint8_t wifiSignalPercent, const String &wifiSsid,
    const char *refreshState) const {
  const ControllerTelemetrySnapshot &telemetry = controllerLink.telemetry();
  String message;
  message.reserve(512);
  message += F("🔗 <b>C3 Controller</b>\n");
  message += F("Link: <b>");
  message += htmlEscape_(String(controllerLink.stateText()));
  message += F("</b> · build <code>");
  message += String(controllerLink.remoteBuild());
  message += F("</code>\n");
  message += F("Wi-Fi: <b>");
  message += String(wifiSignalPercent);
  message += F("%</b> (");
  message += String(wifiRssiDbm);
  message += F(" dBm) ");
  message += htmlEscape_(wifiSsid.isEmpty() ? String("unknown") : wifiSsid);
  message += '\n';
  if (refreshState != nullptr) {
    if (strcmp(refreshState, "FRESH") == 0) {
      message += F("Data: <b>Fresh</b>\n");
    } else if (strcmp(refreshState, "CACHED") == 0) {
      message += F("Data: <b>Cached</b>\n");
    } else {
      message += F("Data: <b>Cached</b> · refresh <b>");
      message += htmlEscape_(String(refreshState));
      message += F("</b>\n");
    }
  }
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
  if (telemetry.gpsFixed) {
    const String latitude = formatGpsCoordinate(telemetry.gpsLatitudeMicrodegrees);
    const String longitude = formatGpsCoordinate(telemetry.gpsLongitudeMicrodegrees);
    message += F("\n\n📍 <a href=\"https://www.google.com/maps/search/?api=1&amp;query=");
    message += latitude;
    message += F("%2C");
    message += longitude;
    message += F("\">Google Maps</a>\nGPS: <b>");
    message += telemetry.gpsSatellites;
    message += F(" sat</b> · HDOP <b>");
    message += String(telemetry.gpsHdopTenths / 10.0F, 1);
    message += F("</b> · age <b>");
    message += gpsFixAgeText(telemetry.gpsFixEpoch);
    message += F("</b>");
  }
  return message;
}

String TelegramAlertService::buildBsStatusMessage_(
    const BsStatusView &status,
    const ControllerLinkService &controllerLink) const {
  String message;
  message.reserve(640);
  message += F("🔊 <b>BS Controller</b>\n");
  message += F("State: <b>Online</b>\n");
  message += F("Version: <code>");
  message += htmlEscape_(String(status.versionText));
  message += F("</code> build <code>");
  message += String(status.buildNumber);
  message += F("</code>\n");
  message += F("Uptime: ");
  message += htmlEscape_(status.uptimeText);
  message += F("\n\nWi-Fi: <b>");
  message += String(status.wifiSignalPercent);
  message += F("%</b> (");
  message += String(status.wifiRssiDbm);
  message += F(" dBm) ");
  message += htmlEscape_(status.wifiSsid.isEmpty() ? String("unknown")
                                                   : status.wifiSsid);
  message += F("\nIP: <code>");
  message += htmlEscape_(status.ipAddress.isEmpty() ? String("0.0.0.0")
                                                    : status.ipAddress);
  message += F("</code>\nTime: <b>");
  message += status.timeSynced ? F("Synced") : F("Waiting");
  message += F("</b>\n\nSound (relative): Now <b>");
  message += String(status.currentLevel);
  message += F("</b> · H ");
  if (status.hourSamplesCollected >= 3600U) {
    message += F("<b>");
    message += String(status.hourAverage);
    message += F("</b>");
  } else {
    message += F("<b>Warmup ");
    message += String(status.hourSamplesCollected / 60U);
    message += F("/60 min</b>");
  }
  message += F(" · M <b>");
  message += String(status.totalAverage);
  message += F("</b>\nPeriod: <b>");
  message += htmlEscape_(String(status.dayPartText));
  message += F("</b> · Level: <b>");
  message += htmlEscape_(String(status.noiseLevelText));
  message += F("</b>\nSignal: <b>");
  message += htmlEscape_(String(status.signalStateText));
  message += F("</b>\nEnvironment: ");
  if (status.environmentAvailable) {
    message += F("<b>");
    message += String(status.temperatureC, 1);
    message += F(" °C</b> / <b>");
    message += String(status.humidityPct, 1);
    message += F("%</b>");
  } else {
    message += F("<b>Waiting</b>");
  }
  message += F("\n\nCloud: WQTT <b>");
  message += status.wqttConnected ? F("OK") : F("OFF");
  message += F("</b> · Sheets queue <b>");
  message += String(status.googleSheetsQueue);
  message += F("</b>\nC3 link: <b>");
  message += htmlEscape_(String(controllerLink.stateText()));
  message += F("</b>");
  if (controllerLink.hasTelemetry()) {
    message += F(" · telemetry age <b>");
    message += String(controllerLink.telemetryAgeSeconds(millis()));
    message += F(" s</b>");
  }
  appendLinks(message, status.ipAddress);
  return message;
}

String TelegramAlertService::buildHelpMessage_() const {
  String message;
  message.reserve(2200);
  message += F("📘 <b>BS + C3 · Помощь / Help</b>\n\n");
  message += F("<b>Команды / Commands</b>\n");
  message += F("<code>/bssts</code> — состояние BS / BS status\n");
  message += F("<code>/c3sts</code> — питание и состояние C3 / C3 power and status\n");
  message += F("<code>/c3wkp</code> — пробудить C3 / Wake C3\n");

  message += F("\n🔊 <b>BS Controller</b>\n");
  message += F("State — состояние BS / operating state\n");
  message += F("Version, Uptime — прошивка и время работы / firmware and uptime\n");
  message += F("Wi-Fi, IP, Time — сеть и синхронизация / network and time\n");
  message += F("Now, H, M — текущий, часовой, общий относительный шум / current, hourly, total relative sound (not dB)\n");
  message += F("Period, Level, Signal — период, уровень и микрофон / period, level and microphone health\n");
  message += F("Environment — температура и влажность / temperature and humidity\n");
  message += F("Cloud — WQTT и очередь Sheets / WQTT and Sheets queue\n");
  message += F("C3 link — связь с C3 / C3 connection\n");

  message += F("\n🔗 <b>C3 Controller</b>\n");
  message += F("Link, build — связь и прошивка / link and firmware\n");
  message += F("Data, Telemetry age — свежесть и возраст данных / freshness and data age\n");
  message += F("INA3221 — состояние измерителя питания / power monitor health\n");
  message += F("Solar, Battery, Load — панель, аккумулятор, нагрузка / solar, battery and load\n");
  message += F("Charge, Mode — зарядка и режим управления / charging and control mode\n");
  message += F("GPS — сохранённое местоположение / saved location\n");

  message += F("\n<b>Link / Data</b>\n");
  message += F("OK — C3 работает, связь активна / C3 online\n");
  message += F("SLP — штатный Deep Sleep / normal Deep Sleep\n");
  message += F("WAIT — ожидание пробуждения или ответа / waiting for wake or reply\n");
  message += F("OFF — давно нет корректного ответа / no valid response\n");
  message += F("Fresh — получены новые данные / new data received\n");
  message += F("Cached — последние сохранённые данные; нормально во сне / last saved data; normal during sleep\n");

  message += F("\nПосле <code>/c3wkp</code> дождитесь сообщения C3 Online, затем используйте <code>/c3sts</code>. / After <code>/c3wkp</code>, wait for C3 Online, then use <code>/c3sts</code>.\n");
  message += F("Настройки C3 доступны только администратору. / C3 settings are admin-only.");
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
