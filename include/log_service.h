#pragma once

#include <Arduino.h>

#include "audio_sampler.h"

class LogService {
 public:
  void begin();
  void update(bool wifiConnected, const String &ipAddress);
  void appendMinuteSample(const String &minuteKey, const String &dateText, const String &timeText,
                          const char *dayPart, const AudioSnapshot &snapshot,
                          uint32_t partAverage, uint32_t quietCount, uint32_t loudCount);

  bool isReady() const;
  bool webServerStarted() const;

 private:
  bool ready_ = false;
  bool serverStarted_ = false;
  bool lastWifiConnected_ = false;
  String lastIpAddress_;
  String lastMinuteKey_;
};
