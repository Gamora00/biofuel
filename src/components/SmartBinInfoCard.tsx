"use client";

import React from "react";
import { SmartBin } from "@/types/database";

interface SmartBinInfoCardProps {
  bin: SmartBin;
  activeTab: "deposit_log" | "pickup_request";
  onTabChange: (tab: "deposit_log" | "pickup_request") => void;
  onOpenPickupModal: () => void;
}

export const SmartBinInfoCard: React.FC<SmartBinInfoCardProps> = ({
  bin,
  activeTab,
  onTabChange,
  onOpenPickupModal,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e5e9e6] shadow-xs flex flex-col justify-between h-full">
      <div>
        <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
          SMARTBIN
        </p>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">{bin.name}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{bin.location}</p>

        {/* Tab Buttons: Deposit Log vs Pickup Request */}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            onClick={() => onTabChange("deposit_log")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "deposit_log"
                ? "bg-[#143823] text-white shadow-xs"
                : "bg-[#eef3ef] text-gray-600 hover:bg-[#e4ede6]"
            }`}
          >
            Deposit Log
          </button>
          <button
            onClick={() => {
              onTabChange("pickup_request");
              onOpenPickupModal();
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "pickup_request"
                ? "bg-[#143823] text-white shadow-xs"
                : "bg-[#eef3ef] text-gray-600 hover:bg-[#e4ede6]"
            }`}
          >
            Pickup Request
          </button>
        </div>
      </div>

      {/* Metadata Telemetry Row */}
      <div className="grid grid-cols-3 gap-2 pt-5 border-t border-[#f0f4f1] mt-5">
        <div>
          <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            DEVICE
          </p>
          <p className="text-xs font-semibold text-gray-800 mt-0.5">{bin.device_id}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            LAST COMM
          </p>
          <p className="text-xs font-semibold text-gray-800 mt-0.5">{bin.last_comm_at}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            BATTERY
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-semibold text-gray-800">{bin.battery_pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
