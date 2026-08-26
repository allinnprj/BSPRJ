#include "button_service.h"

void ButtonService::begin(uint8_t pin) {
  pin_ = pin;
  pinMode(pin_, INPUT_PULLUP);
  started_ = true;
  stablePressed_ = false;
  lastRawPressed_ = false;
  longPressFired_ = false;
  lastRawChangeAt_ = millis();
  pressStartedAt_ = 0;
}

ButtonEvent ButtonService::update() {
  if (!started_) {
    return ButtonEvent::None;
  }

  unsigned long nowMs = millis();
  bool rawPressed = digitalRead(pin_) == LOW;
  if (rawPressed != lastRawPressed_) {
    lastRawPressed_ = rawPressed;
    lastRawChangeAt_ = nowMs;
  }

  if (rawPressed != stablePressed_ && nowMs - lastRawChangeAt_ >= kDebounceMs) {
    stablePressed_ = rawPressed;
    if (stablePressed_) {
      pressStartedAt_ = nowMs;
      longPressFired_ = false;
    } else {
      if (!longPressFired_) {
        return ButtonEvent::ShortPress;
      }
    }
  }

  if (stablePressed_ && !longPressFired_ && nowMs - pressStartedAt_ >= kLongPressMs) {
    longPressFired_ = true;
    return ButtonEvent::LongPress;
  }

  return ButtonEvent::None;
}
