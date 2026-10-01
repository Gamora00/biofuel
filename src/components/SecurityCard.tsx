"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

interface SecurityCardProps {
  status: string;
  subtitle?: string;
}

export const SecurityCard: React.FC<SecurityCardProps> = ({
  status = "Safe",
  subtitle = "Lid closed • No leaks",
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e5e9e6] shadow-xs flex flex-col items-center justify-center text-center h-full">
      <div className="w-11 h-11 rounded-2xl bg-[#e6f4eb] flex items-center justify-center text-[#1d6b3f] mb-3">
        <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
      </div>
      <h3 className="text-sm font-bold text-[#143823]">{status}</h3>
      <p className="text-[11px] text-gray-400 font-medium mt-1">{subtitle}</p>
    </div>
  );
};
