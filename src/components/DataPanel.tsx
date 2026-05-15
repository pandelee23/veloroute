"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RouteStats } from "@/types/route";
import { WaterFountain } from "@/services/overpassService";
import { Mountain, Clock, Route as RouteIcon, Zap } from "lucide-react";
import { NutritionPanel } from "@/components/NutritionPanel";

interface DataPanelProps {
  stats: RouteStats;
  fountains: WaterFountain[];
}

export function DataPanel({ stats, fountains }: DataPanelProps) {
  // Format time in hours and minutes
  const hours = Math.floor(stats.estimatedTime / 60);
  const minutes = Math.round(stats.estimatedTime % 60);
  const timeString = `${hours > 0 ? `${hours}h ` : ""}${minutes}m`;

  return (
    <Card className="w-[calc(100vw-72px)] sm:w-80 bg-[#F9F9F7] rounded sm:rounded shadow-[4px_4px_16px_rgba(0,0,0,0.06)] border border-[#c2c8c3] ring-0 text-[#1a1c1b] max-h-[60vh] sm:max-h-none overflow-y-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold flex items-center justify-between">
          <span>Estadísticas</span>
          <Zap className="h-5 w-5 text-[#1b2b24]" />
        </CardTitle>
        <CardDescription className="text-[#424845]">
          Resumen de la ruta actual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col space-y-1">
            <span className="label-caps text-[#424845] flex items-center">
              <RouteIcon className="h-3 w-3 mr-1 text-[#1b2b24]" /> Distancia
            </span>
            <span className="text-2xl font-bold text-[#1a1c1b] font-stats">
              {stats.totalDistance.toFixed(1)} <span className="text-sm font-normal text-[#424845]">km</span>
            </span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="label-caps text-[#424845] flex items-center">
              <Mountain className="h-3 w-3 mr-1 text-[#1b2b24]" /> Desnivel
            </span>
            <span className="text-2xl font-bold text-[#1a1c1b] font-stats">
              +{Math.round(stats.elevationGain)} <span className="text-sm font-normal text-[#424845]">m</span>
            </span>
          </div>

          <div className="flex flex-col space-y-1 col-span-2 mt-2">
            <span className="label-caps text-[#424845] flex items-center">
              <Clock className="h-3 w-3 mr-1 text-[#cd4800]" /> Tiempo estimado
            </span>
            <span className="text-2xl font-bold text-[#1b2b24] font-stats">
              {timeString}
            </span>
          </div>
        </div>

        {/* Nutrition / Provisioning section */}
        <NutritionPanel
          stats={stats}
          fountains={fountains}
          totalDistance={stats.totalDistance}
        />
      </CardContent>
    </Card>
  );
}
