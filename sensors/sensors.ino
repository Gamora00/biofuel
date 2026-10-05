#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "Converge_2.4GHz_qnS8";
const char* password = "KT32ch8h";

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
// Setup
// ----------------------
void setup() {
  Serial.begin(115200);

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.begin(ssid, password);

  Serial.println("\nConnecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }

  // Disable WiFi modem sleep to eliminate latency
  WiFi.setSleep(false);

  Serial.println("\nWiFi Connected!");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

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
  // Auto-reconnect if WiFi disconnects
  if (WiFi.status() != WL_CONNECTED) {
    delay(500);
    WiFi.reconnect();
    return;
  }

  // Handle incoming HTTP requests only on demand
  server.handleClient();
}