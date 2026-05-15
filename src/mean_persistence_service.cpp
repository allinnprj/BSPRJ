#include "mean_persistence_service.h"

#include <Preferences.h>

namespace {

constexpr char kNamespace[] = "bs-mean";
constexpr char kKeySum[] = "sum";
constexpr char kKeyCount[] = "count";

Preferences preferences;

}  // namespace

void MeanPersistenceService::begin() {
  started_ = true;
  lastSavedSum_ = 0;
  lastSavedCount_ = 0;
  Serial.println(F("[MEAN] persistence ready"));
}

bool MeanPersistenceService::load(uint64_t &totalLevelSum, uint32_t &totalLevelCount) {
  if (!started_ || !preferences.begin(kNamespace, true)) {
    return false;
  }

  totalLevelSum = preferences.getULong64(kKeySum, 0);
  totalLevelCount = preferences.getUInt(kKeyCount, 0);
  preferences.end();

  lastSavedSum_ = totalLevelSum;
  lastSavedCount_ = totalLevelCount;
  if (totalLevelCount == 0) {
    Serial.println(F("[MEAN] load -> empty"));
    return false;
  }

  Serial.print(F("[MEAN] load -> count="));
  Serial.print(totalLevelCount);
  Serial.print(F(" avg="));
  Serial.println(static_cast<uint32_t>(totalLevelSum / totalLevelCount));
  return true;
}

bool MeanPersistenceService::save(uint64_t totalLevelSum, uint32_t totalLevelCount) {
  if (!started_ || totalLevelCount == 0) {
    return false;
  }

  if (totalLevelSum == lastSavedSum_ && totalLevelCount == lastSavedCount_) {
    return false;
  }

  if (!preferences.begin(kNamespace, false)) {
    Serial.println(F("[MEAN] save -> preferences open failed"));
    return false;
  }

  bool ok = preferences.putULong64(kKeySum, totalLevelSum) > 0 &&
            preferences.putUInt(kKeyCount, totalLevelCount) > 0;
  preferences.end();

  if (ok) {
    lastSavedSum_ = totalLevelSum;
    lastSavedCount_ = totalLevelCount;
    Serial.print(F("[MEAN] save -> count="));
    Serial.print(totalLevelCount);
    Serial.print(F(" avg="));
    Serial.println(static_cast<uint32_t>(totalLevelSum / totalLevelCount));
  } else {
    Serial.println(F("[MEAN] save -> failed"));
  }

  return ok;
}
