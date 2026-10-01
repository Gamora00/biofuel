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

// ----------------------
// Measure Distance (HC-SR04)
// ----------------------
float getDistance() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // 25ms timeout corresponds to ~4 meters max range
  unsigned long duration = pulseIn(echoPin, HIGH, 25000);

  // If no echo returned, hand is either touching (<2cm blind spot) or out of range
  if (duration == 0) {
    return -1;
  }

  return (duration * 0.0343) / 2.0;
}

// ----------------------
// Calculate Level Percentage
// ----------------------
float getLevel(float distance) {
  if (distance < 0) {
    // Touching / directly covering transducer -> treat as 100% full
    return 100.0;
  }

  float level = ((EMPTY_DISTANCE - distance) / (EMPTY_DISTANCE - FULL_DISTANCE)) * 100.0;

  if (level < 0.0) level = 0.0;
  if (level > 100.0) level = 100.0;

  return level;
}

// ----------------------
// API endpoint (/data)
// ----------------------
void handleData() {
  float distance = getDistance();
  float level = getLevel(distance);

  // If close-range blind spot or touching, report 0 cm and 100% level
  float reportDistance = (distance < 0) ? 0.0 : distance;

  String json = "{";
  json += "\"bin_id\":\"BIN-001\",";
  json += "\"distance_cm\":" + String(reportDistance, 2) + ",";
  json += "\"level_percent\":" + String(level, 1);
  json += "}";

  // Log JSON to Serial Console
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

  // CRITICAL: Disable WiFi modem sleep so HTTP latency drops from 2000ms to 2ms
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
  Serial.println("Web Server active on port 80 (/data)");
}

// ----------------------
// Loop
// ----------------------
void loop() {
  // Reconnect WiFi if disconnected
  if (WiFi.status() != WL_CONNECTED) {
    delay(500);
    WiFi.reconnect();
    return;
  }

  server.handleClient();

  // Print live JSON to Serial Console every 1.5 seconds
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 1500) {
    lastPrint = millis();
    float d = getDistance();
    float l = getLevel(d);
    float reportDistance = (d < 0) ? 0.0 : d;

    String json = "{";
    json += "\"bin_id\":\"BIN-001\",";
    json += "\"distance_cm\":" + String(reportDistance, 2) + ",";
    json += "\"level_percent\":" + String(l, 1);
    json += "}";

    Serial.println(json);
  }
}