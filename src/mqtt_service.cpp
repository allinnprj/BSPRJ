#include "mqtt_service.h"

#include <HTTPClient.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

#include "secrets.h"

namespace {

constexpr unsigned long kReconnectIntervalMs = 10000UL;
constexpr unsigned long kWqttStatusPublishIntervalMs = 60000UL;
constexpr unsigned long kWqttLivePublishIntervalMs = 10000UL;
constexpr unsigned long kWqttPeriodPublishIntervalMs = 120000UL;
constexpr unsigned long kFastPublishIntervalMs = 60UL * 60UL * 1000UL;
constexpr unsigned long kSlowPublishIntervalMs = 6UL * 60UL * 60UL * 1000UL;
constexpr unsigned long kTextPublishIntervalMs = 60UL * 60UL * 1000UL;
constexpr char kWqttTopicRoot[] = "bs/devices";
constexpr char kDatacakeApiBaseUrl[] = "https://api.datacake.co/v1/devices/";
constexpr char kFieldNowPct[] = "NOW_PCT";
constexpr char kFieldHourPct[] = "HOUR_PCT";
constexpr char kFieldMeanPct[] = "MEAN_PCT";
constexpr char kFieldCurrentPeriod[] = "CURRENT_PERIOD";
constexpr char kFieldCurrentPeriodPct[] = "CURRENT_PERIOD_PCT";
constexpr char kFieldDayPct[] = "DAY_PCT";
constexpr char kFieldEveningPct[] = "EVENING_PCT";
constexpr char kFieldNightPct[] = "NIGHT_PCT";
constexpr char kFieldOnline[] = "ONLINE";
constexpr char kFieldWifiPct[] = "WIFI_PCT";
constexpr char kFieldSignalState[] = "SIGNAL_STATE";
constexpr char kFieldLastUpdateTs[] = "LAST_UPDATE_TS";
constexpr char kFieldUptimeMin[] = "UPTIME_MIN";
constexpr char kFieldUptimeHours[] = "UPTIME_HOURS";
constexpr char kFieldUptimeDate[] = "UPTIME_DATE";
constexpr char kFieldTemperatureC[] = "TEMPERATURE_C";
constexpr char kFieldHumidityPct[] = "HUMIDITY_PCT";

WiFiClient mqttWifiClient;
WiFiClient wqttWifiClient;
PubSubClient wqttClient(wqttWifiClient);

}  // namespace

MqttService::MqttService() = default;

void MqttService::begin() {
  wqttConfigured_ = strlen(MQTT_HOST) > 0 && strlen(DEVICE_ID) > 0;
  datacakeConfigured_ = strlen(DATACAKE_ACCESS_TOKEN) > 0 &&
                        strlen(DATACAKE_PRODUCT_SLUG) > 0 &&
                        strlen(DATACAKE_DEVICE_ID) > 0;
  datacakeHttpActive_ = false;
  wqttAnnouncedOffline_ = false;
  datacakeAnnouncedOffline_ = false;
  lastWqttConnectAttemptAt_ = 0;
  lastDatacakeConnectAttemptAt_ = 0;
  lastDatacakePublishedPeriod_ = "";
  markAllPublishDue();

  if (wqttConfigured_) {
    wqttBaseTopic_ = String(kWqttTopicRoot) + "/" + DEVICE_ID;
    wqttClientId_ = String(DEVICE_ID) + "-wqtt";
    wqttWillTopic_ = wqttTopic("status/online");

    wqttClient.setServer(MQTT_HOST, MQTT_PORT);
    wqttClient.setKeepAlive(30);
    wqttClient.setSocketTimeout(5);
    wqttClient.setBufferSize(512);

    Serial.print(F("[MQTT] WQTT ready -> "));
    Serial.print(MQTT_HOST);
    Serial.print(':');
    Serial.println(MQTT_PORT);
  } else {
    Serial.println(F("[MQTT] WQTT OFF -> MQTT_HOST or DEVICE_ID is empty in secrets.h"));
  }

  if (datacakeConfigured_) {
    publishTopicPrefix_ = String(kDatacakeApiBaseUrl) + DATACAKE_DEVICE_ID +
                          "/record/?batch=true";
    Serial.println(F("[MQTT] Datacake HTTP ready"));
  } else {
    Serial.println(F("[MQTT] Datacake OFF -> token/product/device is missing in secrets.h"));
  }
}

void MqttService::update(bool wifiConnected, const MqttRuntimeState &state) {
  if (!wqttConfigured_ && !datacakeConfigured_) {
    return;
  }

  connectWqttIfNeeded(wifiConnected);
  connectDatacakeIfNeeded(wifiConnected);

  if (wqttConfigured_) {
    wqttClient.loop();
  }

  unsigned long nowMs = millis();
  if (wqttClient.connected()) {
    if (lastWqttStatusPublishAt_ == 0 ||
        nowMs - lastWqttStatusPublishAt_ >= kWqttStatusPublishIntervalMs) {
      publishWqttStatus(state);
      lastWqttStatusPublishAt_ = nowMs;
    }

    if (lastWqttLivePublishAt_ == 0 ||
        nowMs - lastWqttLivePublishAt_ >= kWqttLivePublishIntervalMs) {
      publishWqttLiveMetrics(state);
      lastWqttLivePublishAt_ = nowMs;
    }

    if (lastWqttPeriodPublishAt_ == 0 ||
        nowMs - lastWqttPeriodPublishAt_ >= kWqttPeriodPublishIntervalMs) {
      publishWqttPeriodMetrics(state);
      lastWqttPeriodPublishAt_ = nowMs;
    }
  }

  if (datacakeConfigured_ && wifiConnected) {
    publishDatacakeCurrentPeriodIfNeeded(state, false);

    if (lastDatacakeFastPublishAt_ == 0 ||
        nowMs - lastDatacakeFastPublishAt_ >= kFastPublishIntervalMs) {
      publishDatacakeFastMetrics(state);
      lastDatacakeFastPublishAt_ = nowMs;
    }

    if (lastDatacakeSlowPublishAt_ == 0 ||
        nowMs - lastDatacakeSlowPublishAt_ >= kSlowPublishIntervalMs) {
      publishDatacakeSlowMetrics(state);
      lastDatacakeSlowPublishAt_ = nowMs;
    }

    if (lastDatacakeTextPublishAt_ == 0 ||
        nowMs - lastDatacakeTextPublishAt_ >= kTextPublishIntervalMs) {
      publishDatacakeTextMetrics(state);
      lastDatacakeTextPublishAt_ = nowMs;
    }
  }
}

bool MqttService::isConfigured() const {
  return wqttConfigured_ || datacakeConfigured_;
}

bool MqttService::isConnected() const {
  return (wqttConfigured_ && wqttClient.connected()) ||
         datacakeConfigured_;
}

void MqttService::connectWqttIfNeeded(bool wifiConnected) {
  if (!wqttConfigured_ || !wifiConnected || wqttClient.connected()) {
    return;
  }

  unsigned long nowMs = millis();
  if (lastWqttConnectAttemptAt_ != 0 &&
      nowMs - lastWqttConnectAttemptAt_ < kReconnectIntervalMs) {
    return;
  }
  lastWqttConnectAttemptAt_ = nowMs;

  Serial.print(F("[MQTT] WQTT connect -> "));
  Serial.println(MQTT_HOST);

  bool connected = false;
  if (strlen(MQTT_USER) > 0) {
    connected = wqttClient.connect(wqttClientId_.c_str(), MQTT_USER, MQTT_PASSWORD,
                                   wqttWillTopic_.c_str(), 0, true, "false");
  } else {
    connected = wqttClient.connect(wqttClientId_.c_str(), wqttWillTopic_.c_str(), 0,
                                   true, "false");
  }

  if (!connected) {
    Serial.print(F("[MQTT] WQTT connect failed -> state "));
    Serial.println(wqttClient.state());
    return;
  }

  Serial.println(F("[MQTT] WQTT connected"));
  publishWqttOnlineStatus(true);
  lastWqttStatusPublishAt_ = 0;
  lastWqttLivePublishAt_ = 0;
  lastWqttPeriodPublishAt_ = 0;
}

void MqttService::connectDatacakeIfNeeded(bool wifiConnected) {
  if (!datacakeConfigured_ || !wifiConnected || datacakeHttpActive_) {
    return;
  }

  unsigned long nowMs = millis();
  if (lastDatacakeConnectAttemptAt_ != 0 &&
      nowMs - lastDatacakeConnectAttemptAt_ < kReconnectIntervalMs) {
    return;
  }
  lastDatacakeConnectAttemptAt_ = nowMs;

  Serial.println(F("[MQTT] Datacake HTTP active"));
  datacakeHttpActive_ = true;
  lastDatacakePublishedPeriod_ = "";
  markAllPublishDue();
}

void MqttService::publishWqttOnlineStatus(bool online) {
  if (!wqttConfigured_) {
    return;
  }

  if (publishWqttText("status/online", online ? "true" : "false", true)) {
    wqttAnnouncedOffline_ = !online;
  }
}

void MqttService::publishDatacakeOnlineStatus(bool online) {
  if (!datacakeConfigured_) {
    return;
  }

  if (publishDatacakeField(kFieldOnline, online ? "true" : "false")) {
    datacakeAnnouncedOffline_ = !online;
  }
}

void MqttService::publishWqttStatus(const MqttRuntimeState &state) {
  publishWqttText("status/time_synced", state.timeSynced ? "true" : "false", true);
  publishWqttText("status/wifi", state.wifiStatus, true);
  publishWqttNumber("status/wifi_pct", state.wifiSignalPercent, true);

  String ipPayload = state.ipAddress.isEmpty() ? String("0.0.0.0") : state.ipAddress;
  publishWqttText("status/ip", ipPayload, true);

  String payload = "{";
  payload += "\"device\":\"";
  payload += DEVICE_ID;
  payload += "\",\"online\":true,\"time_synced\":";
  payload += state.timeSynced ? "true" : "false";
  payload += ",\"wifi\":\"";
  payload += state.wifiStatus;
  payload += "\",\"wifi_pct\":";
  payload += String(state.wifiSignalPercent);
  payload += ",\"rssi_dbm\":";
  payload += String(state.wifiRssiDbm);
  payload += ",\"ip\":\"";
  payload += ipPayload;
  payload += "\",\"environment_available\":";
  payload += state.environmentAvailable ? "true" : "false";
  payload += ",\"temperature_c\":";
  payload += state.environmentAvailable ? String(state.temperatureC, 1) : String("null");
  payload += ",\"humidity_pct\":";
  payload += state.environmentAvailable ? String(state.humidityPct, 2) : String("null");
  payload += "\",\"timestamp\":\"";
  payload += state.timestamp;
  payload += "\"}";
  publishWqttText("status/json", payload, true);
}

void MqttService::publishWqttLiveMetrics(const MqttRuntimeState &state) {
  publishWqttNumber("sound/now_pct", state.snapshot.currentPercent, true);
  publishWqttNumber("sound/hour_pct", state.snapshot.hourPercent, true);
  publishWqttNumber("sound/mean_pct", state.snapshot.totalPercent, true);
  publishWqttText("sound/signal", state.mqttSignalText, true);
  publishWqttText("period/current", state.currentPeriod, true);
  publishWqttNumber("period/current_pct", state.currentPeriodPercent, true);
  if (state.environmentAvailable) {
    publishWqttDecimal("environment/temperature_c", state.temperatureC, 1, true);
    publishWqttDecimal("environment/humidity_pct", state.humidityPct, 2, true);
  }

  String payload = "{";
  payload += "\"now_pct\":";
  payload += String(state.snapshot.currentPercent);
  payload += ",\"hour_pct\":";
  payload += String(state.snapshot.hourPercent);
  payload += ",\"mean_pct\":";
  payload += String(state.snapshot.totalPercent);
  payload += ",\"signal\":\"";
  payload += state.mqttSignalText;
  payload += "\",\"current_period\":\"";
  payload += state.currentPeriod;
  payload += "\",\"current_period_pct\":";
  payload += String(state.currentPeriodPercent);
  payload += ",\"environment_available\":";
  payload += state.environmentAvailable ? "true" : "false";
  payload += ",\"temperature_c\":";
  payload += state.environmentAvailable ? String(state.temperatureC, 1) : String("null");
  payload += ",\"humidity_pct\":";
  payload += state.environmentAvailable ? String(state.humidityPct, 2) : String("null");
  payload += ",\"timestamp\":\"";
  payload += state.timestamp;
  payload += "\"}";
  publishWqttText("sound/json", payload, true);

  if (state.environmentAvailable) {
    String environmentPayload = "{";
    environmentPayload += "\"temperature_c\":";
    environmentPayload += String(state.temperatureC, 1);
    environmentPayload += ",\"humidity_pct\":";
    environmentPayload += String(state.humidityPct, 2);
    environmentPayload += ",\"timestamp\":\"";
    environmentPayload += state.timestamp;
    environmentPayload += "\"}";
    publishWqttText("environment/json", environmentPayload, true);
  }
}

void MqttService::publishWqttPeriodMetrics(const MqttRuntimeState &state) {
  publishWqttNumber("period/day_pct", state.dayPercent, true);
  publishWqttNumber("period/evening_pct", state.eveningPercent, true);
  publishWqttNumber("period/night_pct", state.nightPercent, true);

  String payload = "{";
  payload += "\"day_pct\":";
  payload += String(state.dayPercent);
  payload += ",\"evening_pct\":";
  payload += String(state.eveningPercent);
  payload += ",\"night_pct\":";
  payload += String(state.nightPercent);
  payload += ",\"time_synced\":";
  payload += state.timeSynced ? "true" : "false";
  payload += ",\"timestamp\":\"";
  payload += state.timestamp;
  payload += "\"}";
  publishWqttText("period/json", payload, true);
}

void MqttService::publishDatacakeCurrentPeriodIfNeeded(const MqttRuntimeState &state,
                                                       bool force) {
  String currentPeriod = state.currentPeriod;
  if (!force && currentPeriod == lastDatacakePublishedPeriod_) {
    return;
  }

  if (publishDatacakeTextField(kFieldCurrentPeriod, currentPeriod)) {
    lastDatacakePublishedPeriod_ = currentPeriod;
  }
}

void MqttService::publishDatacakeFastMetrics(const MqttRuntimeState &state) {
  publishDatacakeOnlineStatus(true);
  publishDatacakeNumberField(kFieldNowPct, state.snapshot.currentPercent);
  publishDatacakeNumberField(kFieldHourPct, state.snapshot.hourPercent);
  publishDatacakeNumberField(kFieldMeanPct, state.snapshot.totalPercent);
  publishDatacakeNumberField(kFieldCurrentPeriodPct, state.currentPeriodPercent);
  publishDatacakeNumberField(kFieldUptimeMin, state.uptimeMinutes);
  publishDatacakeNumberField(kFieldUptimeHours, state.uptimeHours);
  if (state.environmentAvailable) {
    publishDatacakeDecimalField(kFieldTemperatureC, state.temperatureC, 1);
    publishDatacakeDecimalField(kFieldHumidityPct, state.humidityPct, 2);
  }
}

void MqttService::publishDatacakeSlowMetrics(const MqttRuntimeState &state) {
  publishDatacakeNumberField(kFieldDayPct, state.dayPercent);
  publishDatacakeNumberField(kFieldEveningPct, state.eveningPercent);
  publishDatacakeNumberField(kFieldNightPct, state.nightPercent);
  publishDatacakeNumberField(kFieldWifiPct, state.wifiSignalPercent);
}

void MqttService::publishDatacakeTextMetrics(const MqttRuntimeState &state) {
  publishDatacakeTextField(kFieldSignalState, state.signalText);
  publishDatacakeTextField(kFieldLastUpdateTs, state.lastUpdateText);
  publishDatacakeTextField(kFieldUptimeDate, state.uptimeDateText);
}

bool MqttService::publishWqttText(const char *topicSuffix, const String &payload,
                                  bool retained) {
  return wqttClient.publish(wqttTopic(topicSuffix).c_str(), payload.c_str(), retained);
}

bool MqttService::publishWqttNumber(const char *topicSuffix, uint32_t value, bool retained) {
  return publishWqttText(topicSuffix, String(value), retained);
}

bool MqttService::publishWqttDecimal(const char *topicSuffix, float value, uint8_t decimals,
                                     bool retained) {
  return publishWqttText(topicSuffix,
                         String(static_cast<double>(value),
                                static_cast<unsigned int>(decimals)),
                         retained);
}

bool MqttService::publishDatacakeField(const char *fieldIdentifier, const String &payload,
                                       bool retained) {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  if (!http.begin(client, publishTopicPrefix_)) {
    Serial.println(F("[MQTT] Datacake HTTP begin failed"));
    return false;
  }

  http.addHeader(F("Authorization"), String(F("Token ")) + DATACAKE_ACCESS_TOKEN);
  http.addHeader(F("Content-Type"), F("application/json"));

  String body = "[{\"field\":\"";
  body += fieldIdentifier;
  body += F("\",\"value\":");
  if (payload == "true") {
    body += '1';
  } else if (payload == "false") {
    body += '0';
  } else {
    body += payload;
  }
  body += F("}]");

  int httpCode = http.POST(body);
  bool success = httpCode >= 200 && httpCode < 300;
  Serial.print(F("[MQTT] Datacake HTTP "));
  Serial.print(fieldIdentifier);
  Serial.print('=');
  Serial.print(payload);
  Serial.print(F(" -> "));
  Serial.println(httpCode);
  if (!success && httpCode > 0) {
    String response = http.getString();
    if (response.length() > 0) {
      Serial.print(F("[MQTT] Datacake body -> "));
      Serial.println(response);
    }
  } else if (httpCode <= 0) {
    Serial.print(F("[MQTT] Datacake HTTP failed -> "));
    Serial.println(http.errorToString(httpCode));
  }
  http.end();
  return success;
}

bool MqttService::publishDatacakeTextField(const char *fieldIdentifier, const String &payload,
                                           bool retained) {
  return publishDatacakeField(fieldIdentifier, "\"" + payload + "\"", retained);
}

bool MqttService::publishDatacakeNumberField(const char *fieldIdentifier, uint32_t value,
                                             bool retained) {
  return publishDatacakeField(fieldIdentifier, String(value), retained);
}

bool MqttService::publishDatacakeDecimalField(const char *fieldIdentifier, float value,
                                              uint8_t decimals, bool retained) {
  return publishDatacakeField(
      fieldIdentifier,
      String(static_cast<double>(value), static_cast<unsigned int>(decimals)),
      retained);
}

String MqttService::wqttTopic(const char *topicSuffix) const {
  return wqttBaseTopic_ + "/" + topicSuffix;
}

void MqttService::markAllPublishDue() {
  lastWqttStatusPublishAt_ = 0;
  lastWqttLivePublishAt_ = 0;
  lastWqttPeriodPublishAt_ = 0;
  lastDatacakeFastPublishAt_ = 0;
  lastDatacakeSlowPublishAt_ = 0;
  lastDatacakeTextPublishAt_ = 0;
}
