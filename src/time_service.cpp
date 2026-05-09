#include "time_service.h"

#include <time.h>

namespace {

constexpr long kUtcOffsetSeconds = 4L * 3600L;
constexpr long kDstOffsetSeconds = 0L;
constexpr unsigned long kSyncCheckIntervalMs = 5000UL;
constexpr time_t kValidEpochThreshold = 1700000000;

bool readLocalTime(struct tm &timeInfo) {
  return getLocalTime(&timeInfo, 10);
}

}  // namespace

void TimeService::begin() {
  syncRequested_ = false;
  synced_ = false;
  lastSyncCheckAt_ = 0;
}

void TimeService::update(bool wifiConnected) {
  unsigned long nowMs = millis();
  if (!wifiConnected) {
    return;
  }

  if (!syncRequested_) {
    configTime(kUtcOffsetSeconds, kDstOffsetSeconds, "pool.ntp.org", "time.nist.gov");
    syncRequested_ = true;
    Serial.println(F("[TIME] NTP sync requested"));
  }

  if (nowMs - lastSyncCheckAt_ < kSyncCheckIntervalMs) {
    return;
  }
  lastSyncCheckAt_ = nowMs;

  time_t now = time(nullptr);
  bool nowSynced = now >= kValidEpochThreshold;
  if (nowSynced && !synced_) {
    synced_ = true;
    Serial.print(F("[TIME] synced -> "));
    Serial.println(timeString());
  } else if (!nowSynced && !synced_) {
    Serial.println(F("[TIME] waiting for valid NTP time"));
  }
}

bool TimeService::isSynced() const {
  return synced_;
}

String TimeService::dateString() const {
  struct tm timeInfo{};
  if (!readLocalTime(timeInfo)) {
    return String("0000-00-00");
  }

  char buffer[16];
  snprintf(buffer, sizeof(buffer), "%04d-%02d-%02d", timeInfo.tm_year + 1900,
           timeInfo.tm_mon + 1, timeInfo.tm_mday);
  return String(buffer);
}

String TimeService::dateTimeString() const {
  return dateString() + " " + timeString();
}

String TimeService::timeString() const {
  struct tm timeInfo{};
  if (!readLocalTime(timeInfo)) {
    return String("--:--:--");
  }

  char buffer[16];
  snprintf(buffer, sizeof(buffer), "%02d:%02d:%02d", timeInfo.tm_hour, timeInfo.tm_min,
           timeInfo.tm_sec);
  return String(buffer);
}

uint8_t TimeService::hour() const {
  struct tm timeInfo{};
  if (!readLocalTime(timeInfo)) {
    return 0;
  }
  return static_cast<uint8_t>(timeInfo.tm_hour);
}

uint8_t TimeService::minute() const {
  struct tm timeInfo{};
  if (!readLocalTime(timeInfo)) {
    return 0;
  }
  return static_cast<uint8_t>(timeInfo.tm_min);
}
