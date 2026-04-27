"use client";

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { RoutePoint } from "@/types/route";
import { Climb } from "@/utils/climbDetection";
import { calculateSlope, getSlopeColor, calculateDistanceSmoothedSlope } from "@/utils/slope";

interface ClimbDetailPanelProps {
  climb: Climb;
  routePoints: RoutePoint[];
  onClose: () => void;
}

const SLOPE_BANDS = [
  { min: -Infinity, max: 0,   label: "Bajada",   color: "#2B78E4" },
  { min: 0,  max: 2,          label: "Llano",    color: "#4A7A30" },
  { min: 2,  max: 6,          label: "Moderada", color: "#C4A035" },
  { min: 6,  max: 10,         label: "Dura",     color: "#D96A27" },
  { min: 10, max: Infinity,   label: "Muro",     color: "#C0392B" },
];

function getSlopeBand(slope: number) {
  return SLOPE_BANDS.find(b => slope >= b.min && slope < b.max) ?? SLOPE_BANDS[SLOPE_BANDS.length - 1];
}

const ClimbTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const pt = payload[0].payload;
  const band = getSlopeBand(pt.slope ?? 0);
  return (
    <div className="bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <p className="text-[#757575] mb-0.5">{(pt.relDist * 1000).toFixed(0)} m desde inicio</p>
      <p className="font-bold text-[#1A1A1A] text-sm">{pt.elevation.toFixed(0)} m</p>
      <p style={{ color: band.color }} className="font-semibold mt-0.5">{(pt.slope ?? 0).toFixed(1)}% · {band.label}</p>
    </div>
  );
};

export function ClimbDetailPanel({ climb, routePoints, onClose }: ClimbDetailPanelProps) {
  const slice = routePoints.slice(climb.startIndex, climb.endIndex + 1);
  const startDist = slice[0]?.distance ?? 0;

  // Calculate chart data using distance-based gradient smoothing (100m window)
  const chartData = slice.map((pt, i) => ({
    relDist: pt.distance - startDist,
    elevation: pt.elevation,
    slope: calculateDistanceSmoothedSlope(slice, i, 100),
  }));

  const slopes = chartData.map(d => d.slope);
  const peakSlope = Math.max(0, ...slopes);
  const minElev = Math.min(...slice.map(p => p.elevation));
  const maxElev = Math.max(...slice.map(p => p.elevation));
  const yPad = Math.max(10, (maxElev - minElev) * 0.15);
  const yDomain = [Math.floor(minElev - yPad), Math.ceil(maxElev + yPad)];

  // Slope distribution
  const totalDist = climb.lengthKm * 1000;
  const bandDist: Record<string, number> = {};
  SLOPE_BANDS.forEach(b => { bandDist[b.label] = 0; });
  for (let i = 1; i < slice.length; i++) {
    const segM = Math.abs(slice[i].distance - slice[i-1].distance) * 1000;
    const s = chartData[i].slope;
    const band = getSlopeBand(s);
    bandDist[band.label] += segM;
  }

  return (
    // Outer: full-height column on the right, aligned to top
    <div className="absolute top-0 right-0 bottom-0 z-30 pointer-events-none flex flex-col justify-start pt-3 pr-3" style={{ width: 330 }}>
      <div
        className="pointer-events-auto rounded-2xl overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
        style={{
          background: "#FFFFFF",
          border: `1.5px solid ${climb.categoryColor}40`,
          maxHeight: "calc(100vh - 80px)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid #EAEAEA` }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full"
              style={{ background: climb.categoryColor + "15", color: climb.categoryColor, border: `1px solid ${climb.categoryColor}30` }}
            >
              {climb.category}
            </span>
            <span className="text-[#1A1A1A] font-bold text-sm leading-tight">{climb.name}</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[#757575] hover:text-[#1A1A1A] hover:bg-[#F3F0E8] transition-all text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* ── Stats grid (2×2) ── */}
        <div className="grid grid-cols-2 gap-[1px] flex-shrink-0" style={{ background: "#EAEAEA" }}>
          {[
            { label: "Longitud",     value: `${climb.lengthKm} km`,          color: "#1A1A1A" },
            { label: "Desnivel",     value: `+${climb.elevationGainM} m`,     color: "#1A1A1A" },
            { label: "Pend. media",  value: `${climb.avgSlopePct}%`,           color: getSlopeColor(climb.avgSlopePct) },
            { label: "Pend. máxima", value: `${peakSlope.toFixed(1)}%`,        color: getSlopeColor(peakSlope) },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#FAFAF7] px-4 py-2.5">
              <p className="text-[9px] uppercase tracking-wider text-[#757575] mb-0.5">{label}</p>
              <p className="text-base font-bold leading-none" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Second row: cima + difficulty + APM ── */}
        <div className="grid grid-cols-3 gap-[1px] flex-shrink-0" style={{ background: "#EAEAEA" }}>
          {[
            { label: "Alt. Cima",   value: `${maxElev.toFixed(0)} m`, color: "#757575" },
            { label: "Dificultad",  value: climb.category,             color: climb.categoryColor },
            { label: "APM",         value: `${climb.apm}`,             color: "#7C5CBA" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white px-4 py-2">
              <p className="text-[9px] uppercase tracking-wider text-[#757575] mb-0.5">{label}</p>
              <p className="text-sm font-bold leading-none" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Altimetry chart ── */}
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#757575] mb-2">Altimetría del puerto</p>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`cg-${climb.name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor={climb.categoryColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={climb.categoryColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#EAEAEA" vertical={false} />
                <XAxis
                  dataKey="relDist"
                  tick={{ fill: "#757575", fontSize: 9 }}
                  tickFormatter={v => `${(+v).toFixed(1)}k`}
                  stroke="#EAEAEA"
                  axisLine={false}
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fill: "#757575", fontSize: 9 }}
                  tickFormatter={v => `${v}m`}
                  stroke="#EAEAEA"
                  axisLine={false}
                  width={38}
                />
                <Tooltip content={<ClimbTooltip />} />
                <Area
                  type="monotone"
                  dataKey="elevation"
                  stroke={climb.categoryColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#cg-${climb.name})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Slope distribution ── */}
        <div className="px-3 pt-1 pb-4 flex-shrink-0">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#757575] mb-2">Distribución de pendiente</p>
          {/* Stacked bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden w-full mb-2.5" style={{ background: "#F3F0E8" }}>
            {SLOPE_BANDS.map(band => {
              const pct = totalDist > 0 ? ((bandDist[band.label] ?? 0) / totalDist) * 100 : 0;
              if (pct < 0.5) return null;
              return <div key={band.label} style={{ width: `${pct}%`, background: band.color }} />;
            })}
          </div>
          {/* Labels */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {SLOPE_BANDS.map(band => {
              const pct = totalDist > 0 ? ((bandDist[band.label] ?? 0) / totalDist) * 100 : 0;
              if (pct < 0.5) return null;
              return (
                <div key={band.label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: band.color }} />
                  <span className="text-[10px] text-[#757575] truncate">
                    {band.label} <span className="text-[#1A1A1A] font-semibold">{pct.toFixed(0)}%</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
