#include "wifi_service.h"

#include <WiFi.h>

#include "secrets.h"

namespace {

const char *wifiStatusText(wl_status_t status) {
  switch (status) {
    case WL_CONNECTED:
      return "OK";
    case WL_NO_SSID_AVAIL:
      return "NOAP";
    case WL_CONNECT_FAILED:
      return "FAIL";
    case WL_CONNECTION_LOST:
      return "LOST";
    case WL_DISCONNECTED:
      return "DISC";
    case WL_IDLE_STATUS:
      return "IDLE";
    default:
      return "WAIT";
  }
}

}  // namespace

void WifiService::begin() {
  configured_ = strlen(WIFI_SSID) > 0;
  lastStatusCode_ = -1;
  announcedIp_ = false;
  lastReconnectAttemptAt_ = 0;
  lastSignalRefreshAt_ = 0;
  cachedRssiDbm_ = -127;
  cachedSignalPercent_ = 0;

  if (!configured_) {
    Serial.println(F("[WF] OFF -> WIFI_SSID is empty in secrets.h"));
    WiFi.mode(WIFI_OFF);
    return;
  }

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(true);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  Serial.print(F("[WF] begin -> "));
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void WifiService::update() {
  if (!configured_) {
    return;
  }

  unsigned long nowMs = millis();
  wl_status_t status = WiFi.status();
  const bool connected = status == WL_CONNECTED;
  const bool statusChanged = status != lastStatusCode_;
  if (statusChanged) {
    lastStatusCode_ = status;
    Serial.print(F("[WF] status -> "));
    Serial.print(wifiStatusText(status));
    Serial.print(F(" ("));
    Serial.print(static_cast<int>(status));
    Serial.println(')');
  }

  refreshSignalCache(connected, statusChanged);

  if (connected && !announcedIp_) {
    announcedIp_ = true;
    Serial.print(F("[WF] ip -> "));
    Serial.println(WiFi.localIP());
    refreshSignalCache(true, true);
  } else if (!connected) {
    announcedIp_ = false;
    refreshSignalCache(false, true);
    if (nowMs - lastReconnectAttemptAt_ >= kReconnectIntervalMs &&
        (status == WL_DISCONNECTED || status == WL_CONNECTION_LOST ||
         status == WL_CONNECT_FAILED || status == WL_NO_SSID_AVAIL)) {
      lastReconnectAttemptAt_ = nowMs;
      Serial.println(F("[WF] reconnect -> WiFi.reconnect()"));
      WiFi.disconnect(false, false);
      WiFi.reconnect();
    }
  }
}

bool WifiService::isConfigured() const {
  return configured_;
}

bool WifiService::isConnected() const {
  return configured_ && WiFi.status() == WL_CONNECTED;
}

const __FlashStringHelper *WifiService::statusText() const {
  if (!configured_) {
    return F("OFF");
  }

  switch (WiFi.status()) {
    case WL_CONNECTED:
      return F("OK");
    case WL_NO_SSID_AVAIL:
      return F("NOAP");
    case WL_CONNECT_FAILED:
      return F("FAIL");
    case WL_CONNECTION_LOST:
      return F("LOST");
    case WL_DISCONNECTED:
      return F("DISC");
    case WL_IDLE_STATUS:
      return F("IDLE");
    default:
      return F("WAIT");
  }
}

String WifiService::ipAddressString() const {
  if (!isConnected()) {
    return String();
  }
  return WiFi.localIP().toString();
}

int WifiService::rssiDbm() const {
  if (!isConnected()) {
    return -127;
  }
  return cachedRssiDbm_;
}

uint8_t WifiService::signalPercent() const {
  if (!isConnected()) {
    return 0;
  }

  return cachedSignalPercent_;
}

void WifiService::refreshSignalCache(bool connected, bool force) {
  unsigned long nowMs = millis();
  if (!connected) {
    cachedRssiDbm_ = -127;
    cachedSignalPercent_ = 0;
    lastSignalRefreshAt_ = nowMs;
    return;
  }

  if (!force && lastSignalRefreshAt_ != 0 &&
      nowMs - lastSignalRefreshAt_ < kSignalRefreshIntervalMs) {
    return;
  }

  int rssi = WiFi.RSSI();
  cachedRssiDbm_ = rssi;
  if (rssi <= -100) {
    cachedSignalPercent_ = 0;
  } else if (rssi >= -50) {
    cachedSignalPercent_ = 100;
  } else {
    cachedSignalPercent_ = static_cast<uint8_t>((rssi + 100) * 2);
  }
  lastSignalRefreshAt_ = nowMs;
}

int WifiService::statusCode() const {
  return lastStatusCode_;
}

const char *WifiService::statusTextCStr() const {
  if (!configured_) {
    return "OFF";
  }
  return wifiStatusText(WiFi.status());
}
