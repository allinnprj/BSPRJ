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

  bool configured_ = false;
  int lastStatusCode_ = -1;
  bool announcedIp_ = false;
  unsigned long lastReconnectAttemptAt_ = 0;
};
