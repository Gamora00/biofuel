#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "Converge_2.4GHz_qnS8";
const char* password = "KT32ch8h";

const int trigPin = 5;
const int echoPin = 18;

// CALIBRATION (Adjust to your physical container height in cm)
const float EMPTY_DISTANCE = 20.0; // Distance when bin is empty (0%)
const float FULL_DISTANCE = 5.0;   // Distance when bin is full (100%)

WebServer server(80);

// Global smoothed values for rock-solid stability
float stableDistance = -1.0;
float stableLevel = -1.0;

// ----------------------
// Measure Raw Distance (Single Pulse)
// ----------------------
float readSinglePulse() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  unsigned long duration = pulseIn(echoPin, HIGH, 26000); // ~4.4m max
  if (duration == 0) {
    return -1.0;
  }
  return (duration * 0.0343) / 2.0;
}

// ----------------------
// Multi-Sample Median Filter (Rejects noise, echoes, and spikes)
// ----------------------
float getStableDistance() {
  const int SAMPLES = 5;
  float readings[SAMPLES];
  int validCount = 0;

  for (int i = 0; i < SAMPLES; i++) {
    float r = readSinglePulse();
    // Valid acoustic range for HC-SR04 in container (0.5cm - 150cm)
    if (r > 0.5 && r <= 150.0) {
      readings[validCount++] = r;
    }
    delay(10); // Acoustic echo dissipation delay
  }

  // If no echo returned (hand physically touching or covering transducer < 2cm)
  if (validCount == 0) {
    return 0.0;
  }

  // Sort samples to find median (outlier rejection)
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

  // Exponential Moving Average filter (70% previous + 30% new)
  if (stableDistance < 0) {
    stableDistance = median;
  } else {
    float diff = abs(median - stableDistance);
    float alpha = (diff > 5.0) ? 0.60 : 0.30;
    stableDistance = (stableDistance * (1.0 - alpha)) + (median * alpha);
  }

  return stableDistance;
}

// ----------------------
// Calculate Level with Deadband (Stable Integer)
// ----------------------
float calculateLevel(float distance) {
  if (distance <= FULL_DISTANCE) return 100.0;
  if (distance >= EMPTY_DISTANCE) return 0.0;

  float rawLevel = ((EMPTY_DISTANCE - distance) / (EMPTY_DISTANCE - FULL_DISTANCE)) * 100.0;
  if (rawLevel < 0.0) rawLevel = 0.0;
  if (rawLevel > 100.0) rawLevel = 100.0;

  // Deadband: keep stable level unless change is >= 1.5% to prevent digit jitter
  if (stableLevel < 0) {
    stableLevel = round(rawLevel);
  } else if (abs(rawLevel - stableLevel) >= 1.5) {
    stableLevel = round(rawLevel);
  }

  return stableLevel;
}

// ----------------------
// API endpoint (/data)
// ----------------------
void handleData() {
  float distance = getStableDistance();
  float level = calculateLevel(distance);

  String json = "{";
  json += "\"bin_id\":\"BIN-001\",";
  json += "\"distance_cm\":" + String(distance, 1) + ",";
  json += "\"level_percent\":" + String(level, 0);
  json += "}";

  // Log only when data is actually requested
  Serial.print("[Sensor Request]: ");
  Serial.println(json);

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

  // Handle incoming HTTP requests only when requested
  server.handleClient();
}