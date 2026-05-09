#include "google_sheets_service.h"

#include <HTTPClient.h>
#include <WiFiClientSecure.h>

#include "secrets.h"

void GoogleSheetsService::begin() {
  configured_ = strlen(GOOGLE_SHEETS_SCRIPT_URL) > 0;
  if (configured_) {
    Serial.println(F("[GS] ready -> Google Sheets endpoint configured"));
  } else {
    Serial.println(F("[GS] OFF -> GOOGLE_SHEETS_SCRIPT_URL is empty"));
  }
}

bool GoogleSheetsService::appendWindowAggregate(const GoogleSheetsWindowRecord &record,
                                                const char *versionText,
                                                uint32_t buildNumber) {
  if (!configured_ || record.windowKey.isEmpty() || record.sampleCount == 0 ||
      record.windowKey == lastWindowKey_) {
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  if (!http.begin(client, GOOGLE_SHEETS_SCRIPT_URL)) {
    Serial.println(F("[GS] HTTP begin failed"));
    return false;
  }

  const char *headerKeys[] = {"Location"};
  http.collectHeaders(headerKeys, 1);
  http.addHeader(F("Content-Type"), F("application/json"));

  String payload;
  payload.reserve(512);
  payload += F("{\"device_id\":\"");
  payload += DEVICE_ID;
  payload += F("\",\"fw_version\":\"");
  payload += versionText;
  payload += F("\",\"build\":");
  payload += String(buildNumber);
  payload += F(",\"date\":\"");
  payload += record.dateText;
  payload += F("\",\"time_from\":\"");
  payload += record.timeFromText;
  payload += F("\",\"time_to\":\"");
  payload += record.timeToText;
  payload += F("\",\"part\":\"");
  payload += record.dayPartText;
  payload += F("\",\"avg_now_pct\":");
  payload += String(record.averageNowPercent);
  payload += F(",\"avg_hour_pct\":");
  payload += String(record.averageHourPercent);
  payload += F(",\"avg_total_pct\":");
  payload += String(record.averageTotalPercent);
  payload += F(",\"raw_min\":");
  payload += String(record.minRaw);
  payload += F(",\"raw_max\":");
  payload += String(record.maxRaw);
  payload += F(",\"avg_peak_to_peak\":");
  payload += String(record.averagePeakToPeak);
  payload += F(",\"signal\":\"");
  payload += record.signalText;
  payload += F("\",\"window_minutes\":");
  payload += String(record.windowMinutes);
  payload += F(",\"quiet_count\":");
  payload += String(record.quietCount);
  payload += F(",\"loud_count\":");
  payload += String(record.loudCount);
  payload += F(",\"samples\":");
  payload += String(record.sampleCount);
  payload += '}';

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.print(F("[GS] POST -> "));
    Serial.println(httpCode);
    String response = http.getString();
    if (response.length() > 0) {
      Serial.print(F("[GS] body -> "));
      Serial.println(response);
    }
    if (httpCode >= 200 && httpCode < 300) {
      lastWindowKey_ = record.windowKey;
      http.end();
      return true;
    }
    if (httpCode == 302 || httpCode == 303 || httpCode == 307 || httpCode == 308) {
      String location = http.header("Location");
      if (location.indexOf("script.googleusercontent.com") >= 0 ||
          response.indexOf("Moved Temporarily") >= 0) {
        Serial.println(F("[GS] redirect accepted as delivered"));
        lastWindowKey_ = record.windowKey;
        http.end();
        return true;
      }
    }
  } else {
    Serial.print(F("[GS] POST failed -> "));
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
  return false;
}

bool GoogleSheetsService::isConfigured() const {
  return configured_;
}
