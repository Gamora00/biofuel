"use client";

import React from "react";
import { Check, Plus } from "lucide-react";
import { Deposit } from "@/types/database";

interface RecentDepositsCardProps {
  deposits: Deposit[];
  onOpenNewDepositModal: () => void;
}

export const RecentDepositsCard: React.FC<RecentDepositsCardProps> = ({
  deposits,
  onOpenNewDepositModal,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#e5e9e6] shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Recent Deposits</h3>
          <button
            onClick={onOpenNewDepositModal}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#194a32] hover:text-[#123926] bg-[#f0f7f3] hover:bg-[#e4ede7] px-2.5 py-1 rounded-full transition-colors"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>Add Deposit</span>
          </button>
        </div>

        {/* Deposit List */}
        <div className="divide-y divide-[#f2f6f3]">
          {deposits.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 group hover:bg-[#fafcfb] -mx-2 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Round green checkmark circle matching Figma */}
                <div className="w-7 h-7 rounded-full bg-[#dff0e6] flex items-center justify-center text-[#194a32] flex-shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 leading-tight">
                    {item.source_name}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
                    {item.deposit_code} • {item.formatted_time || "Recent"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-gray-800">
                  +{item.weight_kg.toFixed(1)} kg
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-[#f4f7f5] text-center">
        <p className="text-[11px] text-gray-400 font-medium">
          Showing latest verified feedstock intake
        </p>
      </div>
    </div>
  );
};
