#pragma once

#include <cmath>
#include <cstdint>

// Limited-band engineering A-weighting at the existing 16 kHz rate.
// Analog poles 20.598997 (double), 107.65265, 737.86223, 12194.217 (double)
// mapped by bilinear transform; digital gain normalized at 1 kHz.
// This is NOT a calibrated SPL or an IEC-compliant full-band meter.
class AcousticEnergy {
 public:
  static constexpr uint32_t kSampleRate = 16000;
  float process(int32_t raw) {
    float value = static_cast<float>(raw >> 8) / 8388608.0f;
    for (unsigned i = 0; i < 3; ++i) {
      const auto &c = coefficients_[i];
      const float out = c[0] * value + state_[i][0];
      state_[i][0] = c[1] * value - c[3] * out + state_[i][1];
      state_[i][1] = c[2] * value - c[4] * out;
      value = out;
    }
    const float energy = value * value;
    // Exponential energy detector, tau = 1 s (SLOW), never average dB.
    slow_ += 0.0000624980469157f * (energy - slow_);
    return energy;
  }
  float slowEnergy() const { return slow_; }
  void reset() {
    for (auto &s : state_) { s[0] = 0; s[1] = 0; }
    slow_ = 0;
  }
 private:
  const float coefficients_[3][5] = {
      {1.0f, -2.0f, 1.0f, -1.9838867573f, 0.9839516664f},
      {1.0f, -2.0f, 1.0f, -1.7055096337f, 0.7159875753f},
      {0.5290927743f, 1.0581855485f, 0.5290927743f, 0.8215638180f, 0.1687417768f}};
  float state_[3][2] = {};
  float slow_ = 0;
};

struct AcousticReading {
  double energySum = 0;
  uint64_t samples = 0;
  double validEnergySum = 0;
  uint64_t validSamples = 0;
  uint32_t capturedAtMs = 0;
  uint32_t faults = 0;
  uint32_t clipped = 0;
  float slowEnergy = 0;
  bool warm = false;
};

inline float acousticDbfs(double energy) {
  return energy > 0 ? static_cast<float>(10.0 * std::log10(energy)) : -120.0f;
}

// Practical A/SLOW offset fitted against FNIRSI FDM01 for acoustic revision 2.
// A16 remains a limited-band estimate, not an IEC-certified sound level.
constexpr float kAcousticDbaOffset = 114.2f;

inline float acousticDbaEstimate(float dbfs) {
  return dbfs + kAcousticDbaOffset;
}
