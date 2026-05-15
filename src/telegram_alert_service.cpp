#include "telegram_alert_service.h"

#include <HTTPClient.h>
#include <WiFiClientSecure.h>

#include "secrets.h"

namespace {

constexpr char kTelegramApiBase[] = "https://api.telegram.org/bot";
constexpr char kStatisticsUrl[] =
    "https://docs.google.com/spreadsheets/d/1DoGf95IYo3rvIdwAnyHVe2r0lP1txKe3gYVbe3XIMUQ/edit?pli=1&gid=1674242943#gid=1674242943";

}  // namespace

void TelegramAlertService::begin() {
  configured_ = strlen(TELEGRAM_BOT_TOKEN) > 0 && strlen(TELEGRAM_CHAT_ID) > 0;
  onlineSentThisBoot_ = false;
  wifiWasConnected_ = false;
  restorePending_ = false;
  wifiConnectedSinceMs_ = 0;
  wifiLostAtMs_ = 0;
  restoreDowntimeMs_ = 0;
  lastAttemptAtMs_ = 0;

  if (configured_) {
    Serial.println(F("[TG] ready -> Telegram online alert configured"));
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

bool TelegramAlertService::isConfigured() const {
  return configured_;
}

bool TelegramAlertService::sendDeviceOnline_(const String &ipAddress, int wifiRssiDbm,
                                             uint8_t wifiSignalPercent, bool timeSynced,
                                             const char *versionText, uint32_t buildNumber,
                                             const String &uptimeText) {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
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

  HTTPClient http;
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
  message += F("\n\n🔗 <a href=\"");
  message += kStatisticsUrl;
  message += F("\">Online Statistics</a>");
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
  message += F("\n\n🔗 <a href=\"");
  message += kStatisticsUrl;
  message += F("\">Online Statistics</a>");
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
