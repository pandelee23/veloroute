"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { RoutePoint, RouteStats } from "@/types/route";
import { Mountain, Clock, Route as RouteIcon, Droplets, Flame } from "lucide-react";

interface ProfileChartProps {
  routePoints: RoutePoint[];
  onHover?: (index: number | null) => void;
  stats?: RouteStats;
}

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as RoutePoint;
    return (
      <div className="bg-white text-[#1A1A1A] border border-[#E1EDDA] p-2.5 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-xs">
        <p className="font-semibold mb-1">Distancia: {data.distance.toFixed(1)} km</p>
        <p className="text-[#4A7A30] font-medium">Altitud: {data.elevation.toFixed(0)} m</p>
        <p className="text-[#757575] capitalize">Terreno: {data.surface}</p>
      </div>
    );
  }
  return null;
};

export function ProfileChart({ routePoints, onHover, stats }: ProfileChartProps) {
  if (!routePoints || routePoints.length === 0) {
    return (
      <div className="w-full h-48 bg-white flex items-center justify-center text-[#757575] border-t border-[#E1EDDA] flex-shrink-0 z-10">
        Comienza a trazar una ruta para ver el perfil de elevación
      </div>
    );
  }

  // Find min and max elevation to scale Y axis nicely
  const minElev = Math.min(...routePoints.map(p => p.elevation));
  const maxElev = Math.max(...routePoints.map(p => p.elevation));
  const yDomain = [Math.max(0, Math.floor(minElev - 50)), Math.ceil(maxElev + 50)];

  return (
    <div className="w-full h-auto bg-white p-4 border-t border-[#E1EDDA] z-10 flex-shrink-0 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[#1A1A1A] text-sm font-semibold">Perfil de Elevación</h3>
      </div>
      
      {/* Mobile Compact Stats */}
      {stats && (
        <div className="flex md:hidden overflow-x-auto scrollbar-hide items-center gap-6 pb-3 mb-1 border-b border-[#E1EDDA]/50 text-sm">
            <div className="flex flex-col flex-shrink-0">
              <span className="text-[10px] text-[#757575] flex items-center"><RouteIcon className="h-3 w-3 mr-1 text-[#6B9E50]" /> Distancia</span>
              <span className="font-bold text-[#1A1A1A] text-base">{stats.totalDistance.toFixed(1)}<span className="text-[10px] font-normal text-[#757575] ml-0.5">km</span></span>
            </div>
            <div className="flex flex-col flex-shrink-0">
              <span className="text-[10px] text-[#757575] flex items-center"><Mountain className="h-3 w-3 mr-1 text-[#6B9E50]" /> Desnivel</span>
              <span className="font-bold text-[#1A1A1A] text-base">+{Math.round(stats.elevationGain)}<span className="text-[10px] font-normal text-[#757575] ml-0.5">m</span></span>
            </div>
            <div className="flex flex-col flex-shrink-0">
              <span className="text-[10px] text-[#757575] flex items-center"><Clock className="h-3 w-3 mr-1 text-[#D96A27]" /> Tiempo</span>
              <span className="font-bold text-[#4A7A30] text-base">{Math.floor(stats.estimatedTime / 60) > 0 ? `${Math.floor(stats.estimatedTime / 60)}h ` : ""}{Math.round(stats.estimatedTime % 60)}m</span>
            </div>
            <div className="flex flex-col flex-shrink-0">
              <span className="text-[10px] text-[#757575] flex items-center"><Droplets className="h-3 w-3 mr-1 text-[#4A7A30]" /> Agua</span>
              <span className="font-bold text-[#4A7A30] text-base">{((500 + Math.floor(stats.elevationGain / 500) * 100) * (stats.estimatedTime / 60) / 1000).toFixed(1)}<span className="text-[10px] font-normal text-[#757575] ml-0.5">L</span></span>
            </div>
            <div className="flex flex-col flex-shrink-0">
              <span className="text-[10px] text-[#757575] flex items-center"><Flame className="h-3 w-3 mr-1 text-[#D96A27]" /> Energía</span>
              <span className="font-bold text-[#D96A27] text-base">{Math.round(60 * (stats.estimatedTime / 60))}<span className="text-[10px] font-normal text-[#757575] ml-0.5">g</span></span>
            </div>
        </div>
      )}

      <div className="w-full h-32 sm:h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={routePoints}
            margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
            onMouseMove={(e: any) => {
              if (e && e.activeTooltipIndex !== undefined && onHover) {
                onHover(e.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => {
              if (onHover) onHover(null);
            }}
          >
            <defs>
              <linearGradient id="colorElevation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4A7A30" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4A7A30" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E1EDDA" vertical={false} />
            <XAxis 
              dataKey="distance" 
              tick={{ fill: "#757575", fontSize: 10 }}
              tickFormatter={(val) => `${val.toFixed(1)}km`}
              stroke="#E1EDDA"
            />
            <YAxis 
              domain={yDomain} 
              tick={{ fill: "#757575", fontSize: 10 }}
              tickFormatter={(val) => `${val}m`}
              stroke="#E1EDDA"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="elevation"
              stroke="#4A7A30"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorElevation)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
