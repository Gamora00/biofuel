"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { SmartBin } from "@/types/database";

interface BinStatusBannerProps {
  selectedBin: SmartBin;
  allBins: SmartBin[];
  onSelectBin: (binId: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  esp32Slot?: React.ReactNode;
}

export const BinStatusBanner: React.FC<BinStatusBannerProps> = ({
  selectedBin,
  allBins,
  onSelectBin,
  onRefresh,
  isRefreshing,
  esp32Slot,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Left: Bin Selector Dropdown */}
      <div className="relative self-start sm:self-center" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-[#e2e8e5] px-3.5 py-2 rounded-full text-xs font-semibold text-gray-800 shadow-xs transition-all"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              selectedBin.status === "Online" ? "bg-[#22c55e]" : "bg-amber-500"
            }`}
          />
          <span>{selectedBin.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 mt-2 w-60 bg-white rounded-2xl shadow-lg border border-[#e2e8e5] py-1.5 z-30">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Select SmartBin
            </div>
            {allBins.map((bin) => (
              <button
                key={bin.id}
                onClick={() => {
                  onSelectBin(bin.id);
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors ${
                  bin.id === selectedBin.id
                    ? "bg-[#eef6f1] text-[#194a32] font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        bin.status === "Online" ? "bg-[#22c55e]" : "bg-amber-500"
                      }`}
                    />
                    <span>{bin.name}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 ml-4 truncate max-w-[165px]">
                    {bin.location}
                  </p>
                </div>
                <span className="text-[11px] font-medium text-gray-500">
                  {bin.fill_level_pct}%
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center: Online Title & Location Subtitle */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {selectedBin.name} is {selectedBin.status}
          </h1>
          <span className="text-xl select-none" role="img" aria-label="Leaf">
            🌿
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 font-medium">
          Collecting UCO at {selectedBin.location}
        </p>
      </div>

      {/* Right: ESP32 Live Status & Refresh Button */}
      <div className="self-end sm:self-center flex items-center gap-2">
        {esp32Slot}
        <button
          onClick={onRefresh}
          title="Sync telemetry now"
          className="w-9 h-9 rounded-full bg-white hover:bg-gray-50 border border-[#e2e8e5] flex items-center justify-center text-gray-600 shadow-xs transition-all active:scale-95"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#194a32]" : ""}`}
          />
        </button>
      </div>
    </div>
  );
};
