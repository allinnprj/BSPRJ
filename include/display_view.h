#pragma once

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Arduino.h>

#include "audio_sampler.h"

class DisplayView {
 public:
  bool begin(TwoWire *wire, uint8_t sdaPin, uint8_t sclPin, uint8_t address);
  void render(const AudioSnapshot &snapshot, const char *versionText, uint32_t buildNumber,
              bool wifiConnected, uint8_t wifiPercent);
  void showBootMessage(const char *line1, const char *line2);

 private:
  static constexpr uint8_t kScreenWidth = 128;
  static constexpr uint8_t kScreenHeight = 64;
  static constexpr uint32_t kHourWarmupCount = 3600;

  Adafruit_SSD1306 display_{kScreenWidth, kScreenHeight, nullptr, -1};
  bool initialized_ = false;
};
