#pragma once

#include <Arduino.h>

enum class ButtonEvent : uint8_t {
  None,
  ShortPress,
  LongPress,
  WifiSetupCountdown3,
  WifiSetupCountdown2,
  WifiSetupCountdown1,
  WifiSetupRequested,
  WifiSetupCancelled,
};

class ButtonService {
 public:
  void begin(uint8_t pin);
  ButtonEvent update();

 private:
  static constexpr unsigned long kDebounceMs = 30UL;
  static constexpr unsigned long kLongPressMs = 800UL;
  static constexpr unsigned long kWifiSetupCountdownStartMs = 2000UL;
  static constexpr unsigned long kWifiSetupHoldMs = 5000UL;

  uint8_t pin_ = 0;
  bool started_ = false;
  bool stablePressed_ = false;
  bool lastRawPressed_ = false;
  bool wifiSetupRequested_ = false;
  uint8_t lastWifiSetupCountdown_ = 0;
  unsigned long lastRawChangeAt_ = 0;
  unsigned long pressStartedAt_ = 0;
};
