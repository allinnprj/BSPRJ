#pragma once

#include <Arduino.h>

enum class ButtonEvent : uint8_t {
  None,
  ShortPress,
  LongPress,
};

class ButtonService {
 public:
  void begin(uint8_t pin);
  ButtonEvent update();
  bool isPressed() const;

 private:
  static constexpr unsigned long kDebounceMs = 30UL;
  static constexpr unsigned long kLongPressMs = 800UL;

  uint8_t pin_ = 0;
  bool started_ = false;
  bool stablePressed_ = false;
  bool lastRawPressed_ = false;
  bool longPressFired_ = false;
  unsigned long lastRawChangeAt_ = 0;
  unsigned long pressStartedAt_ = 0;
};
