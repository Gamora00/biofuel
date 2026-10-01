"use client";

import React, { useState } from "react";
import { X, Droplets } from "lucide-react";

interface NewDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  binName: string;
  onAddDeposit: (sourceName: string, weightKg: number) => void;
}

export const NewDepositModal: React.FC<NewDepositModalProps> = ({
  isOpen,
  onClose,
  binName,
  onAddDeposit,
}) => {
  const [sourceName, setSourceName] = useState("Restaurant C");
  const [weight, setWeight] = useState("3.2");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numWeight = parseFloat(weight);
    if (!sourceName.trim() || isNaN(numWeight) || numWeight <= 0) return;
    onAddDeposit(sourceName.trim(), numWeight);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-[#e5e9e6]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#eef6f1] flex items-center justify-center text-[#194a32]">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Record UCO Deposit</h3>
              <p className="text-xs text-gray-400">Add intake to {binName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Source Establishment
            </label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#194a32]"
              placeholder="e.g., Restaurant A, Campus Cafeteria"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="30"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#194a32]"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#194a32] hover:bg-[#143a27] text-white text-xs font-semibold shadow-sm"
            >
              Log Deposit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
