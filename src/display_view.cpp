#include "display_view.h"

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

void DisplayView::render(const AudioSnapshot &snapshot, const char *versionText,
                         uint32_t buildNumber, bool wifiConnected, uint8_t wifiPercent) {
  if (!initialized_) {
    return;
  }

  (void)versionText;
  (void)buildNumber;

  static constexpr int kTopBarMaxWidth = 31;
  static constexpr int kTopBarX = 46;
  static constexpr int kTopBarWidth = 33;
  int topBarWidth = map(snapshot.currentPercent, 0, 100, 0, kTopBarMaxWidth);
  topBarWidth = constrain(topBarWidth, 0, kTopBarMaxWidth);

  display_.clearDisplay();
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

  display_.setTextSize(2);
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

  display_.setTextSize(2);
  if (snapshot.hourSamplesCollected < kHourWarmupCount) {
    char warmupLine[12];
    snprintf(warmupLine, sizeof(warmupLine), "HW %lu",
             static_cast<unsigned long>(snapshot.hourSamplesCollected / 60));
    display_.setCursor(0, 20);
    display_.print(warmupLine);

    int16_t warmupWidth = static_cast<int16_t>(strlen(warmupLine)) * 12;
    char totalLine[10];
    snprintf(totalLine, sizeof(totalLine), "M %u%%", snapshot.totalPercent);
    display_.setCursor(warmupWidth + 4, 20);
    display_.print(totalLine);
  } else {
    char hourLine[10];
    snprintf(hourLine, sizeof(hourLine), "H %u%%", snapshot.hourPercent);
    display_.setCursor(0, 20);
    display_.print(hourLine);

    int16_t hourWidth = static_cast<int16_t>(strlen(hourLine)) * 12;
    char totalLine[10];
    snprintf(totalLine, sizeof(totalLine), "M %u%%", snapshot.totalPercent);
    display_.setCursor(hourWidth + 3, 20);
    display_.print(totalLine);
  }

  char rawLine[20];
  snprintf(rawLine, sizeof(rawLine), "%u-%u", snapshot.rawMin, snapshot.rawMax);
  display_.setTextSize(2);
  int16_t rawX = (kScreenWidth - static_cast<int16_t>(strlen(rawLine)) * 12) / 2;
  if (rawX < 0) {
    rawX = 0;
  }
  display_.setCursor(rawX, 42);
  display_.print(rawLine);

  display_.display();
}
