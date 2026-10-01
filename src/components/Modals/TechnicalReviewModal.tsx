"use client";

import React, { useState } from "react";
import { X, FlaskConical, CheckCircle2 } from "lucide-react";
import { FeedstockAssessment, SmartBin } from "@/types/database";

interface TechnicalReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bin: SmartBin;
  assessment: FeedstockAssessment;
  onConfirmReview: (notes: string, treatmentType: string) => void;
}

export const TechnicalReviewModal: React.FC<TechnicalReviewModalProps> = ({
  isOpen,
  onClose,
  bin,
  assessment,
  onConfirmReview,
}) => {
  const [treatmentType, setTreatmentType] = useState("Acid Esterification + Dewatering");
  const [notes, setNotes] = useState(
    "Verify FFA titration and schedule centrifuge filtration before batch blending."
  );
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmReview(notes, treatmentType);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#e5e9e6]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#eef6f1] flex items-center justify-center text-[#194a32]">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Request Technical Review
              </h3>
              <p className="text-xs text-gray-400">
                Feedstock Lab Quality Control • {bin.name}
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

        {done ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-[#22c55e] mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-900">
              Lab Ticket Assigned!
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Chemical engineering team alerted for {bin.name} pretreatment.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 bg-[#f7faf8] p-3 rounded-xl border border-[#e5ece8] text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">
                  Predicted FFA
                </span>
                <span className="font-bold text-gray-900 text-sm">
                  {assessment.predicted_ffa.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">
                  Lab FFA
                </span>
                <span className="font-bold text-gray-900 text-sm">
                  {assessment.lab_ffa.toFixed(2)}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Recommended Pretreatment Protocol
              </label>
              <select
                value={treatmentType}
                onChange={(e) => setTreatmentType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#194a32] bg-white"
              >
                <option value="Acid Esterification + Dewatering">
                  Acid Esterification + Dewatering
                </option>
                <option value="Thermal Settling & Coarse Filtration">
                  Thermal Settling & Coarse Filtration
                </option>
                <option value="Vacuum Drying & Neutralization">
                  Vacuum Drying & Neutralization
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Lab Review Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#194a32]"
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
                Submit Review Ticket
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
