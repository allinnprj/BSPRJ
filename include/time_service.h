#pragma once

#include <Arduino.h>

class TimeService {
 public:
  void begin();
  void update(bool wifiConnected);

  bool isSynced() const;
  String dateString() const;
  String dateTimeString() const;
  String timeString() const;
  uint8_t hour() const;
  uint8_t minute() const;

 private:
  bool syncRequested_ = false;
  bool synced_ = false;
  unsigned long lastSyncCheckAt_ = 0;
};
