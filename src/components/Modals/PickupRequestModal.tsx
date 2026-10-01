"use client";

import React, { useState } from "react";
import { X, Truck, CheckCircle2 } from "lucide-react";
import { SmartBin } from "@/types/database";

interface PickupRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  bin: SmartBin;
  onSubmit: (priority: "Low" | "Standard" | "Urgent", notes: string, schedule: string) => void;
}

export const PickupRequestModal: React.FC<PickupRequestModalProps> = ({
  isOpen,
  onClose,
  bin,
  onSubmit,
}) => {
  const [priority, setPriority] = useState<"Low" | "Standard" | "Urgent">("Standard");
  const [schedule, setSchedule] = useState("Today, 8:00 PM");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(priority, notes, schedule);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setNotes("");
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#e5e9e6]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#eef6f1] flex items-center justify-center text-[#194a32]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Dispatch Pickup Request</h3>
              <p className="text-xs text-gray-400">
                {bin.name} • {bin.location}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-[#22c55e] mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-900">Pickup Dispatched!</h4>
            <p className="text-xs text-gray-500 mt-1">
              Logistics team notified for {bin.name} ({bin.current_weight_kg.toFixed(2)} kg UCO).
            </p>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="bg-[#f7faf8] p-3.5 rounded-xl border border-[#e5ece8] flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Current UCO Load</span>
              <span className="font-bold text-gray-900">
                {bin.current_weight_kg.toFixed(2)} kg ({bin.fill_level_pct}%)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Low", "Standard", "Urgent"] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      priority === p
                        ? "bg-[#194a32] text-white border-[#194a32]"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Preferred Collection Window
              </label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#194a32]"
                placeholder="e.g., Today, 8:00 PM"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Collector Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#194a32]"
                placeholder="Access gate instructions or container swap details..."
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
                Confirm Pickup
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
