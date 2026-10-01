"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { FeedstockAssessment } from "@/types/database";

interface FeedstockAssessmentCardProps {
  assessment: FeedstockAssessment;
  onRequestReview: () => void;
}

export const FeedstockAssessmentCard: React.FC<FeedstockAssessmentCardProps> = ({
  assessment,
  onRequestReview,
}) => {
  return (
    <div className="bg-[#194a32] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <p className="text-[10px] font-bold tracking-wider text-emerald-200/70 uppercase">
          FEEDSTOCK ASSESSMENT
        </p>

        <h3 className="text-lg font-bold text-white mt-1.5 tracking-tight">
          {assessment.status}
        </h3>

        <p className="text-xs text-emerald-100/85 mt-1 leading-relaxed">
          {assessment.details}
        </p>

        {/* Metrics Pills */}
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between bg-[#133926] border border-white/10 px-3.5 py-2.5 rounded-xl text-xs">
            <span className="text-emerald-100/80 font-medium">Predicted FFA</span>
            <span className="font-bold text-white">
              {assessment.predicted_ffa.toFixed(2)}%
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#133926] border border-white/10 px-3.5 py-2.5 rounded-xl text-xs">
            <span className="text-emerald-100/80 font-medium">Lab FFA</span>
            <span className="font-bold text-white">
              {assessment.lab_ffa.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-5">
        {assessment.review_requested ? (
          <div className="w-full bg-emerald-800/70 border border-emerald-400/30 text-emerald-100 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Technical Review Requested</span>
          </div>
        ) : (
          <button
            onClick={onRequestReview}
            className="w-full bg-white hover:bg-gray-100 text-[#143823] text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs active:scale-[0.99]"
          >
            Request Technical Review
          </button>
        )}
      </div>
    </div>
  );
};
