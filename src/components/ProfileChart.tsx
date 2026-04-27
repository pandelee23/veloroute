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
import { RoutePoint } from "@/types/route";

interface ProfileChartProps {
  routePoints: RoutePoint[];
  onHover?: (index: number | null) => void;
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

export function ProfileChart({ routePoints, onHover }: ProfileChartProps) {
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
    <div className="w-full h-48 bg-white p-4 border-t border-[#E1EDDA] z-10 flex-shrink-0">
      <h3 className="text-[#1A1A1A] text-sm font-semibold mb-2">Perfil de Elevación</h3>
      <div className="w-full h-32">
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
