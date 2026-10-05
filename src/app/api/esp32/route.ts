import { NextRequest, NextResponse } from "next/server";

// In-memory cache for latest pushed or fetched sensor data
let latestSensorData: {
  bin_id: string;
  distance_cm: number;
  level_percent: number;
  timestamp: string;
  source_ip?: string;
} | null = null;

// Rate-limiting throttle timestamp
let lastFetchTime = 0;
const THROTTLE_MS = 1500;

// GET: Fetch telemetry from ESP32 IP address or return latest cached reading
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const esp32Ip = searchParams.get("ip") || "192.168.100.30";
  const now = Date.now();

  // Return fresh cached data if requested within throttle window (prevents request spam)
  if (latestSensorData && (now - lastFetchTime < THROTTLE_MS)) {
    return NextResponse.json({
      success: true,
      data: latestSensorData,
      source: "cached_throttled",
    });
  }

  // If an IP is provided or default, fetch directly from the ESP32 over local network (No CORS issues in Node.js)
  if (esp32Ip) {
    // Clean up IP / URL
    const targetUrl = esp32Ip.startsWith("http")
      ? (esp32Ip.endsWith("/data") ? esp32Ip : `${esp32Ip}/data`)
      : `http://${esp32Ip}/data`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        // If ESP32 returns 500 (No echo), HC-SR04 is blocked at close range (<2cm)
        latestSensorData = {
          bin_id: "BIN-001",
          distance_cm: 0.5,
          level_percent: 100.0,
          timestamp: new Date().toISOString(),
          source_ip: esp32Ip,
        };

        return NextResponse.json({
          success: true,
          data: latestSensorData,
          source: "esp32_close_range",
        });
      }

      const data = await response.json();

      // Update cache
      latestSensorData = {
        bin_id: data.bin_id || "BIN-001",
        distance_cm: Number(data.distance_cm) || 0,
        level_percent: Number(data.level_percent) || 0,
        timestamp: new Date().toISOString(),
        source_ip: esp32Ip,
      };
      lastFetchTime = Date.now();

      // Print JSON to server terminal console
      console.log("\n[ESP32 Server Console JSON]:", JSON.stringify(latestSensorData));

      return NextResponse.json({
        success: true,
        data: latestSensorData,
        source: "live_esp32",
      });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error:
            error.name === "AbortError"
              ? "Connection to ESP32 timed out (check IP and WiFi)"
              : error.message || "Failed to reach ESP32",
          url: targetUrl,
          cachedData: latestSensorData,
        },
        { status: 504 }
      );
    }
  }

  // Return latest cached data if no IP specified
  return NextResponse.json({
    success: true,
    data: latestSensorData,
    source: "cache",
  });
}

// POST: Allows the ESP32 to push readings directly to Next.js
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bin_id, distance_cm, level_percent } = body;

    latestSensorData = {
      bin_id: bin_id || "BIN-001",
      distance_cm: Number(distance_cm) || 0,
      level_percent: Number(level_percent) || 0,
      timestamp: new Date().toISOString(),
      source_ip: request.headers.get("x-forwarded-for") || "direct_push",
    };

    return NextResponse.json({
      success: true,
      message: "Telemetry received successfully",
      data: latestSensorData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Invalid payload" },
      { status: 400 }
    );
  }
}
