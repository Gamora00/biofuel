import { NextRequest, NextResponse } from "next/server";

// In-memory cache for latest sensor data
let latestSensorData: {
  bin_id: string;
  distance_cm: number;
  level_percent: number;
  timestamp: string;
  source_ip?: string;
} | null = null;

// Rate-limiting throttle timestamp
let lastFetchTime = 0;
const THROTTLE_MS = 1200;

// GET: Fetch telemetry from ESP32 IP address or return latest cached reading
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const esp32Ip = searchParams.get("ip") || "192.168.100.30";
  const emptyParam = searchParams.get("empty") || "50.0";
  const fullParam = searchParams.get("full") || "5.0";
  const force = searchParams.get("force") === "true";
  const now = Date.now();

  // Return cached data if requested too quickly and not forced
  if (!force && latestSensorData && now - lastFetchTime < THROTTLE_MS) {
    return NextResponse.json({
      success: true,
      data: latestSensorData,
      source: "cached_throttled",
    });
  }

  // Fetch directly from the ESP32 over local network
  if (esp32Ip) {
    const baseUrl = esp32Ip.startsWith("http")
      ? esp32Ip.replace(/\/data$/, "")
      : `http://${esp32Ip}`;

    const targetUrl = `${baseUrl}/data?empty=${encodeURIComponent(emptyParam)}&full=${encodeURIComponent(fullParam)}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`ESP32 returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawDistance = Number(data.distance_cm) || 0;

      // Calculate rock-solid calibrated percentage
      const emptyVal = parseFloat(emptyParam) || 50.0;
      const fullVal = parseFloat(fullParam) || 5.0;
      let calculatedLevel = Math.round(
        Math.min(100, Math.max(0, ((emptyVal - rawDistance) / (emptyVal - fullVal)) * 100))
      );

      // Prefer ESP32 calculated level if valid, or fallback to our formula
      const finalLevel = typeof data.level_percent === "number" ? data.level_percent : calculatedLevel;

      // Detect if significant change occurred before printing to server console
      const isNewValue =
        !latestSensorData ||
        Math.abs(latestSensorData.distance_cm - rawDistance) >= 0.8 ||
        latestSensorData.level_percent !== finalLevel;

      latestSensorData = {
        bin_id: data.bin_id || "BIN-001",
        distance_cm: rawDistance,
        level_percent: finalLevel,
        timestamp: new Date().toISOString(),
        source_ip: esp32Ip,
      };
      lastFetchTime = Date.now();

      if (isNewValue || force) {
        console.log(
          `[ESP32 Telemetry] Dist: ${rawDistance.toFixed(1)} cm | Fill: ${finalLevel}% (${latestSensorData.timestamp.split("T")[1].slice(0, 8)})`
        );
      }

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
