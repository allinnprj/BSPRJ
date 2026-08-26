#include "audio_sampler.h"

#include <driver/i2s.h>

namespace {

constexpr i2s_port_t kI2sPort = I2S_NUM_0;
constexpr uint32_t kI2sSampleRate = 16000;
constexpr size_t kI2sReadSampleCount = 256;
constexpr int32_t kI2sClipThreshold = 30000;
constexpr uint8_t kClipPercentThreshold = 15;
constexpr uint16_t kPeakToPeakLowThreshold = 30;
constexpr uint16_t kPercentFloorLevel = 150;
constexpr uint16_t kPercentReferenceSpan = 1800;

struct RawWindow {
  int32_t minValue;
  int32_t maxValue;
  uint16_t sampleCount;
  uint16_t clippedSampleCount;
};

int32_t normalizeI2sSample(int32_t rawSample) {
  return rawSample >> 16;
}

RawWindow readWindow(uint16_t sampleWindowMs) {
  RawWindow window{32767, -32768, 0, 0};
  unsigned long startMs = millis();
  int32_t sampleBuffer[kI2sReadSampleCount];
  bool captured = false;

  while (millis() - startMs < sampleWindowMs) {
    size_t bytesRead = 0;
    esp_err_t readResult =
        i2s_read(kI2sPort, sampleBuffer, sizeof(sampleBuffer), &bytesRead, pdMS_TO_TICKS(5));
    if (readResult != ESP_OK || bytesRead == 0) {
      delay(0);
      continue;
    }

    size_t sampleCount = bytesRead / sizeof(sampleBuffer[0]);
    for (size_t index = 0; index < sampleCount; ++index) {
      int32_t sample = normalizeI2sSample(sampleBuffer[index]);
      if (sample < window.minValue) {
        window.minValue = sample;
      }
      if (sample > window.maxValue) {
        window.maxValue = sample;
      }
      if (sample <= -kI2sClipThreshold || sample >= kI2sClipThreshold) {
        window.clippedSampleCount++;
      }
      window.sampleCount++;
      captured = true;
    }

    delay(0);
  }

  if (!captured) {
    return RawWindow{0, 0, 0, 0};
  }

  return window;
}

SignalState detectSignalState(const RawWindow &window, uint16_t peakToPeak) {
  uint8_t clippedPercent = window.sampleCount == 0
      ? 0
      : static_cast<uint8_t>((window.clippedSampleCount * 100UL) / window.sampleCount);
  if (clippedPercent >= kClipPercentThreshold) {
    return SignalState::Clip;
  }

  if (peakToPeak <= kPeakToPeakLowThreshold) {
    return SignalState::Low;
  }

  return SignalState::Ok;
}

uint8_t percentFromLevel(uint32_t level) {
  if (level <= kPercentFloorLevel) {
    return 0;
  }

  uint32_t percent = ((level - kPercentFloorLevel) * 100UL) / kPercentReferenceSpan;
  if (percent > 100UL) {
    percent = 100UL;
  }
  return static_cast<uint8_t>(percent);
}

}  // namespace

bool AudioSampler::begin(uint8_t bclkPin, uint8_t wsPin, uint8_t dataPin) {
  const i2s_config_t config = {
      .mode = static_cast<i2s_mode_t>(I2S_MODE_MASTER | I2S_MODE_RX),
      .sample_rate = static_cast<int>(kI2sSampleRate),
      .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
      .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
      .communication_format = I2S_COMM_FORMAT_STAND_I2S,
      .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
      .dma_buf_count = 4,
      .dma_buf_len = 256,
      .use_apll = false,
      .tx_desc_auto_clear = false,
      .fixed_mclk = 0,
  };

  const i2s_pin_config_t pinConfig = {
      .bck_io_num = static_cast<int>(bclkPin),
      .ws_io_num = static_cast<int>(wsPin),
      .data_out_num = I2S_PIN_NO_CHANGE,
      .data_in_num = static_cast<int>(dataPin),
  };

  if (i2s_driver_install(kI2sPort, &config, 0, nullptr) != ESP_OK) {
    started_ = false;
    return false;
  }
  if (i2s_set_pin(kI2sPort, &pinConfig) != ESP_OK) {
    i2s_driver_uninstall(kI2sPort);
    started_ = false;
    return false;
  }
  i2s_zero_dma_buffer(kI2sPort);

  started_ = true;
  smoothedLevel_ = 0;
  sessionMinPeakToPeak_ = 0;
  sessionMaxPeakToPeak_ = 0;
  sessionStableMaxPeakToPeak_ = 0;
  lowSignalHoldSeconds_ = 0;
  clipSignalHoldSeconds_ = 0;
  lastStatsAt_ = 0;
  return true;
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

  RawWindow window = readWindow(kSampleWindowMs);
  uint16_t peakToPeak =
      static_cast<uint16_t>(constrain(window.maxValue - window.minValue, 0, 65535));
  uint16_t level = peakToPeak * kLevelGain;
  SignalState detectedSignalState = detectSignalState(window, peakToPeak);

  if (sessionMinPeakToPeak_ == 0 || peakToPeak < sessionMinPeakToPeak_) {
    sessionMinPeakToPeak_ = peakToPeak;
  }
  if (peakToPeak > sessionMaxPeakToPeak_) {
    sessionMaxPeakToPeak_ = peakToPeak;
  }

  smoothedLevel_ = static_cast<uint16_t>((smoothedLevel_ * 3U + level) / 4U);
  if (smoothedLevel_ > sessionStableMaxPeakToPeak_) {
    sessionStableMaxPeakToPeak_ = smoothedLevel_;
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
  snapshot.sessionMinPeakToPeak = sessionMinPeakToPeak_;
  snapshot.sessionMaxPeakToPeak = sessionMaxPeakToPeak_;
  snapshot.sessionStableMaxPeakToPeak = sessionStableMaxPeakToPeak_;
  snapshot.hourSamplesCollected = static_cast<uint32_t>(hourSamplesCollected_);
  snapshot.hourAverage =
      hourSamplesCollected_ == 0 ? 0 : rollingHourSum_ / hourSamplesCollected_;
  snapshot.totalAverage =
      totalLevelCount_ == 0 ? 0 : static_cast<uint32_t>(totalLevelSum_ / totalLevelCount_);
  snapshot.currentPercent = percentFromLevel(snapshot.currentLevel);
  snapshot.hourPercent = percentFromLevel(snapshot.hourAverage);
  snapshot.totalPercent = percentFromLevel(snapshot.totalAverage);
  snapshot.lowSignalWarning = lowSignalHoldSeconds_ >= kLowSignalWarnThresholdSeconds;
  snapshot.clipSignalWarning = clipSignalHoldSeconds_ >= kClipSignalWarnThresholdSeconds;
  snapshot.signalState = detectedSignalState;
  return snapshot;
}
