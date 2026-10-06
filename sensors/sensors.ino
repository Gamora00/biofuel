#include <WiFi.h>
#include <WebServer.h>

// ==========================================
// WIFI CREDENTIALS
// Note: ESP32 only supports 2.4GHz networks.
// If using mobile hotspot, enable "2.4GHz" or "Maximize Compatibility".
// ==========================================
const char* ssid = "Converge_2.4GHz_qnS8";
const char* password = "KT32ch8h";

// HC-SR04 Pins
const int trigPin = 5;
const int echoPin = 18;

// CALIBRATION (Container height in cm)
// 50.0 cm allows hand testing from 5cm (100% full) to 50cm (0% empty)
float emptyDistance = 50.0; // Distance when bin is empty (0%)
float fullDistance = 5.0;   // Distance when bin is full (100%)

WebServer server(80);

// Global smoothed values
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
    return -1.0; // No echo received
  }
  return (duration * 0.0343) / 2.0;
}

// ----------------------
// Multi-Sample Median Filter with Deadband
// ----------------------
float getStableDistance() {
  const int SAMPLES = 5;
  float readings[SAMPLES];
  int validCount = 0;

  for (int i = 0; i < SAMPLES; i++) {
    float r = readSinglePulse();
    if (r >= 2.0 && r <= 400.0) {
      readings[validCount++] = r;
    }
    delay(12);
  }

  // If no echo returned (open air or ceiling): return empty distance (0% level)
  if (validCount == 0) {
    if (stableDistance < 0) stableDistance = emptyDistance;
    return stableDistance;
  }

  // Bubble sort for median
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

  if (stableDistance < 0) {
    stableDistance = median;
    return stableDistance;
  }

  // Deadband: ignore microscopic tremors (< 0.8 cm)
  float diff = abs(median - stableDistance);
  if (diff >= 0.8) {
    float alpha = (diff > 5.0) ? 0.65 : 0.35;
    stableDistance = (stableDistance * (1.0 - alpha)) + (median * alpha);
  }

  return stableDistance;
}

// ----------------------
// Calculate Smooth Percentage Level
// ----------------------
float calculateLevel(float distance) {
  if (distance <= fullDistance) return 100.0;
  if (distance >= emptyDistance) return 0.0;

  float rawLevel = ((emptyDistance - distance) / (emptyDistance - fullDistance)) * 100.0;
  if (rawLevel < 0.0) rawLevel = 0.0;
  if (rawLevel > 100.0) rawLevel = 100.0;

  if (abs(rawLevel - stableLevel) >= 1.0) {
    stableLevel = round(rawLevel);
  }

  return stableLevel;
}

// ----------------------
// API endpoint (/data)
// ----------------------
void handleData() {
  if (server.hasArg("empty")) {
    float customEmpty = server.arg("empty").toFloat();
    if (customEmpty >= 10.0 && customEmpty <= 400.0) emptyDistance = customEmpty;
  }
  if (server.hasArg("full")) {
    float customFull = server.arg("full").toFloat();
    if (customFull >= 2.0 && customFull < emptyDistance) fullDistance = customFull;
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

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  server.sendHeader("Connection", "close");

  server.send(200, "application/json", json);
}

// ----------------------
// WiFi Setup with Scan & Fallback AP
// ----------------------
void setupWiFi() {
  WiFi.mode(WIFI_AP_STA);
  delay(100);

  Serial.println("\n-------------------------------------------");
  Serial.println("[WiFi Diagnostic] Scanning for 2.4GHz networks...");
  int n = WiFi.scanNetworks(false, true);

  if (n <= 0) {
    Serial.println("[WiFi Diagnostic] 0 networks found. Check router 2.4GHz LED!");
  } else {
    Serial.printf("[WiFi Diagnostic] Found %d networks:\n", n);
    for (int i = 0; i < n; ++i) {
      Serial.printf("  [%d] SSID: '%s' | Ch: %d | Signal: %d dBm\n",
        i + 1, WiFi.SSID(i).c_str(), WiFi.channel(i), WiFi.RSSI(i));
    }
  }
  Serial.println("-------------------------------------------");

  Serial.printf("[WiFi] Attempting connection to: '%s'...\n", ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    WiFi.setSleep(false);
    Serial.println("\n[WiFi] Connected Successfully!");
    Serial.print("[WiFi] ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.printf("\n[WiFi] Could not connect to '%s' (Status: %d).\n", ssid, WiFi.status());
    // Start fallback Hotspot so device is directly accessible
    WiFi.softAP("BioLoop-ESP32", "12345678");
    Serial.println("[WiFi] Started Fallback AP:");
    Serial.println("       Hotspot SSID: BioLoop-ESP32");
    Serial.println("       Password    : 12345678");
    Serial.print("       IP Address  : ");
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
}

// ----------------------
// Loop
// ----------------------
void loop() {
  if (WiFi.status() != WL_CONNECTED && WiFi.getMode() == WIFI_STA) {
    delay(500);
    WiFi.reconnect();
    return;
  }
  server.handleClient();
}