#include "audio_sampler.h"

namespace {

constexpr uint16_t kAdcFloorThreshold = 40;
constexpr uint16_t kAdcCeilingThreshold = 4055;
constexpr uint16_t kPeakToPeakLowThreshold = 16;
constexpr uint16_t kPercentHeadroom = 120;
constexpr uint16_t kMinReferenceSpan = 180;

struct RawWindow {
  uint16_t minValue;
  uint16_t maxValue;
};

RawWindow readWindow(uint8_t analogPin, uint16_t sampleWindowMs) {
  RawWindow window{4095, 0};
  unsigned long startMs = millis();

  while (millis() - startMs < sampleWindowMs) {
    uint16_t sample = analogRead(analogPin);
    if (sample < window.minValue) {
      window.minValue = sample;
    }
    if (sample > window.maxValue) {
      window.maxValue = sample;
    }
    delay(0);
  }

  return window;
}

SignalState detectSignalState(const RawWindow &window, uint16_t peakToPeak) {
  if (window.minValue <= kAdcFloorThreshold || window.maxValue >= kAdcCeilingThreshold) {
    return SignalState::Clip;
  }

  if (peakToPeak <= kPeakToPeakLowThreshold) {
    return SignalState::Low;
  }

  return SignalState::Ok;
}

uint8_t percentFromLevel(uint32_t level, uint16_t floorLevel, uint16_t referenceLevel) {
  uint16_t effectiveReference = referenceLevel;
  if (effectiveReference <= floorLevel + kMinReferenceSpan) {
    effectiveReference = floorLevel + kMinReferenceSpan;
  }

  if (level <= floorLevel) {
    return 0;
  }

  uint32_t adjustedLevel = level - floorLevel;
  uint32_t adjustedReference = effectiveReference - floorLevel;
  uint32_t percent = (adjustedLevel * 100UL) / adjustedReference;
  if (percent > 100UL) {
    percent = 100UL;
  }
  return static_cast<uint8_t>(percent);
}

}  // namespace

void AudioSampler::begin(uint8_t analogPin) {
  analogPin_ = analogPin;
  started_ = true;
  smoothedLevel_ = 0;
  noiseFloorLevel_ = 0;
  referenceLevel_ = 80;
  lowSignalHoldSeconds_ = 0;
  clipSignalHoldSeconds_ = 0;
}

void AudioSampler::restoreLongMean(uint64_t totalLevelSum, uint32_t totalLevelCount) {
  totalLevelSum_ = totalLevelSum;
  totalLevelCount_ = totalLevelCount;
}

uint64_t AudioSampler::totalLevelSum() const {
  return totalLevelSum_;
}

uint32_t AudioSampler::totalLevelCount() const {
  return totalLevelCount_;
}

AudioSnapshot AudioSampler::sample() {
  AudioSnapshot snapshot{};
  if (!started_) {
    return snapshot;
  }

  RawWindow window = readWindow(analogPin_, kSampleWindowMs);
  uint16_t peakToPeak = window.maxValue - window.minValue;
  uint16_t level = peakToPeak * kLevelGain;
  SignalState detectedSignalState = detectSignalState(window, peakToPeak);

  smoothedLevel_ = static_cast<uint16_t>((smoothedLevel_ * 3U + level) / 4U);
  if (noiseFloorLevel_ == 0) {
    noiseFloorLevel_ = smoothedLevel_;
  } else if (smoothedLevel_ <= noiseFloorLevel_) {
    noiseFloorLevel_ = static_cast<uint16_t>((noiseFloorLevel_ * 15U + smoothedLevel_) / 16U);
  } else {
    noiseFloorLevel_ = static_cast<uint16_t>((noiseFloorLevel_ * 255U + smoothedLevel_) / 256U);
  }

  uint16_t targetReference = smoothedLevel_ + kPercentHeadroom;
  if (targetReference > referenceLevel_) {
    referenceLevel_ = targetReference;
  } else {
    uint16_t decayedReference =
        static_cast<uint16_t>((referenceLevel_ * 63U + targetReference) / 64U);
    if (decayedReference < noiseFloorLevel_ + kMinReferenceSpan) {
      decayedReference = noiseFloorLevel_ + kMinReferenceSpan;
    }
    referenceLevel_ = decayedReference;
  }

  unsigned long nowMs = millis();
  if (nowMs - lastStatsAt_ >= kStatsIntervalMs) {
    lastStatsAt_ = nowMs;
    snapshot.statsUpdated = true;

    if (hourSamplesCollected_ == kHourSampleCount) {
      rollingHourSum_ -= hourLevels_[hourWriteIndex_];
    } else {
      hourSamplesCollected_++;
    }

    hourLevels_[hourWriteIndex_] = smoothedLevel_;
    rollingHourSum_ += hourLevels_[hourWriteIndex_];
    hourWriteIndex_ = (hourWriteIndex_ + 1) % kHourSampleCount;

    totalLevelSum_ += smoothedLevel_;
    totalLevelCount_++;

    if (detectedSignalState == SignalState::Clip) {
      clipSignalHoldSeconds_++;
      lowSignalHoldSeconds_ = 0;
    } else if (detectedSignalState == SignalState::Low) {
      lowSignalHoldSeconds_++;
      clipSignalHoldSeconds_ = 0;
    } else {
      lowSignalHoldSeconds_ = 0;
      clipSignalHoldSeconds_ = 0;
    }
  }

  snapshot.currentLevel = smoothedLevel_;
  snapshot.statsLevel = smoothedLevel_;
  snapshot.rawMin = window.minValue;
  snapshot.rawMax = window.maxValue;
  snapshot.peakToPeak = peakToPeak;
  snapshot.hourSamplesCollected = static_cast<uint32_t>(hourSamplesCollected_);
  snapshot.hourAverage =
      hourSamplesCollected_ == 0 ? 0 : rollingHourSum_ / hourSamplesCollected_;
  snapshot.totalAverage =
      totalLevelCount_ == 0 ? 0 : static_cast<uint32_t>(totalLevelSum_ / totalLevelCount_);
  snapshot.currentPercent =
      percentFromLevel(snapshot.currentLevel, noiseFloorLevel_, referenceLevel_);
  snapshot.hourPercent = percentFromLevel(snapshot.hourAverage, noiseFloorLevel_, referenceLevel_);
  snapshot.totalPercent =
      percentFromLevel(snapshot.totalAverage, noiseFloorLevel_, referenceLevel_);
  snapshot.lowSignalHoldSeconds = lowSignalHoldSeconds_;
  snapshot.clipSignalHoldSeconds = clipSignalHoldSeconds_;
  snapshot.lowSignalWarning = lowSignalHoldSeconds_ >= kLowSignalWarnThresholdSeconds;
  snapshot.clipSignalWarning = clipSignalHoldSeconds_ >= kClipSignalWarnThresholdSeconds;
  snapshot.signalState = detectedSignalState;
  return snapshot;
}
