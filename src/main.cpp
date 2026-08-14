#include <Arduino.h>
#include <ArduinoOTA.h>
#include <esp_system.h>
#include <limits.h>
#include <Wire.h>

#include "audio_sampler.h"
#include "button_service.h"
#include "controller_link_service.h"
#include "display_view.h"
#include "google_sheets_service.h"
#include "log_service.h"
#include "mean_persistence_service.h"
#include "mqtt_service.h"
#include "project_version.h"
#include "sht31_service.h"
#include "secrets.h"
#include "telegram_alert_service.h"
#include "time_service.h"
#include "wifi_service.h"

static constexpr uint8_t SDA_PIN = 21;
static constexpr uint8_t SCL_PIN = 22;
static constexpr uint8_t I2S_BCLK_PIN = 26;
static constexpr uint8_t I2S_WS_PIN = 25;
static constexpr uint8_t I2S_DATA_PIN = 32;
static constexpr uint8_t BUTTON_PIN = 27;
static constexpr uint8_t CONTROLLER_UART_RX_PIN = 16;
static constexpr uint8_t CONTROLLER_UART_TX_PIN = 17;
static constexpr uint8_t OLED_ADDRESS = 0x3C;
static constexpr uint16_t DISPLAY_DEBUG_REFRESH_MS = 1000;
static constexpr uint16_t DISPLAY_NORMAL_REFRESH_MS = 2000;
static constexpr uint16_t SERIAL_LOG_INTERVAL_MS = 30000;
static constexpr uint8_t GOOGLE_SHEETS_WINDOW_MINUTES = 10;
static constexpr unsigned long GOOGLE_SHEETS_RETRY_INTERVAL_MS = 30000UL;
static constexpr uint8_t GOOGLE_SHEETS_QUEUE_SIZE = 6;
static constexpr unsigned long MEAN_PERSIST_INTERVAL_MS = 600000UL;
static constexpr unsigned long DISPLAY_IDLE_TIMEOUT_MS = 15000UL;
static constexpr unsigned long STARTUP_SERIAL_DELAY_MS = 80UL;
static constexpr unsigned long BOOT_SCREEN_DELAY_MS = 120UL;
static constexpr unsigned long SCHEDULED_RESTART_INTERVAL_MS = 86400000UL;
static constexpr unsigned long SCHEDULED_RESTART_BOUNDARY_GRACE_MS = 10000UL;
static constexpr unsigned long UPTIME_RTC_SAVE_INTERVAL_MS = 60000UL;
static constexpr uint16_t MAX_WINDOW_LEVEL_SAMPLES = 620;
static constexpr uint16_t SHT31_LOST_WARN_SECONDS = 120;
static constexpr unsigned long SHT31_RECOVER_INTERVAL_MS = 60000UL;
static constexpr bool STARTUP_I2C_SCAN_ENABLED = false;
static constexpr uint32_t POWER_SESSION_MAGIC = 0xB510B510UL;
static constexpr uint16_t NOISE_LEVEL_SILENT_MAX = 350;
static constexpr uint16_t NOISE_LEVEL_NORMAL_MAX = 650;
static constexpr uint16_t NOISE_LEVEL_LOUD_MAX = 850;

RTC_NOINIT_ATTR uint32_t rtcPowerSessionMagic;
RTC_NOINIT_ATTR uint32_t rtcBootSequence;
RTC_NOINIT_ATTR uint64_t rtcPowerUptimeBaseMs;
RTC_NOINIT_ATTR uint64_t rtcLastKnownPowerUptimeMs;

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
  uint16_t levelSamples[MAX_WINDOW_LEVEL_SAMPLES] = {};
  uint16_t levelSampleCount = 0;
  uint16_t minPeakToPeak = UINT16_MAX;
  uint16_t maxPeakToPeak = 0;
  uint16_t stableMaxPeakToPeak = 0;
  int32_t minRaw = INT32_MAX;
  int32_t maxRaw = INT32_MIN;
  uint32_t quietCount = 0;
  uint32_t loudCount = 0;
  float temperatureSum = 0.0f;
  float humiditySum = 0.0f;
  uint32_t environmentSampleCount = 0;
  uint32_t environmentFailCount = 0;
  uint32_t sampleCount = 0;
  SignalState worstSignalState = SignalState::Low;
  bool lowSignalWarning = false;
  bool clipSignalWarning = false;
};

AudioSampler audioSampler;
ButtonService buttonService;
ControllerLinkService controllerLinkService;
DisplayView displayView;
GoogleSheetsService googleSheetsService;
LogService logService;
MeanPersistenceService meanPersistenceService;
MqttService mqttService;
Sht31Service sht31Service;
TelegramAlertService telegramAlertService;
TimeService timeService;
WifiService wifiService;
AudioSnapshot latestSnapshot;
Sht31Reading latestSht31Reading;
unsigned long lastDisplayAt = 0;
unsigned long lastSerialLogAt = 0;
unsigned long lastGoogleSheetsAttemptAt = 0;
unsigned long lastDisplayInteractionAt = 0;
unsigned long lastMeanPersistAt = 0;
unsigned long lastRtcUptimeSaveAt = 0;
unsigned long lastSht31RecoverAttemptAt = 0;
bool displayPinnedOn = false;
bool scheduledRestartStarted = false;
bool scheduledRestartWaitLogged = false;
bool sht31LostLogged = false;
bool otaStarted = false;
uint16_t sht31UnavailableSeconds = 0;
uint16_t sht31RecoverCount = 0;
uint32_t currentBootSequence = 0;
unsigned long lastCompletedSheetsWindowAt = 0;
String currentResetReason;
DayPartStats dayPartStats[3];
GoogleSheetsAccumulator activeSheetsWindow;
GoogleSheetsWindowRecord pendingSheetsUploads[GOOGLE_SHEETS_QUEUE_SIZE];
uint8_t pendingSheetsHead = 0;
uint8_t pendingSheetsTail = 0;
uint8_t pendingSheetsCount = 0;

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

String signalQualityText(SignalState state, bool lowSignalWarning, bool clipSignalWarning) {
  if (clipSignalWarning) {
    return String(F("CLIP_HOLD"));
  }
  if (lowSignalWarning) {
    return String(F("LOW_HOLD"));
  }
  return String(signalStateText(state));
}

const char *noiseLevelText(uint32_t level) {
  if (level <= NOISE_LEVEL_SILENT_MAX) {
    return "SILENT";
  }
  if (level <= NOISE_LEVEL_NORMAL_MAX) {
    return "NORMAL";
  }
  if (level <= NOISE_LEVEL_LOUD_MAX) {
    return "LOUD";
  }
  return "PEAK";
}

bool isSilentNoiseLevel(uint32_t level) {
  return level <= NOISE_LEVEL_SILENT_MAX;
}

bool isLoudOrPeakNoiseLevel(uint32_t level) {
  return level > NOISE_LEVEL_NORMAL_MAX;
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

uint16_t currentDisplayRefreshIntervalMs() {
  return displayView.currentPage() == 1 ? DISPLAY_DEBUG_REFRESH_MS : DISPLAY_NORMAL_REFRESH_MS;
}

String twoDigitText(uint8_t value) {
  char buffer[4];
  snprintf(buffer, sizeof(buffer), "%02u", value);
  return String(buffer);
}

String formatCompactUptime(uint64_t uptimeMs) {
  uint32_t totalMinutes = static_cast<uint32_t>(uptimeMs / 60000ULL);
  uint32_t days = totalMinutes / 1440UL;
  uint32_t hours = (totalMinutes % 1440UL) / 60UL;
  uint32_t minutes = totalMinutes % 60UL;

  return String(days) + F(" d ") + String(hours) + F(" h ") + String(minutes) + F(" m");
}

uint64_t powerUptimeMs() {
  return rtcPowerUptimeBaseMs + static_cast<uint64_t>(millis());
}

uint32_t powerUptimeMinutes() {
  return static_cast<uint32_t>(powerUptimeMs() / 60000ULL);
}

void savePowerUptimeCheckpoint() {
  rtcLastKnownPowerUptimeMs = powerUptimeMs();
}

uint16_t percentile95(const uint16_t *values, uint16_t count) {
  if (count == 0) {
    return 0;
  }

  uint16_t sorted[MAX_WINDOW_LEVEL_SAMPLES];
  uint16_t safeCount = min(count, MAX_WINDOW_LEVEL_SAMPLES);
  for (uint16_t index = 0; index < safeCount; ++index) {
    sorted[index] = values[index];
  }

  for (uint16_t index = 1; index < safeCount; ++index) {
    uint16_t value = sorted[index];
    int16_t cursor = static_cast<int16_t>(index) - 1;
    while (cursor >= 0 && sorted[cursor] > value) {
      sorted[cursor + 1] = sorted[cursor];
      cursor--;
    }
    sorted[cursor + 1] = value;
  }

  uint16_t percentileIndex =
      static_cast<uint16_t>(((static_cast<uint32_t>(safeCount) * 95UL) + 99UL) / 100UL);
  if (percentileIndex == 0) {
    percentileIndex = 1;
  }
  return sorted[percentileIndex - 1];
}

String resetReasonText(esp_reset_reason_t reason) {
  switch (reason) {
    case ESP_RST_POWERON:
      return F("POWERON");
    case ESP_RST_SW:
      return F("SOFT");
    case ESP_RST_PANIC:
      return F("PANIC");
    case ESP_RST_INT_WDT:
      return F("INT_WDT");
    case ESP_RST_TASK_WDT:
      return F("TASK_WDT");
    case ESP_RST_WDT:
      return F("WDT");
    case ESP_RST_DEEPSLEEP:
      return F("DEEPSLEEP");
    case ESP_RST_BROWNOUT:
      return F("BROWNOUT");
    case ESP_RST_SDIO:
      return F("SDIO");
    case ESP_RST_EXT:
      return F("EXT");
    default:
      return F("UNKNOWN");
  }
}

String currentDateText() {
  return timeService.isSynced() ? timeService.dateString() : String();
}

String currentTimeText() {
  return timeService.isSynced() ? timeService.timeString() : String();
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
  window.levelSampleCount = 0;
  window.minPeakToPeak = UINT16_MAX;
  window.maxPeakToPeak = 0;
  window.stableMaxPeakToPeak = 0;
  window.minRaw = INT32_MAX;
  window.maxRaw = INT32_MIN;
  window.quietCount = 0;
  window.loudCount = 0;
  window.temperatureSum = 0.0f;
  window.humiditySum = 0.0f;
  window.environmentSampleCount = 0;
  window.environmentFailCount = 0;
  window.sampleCount = 0;
  window.worstSignalState = SignalState::Low;
  window.lowSignalWarning = false;
  window.clipSignalWarning = false;
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
  record.levelText = noiseLevelText(record.averagePeakToPeak);
  record.peakToPeakP95 = percentile95(window.levelSamples, window.levelSampleCount);
  record.minPeakToPeak = window.minPeakToPeak == UINT16_MAX ? 0 : window.minPeakToPeak;
  record.maxPeakToPeak = window.maxPeakToPeak;
  record.stableMaxPeakToPeak = window.stableMaxPeakToPeak;
  record.signalText =
      signalQualityText(window.worstSignalState, window.lowSignalWarning, window.clipSignalWarning);
  if (window.environmentSampleCount > 0) {
    record.averageTemperatureC =
        window.temperatureSum / static_cast<float>(window.environmentSampleCount);
    record.averageHumidityPct =
        window.humiditySum / static_cast<float>(window.environmentSampleCount);
    record.environmentAvailable = true;
  }
  record.environmentOkCount = window.environmentSampleCount;
  record.environmentFailCount = window.environmentFailCount;
  record.quietCount = window.quietCount;
  record.loudCount = window.loudCount;
  record.sampleCount = window.sampleCount;
  record.windowMinutes = GOOGLE_SHEETS_WINDOW_MINUTES;
  record.uptimeMinutes = powerUptimeMinutes();
  record.uptimeText = formatCompactUptime(powerUptimeMs());
  record.freeHeap = ESP.getFreeHeap();
  record.minFreeHeap = ESP.getMinFreeHeap();
  record.bootSequence = currentBootSequence;
  record.resetReason = currentResetReason;
  return record;
}

bool hasPendingGoogleSheetsUploads() {
  return pendingSheetsCount > 0;
}

bool enqueueGoogleSheetsUpload(const GoogleSheetsWindowRecord &record) {
  if (record.windowKey.isEmpty() || record.sampleCount == 0) {
    return false;
  }

  if (pendingSheetsCount >= GOOGLE_SHEETS_QUEUE_SIZE) {
    Serial.print(F("[GS] queue full -> drop oldest window "));
    Serial.println(pendingSheetsUploads[pendingSheetsHead].windowKey);
    pendingSheetsHead = static_cast<uint8_t>((pendingSheetsHead + 1) % GOOGLE_SHEETS_QUEUE_SIZE);
    pendingSheetsCount--;
  }

  pendingSheetsUploads[pendingSheetsTail] = record;
  pendingSheetsTail = static_cast<uint8_t>((pendingSheetsTail + 1) % GOOGLE_SHEETS_QUEUE_SIZE);
  pendingSheetsCount++;
  return true;
}

GoogleSheetsWindowRecord &frontPendingGoogleSheetsUpload() {
  return pendingSheetsUploads[pendingSheetsHead];
}

void popPendingGoogleSheetsUpload() {
  if (pendingSheetsCount == 0) {
    return;
  }

  pendingSheetsUploads[pendingSheetsHead] = GoogleSheetsWindowRecord{};
  pendingSheetsHead = static_cast<uint8_t>((pendingSheetsHead + 1) % GOOGLE_SHEETS_QUEUE_SIZE);
  pendingSheetsCount--;
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
    GoogleSheetsWindowRecord completedRecord = buildGoogleSheetsRecord(activeSheetsWindow);
    completedRecord.sessionMinPeakToPeak = snapshot.sessionMinPeakToPeak;
    completedRecord.sessionMaxPeakToPeak = snapshot.sessionMaxPeakToPeak;
    completedRecord.sessionStableMaxPeakToPeak = snapshot.sessionStableMaxPeakToPeak;
    if (enqueueGoogleSheetsUpload(completedRecord)) {
      Serial.print(F("[GS] queued window -> "));
      Serial.print(completedRecord.timeFromText);
      Serial.print(F(".."));
      Serial.print(completedRecord.timeToText);
      Serial.print(F(" samples="));
      Serial.print(completedRecord.sampleCount);
      Serial.print(F(" avgNow="));
      Serial.print(completedRecord.averageNowPercent);
      Serial.print(F(" queue="));
      Serial.println(pendingSheetsCount);
    }
    logService.appendWindowAggregate(completedRecord, PROJECT_BUILD, wifiService.rssiDbm());
    lastCompletedSheetsWindowAt = millis();
    resetGoogleSheetsAccumulator(activeSheetsWindow, timeService, currentDayPart);
  }

  activeSheetsWindow.currentPercentSum += snapshot.currentPercent;
  activeSheetsWindow.hourPercentSum += snapshot.hourPercent;
  activeSheetsWindow.totalPercentSum += snapshot.totalPercent;
  activeSheetsWindow.peakToPeakSum += snapshot.peakToPeak;
  if (activeSheetsWindow.levelSampleCount < MAX_WINDOW_LEVEL_SAMPLES) {
    activeSheetsWindow.levelSamples[activeSheetsWindow.levelSampleCount] = snapshot.currentLevel;
    activeSheetsWindow.levelSampleCount++;
  }
  if (snapshot.peakToPeak < activeSheetsWindow.minPeakToPeak) {
    activeSheetsWindow.minPeakToPeak = snapshot.peakToPeak;
  }
  if (snapshot.peakToPeak > activeSheetsWindow.maxPeakToPeak) {
    activeSheetsWindow.maxPeakToPeak = snapshot.peakToPeak;
  }
  if (snapshot.currentLevel > activeSheetsWindow.stableMaxPeakToPeak) {
    activeSheetsWindow.stableMaxPeakToPeak = snapshot.currentLevel;
  }
  if (snapshot.rawMin < activeSheetsWindow.minRaw) {
    activeSheetsWindow.minRaw = snapshot.rawMin;
  }
  if (snapshot.rawMax > activeSheetsWindow.maxRaw) {
    activeSheetsWindow.maxRaw = snapshot.rawMax;
  }
  if (isSilentNoiseLevel(snapshot.currentLevel)) {
    activeSheetsWindow.quietCount++;
  }
  if (isLoudOrPeakNoiseLevel(snapshot.currentLevel)) {
    activeSheetsWindow.loudCount++;
  }
  if (latestSht31Reading.available) {
    activeSheetsWindow.temperatureSum += latestSht31Reading.temperatureC;
    activeSheetsWindow.humiditySum += latestSht31Reading.humidityPct;
    activeSheetsWindow.environmentSampleCount++;
  } else {
    activeSheetsWindow.environmentFailCount++;
  }
  if (signalStateSeverity(snapshot.signalState) >
      signalStateSeverity(activeSheetsWindow.worstSignalState)) {
    activeSheetsWindow.worstSignalState = snapshot.signalState;
  }
  activeSheetsWindow.lowSignalWarning = activeSheetsWindow.lowSignalWarning || snapshot.lowSignalWarning;
  activeSheetsWindow.clipSignalWarning =
      activeSheetsWindow.clipSignalWarning || snapshot.clipSignalWarning;
  activeSheetsWindow.sampleCount++;
}

void uploadPendingGoogleSheetsWindow() {
  if (!hasPendingGoogleSheetsUploads()) {
    return;
  }

  unsigned long nowMs = millis();
  if (lastGoogleSheetsAttemptAt != 0 &&
      nowMs - lastGoogleSheetsAttemptAt < GOOGLE_SHEETS_RETRY_INTERVAL_MS) {
    return;
  }
  lastGoogleSheetsAttemptAt = nowMs;

  GoogleSheetsWindowRecord &nextRecord = frontPendingGoogleSheetsUpload();
  if (googleSheetsService.appendWindowAggregate(nextRecord, PROJECT_VERSION,
                                                PROJECT_BUILD)) {
    Serial.print(F("[GS] uploaded window -> "));
    Serial.print(nextRecord.timeFromText);
    Serial.print(F(".."));
    Serial.print(nextRecord.timeToText);
    Serial.print(F(" samples="));
    Serial.print(nextRecord.sampleCount);
    Serial.print(F(" queue="));
    popPendingGoogleSheetsUpload();
    Serial.println(pendingSheetsCount);
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
  if (isSilentNoiseLevel(snapshot.currentLevel)) {
    stats.quietCount++;
  }
  if (isLoudOrPeakNoiseLevel(snapshot.currentLevel)) {
    stats.loudCount++;
  }
}

void updateMqttState(const AudioSnapshot &snapshot) {
  MqttRuntimeState state{};
  state.snapshot = snapshot;
  state.signalText = noiseLevelText(snapshot.currentLevel);
  state.mqttSignalText = noiseLevelText(snapshot.currentLevel);
  state.timeSynced = timeService.isSynced();
  state.wifiStatus = wifiService.statusTextCStr();
  state.wifiSignalPercent = wifiService.signalPercent();
  state.wifiRssiDbm = wifiService.rssiDbm();
  state.ipAddress = wifiService.ipAddressString();
  state.environmentAvailable = latestSht31Reading.available;
  state.temperatureC = latestSht31Reading.temperatureC;
  state.humidityPct = latestSht31Reading.humidityPct;

  if (state.timeSynced) {
    DayPart currentDayPart = dayPartFromHour(timeService.hour());
    state.timestamp = timeService.dateTimeString();
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

void updateSht31Health(const AudioSnapshot &snapshot) {
  if (!snapshot.statsUpdated) {
    return;
  }

  if (latestSht31Reading.available) {
    if (sht31LostLogged) {
      sht31LostLogged = false;
      logService.appendRuntimeEvent(F("SHT31_RECOVER"), currentDateText(), currentTimeText(),
                                    PROJECT_BUILD, currentBootSequence, currentResetReason,
                                    powerUptimeMinutes(), formatCompactUptime(powerUptimeMs()),
                                    wifiService.rssiDbm());
    }
    sht31UnavailableSeconds = 0;
    return;
  }

  if (sht31UnavailableSeconds < UINT16_MAX) {
    sht31UnavailableSeconds++;
  }

  if (!sht31LostLogged && sht31UnavailableSeconds >= SHT31_LOST_WARN_SECONDS) {
    sht31LostLogged = true;
    logService.appendRuntimeEvent(F("SHT31_LOST"), currentDateText(), currentTimeText(),
                                  PROJECT_BUILD, currentBootSequence, currentResetReason,
                                  powerUptimeMinutes(), formatCompactUptime(powerUptimeMs()),
                                  wifiService.rssiDbm());
  }

  unsigned long nowMs = millis();
  if (sht31UnavailableSeconds >= SHT31_LOST_WARN_SECONDS &&
      (lastSht31RecoverAttemptAt == 0 ||
       nowMs - lastSht31RecoverAttemptAt >= SHT31_RECOVER_INTERVAL_MS)) {
    lastSht31RecoverAttemptAt = nowMs;
    sht31RecoverCount++;
    Wire.end();
    delay(20);
    Wire.begin(SDA_PIN, SCL_PIN);
    bool recovered = sht31Service.recover();
    Serial.print(F("[SHT31] recover attempt "));
    Serial.print(sht31RecoverCount);
    Serial.print(F(" -> "));
    Serial.println(recovered ? F("reinit OK") : F("reinit failed"));
    logService.appendRuntimeEvent(F("SHT31_REINIT"), currentDateText(), currentTimeText(),
                                  PROJECT_BUILD, currentBootSequence, currentResetReason,
                                  powerUptimeMinutes(), formatCompactUptime(powerUptimeMs()),
                                  wifiService.rssiDbm());
  }
}

void beginOta() {
  ArduinoOTA.setHostname(OTA_HOSTNAME);
  ArduinoOTA.setPassword(OTA_PASSWORD);
  ArduinoOTA
      .onStart([]() {
        otaStarted = true;
        String type = ArduinoOTA.getCommand() == U_FLASH ? F("sketch") : F("filesystem");
        Serial.print(F("[OTA] start -> "));
        Serial.println(type);
        logService.appendRuntimeEvent(F("OTA_START"), currentDateText(), currentTimeText(),
                                      PROJECT_BUILD, currentBootSequence, currentResetReason,
                                      powerUptimeMinutes(), formatCompactUptime(powerUptimeMs()),
                                      wifiService.rssiDbm());
      })
      .onEnd([]() {
        Serial.println(F("[OTA] end"));
        logService.appendRuntimeEvent(F("OTA_END"), currentDateText(), currentTimeText(),
                                      PROJECT_BUILD, currentBootSequence, currentResetReason,
                                      powerUptimeMinutes(), formatCompactUptime(powerUptimeMs()),
                                      wifiService.rssiDbm());
      })
      .onProgress([](unsigned int progress, unsigned int total) {
        static uint8_t lastPrintedPct = 255;
        uint8_t pct = total == 0 ? 0 : static_cast<uint8_t>((progress * 100U) / total);
        if (pct != lastPrintedPct && pct % 10 == 0) {
          lastPrintedPct = pct;
          Serial.print(F("[OTA] progress -> "));
          Serial.print(pct);
          Serial.println('%');
        }
      })
      .onError([](ota_error_t error) {
        Serial.print(F("[OTA] error -> "));
        Serial.println(static_cast<int>(error));
        logService.appendRuntimeEvent(F("OTA_ERROR"), currentDateText(), currentTimeText(),
                                      PROJECT_BUILD, currentBootSequence, currentResetReason,
                                      powerUptimeMinutes(), formatCompactUptime(powerUptimeMs()),
                                      wifiService.rssiDbm());
        otaStarted = false;
      });
  ArduinoOTA.begin();
  Serial.print(F("[OTA] ready -> "));
  Serial.println(OTA_HOSTNAME);
}

void setup() {
  Serial.begin(115200);
  delay(STARTUP_SERIAL_DELAY_MS);

  esp_reset_reason_t resetReason = esp_reset_reason();
  currentResetReason = resetReasonText(resetReason);
  if (rtcPowerSessionMagic != POWER_SESSION_MAGIC || resetReason == ESP_RST_POWERON) {
    rtcPowerSessionMagic = POWER_SESSION_MAGIC;
    rtcBootSequence = 0;
    rtcPowerUptimeBaseMs = 0;
    rtcLastKnownPowerUptimeMs = 0;
  } else {
    rtcPowerUptimeBaseMs = rtcLastKnownPowerUptimeMs;
  }
  rtcBootSequence++;
  currentBootSequence = rtcBootSequence;
  savePowerUptimeCheckpoint();

  Serial.println();
  Serial.println(F("ESP32 sound statistics clean restart"));
  Serial.print(F("Version: "));
  Serial.print(F(PROJECT_VERSION));
  Serial.print(F(" build "));
  Serial.println(PROJECT_BUILD);
  Serial.print(F("Boot sequence: "));
  Serial.print(currentBootSequence);
  Serial.print(F(" reset="));
  Serial.println(currentResetReason);
  Serial.println(F("Display contract: Now / H / M"));
  Serial.println(F("Time and WiFi will activate when the network is available."));
  Serial.print(F("[BTN] pin="));
  Serial.println(BUTTON_PIN);
  Serial.print(F("[I2C] pins SDA="));
  Serial.print(SDA_PIN);
  Serial.print(F(" SCL="));
  Serial.println(SCL_PIN);
  Serial.print(F("[MIC] INMP441 BCLK="));
  Serial.print(I2S_BCLK_PIN);
  Serial.print(F(" WS="));
  Serial.print(I2S_WS_PIN);
  Serial.print(F(" DATA="));
  Serial.println(I2S_DATA_PIN);
  controllerLinkService.begin(Serial2, CONTROLLER_UART_RX_PIN, CONTROLLER_UART_TX_PIN);

  wifiService.begin();
  if (!audioSampler.begin(I2S_BCLK_PIN, I2S_WS_PIN, I2S_DATA_PIN)) {
    Serial.println(F("[MIC] INMP441 I2S init failed."));
    while (true) {
      delay(1000);
    }
  }
  buttonService.begin(BUTTON_PIN);
  googleSheetsService.begin();
  logService.begin();
  logService.appendRuntimeEvent(F("BOOT"), String(), String(), PROJECT_BUILD, currentBootSequence,
                                currentResetReason, powerUptimeMinutes(),
                                formatCompactUptime(powerUptimeMs()), wifiService.rssiDbm());
  meanPersistenceService.begin();
  mqttService.begin();
  telegramAlertService.begin();
  timeService.begin();
  beginOta();
  uint64_t restoredMeanSum = 0;
  uint32_t restoredMeanCount = 0;
  if (meanPersistenceService.load(restoredMeanSum, restoredMeanCount)) {
    audioSampler.restoreLongMean(restoredMeanSum, restoredMeanCount);
  }
  Wire.begin(SDA_PIN, SCL_PIN);
  if (STARTUP_I2C_SCAN_ENABLED) {
    scanI2cBus(&Wire);
  } else {
    Serial.println(F("[I2C] startup scan skipped"));
  }
  sht31Service.begin(&Wire);
  if (sht31Service.isAvailable()) {
    Serial.print(F("[SHT31] ready -> 0x"));
    Serial.println(sht31Service.address(), HEX);
  } else {
    Serial.println(F("[SHT31] not found at 0x44/0x45"));
  }
  if (!displayView.begin(&Wire, SDA_PIN, SCL_PIN, OLED_ADDRESS)) {
    Serial.println(F("SSD1306 init failed."));
    while (true) {
      delay(1000);
    }
  }
  char bootLine1[32];
  snprintf(bootLine1, sizeof(bootLine1), "%s b%u", PROJECT_VERSION, PROJECT_BUILD);
  displayView.showBootMessage(bootLine1, "I2S 26/25/32", PROJECT_POWER_PROFILE);
  delay(BOOT_SCREEN_DELAY_MS);
  lastDisplayInteractionAt = millis();
}

void loop() {
  unsigned long nowMs = millis();
  controllerLinkService.update(nowMs);
  ButtonEvent buttonEvent = buttonService.update();
  if (buttonEvent == ButtonEvent::ShortPress) {
    if (displayView.isEnabled()) {
      displayView.nextPage();
      lastDisplayInteractionAt = nowMs;
      lastDisplayAt = 0;
      Serial.print(F("[BTN] short press -> page "));
      Serial.println(displayView.currentPage());
    } else {
      displayView.setEnabled(true);
      displayPinnedOn = false;
      lastDisplayInteractionAt = nowMs;
      lastDisplayAt = 0;
      Serial.println(F("[BTN] short press -> display ON (auto)"));
    }
  } else if (buttonEvent == ButtonEvent::LongPress) {
    if (!displayView.isEnabled()) {
      displayView.setEnabled(true);
      displayPinnedOn = true;
      lastDisplayInteractionAt = nowMs;
      lastDisplayAt = 0;
      Serial.println(F("[BTN] long press -> display ON (pinned)"));
    } else if (!displayPinnedOn) {
      displayPinnedOn = true;
      lastDisplayInteractionAt = nowMs;
      lastDisplayAt = 0;
      Serial.println(F("[BTN] long press -> display pinned ON"));
    } else {
      displayPinnedOn = false;
      lastDisplayInteractionAt = nowMs;
      lastDisplayAt = 0;
      Serial.println(F("[BTN] long press -> display auto-off enabled"));
    }
  }

  wifiService.update();
  ArduinoOTA.handle();
  logService.update(wifiService.isConnected(), wifiService.ipAddressString());
  timeService.update(wifiService.isConnected());
  if (timeService.isSynced()) {
    logService.setClock(timeService.dateString(), timeService.timeString());
  }
  latestSht31Reading = sht31Service.update();
  latestSnapshot = audioSampler.sample();
  updateSht31Health(latestSnapshot);
  updateDayPartStats(latestSnapshot, timeService);
  updateGoogleSheetsWindow(latestSnapshot, timeService);
  uploadPendingGoogleSheetsWindow();
  updateMqttState(latestSnapshot);
  telegramAlertService.update(wifiService.isConnected(), wifiService.ipAddressString(),
                              wifiService.rssiDbm(), wifiService.signalPercent(),
                              timeService.isSynced(), PROJECT_VERSION, PROJECT_BUILD,
                              formatCompactUptime(powerUptimeMs()));
  if (!otaStarted && latestSnapshot.statsUpdated &&
      nowMs - lastMeanPersistAt >= MEAN_PERSIST_INTERVAL_MS) {
    if (meanPersistenceService.save(audioSampler.totalLevelSum(), audioSampler.totalLevelCount())) {
      lastMeanPersistAt = nowMs;
    }
  }
  if (nowMs - lastRtcUptimeSaveAt >= UPTIME_RTC_SAVE_INTERVAL_MS) {
    savePowerUptimeCheckpoint();
    lastRtcUptimeSaveAt = nowMs;
  }

  if (displayView.isEnabled() && !displayPinnedOn &&
      nowMs - lastDisplayInteractionAt >= DISPLAY_IDLE_TIMEOUT_MS) {
    displayView.setEnabled(false);
    Serial.println(F("[DSP] idle timeout -> display OFF"));
  }

  if (nowMs - lastDisplayAt >= currentDisplayRefreshIntervalMs()) {
    lastDisplayAt = nowMs;
    displayView.render(latestSnapshot, latestSht31Reading, PROJECT_VERSION, PROJECT_BUILD,
                       timeService.isSynced(), wifiService.isConnected(),
                       wifiService.signalPercent(), displayPinnedOn, PROJECT_POWER_PROFILE);
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
    Serial.print('/');
    Serial.print(latestSnapshot.rawMax);
    Serial.print(F(" p2p="));
    Serial.print(latestSnapshot.peakToPeak);
    Serial.print(F(" range="));
    Serial.print(latestSnapshot.sessionMinPeakToPeak);
    Serial.print('/');
    Serial.print(latestSnapshot.sessionMaxPeakToPeak);
    Serial.print(F(" stable="));
    Serial.print(latestSnapshot.sessionStableMaxPeakToPeak);
    Serial.print(F(" sig="));
    Serial.print(signalStateText(latestSnapshot.signalState));
    if (latestSnapshot.clipSignalWarning) {
      Serial.print(F(" warn=CLIP_HOLD"));
    } else if (latestSnapshot.lowSignalWarning) {
      Serial.print(F(" warn=LOW_HOLD"));
    }
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
    } else {
      Serial.print(F(" time=WAIT"));
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
    Serial.print(F(" uart="));
    Serial.print(controllerLinkService.stateText());
    if (controllerLinkService.isOnline()) {
      Serial.print(F("/b"));
      Serial.print(controllerLinkService.remoteBuild());
      Serial.print(F("/"));
      Serial.print(controllerLinkService.lastRttMs());
      Serial.print(F("ms"));
    } else if (controllerLinkService.isSleeping()) {
      Serial.print(F("/b"));
      Serial.print(controllerLinkService.remoteBuild());
      Serial.print(F("/"));
      Serial.print(controllerLinkService.sleepRemainingSeconds(nowMs));
      Serial.print(F("s"));
    }
    Serial.println();
  }

  const bool scheduledRestartDue = nowMs >= SCHEDULED_RESTART_INTERVAL_MS;
  const bool completedWindowBoundaryReady =
      lastCompletedSheetsWindowAt != 0 &&
      nowMs - lastCompletedSheetsWindowAt <= SCHEDULED_RESTART_BOUNDARY_GRACE_MS;
  const bool sheetsDeliveryReady =
      !googleSheetsService.isConfigured() || !hasPendingGoogleSheetsUploads();
  if (!otaStarted && !scheduledRestartStarted && scheduledRestartDue &&
      completedWindowBoundaryReady && sheetsDeliveryReady) {
    scheduledRestartStarted = true;
    savePowerUptimeCheckpoint();
    logService.appendRuntimeEvent(F("SCHEDULED_RESTART"), currentDateText(), currentTimeText(),
                                  PROJECT_BUILD, currentBootSequence, currentResetReason,
                                  powerUptimeMinutes(), formatCompactUptime(powerUptimeMs()),
                                  wifiService.rssiDbm());
    Serial.println(F("[SYS] scheduled restart -> keeping power-session uptime"));
    delay(150);
    ESP.restart();
  } else if (!otaStarted && !scheduledRestartStarted && scheduledRestartDue &&
             !scheduledRestartWaitLogged) {
    scheduledRestartWaitLogged = true;
    Serial.println(F("[SYS] scheduled restart deferred -> wait for a completed and delivered window"));
  }

  delay(20);
}
