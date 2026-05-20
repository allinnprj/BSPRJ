#include "display_view.h"

#include <Fonts/FreeSans9pt7b.h>
#include <math.h>

bool DisplayView::begin(TwoWire *wire, uint8_t sdaPin, uint8_t sclPin, uint8_t address) {
  display_ = Adafruit_SSD1306(kScreenWidth, kScreenHeight, wire, -1);
  initialized_ = display_.begin(SSD1306_SWITCHCAPVCC, address);
  return initialized_;
}

void DisplayView::showBootMessage(const char *line1, const char *line2) {
  if (!initialized_) {
    return;
  }

  display_.clearDisplay();
  display_.setTextColor(SSD1306_WHITE);
  display_.setTextSize(1);
  display_.setCursor(0, 0);
  display_.println(F("OLED OK"));
  display_.setCursor(0, 18);
  display_.println(line1);
  display_.setCursor(0, 30);
  display_.println(line2);
  display_.display();
}

void DisplayView::nextPage() {
  currentPage_ = (currentPage_ + 1) % kPageCount;
}

void DisplayView::setEnabled(bool enabled) {
  enabled_ = enabled;
}

void DisplayView::toggleEnabled() {
  enabled_ = !enabled_;
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
                                  bool timeSynced, bool wifiConnected, uint8_t wifiPercent) {
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

void DisplayView::renderDebugPage(const AudioSnapshot &snapshot, const Sht31Reading &sht31Reading) {
  (void)sht31Reading;
  display_.setFont(nullptr);
  display_.setTextColor(SSD1306_WHITE);
  drawCenteredText(F("DEBUG"), 0, 2);

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
  drawCenteredText(String(minLine), 20, 2);

  char maxLine[18];
  snprintf(maxLine, sizeof(maxLine), "MAX %u", snapshot.sessionMaxPeakToPeak);
  drawCenteredText(String(maxLine), 44, 2);
}

void DisplayView::render(const AudioSnapshot &snapshot, const Sht31Reading &sht31Reading,
                         const char *versionText, uint32_t buildNumber, bool timeSynced,
                         bool wifiConnected,
                         uint8_t wifiPercent) {
  if (!initialized_) {
    return;
  }

  (void)versionText;
  (void)buildNumber;
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
      renderSoundPage(snapshot, sht31Reading, timeSynced, wifiConnected, wifiPercent);
      break;
    case 1:
      renderDebugPage(snapshot, sht31Reading);
      break;
    case 2:
    default:
      renderRangePage(snapshot);
      break;
  }
  display_.display();
}
