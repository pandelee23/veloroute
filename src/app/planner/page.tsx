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
  const [showDataPanel, setShowDataPanel] = useState(true);
  const [showProfile, setShowProfile] = useState(true);

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
        
        {/* Panel lateral superpuesto - Toggleable on mobile */}
        <div className={`absolute top-4 left-4 z-20 transition-all duration-300 ${showDataPanel ? 'translate-x-0 opacity-100' : '-translate-x-[calc(100%+16px)] opacity-0'}`}>
          <DataPanel stats={currentStats} fountains={fountains} />
        </div>

        {/* Controls toggles (only visible/useful on mobile or for cleaning view) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col space-y-2">
          <button 
            onClick={() => setShowDataPanel(!showDataPanel)}
            className="bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg border border-[#E1EDDA] text-[#4A7A30] hover:bg-white transition-all"
            title={showDataPanel ? "Ocultar estadísticas" : "Mostrar estadísticas"}
          >
            <div className={`transition-transform duration-300 ${showDataPanel ? 'rotate-180' : 'rotate-0'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </div>
          </button>
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg border border-[#E1EDDA] text-[#4A7A30] hover:bg-white transition-all"
            title={showProfile ? "Ocultar perfil" : "Mostrar perfil"}
          >
            <div className={`transition-transform duration-300 ${showProfile ? 'rotate-180' : 'rotate-0'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </button>
        </div>
      </div>

      {/* Gráfico de perfil anclado abajo - Toggleable */}
      <div className={`z-20 transition-all duration-300 ${showProfile ? 'h-auto opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
        <ProfileChart 
          routePoints={routePoints} 
          onHover={setHoveredPointIndex}
        />
      </div>
    </main>
  );
}
