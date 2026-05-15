#pragma once

#include <Arduino.h>

class MeanPersistenceService {
 public:
  void begin();
  bool load(uint64_t &totalLevelSum, uint32_t &totalLevelCount);
  bool save(uint64_t totalLevelSum, uint32_t totalLevelCount);

 private:
  bool started_ = false;
  uint64_t lastSavedSum_ = 0;
  uint32_t lastSavedCount_ = 0;
};
