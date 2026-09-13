#include "display_view.h"

#include <Fonts/FreeSans9pt7b.h>

bool DisplayView::begin(TwoWire *wire, uint8_t sdaPin, uint8_t sclPin, uint8_t address) {
  display_ = Adafruit_SSD1306(kScreenWidth, kScreenHeight, wire, -1);
  initialized_ = display_.begin(SSD1306_SWITCHCAPVCC, address);
  return initialized_;
}

void DisplayView::showBootMessage(const char *line1, const char *line2,
                                  const char *powerProfileText) {
  if (!initialized_) {
    return;
  }

  display_.clearDisplay();
  display_.setTextColor(SSD1306_WHITE);
  display_.setTextSize(1);
  display_.setCursor(0, 0);
  display_.println(F("OLED OK"));
  display_.setCursor(104, 0);
  display_.print(powerProfileText);
  display_.setCursor(0, 18);
  display_.println(line1);
  display_.setCursor(0, 30);
  display_.println(line2);
  display_.display();
}

void DisplayView::showWifiSetupCountdown(uint8_t secondsRemaining) {
  if (!initialized_) {
    return;
  }

  char countdownText[18];
  snprintf(countdownText, sizeof(countdownText), "Hold %u sec", secondsRemaining);
  display_.clearDisplay();
  display_.setFont(nullptr);
  display_.setTextColor(SSD1306_WHITE);
  drawCenteredText(F("WI-FI SETUP"), 4, 1);
  drawCenteredText(countdownText, 25, 1);
  drawCenteredText(F("Release: cancel"), 46, 1);
  display_.display();
}

void DisplayView::showWifiSetupActive(const char *ssid, const char *statusText) {
  if (!initialized_) {
    return;
  }

  display_.clearDisplay();
  display_.setFont(nullptr);
  display_.setTextColor(SSD1306_WHITE);
  drawCenteredText(F("WI-FI SETUP"), 0, 1);
  drawCenteredText(ssid, 16, 1);
  drawCenteredText(F("192.168.4.1"), 32, 1);
  drawCenteredText(statusText, 48, 1);
  display_.display();
}

void DisplayView::showDbCalibration(uint32_t remainingSeconds, uint16_t pointCount) {
  if (!initialized_) {
    return;
  }
  display_.clearDisplay();
  display_.setTextColor(SSD1306_WHITE);
  display_.setTextSize(1);
  display_.setFont(nullptr);
  char remainingText[20];
  snprintf(remainingText, sizeof(remainingText), "TL %02lu:%02lu",
           static_cast<unsigned long>(remainingSeconds / 60UL),
           static_cast<unsigned long>(remainingSeconds % 60UL));
  drawCenteredText(String(remainingText), 7, 2);
  char pointText[20];
  snprintf(pointText, sizeof(pointText), "POINT %u", pointCount);
  drawCenteredText(String(pointText), 39, 2);
  display_.display();
}

void DisplayView::nextPage() {
  currentPage_ = (currentPage_ + 1) % kPageCount;
}

void DisplayView::setEnabled(bool enabled) {
  if (!initialized_ || enabled_ == enabled) {
    enabled_ = enabled;
    return;
  }

  enabled_ = enabled;
  if (enabled_) {
    display_.ssd1306_command(SSD1306_DISPLAYON);
    blanked_ = false;
    return;
  }

  display_.clearDisplay();
  display_.display();
  display_.ssd1306_command(SSD1306_DISPLAYOFF);
  blanked_ = true;
}

bool DisplayView::isEnabled() const {
  return enabled_;
}

uint8_t DisplayView::currentPage() const {
  return currentPage_;
}

void DisplayView::drawCenteredText(const String &text, int16_t topY, uint8_t textSize) {
  display_.setTextSize(textSize);
  int16_t x1 = 0;
  int16_t y1 = 0;
  uint16_t width = 0;
  uint16_t height = 0;
  display_.getTextBounds(text, 0, topY, &x1, &y1, &width, &height);
  int16_t x = (kScreenWidth - static_cast<int16_t>(width)) / 2;
  if (x < 0) {
    x = 0;
  }
  display_.setCursor(x, topY);
  display_.print(text);
}

void DisplayView::renderSoundPage(const AudioSnapshot &snapshot, const Sht31Reading &sht31Reading,
                                  bool timeSynced, bool wifiConnected, uint8_t wifiPercent,
                                  const char *powerProfileText) {
  static constexpr int kTopBarMaxWidth = 31;
  static constexpr int kTopBarX = 46;
  static constexpr int kTopBarWidth = 33;
  int topBarWidth = map(snapshot.currentPercent, 0, 100, 0, kTopBarMaxWidth);
  topBarWidth = constrain(topBarWidth, 0, kTopBarMaxWidth);

  display_.setFont(nullptr);
  display_.setTextColor(SSD1306_WHITE);
  display_.setTextSize(2);
  char currentLine[8];
  snprintf(currentLine, sizeof(currentLine), "%u%%", snapshot.currentPercent);
  display_.setCursor(0, 0);
  display_.print(currentLine);

  display_.drawRect(kTopBarX, 0, kTopBarWidth, 16, SSD1306_WHITE);
  if (topBarWidth > 0) {
    display_.fillRect(kTopBarX + 1, 1, topBarWidth, 14, SSD1306_WHITE);
  }

  char wifiLine[10];
  if (wifiConnected) {
    snprintf(wifiLine, sizeof(wifiLine), "%u%%", wifiPercent);
  } else {
    snprintf(wifiLine, sizeof(wifiLine), "--");
  }
  int16_t wifiX = 89;
  if (wifiConnected && wifiPercent >= 100) {
    wifiX = 79;
  }
  display_.setCursor(wifiX + 1, 0);
  display_.print(wifiLine);

  display_.setTextSize(1);
  display_.setCursor(108, 20);
  display_.print(powerProfileText);

  display_.setFont(&FreeSans9pt7b);
  display_.setTextSize(1);
  char secondLine[24];
  if (snapshot.hourSamplesCollected < kHourWarmupCount) {
    snprintf(secondLine, sizeof(secondLine), "H %lu  M %u%%",
             static_cast<unsigned long>(snapshot.hourSamplesCollected / 60),
             snapshot.totalPercent);
  } else {
    snprintf(secondLine, sizeof(secondLine), "H %u%%  M %u%%", snapshot.hourPercent,
             snapshot.totalPercent);
  }
  drawCenteredText(String(secondLine), 35, 1);

  char environmentLine[24];
  if (!timeSynced) {
    snprintf(environmentLine, sizeof(environmentLine), "TIME WAIT");
  } else if (sht31Reading.available) {
    snprintf(environmentLine, sizeof(environmentLine), "T %.1f  H %.2f%%",
             sht31Reading.temperatureC, sht31Reading.humidityPct);
  } else {
    snprintf(environmentLine, sizeof(environmentLine), "T --.-  H --.--%%");
  }
  drawCenteredText(String(environmentLine), 57, 1);
}

void DisplayView::renderDebugPage(const AudioSnapshot &snapshot, const Sht31Reading &sht31Reading,
                                  const char *powerProfileText) {
  (void)sht31Reading;
  display_.setFont(nullptr);
  display_.setTextColor(SSD1306_WHITE);
  char titleLine[18];
  snprintf(titleLine, sizeof(titleLine), "DEBUG %s", powerProfileText);
  drawCenteredText(String(titleLine), 0, 2);

  char rawLine[28];
  snprintf(rawLine, sizeof(rawLine), "%ld/%ld", static_cast<long>(snapshot.rawMin),
           static_cast<long>(snapshot.rawMax));
  drawCenteredText(String(rawLine), 16, 2);

  char peakLine[16];
  snprintf(peakLine, sizeof(peakLine), "P2P %u", snapshot.peakToPeak);
  drawCenteredText(String(peakLine), 42, 2);
}

void DisplayView::renderRangePage(const AudioSnapshot &snapshot) {
  display_.setFont(nullptr);
  display_.setTextColor(SSD1306_WHITE);
  drawCenteredText(F("RANGE"), 0, 2);

  char minLine[18];
  snprintf(minLine, sizeof(minLine), "MIN %u", snapshot.sessionMinPeakToPeak);
  drawCenteredText(String(minLine), 17, 2);

  char stableLine[18];
  snprintf(stableLine, sizeof(stableLine), "STB %u", snapshot.sessionStableMaxPeakToPeak);
  drawCenteredText(String(stableLine), 34, 2);

  char maxLine[20];
  snprintf(maxLine, sizeof(maxLine), "RAW MAX %u", snapshot.sessionMaxPeakToPeak);
  drawCenteredText(String(maxLine), 52, 1);
}

void DisplayView::renderEnvironmentPage(const Sht31Reading &sht31Reading) {
  display_.setFont(nullptr);
  display_.setTextColor(SSD1306_WHITE);
  drawCenteredText(F("ENV"), 0, 2);

  char tempLine[18];
  if (sht31Reading.available) {
    snprintf(tempLine, sizeof(tempLine), "T %.1f C", sht31Reading.temperatureC);
  } else {
    snprintf(tempLine, sizeof(tempLine), "T --.- C");
  }
  drawCenteredText(String(tempLine), 20, 2);

  char humLine[18];
  if (sht31Reading.available) {
    snprintf(humLine, sizeof(humLine), "H %.1f%%", sht31Reading.humidityPct);
  } else {
    snprintf(humLine, sizeof(humLine), "H --.-%%");
  }
  drawCenteredText(String(humLine), 42, 2);
}

void DisplayView::drawPinnedIndicator(bool pinnedOn) {
  if (!pinnedOn || currentPage_ == 0) {
    return;
  }

  display_.setFont(nullptr);
  display_.setTextColor(SSD1306_WHITE);
  display_.setTextSize(1);
  display_.setCursor(108, currentPage_ == 1 ? 56 : 0);
  display_.print(F("PIN"));
}

void DisplayView::render(const AudioSnapshot &snapshot, const Sht31Reading &sht31Reading,
                         bool timeSynced, bool wifiConnected, uint8_t wifiPercent,
                         bool pinnedOn, const char *powerProfileText) {
  if (!initialized_) {
    return;
  }

  if (!enabled_) {
    if (!blanked_) {
      display_.clearDisplay();
      display_.display();
      blanked_ = true;
    }
    return;
  }

  display_.clearDisplay();
  blanked_ = false;
  switch (currentPage_) {
    case 0:
      renderSoundPage(snapshot, sht31Reading, timeSynced, wifiConnected, wifiPercent,
                      powerProfileText);
      break;
    case 1:
      renderDebugPage(snapshot, sht31Reading, powerProfileText);
      break;
    case 2:
      renderRangePage(snapshot);
      break;
    case 3:
    default:
      renderEnvironmentPage(sht31Reading);
      break;
  }
  drawPinnedIndicator(pinnedOn);
  display_.display();
}
