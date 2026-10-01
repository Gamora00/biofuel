"use client";

import React from "react";
import { ChevronRight, Calendar } from "lucide-react";

interface HeaderProps {
  onOpenOverview: () => void;
  binsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenOverview, binsCount = 3 }) => {
  return (
    <header className="w-full bg-white border-b border-[#e5e9e6] px-6 py-3.5">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Left: BioLoop Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 min-w-9 min-h-9 rounded-full bg-gradient-to-br from-[#194a32] to-[#246e41] flex items-center justify-center shadow-sm">
            <svg
              width="20"
              height="20"
              className="w-5 h-5 text-white"
              style={{ width: "20px", height: "20px", stroke: "#ffffff" }}
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a10 10 0 1 0 10 10" />
              <path d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="2" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-[#143823] text-lg tracking-tight">BioLoop</span>
            </div>
            <p className="text-[11px] font-medium text-gray-400 leading-tight">Monitoring</p>
          </div>
        </div>

        {/* Center: Date Pill & View SmartBins Action */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-[#f8faf9] border border-[#e2e8e5] px-3.5 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-xs">
            <span className="font-bold text-gray-900">16</span>
            <span className="text-gray-500">Tue, Sep 2026</span>
          </div>

          <button
            onClick={onOpenOverview}
            className="flex items-center gap-1.5 bg-[#194a32] hover:bg-[#143a27] text-white text-xs font-medium px-4 py-2 rounded-full transition-all duration-150 shadow-sm active:scale-95"
          >
            <span>View SmartBins</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Right: User Profile */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#e8f3ec] border border-[#c7e0d1] flex items-center justify-center text-[#194a32] font-semibold text-xs shadow-xs">
            MR
          </div>
          <div className="hidden md:block text-left leading-tight">
            <p className="text-xs font-semibold text-gray-900">Maria Reyes</p>
            <p className="text-[11px] text-gray-400">Data Team</p>
          </div>
        </div>
      </div>
    </header>
  );
};
