#pragma once

#include <Adafruit_SHT31.h>
#include <Arduino.h>
#include <Wire.h>

struct Sht31Reading {
  bool available = false;
  float temperatureC = NAN;
  float humidityPct = NAN;
};

class Sht31Service {
 public:
  void begin(TwoWire *wire);
  Sht31Reading update();
  bool isAvailable() const;
  uint8_t address() const;

 private:
  static constexpr uint8_t kPrimaryAddress = 0x44;
  static constexpr uint8_t kAlternateAddress = 0x45;
  static constexpr unsigned long kReadIntervalMs = 5000UL;

  Adafruit_SHT31 sensor_;
  bool started_ = false;
  bool available_ = false;
  uint8_t activeAddress_ = 0;
  unsigned long lastReadAt_ = 0;
  Sht31Reading lastReading_{};
};
