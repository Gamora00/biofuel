"use client";

import React from "react";

interface FillLevelCardProps {
  fillPct: number;
  remainingKg: number;
  distanceCm?: number;
}

export const FillLevelCard: React.FC<FillLevelCardProps> = ({
  fillPct,
  remainingKg,
  distanceCm,
}) => {
  const clampedPct = Math.min(Math.max(fillPct, 0), 100);

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e5e9e6] shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
          FILL LEVEL
        </p>
        {distanceCm !== undefined && distanceCm > 0 && (
          <span className="text-[10px] font-mono bg-[#f0f5f2] text-[#194a32] px-1.5 py-0.5 rounded font-semibold">
            {distanceCm.toFixed(1)} cm
          </span>
        )}
      </div>

      <div className="flex items-end gap-4 mt-6">
        <div>
          <div className="flex items-baseline">
            <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              {clampedPct}
            </span>
            <span className="text-lg font-bold text-gray-600 ml-0.5">%</span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-1">
            ~{remainingKg.toFixed(1)} kg left
          </p>
        </div>

        {/* Vertical Canister / Tank Level Graphic */}
        <div className="relative w-5 h-11 rounded-md border border-[#d1dbd5] bg-[#f2f6f3] p-0.5 flex items-end overflow-hidden mb-0.5 shadow-inner">
          <div
            className="w-full rounded-xs bg-gradient-to-t from-[#194a32] to-[#348b54] transition-all duration-500"
            style={{ height: `${clampedPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};
