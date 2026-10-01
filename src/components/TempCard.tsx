"use client";

import React from "react";

interface TempCardProps {
  temp: number;
  status?: string;
}

export const TempCard: React.FC<TempCardProps> = ({
  temp = 28.4,
  status = "Normal",
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e5e9e6] shadow-xs flex flex-col justify-between h-full">
      <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
        TEMP
      </p>

      <div className="mt-4">
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {temp.toFixed(1)}
          </span>
          <span className="text-sm font-semibold text-gray-500">°C</span>
        </div>
        <p className="text-[11px] text-gray-400 font-medium mt-1">{status}</p>
      </div>
    </div>
  );
};
