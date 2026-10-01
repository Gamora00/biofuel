"use client";

import React, { useState } from "react";
import { TrendPoint } from "@/types/database";

interface CollectionTrendChartProps {
  data: TrendPoint[];
}

export const CollectionTrendChart: React.FC<CollectionTrendChartProps> = ({
  data,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [range, setRange] = useState<"Today" | "7D" | "30D">("Today");

  // Compute SVG path for smooth curve
  const width = 640;
  const height = 180;
  const paddingX = 16;
  const paddingY = 24;

  const weights = data.map((d) => d.weight);
  const minWeight = Math.min(...weights) * 0.9;
  const maxWeight = Math.max(...weights) * 1.05;
  const weightRange = Math.max(maxWeight - minWeight, 1);

  const points = data.map((point, idx) => {
    const x =
      paddingX +
      (idx / Math.max(data.length - 1, 1)) * (width - paddingX * 2);
    const y =
      height -
      paddingY -
      ((point.weight - minWeight) / weightRange) * (height - paddingY * 2);
    return { x, y, ...point };
  });

  const linePath =
    points.length > 0
      ? points.reduce((acc, pt, i, arr) => {
          if (i === 0) return `M ${pt.x},${pt.y}`;
          const prev = arr[i - 1];
          const cpx1 = prev.x + (pt.x - prev.x) * 0.45;
          const cpy1 = prev.y;
          const cpx2 = prev.x + (pt.x - prev.x) * 0.55;
          const cpy2 = pt.y;
          return `${acc} C ${cpx1},${cpy1} ${cpx2},${cpy2} ${pt.x},${pt.y}`;
        }, "")
      : "";

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x},${height} L ${
          points[0].x
        },${height} Z`
      : "";

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#e5e9e6] shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900">UCO Collection Trend</h3>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center bg-[#f4f7f5] p-0.5 rounded-lg border border-[#e5e9e6]">
            {(["Today", "7D", "30D"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors ${
                  range === r
                    ? "bg-white text-[#143823] shadow-2xs font-semibold"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 font-medium">{range} • kg</span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative w-full h-[185px] flex items-center justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="ucoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#194a32" stopOpacity="0.14" />
              <stop offset="85%" stopColor="#194a32" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#194a32" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Subtle horizontal guide lines */}
          {[0.25, 0.55, 0.85].map((ratio, idx) => (
            <line
              key={idx}
              x1={paddingX}
              y1={height * ratio}
              x2={width - paddingX}
              y2={height * ratio}
              stroke="#f1f5f3"
              strokeWidth="1"
            />
          ))}

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill="url(#ucoGradient)" />}

          {/* Smooth trend line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#194a32"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          )}

          {/* Interactive Data Points */}
          {points.map((pt, idx) => (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIdx === idx ? 5 : 3}
                fill={hoveredIdx === idx ? "#194a32" : "#ffffff"}
                stroke="#194a32"
                strokeWidth="2"
                className="transition-all duration-150"
              />
              {/*Larger invisible hit target*/}
              <circle cx={pt.x} cy={pt.y} r="16" fill="transparent" />
            </g>
          ))}
        </svg>

        {/* Floating Tooltip on Hover */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            className="absolute bg-[#143823] text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-md pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2 z-20 whitespace-nowrap"
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              top: `${(points[hoveredIdx].y / height) * 100}%`,
            }}
          >
            <div className="font-bold">{points[hoveredIdx].weight.toFixed(2)} kg</div>
            <div className="text-[10px] text-emerald-200">
              {points[hoveredIdx].label}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Time Labels */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium px-2 pt-2 border-t border-[#f4f7f5]">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
    </div>
  );
};
