"use client";

import React from "react";
import { X, Battery, MapPin, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { SmartBin } from "@/types/database";

interface SmartBinsOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bins: SmartBin[];
  selectedBinId: string;
  onSelectBin: (binId: string) => void;
}

export const SmartBinsOverviewModal: React.FC<SmartBinsOverviewModalProps> = ({
  isOpen,
  onClose,
  bins,
  selectedBinId,
  onSelectBin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl border border-[#e5e9e6] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e5ece8]">
          <div>
            <h3 className="text-lg font-bold text-gray-900">SmartBins Fleet Overview</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Active Biofuel UCO collection sites across Western Visayas
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bins List */}
        <div className="py-4 space-y-3 overflow-y-auto pr-1">
          {bins.map((bin) => {
            const isCurrent = bin.id === selectedBinId;
            const isHigh = bin.fill_level_pct >= 80;

            return (
              <div
                key={bin.id}
                onClick={() => {
                  onSelectBin(bin.id);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCurrent
                    ? "bg-[#f2f8f4] border-[#194a32] shadow-xs"
                    : "bg-white border-[#e5e9e6] hover:border-gray-300 hover:bg-gray-50/60"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        bin.status === "Online" ? "bg-[#22c55e]" : "bg-amber-500"
                      }`}
                    />
                    <h4 className="font-bold text-gray-900 text-sm">{bin.name}</h4>
                    {isCurrent && (
                      <span className="bg-[#194a32] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Viewing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{bin.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-xs font-bold text-gray-900">
                      {bin.current_weight_kg.toFixed(1)} / {bin.capacity_kg} kg
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {bin.fill_level_pct}% full
                    </div>
                  </div>

                  {/* Level pill */}
                  <div
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                      isHigh
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-[#194a32]"
                    }`}
                  >
                    {isHigh ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{isHigh ? "Near Capacity" : "Optimal"}</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#e5ece8] flex items-center justify-between text-xs text-gray-500">
          <span>{bins.length} Active Nodes Telemetring</span>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#194a32] hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
