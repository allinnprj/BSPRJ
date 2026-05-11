#pragma once

#include <Arduino.h>

#include "audio_sampler.h"

struct MqttRuntimeState {
  AudioSnapshot snapshot;
  const char *signalText = "LOW";
  const char *mqttSignalText = "SILENT";
  bool timeSynced = false;
  String timestamp;
  String lastUpdateText;
  const char *currentPeriod = "unknown";
  uint32_t currentPeriodPercent = 0;
  uint32_t dayPercent = 0;
  uint32_t eveningPercent = 0;
  uint32_t nightPercent = 0;
  uint32_t uptimeMinutes = 0;
  uint32_t uptimeHours = 0;
  String uptimeDateText;
  const char *wifiStatus = "OFF";
  uint8_t wifiSignalPercent = 0;
  int wifiRssiDbm = -127;
  String ipAddress;
};

class MqttService {
 public:
  MqttService();

  void begin();
  void update(bool wifiConnected, const MqttRuntimeState &state);

  bool isConfigured() const;
  bool isConnected() const;

 private:
  void connectWqttIfNeeded(bool wifiConnected);
  void connectDatacakeIfNeeded(bool wifiConnected);
  void publishWqttOnlineStatus(bool online);
  void publishDatacakeOnlineStatus(bool online);
  void publishWqttStatus(const MqttRuntimeState &state);
  void publishWqttLiveMetrics(const MqttRuntimeState &state);
  void publishWqttPeriodMetrics(const MqttRuntimeState &state);
  void publishDatacakeCurrentPeriodIfNeeded(const MqttRuntimeState &state, bool force);
  void publishDatacakeFastMetrics(const MqttRuntimeState &state);
  void publishDatacakeSlowMetrics(const MqttRuntimeState &state);
  void publishDatacakeTextMetrics(const MqttRuntimeState &state);
  bool publishWqttText(const char *topicSuffix, const String &payload, bool retained);
  bool publishWqttNumber(const char *topicSuffix, uint32_t value, bool retained);
  bool publishDatacakeField(const char *fieldIdentifier, const String &payload,
                            bool retained = false);
  bool publishDatacakeTextField(const char *fieldIdentifier, const String &payload,
                                bool retained = false);
  bool publishDatacakeNumberField(const char *fieldIdentifier, uint32_t value,
                                  bool retained = false);
  String wqttTopic(const char *topicSuffix) const;
  void markAllPublishDue();

  bool wqttConfigured_ = false;
  bool datacakeConfigured_ = false;
  bool datacakeHttpActive_ = false;
  bool wqttAnnouncedOffline_ = false;
  bool datacakeAnnouncedOffline_ = false;
  unsigned long lastWqttConnectAttemptAt_ = 0;
  unsigned long lastDatacakeConnectAttemptAt_ = 0;
  unsigned long lastWqttStatusPublishAt_ = 0;
  unsigned long lastWqttLivePublishAt_ = 0;
  unsigned long lastWqttPeriodPublishAt_ = 0;
  unsigned long lastDatacakeFastPublishAt_ = 0;
  unsigned long lastDatacakeSlowPublishAt_ = 0;
  unsigned long lastDatacakeTextPublishAt_ = 0;
  String wqttClientId_;
  String datacakeClientId_;
  String wqttWillTopic_;
  String datacakeWillTopic_;
  String wqttBaseTopic_;
  String publishTopicPrefix_;
  String lastDatacakePublishedPeriod_;
};
