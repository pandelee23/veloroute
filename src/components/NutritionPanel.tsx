"use client";

import React from "react";
import { RouteStats } from "@/types/route";
import { WaterFountain } from "@/services/overpassService";
import { Droplets, Flame, AlertTriangle } from "lucide-react";

interface NutritionPanelProps {
  stats: RouteStats;
  fountains: WaterFountain[];
  totalDistance: number;
}

/**
 * Calculates nutrition needs and hydration gap warnings.
 *
 * Water:  500 ml/h base + 100 ml/h per 500 m elevation gain
 * Energy: 60 g carbs/h
 */
export function NutritionPanel({ stats, fountains, totalDistance }: NutritionPanelProps) {
  if (stats.totalDistance <= 0) return null;

  const hours = stats.estimatedTime / 60;

  // Water: 500ml/h adjusted for elevation
  const elevAdjust = Math.floor(stats.elevationGain / 500);
  const mlPerHour = 500 + elevAdjust * 100;
  const totalWaterMl = Math.round(mlPerHour * hours);
  const totalWaterL = (totalWaterMl / 1000).toFixed(1);

  // Energy: 60g carbs/h
  const totalCarbs = Math.round(60 * hours);

  // Hydration gap: sort fountains by distance, find any 15km+ gap
  const sortedFountains = [...fountains].sort(
    (a, b) => a.distanceFromStart - b.distanceFromStart
  );
  const gaps: { from: number; to: number; gap: number }[] = [];
  let prevKm = 0;
  for (const f of sortedFountains) {
    if (f.distanceFromStart - prevKm > 15) {
      gaps.push({
        from: prevKm,
        to: f.distanceFromStart,
        gap: Math.round((f.distanceFromStart - prevKm) * 10) / 10,
      });
    }
    prevKm = f.distanceFromStart;
  }
  // Check gap from last fountain to end
  if (totalDistance - prevKm > 15) {
    gaps.push({
      from: prevKm,
      to: totalDistance,
      gap: Math.round((totalDistance - prevKm) * 10) / 10,
    });
  }

  return (
    <div className="mt-4 pt-3 border-t border-[#EAEAEA]">
      <p className="text-[10px] font-bold tracking-widest uppercase text-[#757575] mb-3 flex items-center gap-1.5">
        <Flame className="h-3 w-3 text-[#D96A27]" />
        Plan de Avituallamiento
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Water */}
        <div className="flex flex-col space-y-0.5">
          <span className="text-[10px] text-[#757575] flex items-center gap-1">
            <Droplets className="h-3 w-3 text-[#4A7A30]" /> Agua
          </span>
          <span className="text-lg font-bold text-[#4A7A30]">
            {totalWaterL}{" "}
            <span className="text-xs font-normal text-[#757575]">L</span>
          </span>
          <span className="text-[9px] text-[#757575]">
            {mlPerHour} ml/h
          </span>
        </div>

        {/* Energy */}
        <div className="flex flex-col space-y-0.5">
          <span className="text-[10px] text-[#757575] flex items-center gap-1">
            <Flame className="h-3 w-3 text-[#D96A27]" /> Energía
          </span>
          <span className="text-lg font-bold text-[#D96A27]">
            {totalCarbs}{" "}
            <span className="text-xs font-normal text-[#757575]">g</span>
          </span>
          <span className="text-[9px] text-[#757575]">
            60 g carbs/h
          </span>
        </div>
      </div>

      {/* Fountain count */}
      {fountains.length > 0 && (
        <p className="text-[10px] text-[#757575] mt-2">
          💧 {fountains.length} fuente{fountains.length !== 1 ? "s" : ""} detectada{fountains.length !== 1 ? "s" : ""} en la ruta
        </p>
      )}

      {/* Hydration gap warnings */}
      {gaps.length > 0 && (
        <div className="mt-2 space-y-1">
          {gaps.map((g, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 bg-[#D96A27]/8 border border-[#D96A27]/20 rounded-xl px-2 py-1.5"
            >
              <AlertTriangle className="h-3 w-3 text-[#D96A27] flex-shrink-0 mt-0.5" />
              <span className="text-[10px] text-[#D96A27] leading-tight">
                <strong>{g.gap} km</strong> sin fuentes (km {g.from.toFixed(1)} → {g.to.toFixed(1)})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
