#include "button_service.h"

void ButtonService::begin(uint8_t pin) {
  pin_ = pin;
  pinMode(pin_, INPUT_PULLUP);
  started_ = true;
  stablePressed_ = false;
  lastRawPressed_ = false;
  wifiSetupRequested_ = false;
  lastWifiSetupCountdown_ = 0;
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
      wifiSetupRequested_ = false;
      lastWifiSetupCountdown_ = 0;
    } else {
      if (wifiSetupRequested_) {
        return ButtonEvent::None;
      }
      const unsigned long heldMs = nowMs - pressStartedAt_;
      if (lastWifiSetupCountdown_ != 0) {
        return ButtonEvent::WifiSetupCancelled;
      }
      return heldMs >= kLongPressMs ? ButtonEvent::LongPress
                                    : ButtonEvent::ShortPress;
    }
  }

  if (stablePressed_ && !wifiSetupRequested_) {
    const unsigned long heldMs = nowMs - pressStartedAt_;
    if (heldMs >= kWifiSetupHoldMs) {
      wifiSetupRequested_ = true;
      return ButtonEvent::WifiSetupRequested;
    }
    if (heldMs >= kWifiSetupCountdownStartMs) {
      const uint8_t remainingSeconds =
          static_cast<uint8_t>((kWifiSetupHoldMs - heldMs + 999UL) / 1000UL);
      if (remainingSeconds != lastWifiSetupCountdown_) {
        lastWifiSetupCountdown_ = remainingSeconds;
        switch (remainingSeconds) {
          case 3:
            return ButtonEvent::WifiSetupCountdown3;
          case 2:
            return ButtonEvent::WifiSetupCountdown2;
          case 1:
            return ButtonEvent::WifiSetupCountdown1;
          default:
            break;
        }
      }
    }
  }

  return ButtonEvent::None;
}
