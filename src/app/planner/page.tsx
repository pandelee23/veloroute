"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { DataPanel } from "@/components/DataPanel";
import { ProfileChart } from "@/components/ProfileChart";
import { ExportButton } from "@/components/ExportButton";
import { SaveRouteButton } from "@/components/SaveRouteButton";
import { RoutePoint, RouteStats } from "@/types/route";
import { Climb } from "@/utils/climbDetection";
import { WaterFountain } from "@/services/overpassService";
import { Navbar } from "@/components/Navbar";

// Dynamic import with SSR disabled is required for React-Leaflet
const DynamicMapLeaflet = dynamic(
  () => import("@/components/MapLeaflet"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#F9F7F2] flex items-center justify-center text-[#757575]">Cargando Mapa...</div> }
);

export default function Home() {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [climbs, setClimbs] = useState<Climb[]>([]);
  const [fountains, setFountains] = useState<WaterFountain[]>([]);

  // Calculate dynamic stats based on route points from OSRM
  const currentStats: RouteStats = {
    totalDistance: routePoints.length > 0 ? routePoints[routePoints.length - 1].distance : 0,
    elevationGain: routePoints.reduce((acc, curr, idx, arr) => {
      if (idx === 0) return acc;
      const prev = arr[idx - 1];
      const diff = curr.elevation - prev.elevation;
      return diff > 0 ? acc + diff : acc;
    }, 0),
    // Rough estimate: 15 km/h avg speed for intermediate user + extra time for elevation (e.g. 1 min per 10m elev)
    estimatedTime: routePoints.length > 0 ? 
      ((routePoints[routePoints.length - 1].distance / 15) * 60) + 
      ((routePoints.reduce((acc, curr, idx, arr) => idx > 0 && curr.elevation > arr[idx - 1].elevation ? acc + (curr.elevation - arr[idx - 1].elevation) : acc, 0)) / 10) : 0,
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#F9F7F2] overflow-hidden relative font-sans">
      {/* Navbar compartido con auth */}
      <div className="relative z-20">
        <Navbar>
          <div className="flex items-center space-x-2">
            <SaveRouteButton routePoints={routePoints} stats={currentStats} />
            <ExportButton routePoints={routePoints} />
          </div>
        </Navbar>
      </div>

      {/* Área del mapa interactivo (Carga dinámica SSR: false) */}
      <div className="flex-1 relative w-full overflow-hidden">
        <DynamicMapLeaflet 
          onRouteUpdate={setRoutePoints} 
          onClimbsDetected={setClimbs}
          onFountainsLoaded={setFountains}
          hoveredPointIndex={hoveredPointIndex} 
        />
        
        {/* Panel lateral superpuesto */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <DataPanel stats={currentStats} fountains={fountains} />
          </div>
        </div>
      </div>

      {/* Gráfico de perfil anclado abajo */}
      <div className="z-20">
        <ProfileChart 
          routePoints={routePoints} 
          onHover={setHoveredPointIndex}
        />
      </div>
    </main>
  );
}
