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

  if (!configured_) {
    Serial.println(F("[WF] OFF -> WIFI_SSID is empty in secrets.h"));
    WiFi.mode(WIFI_OFF);
    return;
  }

  WiFi.mode(WIFI_STA);
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
  if (status != lastStatusCode_) {
    lastStatusCode_ = status;
    Serial.print(F("[WF] status -> "));
    Serial.print(wifiStatusText(status));
    Serial.print(F(" ("));
    Serial.print(static_cast<int>(status));
    Serial.println(')');
  }

  if (status == WL_CONNECTED && !announcedIp_) {
    announcedIp_ = true;
    Serial.print(F("[WF] ip -> "));
    Serial.println(WiFi.localIP());
  } else if (status != WL_CONNECTED) {
    announcedIp_ = false;
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
  return WiFi.RSSI();
}

uint8_t WifiService::signalPercent() const {
  if (!isConnected()) {
    return 0;
  }

  int rssi = WiFi.RSSI();
  if (rssi <= -100) {
    return 0;
  }
  if (rssi >= -50) {
    return 100;
  }
  return static_cast<uint8_t>((rssi + 100) * 2);
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
