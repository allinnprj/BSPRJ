#pragma once

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Arduino.h>

#include "audio_sampler.h"
#include "sht31_service.h"

class DisplayView {
 public:
  bool begin(TwoWire *wire, uint8_t sdaPin, uint8_t sclPin, uint8_t address);
  void render(const AudioSnapshot &snapshot, const Sht31Reading &sht31Reading,
              bool timeSynced, bool wifiConnected, uint8_t wifiPercent, bool pinnedOn,
              const char *powerProfileText);
  void showBootMessage(const char *line1, const char *line2, const char *powerProfileText);
  void nextPage();
  void setEnabled(bool enabled);
  bool isEnabled() const;
  uint8_t currentPage() const;

 private:
  static constexpr uint8_t kScreenWidth = 128;
  static constexpr uint8_t kScreenHeight = 64;
  static constexpr uint32_t kHourWarmupCount = 3600;
  static constexpr uint8_t kPageCount = 4;

  Adafruit_SSD1306 display_{kScreenWidth, kScreenHeight, nullptr, -1};
  bool initialized_ = false;
  bool enabled_ = true;
  bool blanked_ = false;
  uint8_t currentPage_ = 0;

  void renderSoundPage(const AudioSnapshot &snapshot, const Sht31Reading &sht31Reading,
                       bool timeSynced, bool wifiConnected, uint8_t wifiPercent,
                       const char *powerProfileText);
  void renderDebugPage(const AudioSnapshot &snapshot, const Sht31Reading &sht31Reading,
                       const char *powerProfileText);
  void renderRangePage(const AudioSnapshot &snapshot);
  void renderEnvironmentPage(const Sht31Reading &sht31Reading);
  void drawPinnedIndicator(bool pinnedOn);
  void drawCenteredText(const String &text, int16_t topY, uint8_t textSize);
};
