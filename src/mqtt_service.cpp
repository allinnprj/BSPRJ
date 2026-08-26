#include "mqtt_service.h"

#include <HTTPClient.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

#include "secrets.h"

namespace {

constexpr unsigned long kReconnectIntervalMs = 10000UL;
constexpr unsigned long kWqttStatusPublishIntervalMs = 120000UL;
constexpr unsigned long kWqttLivePublishIntervalMs = 60000UL;
constexpr unsigned long kWqttPeriodPublishIntervalMs = 300000UL;
constexpr unsigned long kFastPublishIntervalMs = 60UL * 60UL * 1000UL;
constexpr unsigned long kSlowPublishIntervalMs = 6UL * 60UL * 60UL * 1000UL;
constexpr unsigned long kTextPublishIntervalMs = 60UL * 60UL * 1000UL;
constexpr unsigned long kControllerPublishRetryIntervalMs = 5000UL;
constexpr char kWqttTopicRoot[] = "bs/devices";
constexpr char kDatacakeApiBaseUrl[] = "https://api.datacake.co/v1/devices/";
constexpr char kFieldNowPct[] = "NOW_PCT";
constexpr char kFieldHourPct[] = "HOUR_PCT";
constexpr char kFieldMeanPct[] = "MEAN_PCT";
constexpr char kFieldCurrentPeriod[] = "CURRENT_PERIOD";
constexpr char kFieldDayPct[] = "DAY_PCT";
constexpr char kFieldEveningPct[] = "EVENING_PCT";
constexpr char kFieldNightPct[] = "NIGHT_PCT";
constexpr char kFieldOnline[] = "ONLINE";
constexpr char kFieldWifiPct[] = "WIFI_PCT";
constexpr char kFieldSignalState[] = "SIGNAL_STATE";
constexpr char kFieldTemperatureC[] = "TEMPERATURE_C";
constexpr char kFieldHumidityPct[] = "HUMIDITY_PCT";

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
  datacakeSuccessCount_ = 0;
  datacakeFailureCount_ = 0;
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

bool MqttService::publishControllerTelemetry(
    const ControllerTelemetrySnapshot &telemetry) {
  if (!wqttConfigured_ || !wqttClient.connected() || telemetry.session == 0 ||
      telemetry.sequence == 0) {
    return false;
  }
  if (telemetry.session == lastControllerPublishedSession_ &&
      telemetry.sequence == lastControllerPublishedSequence_) {
    return true;
  }

  const unsigned long nowMs = millis();
  const bool samePendingFrame =
      telemetry.session == lastControllerPublishAttemptSession_ &&
      telemetry.sequence == lastControllerPublishAttemptSequence_;
  if (samePendingFrame && lastControllerPublishAttemptAt_ != 0 &&
      nowMs - lastControllerPublishAttemptAt_ < kControllerPublishRetryIntervalMs) {
    return false;
  }
  lastControllerPublishAttemptSession_ = telemetry.session;
  lastControllerPublishAttemptSequence_ = telemetry.sequence;
  lastControllerPublishAttemptAt_ = nowMs;

  String payload;
  payload.reserve(440);
  payload += F("{\"session\":");
  payload += telemetry.session;
  payload += F(",\"sequence\":");
  payload += telemetry.sequence;
  payload += F(",\"ina\":\"");
  payload += telemetry.valid ? F("ok") : F("error");
  payload += F("\",\"solar\":{\"voltage_v\":");
  payload += String(telemetry.solarMillivolts / 1000.0F, 3);
  payload += F(",\"current_a\":");
  payload += String(telemetry.solarMilliamps / 1000.0F, 3);
  payload += F("},\"battery\":{\"voltage_v\":");
  payload += String(telemetry.batteryMillivolts / 1000.0F, 3);
  payload += F(",\"current_a\":");
  payload += String(telemetry.batteryMilliamps / 1000.0F, 3);
  payload += F(",\"soc_pct\":");
  payload += static_cast<unsigned int>(telemetry.batterySocPercent);
  payload += F("},\"load\":{\"voltage_v\":");
  payload += String(telemetry.loadMillivolts / 1000.0F, 3);
  payload += F(",\"current_a\":");
  payload += String(telemetry.loadMilliamps / 1000.0F, 3);
  payload += F("},\"charge\":\"");
  payload += telemetry.chargeOutputOn ? F("on") : F("off");
  payload += F("\",\"mode\":\"");
  payload += telemetry.solarControlMode == 1
                 ? F("smart_auto")
                 : (telemetry.solarControlMode == 2 ? F("legacy_manual")
                                                     : F("classic"));
  payload += F("\",\"gps\":{\"fixed\":");
  payload += telemetry.gpsFixed ? F("true") : F("false");
  if (telemetry.gpsFixed) {
    payload += F(",\"latitude\":");
    payload += String(telemetry.gpsLatitudeMicrodegrees / 1000000.0, 6);
    payload += F(",\"longitude\":");
    payload += String(telemetry.gpsLongitudeMicrodegrees / 1000000.0, 6);
    payload += F(",\"satellites\":");
    payload += telemetry.gpsSatellites;
    payload += F(",\"hdop\":");
    payload += String(telemetry.gpsHdopTenths / 10.0F, 1);
    payload += F(",\"fix_epoch\":");
    payload += telemetry.gpsFixEpoch;
  }
  payload += F("}");
  payload += F("}");

  const bool published =
      publishWqttText("controller/c3/telemetry", payload, true);
  Serial.print(F("[MQTT] C3 telemetry -> q="));
  Serial.print(telemetry.sequence);
  Serial.println(published ? F(" OK") : F(" FAIL"));
  if (published) {
    lastControllerPublishedSession_ = telemetry.session;
    lastControllerPublishedSequence_ = telemetry.sequence;
  }
  return published;
}

bool MqttService::isWqttConnected() const {
  return wqttConfigured_ && wqttClient.connected();
}

uint32_t MqttService::datacakeSuccessCount() const {
  return datacakeSuccessCount_;
}

uint32_t MqttService::datacakeFailureCount() const {
  return datacakeFailureCount_;
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

  publishWqttText("status/online", online ? "true" : "false", true);
}

void MqttService::publishWqttStatus(const MqttRuntimeState &state) {
  publishWqttOnlineStatus(true);
  publishWqttText("status/time_synced", state.timeSynced ? "true" : "false", true);
  publishWqttText("status/wifi", state.wifiStatus, true);
  publishWqttNumber("status/wifi_pct", state.wifiSignalPercent, true);

  String ipPayload = state.ipAddress.isEmpty() ? String("0.0.0.0") : state.ipAddress;
  publishWqttText("status/ip", ipPayload, true);
}

void MqttService::publishWqttLiveMetrics(const MqttRuntimeState &state) {
  publishWqttNumber("sound/now_pct", state.snapshot.currentPercent, true);
  publishWqttNumber("sound/hour_pct", state.snapshot.hourPercent, true);
  publishWqttNumber("sound/mean_pct", state.snapshot.totalPercent, true);
  publishWqttText("sound/signal", state.signalText, true);
  publishWqttText("period/current", state.currentPeriod, true);
  publishWqttNumber("period/current_pct", state.currentPeriodPercent, true);
  if (state.environmentAvailable) {
    publishWqttDecimal("environment/temperature_c", state.temperatureC, 1, true);
    publishWqttDecimal("environment/humidity_pct", state.humidityPct, 2, true);
  }
}

void MqttService::publishWqttPeriodMetrics(const MqttRuntimeState &state) {
  publishWqttNumber("period/day_pct", state.dayPercent, true);
  publishWqttNumber("period/evening_pct", state.eveningPercent, true);
  publishWqttNumber("period/night_pct", state.nightPercent, true);
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
  String body = "[";
  bool firstRecord = true;
  appendDatacakeRecord(body, firstRecord, kFieldOnline, "true");
  appendDatacakeRecord(body, firstRecord, kFieldNowPct, String(state.snapshot.currentPercent));
  appendDatacakeRecord(body, firstRecord, kFieldHourPct, String(state.snapshot.hourPercent));
  appendDatacakeRecord(body, firstRecord, kFieldMeanPct, String(state.snapshot.totalPercent));
  if (state.environmentAvailable) {
    appendDatacakeRecord(
        body, firstRecord, kFieldTemperatureC,
        String(static_cast<double>(state.temperatureC), static_cast<unsigned int>(1)));
    appendDatacakeRecord(
        body, firstRecord, kFieldHumidityPct,
        String(static_cast<double>(state.humidityPct), static_cast<unsigned int>(2)));
  }
  body += ']';
  publishDatacakePayload(body, F("batch fast"));
}

void MqttService::publishDatacakeSlowMetrics(const MqttRuntimeState &state) {
  String body = "[";
  bool firstRecord = true;
  appendDatacakeRecord(body, firstRecord, kFieldDayPct, String(state.dayPercent));
  appendDatacakeRecord(body, firstRecord, kFieldEveningPct, String(state.eveningPercent));
  appendDatacakeRecord(body, firstRecord, kFieldNightPct, String(state.nightPercent));
  appendDatacakeRecord(body, firstRecord, kFieldWifiPct, String(state.wifiSignalPercent));
  body += ']';
  publishDatacakePayload(body, F("batch slow"));
}

void MqttService::publishDatacakeTextMetrics(const MqttRuntimeState &state) {
  String body = "[";
  bool firstRecord = true;
  appendDatacakeRecord(body, firstRecord, kFieldSignalState, "\"" + String(state.signalText) + "\"");
  body += ']';
  publishDatacakePayload(body, F("batch text"));
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

bool MqttService::publishDatacakePayload(const String &body, const String &logLabel) {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  if (!http.begin(client, publishTopicPrefix_)) {
    datacakeFailureCount_++;
    Serial.println(F("[MQTT] Datacake HTTP begin failed"));
    return false;
  }

  http.addHeader(F("Authorization"), String(F("Token ")) + DATACAKE_ACCESS_TOKEN);
  http.addHeader(F("Content-Type"), F("application/json"));

  int httpCode = http.POST(body);
  bool success = httpCode >= 200 && httpCode < 300;
  if (success) {
    datacakeSuccessCount_++;
  } else {
    datacakeFailureCount_++;
  }
  Serial.print(F("[MQTT] Datacake HTTP "));
  Serial.print(logLabel);
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

void MqttService::appendDatacakeRecord(String &body, bool &firstRecord,
                                       const char *fieldIdentifier, const String &payload) {
  if (!firstRecord) {
    body += ',';
  }
  firstRecord = false;

  body += F("{\"field\":\"");
  body += fieldIdentifier;
  body += F("\",\"value\":");
  if (payload == "true") {
    body += '1';
  } else if (payload == "false") {
    body += '0';
  } else {
    body += payload;
  }
  body += '}';
}

bool MqttService::publishDatacakeTextField(const char *fieldIdentifier,
                                           const String &payload) {
  String body = "[";
  bool firstRecord = true;
  appendDatacakeRecord(body, firstRecord, fieldIdentifier, "\"" + payload + "\"");
  body += ']';
  return publishDatacakePayload(body, String(fieldIdentifier) + "=text");
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
