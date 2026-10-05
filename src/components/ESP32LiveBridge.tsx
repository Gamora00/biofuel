"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Cpu, Wifi, WifiOff, RefreshCw, Settings, Check, AlertCircle } from "lucide-react";

interface ESP32Data {
  bin_id: string;
  distance_cm: number;
  level_percent: number;
  timestamp: string;
}

interface ESP32LiveBridgeProps {
  onDataReceived: (data: ESP32Data) => void;
  currentFillLevel: number;
}

export const ESP32LiveBridge: React.FC<ESP32LiveBridgeProps> = ({
  onDataReceived,
  currentFillLevel,
}) => {
  const [ipAddress, setIpAddress] = useState<string>("192.168.100.30");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true);
  const [lastReading, setLastReading] = useState<ESP32Data | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testingStatus, setTestingStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  // Load saved IP from localStorage or default to discovered 192.168.100.30
  useEffect(() => {
    const savedIp = localStorage.getItem("bioloop_esp32_ip");
    if (savedIp && savedIp !== "192.168.1.150") {
      setIpAddress(savedIp);
    } else {
      setIpAddress("192.168.100.30");
      localStorage.setItem("bioloop_esp32_ip", "192.168.100.30");
    }
  }, []);

  const fetchESP32Data = useCallback(async (targetIp: string) => {
    setIsPolling(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/esp32?ip=${encodeURIComponent(targetIp)}`);
      const json = await res.json();

      if (json.success && json.data) {
        setIsConnected(true);
        setLastReading((prev) => {
          // Log only when value changes to avoid console spam
          if (!prev || prev.level_percent !== json.data.level_percent || Math.abs(prev.distance_cm - json.data.distance_cm) >= 0.5) {
            console.log("[ESP32 Stable JSON]:", json.data);
          }
          return json.data;
        });
        onDataReceived(json.data);
        setTestingStatus("success");
      } else {
        setIsConnected(false);
        setErrorMessage(json.error || "ESP32 did not respond.");
        setTestingStatus("error");
      }
    } catch (err: any) {
      setIsConnected(false);
      setErrorMessage(err.message || "Failed to contact local API proxy.");
      setTestingStatus("error");
    } finally {
      setIsPolling(false);
    }
  }, [onDataReceived]);

  // Initial fetch on mount
  useEffect(() => {
    if (ipAddress) {
      fetchESP32Data(ipAddress);
    }
  }, [ipAddress, fetchESP32Data]);

  // Auto-polling interval every 3.5 seconds (prevents microcontroller overload)
  useEffect(() => {
    if (!autoPoll || !ipAddress) return;

    const interval = setInterval(() => {
      if (!isPolling) {
        fetchESP32Data(ipAddress);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [autoPoll, ipAddress, isPolling, fetchESP32Data]);

  const handleSaveAndTest = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIp = ipAddress.trim();
    if (!cleanIp) return;

    localStorage.setItem("bioloop_esp32_ip", cleanIp);
    setTestingStatus("testing");
    fetchESP32Data(cleanIp);
  };

  const simulateHardwareData = () => {
    // Generate realistic reading
    const simulatedDist = Number((6.5 + Math.random() * 2.0).toFixed(2));
    const emptyDist = 20.0;
    const fullDist = 5.0;
    const simulatedLevel = Number(
      Math.min(
        100,
        Math.max(0, ((emptyDist - simulatedDist) / (emptyDist - fullDist)) * 100)
      ).toFixed(1)
    );

    const mockData: ESP32Data = {
      bin_id: "BIN-001",
      distance_cm: simulatedDist,
      level_percent: simulatedLevel,
      timestamp: new Date().toISOString(),
    };

    console.log("[ESP32 JSON]:", JSON.stringify(mockData), mockData);
    setIsConnected(true);
    setLastReading(mockData);
    onDataReceived(mockData);
    setTestingStatus("success");
    setErrorMessage(null);
  };

  return (
    <>
      {/* ESP32 Quick Status Pill */}
      <div className="flex items-center gap-2">
        <div
          onClick={() => setIsModalOpen(true)}
          className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all shadow-xs ${
            isConnected
              ? "bg-[#e8f5ed] border-[#c4e4d0] text-[#194a32] hover:bg-[#ddf0e4]"
              : "bg-white border-[#e2e8e5] text-gray-600 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? "bg-[#22c55e] animate-pulse"
                  : "bg-gray-400"
              }`}
            />
            <Cpu className="w-3.5 h-3.5" />
            <span className="font-semibold">
              {isConnected ? "ESP32 Live" : "ESP32 Sensor"}
            </span>
          </div>

          {lastReading && (
            <span className="text-[11px] font-semibold opacity-90 pl-1 border-l border-gray-300">
              {lastReading.distance_cm} cm ({lastReading.level_percent}%)
            </span>
          )}

          <Settings className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
        </div>

        {/* Quick Poll Button */}
        {ipAddress && (
          <button
            onClick={() => fetchESP32Data(ipAddress)}
            title="Poll ESP32 now"
            className="p-1.5 bg-white hover:bg-gray-50 border border-[#e2e8e5] rounded-full text-gray-500 shadow-xs transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isPolling ? "animate-spin text-[#194a32]" : ""}`}
            />
          </button>
        )}
      </div>

      {/* ESP32 Settings & Debug Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#e5e9e6]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5ece8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#eef6f1] flex items-center justify-center text-[#194a32]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    ESP32 Hardware Bridge
                  </h3>
                  <p className="text-xs text-gray-400">
                    Source: <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">sensors/sensors.ino</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAndTest} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ESP32 IP Address / Hostname
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="e.g., 192.168.1.150 or bioloop-bin001.local"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#194a32] font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Check your Arduino Serial Monitor at 115200 baud for: <br />
                  <span className="font-mono text-gray-600">
                    &quot;ESP32 IP Address: 192.168.x.x&quot;
                  </span>
                </p>
              </div>

              {/* Auto Poll Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8faf9] border border-[#e5ece8]">
                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    Live Telemetry Streaming
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Automatically poll ESP32 every 4 seconds
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPoll}
                    onChange={(e) => setAutoPoll(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#194a32]"></div>
                </label>
              </div>

              {/* Status and Error Banners */}
              {testingStatus === "testing" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to http://{ipAddress}/data...</span>
                </div>
              )}

              {testingStatus === "success" && lastReading && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-[#194a32] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>ESP32 Connected Successfully!</span>
                  </div>
                  <div className="font-mono text-[11px] text-gray-600 pt-1">
                    Distance: {lastReading.distance_cm} cm | Fill: {lastReading.level_percent}%
                  </div>
                </div>
              )}

              {/* Raw JSON Console View */}
              {lastReading && (
                <div className="bg-[#0f172a] text-emerald-400 p-3 rounded-xl border border-slate-800 text-[11px] font-mono overflow-x-auto shadow-inner">
                  <div className="text-slate-400 text-[10px] mb-1 flex items-center justify-between border-b border-slate-800 pb-1">
                    <span>LIVE JSON CONSOLE STREAM</span>
                    <span className="text-slate-500">{new Date(lastReading.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(lastReading, null, 2)}</pre>
                </div>
              )}

              {testingStatus === "error" && errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Connection Failed</span>
                  </div>
                  <p className="text-[11px] text-rose-600 leading-tight">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={simulateHardwareData}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold"
                  title="Simulate sensor reading"
                >
                  Simulate
                </button>
                <button
                  type="submit"
                  disabled={isPolling}
                  className="flex-1 py-2.5 rounded-xl bg-[#194a32] hover:bg-[#143a27] text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isPolling ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <span>Connect & Test</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
