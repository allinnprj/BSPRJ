#pragma once

#include <Arduino.h>

#include "audio_sampler.h"

struct GoogleSheetsWindowRecord {
  String windowKey;
  String dateText;
  String timeFromText;
  String timeToText;
  String dayPartText;
  String levelText;
  uint8_t averageNowPercent = 0;
  uint8_t averageHourPercent = 0;
  uint8_t averageTotalPercent = 0;
  int32_t minRaw = 0;
  int32_t maxRaw = 0;
  uint16_t averagePeakToPeak = 0;
  float dbaLeqEstimate = 0.0f;
  bool dbaAvailable = false;
  uint8_t dbaValidPercent = 0;
  uint32_t dbaFaultCount = 0;
  uint32_t dbaClippedSamples = 0;
  uint16_t peakToPeakP95 = 0;
  uint16_t minPeakToPeak = 0;
  uint16_t maxPeakToPeak = 0;
  uint16_t stableMaxPeakToPeak = 0;
  uint16_t sessionMinPeakToPeak = 0;
  uint16_t sessionMaxPeakToPeak = 0;
  uint16_t sessionStableMaxPeakToPeak = 0;
  String signalText;
  float averageTemperatureC = 0.0f;
  float averageHumidityPct = 0.0f;
  bool environmentAvailable = false;
  uint32_t environmentOkCount = 0;
  uint32_t environmentFailCount = 0;
  uint32_t quietCount = 0;
  uint32_t loudCount = 0;
  uint32_t sampleCount = 0;
  uint8_t windowMinutes = 0;
  String uptimeText;
  uint32_t uptimeMinutes = 0;
  uint32_t freeHeap = 0;
  uint32_t minFreeHeap = 0;
  uint32_t bootSequence = 0;
  String resetReason;
};

class GoogleSheetsService {
 public:
  void begin();
  bool appendWindowAggregate(const GoogleSheetsWindowRecord &record, const char *versionText,
                             uint32_t buildNumber, String &httpResult);

  bool isConfigured() const;

 private:
  bool configured_ = false;
  String lastWindowKey_;
};
