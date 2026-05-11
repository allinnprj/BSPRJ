#include <Arduino.h>
#include <Wire.h>

#include "audio_sampler.h"
#include "button_service.h"
#include "display_view.h"
#include "google_sheets_service.h"
#include "log_service.h"
#include "mqtt_service.h"
#include "project_version.h"
#include "sht31_service.h"
#include "time_service.h"
#include "wifi_service.h"

static constexpr uint8_t SDA_PIN = 21;
static constexpr uint8_t SCL_PIN = 22;
static constexpr uint8_t MIC_PIN = 34;
static constexpr uint8_t BUTTON_PIN = 27;
static constexpr uint8_t OLED_ADDRESS = 0x3C;
static constexpr uint16_t DISPLAY_REFRESH_MS = 500;
static constexpr uint16_t SERIAL_LOG_INTERVAL_MS = 5000;
static constexpr uint8_t GOOGLE_SHEETS_WINDOW_MINUTES = 10;
static constexpr unsigned long GOOGLE_SHEETS_RETRY_INTERVAL_MS = 30000UL;
static constexpr unsigned long DISPLAY_IDLE_TIMEOUT_MS = 60000UL;
static constexpr unsigned long STARTUP_SERIAL_DELAY_MS = 300UL;
static constexpr unsigned long BOOT_SCREEN_DELAY_MS = 600UL;

enum class DayPart : uint8_t {
  Night,
  Day,
  Evening,
};

struct DayPartStats {
  uint64_t levelSum = 0;
  uint64_t percentSum = 0;
  uint32_t count = 0;
  uint8_t quietCount = 0;
  uint8_t loudCount = 0;
};

struct GoogleSheetsAccumulator {
  bool active = false;
  String windowKey;
  String dateText;
  String timeFromText;
  String timeToText;
  String dayPartText;
  uint32_t currentPercentSum = 0;
  uint32_t hourPercentSum = 0;
  uint32_t totalPercentSum = 0;
  uint32_t peakToPeakSum = 0;
  uint16_t minRaw = 4095;
  uint16_t maxRaw = 0;
  uint32_t quietCount = 0;
  uint32_t loudCount = 0;
  uint32_t sampleCount = 0;
  SignalState worstSignalState = SignalState::Low;
};

AudioSampler audioSampler;
ButtonService buttonService;
DisplayView displayView;
GoogleSheetsService googleSheetsService;
LogService logService;
MqttService mqttService;
Sht31Service sht31Service;
TimeService timeService;
WifiService wifiService;
AudioSnapshot latestSnapshot;
Sht31Reading latestSht31Reading;
unsigned long lastDisplayAt = 0;
unsigned long lastSerialLogAt = 0;
unsigned long lastGoogleSheetsAttemptAt = 0;
unsigned long lastDisplayInteractionAt = 0;
DayPartStats dayPartStats[3];
GoogleSheetsAccumulator activeSheetsWindow;
GoogleSheetsWindowRecord pendingSheetsUpload;
bool pendingSheetsUploadReady = false;

const char *signalStateText(SignalState state) {
  switch (state) {
    case SignalState::Clip:
      return "CLIP";
    case SignalState::Ok:
      return "OK";
    case SignalState::Low:
    default:
      return "LOW";
  }
}

const char *mqttNoiseLevelText(uint8_t percent) {
  if (percent <= 20) {
    return "SILENT";
  }
  if (percent <= 40) {
    return "NORMAL";
  }
  if (percent <= 60) {
    return "LOUD";
  }
  return "PEAK";
}

uint8_t signalStateSeverity(SignalState state) {
  switch (state) {
    case SignalState::Clip:
      return 2;
    case SignalState::Ok:
      return 1;
    case SignalState::Low:
    default:
      return 0;
  }
}

DayPart dayPartFromHour(uint8_t hour) {
  if (hour >= 7 && hour < 18) {
    return DayPart::Day;
  }
  if (hour >= 18 && hour < 24) {
    return DayPart::Evening;
  }
  return DayPart::Night;
}

size_t dayPartIndex(DayPart dayPart) {
  switch (dayPart) {
    case DayPart::Day:
      return 1;
    case DayPart::Evening:
      return 2;
    case DayPart::Night:
    default:
      return 0;
  }
}

const char *dayPartText(DayPart dayPart) {
  switch (dayPart) {
    case DayPart::Day:
      return "DAY";
    case DayPart::Evening:
      return "EVE";
    case DayPart::Night:
    default:
      return "NGT";
  }
}

const char *dayPartMqttText(DayPart dayPart) {
  switch (dayPart) {
    case DayPart::Day:
      return "day";
    case DayPart::Evening:
      return "evening";
    case DayPart::Night:
    default:
      return "night";
  }
}

uint32_t dayPartAverageLevel(const DayPartStats &stats) {
  return stats.count == 0 ? 0 : static_cast<uint32_t>(stats.levelSum / stats.count);
}

uint32_t dayPartAveragePercent(const DayPartStats &stats) {
  return stats.count == 0 ? 0 : static_cast<uint32_t>(stats.percentSum / stats.count);
}

String twoDigitText(uint8_t value) {
  char buffer[4];
  snprintf(buffer, sizeof(buffer), "%02u", value);
  return String(buffer);
}

String uptimeDateText(unsigned long uptimeMs) {
  uint32_t totalSeconds = static_cast<uint32_t>(uptimeMs / 1000UL);
  uint32_t totalMinutes = totalSeconds / 60UL;
  uint32_t totalHours = totalMinutes / 60UL;
  uint32_t days = totalHours / 24UL;
  uint32_t hours = totalHours % 24UL;
  uint32_t minutes = totalMinutes % 60UL;

  String text = String(days);
  text += "d, ";
  text += String(hours);
  text += "h, ";
  text += String(minutes);
  text += "m";
  return text;
}

String googleSheetsWindowKey(const TimeService &timeService) {
  uint8_t startMinute = static_cast<uint8_t>((timeService.minute() / GOOGLE_SHEETS_WINDOW_MINUTES) *
                                             GOOGLE_SHEETS_WINDOW_MINUTES);
  return timeService.dateString() + " " + twoDigitText(timeService.hour()) + ":" +
         twoDigitText(startMinute);
}

String googleSheetsWindowStartText(const TimeService &timeService) {
  uint8_t startMinute = static_cast<uint8_t>((timeService.minute() / GOOGLE_SHEETS_WINDOW_MINUTES) *
                                             GOOGLE_SHEETS_WINDOW_MINUTES);
  return twoDigitText(timeService.hour()) + ":" + twoDigitText(startMinute) + ":00";
}

String googleSheetsWindowEndText(const TimeService &timeService) {
  uint8_t startMinute = static_cast<uint8_t>((timeService.minute() / GOOGLE_SHEETS_WINDOW_MINUTES) *
                                             GOOGLE_SHEETS_WINDOW_MINUTES);
  uint8_t endMinute = static_cast<uint8_t>(startMinute + GOOGLE_SHEETS_WINDOW_MINUTES - 1);
  return twoDigitText(timeService.hour()) + ":" + twoDigitText(endMinute) + ":59";
}

void resetGoogleSheetsAccumulator(GoogleSheetsAccumulator &window, const TimeService &timeService,
                                  DayPart currentDayPart) {
  window.active = true;
  window.windowKey = googleSheetsWindowKey(timeService);
  window.dateText = timeService.dateString();
  window.timeFromText = googleSheetsWindowStartText(timeService);
  window.timeToText = googleSheetsWindowEndText(timeService);
  window.dayPartText = dayPartText(currentDayPart);
  window.currentPercentSum = 0;
  window.hourPercentSum = 0;
  window.totalPercentSum = 0;
  window.peakToPeakSum = 0;
  window.minRaw = 4095;
  window.maxRaw = 0;
  window.quietCount = 0;
  window.loudCount = 0;
  window.sampleCount = 0;
  window.worstSignalState = SignalState::Low;
}

GoogleSheetsWindowRecord buildGoogleSheetsRecord(const GoogleSheetsAccumulator &window) {
  GoogleSheetsWindowRecord record{};
  if (!window.active || window.sampleCount == 0) {
    return record;
  }

  record.windowKey = window.windowKey;
  record.dateText = window.dateText;
  record.timeFromText = window.timeFromText;
  record.timeToText = window.timeToText;
  record.dayPartText = window.dayPartText;
  record.averageNowPercent =
      static_cast<uint8_t>(window.currentPercentSum / window.sampleCount);
  record.averageHourPercent =
      static_cast<uint8_t>(window.hourPercentSum / window.sampleCount);
  record.averageTotalPercent =
      static_cast<uint8_t>(window.totalPercentSum / window.sampleCount);
  record.minRaw = window.minRaw;
  record.maxRaw = window.maxRaw;
  record.averagePeakToPeak =
      static_cast<uint16_t>(window.peakToPeakSum / window.sampleCount);
  record.signalText = signalStateText(window.worstSignalState);
  record.quietCount = window.quietCount;
  record.loudCount = window.loudCount;
  record.sampleCount = window.sampleCount;
  record.windowMinutes = GOOGLE_SHEETS_WINDOW_MINUTES;
  return record;
}

void updateGoogleSheetsWindow(const AudioSnapshot &snapshot, const TimeService &timeService) {
  if (!snapshot.statsUpdated || !timeService.isSynced()) {
    return;
  }

  DayPart currentDayPart = dayPartFromHour(timeService.hour());
  String currentWindowKey = googleSheetsWindowKey(timeService);
  if (!activeSheetsWindow.active) {
    resetGoogleSheetsAccumulator(activeSheetsWindow, timeService, currentDayPart);
  } else if (activeSheetsWindow.windowKey != currentWindowKey) {
    if (!pendingSheetsUploadReady) {
      pendingSheetsUpload = buildGoogleSheetsRecord(activeSheetsWindow);
      pendingSheetsUploadReady = !pendingSheetsUpload.windowKey.isEmpty();
      if (pendingSheetsUploadReady) {
        Serial.print(F("[GS] queued window -> "));
        Serial.print(pendingSheetsUpload.timeFromText);
        Serial.print(F(".."));
        Serial.print(pendingSheetsUpload.timeToText);
        Serial.print(F(" samples="));
        Serial.print(pendingSheetsUpload.sampleCount);
        Serial.print(F(" avgNow="));
        Serial.println(pendingSheetsUpload.averageNowPercent);
      }
    }
    resetGoogleSheetsAccumulator(activeSheetsWindow, timeService, currentDayPart);
  }

  activeSheetsWindow.currentPercentSum += snapshot.currentPercent;
  activeSheetsWindow.hourPercentSum += snapshot.hourPercent;
  activeSheetsWindow.totalPercentSum += snapshot.totalPercent;
  activeSheetsWindow.peakToPeakSum += snapshot.peakToPeak;
  if (snapshot.rawMin < activeSheetsWindow.minRaw) {
    activeSheetsWindow.minRaw = snapshot.rawMin;
  }
  if (snapshot.rawMax > activeSheetsWindow.maxRaw) {
    activeSheetsWindow.maxRaw = snapshot.rawMax;
  }
  if (snapshot.currentPercent <= 10) {
    activeSheetsWindow.quietCount++;
  }
  if (snapshot.currentPercent >= 70) {
    activeSheetsWindow.loudCount++;
  }
  if (signalStateSeverity(snapshot.signalState) >
      signalStateSeverity(activeSheetsWindow.worstSignalState)) {
    activeSheetsWindow.worstSignalState = snapshot.signalState;
  }
  activeSheetsWindow.sampleCount++;
}

void uploadPendingGoogleSheetsWindow() {
  if (!pendingSheetsUploadReady) {
    return;
  }

  unsigned long nowMs = millis();
  if (lastGoogleSheetsAttemptAt != 0 &&
      nowMs - lastGoogleSheetsAttemptAt < GOOGLE_SHEETS_RETRY_INTERVAL_MS) {
    return;
  }
  lastGoogleSheetsAttemptAt = nowMs;

  if (googleSheetsService.appendWindowAggregate(pendingSheetsUpload, PROJECT_VERSION,
                                                PROJECT_BUILD)) {
    Serial.print(F("[GS] uploaded window -> "));
    Serial.print(pendingSheetsUpload.timeFromText);
    Serial.print(F(".."));
    Serial.print(pendingSheetsUpload.timeToText);
    Serial.print(F(" samples="));
    Serial.println(pendingSheetsUpload.sampleCount);
    pendingSheetsUploadReady = false;
    lastGoogleSheetsAttemptAt = 0;
  }
}

void updateDayPartStats(const AudioSnapshot &snapshot, const TimeService &timeService) {
  if (!snapshot.statsUpdated || !timeService.isSynced()) {
    return;
  }

  DayPart dayPart = dayPartFromHour(timeService.hour());
  DayPartStats &stats = dayPartStats[dayPartIndex(dayPart)];
  stats.levelSum += snapshot.statsLevel;
  stats.percentSum += snapshot.currentPercent;
  stats.count++;
  if (snapshot.currentPercent <= 10) {
    stats.quietCount++;
  }
  if (snapshot.currentPercent >= 70) {
    stats.loudCount++;
  }
}

void appendLogSample(const AudioSnapshot &snapshot, const TimeService &timeService) {
  if (!snapshot.statsUpdated || !timeService.isSynced()) {
    return;
  }

  DayPart currentDayPart = dayPartFromHour(timeService.hour());
  DayPartStats &stats = dayPartStats[dayPartIndex(currentDayPart)];
  uint32_t partAverage = dayPartAverageLevel(stats);
  String minuteKey = timeService.dateString() + " " + timeService.timeString().substring(0, 5);
  logService.appendMinuteSample(minuteKey, timeService.dateString(), timeService.timeString(),
                                dayPartText(currentDayPart), snapshot, partAverage,
                                stats.quietCount, stats.loudCount);
}

void updateMqttState(const AudioSnapshot &snapshot) {
  MqttRuntimeState state{};
  unsigned long uptimeMs = millis();
  uint32_t uptimeMinutes = static_cast<uint32_t>(uptimeMs / 60000UL);
  state.snapshot = snapshot;
  state.signalText = signalStateText(snapshot.signalState);
  state.mqttSignalText = mqttNoiseLevelText(snapshot.currentPercent);
  state.timeSynced = timeService.isSynced();
  state.wifiStatus = wifiService.statusTextCStr();
  state.wifiSignalPercent = wifiService.signalPercent();
  state.wifiRssiDbm = wifiService.rssiDbm();
  state.ipAddress = wifiService.ipAddressString();
  state.environmentAvailable = latestSht31Reading.available;
  state.temperatureC = latestSht31Reading.temperatureC;
  state.humidityPct = latestSht31Reading.humidityPct;
  state.uptimeMinutes = uptimeMinutes;
  state.uptimeHours = uptimeMinutes / 60UL;
  state.uptimeDateText = uptimeDateText(uptimeMs);
  state.lastUpdateText = state.uptimeDateText;

  if (state.timeSynced) {
    DayPart currentDayPart = dayPartFromHour(timeService.hour());
    state.timestamp = timeService.dateTimeString();
    state.lastUpdateText = state.timestamp;
    state.currentPeriod = dayPartMqttText(currentDayPart);
    state.currentPeriodPercent =
        dayPartAveragePercent(dayPartStats[dayPartIndex(currentDayPart)]);
  }

  state.dayPercent = dayPartAveragePercent(dayPartStats[dayPartIndex(DayPart::Day)]);
  state.eveningPercent =
      dayPartAveragePercent(dayPartStats[dayPartIndex(DayPart::Evening)]);
  state.nightPercent = dayPartAveragePercent(dayPartStats[dayPartIndex(DayPart::Night)]);

  mqttService.update(wifiService.isConnected(), state);
}

void scanI2cBus(TwoWire *wire) {
  Serial.println(F("[I2C] scan start"));
  uint8_t foundCount = 0;
  for (uint8_t address = 1; address < 127; ++address) {
    wire->beginTransmission(address);
    uint8_t error = wire->endTransmission();
    if (error == 0) {
      Serial.print(F("[I2C] found 0x"));
      if (address < 16) {
        Serial.print('0');
      }
      Serial.println(address, HEX);
      foundCount++;
    }
  }
  if (foundCount == 0) {
    Serial.println(F("[I2C] no devices found"));
  }
}

void setup() {
  Serial.begin(115200);
  delay(STARTUP_SERIAL_DELAY_MS);

  Serial.println();
  Serial.println(F("ESP32 sound statistics clean restart"));
  Serial.print(F("Version: "));
  Serial.print(F(PROJECT_VERSION));
  Serial.print(F(" build "));
  Serial.println(PROJECT_BUILD);
  Serial.println(F("Display contract: Now / H / M"));
  Serial.println(F("Time and WiFi will activate when the network is available."));
  Serial.print(F("[BTN] pin="));
  Serial.println(BUTTON_PIN);
  Serial.print(F("[I2C] pins SDA="));
  Serial.print(SDA_PIN);
  Serial.print(F(" SCL="));
  Serial.println(SCL_PIN);

  audioSampler.begin(MIC_PIN);
  buttonService.begin(BUTTON_PIN);
  googleSheetsService.begin();
  logService.begin();
  mqttService.begin();
  timeService.begin();
  wifiService.begin();
  Wire.begin(SDA_PIN, SCL_PIN);
  scanI2cBus(&Wire);
  sht31Service.begin(&Wire);
  if (sht31Service.isAvailable()) {
    Serial.print(F("[SHT31] ready -> 0x"));
    Serial.println(sht31Service.address(), HEX);
  } else {
    Serial.println(F("[SHT31] not found at 0x44"));
  }
  if (!displayView.begin(&Wire, SDA_PIN, SCL_PIN, OLED_ADDRESS)) {
    Serial.println(F("SSD1306 init failed."));
    while (true) {
      delay(1000);
    }
  }
  char bootLine1[32];
  snprintf(bootLine1, sizeof(bootLine1), "%s b%u", PROJECT_VERSION, PROJECT_BUILD);
  displayView.showBootMessage(bootLine1, "Addr 0x3C  Pins 21/22");
  delay(BOOT_SCREEN_DELAY_MS);
  lastDisplayInteractionAt = millis();
}

void loop() {
  unsigned long nowMs = millis();
  ButtonEvent buttonEvent = buttonService.update();
  if (buttonEvent == ButtonEvent::ShortPress) {
    if (displayView.isEnabled()) {
      displayView.nextPage();
      lastDisplayInteractionAt = nowMs;
      Serial.print(F("[BTN] short press -> page "));
      Serial.println(displayView.currentPage());
    } else {
      displayView.setEnabled(true);
      lastDisplayInteractionAt = nowMs;
      Serial.println(F("[BTN] short press -> display ON"));
    }
  } else if (buttonEvent == ButtonEvent::LongPress) {
    displayView.toggleEnabled();
    if (displayView.isEnabled()) {
      lastDisplayInteractionAt = nowMs;
    }
    Serial.print(F("[BTN] long press -> display "));
    Serial.println(displayView.isEnabled() ? F("ON") : F("OFF"));
  }

  wifiService.update();
  logService.update(wifiService.isConnected(), wifiService.ipAddressString());
  timeService.update(wifiService.isConnected());
  latestSht31Reading = sht31Service.update();
  latestSnapshot = audioSampler.sample();
  updateDayPartStats(latestSnapshot, timeService);
  updateGoogleSheetsWindow(latestSnapshot, timeService);
  appendLogSample(latestSnapshot, timeService);
  uploadPendingGoogleSheetsWindow();
  updateMqttState(latestSnapshot);

  if (displayView.isEnabled() &&
      nowMs - lastDisplayInteractionAt >= DISPLAY_IDLE_TIMEOUT_MS) {
    displayView.setEnabled(false);
    Serial.println(F("[DSP] idle timeout -> display OFF"));
  }

  if (nowMs - lastDisplayAt >= DISPLAY_REFRESH_MS) {
    lastDisplayAt = nowMs;
    displayView.render(latestSnapshot, latestSht31Reading, PROJECT_VERSION, PROJECT_BUILD,
                       wifiService.isConnected(), wifiService.signalPercent());
  }

  if (nowMs - lastSerialLogAt >= SERIAL_LOG_INTERVAL_MS) {
    lastSerialLogAt = nowMs;
    Serial.print('[');
    if (timeService.isSynced()) {
      Serial.print(timeService.timeString());
    } else {
      Serial.print(F("--:--:--"));
    }
    Serial.print(F("] [STAT] now="));
    Serial.print(latestSnapshot.currentLevel);
    Serial.print(F(" hour="));
    Serial.print(latestSnapshot.hourAverage);
    Serial.print(F(" all="));
    Serial.print(latestSnapshot.totalAverage);
    Serial.print(F(" pct="));
    Serial.print(latestSnapshot.currentPercent);
    Serial.print('/');
    Serial.print(latestSnapshot.hourPercent);
    Serial.print('/');
    Serial.print(latestSnapshot.totalPercent);
    Serial.print(F(" raw="));
    Serial.print(latestSnapshot.rawMin);
    Serial.print('-');
    Serial.print(latestSnapshot.rawMax);
    Serial.print(F(" p2p="));
    Serial.print(latestSnapshot.peakToPeak);
    Serial.print(F(" sig="));
    Serial.print(signalStateText(latestSnapshot.signalState));
    if (timeService.isSynced()) {
      DayPart currentDayPart = dayPartFromHour(timeService.hour());
      DayPartStats &stats = dayPartStats[dayPartIndex(currentDayPart)];
      Serial.print(F(" part="));
      Serial.print(dayPartText(currentDayPart));
      Serial.print(F(" avg="));
      Serial.print(dayPartAverageLevel(stats));
      Serial.print(F(" quiet="));
      Serial.print(stats.quietCount);
      Serial.print(F(" loud="));
      Serial.print(stats.loudCount);
    }
    if (wifiService.isConnected()) {
      Serial.print(F(" wifi="));
      Serial.print(wifiService.signalPercent());
      Serial.print(F("%("));
      Serial.print(wifiService.rssiDbm());
      Serial.print(F("dBm)"));
    }
    if (latestSht31Reading.available) {
      Serial.print(F(" env="));
      Serial.print(latestSht31Reading.temperatureC, 1);
      Serial.print(F("C/"));
      Serial.print(latestSht31Reading.humidityPct, 1);
      Serial.print(F("%"));
    }
    Serial.println();
  }

  delay(20);
}
