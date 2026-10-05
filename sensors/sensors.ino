#include <WiFi.h>
#include <WebServer.h>
#include "esp_wifi.h"

const char* ssid = "Converge_2.4GHz_qnS8";
const char* password = "KT32ch8h";

// Fallback alternate SSID in case router broadcasts 5G name on 2.4G as well
const char* altSsid = "Converge_5GHz_qnS8";

const int trigPin = 5;
const int echoPin = 18;

// CALIBRATION (Default container height in cm - can be tuned via web interface)
// 50.0 cm allows comfortable hand testing from 5cm (100% full) to 50cm (0% empty)
float emptyDistance = 50.0; // Distance when bin is empty (0%)
float fullDistance = 5.0;   // Distance when bin is full (100%)

WebServer server(80);

// Global smoothed values for rock-solid stability
float stableDistance = -1.0;
float stableLevel = 0.0;

// ----------------------
// Measure Raw Distance (Single Ultrasonic Pulse)
// ----------------------
float readSinglePulse() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // 26000us timeout (~4.4m max physical range)
  unsigned long duration = pulseIn(echoPin, HIGH, 26000);
  if (duration == 0) {
    return -1.0; // No echo received (object out of range or acoustic absorption)
  }
  return (duration * 0.0343) / 2.0;
}

// ----------------------
// Multi-Sample Median + Deadband Filter (Ultra-stable, zero jitter)
// ----------------------
float getStableDistance() {
  const int SAMPLES = 5;
  float readings[SAMPLES];
  int validCount = 0;

  for (int i = 0; i < SAMPLES; i++) {
    float r = readSinglePulse();
    // Valid acoustic range for HC-SR04 (2cm to 400cm)
    if (r >= 2.0 && r <= 400.0) {
      readings[validCount++] = r;
    }
    delay(12); // Acoustic reflection dissipation delay
  }

  // If no echo returned (open space, ceiling > 4m, or beam lost):
  // Bin is EMPTY, NOT 0cm full! Return emptyDistance.
  if (validCount == 0) {
    if (stableDistance < 0) {
      stableDistance = emptyDistance;
    }
    return stableDistance;
  }

  // Bubble sort to obtain median (rejects acoustic spikes, bounces, noise)
  for (int i = 0; i < validCount - 1; i++) {
    for (int j = 0; j < validCount - i - 1; j++) {
      if (readings[j] > readings[j + 1]) {
        float tmp = readings[j];
        readings[j] = readings[j + 1];
        readings[j + 1] = tmp;
      }
    }
  }

  float median = readings[validCount / 2];

  // Initialize on first reading
  if (stableDistance < 0) {
    stableDistance = median;
    return stableDistance;
  }

  // Deadband filter: ignore microscopic changes (< 0.8 cm) to eliminate jitter
  float diff = abs(median - stableDistance);
  if (diff >= 0.8) {
    // Adaptive smoothing: fast response on intentional movements, smooth on small shifts
    float alpha = (diff > 5.0) ? 0.65 : 0.35;
    stableDistance = (stableDistance * (1.0 - alpha)) + (median * alpha);
  }

  return stableDistance;
}

// ----------------------
// Calculate Smooth Percentage Level with Deadband
// ----------------------
float calculateLevel(float distance) {
  if (distance <= fullDistance) return 100.0;
  if (distance >= emptyDistance) return 0.0;

  float rawLevel = ((emptyDistance - distance) / (emptyDistance - fullDistance)) * 100.0;
  if (rawLevel < 0.0) rawLevel = 0.0;
  if (rawLevel > 100.0) rawLevel = 100.0;

  // 1.0% deadband to prevent flickering between adjacent percentage numbers
  if (abs(rawLevel - stableLevel) >= 1.0) {
    stableLevel = round(rawLevel);
  }

  return stableLevel;
}

// ----------------------
// API endpoint (/data)
// ----------------------
void handleData() {
  // Allow dynamic calibration query parameters: e.g. /data?empty=60&full=5
  if (server.hasArg("empty")) {
    float customEmpty = server.arg("empty").toFloat();
    if (customEmpty >= 10.0 && customEmpty <= 400.0) {
      emptyDistance = customEmpty;
    }
  }
  if (server.hasArg("full")) {
    float customFull = server.arg("full").toFloat();
    if (customFull >= 2.0 && customFull < emptyDistance) {
      fullDistance = customFull;
    }
  }

  float distance = getStableDistance();
  float level = calculateLevel(distance);

  String json = "{";
  json += "\"bin_id\":\"BIN-001\",";
  json += "\"distance_cm\":" + String(distance, 1) + ",";
  json += "\"level_percent\":" + String(level, 0) + ",";
  json += "\"empty_distance_cm\":" + String(emptyDistance, 1) + ",";
  json += "\"full_distance_cm\":" + String(fullDistance, 1) + ",";
  json += "\"status\":\"stable\"";
  json += "}";

  // Prevent ESP32 socket exhaustion & enable CORS
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  server.sendHeader("Connection", "close");

  server.send(200, "application/json", json);
}

// ----------------------
// WiFi Connection Helper with Diagnostic & Auto Fallback
// ----------------------
void setupWiFi() {
  WiFi.mode(WIFI_AP_STA);
  WiFi.disconnect(true);
  delay(200);

  // Enable Channels 1-13 (Philippines/Asia regulatory domain)
  wifi_country_t country = {
    .cc = "PH",
    .schan = 1,
    .nchan = 13,
    .max_tx_power = 20,
    .policy = WIFI_COUNTRY_POLICY_AUTO
  };
  esp_wifi_set_country(&country);

  Serial.println("\n[WiFi] Scanning nearby 2.4GHz networks...");
  int n = WiFi.scanNetworks();
  Serial.printf("[WiFi] Found %d networks:\n", n);
  bool foundTargetSsid = false;
  bool foundAltSsid = false;

  for (int i = 0; i < n; ++i) {
    String currentSsid = WiFi.SSID(i);
    Serial.printf("  - %s (Channel %d, %d dBm)\n", currentSsid.c_str(), WiFi.channel(i), WiFi.RSSI(i));
    if (currentSsid.equals(ssid)) foundTargetSsid = true;
    if (currentSsid.equals(altSsid)) foundAltSsid = true;
  }

  const char* connectTarget = foundTargetSsid ? ssid : (foundAltSsid ? altSsid : ssid);
  Serial.printf("\n[WiFi] Connecting to: %s ...\n", connectTarget);

  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.begin(connectTarget, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    WiFi.setSleep(false); // Disable sleep for ultra-fast HTTP response
    Serial.println("\n[WiFi] Connected Successfully!");
    Serial.print("[WiFi] ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.printf("\n[WiFi] Failed to connect (Status code: %d).\n", WiFi.status());
    // Start fallback hotspot so device is always accessible
    WiFi.softAP("BioLoop-ESP32", "12345678");
    Serial.print("[WiFi] Started Fallback AP: 'BioLoop-ESP32' (Pass: 12345678) IP: ");
    Serial.println(WiFi.softAPIP());
  }
}

// ----------------------
// Setup
// ----------------------
void setup() {
  Serial.begin(115200);

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  setupWiFi();

  // Setup endpoints
  server.on("/data", HTTP_GET, handleData);
  server.on("/data", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "*");
    server.sendHeader("Connection", "close");
    server.send(204);
  });

  server.begin();
  Serial.println("Stable Sensor Server active on port 80 (/data)");
  Serial.printf("Default calibration: 0%% at %.1f cm | 100%% at %.1f cm\n", emptyDistance, fullDistance);
}

// ----------------------
// Loop
// ----------------------
void loop() {
  // If disconnected from router and not in AP mode, retry connection periodically
  if (WiFi.status() != WL_CONNECTED && WiFi.getMode() == WIFI_STA) {
    delay(500);
    WiFi.reconnect();
    return;
  }

  // Handle incoming HTTP requests
  server.handleClient();
}