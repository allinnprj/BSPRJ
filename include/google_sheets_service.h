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
  uint16_t minRaw = 0;
  uint16_t maxRaw = 0;
  uint16_t averagePeakToPeak = 0;
  String signalText;
  uint32_t quietCount = 0;
  uint32_t loudCount = 0;
  uint32_t sampleCount = 0;
  uint8_t windowMinutes = 0;
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
