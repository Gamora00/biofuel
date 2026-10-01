"use client";

import React from "react";

interface WeightCardProps {
  currentWeight: number;
  capacity: number;
  todayAdded?: number;
}

export const WeightCard: React.FC<WeightCardProps> = ({
  currentWeight,
  capacity,
  todayAdded = 3.6,
}) => {
  const percentage = Math.min(Math.round((currentWeight / capacity) * 100), 100);

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e5e9e6] shadow-xs flex flex-col justify-between h-full">
      <div>
        <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
          CURRENT UCO WEIGHT
        </p>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            {currentWeight.toFixed(2)}
          </span>
          <span className="text-sm font-semibold text-gray-500">kg</span>
        </div>
      </div>

      <div className="mt-6">
        {/* Progress bar */}
        <div className="w-full bg-[#e8ece9] rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-[#143823] h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Subtext info */}
        <div className="flex items-center justify-between text-xs text-gray-400 mt-2 font-medium">
          <span>of {capacity} kg</span>
          <span className="text-gray-600 font-semibold">+{todayAdded} kg today</span>
        </div>
      </div>
    </div>
  );
};
