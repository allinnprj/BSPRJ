#pragma once

#include <Arduino.h>

#include "audio_sampler.h"

struct GoogleSheetsWindowRecord {
  String windowKey;
  String dateText;
  String timeFromText;
  String timeToText;
  String dayPartText;
  uint8_t averageNowPercent = 0;
  uint8_t averageHourPercent = 0;
  uint8_t averageTotalPercent = 0;
  int32_t minRaw = 0;
  int32_t maxRaw = 0;
  uint16_t averagePeakToPeak = 0;
  String signalText;
  float averageTemperatureC = 0.0f;
  float averageHumidityPct = 0.0f;
  bool environmentAvailable = false;
  uint32_t quietCount = 0;
  uint32_t loudCount = 0;
  uint32_t sampleCount = 0;
  uint8_t windowMinutes = 0;
  String uptimeText;
  uint32_t uptimeMinutes = 0;
};

class GoogleSheetsService {
 public:
  void begin();
  bool appendWindowAggregate(const GoogleSheetsWindowRecord &record, const char *versionText,
                             uint32_t buildNumber);

  bool isConfigured() const;

 private:
  bool configured_ = false;
  String lastWindowKey_;
};
