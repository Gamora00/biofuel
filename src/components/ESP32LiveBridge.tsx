"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Cpu, Wifi, RefreshCw, Settings, Check, AlertCircle, Sliders } from "lucide-react";

interface ESP32Data {
  bin_id: string;
  distance_cm: number;
  level_percent: number;
  empty_distance_cm?: number;
  full_distance_cm?: number;
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
  const [emptyDistance, setEmptyDistance] = useState<number>(50.0);
  const [fullDistance, setFullDistance] = useState<number>(5.0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // States for actions to prevent button flicker / infinite "Testing..."
  const [isTestingManual, setIsTestingManual] = useState(false);
  const [isQuickSyncing, setIsQuickSyncing] = useState(false);
  const [autoPoll, setAutoPoll] = useState(false); // DEFAULT TO FALSE to avoid infinite polling/spam
  const [lastReading, setLastReading] = useState<ESP32Data | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testingStatus, setTestingStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  const isPollingRef = useRef(false);

  // Load saved configurations from localStorage
  useEffect(() => {
    const savedIp = localStorage.getItem("bioloop_esp32_ip");
    if (savedIp) {
      setIpAddress(savedIp);
    } else {
      setIpAddress("192.168.100.30");
      localStorage.setItem("bioloop_esp32_ip", "192.168.100.30");
    }

    const savedEmpty = localStorage.getItem("bioloop_esp32_empty");
    if (savedEmpty) setEmptyDistance(parseFloat(savedEmpty) || 50.0);

    const savedFull = localStorage.getItem("bioloop_esp32_full");
    if (savedFull) setFullDistance(parseFloat(savedFull) || 5.0);
  }, []);

  const fetchESP32Data = useCallback(
    async (targetIp: string, customEmpty = emptyDistance, customFull = fullDistance, isManual = false) => {
      if (isPollingRef.current && !isManual) return;
      isPollingRef.current = true;

      if (isManual) {
        setIsTestingManual(true);
        setTestingStatus("testing");
      }
      setErrorMessage(null);

      try {
        const queryParams = new URLSearchParams({
          ip: targetIp,
          empty: customEmpty.toString(),
          full: customFull.toString(),
          ...(isManual ? { force: "true" } : {}),
        });

        const res = await fetch(`/api/esp32?${queryParams.toString()}`);
        const json = await res.json();

        if (json.success && json.data) {
          setIsConnected(true);
          setLastReading(json.data);
          onDataReceived(json.data);
          if (isManual) {
            setTestingStatus("success");
            console.log("[ESP32 Manual Test Success]:", json.data);
          }
        } else {
          setIsConnected(false);
          setErrorMessage(json.error || "ESP32 did not respond.");
          if (isManual) setTestingStatus("error");
        }
      } catch (err: any) {
        setIsConnected(false);
        setErrorMessage(err.message || "Failed to contact local API proxy.");
        if (isManual) setTestingStatus("error");
      } finally {
        isPollingRef.current = false;
        if (isManual) setIsTestingManual(false);
        setIsQuickSyncing(false);
      }
    },
    [emptyDistance, fullDistance, onDataReceived]
  );

  // Initial single check on mount (does not loop)
  useEffect(() => {
    if (ipAddress) {
      fetchESP32Data(ipAddress, emptyDistance, fullDistance, false);
    }
  }, [ipAddress, emptyDistance, fullDistance, fetchESP32Data]);

  // Controlled auto-polling ONLY when user explicitly toggles it ON
  useEffect(() => {
    if (!autoPoll || !ipAddress) return;

    const interval = setInterval(() => {
      if (!isPollingRef.current) {
        fetchESP32Data(ipAddress, emptyDistance, fullDistance, false);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [autoPoll, ipAddress, emptyDistance, fullDistance, fetchESP32Data]);

  const handleSaveAndTest = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIp = ipAddress.trim();
    if (!cleanIp) return;

    localStorage.setItem("bioloop_esp32_ip", cleanIp);
    localStorage.setItem("bioloop_esp32_empty", emptyDistance.toString());
    localStorage.setItem("bioloop_esp32_full", fullDistance.toString());

    fetchESP32Data(cleanIp, emptyDistance, fullDistance, true);
  };

  const handleQuickRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsQuickSyncing(true);
    fetchESP32Data(ipAddress, emptyDistance, fullDistance, true);
  };

  const simulateHardwareData = () => {
    // Generate realistic simulated reading between 5 and 50 cm
    const simDistance = Number((8.0 + Math.random() * 25.0).toFixed(1));
    const simLevel = Math.round(
      Math.min(100, Math.max(0, ((emptyDistance - simDistance) / (emptyDistance - fullDistance)) * 100))
    );

    const mockData: ESP32Data = {
      bin_id: "BIN-001",
      distance_cm: simDistance,
      level_percent: simLevel,
      empty_distance_cm: emptyDistance,
      full_distance_cm: fullDistance,
      timestamp: new Date().toISOString(),
    };

    console.log("[ESP32 Mock JSON Console]:", mockData);
    setIsConnected(true);
    setLastReading(mockData);
    onDataReceived(mockData);
    setTestingStatus("success");
    setErrorMessage(null);
  };

  return (
    <>
      {/* ESP32 Quick Status Pill in Header */}
      <div className="flex items-center gap-2">
        <div
          onClick={() => setIsModalOpen(true)}
          className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all shadow-xs ${
            isConnected
              ? "bg-[#e8f5ed] border-[#c4e4d0] text-[#194a32] hover:bg-[#ddf0e4]"
              : "bg-white border-[#e2e8e5] text-gray-600 hover:bg-gray-50"
          }`}
          title="Click to configure ESP32 settings & calibration"
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? autoPoll
                    ? "bg-[#22c55e] animate-ping"
                    : "bg-[#22c55e]"
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

        {/* Quick Poll Button on Header Banner */}
        {ipAddress && (
          <button
            onClick={handleQuickRefresh}
            title="Read stable ESP32 value now"
            className="p-1.5 bg-white hover:bg-gray-50 border border-[#e2e8e5] rounded-full text-gray-500 shadow-xs transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isQuickSyncing ? "animate-spin text-[#194a32]" : ""}`}
            />
          </button>
        )}
      </div>

      {/* ESP32 Settings & Live Calibration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#e5e9e6]">
            {/* Modal Header */}
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
                    Sketch: <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">sensors/sensors.ino</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAndTest} className="space-y-4 pt-4">
              {/* IP Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ESP32 IP Address / Hostname
                </label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="e.g. 192.168.100.30"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#194a32] font-mono"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  IP from Serial Monitor: <span className="font-mono text-gray-700 font-semibold">192.168.100.30</span>
                </p>
              </div>

              {/* Calibration Settings */}
              <div className="bg-[#f8faf9] p-3.5 rounded-xl border border-[#e5ece8] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                  <Sliders className="w-3.5 h-3.5 text-[#194a32]" />
                  <span>Level Calibration (Container Depth)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Empty Dist (0%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="10"
                        max="200"
                        value={emptyDistance}
                        onChange={(e) => setEmptyDistance(parseFloat(e.target.value) || 50)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-mono pr-8"
                      />
                      <span className="absolute right-2.5 top-1.5 text-[10px] text-gray-400 font-medium">cm</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Full Dist (100%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="2"
                        max="50"
                        value={fullDistance}
                        onChange={(e) => setFullDistance(parseFloat(e.target.value) || 5)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-mono pr-8"
                      />
                      <span className="absolute right-2.5 top-1.5 text-[10px] text-gray-400 font-medium">cm</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">
                  Default 50 cm empty & 5 cm full enables smooth level tracking as your hand moves above the sensor.
                </p>
              </div>

              {/* Auto Poll Streaming Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8faf9] border border-[#e5ece8]">
                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    Live Telemetry Streaming
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {autoPoll ? "Streaming updates every 4.5s" : "Disabled (prevents loops & unnecessary requests)"}
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

              {/* Status Banner */}
              {testingStatus === "testing" && isTestingManual && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Requesting stable telemetry from http://{ipAddress}/data...</span>
                </div>
              )}

              {testingStatus === "success" && lastReading && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-[#194a32] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Stable Telemetry Received!</span>
                  </div>
                  <div className="font-mono text-[11px] text-gray-700 pt-1">
                    Distance: <span className="font-bold text-gray-900">{lastReading.distance_cm} cm</span> | Fill: <span className="font-bold text-[#194a32]">{lastReading.level_percent}%</span>
                  </div>
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

              {/* Raw JSON Console */}
              {lastReading && (
                <div className="bg-[#0f172a] text-emerald-400 p-3 rounded-xl border border-slate-800 text-[11px] font-mono overflow-x-auto shadow-inner">
                  <div className="text-slate-400 text-[10px] mb-1 flex items-center justify-between border-b border-slate-800 pb-1">
                    <span>LIVE SENSOR JSON DATA</span>
                    <span className="text-slate-500">{new Date(lastReading.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(lastReading, null, 2)}</pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={simulateHardwareData}
                  className="px-3.5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold"
                  title="Simulate sensor reading"
                >
                  Simulate
                </button>

                <button
                  type="submit"
                  disabled={isTestingManual}
                  className="flex-1 py-2.5 rounded-xl bg-[#194a32] hover:bg-[#143a27] text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-75"
                >
                  {isTestingManual ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reading Sensor...</span>
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
