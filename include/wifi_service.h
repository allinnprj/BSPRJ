#pragma once

#include <Arduino.h>

class WifiService {
 public:
  void begin();
  void update();

  bool isConfigured() const;
  bool isConnected() const;
  const __FlashStringHelper *statusText() const;
  const char *statusTextCStr() const;
  String ipAddressString() const;
  int rssiDbm() const;
  uint8_t signalPercent() const;
  int statusCode() const;

 private:
  static constexpr unsigned long kReconnectIntervalMs = 15000UL;
  static constexpr unsigned long kSignalRefreshIntervalMs = 120000UL;

  bool configured_ = false;
  int lastStatusCode_ = -1;
  bool announcedIp_ = false;
  unsigned long lastReconnectAttemptAt_ = 0;
  unsigned long lastSignalRefreshAt_ = 0;
  int cachedRssiDbm_ = -127;
  uint8_t cachedSignalPercent_ = 0;

  void refreshSignalCache(bool connected, bool force);
};
