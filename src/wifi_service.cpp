#include "wifi_service.h"

#include <WiFi.h>
#include <stddef.h>

#include "secrets.h"

#ifndef WIFI_SETUP_AP_PASSWORD
#error "Define WIFI_SETUP_AP_PASSWORD in include/secrets.h"
#endif

namespace {

constexpr char kWifiPreferencesNamespace[] = "wifi_cfg";
constexpr char kWifiProfileKey[] = "profile";
constexpr uint32_t kWifiProfileMagic = 0x42535746UL;

struct WifiCredentialRecord {
  uint32_t magic = 0;
  char ssid[33] = {};
  char password[65] = {};
  uint32_t checksum = 0;
};

uint32_t profileChecksum(const WifiCredentialRecord &record) {
  const auto *bytes = reinterpret_cast<const uint8_t *>(&record);
  uint32_t hash = 2166136261UL;
  for (size_t index = 0; index < offsetof(WifiCredentialRecord, checksum); ++index) {
    hash ^= bytes[index];
    hash *= 16777619UL;
  }
  return hash;
}

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

void WifiService::begin(uint8_t setupButtonPin) {
  lastStatusCode_ = -1;
  announcedIp_ = false;
  lastReconnectAttemptAt_ = 0;
  lastSignalRefreshAt_ = 0;
  stationConnectionStartedAt_ = 0;
  cachedRssiDbm_ = -127;
  cachedSignalPercent_ = 0;
  setupState_ = WifiSetupState::Inactive;

  preferencesReady_ = preferences_.begin(kWifiPreferencesNamespace, false);
  usingSavedProfile_ = preferencesReady_ && loadSavedProfile();
  if (!usingSavedProfile_) {
    activeSsid_ = WIFI_SSID;
    activePassword_ = WIFI_PASSWORD;
  }
  configured_ = !activeSsid_.isEmpty();

  if (setupRequestedAtBoot(setupButtonPin)) {
    startSetupAccessPoint();
    if (isSetupActive()) {
      return;
    }
  }

  if (!configured_) {
    Serial.println(F("[WF] OFF -> no saved or default Wi-Fi profile"));
    WiFi.mode(WIFI_OFF);
    return;
  }

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(true);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  beginStationConnection(activeSsid_, activePassword_);
}

void WifiService::update() {
  if (!configured_ && !isSetupActive()) {
    return;
  }

  unsigned long nowMs = millis();
  wl_status_t status = WiFi.status();

  if (isSetupActive()) {
    if (setupState_ == WifiSetupState::Testing) {
      if (status == WL_CONNECTED && WiFi.SSID() == candidateSsid_) {
        if (saveCandidateProfile()) {
          activeSsid_ = candidateSsid_;
          activePassword_ = candidatePassword_;
          candidateSsid_ = String();
          candidatePassword_ = String();
          configured_ = true;
          usingSavedProfile_ = true;
          defaultFallbackTried_ = false;
          setupState_ = WifiSetupState::Saved;
          setupRestartAt_ = nowMs + kSetupRestartDelayMs;
          Serial.println(F("[WF] setup -> connection verified, profile saved"));
        } else {
          setupState_ = WifiSetupState::SaveFailed;
          Serial.println(F("[WF] setup -> profile save failed, previous profile restored"));
          rollbackCandidate();
        }
      } else if (nowMs - setupConnectionStartedAt_ >= kSetupConnectionTimeoutMs) {
        setupState_ = WifiSetupState::Failed;
        Serial.println(F("[WF] setup -> connection failed, previous profile restored"));
        rollbackCandidate();
      }
    } else if (setupState_ == WifiSetupState::Saved &&
               static_cast<long>(nowMs - setupRestartAt_) >= 0) {
      ESP.restart();
    }

    if (setupState_ != WifiSetupState::Saved &&
        nowMs - setupStartedAt_ >= kSetupWindowMs) {
      Serial.println(F("[WF] setup -> 10 min window closed"));
      if (setupState_ == WifiSetupState::Testing) {
        rollbackCandidate();
      }
      stopSetupAccessPoint();
      status = WiFi.status();
    }
  }

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

    if (!isSetupActive() && usingSavedProfile_ && !defaultFallbackTried_ &&
        stationConnectionStartedAt_ != 0 &&
        nowMs - stationConnectionStartedAt_ >= kSavedProfileFallbackMs) {
      defaultFallbackTried_ = true;
      if (strlen(WIFI_SSID) > 0 && activeSsid_ != WIFI_SSID) {
        Serial.println(F("[WF] saved profile unavailable -> default recovery"));
        usingSavedProfile_ = false;
        activeSsid_ = WIFI_SSID;
        activePassword_ = WIFI_PASSWORD;
        configured_ = true;
        beginStationConnection(activeSsid_, activePassword_);
        return;
      }
    }

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

bool WifiService::isConnected() const {
  return configured_ && WiFi.status() == WL_CONNECTED;
}

String WifiService::ipAddressString() const {
  if (!isConnected()) {
    return String();
  }
  return WiFi.localIP().toString();
}

String WifiService::ssidString() const {
  if (!isConnected()) {
    return String();
  }
  return WiFi.SSID();
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

bool WifiService::isSetupActive() const {
  return setupState_ != WifiSetupState::Inactive;
}

WifiSetupState WifiService::setupState() const {
  return setupState_;
}

String WifiService::setupApSsid() const {
  return setupApSsid_;
}

bool WifiService::submitSetupCredentials(const String &ssid, const String &password) {
  if (!isSetupActive() || setupState_ == WifiSetupState::Testing ||
      setupState_ == WifiSetupState::Saved) {
    return false;
  }

  if (ssid.isEmpty() || ssid.length() > 32 || password.length() > 63 ||
      (!password.isEmpty() && password.length() < 8)) {
    setupState_ = WifiSetupState::Invalid;
    return false;
  }

  candidateSsid_ = ssid;
  candidatePassword_ = password;
  setupState_ = WifiSetupState::Testing;
  setupConnectionStartedAt_ = millis();
  WiFi.disconnect(false, false);
  beginStationConnection(candidateSsid_, candidatePassword_);
  Serial.println(F("[WF] setup -> testing submitted profile"));
  return true;
}

bool WifiService::setupRequestedAtBoot(uint8_t pin) const {
  pinMode(pin, INPUT_PULLUP);
  if (digitalRead(pin) != LOW) {
    return false;
  }

  const unsigned long startedAt = millis();
  Serial.println(F("[WF] setup request -> keep button pressed for 5 s"));
  while (digitalRead(pin) == LOW) {
    if (millis() - startedAt >= kSetupButtonHoldMs) {
      return true;
    }
    delay(10);
  }
  Serial.println(F("[WF] setup request cancelled"));
  return false;
}

bool WifiService::loadSavedProfile() {
  if (preferences_.getBytesLength(kWifiProfileKey) != sizeof(WifiCredentialRecord)) {
    return false;
  }

  WifiCredentialRecord record;
  if (preferences_.getBytes(kWifiProfileKey, &record, sizeof(record)) != sizeof(record) ||
      record.magic != kWifiProfileMagic || record.checksum != profileChecksum(record) ||
      record.ssid[0] == '\0') {
    return false;
  }
  record.ssid[sizeof(record.ssid) - 1] = '\0';
  record.password[sizeof(record.password) - 1] = '\0';
  activeSsid_ = record.ssid;
  activePassword_ = record.password;
  return true;
}

bool WifiService::saveCandidateProfile() {
  if (!preferencesReady_) {
    return false;
  }

  WifiCredentialRecord record;
  record.magic = kWifiProfileMagic;
  candidateSsid_.toCharArray(record.ssid, sizeof(record.ssid));
  candidatePassword_.toCharArray(record.password, sizeof(record.password));
  record.checksum = profileChecksum(record);
  return preferences_.putBytes(kWifiProfileKey, &record, sizeof(record)) == sizeof(record);
}

void WifiService::beginStationConnection(const String &ssid, const String &password) {
  stationConnectionStartedAt_ = millis();
  lastReconnectAttemptAt_ = stationConnectionStartedAt_;
  announcedIp_ = false;
  Serial.print(F("[WF] begin -> "));
  Serial.println(ssid);
  WiFi.begin(ssid.c_str(), password.c_str());
}

void WifiService::startSetupAccessPoint() {
  const size_t apPasswordLength = strlen(WIFI_SETUP_AP_PASSWORD);
  if (apPasswordLength < 8 || apPasswordLength > 63) {
    Serial.println(F("[WF] setup unavailable -> AP password length must be 8..63"));
    return;
  }

  WiFi.mode(WIFI_AP_STA);
  WiFi.setSleep(true);
  WiFi.setAutoReconnect(false);
  WiFi.persistent(false);

  char suffix[5];
  snprintf(suffix, sizeof(suffix), "%04X",
           static_cast<uint16_t>(ESP.getEfuseMac() & 0xFFFFU));
  setupApSsid_ = String(F("BS-Setup-")) + suffix;
  if (!WiFi.softAP(setupApSsid_.c_str(), WIFI_SETUP_AP_PASSWORD)) {
    Serial.println(F("[WF] setup unavailable -> AP start failed"));
    WiFi.mode(WIFI_STA);
    return;
  }

  setupState_ = WifiSetupState::Ready;
  setupStartedAt_ = millis();
  Serial.print(F("[WF] setup AP ready -> "));
  Serial.print(setupApSsid_);
  Serial.print(F(" at http://"));
  Serial.println(WiFi.softAPIP());

  if (configured_) {
    beginStationConnection(activeSsid_, activePassword_);
  }
}

void WifiService::stopSetupAccessPoint() {
  candidateSsid_ = String();
  candidatePassword_ = String();
  setupApSsid_ = String();
  setupState_ = WifiSetupState::Inactive;
  WiFi.softAPdisconnect(true);
  if (!configured_) {
    WiFi.mode(WIFI_OFF);
    return;
  }
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  beginStationConnection(activeSsid_, activePassword_);
}

void WifiService::rollbackCandidate() {
  candidateSsid_ = String();
  candidatePassword_ = String();
  WiFi.disconnect(false, false);
  if (configured_) {
    beginStationConnection(activeSsid_, activePassword_);
  }
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

const char *WifiService::statusTextCStr() const {
  if (!configured_) {
    return "OFF";
  }
  return wifiStatusText(WiFi.status());
}
