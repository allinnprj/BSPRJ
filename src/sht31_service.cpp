#include "sht31_service.h"

void Sht31Service::begin(TwoWire *wire) {
  started_ = true;
  (void)wire;
  available_ = sensor_.begin(kPrimaryAddress);
  activeAddress_ = available_ ? kPrimaryAddress : 0;
  if (!available_) {
    available_ = sensor_.begin(kAlternateAddress);
    activeAddress_ = available_ ? kAlternateAddress : 0;
  }
  lastReadAt_ = 0;
  lastReading_ = {};
}

Sht31Reading Sht31Service::update() {
  if (!started_ || !available_) {
    return lastReading_;
  }

  unsigned long nowMs = millis();
  if (lastReadAt_ != 0 && nowMs - lastReadAt_ < kReadIntervalMs) {
    return lastReading_;
  }
  lastReadAt_ = nowMs;

  float temperature = sensor_.readTemperature();
  float humidity = sensor_.readHumidity();
  if (isnan(temperature) || isnan(humidity)) {
    lastReading_.available = false;
    return lastReading_;
  }

  lastReading_.available = true;
  lastReading_.temperatureC = temperature;
  lastReading_.humidityPct = humidity;
  return lastReading_;
}

bool Sht31Service::isAvailable() const {
  return available_;
}

uint8_t Sht31Service::address() const {
  return activeAddress_;
}
