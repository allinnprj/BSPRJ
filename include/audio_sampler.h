#pragma once

#include <Arduino.h>

enum class SignalState : uint8_t {
  Ok,
  Low,
  Clip,
};

struct AudioSnapshot {
  uint16_t currentLevel = 0;
  uint16_t rawMin = 0;
  uint16_t rawMax = 0;
  uint16_t peakToPeak = 0;
  uint16_t statsLevel = 0;
  uint8_t currentPercent = 0;
  uint8_t hourPercent = 0;
  uint8_t totalPercent = 0;
  uint32_t hourAverage = 0;
  uint32_t totalAverage = 0;
  uint32_t hourSamplesCollected = 0;
  bool statsUpdated = false;
  SignalState signalState = SignalState::Low;
};

class AudioSampler {
 public:
  void begin(uint8_t analogPin);
  AudioSnapshot sample();
  void restoreLongMean(uint64_t totalLevelSum, uint32_t totalLevelCount);
  uint64_t totalLevelSum() const;
  uint32_t totalLevelCount() const;

 private:
  static constexpr uint16_t kSampleWindowMs = 25;
  static constexpr uint16_t kStatsIntervalMs = 1000;
  static constexpr uint16_t kLevelGain = 2;
  static constexpr size_t kHourSampleCount = 3600;

  uint8_t analogPin_ = 0;
  bool started_ = false;
  uint16_t hourLevels_[kHourSampleCount] = {};
  size_t hourWriteIndex_ = 0;
  size_t hourSamplesCollected_ = 0;
  uint32_t rollingHourSum_ = 0;
  uint64_t totalLevelSum_ = 0;
  uint32_t totalLevelCount_ = 0;
  uint16_t smoothedLevel_ = 0;
  uint16_t noiseFloorLevel_ = 0;
  uint16_t referenceLevel_ = 80;
  unsigned long lastStatsAt_ = 0;
};
